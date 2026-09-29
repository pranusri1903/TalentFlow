import { Briefcase, Plus, Users, X } from 'lucide-react'
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

export default function HRDashboard() {
  const [jobs, setJobs] = useState([])
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState(EMPTY_JOB)
  const [saving, setSaving] = useState(false)

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

      {jobs.length === 0 ? (
        <EmptyState icon={Briefcase} title="No jobs posted yet" description="Click Post a job to open your first role" />
      ) : (
        <div className="space-y-3">
          {jobs.map((job) => (
            <div
              key={job.id}
              className="bg-white border border-slate-200 rounded-2xl shadow-sm shadow-slate-200/60 p-4 flex items-center justify-between gap-3 flex-wrap"
            >
              <div>
                <p className="font-semibold text-slate-900">{job.title}</p>
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
