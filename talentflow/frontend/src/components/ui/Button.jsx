const VARIANTS = {
  primary: 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-sm shadow-indigo-200',
  danger: 'bg-red-600 text-white hover:bg-red-700 shadow-sm shadow-red-200',
  success: 'bg-green-600 text-white hover:bg-green-700 shadow-sm shadow-green-200',
  ghost: 'text-slate-500 hover:bg-slate-100',
}

const SIZES = {
  sm: 'text-xs px-2.5 py-1.5 rounded-lg gap-1.5',
  md: 'text-sm px-4 py-2 rounded-lg gap-2',
}

export default function Button({ variant = 'primary', size = 'md', className = '', ...props }) {
  return (
    <button
      className={`inline-flex items-center justify-center font-medium transition disabled:opacity-50 disabled:cursor-not-allowed ${VARIANTS[variant]} ${SIZES[size]} ${className}`}
      {...props}
    />
  )
}
