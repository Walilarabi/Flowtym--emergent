import { useState, useEffect, useRef } from 'react'
import { Bell, X, Check, Info, AlertTriangle, CheckCircle } from 'lucide-react'
import { onNotification, startRealtimeNotifications } from '@/lib/notificationService'
import { useHotel } from '@/context/HotelContext'

const typeIcons = {
  success: CheckCircle,
  warning: AlertTriangle,
  info: Info,
}

const typeColors = {
  success: { bg: '#D1FAE5', text: '#065F46', border: '#10B981' },
  warning: { bg: '#FEF3C7', text: '#92400E', border: '#F59E0B' },
  info: { bg: '#DBEAFE', text: '#1E40AF', border: '#3B82F6' },
}

export const NotificationBell = () => {
  const { currentHotel } = useHotel()
  const [notifications, setNotifications] = useState([])
  const [isOpen, setIsOpen] = useState(false)
  const panelRef = useRef(null)

  const unreadCount = notifications.filter(n => !n.read).length

  useEffect(() => {
    if (!currentHotel?.id) return
    const unsub = startRealtimeNotifications(currentHotel.id)
    return unsub
  }, [currentHotel?.id])

  useEffect(() => {
    const unsub = onNotification((notif) => {
      setNotifications(prev => [notif, ...prev].slice(0, 30))
    })
    return unsub
  }, [])

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (panelRef.current && !panelRef.current.contains(e.target)) setIsOpen(false)
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const markAllRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })))
  }

  const clearAll = () => {
    setNotifications([])
    setIsOpen(false)
  }

  return (
    <div className="relative" ref={panelRef}>
      <button
        onClick={() => { setIsOpen(!isOpen); if (!isOpen) markAllRead(); }}
        className="p-2 rounded-lg relative transition-all duration-150 hover:bg-slate-100"
        style={{ color: '#6B7280' }}
        data-testid="notification-bell"
      >
        <Bell className="w-4 h-4" />
        {unreadCount > 0 && (
          <span
            className="absolute top-1 right-1 w-4 h-4 rounded-full text-white text-[9px] font-bold flex items-center justify-center animate-pulse"
            style={{ background: '#EF4444' }}
          >
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div
          className="absolute right-0 top-full mt-2 bg-white rounded-xl shadow-2xl border border-slate-100 z-50 overflow-hidden"
          style={{ width: '340px', maxHeight: '420px' }}
          data-testid="notification-panel"
        >
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100" style={{ background: '#F8FAFC' }}>
            <span className="text-sm font-semibold text-slate-700">Notifications</span>
            <div className="flex items-center gap-2">
              {notifications.length > 0 && (
                <button onClick={clearAll} className="text-xs text-slate-400 hover:text-slate-600">
                  Tout effacer
                </button>
              )}
              <button onClick={() => setIsOpen(false)}>
                <X className="w-4 h-4 text-slate-400" />
              </button>
            </div>
          </div>

          <div className="overflow-y-auto" style={{ maxHeight: '360px' }}>
            {notifications.length === 0 ? (
              <div className="py-10 text-center">
                <Bell className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                <p className="text-sm text-slate-400">Aucune notification</p>
              </div>
            ) : (
              notifications.map((notif) => {
                const colors = typeColors[notif.type] || typeColors.info
                const Icon = typeIcons[notif.type] || Info
                return (
                  <div
                    key={notif.id}
                    className="flex items-start gap-3 px-4 py-3 border-b border-slate-50 hover:bg-slate-50 transition-colors"
                    style={{ borderLeft: `3px solid ${colors.border}` }}
                    data-testid={`notification-${notif.id}`}
                  >
                    <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0" style={{ background: colors.bg }}>
                      <Icon className="w-3.5 h-3.5" style={{ color: colors.border }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-slate-700">{notif.title}</p>
                      <p className="text-xs text-slate-500 truncate">{notif.message}</p>
                      <p className="text-[10px] text-slate-400 mt-0.5">
                        {notif.timestamp?.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default NotificationBell
