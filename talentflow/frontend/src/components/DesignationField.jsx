import { useState } from 'react'

export const DESIGNATIONS_BY_DEPARTMENT = {
  development: ['SDE 1', 'SDE 2', 'SDE 3', 'Manager'],
  designing: ['Junior Designer', 'Senior Designer', 'Lead Designer', 'Manager'],
  hr: ['Junior HR', 'Senior HR', 'HR Manager'],
  sales: ['Sales Support', 'Associate Sales Manager', 'Regional Head'],
  other: [],
}

export default function DesignationField({ department, value, onChange, live = false }) {
  const presets = DESIGNATIONS_BY_DEPARTMENT[department] || []
  const isPreset = presets.includes(value)
  const [showCustom, setShowCustom] = useState(presets.length === 0 || (!!value && !isPreset))
  const commit = live ? { onChange: (e) => onChange(e.target.value) } : { onBlur: (e) => onChange(e.target.value) }

  if (presets.length === 0) {
    return (
      <input
        placeholder="Designation"
        {...(live ? { value } : { defaultValue: value })}
        {...commit}
        className="border border-slate-300 rounded-lg px-2 py-1 text-sm w-40"
      />
    )
  }

  return (
    <div className="flex items-center gap-2">
      <select
        value={showCustom ? 'Other' : value || ''}
        onChange={(e) => {
          if (e.target.value === 'Other') {
            setShowCustom(true)
            if (live) onChange('')
          } else {
            setShowCustom(false)
            onChange(e.target.value)
          }
        }}
        className="border border-slate-300 rounded-lg px-2 py-1 text-sm"
      >
        <option value="">Designation</option>
        {presets.map((d) => (
          <option key={d} value={d}>
            {d}
          </option>
        ))}
        <option value="Other">Other</option>
      </select>
      {showCustom && (
        <input
          placeholder="Custom designation"
          {...(live ? { value } : { defaultValue: isPreset ? '' : value })}
          {...commit}
          className="border border-slate-300 rounded-lg px-2 py-1 text-sm w-32"
        />
      )}
    </div>
  )
}
