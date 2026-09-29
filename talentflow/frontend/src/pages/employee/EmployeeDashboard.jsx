import { CalendarPlus, CheckSquare, FolderKanban, ListChecks, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'

import GroupedTaskList from '../../components/GroupedTaskList'
import KanbanBoard from '../../components/KanbanBoard'
import LeaveRequestQueue from '../../components/LeaveRequestQueue'
import StatusBadge from '../../components/StatusBadge'
import TaskDetailModal from '../../components/TaskDetailModal'
import TaskStatusPieChart from '../../components/TaskStatusPieChart'
import Button from '../../components/ui/Button'
import Card from '../../components/ui/Card'
import EmptyState from '../../components/ui/EmptyState'
import PageHeader from '../../components/ui/PageHeader'
import { useAuth } from '../../context/AuthContext'
import { departmentLabel } from '../../lib/departments'
import { api } from '../../lib/api'

const EMPTY_LEAVE_FORM = { start_date: '', end_date: '', reason: '' }
const GROUP_OPTIONS = [
  { value: 'status', label: 'Status' },
  { value: 'type', label: 'Type' },
  { value: 'due_date', label: 'Due date' },
  { value: 'sprint', label: 'Sprint' },
]

export default function EmployeeDashboard() {
  const { profile } = useAuth()
  const [employee, setEmployee] = useState(null)
  const [tasks, setTasks] = useState([])
  const [projects, setProjects] = useState([])
  const [leaveRequests, setLeaveRequests] = useState([])
  const [leaveBalance, setLeaveBalance] = useState(null)
  const [showLeaveForm, setShowLeaveForm] = useState(false)
  const [leaveForm, setLeaveForm] = useState(EMPTY_LEAVE_FORM)
  const [leaveError, setLeaveError] = useState('')
  const [taskGroupBy, setTaskGroupBy] = useState('status')
  const [openTask, setOpenTask] = useState(null)

  const loadTasks = () => api.get('/projects/my-tasks/').then(({ data }) => setTasks(data))
  const loadLeave = () => {
    api.get('/employees/me/leave/').then(({ data }) => setLeaveRequests(data))
    api.get('/employees/me/leave/balance/').then(({ data }) => setLeaveBalance(data))
  }

  useEffect(() => {
    api.get('/employees/me/').then(({ data }) => setEmployee(data))
    loadTasks()
    loadLeave()
    api.get('/projects/projects/').then(({ data }) => setProjects(data))
  }, [])

  const submitLeaveRequest = async (e) => {
    e.preventDefault()
    setLeaveError('')
    try {
      const { data } = await api.post('/employees/me/leave/', leaveForm)
      setLeaveForm(EMPTY_LEAVE_FORM)
      setShowLeaveForm(false)
      setLeaveRequests((rs) => [data, ...rs])
      api.get('/employees/me/leave/balance/').then(({ data }) => setLeaveBalance(data))
    } catch (err) {
      setLeaveError(Object.values(err.response?.data || {}).flat().join(' ') || 'Could not submit request.')
    }
  }

  const updateTaskStatus = async (taskId, status) => {
    const { data } = await api.patch(`/projects/tasks/${taskId}/status/`, { status })
    setTasks((ts) => ts.map((t) => (t.id === taskId ? data : t)))
  }

  const cancelLeave = async (id) => {
    const { data } = await api.patch(`/employees/me/leave/${id}/cancel/`)
    setLeaveRequests((rs) => rs.map((r) => (r.id === id ? data : r)))
    api.get('/employees/me/leave/balance/').then(({ data }) => setLeaveBalance(data))
  }

  const usedPct = leaveBalance ? Math.round((leaveBalance.used / leaveBalance.allowance) * 100) : 0

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Welcome, ${profile?.full_name || profile?.email}`}
        subtitle={
          employee
            ? `${employee.job_title || 'Employee'}${employee.department ? ` · ${departmentLabel(employee.department)}` : ''}${
                employee.manager_name ? ` · Reports to ${employee.manager_name}` : ''
              }`
            : 'Your employee profile is being set up by admin.'
        }
      />

      <Card title="My Projects">
        {projects.length === 0 ? (
          <EmptyState icon={FolderKanban} title="You're not assigned to any project yet" />
        ) : (
          <div className="flex flex-wrap gap-2">
            {projects.map((p) => (
              <span key={p.id} className="bg-indigo-50 text-indigo-700 text-sm px-3 py-1.5 rounded-full flex items-center gap-2">
                {p.name}
                {employee?.is_manager && p.manager === employee.id && (
                  <Link to={`/admin/projects/${p.id}`} className="text-indigo-900 underline font-medium">
                    Manage
                  </Link>
                )}
              </span>
            ))}
          </div>
        )}
      </Card>

      {employee?.is_manager && (
        <Card title="Team Leave Requests">
          <LeaveRequestQueue />
        </Card>
      )}

      <Card
        title="Leave"
        action={
          <Button size="sm" onClick={() => setShowLeaveForm((s) => !s)}>
            {showLeaveForm ? <X size={14} /> : <CalendarPlus size={14} />}
            {showLeaveForm ? 'Close' : 'Request leave'}
          </Button>
        }
      >
        {leaveBalance && (
          <div className="mb-4">
            <div className="flex items-baseline justify-between text-sm mb-1.5">
              <span className="text-slate-500">
                <span className="text-slate-900 font-semibold">{leaveBalance.remaining}</span> of {leaveBalance.allowance} days remaining
              </span>
            </div>
            <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
              <div className="h-full bg-indigo-500 rounded-full transition-all" style={{ width: `${usedPct}%` }} />
            </div>
          </div>
        )}

        {showLeaveForm && (
          <form onSubmit={submitLeaveRequest} className="space-y-2 mb-4 border-b border-slate-100 pb-4">
            <div className="grid sm:grid-cols-2 gap-2">
              <input
                required
                type="date"
                value={leaveForm.start_date}
                onChange={(e) => setLeaveForm({ ...leaveForm, start_date: e.target.value })}
                className="border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <input
                required
                type="date"
                value={leaveForm.end_date}
                onChange={(e) => setLeaveForm({ ...leaveForm, end_date: e.target.value })}
                className="border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <textarea
              required
              placeholder="Reason"
              value={leaveForm.reason}
              onChange={(e) => setLeaveForm({ ...leaveForm, reason: e.target.value })}
              rows={2}
              className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            {leaveError && <p className="text-red-600 text-sm">{leaveError}</p>}
            <Button>Submit request</Button>
          </form>
        )}

        {leaveRequests.length === 0 ? (
          <EmptyState icon={ListChecks} title="No leave requests yet" />
        ) : (
          <div className="space-y-2">
            {leaveRequests.map((r) => (
              <div key={r.id} className="flex items-center justify-between border-b border-slate-100 pb-2 last:border-0">
                <div>
                  <p className="text-sm font-medium text-slate-900">
                    {r.start_date} → {r.end_date} ({r.days} day{r.days === 1 ? '' : 's'})
                  </p>
                  <p className="text-xs text-slate-400">{r.reason}</p>
                </div>
                <div className="flex items-center gap-2">
                  {r.status === 'approved' && r.start_date > new Date().toISOString().slice(0, 10) && (
                    <button onClick={() => cancelLeave(r.id)} className="text-xs text-red-600 hover:text-red-700 font-medium">
                      Cancel
                    </button>
                  )}
                  <StatusBadge status={r.status} />
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      <Card
        title="My Tasks"
        action={
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-slate-400">Group by:</span>
            <select
              value={taskGroupBy}
              onChange={(e) => setTaskGroupBy(e.target.value)}
              className="border border-slate-300 rounded-lg px-2 py-1 text-xs"
            >
              {GROUP_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>
        }
      >
        {tasks.length === 0 ? (
          <EmptyState icon={CheckSquare} title="No tasks assigned yet" />
        ) : taskGroupBy === 'status' ? (
          <>
            <div className="mb-4">
              <TaskStatusPieChart tasks={tasks} />
            </div>
            <KanbanBoard tasks={tasks} onStatusChange={updateTaskStatus} onOpenTask={setOpenTask} />
          </>
        ) : (
          <GroupedTaskList tasks={tasks} groupBy={taskGroupBy} onOpenTask={setOpenTask} />
        )}
      </Card>

      {openTask && (
        <TaskDetailModal
          task={openTask}
          canEdit={false}
          onClose={() => setOpenTask(null)}
          onStatusChange={updateTaskStatus}
        />
      )}
    </div>
  )
}
