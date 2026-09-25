import { Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts'

import { TASK_STATUSES } from '../lib/taskStatus'

export default function TaskStatusPieChart({ tasks }) {
  const data = TASK_STATUSES.map((s) => ({
    name: s.label,
    value: tasks.filter((t) => t.status === s.value).length,
    color: s.color,
  })).filter((d) => d.value > 0)

  if (tasks.length === 0) {
    return <p className="text-sm text-slate-400">No tasks yet.</p>
  }

  return (
    <ResponsiveContainer width="100%" height={220}>
      <PieChart>
        <Pie
          data={data}
          dataKey="value"
          nameKey="name"
          innerRadius={50}
          outerRadius={80}
          paddingAngle={2}
        >
          {data.map((d) => (
            <Cell key={d.name} fill={d.color} stroke="#fcfcfb" strokeWidth={2} />
          ))}
        </Pie>
        <Tooltip formatter={(value, name) => [`${value} task${value === 1 ? '' : 's'}`, name]} />
        <Legend verticalAlign="bottom" height={24} formatter={(name, entry) => `${name}: ${entry.payload.value}`} />
      </PieChart>
    </ResponsiveContainer>
  )
}
