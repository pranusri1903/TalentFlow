import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'

import KanbanBoard from '../../components/KanbanBoard'
import TaskStatusPieChart from '../../components/TaskStatusPieChart'
import { departmentLabel } from '../../lib/departments'
import { api } from '../../lib/api'

export default function AdminProjectDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [project, setProject] = useState(null)
  const [employees, setEmployees] = useState([])
  const [assignedElsewhere, setAssignedElsewhere] = useState(new Set())
  const [tasks, setTasks] = useState([])
  const [taskForm, setTaskForm] = useState({ title: '', description: '', assignees: [] })
  const [showAddMember, setShowAddMember] = useState(false)

  const loadProject = () => api.get(`/projects/projects/${id}/`).then(({ data }) => setProject(data))
  const loadTasks = () => api.get(`/projects/projects/${id}/tasks/`).then(({ data }) => setTasks(data))

  const loadAssignedElsewhere = () =>
    api.get('/projects/projects/').then(({ data }) => {
      const ids = data.filter((p) => String(p.id) !== id).flatMap((p) => p.members)
      setAssignedElsewhere(new Set(ids))
    })

  useEffect(() => {
    loadProject()
    loadTasks()
    loadAssignedElsewhere()
    api.get('/employees/').then(({ data }) => setEmployees(data))
  }, [id])

  const toggleMember = async (employeeId) => {
    const members = project.members.includes(employeeId)
      ? project.members.filter((m) => m !== employeeId)
      : [...project.members, employeeId]
    await api.patch(`/projects/projects/${id}/`, { members })
    loadProject()
    loadAssignedElsewhere()
  }

  const createTask = async (e) => {
    e.preventDefault()
    await api.post(`/projects/projects/${id}/tasks/`, taskForm)
    setTaskForm({ title: '', description: '', assignees: [] })
    loadTasks()
  }

  const toggleTaskAssignee = (employeeId) => {
    setTaskForm((f) => ({
      ...f,
      assignees: f.assignees.includes(employeeId)
        ? f.assignees.filter((a) => a !== employeeId)
        : [...f.assignees, employeeId],
    }))
  }

  const updateTaskStatus = async (taskId, status) => {
    await api.patch(`/projects/tasks/${taskId}/status/`, { status })
    loadTasks()
  }

  if (!project) return <p className="p-8 text-center text-slate-500">Loading...</p>

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-6">
      <button onClick={() => navigate(-1)} className="text-sm text-slate-500 hover:text-indigo-600">
        ← Back to projects
      </button>

      <div className="bg-white border border-slate-200 rounded-xl p-6">
        <h1 className="text-2xl font-bold text-slate-900">{project.name}</h1>
        {project.description && <p className="text-slate-500 mt-1">{project.description}</p>}
      </div>

      <div className="bg-white border border-slate-200 rounded-xl p-6">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold text-slate-900">Team members</h2>
          <button
            onClick={() => setShowAddMember((s) => !s)}
            className="text-sm bg-indigo-600 text-white rounded-lg px-3 py-1.5 font-medium hover:bg-indigo-700"
          >
            {showAddMember ? 'Close' : '+ Add member'}
          </button>
        </div>

        {project.members.length === 0 ? (
          <p className="text-sm text-slate-400">No members yet.</p>
        ) : (
          <div className="space-y-2">
            {employees
              .filter((emp) => project.members.includes(emp.id))
              .map((emp) => (
                <div key={emp.id} className="flex items-center justify-between border-b border-slate-100 pb-2 last:border-0">
                  <div>
                    <p className="text-sm font-medium text-slate-900">{emp.profile.full_name || emp.profile.email}</p>
                    <p className="text-xs text-slate-400">
                      {departmentLabel(emp.department) || 'No department'}
                      {emp.job_title && ` · ${emp.job_title}`}
                    </p>
                  </div>
                  <button onClick={() => toggleMember(emp.id)} className="text-sm text-red-600 font-medium">
                    Remove
                  </button>
                </div>
              ))}
          </div>
        )}

        {showAddMember && (
          <div className="mt-4 border-t border-slate-200 pt-4">
            <p className="text-xs text-slate-400 mb-3">People not currently on any project team:</p>
            {employees.filter((emp) => !project.members.includes(emp.id) && !assignedElsewhere.has(emp.id)).length === 0 ? (
              <p className="text-sm text-slate-400">Everyone is already assigned to a team.</p>
            ) : (
              <div className="space-y-2">
                {employees
                  .filter((emp) => !project.members.includes(emp.id) && !assignedElsewhere.has(emp.id))
                  .map((emp) => (
                    <div key={emp.id} className="flex items-center justify-between border-b border-slate-100 pb-2 last:border-0">
                      <div>
                        <p className="text-sm font-medium text-slate-900">{emp.profile.full_name || emp.profile.email}</p>
                        <p className="text-xs text-slate-400">
                          {departmentLabel(emp.department) || 'No department'}
                          {emp.job_title && ` · ${emp.job_title}`}
                        </p>
                      </div>
                      <button onClick={() => toggleMember(emp.id)} className="text-sm text-indigo-600 font-medium">
                        Add
                      </button>
                    </div>
                  ))}
              </div>
            )}
          </div>
        )}
      </div>

      <div className="bg-white border border-slate-200 rounded-xl p-6">
        <h2 className="font-semibold text-slate-900 mb-3">Tasks</h2>
        <form onSubmit={createTask} className="space-y-2 mb-4">
          <div className="grid sm:grid-cols-3 gap-2">
            <input
              required
              placeholder="Task title"
              value={taskForm.title}
              onChange={(e) => setTaskForm({ ...taskForm, title: e.target.value })}
              className="border border-slate-300 rounded-lg px-3 py-2 sm:col-span-2"
            />
            <button className="bg-indigo-600 text-white rounded-lg px-4 py-2 font-medium hover:bg-indigo-700">
              Add task
            </button>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs text-slate-400">Assign to:</span>
            {employees
              .filter((emp) => project.members.includes(emp.id))
              .map((emp) => {
                const selected = taskForm.assignees.includes(emp.id)
                return (
                  <button
                    type="button"
                    key={emp.id}
                    onClick={() => toggleTaskAssignee(emp.id)}
                    className={`text-xs px-2.5 py-1 rounded-full border ${
                      selected ? 'bg-indigo-600 text-white border-indigo-600' : 'border-slate-300 text-slate-600'
                    }`}
                  >
                    {emp.profile.full_name || emp.profile.email}
                  </button>
                )
              })}
          </div>
        </form>

        {tasks.length > 0 && (
          <div className="mb-4">
            <TaskStatusPieChart tasks={tasks} />
          </div>
        )}

        <KanbanBoard tasks={tasks} onStatusChange={updateTaskStatus} />
      </div>
    </div>
  )
}
