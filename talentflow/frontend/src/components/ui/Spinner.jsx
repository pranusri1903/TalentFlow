import { Loader2 } from 'lucide-react'

export default function Spinner({ label = 'Loading...' }) {
  return (
    <div className="flex items-center justify-center gap-2 text-slate-400 py-16">
      <Loader2 className="w-5 h-5 animate-spin" />
      <span className="text-sm">{label}</span>
    </div>
  )
}
