import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'

import StatusBadge from '../../components/StatusBadge'
import { useAuth } from '../../context/AuthContext'
import { api } from '../../lib/api'

const STATUSES = ['applied', 'shortlisted', 'interview', 'hired', 'rejected']

export default function JobApplicantsPage() {
  const { jobId } = useParams()
  const navigate = useNavigate()
  const { profile } = useAuth()
  const canChangeStatus = profile?.role === 'hr'
  const [applications, setApplications] = useState([])
  const [loading, setLoading] = useState(true)

  const load = () =>
    api.get(`/recruitment/jobs/${jobId}/applications/`).then(({ data }) => setApplications(data))

  useEffect(() => {
    load().finally(() => setLoading(false))
  }, [jobId])

  const updateStatus = async (appId, status) => {
    await api.patch(`/recruitment/applications/${appId}/status/`, { status })
    load()
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <button onClick={() => navigate(-1)} className="text-sm text-slate-500 hover:text-indigo-600 mb-4">
        ← Back to jobs
      </button>
      <h1 className="text-2xl font-bold text-slate-900">Applicants</h1>

      {loading ? (
        <p className="text-slate-500 mt-8">Loading...</p>
      ) : applications.length === 0 ? (
        <p className="text-slate-500 mt-8">No applications yet.</p>
      ) : (
        <div className="mt-6 space-y-3">
          {applications.map((app) => (
            <div key={app.id} className="bg-white border border-slate-200 rounded-xl p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-semibold text-slate-900">{app.candidate.full_name || app.candidate.email}</p>
                  <p className="text-xs text-slate-400">{app.candidate.email}</p>
                </div>
                <StatusBadge status={app.status} />
              </div>
              {app.cover_letter && <p className="text-sm text-slate-600 mt-2">{app.cover_letter}</p>}
              <div className="flex items-center flex-wrap gap-2 mt-3">
                <a href={app.resume} target="_blank" rel="noreferrer" className="text-sm text-indigo-600 font-medium">
                  View resume
                </a>
                {app.status === 'hired' ? (
                  <span className="ml-auto text-sm text-slate-400">Status locked</span>
                ) : !canChangeStatus ? (
                  <span className="ml-auto text-sm text-slate-400">Only HR can change status</span>
                ) : (
                  <select
                    value={app.status}
                    onChange={(e) => updateStatus(app.id, e.target.value)}
                    className="ml-auto border border-slate-300 rounded-lg px-2 py-1 text-sm"
                  >
                    {STATUSES.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
