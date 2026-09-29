import { Layers } from 'lucide-react'

export default function AuthLayout({ title, subtitle, children }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-600 to-violet-700 px-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl shadow-indigo-950/20 p-8">
        <div className="w-11 h-11 rounded-xl bg-indigo-600 text-white flex items-center justify-center mb-5">
          <Layers size={22} />
        </div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">{title}</h1>
        {subtitle && <p className="text-slate-500 text-sm mt-1">{subtitle}</p>}
        <div className="mt-6">{children}</div>
      </div>
    </div>
  )
}
