import { Briefcase, CalendarDays, FileText, FolderKanban, LayoutDashboard, Search, Users } from 'lucide-react'

export const HOME_BY_ROLE = { candidate: '/jobs', hr: '/hr', employee: '/employee', admin: '/admin' }

export const NAV_BY_ROLE = {
  candidate: [
    { to: '/jobs', label: 'Browse Jobs', icon: Briefcase },
    { to: '/my-applications', label: 'My Applications', icon: FileText },
  ],
  hr: [{ to: '/hr', label: 'Recruitment', icon: Users, end: true }],
  employee: [
    { to: '/employee', label: 'My Workspace', icon: LayoutDashboard, end: true },
    { to: '/search', label: 'Search', icon: Search },
  ],
  admin: [
    { to: '/admin', label: 'Users', icon: Users, end: true },
    { to: '/admin/projects', label: 'Projects', icon: FolderKanban },
    { to: '/admin/leave', label: 'Leave', icon: CalendarDays },
    { to: '/search', label: 'Search', icon: Search },
  ],
}
