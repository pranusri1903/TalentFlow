import { DndContext, useDraggable, useDroppable } from '@dnd-kit/core'
import { CSS } from '@dnd-kit/utilities'

import { TASK_STATUSES } from '../lib/taskStatus'

function TaskCard({ task }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id: task.id })
  const style = { transform: CSS.Translate.toString(transform), opacity: isDragging ? 0.4 : 1 }

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      style={style}
      className="bg-white border border-slate-200 rounded-lg p-3 shadow-sm cursor-grab active:cursor-grabbing touch-none"
    >
      <p className="text-sm font-medium text-slate-900">{task.title}</p>
      {task.description && <p className="text-xs text-slate-500 mt-1 line-clamp-2">{task.description}</p>}
      <p className="text-xs text-slate-400 mt-2">
        {task.assignee_names?.length > 0 ? task.assignee_names.join(', ') : 'Unassigned'}
      </p>
    </div>
  )
}

function Column({ status, tasks }) {
  const { setNodeRef, isOver } = useDroppable({ id: status.value })

  return (
    <div ref={setNodeRef} className={`flex-1 min-w-[220px] rounded-xl p-3 ${isOver ? 'bg-indigo-50' : 'bg-slate-50'}`}>
      <div className="flex items-center gap-2 mb-3">
        <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: status.color }} />
        <h3 className="text-sm font-semibold text-slate-700">{status.label}</h3>
        <span className="text-xs text-slate-400 ml-auto">{tasks.length}</span>
      </div>
      <div className="space-y-2 min-h-[60px]">
        {tasks.map((task) => (
          <TaskCard key={task.id} task={task} />
        ))}
      </div>
    </div>
  )
}

export default function KanbanBoard({ tasks, onStatusChange }) {
  const handleDragEnd = ({ active, over }) => {
    if (!over) return
    const task = tasks.find((t) => t.id === active.id)
    if (task && task.status !== over.id) onStatusChange(task.id, over.id)
  }

  return (
    <DndContext onDragEnd={handleDragEnd}>
      <div className="flex gap-3 overflow-x-auto pb-2">
        {TASK_STATUSES.map((status) => (
          <Column key={status.value} status={status} tasks={tasks.filter((t) => t.status === status.value)} />
        ))}
      </div>
    </DndContext>
  )
}
