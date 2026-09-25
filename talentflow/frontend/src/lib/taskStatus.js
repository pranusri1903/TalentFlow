// Ordinal ramp (one hue, light->dark) since task status is a sequence, not
// unrelated categories: todo -> in_progress -> review -> done.
export const TASK_STATUSES = [
  { value: 'todo', label: 'To Do', color: '#818cf8' },
  { value: 'in_progress', label: 'In Progress', color: '#6366f1' },
  { value: 'review', label: 'Review', color: '#4338ca' },
  { value: 'done', label: 'Done', color: '#312e81' },
]

export const statusColor = (value) => TASK_STATUSES.find((s) => s.value === value)?.color || '#818cf8'
export const statusLabel = (value) => TASK_STATUSES.find((s) => s.value === value)?.label || value
