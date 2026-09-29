import { Search, SearchX } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'

import StatusBadge from '../../components/StatusBadge'
import EmptyState from '../../components/ui/EmptyState'
import PageHeader from '../../components/ui/PageHeader'
import Spinner from '../../components/ui/Spinner'
import { api } from '../../lib/api'

export default function JobsListPage() {
  const [jobs, setJobs] = useState([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const timeout = setTimeout(() => {
      setLoading(true)
      api
        .get('/recruitment/jobs/', { params: { search, status: 'open' } })
        .then(({ data }) => setJobs(data))
        .finally(() => setLoading(false))
    }, 300)
    return () => clearTimeout(timeout)
  }, [search])

  return (
    <div>
      <PageHeader title="Find your next role" subtitle="Open positions across every team" />

      <div className="relative mb-6">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
        <input
          placeholder="Search by title or skill..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full border border-slate-300 rounded-xl pl-11 pr-4 py-3 bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
      </div>

      {loading ? (
        <Spinner label="Loading jobs..." />
      ) : jobs.length === 0 ? (
        <EmptyState icon={SearchX} title="No open jobs match your search" description="Try a different keyword or check back later" />
      ) : (
        <div className="grid sm:grid-cols-2 gap-4">
          {jobs.map((job) => (
            <Link
              key={job.id}
              to={`/jobs/${job.id}`}
              className="block bg-white border border-slate-200 rounded-2xl shadow-sm shadow-slate-200/60 p-5 hover:shadow-md hover:border-indigo-200 transition"
            >
              <div className="flex items-start justify-between gap-2">
                <h2 className="font-semibold text-slate-900">{job.title}</h2>
                <StatusBadge status={job.status} />
              </div>
              <p className="text-sm text-slate-500 mt-1">
                {job.department} {job.location && `· ${job.location}`}
              </p>
              {job.skills && <p className="text-xs text-slate-400 mt-3 line-clamp-1">{job.skills}</p>}
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
