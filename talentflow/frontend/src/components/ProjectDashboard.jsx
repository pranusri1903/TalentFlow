import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'

import { isOverdue, TASK_PRIORITIES, TASK_TYPES } from '../lib/taskMeta'

function StatCard({ label, value, accent }) {
  return (
    <div className="bg-slate-50 rounded-xl px-4 py-3">
      <p className={`text-2xl font-bold ${accent || 'text-slate-900'}`}>{value}</p>
      <p className="text-xs text-slate-500">{label}</p>
    </div>
  )
}

function MiniBarChart({ data }) {
  if (data.length === 0) return <p className="text-sm text-slate-400">No data.</p>
  return (
    <ResponsiveContainer width="100%" height={Math.max(60, data.length * 32)}>
      <BarChart data={data} layout="vertical" margin={{ left: 8, right: 16 }}>
        <CartesianGrid strokeDasharray="3 3" horizontal={false} />
        <XAxis type="number" allowDecimals={false} hide />
        <YAxis type="category" dataKey="name" width={100} tick={{ fontSize: 12 }} />
        <Tooltip formatter={(value) => [`${value} task${value === 1 ? '' : 's'}`, '']} />
        <Bar dataKey="value" radius={[0, 4, 4, 0]}>
          {data.map((d) => (
            <Cell key={d.name} fill={d.color || '#6366f1'} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}

export default function ProjectDashboard({ tasks, employees }) {
  if (tasks.length === 0) {
    return <p className="text-sm text-slate-400">No tasks yet.</p>
  }

  const done = tasks.filter((t) => t.status === 'done').length
  const overdue = tasks.filter(isOverdue).length
  const completionRate = Math.round((done / tasks.length) * 100)

  const workload = employees
    .map((e) => ({
      name: e.profile.full_name || e.profile.email,
      value: tasks.filter((t) => t.assignees.includes(e.id)).length,
    }))
    .filter((d) => d.value > 0)
    .sort((a, b) => b.value - a.value)

  const byPriority = TASK_PRIORITIES.map((p) => ({
    name: p.label,
    value: tasks.filter((t) => t.priority === p.value).length,
    color: p.color,
  })).filter((d) => d.value > 0)

  const byType = TASK_TYPES.map((t) => ({
    name: t.label,
    value: tasks.filter((task) => task.type === t.value).length,
    color: t.color,
  })).filter((d) => d.value > 0)

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard label="Total tasks" value={tasks.length} />
        <StatCard label="Completed" value={`${completionRate}%`} accent="text-green-600" />
        <StatCard label="Overdue" value={overdue} accent={overdue > 0 ? 'text-red-600' : 'text-slate-900'} />
        <StatCard label="Unassigned" value={tasks.filter((t) => t.assignees.length === 0).length} />
      </div>

      <div className="grid sm:grid-cols-2 gap-6">
        <div>
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Workload by assignee</p>
          <MiniBarChart data={workload} />
        </div>
        <div>
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">By priority</p>
          <MiniBarChart data={byPriority} />
        </div>
        <div>
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">By type</p>
          <MiniBarChart data={byType} />
        </div>
      </div>
    </div>
  )
}
