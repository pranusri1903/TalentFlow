import { useEffect, useState } from 'react'

import StatusBadge from '../../components/StatusBadge'
import { api } from '../../lib/api'

export default function MyApplicationsPage() {
  const [applications, setApplications] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api
      .get('/recruitment/my-applications/')
      .then(({ data }) => setApplications(data))
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-slate-900">My Applications</h1>

      {loading ? (
        <p className="text-slate-500 mt-8">Loading...</p>
      ) : applications.length === 0 ? (
        <p className="text-slate-500 mt-8">You haven't applied to any jobs yet.</p>
      ) : (
        <div className="mt-6 space-y-3">
          {applications.map((app) => (
            <div
              key={app.id}
              className="bg-white border border-slate-200 rounded-xl p-4 flex items-center justify-between"
            >
              <div>
                <p className="font-semibold text-slate-900">{app.job_title}</p>
                <p className="text-xs text-slate-400">Applied {new Date(app.applied_at).toLocaleDateString()}</p>
              </div>
              <StatusBadge status={app.status} />
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
