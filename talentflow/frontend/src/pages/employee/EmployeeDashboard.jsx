import { useEffect, useState } from 'react'

import { useAuth } from '../../context/AuthContext'
import { api } from '../../lib/api'

const TASK_STATUSES = ['todo', 'in_progress', 'review', 'done']

export default function EmployeeDashboard() {
  const { profile } = useAuth()
  const [employee, setEmployee] = useState(null)
  const [tasks, setTasks] = useState([])
  const [projects, setProjects] = useState([])

  const loadTasks = () => api.get('/projects/my-tasks/').then(({ data }) => setTasks(data))

  useEffect(() => {
    api.get('/employees/me/').then(({ data }) => setEmployee(data))
    loadTasks()
    api.get('/projects/projects/').then(({ data }) => setProjects(data))
  }, [])

  const updateTaskStatus = async (taskId, status) => {
    await api.patch(`/projects/tasks/${taskId}/status/`, { status })
    loadTasks()
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
      <div className="bg-white border border-slate-200 rounded-xl p-6">
        <h1 className="text-2xl font-bold text-slate-900">Welcome, {profile?.full_name || profile?.email}</h1>
        {employee ? (
          <p className="text-slate-500 mt-1">
            {employee.job_title || 'Employee'} {employee.department && `· ${employee.department}`}
            {employee.manager_name && ` · Reports to ${employee.manager_name}`}
          </p>
        ) : (
          <p className="text-slate-400 mt-1 text-sm">Your employee profile is being set up by admin.</p>
        )}
      </div>

      <div className="bg-white border border-slate-200 rounded-xl p-6">
        <h2 className="font-semibold text-slate-900 mb-3">My Projects</h2>
        {projects.length === 0 ? (
          <p className="text-slate-500 text-sm">You're not assigned to any project yet.</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {projects.map((p) => (
              <span key={p.id} className="bg-indigo-50 text-indigo-700 text-sm px-3 py-1 rounded-full">
                {p.name}
              </span>
            ))}
          </div>
        )}
      </div>

      <div className="bg-white border border-slate-200 rounded-xl p-6">
        <h2 className="font-semibold text-slate-900 mb-3">My Tasks</h2>
        {tasks.length === 0 ? (
          <p className="text-slate-500 text-sm">No tasks assigned yet.</p>
        ) : (
          <div className="space-y-3">
            {tasks.map((task) => (
              <div key={task.id} className="flex items-center justify-between gap-3 border-b border-slate-100 pb-3 last:border-0">
                <div>
                  <p className="font-medium text-slate-900">{task.title}</p>
                  {task.description && <p className="text-sm text-slate-500">{task.description}</p>}
                </div>
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
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
