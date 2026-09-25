const COLORS = {
  applied: 'bg-slate-100 text-slate-700',
  shortlisted: 'bg-blue-100 text-blue-700',
  interview: 'bg-amber-100 text-amber-700',
  hired: 'bg-green-100 text-green-700',
  rejected: 'bg-red-100 text-red-700',
  open: 'bg-green-100 text-green-700',
  closed: 'bg-slate-100 text-slate-500',
  todo: 'bg-slate-100 text-slate-700',
  in_progress: 'bg-blue-100 text-blue-700',
  review: 'bg-amber-100 text-amber-700',
  done: 'bg-green-100 text-green-700',
}

export default function StatusBadge({ status }) {
  return (
    <span className={`px-2.5 py-1 rounded-full text-xs font-semibold capitalize ${COLORS[status] || 'bg-slate-100 text-slate-700'}`}>
      {status?.replace('_', ' ')}
    </span>
  )
}
