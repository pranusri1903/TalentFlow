import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'

import { api } from '../../lib/api'

export default function AdminProjectsPage() {
  const [projects, setProjects] = useState([])
  const [managers, setManagers] = useState([])
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ name: '', description: '', manager: '' })
  const [saving, setSaving] = useState(false)

  const loadProjects = () => api.get('/projects/projects/').then(({ data }) => setProjects(data))

  useEffect(() => {
    loadProjects()
    api.get('/employees/').then(({ data }) => setManagers(data.filter((e) => e.is_manager)))
  }, [])

  const handleCreate = async (e) => {
    e.preventDefault()
    setSaving(true)
    await api.post('/projects/projects/', { ...form, manager: form.manager || null })
    setForm({ name: '', description: '', manager: '' })
    setShowForm(false)
    setSaving(false)
    loadProjects()
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900">Projects</h1>
        <button
          onClick={() => setShowForm((s) => !s)}
          className="bg-indigo-600 text-white rounded-lg px-4 py-2 font-medium hover:bg-indigo-700"
        >
          {showForm ? 'Cancel' : '+ New project'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleCreate} className="bg-white border border-slate-200 rounded-xl p-6 mt-6 space-y-3">
          <input
            required
            placeholder="Project name"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            className="w-full border border-slate-300 rounded-lg px-3 py-2"
          />
          <textarea
            placeholder="Description"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            rows={3}
            className="w-full border border-slate-300 rounded-lg px-3 py-2"
          />
          <select
            value={form.manager}
            onChange={(e) => setForm({ ...form, manager: e.target.value })}
            className="w-full border border-slate-300 rounded-lg px-3 py-2"
          >
            <option value="">No manager assigned yet</option>
            {managers.map((m) => (
              <option key={m.id} value={m.id}>
                {m.profile.full_name || m.profile.email}
              </option>
            ))}
          </select>
          <button disabled={saving} className="bg-indigo-600 text-white rounded-lg px-5 py-2.5 font-medium hover:bg-indigo-700 disabled:opacity-50">
            {saving ? 'Creating...' : 'Create project'}
          </button>
        </form>
      )}

      <div className="mt-6 space-y-3">
        {projects.map((project) => (
          <Link
            key={project.id}
            to={`/admin/projects/${project.id}`}
            className="block bg-white border border-slate-200 rounded-xl p-4 hover:shadow-md transition"
          >
            <p className="font-semibold text-slate-900">{project.name}</p>
            <p className="text-sm text-slate-500 mt-1">{project.member_names.join(', ') || 'No members yet'}</p>
            <p className="text-xs text-slate-400 mt-1">
              Manager: {project.manager_name || 'Unassigned'}
            </p>
          </Link>
        ))}
      </div>
    </div>
  )
}
