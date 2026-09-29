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
  pending: 'bg-amber-100 text-amber-700',
  approved: 'bg-green-100 text-green-700',
  cancelled: 'bg-slate-100 text-slate-500',
}

const DOTS = {
  applied: 'bg-slate-400',
  shortlisted: 'bg-blue-500',
  interview: 'bg-amber-500',
  hired: 'bg-green-500',
  rejected: 'bg-red-500',
  open: 'bg-green-500',
  closed: 'bg-slate-400',
  todo: 'bg-slate-400',
  in_progress: 'bg-blue-500',
  review: 'bg-amber-500',
  done: 'bg-green-500',
  pending: 'bg-amber-500',
  approved: 'bg-green-500',
  cancelled: 'bg-slate-400',
}

export default function StatusBadge({ status }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold capitalize ${
        COLORS[status] || 'bg-slate-100 text-slate-700'
      }`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${DOTS[status] || 'bg-slate-400'}`} />
      {status?.replace('_', ' ')}
    </span>
  )
}
