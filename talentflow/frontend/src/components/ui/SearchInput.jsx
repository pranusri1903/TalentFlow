import { Search } from 'lucide-react'

const SIZES = {
  sm: 'pl-8 pr-2 py-1.5 text-xs rounded-lg',
  md: 'pl-8 pr-3 py-2 text-sm rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500',
}

export default function SearchInput({ value, onChange, placeholder, size = 'md', autoFocus }) {
  return (
    <div className="relative flex-1 min-w-[160px]">
      <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
      <input
        autoFocus={autoFocus}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        className={`w-full border border-slate-300 ${SIZES[size]}`}
      />
    </div>
  )
}
