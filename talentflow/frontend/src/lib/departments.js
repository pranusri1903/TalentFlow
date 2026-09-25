export const DEPARTMENTS = [
  { value: 'development', label: 'Development' },
  { value: 'designing', label: 'Designing' },
  { value: 'hr', label: 'Hr' },
  { value: 'sales', label: 'Sales' },
  { value: 'other', label: 'Other' },
]

export const departmentLabel = (value) => DEPARTMENTS.find((d) => d.value === value)?.label || value
