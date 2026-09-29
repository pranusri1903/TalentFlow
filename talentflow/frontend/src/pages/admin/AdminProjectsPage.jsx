import { FolderKanban, Plus, ShieldCheck, Users, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'

import Button from '../../components/ui/Button'
import Card from '../../components/ui/Card'
import EmptyState from '../../components/ui/EmptyState'
import PageHeader from '../../components/ui/PageHeader'
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
    <div>
      <PageHeader
        title="Projects"
        subtitle="Every team, its manager, and its progress"
        action={
          <Button onClick={() => setShowForm((s) => !s)}>
            {showForm ? <X size={16} /> : <Plus size={16} />}
            {showForm ? 'Cancel' : 'New project'}
          </Button>
        }
      />

      {showForm && (
        <Card className="mb-6">
          <form onSubmit={handleCreate} className="space-y-3">
            <input
              required
              placeholder="Project name"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <textarea
              placeholder="Description"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              rows={3}
              className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <select
              value={form.manager}
              onChange={(e) => setForm({ ...form, manager: e.target.value })}
              className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">No manager assigned yet</option>
              {managers.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.profile.full_name || m.profile.email}
                </option>
              ))}
            </select>
            <Button disabled={saving}>{saving ? 'Creating...' : 'Create project'}</Button>
          </form>
        </Card>
      )}

      {projects.length === 0 ? (
        <EmptyState icon={FolderKanban} title="No projects yet" description="Create one to start assigning teams and tasks" />
      ) : (
        <div className="grid sm:grid-cols-2 gap-4">
          {projects.map((project) => (
            <Link
              key={project.id}
              to={`/admin/projects/${project.id}`}
              className="block bg-white border border-slate-200 rounded-2xl shadow-sm shadow-slate-200/60 p-5 hover:shadow-md hover:border-indigo-200 transition"
            >
              <div className="flex items-center gap-2 text-indigo-600 mb-2">
                <FolderKanban size={18} />
                <p className="font-semibold text-slate-900">{project.name}</p>
              </div>
              <p className="text-sm text-slate-500 flex items-center gap-1.5">
                <Users size={14} /> {project.member_names.join(', ') || 'No members yet'}
              </p>
              <p className="text-xs text-slate-400 mt-1.5 flex items-center gap-1.5">
                <ShieldCheck size={13} /> Manager: {project.manager_name || 'Unassigned'}
              </p>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
