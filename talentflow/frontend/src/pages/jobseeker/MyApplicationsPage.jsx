import { FileStack } from 'lucide-react'
import { useEffect, useState } from 'react'

import StatusBadge from '../../components/StatusBadge'
import EmptyState from '../../components/ui/EmptyState'
import PageHeader from '../../components/ui/PageHeader'
import Spinner from '../../components/ui/Spinner'
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
    <div>
      <PageHeader title="My Applications" />

      {loading ? (
        <Spinner />
      ) : applications.length === 0 ? (
        <EmptyState icon={FileStack} title="You haven't applied to any jobs yet" description="Browse open roles to get started" />
      ) : (
        <div className="space-y-3">
          {applications.map((app) => (
            <div
              key={app.id}
              className="bg-white border border-slate-200 rounded-2xl shadow-sm shadow-slate-200/60 p-4 flex items-center justify-between"
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
