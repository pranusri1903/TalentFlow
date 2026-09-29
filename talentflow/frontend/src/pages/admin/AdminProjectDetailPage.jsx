import {
  ArrowLeft, Check, ListChecks, Plus, ShieldCheck, Trash2, UserMinus, UserPlus, X,
} from 'lucide-react'
import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'

import KanbanBoard from '../../components/KanbanBoard'
import TaskStatusPieChart from '../../components/TaskStatusPieChart'
import Button from '../../components/ui/Button'
import Card from '../../components/ui/Card'
import EmptyState from '../../components/ui/EmptyState'
import Spinner from '../../components/ui/Spinner'
import { useAuth } from '../../context/AuthContext'
import { departmentLabel } from '../../lib/departments'
import { api } from '../../lib/api'

export default function AdminProjectDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { profile } = useAuth()
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

  const updateManager = async (employeeId) => {
    const { data } = await api.patch(`/projects/projects/${id}/`, { manager: employeeId || null })
    setProject(data)
  }

  const toggleMember = async (employeeId) => {
    const members = project.members.includes(employeeId)
      ? project.members.filter((m) => m !== employeeId)
      : [...project.members, employeeId]
    const { data } = await api.patch(`/projects/projects/${id}/`, { members })
    setProject(data)
  }

  const createTask = async (e) => {
    e.preventDefault()
    const { data } = await api.post(`/projects/projects/${id}/tasks/`, { ...taskForm, sprint: taskForm.sprint || null })
    setTaskForm({ title: '', description: '', assignees: [], sprint: '' })
    setTasks((ts) => [...ts, data])
  }

  const createSprint = async (e) => {
    e.preventDefault()
    const { data } = await api.post(`/projects/projects/${id}/sprints/`, sprintForm)
    setSprintForm({ name: '', start_date: '', end_date: '' })
    setShowSprintForm(false)
    setSprints((ss) => [...ss, data])
  }

  const updateSprintStatus = async (sprintId, status) => {
    const { data } = await api.patch(`/projects/sprints/${sprintId}/`, { status })
    setSprints((ss) => ss.map((s) => (s.id === sprintId ? data : s)))
  }

  const deleteSprint = async (sprintId) => {
    await api.delete(`/projects/sprints/${sprintId}/`)
    setSprints((ss) => ss.filter((s) => s.id !== sprintId))
    loadTasks()
    if (sprintFilter === String(sprintId)) setSprintFilter('all')
  }

  const updateTaskSprint = async (taskId, sprintId) => {
    const { data } = await api.patch(`/projects/tasks/${taskId}/`, { sprint: sprintId })
    setTasks((ts) => ts.map((t) => (t.id === taskId ? data : t)))
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
    const { data } = await api.patch(`/projects/tasks/${taskId}/status/`, { status })
    setTasks((ts) => ts.map((t) => (t.id === taskId ? data : t)))
  }

  if (!project) return <Spinner />

  const visibleTasks =
    sprintFilter === 'all'
      ? tasks
      : sprintFilter === 'backlog'
        ? tasks.filter((t) => !t.sprint)
        : tasks.filter((t) => String(t.sprint) === sprintFilter)

  return (
    <div className="space-y-6">
      <button onClick={() => navigate(-1)} className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-indigo-600">
        <ArrowLeft size={16} /> Back to projects
      </button>

      <Card>
        <h1 className="text-2xl font-bold text-slate-900">{project.name}</h1>
        {project.description && <p className="text-slate-500 mt-1">{project.description}</p>}
        {profile?.role === 'admin' ? (
          <div className="flex items-center gap-2 mt-3">
            <ShieldCheck size={16} className="text-slate-400" />
            <span className="text-sm text-slate-500">Manager:</span>
            <select
              value={project.manager || ''}
              onChange={(e) => updateManager(e.target.value)}
              className="border border-slate-300 rounded-lg px-2 py-1 text-sm"
            >
              <option value="">Unassigned</option>
              {employees
                .filter((emp) => emp.is_manager)
                .map((emp) => (
                  <option key={emp.id} value={emp.id}>
                    {emp.profile.full_name || emp.profile.email}
                  </option>
                ))}
            </select>
          </div>
        ) : (
          <p className="flex items-center gap-2 text-sm text-slate-500 mt-3">
            <ShieldCheck size={16} className="text-slate-400" /> Manager: {project.manager_name || 'Unassigned'}
          </p>
        )}
      </Card>

      <Card
        title="Team members"
        action={
          <Button size="sm" onClick={() => setShowAddMember((s) => !s)}>
            {showAddMember ? <X size={14} /> : <UserPlus size={14} />}
            {showAddMember ? 'Close' : 'Add member'}
          </Button>
        }
      >
        {project.members.length === 0 ? (
          <EmptyState title="No members yet" />
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
                  <button onClick={() => toggleMember(emp.id)} className="flex items-center gap-1 text-sm text-red-600 hover:text-red-700 font-medium">
                    <UserMinus size={14} /> Remove
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
                      <button onClick={() => toggleMember(emp.id)} className="flex items-center gap-1 text-sm text-indigo-600 hover:text-indigo-700 font-medium">
                        <UserPlus size={14} /> Add
                      </button>
                    </div>
                  ))}
              </div>
            )}
          </div>
        )}
      </Card>

      <Card
        title="Sprints"
        action={
          <Button size="sm" onClick={() => setShowSprintForm((s) => !s)}>
            {showSprintForm ? <X size={14} /> : <Plus size={14} />}
            {showSprintForm ? 'Close' : 'New sprint'}
          </Button>
        }
      >
        {showSprintForm && (
          <form onSubmit={createSprint} className="grid sm:grid-cols-4 gap-2 mb-4">
            <input
              required
              placeholder="Sprint name"
              value={sprintForm.name}
              onChange={(e) => setSprintForm({ ...sprintForm, name: e.target.value })}
              className="border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <input
              required
              type="date"
              value={sprintForm.start_date}
              onChange={(e) => setSprintForm({ ...sprintForm, start_date: e.target.value })}
              className="border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <input
              required
              type="date"
              value={sprintForm.end_date}
              onChange={(e) => setSprintForm({ ...sprintForm, end_date: e.target.value })}
              className="border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <Button>Create</Button>
          </form>
        )}

        {sprints.length === 0 ? (
          <EmptyState title="No sprints yet" description="Tasks live in the backlog until you create one" />
        ) : (
          <div className="space-y-2">
            {sprints.map((sprint) => (
              <div key={sprint.id} className="flex items-center justify-between border-b border-slate-100 pb-2 last:border-0">
                <div>
                  <p className="text-sm font-medium text-slate-900">{sprint.name}</p>
                  <p className="text-xs text-slate-400 capitalize">
                    {sprint.start_date} → {sprint.end_date} · {sprint.status}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  {sprint.status === 'planned' && (
                    <button onClick={() => updateSprintStatus(sprint.id, 'active')} className="text-sm text-indigo-600 hover:text-indigo-700 font-medium">
                      Start
                    </button>
                  )}
                  {sprint.status === 'active' && (
                    <button
                      onClick={() => updateSprintStatus(sprint.id, 'completed')}
                      className="flex items-center gap-1 text-sm text-green-600 hover:text-green-700 font-medium"
                    >
                      <Check size={14} /> Complete
                    </button>
                  )}
                  <button onClick={() => deleteSprint(sprint.id)} className="text-slate-400 hover:text-red-600">
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      <Card title="Tasks">
        <form onSubmit={createTask} className="space-y-2 mb-4">
          <div className="grid sm:grid-cols-3 gap-2">
            <input
              required
              placeholder="Task title"
              value={taskForm.title}
              onChange={(e) => setTaskForm({ ...taskForm, title: e.target.value })}
              className="border border-slate-300 rounded-lg px-3 py-2 sm:col-span-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <Button>
              <Plus size={16} /> Add task
            </Button>
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
                    className={`text-xs px-2.5 py-1 rounded-full border transition ${
                      selected ? 'bg-indigo-600 text-white border-indigo-600' : 'border-slate-300 text-slate-600 hover:bg-slate-50'
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
            className={`text-xs px-2.5 py-1 rounded-full border transition ${
              sprintFilter === 'all' ? 'bg-indigo-600 text-white border-indigo-600' : 'border-slate-300 text-slate-600 hover:bg-slate-50'
            }`}
          >
            All
          </button>
          <button
            onClick={() => setSprintFilter('backlog')}
            className={`text-xs px-2.5 py-1 rounded-full border transition ${
              sprintFilter === 'backlog' ? 'bg-indigo-600 text-white border-indigo-600' : 'border-slate-300 text-slate-600 hover:bg-slate-50'
            }`}
          >
            Backlog
          </button>
          {sprints.map((s) => (
            <button
              key={s.id}
              onClick={() => setSprintFilter(String(s.id))}
              className={`text-xs px-2.5 py-1 rounded-full border transition ${
                sprintFilter === String(s.id) ? 'bg-indigo-600 text-white border-indigo-600' : 'border-slate-300 text-slate-600 hover:bg-slate-50'
              }`}
            >
              {s.name}
            </button>
          ))}
        </div>

        {visibleTasks.length === 0 ? (
          <EmptyState icon={ListChecks} title="No tasks in this view" />
        ) : (
          <>
            <div className="mb-4">
              <TaskStatusPieChart tasks={visibleTasks} />
            </div>
            <KanbanBoard tasks={visibleTasks} onStatusChange={updateTaskStatus} sprints={sprints} onSprintChange={updateTaskSprint} />
          </>
        )}
      </Card>
    </div>
  )
}
