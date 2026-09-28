import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'

import KanbanBoard from '../../components/KanbanBoard'
import LeaveRequestQueue from '../../components/LeaveRequestQueue'
import StatusBadge from '../../components/StatusBadge'
import TaskStatusPieChart from '../../components/TaskStatusPieChart'
import { useAuth } from '../../context/AuthContext'
import { departmentLabel } from '../../lib/departments'
import { api } from '../../lib/api'

const EMPTY_LEAVE_FORM = { start_date: '', end_date: '', reason: '' }

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
      await api.post('/employees/me/leave/', leaveForm)
      setLeaveForm(EMPTY_LEAVE_FORM)
      setShowLeaveForm(false)
      loadLeave()
    } catch (err) {
      setLeaveError(Object.values(err.response?.data || {}).flat().join(' ') || 'Could not submit request.')
    }
  }

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
              <span key={p.id} className="bg-indigo-50 text-indigo-700 text-sm px-3 py-1 rounded-full flex items-center gap-2">
                {p.name}
                {employee?.is_manager && p.manager === employee.id && (
                  <Link to={`/admin/projects/${p.id}`} className="text-indigo-900 underline">
                    Manage
                  </Link>
                )}
              </span>
            ))}
          </div>
        )}
      </div>

      {employee?.is_manager && (
        <div className="bg-white border border-slate-200 rounded-xl p-6">
          <h2 className="font-semibold text-slate-900 mb-3">Team Leave Requests</h2>
          <LeaveRequestQueue />
        </div>
      )}

      <div className="bg-white border border-slate-200 rounded-xl p-6">
        <div className="flex items-center justify-between mb-1">
          <h2 className="font-semibold text-slate-900">Leave</h2>
          <button
            onClick={() => setShowLeaveForm((s) => !s)}
            className="text-sm bg-indigo-600 text-white rounded-lg px-3 py-1.5 font-medium hover:bg-indigo-700"
          >
            {showLeaveForm ? 'Close' : '+ Request leave'}
          </button>
        </div>
        {leaveBalance && (
          <p className="text-sm text-slate-500 mb-3">
            {leaveBalance.remaining} of {leaveBalance.allowance} days remaining this year
          </p>
        )}

        {showLeaveForm && (
          <form onSubmit={submitLeaveRequest} className="space-y-2 mb-4 border-b border-slate-100 pb-4">
            <div className="grid sm:grid-cols-2 gap-2">
              <input
                required
                type="date"
                value={leaveForm.start_date}
                onChange={(e) => setLeaveForm({ ...leaveForm, start_date: e.target.value })}
                className="border border-slate-300 rounded-lg px-3 py-2"
              />
              <input
                required
                type="date"
                value={leaveForm.end_date}
                onChange={(e) => setLeaveForm({ ...leaveForm, end_date: e.target.value })}
                className="border border-slate-300 rounded-lg px-3 py-2"
              />
            </div>
            <textarea
              required
              placeholder="Reason"
              value={leaveForm.reason}
              onChange={(e) => setLeaveForm({ ...leaveForm, reason: e.target.value })}
              rows={2}
              className="w-full border border-slate-300 rounded-lg px-3 py-2"
            />
            {leaveError && <p className="text-red-600 text-sm">{leaveError}</p>}
            <button className="bg-indigo-600 text-white rounded-lg px-4 py-2 font-medium hover:bg-indigo-700">
              Submit request
            </button>
          </form>
        )}

        {leaveRequests.length === 0 ? (
          <p className="text-slate-500 text-sm">No leave requests yet.</p>
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
                <StatusBadge status={r.status} />
              </div>
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
