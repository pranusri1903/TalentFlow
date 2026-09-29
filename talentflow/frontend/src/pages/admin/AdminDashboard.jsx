import { Ban, CheckCircle2, Plus, Search, UserRound, X } from 'lucide-react'
import { useEffect, useState } from 'react'

import DesignationField from '../../components/DesignationField'
import Button from '../../components/ui/Button'
import Card from '../../components/ui/Card'
import PageHeader from '../../components/ui/PageHeader'
import { DEPARTMENTS, departmentLabel } from '../../lib/departments'
import { api } from '../../lib/api'

const EMPTY_FORM = { email: '', full_name: '', account_type: 'staff', department: 'development', job_title: '' }

function UserRow({ user, managers, updateUser, updateEmployee }) {
  return (
    <div className="bg-white border border-slate-200 rounded-2xl shadow-sm shadow-slate-200/60 p-4 flex items-center justify-between gap-3 flex-wrap">
      <div className="flex items-center gap-3 min-w-0">
        <div className="w-9 h-9 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center shrink-0">
          <UserRound size={18} />
        </div>
        <div className="min-w-0">
          <p className="font-semibold text-slate-900 truncate">{user.full_name || user.email}</p>
          <p className="text-xs text-slate-400 truncate">
            {user.email}
            {user.employee_code && ` · ${user.employee_code}`}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-3 flex-wrap">
        {user.role === 'candidate' ? (
          <span
            title="Candidates become employees/HR by being hired through Recruitment, not by admin promotion."
            className="text-sm text-slate-400 border border-slate-200 rounded-lg px-2 py-1"
          >
            candidate
          </span>
        ) : (
          <>
            <select
              value={user.role === 'admin' ? 'admin' : 'staff'}
              onChange={(e) => updateUser(user.id, { account_type: e.target.value })}
              className="border border-slate-300 rounded-lg px-2 py-1 text-sm"
            >
              <option value="staff">Staff</option>
              <option value="admin">Admin</option>
            </select>
            {user.role !== 'admin' && (
              <>
                <select
                  value={user.department || ''}
                  onChange={(e) => updateUser(user.id, { department: e.target.value })}
                  className="border border-slate-300 rounded-lg px-2 py-1 text-sm"
                >
                  <option value="">Department</option>
                  {DEPARTMENTS.map((d) => (
                    <option key={d.value} value={d.value}>
                      {d.label}
                    </option>
                  ))}
                </select>
                {user.department && (
                  <DesignationField
                    department={user.department}
                    value={user.job_title || ''}
                    onChange={(job_title) => updateUser(user.id, { job_title })}
                  />
                )}
                {user.is_manager && (
                  <span className="text-xs bg-indigo-50 text-indigo-700 px-2 py-1 rounded-full font-medium">Manager</span>
                )}
                <select
                  value={user.manager_id || ''}
                  onChange={(e) => updateEmployee(user.employee_id, { manager: e.target.value || null })}
                  className="border border-slate-300 rounded-lg px-2 py-1 text-sm"
                >
                  <option value="">Reports to: none</option>
                  {managers
                    .filter((m) => m.employee_id !== user.employee_id)
                    .map((m) => (
                      <option key={m.employee_id} value={m.employee_id}>
                        Reports to: {m.full_name || m.email}
                      </option>
                    ))}
                </select>
              </>
            )}
          </>
        )}

        <button
          onClick={() => updateUser(user.id, { is_active: !user.is_active })}
          className={`flex items-center gap-1.5 text-sm font-medium ${
            user.is_active ? 'text-red-600 hover:text-red-700' : 'text-green-600 hover:text-green-700'
          }`}
        >
          {user.is_active ? <Ban size={14} /> : <CheckCircle2 size={14} />}
          {user.is_active ? 'Deactivate' : 'Activate'}
        </button>
      </div>
    </div>
  )
}

export default function AdminDashboard() {
  const [users, setUsers] = useState([])
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState(EMPTY_FORM)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [groupByDept, setGroupByDept] = useState(false)

  const loadUsers = () => api.get('/accounts/users/').then(({ data }) => setUsers(data))

  useEffect(() => {
    loadUsers()
  }, [])

  const handleCreate = async (e) => {
    e.preventDefault()
    setSaving(true)
    setError('')
    try {
      const { data } = await api.post('/accounts/users/', form)
      setForm(EMPTY_FORM)
      setShowForm(false)
      setUsers((us) => [data, ...us])
    } catch (err) {
      setError(err.response?.data?.detail || 'Could not create user.')
    } finally {
      setSaving(false)
    }
  }

  const updateUser = async (id, patch) => {
    try {
      const { data } = await api.patch(`/accounts/users/${id}/`, patch)
      setUsers((us) => us.map((u) => (u.id === id ? data : u)))
    } catch (err) {
      alert(err.response?.data?.detail || 'Could not update user.')
    }
  }

  const updateEmployee = async (employeeId, patch) => {
    try {
      const { data } = await api.patch(`/employees/${employeeId}/`, patch)
      setUsers((us) => us.map((u) => (u.employee_id === employeeId ? { ...u, manager_id: data.manager } : u)))
    } catch (err) {
      alert(err.response?.data?.manager?.[0] || err.response?.data?.detail || 'Could not update employee.')
    }
  }

  const managers = users.filter((u) => u.is_manager)

  const q = search.trim().toLowerCase()
  const filteredUsers = users.filter(
    (u) => !q || u.full_name?.toLowerCase().includes(q) || u.email.toLowerCase().includes(q) || u.employee_code?.toLowerCase().includes(q)
  )

  const groupedByDept = groupByDept
    ? Object.entries(
        filteredUsers.reduce((acc, u) => {
          const key = u.department ? departmentLabel(u.department) : 'No department'
          acc[key] = acc[key] || []
          acc[key].push(u)
          return acc
        }, {})
      ).sort(([a], [b]) => a.localeCompare(b))
    : null

  return (
    <div>
      <PageHeader
        title="Users"
        subtitle="Manage accounts, roles, and reporting lines"
        action={
          <Button onClick={() => setShowForm((s) => !s)}>
            {showForm ? <X size={16} /> : <Plus size={16} />}
            {showForm ? 'Cancel' : 'Create account'}
          </Button>
        }
      />

      {showForm && (
        <Card className="mb-6">
          <form onSubmit={handleCreate} className="space-y-3">
            <p className="text-sm text-slate-500">
              A temporary password will be emailed to this address. They'll be asked to set a new one on first login.
            </p>
            <input
              required
              type="email"
              placeholder="Email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <input
              placeholder="Full name"
              value={form.full_name}
              onChange={(e) => setForm({ ...form, full_name: e.target.value })}
              className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <select
              value={form.account_type}
              onChange={(e) => setForm({ ...form, account_type: e.target.value })}
              className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="staff">Staff</option>
              <option value="admin">Admin</option>
            </select>
            {form.account_type === 'staff' && (
              <div className="flex items-center gap-2">
                <select
                  value={form.department}
                  onChange={(e) => setForm({ ...form, department: e.target.value, job_title: '' })}
                  className="border border-slate-300 rounded-lg px-3 py-2"
                >
                  {DEPARTMENTS.map((d) => (
                    <option key={d.value} value={d.value}>
                      {d.label}
                    </option>
                  ))}
                </select>
                <DesignationField
                  department={form.department}
                  value={form.job_title}
                  onChange={(job_title) => setForm({ ...form, job_title })}
                />
              </div>
            )}
            {error && <p className="text-red-600 text-sm">{error}</p>}
            <Button disabled={saving}>{saving ? 'Creating...' : 'Create account'}</Button>
          </form>
        </Card>
      )}

      <div className="flex flex-wrap items-center gap-3 mb-4">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            placeholder="Search by name, email, or employee ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full border border-slate-300 rounded-lg pl-8 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
        <label className="flex items-center gap-1.5 text-sm text-slate-600">
          <input type="checkbox" checked={groupByDept} onChange={(e) => setGroupByDept(e.target.checked)} />
          Group by department
        </label>
      </div>

      {groupedByDept ? (
        <div className="space-y-6">
          {groupedByDept.map(([dept, deptUsers]) => (
            <div key={dept}>
              <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
                {dept} <span className="text-slate-400 font-normal normal-case">({deptUsers.length})</span>
              </h3>
              <div className="space-y-3">
                {deptUsers.map((user) => (
                  <UserRow key={user.id} user={user} managers={managers} updateUser={updateUser} updateEmployee={updateEmployee} />
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-3">
          {filteredUsers.map((user) => (
            <UserRow key={user.id} user={user} managers={managers} updateUser={updateUser} updateEmployee={updateEmployee} />
          ))}
        </div>
      )}
    </div>
  )
}
