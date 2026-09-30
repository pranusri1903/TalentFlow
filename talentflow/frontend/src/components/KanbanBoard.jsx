import { DndContext, useDraggable, useDroppable } from '@dnd-kit/core'
import { CSS } from '@dnd-kit/utilities'
import { Expand, GripVertical } from 'lucide-react'

import { priorityMeta, typeMeta } from '../lib/taskMeta'
import { TASK_STATUSES } from '../lib/taskStatus'

const isOverdue = (task) => task.due_date && task.status !== 'done' && task.due_date < new Date().toISOString().slice(0, 10)

function Avatar({ name }) {
  return (
    <span
      title={name}
      className="w-5 h-5 rounded-full bg-indigo-100 text-indigo-700 text-[10px] font-semibold flex items-center justify-center shrink-0"
    >
      {name[0]?.toUpperCase()}
    </span>
  )
}

function TaskCard({ task, sprints, onSprintChange, onOpenTask }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id: task.id })
  const style = { transform: CSS.Translate.toString(transform), opacity: isDragging ? 0.4 : 1 }
  const priority = priorityMeta(task.priority)
  const type = typeMeta(task.type)
  const overdue = isOverdue(task)

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      style={style}
      className="group bg-white border border-slate-200 rounded-xl p-3 shadow-sm hover:shadow-md hover:border-indigo-200 transition cursor-grab active:cursor-grabbing touch-none"
    >
      <div className="flex items-start gap-1.5">
        <GripVertical size={14} className="text-slate-300 mt-0.5 shrink-0 group-hover:text-slate-400" />
        <span
          title={`Priority: ${priority.label}`}
          className="w-2 h-2 rounded-full mt-1.5 shrink-0"
          style={{ backgroundColor: priority.color }}
        />
        <p className="text-sm font-medium text-slate-900 leading-snug flex-1">{task.title}</p>
        {onOpenTask && (
          <button
            onClick={() => onOpenTask(task)}
            onPointerDown={(e) => e.stopPropagation()}
            className="opacity-0 group-hover:opacity-100 text-slate-300 hover:text-indigo-600 shrink-0"
          >
            <Expand size={13} />
          </button>
        )}
      </div>
      {task.description && <p className="text-xs text-slate-500 mt-1 ml-5 line-clamp-2">{task.description}</p>}

      <div className="flex items-center flex-wrap gap-1.5 mt-2 ml-5">
        <span title={`Type: ${type.label}`} className="text-[10px] font-semibold px-1.5 py-0.5 rounded" style={{ backgroundColor: `${type.color}1a`, color: type.color }}>
          {type.label}
        </span>
        {task.due_date && (
          <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${overdue ? 'bg-red-100 text-red-700' : 'bg-slate-100 text-slate-500'}`}>
            {overdue ? 'Overdue: ' : 'Due '}
            {task.due_date}
          </span>
        )}
        {task.labels &&
          task.labels.split(',').map((l) => l.trim()).filter(Boolean).map((label) => (
            <span key={label} className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-indigo-50 text-indigo-600">
              {label}
            </span>
          ))}
      </div>

      <div className="flex items-center justify-between mt-2.5 ml-5">
        {task.assignee_names?.length > 0 ? (
          <div className="flex items-center -space-x-1.5">
            {task.assignee_names.slice(0, 3).map((n) => (
              <Avatar key={n} name={n} />
            ))}
            {task.assignee_names.length > 3 && (
              <span className="text-[10px] text-slate-400 pl-2">+{task.assignee_names.length - 3}</span>
            )}
          </div>
        ) : (
          <span className="text-xs text-slate-400">Unassigned</span>
        )}
      </div>

      {onSprintChange ? (
        <select
          value={task.sprint || ''}
          onChange={(e) => onSprintChange(task.id, e.target.value || null)}
          onPointerDown={(e) => e.stopPropagation()}
          className="mt-2 ml-5 w-[calc(100%-1.25rem)] border border-slate-200 rounded text-xs px-1.5 py-1 text-slate-500"
        >
          <option value="">Backlog</option>
          {sprints.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>
      ) : (
        task.sprint_name && (
          <p className="text-xs text-indigo-500 mt-1.5 ml-5 bg-indigo-50 inline-block px-2 py-0.5 rounded-full">{task.sprint_name}</p>
        )
      )}
      {task.epic_name && (
        <p className="text-xs text-purple-600 mt-1.5 ml-5 bg-purple-50 inline-block px-2 py-0.5 rounded-full">{task.epic_name}</p>
      )}
    </div>
  )
}

function Column({ status, tasks, sprints, onSprintChange, onOpenTask }) {
  const { setNodeRef, isOver } = useDroppable({ id: status.value })

  return (
    <div
      ref={setNodeRef}
      className={`flex-1 min-w-[240px] rounded-2xl p-3 border transition ${
        isOver ? 'bg-indigo-50 border-indigo-200' : 'bg-slate-50 border-slate-100'
      }`}
    >
      <div className="flex items-center gap-2 mb-3 px-1">
        <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: status.color }} />
        <h3 className="text-xs font-semibold text-slate-600 uppercase tracking-wide">{status.label}</h3>
        <span className="text-xs text-slate-400 bg-white border border-slate-200 rounded-full px-1.5 ml-auto">{tasks.length}</span>
      </div>
      <div className="space-y-2 min-h-[60px]">
        {tasks.map((task) => (
          <TaskCard key={task.id} task={task} sprints={sprints} onSprintChange={onSprintChange} onOpenTask={onOpenTask} />
        ))}
      </div>
    </div>
  )
}

export default function KanbanBoard({ tasks, onStatusChange, sprints, onSprintChange, onOpenTask }) {
  const handleDragEnd = ({ active, over }) => {
    if (!over) return
    const task = tasks.find((t) => t.id === active.id)
    if (task && task.status !== over.id) onStatusChange(task.id, over.id)
  }

  return (
    <DndContext onDragEnd={handleDragEnd}>
      <div className="flex gap-3 overflow-x-auto pb-2">
        {TASK_STATUSES.map((status) => (
          <Column
            key={status.value}
            status={status}
            tasks={tasks.filter((t) => t.status === status.value)}
            sprints={sprints}
            onSprintChange={onSprintChange}
            onOpenTask={onOpenTask}
          />
        ))}
      </div>
    </DndContext>
  )
}
