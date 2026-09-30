import { ChevronDown, ChevronRight } from 'lucide-react'
import { useState } from 'react'

import { priorityMeta, today, typeMeta } from '../lib/taskMeta'

function dueBucket(task) {
  if (!task.due_date) return 'No due date'
  if (task.due_date < today()) return 'Overdue'
  if (task.due_date === today()) return 'Due today'
  const inAWeek = new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10)
  return task.due_date <= inAWeek ? 'Due this week' : 'Later'
}
const DUE_ORDER = ['Overdue', 'Due today', 'Due this week', 'Later', 'No due date']

function groupTasks(tasks, groupBy) {
  const groups = new Map()
  const order = []
  for (const task of tasks) {
    let key
    if (groupBy === 'type') key = typeMeta(task.type).label
    else if (groupBy === 'due_date') key = dueBucket(task)
    else if (groupBy === 'epic') key = task.epic_name || 'No epic'
    else key = task.sprint_name || 'Backlog'

    if (!groups.has(key)) {
      groups.set(key, [])
      order.push(key)
    }
    groups.get(key).push(task)
  }
  const sortedKeys = groupBy === 'due_date' ? DUE_ORDER.filter((k) => groups.has(k)) : order
  return sortedKeys.map((key) => ({ key, tasks: groups.get(key) }))
}

function TaskRow({ task, onOpenTask }) {
  const priority = priorityMeta(task.priority)
  const type = typeMeta(task.type)
  return (
    <button
      onClick={() => onOpenTask(task)}
      className="w-full flex items-center gap-2.5 text-left border-b border-slate-100 py-2.5 last:border-0 hover:bg-slate-50 px-2 -mx-2 rounded-lg"
    >
      <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: priority.color }} />
      <span className="text-sm text-slate-900 flex-1 truncate">{task.title}</span>
      <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded shrink-0" style={{ backgroundColor: `${type.color}1a`, color: type.color }}>
        {type.label}
      </span>
      {task.due_date && <span className="text-xs text-slate-400 shrink-0">{task.due_date}</span>}
    </button>
  )
}

export default function GroupedTaskList({ tasks, groupBy, onOpenTask }) {
  const [doneOpen, setDoneOpen] = useState(false)
  const active = tasks.filter((t) => t.status !== 'done')
  const done = tasks.filter((t) => t.status === 'done')
  const groups = groupTasks(active, groupBy)

  return (
    <div className="space-y-5">
      {groups.map((g) => (
        <div key={g.key}>
          <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">
            {g.key} <span className="text-slate-400 font-normal normal-case">({g.tasks.length})</span>
          </h4>
          {g.tasks.map((task) => (
            <TaskRow key={task.id} task={task} onOpenTask={onOpenTask} />
          ))}
        </div>
      ))}

      {done.length > 0 && (
        <div>
          <button
            onClick={() => setDoneOpen((o) => !o)}
            className="flex items-center gap-1.5 text-xs font-semibold text-green-700 uppercase tracking-wide mb-1"
          >
            {doneOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
            ✓ Done ({done.length})
          </button>
          {doneOpen && done.map((task) => <TaskRow key={task.id} task={task} onOpenTask={onOpenTask} />)}
        </div>
      )}
    </div>
  )
}
