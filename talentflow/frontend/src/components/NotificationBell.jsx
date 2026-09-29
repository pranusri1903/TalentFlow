import { Bell, BellOff } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'

import { api } from '../lib/api'

const POLL_INTERVAL_MS = 30000

export default function NotificationBell() {
  const [unreadCount, setUnreadCount] = useState(0)
  const [notifications, setNotifications] = useState([])
  const [open, setOpen] = useState(false)
  const containerRef = useRef(null)
  const navigate = useNavigate()

  const loadUnreadCount = () =>
    api.get('/accounts/notifications/unread-count/').then(({ data }) => setUnreadCount(data.count))

  useEffect(() => {
    loadUnreadCount()
    const interval = setInterval(loadUnreadCount, POLL_INTERVAL_MS)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const toggleOpen = () => {
    setOpen((o) => !o)
    if (!open) api.get('/accounts/notifications/').then(({ data }) => setNotifications(data))
  }

  const handleClickNotification = async (n) => {
    if (!n.is_read) {
      await api.post(`/accounts/notifications/${n.id}/read/`)
      setUnreadCount((c) => Math.max(0, c - 1))
    }
    setOpen(false)
    if (n.link) navigate(n.link)
  }

  const markAllRead = async () => {
    await api.post('/accounts/notifications/mark-all-read/')
    setNotifications((list) => list.map((n) => ({ ...n, is_read: true })))
    setUnreadCount(0)
  }

  return (
    <div ref={containerRef} className="relative">
      <button onClick={toggleOpen} className="relative text-slate-500 hover:text-indigo-600 p-1.5 rounded-lg hover:bg-slate-100 transition">
        <Bell size={20} />
        {unreadCount > 0 && (
          <span className="absolute top-0.5 right-0.5 bg-red-500 text-white text-[10px] leading-none rounded-full min-w-[16px] h-4 px-1 flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-80 bg-white border border-slate-200 rounded-2xl shadow-lg shadow-slate-200/60 z-20 max-h-96 overflow-y-auto">
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
            <span className="text-sm font-semibold text-slate-900">Notifications</span>
            {notifications.some((n) => !n.is_read) && (
              <button onClick={markAllRead} className="text-xs text-indigo-600 font-medium hover:text-indigo-700">
                Mark all read
              </button>
            )}
          </div>
          {notifications.length === 0 ? (
            <div className="text-center py-8">
              <BellOff className="w-7 h-7 text-slate-300 mx-auto mb-2" strokeWidth={1.5} />
              <p className="text-sm text-slate-400">No notifications yet</p>
            </div>
          ) : (
            notifications.map((n) => (
              <button
                key={n.id}
                onClick={() => handleClickNotification(n)}
                className={`block w-full text-left px-4 py-3 border-b border-slate-50 last:border-0 hover:bg-slate-50 ${
                  n.is_read ? '' : 'bg-indigo-50/50'
                }`}
              >
                <p className="text-sm text-slate-700">{n.message}</p>
                <p className="text-xs text-slate-400 mt-1">{new Date(n.created_at).toLocaleString()}</p>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  )
}
