import { useEffect, useState } from 'react'

import StatusBadge from './StatusBadge'
import { api } from '../lib/api'

const FILTERS = ['pending', 'approved', 'rejected', 'all']

export default function LeaveRequestQueue() {
  const [requests, setRequests] = useState([])
  const [filter, setFilter] = useState('pending')

  const loadRequests = () =>
    api
      .get('/employees/leave/', { params: filter === 'all' ? {} : { status: filter } })
      .then(({ data }) => setRequests(data))

  useEffect(() => {
    loadRequests()
  }, [filter])

  const decide = async (id, status) => {
    await api.patch(`/employees/leave/${id}/decision/`, { status })
    loadRequests()
  }

  return (
    <div>
      <div className="flex flex-wrap gap-2">
        {FILTERS.map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`text-sm px-3 py-1.5 rounded-full border capitalize ${
              filter === f ? 'bg-indigo-600 text-white border-indigo-600' : 'border-slate-300 text-slate-600'
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      {requests.length === 0 ? (
        <p className="text-slate-500 mt-6 text-sm">No {filter !== 'all' && filter} leave requests.</p>
      ) : (
        <div className="mt-4 space-y-3">
          {requests.map((r) => (
            <div key={r.id} className="border border-slate-200 rounded-xl p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-semibold text-slate-900">{r.employee_name}</p>
                  <p className="text-sm text-slate-500">
                    {r.start_date} → {r.end_date} ({r.days} day{r.days === 1 ? '' : 's'})
                  </p>
                  <p className="text-sm text-slate-500 mt-1">{r.reason}</p>
                </div>
                <StatusBadge status={r.status} />
              </div>
              {r.status === 'pending' && (
                <div className="flex items-center gap-3 mt-3">
                  <button
                    onClick={() => decide(r.id, 'approved')}
                    className="text-sm bg-green-600 text-white rounded-lg px-3 py-1.5 font-medium hover:bg-green-700"
                  >
                    Approve
                  </button>
                  <button
                    onClick={() => decide(r.id, 'rejected')}
                    className="text-sm bg-red-600 text-white rounded-lg px-3 py-1.5 font-medium hover:bg-red-700"
                  >
                    Reject
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
