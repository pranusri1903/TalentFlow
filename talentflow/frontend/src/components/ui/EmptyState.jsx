export default function EmptyState({ icon: Icon, title, description }) {
  return (
    <div className="text-center py-10">
      {Icon && <Icon className="w-9 h-9 text-slate-300 mx-auto mb-3" strokeWidth={1.5} />}
      <p className="text-sm font-medium text-slate-500">{title}</p>
      {description && <p className="text-xs text-slate-400 mt-1">{description}</p>}
    </div>
  )
}
