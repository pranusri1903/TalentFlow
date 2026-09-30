import { Check, ClipboardList, X } from 'lucide-react'
import { useEffect, useState } from 'react'

import StatusBadge from './StatusBadge'
import Button from './ui/Button'
import Chip from './ui/Chip'
import EmptyState from './ui/EmptyState'
import { api } from '../lib/api'

const FILTERS = ['pending', 'approved', 'rejected', 'cancelled', 'all']

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
    const { data } = await api.patch(`/employees/leave/${id}/decision/`, { status })
    setRequests((rs) => (filter === 'all' ? rs.map((r) => (r.id === id ? data : r)) : rs.filter((r) => r.id !== id)))
  }

  return (
    <div>
      <div className="flex flex-wrap gap-2">
        {FILTERS.map((f) => (
          <Chip key={f} size="lg" capitalize active={filter === f} onClick={() => setFilter(f)}>
            {f}
          </Chip>
        ))}
      </div>

      {requests.length === 0 ? (
        <EmptyState icon={ClipboardList} title={`No ${filter !== 'all' ? filter : ''} leave requests`} />
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
                  <Button variant="success" size="sm" onClick={() => decide(r.id, 'approved')}>
                    <Check size={14} /> Approve
                  </Button>
                  <Button variant="danger" size="sm" onClick={() => decide(r.id, 'rejected')}>
                    <X size={14} /> Reject
                  </Button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
