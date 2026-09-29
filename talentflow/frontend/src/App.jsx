import { Navigate, Route, Routes } from 'react-router-dom'

import AppShell from './components/AppShell'
import ProtectedRoute from './components/ProtectedRoute'
import { useAuth } from './context/AuthContext'
import AdminDashboard from './pages/admin/AdminDashboard'
import AdminLeaveRequestsPage from './pages/admin/AdminLeaveRequestsPage'
import AdminProjectDetailPage from './pages/admin/AdminProjectDetailPage'
import AdminProjectsPage from './pages/admin/AdminProjectsPage'
import ChangePasswordPage from './pages/ChangePasswordPage'
import EmployeeDashboard from './pages/employee/EmployeeDashboard'
import HRDashboard from './pages/hr/HRDashboard'
import JobApplicantsPage from './pages/hr/JobApplicantsPage'
import JobDetailPage from './pages/jobseeker/JobDetailPage'
import JobsListPage from './pages/jobseeker/JobsListPage'
import MyApplicationsPage from './pages/jobseeker/MyApplicationsPage'
import LoginPage from './pages/LoginPage'
import SignupPage from './pages/SignupPage'

const HOME_BY_ROLE = { candidate: '/jobs', hr: '/hr', employee: '/employee', admin: '/admin' }

function RootRedirect() {
  const { session, profile } = useAuth()
  if (!session) return <Navigate to="/login" replace />
  if (!profile) return null
  if (profile.must_change_password) return <Navigate to="/change-password" replace />
  return <Navigate to={HOME_BY_ROLE[profile.role] || '/login'} replace />
}

function RedirectIfAuthed({ children }) {
  const { session, loading } = useAuth()
  if (loading) return null
  if (session) return <Navigate to="/" replace />
  return children
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<RedirectIfAuthed><LoginPage /></RedirectIfAuthed>} />
      <Route path="/signup" element={<RedirectIfAuthed><SignupPage /></RedirectIfAuthed>} />
      <Route path="/change-password" element={<ChangePasswordPage />} />
      <Route path="/" element={<RootRedirect />} />

      <Route path="/jobs" element={<ProtectedRoute roles={['candidate']}><AppShell><JobsListPage /></AppShell></ProtectedRoute>} />
      <Route path="/jobs/:id" element={<ProtectedRoute roles={['candidate']}><AppShell><JobDetailPage /></AppShell></ProtectedRoute>} />
      <Route path="/my-applications" element={<ProtectedRoute roles={['candidate']}><AppShell><MyApplicationsPage /></AppShell></ProtectedRoute>} />

      <Route path="/hr" element={<ProtectedRoute roles={['hr', 'admin']}><AppShell><HRDashboard /></AppShell></ProtectedRoute>} />
      <Route path="/hr/jobs/:jobId/applicants" element={<ProtectedRoute roles={['hr', 'admin']}><AppShell><JobApplicantsPage /></AppShell></ProtectedRoute>} />

      <Route path="/employee" element={<ProtectedRoute roles={['employee']}><AppShell><EmployeeDashboard /></AppShell></ProtectedRoute>} />

      <Route path="/admin" element={<ProtectedRoute roles={['admin']}><AppShell><AdminDashboard /></AppShell></ProtectedRoute>} />
      <Route path="/admin/projects" element={<ProtectedRoute roles={['admin']}><AppShell><AdminProjectsPage /></AppShell></ProtectedRoute>} />
      <Route path="/admin/projects/:id" element={<ProtectedRoute roles={['admin']} allowManagers><AppShell><AdminProjectDetailPage /></AppShell></ProtectedRoute>} />
      <Route path="/admin/leave" element={<ProtectedRoute roles={['admin']}><AppShell><AdminLeaveRequestsPage /></AppShell></ProtectedRoute>} />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
