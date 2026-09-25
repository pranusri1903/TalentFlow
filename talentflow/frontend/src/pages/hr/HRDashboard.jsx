import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'

import StatusBadge from '../../components/StatusBadge'
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
    await api.post('/recruitment/jobs/', form)
    setForm(EMPTY_JOB)
    setShowForm(false)
    setSaving(false)
    loadJobs()
  }

  const toggleStatus = async (job) => {
    await api.patch(`/recruitment/jobs/${job.id}/`, { status: job.status === 'open' ? 'closed' : 'open' })
    loadJobs()
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900">Recruitment</h1>
        <button
          onClick={() => setShowForm((s) => !s)}
          className="bg-indigo-600 text-white rounded-lg px-4 py-2 font-medium hover:bg-indigo-700"
        >
          {showForm ? 'Cancel' : '+ Post a job'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white border border-slate-200 rounded-xl p-6 mt-6 space-y-3">
          <div className="grid sm:grid-cols-2 gap-3">
            <input name="title" required placeholder="Job title" value={form.title} onChange={handleChange} className="border border-slate-300 rounded-lg px-3 py-2" />
            <input name="department" placeholder="Department" value={form.department} onChange={handleChange} className="border border-slate-300 rounded-lg px-3 py-2" />
            <input name="location" placeholder="Location" value={form.location} onChange={handleChange} className="border border-slate-300 rounded-lg px-3 py-2" />
            <input name="employment_type" placeholder="Employment type (e.g. Full-time)" value={form.employment_type} onChange={handleChange} className="border border-slate-300 rounded-lg px-3 py-2" />
            <input name="salary_min" type="number" placeholder="Salary min" value={form.salary_min} onChange={handleChange} className="border border-slate-300 rounded-lg px-3 py-2" />
            <input name="salary_max" type="number" placeholder="Salary max" value={form.salary_max} onChange={handleChange} className="border border-slate-300 rounded-lg px-3 py-2" />
          </div>
          <input name="skills" placeholder="Skills (comma-separated)" value={form.skills} onChange={handleChange} className="w-full border border-slate-300 rounded-lg px-3 py-2" />
          <textarea name="description" required rows={4} placeholder="Job description" value={form.description} onChange={handleChange} className="w-full border border-slate-300 rounded-lg px-3 py-2" />
          <button disabled={saving} className="bg-indigo-600 text-white rounded-lg px-5 py-2.5 font-medium hover:bg-indigo-700 disabled:opacity-50">
            {saving ? 'Posting...' : 'Post job'}
          </button>
        </form>
      )}

      <div className="mt-6 space-y-3">
        {jobs.map((job) => (
          <div key={job.id} className="bg-white border border-slate-200 rounded-xl p-4 flex items-center justify-between gap-3">
            <div>
              <p className="font-semibold text-slate-900">{job.title}</p>
              <p className="text-xs text-slate-400">{job.department} · {job.location}</p>
            </div>
            <div className="flex items-center gap-3">
              <StatusBadge status={job.status} />
              <Link to={`/hr/jobs/${job.id}/applicants`} className="text-sm text-indigo-600 font-medium">
                Applicants
              </Link>
              <button onClick={() => toggleStatus(job)} className="text-sm text-slate-500 hover:text-slate-700">
                {job.status === 'open' ? 'Close' : 'Reopen'}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
