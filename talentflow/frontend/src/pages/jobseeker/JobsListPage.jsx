import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'

import StatusBadge from '../../components/StatusBadge'
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
    <div className="max-w-5xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-slate-900">Find your next role</h1>
      <input
        placeholder="Search by title or skill..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="w-full mt-4 border border-slate-300 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500"
      />

      {loading ? (
        <p className="text-slate-500 mt-8">Loading jobs...</p>
      ) : jobs.length === 0 ? (
        <p className="text-slate-500 mt-8">No open jobs match your search.</p>
      ) : (
        <div className="grid sm:grid-cols-2 gap-4 mt-6">
          {jobs.map((job) => (
            <Link
              key={job.id}
              to={`/jobs/${job.id}`}
              className="block bg-white border border-slate-200 rounded-xl p-5 hover:shadow-md transition"
            >
              <div className="flex items-start justify-between gap-2">
                <h2 className="font-semibold text-slate-900">{job.title}</h2>
                <StatusBadge status={job.status} />
              </div>
              <p className="text-sm text-slate-500 mt-1">
                {job.department} {job.location && `· ${job.location}`}
              </p>
              {job.skills && (
                <p className="text-xs text-slate-400 mt-3 line-clamp-1">{job.skills}</p>
              )}
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
