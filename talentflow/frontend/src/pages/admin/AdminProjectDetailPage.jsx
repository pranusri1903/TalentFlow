import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'

import StatusBadge from '../../components/StatusBadge'
import { api } from '../../lib/api'

const TASK_STATUSES = ['todo', 'in_progress', 'review', 'done']

export default function AdminProjectDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [project, setProject] = useState(null)
  const [employees, setEmployees] = useState([])
  const [tasks, setTasks] = useState([])
  const [taskForm, setTaskForm] = useState({ title: '', description: '', assignee: '' })

  const loadProject = () => api.get(`/projects/projects/${id}/`).then(({ data }) => setProject(data))
  const loadTasks = () => api.get(`/projects/projects/${id}/tasks/`).then(({ data }) => setTasks(data))

  useEffect(() => {
    loadProject()
    loadTasks()
    api.get('/employees/').then(({ data }) => setEmployees(data))
  }, [id])

  const toggleMember = async (employeeId) => {
    const members = project.members.includes(employeeId)
      ? project.members.filter((m) => m !== employeeId)
      : [...project.members, employeeId]
    await api.patch(`/projects/projects/${id}/`, { members })
    loadProject()
  }

  const createTask = async (e) => {
    e.preventDefault()
    await api.post(`/projects/projects/${id}/tasks/`, {
      ...taskForm,
      assignee: taskForm.assignee || null,
    })
    setTaskForm({ title: '', description: '', assignee: '' })
    loadTasks()
  }

  const updateTaskStatus = async (taskId, status) => {
    await api.patch(`/projects/tasks/${taskId}/status/`, { status })
    loadTasks()
  }

  if (!project) return <p className="p-8 text-center text-slate-500">Loading...</p>

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
      <button onClick={() => navigate(-1)} className="text-sm text-slate-500 hover:text-indigo-600">
        ← Back to projects
      </button>

      <div className="bg-white border border-slate-200 rounded-xl p-6">
        <h1 className="text-2xl font-bold text-slate-900">{project.name}</h1>
        {project.description && <p className="text-slate-500 mt-1">{project.description}</p>}
      </div>

      <div className="bg-white border border-slate-200 rounded-xl p-6">
        <h2 className="font-semibold text-slate-900 mb-3">Team members</h2>
        <div className="flex flex-wrap gap-2">
          {employees.map((emp) => {
            const selected = project.members.includes(emp.id)
            return (
              <button
                key={emp.id}
                onClick={() => toggleMember(emp.id)}
                className={`text-sm px-3 py-1.5 rounded-full border ${
                  selected ? 'bg-indigo-600 text-white border-indigo-600' : 'border-slate-300 text-slate-600'
                }`}
              >
                {emp.profile.full_name || emp.profile.email}
              </button>
            )
          })}
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl p-6">
        <h2 className="font-semibold text-slate-900 mb-3">Tasks</h2>
        <form onSubmit={createTask} className="grid sm:grid-cols-4 gap-2 mb-4">
          <input
            required
            placeholder="Task title"
            value={taskForm.title}
            onChange={(e) => setTaskForm({ ...taskForm, title: e.target.value })}
            className="border border-slate-300 rounded-lg px-3 py-2 sm:col-span-2"
          />
          <select
            value={taskForm.assignee}
            onChange={(e) => setTaskForm({ ...taskForm, assignee: e.target.value })}
            className="border border-slate-300 rounded-lg px-3 py-2"
          >
            <option value="">Unassigned</option>
            {employees
              .filter((emp) => project.members.includes(emp.id))
              .map((emp) => (
                <option key={emp.id} value={emp.id}>
                  {emp.profile.full_name || emp.profile.email}
                </option>
              ))}
          </select>
          <button className="bg-indigo-600 text-white rounded-lg px-4 py-2 font-medium hover:bg-indigo-700">
            Add task
          </button>
        </form>

        <div className="space-y-3">
          {tasks.map((task) => (
            <div key={task.id} className="flex items-center justify-between gap-3 border-b border-slate-100 pb-3 last:border-0">
              <div>
                <p className="font-medium text-slate-900">{task.title}</p>
                <p className="text-xs text-slate-400">{task.assignee_name || 'Unassigned'}</p>
              </div>
              <div className="flex items-center gap-2">
                <StatusBadge status={task.status} />
                <select
                  value={task.status}
                  onChange={(e) => updateTaskStatus(task.id, e.target.value)}
                  className="border border-slate-300 rounded-lg px-2 py-1 text-sm"
                >
                  {TASK_STATUSES.map((s) => (
                    <option key={s} value={s}>
                      {s.replace('_', ' ')}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
