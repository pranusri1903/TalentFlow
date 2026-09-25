import { useEffect, useState } from 'react'

import { api } from '../../lib/api'

const ROLES = ['hr', 'employee', 'admin']

export default function AdminDashboard() {
  const [users, setUsers] = useState([])
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ email: '', full_name: '', role: 'employee' })
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
      setForm({ email: '', full_name: '', role: 'employee' })
      setShowForm(false)
      loadUsers()
    } catch (err) {
      setError(err.response?.data?.detail || 'Could not create user.')
    } finally {
      setSaving(false)
    }
  }

  const updateUser = async (id, patch) => {
    await api.patch(`/accounts/users/${id}/`, patch)
    loadUsers()
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
            value={form.role}
            onChange={(e) => setForm({ ...form, role: e.target.value })}
            className="w-full border border-slate-300 rounded-lg px-3 py-2"
          >
            {ROLES.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
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
            <div className="flex items-center gap-3">
              <select
                value={user.role}
                onChange={(e) => updateUser(user.id, { role: e.target.value })}
                className="border border-slate-300 rounded-lg px-2 py-1 text-sm"
              >
                {['candidate', ...ROLES].map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
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
