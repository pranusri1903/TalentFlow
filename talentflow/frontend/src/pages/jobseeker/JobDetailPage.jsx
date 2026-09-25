import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'

import StatusBadge from '../../components/StatusBadge'
import { api } from '../../lib/api'

export default function JobDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [job, setJob] = useState(null)
  const [resume, setResume] = useState(null)
  const [coverLetter, setCoverLetter] = useState('')
  const [error, setError] = useState('')
  const [applied, setApplied] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    api.get(`/recruitment/jobs/${id}/`).then(({ data }) => setJob(data))
  }, [id])

  const handleApply = async (e) => {
    e.preventDefault()
    setError('')
    setSubmitting(true)
    const formData = new FormData()
    formData.append('resume', resume)
    formData.append('cover_letter', coverLetter)
    try {
      await api.post(`/recruitment/jobs/${id}/apply/`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      setApplied(true)
    } catch (err) {
      setError(err.response?.data?.detail || 'Could not submit application.')
    } finally {
      setSubmitting(false)
    }
  }

  if (!job) return <p className="p-8 text-center text-slate-500">Loading...</p>

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <button onClick={() => navigate(-1)} className="text-sm text-slate-500 hover:text-indigo-600 mb-4">
        ← Back
      </button>

      <div className="bg-white border border-slate-200 rounded-xl p-6">
        <div className="flex items-start justify-between gap-2">
          <h1 className="text-xl font-bold text-slate-900">{job.title}</h1>
          <StatusBadge status={job.status} />
        </div>
        <p className="text-sm text-slate-500 mt-1">
          {job.department} {job.location && `· ${job.location}`} {job.employment_type && `· ${job.employment_type}`}
        </p>
        {(job.salary_min || job.salary_max) && (
          <p className="text-sm text-slate-500 mt-1">
            ₹{job.salary_min ?? '–'} - ₹{job.salary_max ?? '–'}
          </p>
        )}
        <p className="text-slate-700 mt-4 whitespace-pre-line">{job.description}</p>
        {job.skills && <p className="text-sm text-slate-500 mt-4">Skills: {job.skills}</p>}
      </div>

      <div className="bg-white border border-slate-200 rounded-xl p-6 mt-6">
        {applied ? (
          <p className="text-green-700 font-medium">Application submitted! Track it under My Applications.</p>
        ) : job.status !== 'open' ? (
          <p className="text-slate-500">This job is no longer accepting applications.</p>
        ) : (
          <form onSubmit={handleApply} className="space-y-4">
            <h2 className="font-semibold text-slate-900">Apply for this job</h2>
            <input
              type="file"
              required
              accept=".pdf,.doc,.docx"
              onChange={(e) => setResume(e.target.files[0])}
              className="w-full text-sm"
            />
            <textarea
              placeholder="Cover letter (optional)"
              value={coverLetter}
              onChange={(e) => setCoverLetter(e.target.value)}
              rows={4}
              className="w-full border border-slate-300 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            {error && <p className="text-red-600 text-sm">{error}</p>}
            <button
              disabled={submitting}
              className="bg-indigo-600 text-white rounded-lg px-5 py-2.5 font-medium hover:bg-indigo-700 disabled:opacity-50"
            >
              {submitting ? 'Submitting...' : 'Submit application'}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
