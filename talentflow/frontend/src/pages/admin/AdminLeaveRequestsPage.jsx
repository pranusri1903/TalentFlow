import LeaveRequestQueue from '../../components/LeaveRequestQueue'

export default function AdminLeaveRequestsPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-slate-900 mb-4">Leave Requests</h1>
      <LeaveRequestQueue />
    </div>
  )
}
