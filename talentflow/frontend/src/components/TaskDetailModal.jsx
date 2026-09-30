import { useEffect, useState } from 'react'

import { api } from '../lib/api'
import { TASK_PRIORITIES, TASK_TYPES } from '../lib/taskMeta'
import { TASK_STATUSES } from '../lib/taskStatus'
import Button from './ui/Button'
import Chip from './ui/Chip'
import Modal from './ui/Modal'

function ActivityFeed({ taskId }) {
  const [comments, setComments] = useState([])
  const [activity, setActivity] = useState([])
  const [body, setBody] = useState('')
  const [posting, setPosting] = useState(false)

  useEffect(() => {
    api.get(`/projects/tasks/${taskId}/comments/`).then(({ data }) => setComments(data))
    api.get(`/projects/tasks/${taskId}/activity/`).then(({ data }) => setActivity(data))
  }, [taskId])

  const postComment = async () => {
    if (!body.trim()) return
    setPosting(true)
    try {
      const { data } = await api.post(`/projects/tasks/${taskId}/comments/`, { body })
      setComments((cs) => [...cs, data])
      setBody('')
    } finally {
      setPosting(false)
    }
  }

  const feed = [
    ...comments.map((c) => ({ kind: 'comment', at: c.created_at, key: `c${c.id}`, author: c.author_name, text: c.body })),
    ...activity.map((a) => ({ kind: 'activity', at: a.created_at, key: `a${a.id}`, author: a.actor_name, text: a.message })),
  ].sort((x, y) => new Date(x.at) - new Date(y.at))

  return (
    <div className="mt-4 pt-4 border-t border-slate-200">
      <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Activity</p>
      <div className="space-y-2 max-h-56 overflow-y-auto mb-3">
        {feed.length === 0 && <p className="text-sm text-slate-400">No activity yet.</p>}
        {feed.map((item) =>
          item.kind === 'comment' ? (
            <div key={item.key} className="text-sm bg-slate-50 rounded-lg px-3 py-2">
              <p className="font-medium text-slate-900">{item.author || 'Someone'}</p>
              <p className="text-slate-600">{item.text}</p>
            </div>
          ) : (
            <p key={item.key} className="text-xs text-slate-400">{item.text}</p>
          )
        )}
      </div>
      <div className="flex items-center gap-2">
        <input
          value={body}
          onChange={(e) => setBody(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && postComment()}
          placeholder="Add a comment... (@Name to mention)"
          className="flex-1 border border-slate-300 rounded-lg px-3 py-1.5 text-sm"
        />
        <Button size="sm" disabled={posting || !body.trim()} onClick={postComment}>Post</Button>
      </div>
    </div>
  )
}

export default function TaskDetailModal({ task, canEdit, employees = [], sprints = [], epics = [], onClose, onSave, onStatusChange }) {
  const [form, setForm] = useState({
    title: task.title,
    description: task.description || '',
    priority: task.priority,
    type: task.type,
    due_date: task.due_date || '',
    labels: task.labels || '',
    sprint: task.sprint || '',
    epic: task.epic || '',
    assignees: task.assignees || [],
  })
  const [saving, setSaving] = useState(false)

  const toggleAssignee = (id) =>
    setForm((f) => ({
      ...f,
      assignees: f.assignees.includes(id) ? f.assignees.filter((a) => a !== id) : [...f.assignees, id],
    }))

  const save = async () => {
    setSaving(true)
    try {
      await onSave(task.id, { ...form, sprint: form.sprint || null, epic: form.epic || null, due_date: form.due_date || null })
      onClose()
    } finally {
      setSaving(false)
    }
  }

  if (!canEdit) {
    return (
      <Modal title={task.title} onClose={onClose}>
        <div className="space-y-3 text-sm">
          {task.description && <p className="text-slate-600">{task.description}</p>}
          <div className="flex flex-wrap gap-3 text-slate-500">
            <span>Priority: <span className="font-medium capitalize">{task.priority}</span></span>
            <span>Type: <span className="font-medium capitalize">{task.type}</span></span>
            {task.due_date && <span>Due: <span className="font-medium">{task.due_date}</span></span>}
            {task.epic_name && <span>Epic: <span className="font-medium">{task.epic_name}</span></span>}
          </div>
          {task.labels && <p className="text-slate-500">Labels: {task.labels}</p>}
          <p className="text-slate-500">Assignees: {task.assignee_names?.join(', ') || 'Unassigned'}</p>
          <label className="block text-xs font-medium text-slate-500 mt-3">Status</label>
          <select
            value={task.status}
            onChange={(e) => onStatusChange(task.id, e.target.value)}
            className="w-full border border-slate-300 rounded-lg px-2 py-1.5 text-sm"
          >
            {TASK_STATUSES.map((s) => (
              <option key={s.value} value={s.value}>{s.label}</option>
            ))}
          </select>
        </div>
        <ActivityFeed taskId={task.id} />
      </Modal>
    )
  }

  return (
    <Modal title="Edit task" onClose={onClose}>
      <div className="space-y-3">
        <input
          value={form.title}
          onChange={(e) => setForm({ ...form, title: e.target.value })}
          className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
          placeholder="Title"
        />
        <textarea
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
          className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
          placeholder="Description"
          rows={3}
        />
        <div className="grid grid-cols-2 gap-2">
          <select
            value={form.priority}
            onChange={(e) => setForm({ ...form, priority: e.target.value })}
            className="border border-slate-300 rounded-lg px-2 py-1.5 text-sm"
          >
            {TASK_PRIORITIES.map((p) => (
              <option key={p.value} value={p.value}>{p.label}</option>
            ))}
          </select>
          <select
            value={form.type}
            onChange={(e) => setForm({ ...form, type: e.target.value })}
            className="border border-slate-300 rounded-lg px-2 py-1.5 text-sm"
          >
            {TASK_TYPES.map((t) => (
              <option key={t.value} value={t.value}>{t.label}</option>
            ))}
          </select>
          <input
            type="date"
            value={form.due_date}
            onChange={(e) => setForm({ ...form, due_date: e.target.value })}
            className="border border-slate-300 rounded-lg px-2 py-1.5 text-sm"
          />
          <select
            value={form.sprint}
            onChange={(e) => setForm({ ...form, sprint: e.target.value })}
            className="border border-slate-300 rounded-lg px-2 py-1.5 text-sm"
          >
            <option value="">Backlog</option>
            {sprints.map((s) => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
          <select
            value={form.epic}
            onChange={(e) => setForm({ ...form, epic: e.target.value })}
            className="border border-slate-300 rounded-lg px-2 py-1.5 text-sm col-span-2"
          >
            <option value="">No epic</option>
            {epics.map((e) => (
              <option key={e.id} value={e.id}>{e.name}</option>
            ))}
          </select>
        </div>
        <input
          value={form.labels}
          onChange={(e) => setForm({ ...form, labels: e.target.value })}
          className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
          placeholder="Labels, comma-separated"
        />
        <div>
          <p className="text-xs font-medium text-slate-500 mb-1.5">Assignees</p>
          <div className="flex flex-wrap gap-1.5">
            {employees.map((e) => (
              <Chip key={e.id} size="sm" active={form.assignees.includes(e.id)} onClick={() => toggleAssignee(e.id)}>
                {e.profile.full_name || e.profile.email}
              </Chip>
            ))}
          </div>
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <Button variant="ghost" size="sm" onClick={onClose}>Cancel</Button>
          <Button size="sm" disabled={saving} onClick={save}>{saving ? 'Saving...' : 'Save'}</Button>
        </div>
        <ActivityFeed taskId={task.id} />
      </div>
    </Modal>
  )
}
