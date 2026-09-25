import { useState } from 'react'
import { NavLink } from 'react-router-dom'

import { useAuth } from '../context/AuthContext'

const LINKS_BY_ROLE = {
  candidate: [
    { to: '/jobs', label: 'Browse Jobs' },
    { to: '/my-applications', label: 'My Applications' },
  ],
  hr: [{ to: '/hr', label: 'Recruitment' }],
  employee: [{ to: '/employee', label: 'My Workspace' }],
  admin: [
    { to: '/admin', label: 'Users' },
    { to: '/admin/projects', label: 'Projects' },
  ],
}

export default function Navbar() {
  const { profile, signOut } = useAuth()
  const [open, setOpen] = useState(false)
  const links = profile ? LINKS_BY_ROLE[profile.role] || [] : []

  return (
    <nav className="bg-white border-b border-slate-200 sticky top-0 z-10">
      <div className="max-w-6xl mx-auto px-4 flex items-center justify-between h-14">
        <span className="font-bold text-lg text-indigo-600">TalentFlow</span>

        <div className="hidden md:flex items-center gap-6">
          {links.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.to !== '/hr' && link.to !== '/admin' ? undefined : true}
              className={({ isActive }) =>
                `text-sm font-medium ${isActive ? 'text-indigo-600' : 'text-slate-600 hover:text-indigo-600'}`
              }
            >
              {link.label}
            </NavLink>
          ))}
          {profile && (
            <button onClick={signOut} className="text-sm font-medium text-slate-500 hover:text-red-600">
              Sign out
            </button>
          )}
        </div>

        <button className="md:hidden text-slate-600" onClick={() => setOpen((o) => !o)}>
          ☰
        </button>
      </div>

      {open && (
        <div className="md:hidden border-t border-slate-200 px-4 py-3 flex flex-col gap-3">
          {links.map((link) => (
            <NavLink key={link.to} to={link.to} onClick={() => setOpen(false)} className="text-sm text-slate-700">
              {link.label}
            </NavLink>
          ))}
          {profile && (
            <button onClick={signOut} className="text-sm text-left text-red-600">
              Sign out
            </button>
          )}
        </div>
      )}
    </nav>
  )
}
