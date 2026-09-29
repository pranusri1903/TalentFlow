import LeaveRequestQueue from '../../components/LeaveRequestQueue'
import PageHeader from '../../components/ui/PageHeader'

export default function AdminLeaveRequestsPage() {
  return (
    <div>
      <PageHeader title="Leave Requests" subtitle="Review and decide on time-off requests" />
      <LeaveRequestQueue />
    </div>
  )
}
