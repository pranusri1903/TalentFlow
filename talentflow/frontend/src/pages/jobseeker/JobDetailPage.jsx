import { ArrowLeft, CheckCircle2, MapPin, Wallet } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'

import StatusBadge from '../../components/StatusBadge'
import Button from '../../components/ui/Button'
import Card from '../../components/ui/Card'
import Spinner from '../../components/ui/Spinner'
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

  if (!job) return <Spinner />

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <button onClick={() => navigate(-1)} className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-indigo-600">
        <ArrowLeft size={16} /> Back
      </button>

      <Card>
        <div className="flex items-start justify-between gap-2">
          <h1 className="text-xl font-bold text-slate-900">{job.title}</h1>
          <StatusBadge status={job.status} />
        </div>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-slate-500 mt-2">
          {job.location && (
            <span className="flex items-center gap-1">
              <MapPin size={14} /> {job.location}
            </span>
          )}
          {job.department && <span>{job.department}</span>}
          {job.employment_type && <span>{job.employment_type}</span>}
          {(job.salary_min || job.salary_max) && (
            <span className="flex items-center gap-1">
              <Wallet size={14} /> ₹{job.salary_min ?? '–'} - ₹{job.salary_max ?? '–'}
            </span>
          )}
        </div>
        <p className="text-slate-700 mt-4 whitespace-pre-line leading-relaxed">{job.description}</p>
        {job.skills && (
          <div className="flex flex-wrap gap-2 mt-4">
            {job.skills.split(',').map((s) => (
              <span key={s} className="text-xs bg-indigo-50 text-indigo-700 px-2.5 py-1 rounded-full">
                {s.trim()}
              </span>
            ))}
          </div>
        )}
      </Card>

      <Card>
        {applied ? (
          <div className="flex items-center gap-2 text-green-700 font-medium">
            <CheckCircle2 size={20} /> Application submitted! Track it under My Applications.
          </div>
        ) : job.status !== 'open' ? (
          <p className="text-slate-500">This job is no longer accepting applications.</p>
        ) : (
          <form onSubmit={handleApply} className="space-y-4">
            <h2 className="font-semibold text-slate-900">Apply for this job</h2>
            <div className="flex items-center gap-3">
              <label className="cursor-pointer bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-medium rounded-lg px-4 py-2.5 transition">
                Choose resume file
                <input
                  type="file"
                  required
                  accept=".pdf,.doc,.docx"
                  onChange={(e) => setResume(e.target.files[0])}
                  className="hidden"
                />
              </label>
              <span className="text-sm text-slate-500">{resume ? resume.name : 'No file chosen'}</span>
            </div>
            <textarea
              placeholder="Cover letter (optional)"
              value={coverLetter}
              onChange={(e) => setCoverLetter(e.target.value)}
              rows={4}
              className="w-full border border-slate-300 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            {error && <p className="text-red-600 text-sm">{error}</p>}
            <Button disabled={submitting}>{submitting ? 'Submitting...' : 'Submit application'}</Button>
          </form>
        )}
      </Card>
    </div>
  )
}
