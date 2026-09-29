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
