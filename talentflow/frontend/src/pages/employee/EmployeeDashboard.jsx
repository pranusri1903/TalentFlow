import { useEffect, useState } from 'react'

import KanbanBoard from '../../components/KanbanBoard'
import TaskStatusPieChart from '../../components/TaskStatusPieChart'
import { useAuth } from '../../context/AuthContext'
import { departmentLabel } from '../../lib/departments'
import { api } from '../../lib/api'

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
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-6">
      <div className="bg-white border border-slate-200 rounded-xl p-6">
        <h1 className="text-2xl font-bold text-slate-900">Welcome, {profile?.full_name || profile?.email}</h1>
        {employee ? (
          <p className="text-slate-500 mt-1">
            {employee.job_title || 'Employee'} {employee.department && `· ${departmentLabel(employee.department)}`}
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
          <>
            <div className="mb-4">
              <TaskStatusPieChart tasks={tasks} />
            </div>
            <KanbanBoard tasks={tasks} onStatusChange={updateTaskStatus} />
          </>
        )}
      </div>
    </div>
  )
}
