import { Navigate } from 'react-router-dom'

import { useAuth } from '../context/AuthContext'

const HOME_BY_ROLE = {
  candidate: '/jobs',
  hr: '/hr',
  employee: '/employee',
  admin: '/admin',
}

export default function ProtectedRoute({ roles, children }) {
  const { session, profile, loading } = useAuth()

  if (loading) return <div className="p-10 text-center text-slate-500">Loading...</div>
  if (!session) return <Navigate to="/login" replace />
  if (!profile) return <div className="p-10 text-center text-slate-500">Setting up your account...</div>

  if (profile.must_change_password) return <Navigate to="/change-password" replace />
  if (roles && !roles.includes(profile.role)) {
    return <Navigate to={HOME_BY_ROLE[profile.role] || '/'} replace />
  }

  return children
}
