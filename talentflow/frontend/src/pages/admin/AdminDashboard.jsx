import { useEffect, useState } from 'react'

import { DEPARTMENTS } from '../../lib/departments'
import { api } from '../../lib/api'

const DESIGNATIONS_BY_DEPARTMENT = {
  development: ['SDE 1', 'SDE 2', 'SDE 3', 'Manager'],
  designing: ['Junior Designer', 'Senior Designer', 'Lead Designer', 'Manager'],
  hr: ['Junior HR', 'Senior HR', 'HR Manager'],
  sales: ['Sales Support', 'Associate Sales Manager', 'Regional Head'],
  other: [],
}

function DesignationField({ department, value, onChange }) {
  const presets = DESIGNATIONS_BY_DEPARTMENT[department] || []
  const isPreset = presets.includes(value)
  const [showCustom, setShowCustom] = useState(presets.length === 0 || (!!value && !isPreset))

  if (presets.length === 0) {
    return (
      <input
        placeholder="Designation"
        defaultValue={value}
        onBlur={(e) => onChange(e.target.value)}
        className="border border-slate-300 rounded-lg px-2 py-1 text-sm w-40"
      />
    )
  }

  return (
    <div className="flex items-center gap-2">
      <select
        value={showCustom ? 'Other' : value || ''}
        onChange={(e) => {
          if (e.target.value === 'Other') {
            setShowCustom(true)
          } else {
            setShowCustom(false)
            onChange(e.target.value)
          }
        }}
        className="border border-slate-300 rounded-lg px-2 py-1 text-sm"
      >
        <option value="">Designation</option>
        {presets.map((d) => (
          <option key={d} value={d}>
            {d}
          </option>
        ))}
        <option value="Other">Other</option>
      </select>
      {showCustom && (
        <input
          placeholder="Custom designation"
          defaultValue={isPreset ? '' : value}
          onBlur={(e) => onChange(e.target.value)}
          className="border border-slate-300 rounded-lg px-2 py-1 text-sm w-32"
        />
      )}
    </div>
  )
}

const EMPTY_FORM = { email: '', full_name: '', account_type: 'staff', department: 'development', job_title: '' }

export default function AdminDashboard() {
  const [users, setUsers] = useState([])
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState(EMPTY_FORM)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const loadUsers = () => api.get('/accounts/users/').then(({ data }) => setUsers(data))

  useEffect(() => {
    loadUsers()
  }, [])

  const handleCreate = async (e) => {
    e.preventDefault()
    setSaving(true)
    setError('')
    try {
      await api.post('/accounts/users/', form)
      setForm(EMPTY_FORM)
      setShowForm(false)
      loadUsers()
    } catch (err) {
      setError(err.response?.data?.detail || 'Could not create user.')
    } finally {
      setSaving(false)
    }
  }

  const updateUser = async (id, patch) => {
    try {
      await api.patch(`/accounts/users/${id}/`, patch)
      loadUsers()
    } catch (err) {
      alert(err.response?.data?.detail || 'Could not update user.')
    }
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900">Users</h1>
        <button
          onClick={() => setShowForm((s) => !s)}
          className="bg-indigo-600 text-white rounded-lg px-4 py-2 font-medium hover:bg-indigo-700"
        >
          {showForm ? 'Cancel' : '+ Create account'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleCreate} className="bg-white border border-slate-200 rounded-xl p-6 mt-6 space-y-3">
          <p className="text-sm text-slate-500">
            A temporary password will be emailed to this address. They'll be asked to set a new one on first login.
          </p>
          <input
            required
            type="email"
            placeholder="Email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            className="w-full border border-slate-300 rounded-lg px-3 py-2"
          />
          <input
            placeholder="Full name"
            value={form.full_name}
            onChange={(e) => setForm({ ...form, full_name: e.target.value })}
            className="w-full border border-slate-300 rounded-lg px-3 py-2"
          />
          <select
            value={form.account_type}
            onChange={(e) => setForm({ ...form, account_type: e.target.value })}
            className="w-full border border-slate-300 rounded-lg px-3 py-2"
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
          <button disabled={saving} className="bg-indigo-600 text-white rounded-lg px-5 py-2.5 font-medium hover:bg-indigo-700 disabled:opacity-50">
            {saving ? 'Creating...' : 'Create account'}
          </button>
        </form>
      )}

      <div className="mt-6 space-y-3">
        {users.map((user) => (
          <div key={user.id} className="bg-white border border-slate-200 rounded-xl p-4 flex items-center justify-between gap-3 flex-wrap">
            <div>
              <p className="font-semibold text-slate-900">{user.full_name || user.email}</p>
              <p className="text-xs text-slate-400">{user.email}</p>
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
                    </>
                  )}
                </>
              )}

              <button
                onClick={() => updateUser(user.id, { is_active: !user.is_active })}
                className={`text-sm font-medium ${user.is_active ? 'text-red-600' : 'text-green-600'}`}
              >
                {user.is_active ? 'Deactivate' : 'Activate'}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
