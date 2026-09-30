// Ordinal ramp (one hue, light->dark) since priority is a severity sequence,
// same methodology as taskStatus.js's status ramp.
export const TASK_PRIORITIES = [
  { value: 'low', label: 'Low', color: '#fde68a' },
  { value: 'medium', label: 'Medium', color: '#fbbf24' },
  { value: 'high', label: 'High', color: '#f59e0b' },
  { value: 'urgent', label: 'Urgent', color: '#b45309' },
]

// Nominal (unrelated categories, not a sequence) — distinct hues.
export const TASK_TYPES = [
  { value: 'task', label: 'Task', color: '#3b82f6' },
  { value: 'bug', label: 'Bug', color: '#ef4444' },
  { value: 'story', label: 'Story', color: '#22c55e' },
]

export const priorityMeta = (value) => TASK_PRIORITIES.find((p) => p.value === value) || TASK_PRIORITIES[1]
export const typeMeta = (value) => TASK_TYPES.find((t) => t.value === value) || TASK_TYPES[0]

export const today = () => new Date().toISOString().slice(0, 10)

export const isOverdue = (task) => task.due_date && task.status !== 'done' && task.due_date < today()

export const parseCsv = (str) => (str ? str.split(',').map((s) => s.trim()).filter(Boolean) : [])

export const taskLabels = (tasks) => [...new Set(tasks.flatMap((t) => parseCsv(t.labels)))]

export function filterTasks(tasks, { search, assignee, priority, label, epic } = {}) {
  const q = search?.trim().toLowerCase()
  return tasks
    .filter((t) => !q || t.title.toLowerCase().includes(q) || t.description?.toLowerCase().includes(q))
    .filter((t) => !assignee || t.assignees.includes(Number(assignee)))
    .filter((t) => !priority || t.priority === priority)
    .filter((t) => !label || parseCsv(t.labels).map((l) => l.toLowerCase()).includes(label.toLowerCase()))
    .filter((t) => !epic || String(t.epic) === String(epic))
}
