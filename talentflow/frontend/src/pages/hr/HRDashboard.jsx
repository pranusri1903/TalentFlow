import { Briefcase, Plus, Search, Users, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'

import StatusBadge from '../../components/StatusBadge'
import Button from '../../components/ui/Button'
import Card from '../../components/ui/Card'
import EmptyState from '../../components/ui/EmptyState'
import PageHeader from '../../components/ui/PageHeader'
import { api } from '../../lib/api'

const EMPTY_JOB = {
  title: '', department: '', location: '', employment_type: '',
  description: '', skills: '', salary_min: '', salary_max: '',
}
const EMPTY_FILTERS = { search: '', status: '', department: '' }

export default function HRDashboard() {
  const [jobs, setJobs] = useState([])
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState(EMPTY_JOB)
  const [saving, setSaving] = useState(false)
  const [filters, setFilters] = useState(EMPTY_FILTERS)

  const loadJobs = () => api.get('/recruitment/jobs/').then(({ data }) => setJobs(data))

  useEffect(() => {
    loadJobs()
  }, [])

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value })

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    const { data } = await api.post('/recruitment/jobs/', form)
    setForm(EMPTY_JOB)
    setShowForm(false)
    setSaving(false)
    setJobs((js) => [data, ...js])
  }

  const toggleStatus = async (job) => {
    const { data } = await api.patch(`/recruitment/jobs/${job.id}/`, { status: job.status === 'open' ? 'closed' : 'open' })
    setJobs((js) => js.map((j) => (j.id === job.id ? data : j)))
  }

  const q = filters.search.trim().toLowerCase()
  const filteredJobs = jobs
    .filter((j) => !q || j.title.toLowerCase().includes(q) || j.job_code?.toLowerCase().includes(q))
    .filter((j) => !filters.status || j.status === filters.status)
    .filter((j) => !filters.department || j.department === filters.department)

  const allDepartments = [...new Set(jobs.map((j) => j.department).filter(Boolean))]

  return (
    <div>
      <PageHeader
        title="Recruitment"
        subtitle="Post openings and manage your hiring pipeline"
        action={
          <Button onClick={() => setShowForm((s) => !s)}>
            {showForm ? <X size={16} /> : <Plus size={16} />}
            {showForm ? 'Cancel' : 'Post a job'}
          </Button>
        }
      />

      {showForm && (
        <Card className="mb-6">
          <form onSubmit={handleSubmit} className="space-y-3">
            <div className="grid sm:grid-cols-2 gap-3">
              <input name="title" required placeholder="Job title" value={form.title} onChange={handleChange} className="border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500" />
              <input name="department" placeholder="Department" value={form.department} onChange={handleChange} className="border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500" />
              <input name="location" placeholder="Location" value={form.location} onChange={handleChange} className="border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500" />
              <input name="employment_type" placeholder="Employment type (e.g. Full-time)" value={form.employment_type} onChange={handleChange} className="border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500" />
              <input name="salary_min" type="number" placeholder="Salary min" value={form.salary_min} onChange={handleChange} className="border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500" />
              <input name="salary_max" type="number" placeholder="Salary max" value={form.salary_max} onChange={handleChange} className="border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            </div>
            <input name="skills" placeholder="Skills (comma-separated)" value={form.skills} onChange={handleChange} className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            <textarea name="description" required rows={4} placeholder="Job description" value={form.description} onChange={handleChange} className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            <Button disabled={saving}>{saving ? 'Posting...' : 'Post job'}</Button>
          </form>
        </Card>
      )}

      {jobs.length > 0 && (
        <div className="flex flex-wrap items-center gap-2 mb-4">
          <div className="relative flex-1 min-w-[200px]">
            <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              placeholder="Search by title or job ID..."
              value={filters.search}
              onChange={(e) => setFilters({ ...filters, search: e.target.value })}
              className="w-full border border-slate-300 rounded-lg pl-8 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <select
            value={filters.status}
            onChange={(e) => setFilters({ ...filters, status: e.target.value })}
            className="border border-slate-300 rounded-lg px-2 py-2 text-sm"
          >
            <option value="">All statuses</option>
            <option value="open">Open</option>
            <option value="closed">Closed</option>
          </select>
          {allDepartments.length > 0 && (
            <select
              value={filters.department}
              onChange={(e) => setFilters({ ...filters, department: e.target.value })}
              className="border border-slate-300 rounded-lg px-2 py-2 text-sm"
            >
              <option value="">All departments</option>
              {allDepartments.map((d) => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          )}
        </div>
      )}

      {jobs.length === 0 ? (
        <EmptyState icon={Briefcase} title="No jobs posted yet" description="Click Post a job to open your first role" />
      ) : filteredJobs.length === 0 ? (
        <EmptyState icon={Briefcase} title="No jobs match these filters" />
      ) : (
        <div className="space-y-3">
          {filteredJobs.map((job) => (
            <div
              key={job.id}
              className="bg-white border border-slate-200 rounded-2xl shadow-sm shadow-slate-200/60 p-4 flex items-center justify-between gap-3 flex-wrap"
            >
              <div>
                <p className="font-semibold text-slate-900">
                  {job.title}
                  {job.job_code && <span className="font-normal text-slate-400"> ({job.job_code})</span>}
                </p>
                <p className="text-xs text-slate-400">{job.department} · {job.location}</p>
              </div>
              <div className="flex items-center gap-4">
                <StatusBadge status={job.status} />
                <Link to={`/hr/jobs/${job.id}/applicants`} className="flex items-center gap-1.5 text-sm text-indigo-600 font-medium hover:text-indigo-700">
                  <Users size={15} /> Applicants
                </Link>
                <button onClick={() => toggleStatus(job)} className="text-sm text-slate-500 hover:text-slate-700">
                  {job.status === 'open' ? 'Close' : 'Reopen'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
