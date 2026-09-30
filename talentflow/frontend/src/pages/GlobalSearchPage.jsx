import { Search, SearchX } from 'lucide-react'
import { useEffect, useState } from 'react'

import StatusBadge from '../components/StatusBadge'
import TaskDetailModal from '../components/TaskDetailModal'
import EmptyState from '../components/ui/EmptyState'
import PageHeader from '../components/ui/PageHeader'
import { api } from '../lib/api'
import { TASK_STATUSES } from '../lib/taskStatus'
import { priorityMeta, TASK_PRIORITIES } from '../lib/taskMeta'

export default function GlobalSearchPage() {
  const [q, setQ] = useState('')
  const [status, setStatus] = useState('')
  const [priority, setPriority] = useState('')
  const [results, setResults] = useState(null)
  const [openTask, setOpenTask] = useState(null)

  useEffect(() => {
    const params = {}
    if (q.trim()) params.q = q.trim()
    if (status) params.status = status
    if (priority) params.priority = priority
    const handle = setTimeout(() => {
      api.get('/projects/tasks/search/', { params }).then(({ data }) => setResults(data))
    }, 250)
    return () => clearTimeout(handle)
  }, [q, status, priority])

  const updateTaskStatus = async (taskId, newStatus) => {
    const { data } = await api.patch(`/projects/tasks/${taskId}/status/`, { status: newStatus })
    setResults((rs) => rs.map((t) => (t.id === taskId ? data : t)))
    setOpenTask((t) => (t && t.id === taskId ? data : t))
  }

  return (
    <div>
      <PageHeader title="Search" subtitle="Find any task across every project you have access to" />

      <div className="flex flex-wrap items-center gap-2 mb-6">
        <div className="relative flex-1 min-w-[220px]">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            autoFocus
            placeholder="Search by title or description..."
            value={q}
            onChange={(e) => setQ(e.target.value)}
            className="w-full border border-slate-300 rounded-lg pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
        <select value={status} onChange={(e) => setStatus(e.target.value)} className="border border-slate-300 rounded-lg px-2 py-2 text-sm">
          <option value="">All statuses</option>
          {TASK_STATUSES.map((s) => (
            <option key={s.value} value={s.value}>{s.label}</option>
          ))}
        </select>
        <select value={priority} onChange={(e) => setPriority(e.target.value)} className="border border-slate-300 rounded-lg px-2 py-2 text-sm">
          <option value="">All priorities</option>
          {TASK_PRIORITIES.map((p) => (
            <option key={p.value} value={p.value}>{p.label}</option>
          ))}
        </select>
      </div>

      {results === null ? null : results.length === 0 ? (
        <EmptyState icon={SearchX} title="No tasks match" />
      ) : (
        <div className="space-y-2">
          {results.map((task) => {
            const p = priorityMeta(task.priority)
            return (
              <button
                key={task.id}
                onClick={() => setOpenTask(task)}
                className="w-full flex items-center gap-3 text-left bg-white border border-slate-200 rounded-xl px-4 py-3 hover:border-indigo-200 hover:shadow-sm transition"
              >
                <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: p.color }} />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-slate-900 truncate">{task.title}</p>
                  <p className="text-xs text-slate-400 truncate">{task.project_name}</p>
                </div>
                {task.due_date && <span className="text-xs text-slate-400 shrink-0">{task.due_date}</span>}
                <StatusBadge status={task.status} />
              </button>
            )
          })}
        </div>
      )}

      {openTask && (
        <TaskDetailModal task={openTask} canEdit={false} onClose={() => setOpenTask(null)} onStatusChange={updateTaskStatus} />
      )}
    </div>
  )
}
