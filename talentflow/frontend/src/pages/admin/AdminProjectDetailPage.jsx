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
  const [taskForm, setTaskForm] = useState({ title: '', description: '', assignees: [], sprint: '' })
  const [showAddMember, setShowAddMember] = useState(false)
  const [sprints, setSprints] = useState([])
  const [showSprintForm, setShowSprintForm] = useState(false)
  const [sprintForm, setSprintForm] = useState({ name: '', start_date: '', end_date: '' })
  const [sprintFilter, setSprintFilter] = useState('all')

  const loadProject = () => api.get(`/projects/projects/${id}/`).then(({ data }) => setProject(data))
  const loadTasks = () => api.get(`/projects/projects/${id}/tasks/`).then(({ data }) => setTasks(data))
  const loadSprints = () => api.get(`/projects/projects/${id}/sprints/`).then(({ data }) => setSprints(data))

  const loadAssignedElsewhere = () =>
    api.get('/projects/projects/').then(({ data }) => {
      const ids = data.filter((p) => String(p.id) !== id).flatMap((p) => p.members)
      setAssignedElsewhere(new Set(ids))
    })

  useEffect(() => {
    loadProject()
    loadTasks()
    loadSprints()
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
    await api.post(`/projects/projects/${id}/tasks/`, { ...taskForm, sprint: taskForm.sprint || null })
    setTaskForm({ title: '', description: '', assignees: [], sprint: '' })
    loadTasks()
  }

  const createSprint = async (e) => {
    e.preventDefault()
    await api.post(`/projects/projects/${id}/sprints/`, sprintForm)
    setSprintForm({ name: '', start_date: '', end_date: '' })
    setShowSprintForm(false)
    loadSprints()
  }

  const updateSprintStatus = async (sprintId, status) => {
    await api.patch(`/projects/sprints/${sprintId}/`, { status })
    loadSprints()
  }

  const deleteSprint = async (sprintId) => {
    await api.delete(`/projects/sprints/${sprintId}/`)
    loadSprints()
    loadTasks()
    if (sprintFilter === String(sprintId)) setSprintFilter('all')
  }

  const updateTaskSprint = async (taskId, sprintId) => {
    await api.patch(`/projects/tasks/${taskId}/`, { sprint: sprintId })
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

  const visibleTasks =
    sprintFilter === 'all'
      ? tasks
      : sprintFilter === 'backlog'
        ? tasks.filter((t) => !t.sprint)
        : tasks.filter((t) => String(t.sprint) === sprintFilter)

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
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold text-slate-900">Sprints</h2>
          <button
            onClick={() => setShowSprintForm((s) => !s)}
            className="text-sm bg-indigo-600 text-white rounded-lg px-3 py-1.5 font-medium hover:bg-indigo-700"
          >
            {showSprintForm ? 'Close' : '+ New sprint'}
          </button>
        </div>

        {showSprintForm && (
          <form onSubmit={createSprint} className="grid sm:grid-cols-4 gap-2 mb-4">
            <input
              required
              placeholder="Sprint name"
              value={sprintForm.name}
              onChange={(e) => setSprintForm({ ...sprintForm, name: e.target.value })}
              className="border border-slate-300 rounded-lg px-3 py-2"
            />
            <input
              required
              type="date"
              value={sprintForm.start_date}
              onChange={(e) => setSprintForm({ ...sprintForm, start_date: e.target.value })}
              className="border border-slate-300 rounded-lg px-3 py-2"
            />
            <input
              required
              type="date"
              value={sprintForm.end_date}
              onChange={(e) => setSprintForm({ ...sprintForm, end_date: e.target.value })}
              className="border border-slate-300 rounded-lg px-3 py-2"
            />
            <button className="bg-indigo-600 text-white rounded-lg px-4 py-2 font-medium hover:bg-indigo-700">
              Create
            </button>
          </form>
        )}

        {sprints.length === 0 ? (
          <p className="text-sm text-slate-400">No sprints yet — tasks live in the backlog until you create one.</p>
        ) : (
          <div className="space-y-2">
            {sprints.map((sprint) => (
              <div key={sprint.id} className="flex items-center justify-between border-b border-slate-100 pb-2 last:border-0">
                <div>
                  <p className="text-sm font-medium text-slate-900">{sprint.name}</p>
                  <p className="text-xs text-slate-400">
                    {sprint.start_date} → {sprint.end_date} · {sprint.status}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  {sprint.status === 'planned' && (
                    <button onClick={() => updateSprintStatus(sprint.id, 'active')} className="text-sm text-indigo-600 font-medium">
                      Start
                    </button>
                  )}
                  {sprint.status === 'active' && (
                    <button onClick={() => updateSprintStatus(sprint.id, 'completed')} className="text-sm text-green-600 font-medium">
                      Complete
                    </button>
                  )}
                  <button onClick={() => deleteSprint(sprint.id)} className="text-sm text-red-600 font-medium">
                    Delete
                  </button>
                </div>
              </div>
            ))}
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
            <span className="text-xs text-slate-400">Sprint:</span>
            <select
              value={taskForm.sprint}
              onChange={(e) => setTaskForm({ ...taskForm, sprint: e.target.value })}
              className="border border-slate-300 rounded-lg px-2 py-1 text-xs"
            >
              <option value="">Backlog</option>
              {sprints
                .filter((s) => s.status !== 'completed')
                .map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
            </select>
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

        <div className="flex flex-wrap items-center gap-2 mb-4">
          <button
            onClick={() => setSprintFilter('all')}
            className={`text-xs px-2.5 py-1 rounded-full border ${
              sprintFilter === 'all' ? 'bg-indigo-600 text-white border-indigo-600' : 'border-slate-300 text-slate-600'
            }`}
          >
            All
          </button>
          <button
            onClick={() => setSprintFilter('backlog')}
            className={`text-xs px-2.5 py-1 rounded-full border ${
              sprintFilter === 'backlog' ? 'bg-indigo-600 text-white border-indigo-600' : 'border-slate-300 text-slate-600'
            }`}
          >
            Backlog
          </button>
          {sprints.map((s) => (
            <button
              key={s.id}
              onClick={() => setSprintFilter(String(s.id))}
              className={`text-xs px-2.5 py-1 rounded-full border ${
                sprintFilter === String(s.id) ? 'bg-indigo-600 text-white border-indigo-600' : 'border-slate-300 text-slate-600'
              }`}
            >
              {s.name}
            </button>
          ))}
        </div>

        {visibleTasks.length > 0 && (
          <div className="mb-4">
            <TaskStatusPieChart tasks={visibleTasks} />
          </div>
        )}

        <KanbanBoard tasks={visibleTasks} onStatusChange={updateTaskStatus} sprints={sprints} onSprintChange={updateTaskSprint} />
      </div>
    </div>
  )
}
