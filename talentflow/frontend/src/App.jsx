import { Navigate, Route, Routes } from 'react-router-dom'

import Navbar from './components/Navbar'
import ProtectedRoute from './components/ProtectedRoute'
import { useAuth } from './context/AuthContext'
import AdminDashboard from './pages/admin/AdminDashboard'
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
  return <Navigate to={HOME_BY_ROLE[profile.role] || '/login'} replace />
}

function Layout({ children }) {
  return (
    <div className="min-h-screen">
      <Navbar />
      {children}
    </div>
  )
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/signup" element={<SignupPage />} />
      <Route path="/change-password" element={<ChangePasswordPage />} />
      <Route path="/" element={<RootRedirect />} />

      <Route path="/jobs" element={<ProtectedRoute roles={['candidate']}><Layout><JobsListPage /></Layout></ProtectedRoute>} />
      <Route path="/jobs/:id" element={<ProtectedRoute roles={['candidate']}><Layout><JobDetailPage /></Layout></ProtectedRoute>} />
      <Route path="/my-applications" element={<ProtectedRoute roles={['candidate']}><Layout><MyApplicationsPage /></Layout></ProtectedRoute>} />

      <Route path="/hr" element={<ProtectedRoute roles={['hr', 'admin']}><Layout><HRDashboard /></Layout></ProtectedRoute>} />
      <Route path="/hr/jobs/:jobId/applicants" element={<ProtectedRoute roles={['hr', 'admin']}><Layout><JobApplicantsPage /></Layout></ProtectedRoute>} />

      <Route path="/employee" element={<ProtectedRoute roles={['employee']}><Layout><EmployeeDashboard /></Layout></ProtectedRoute>} />

      <Route path="/admin" element={<ProtectedRoute roles={['admin']}><Layout><AdminDashboard /></Layout></ProtectedRoute>} />
      <Route path="/admin/projects" element={<ProtectedRoute roles={['admin']}><Layout><AdminProjectsPage /></Layout></ProtectedRoute>} />
      <Route path="/admin/projects/:id" element={<ProtectedRoute roles={['admin']}><Layout><AdminProjectDetailPage /></Layout></ProtectedRoute>} />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
