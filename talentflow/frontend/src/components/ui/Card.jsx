export default function Card({ title, action, children, className = '' }) {
  return (
    <div className={`bg-white border border-slate-200 rounded-2xl shadow-sm shadow-slate-200/60 p-6 ${className}`}>
      {(title || action) && (
        <div className="flex items-center justify-between mb-4 gap-3">
          {title && <h2 className="font-semibold text-slate-900">{title}</h2>}
          {action}
        </div>
      )}
      {children}
    </div>
  )
}
