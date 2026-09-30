const SIZES = {
  sm: 'text-xs px-2 py-1',
  md: 'text-xs px-2.5 py-1',
  lg: 'text-sm px-3 py-1.5',
}

export default function Chip({ active, size = 'md', capitalize = false, className = '', ...props }) {
  return (
    <button
      type="button"
      className={`${SIZES[size]} rounded-full border transition ${capitalize ? 'capitalize' : ''} ${
        active ? 'bg-indigo-600 text-white border-indigo-600' : 'border-slate-300 text-slate-600 hover:bg-slate-50'
      } ${className}`}
      {...props}
    />
  )
}
