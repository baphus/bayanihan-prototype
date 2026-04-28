import { useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { Bell, Mail, Info, AlertTriangle, CheckCircle2, MoreVertical, ExternalLink } from 'lucide-react'
import type { NotificationDeliveryLog, NotificationTriggerKey } from '../../data/unifiedData'

type NotificationBellProps = {
  notifications: NotificationDeliveryLog[]
  viewAllHref?: string
  triggerLabelOverride?: string
}

function toTriggerLabel(trigger: NotificationTriggerKey): string {
  return trigger.toLowerCase().replaceAll('_', ' ')
}

function toShortTimestamp(value: string): string {
  const date = new Date(value)
  const now = new Date()
  const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / 60000)

  if (diffInMinutes < 1) return 'now'
  if (diffInMinutes < 60) return `${diffInMinutes}m ago`
  if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`
  
  return date.toLocaleString('en-US', {
    month: 'short',
    day: '2-digit',
  })
}

function getNotificationIcon(trigger: string) {
  if (trigger.includes('FAIL') || trigger.includes('ALERT')) {
    return <AlertTriangle className="h-4 w-4 text-red-500" />
  }
  if (trigger.includes('REFERRAL') || trigger.includes('CASE')) {
    return <Mail className="h-4 w-4 text-blue-500" />
  }
  if (trigger.includes('SUCCESS') || trigger.includes('COMPLETE')) {
    return <CheckCircle2 className="h-4 w-4 text-green-500" />
  }
  return <Info className="h-4 w-4 text-slate-400" />
}

export default function NotificationBell({ notifications, viewAllHref, triggerLabelOverride }: NotificationBellProps) {
  const [isOpen, setIsOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement | null>(null)

  const unreadCount = useMemo(() => notifications.length, [notifications])

  useEffect(() => {
    if (!isOpen) {
      return
    }

    const onPointerDown = (event: MouseEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    const onEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', onPointerDown)
    document.addEventListener('keydown', onEscape)

    return () => {
      document.removeEventListener('mousedown', onPointerDown)
      document.removeEventListener('keydown', onEscape)
    }
  }, [isOpen])

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="relative inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500 transition-all hover:bg-slate-50 hover:text-blue-600 hover:border-blue-200 shadow-sm"
        aria-label="Open notifications"
        aria-expanded={isOpen}
      >
        <Bell className="h-5 w-5" strokeWidth={2} />
        {unreadCount > 0 ? (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-blue-600 text-[9px] font-bold text-white ring-2 ring-white">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        ) : null}
      </button>

      {isOpen ? (
        <div className="absolute right-0 top-[calc(100%+12px)] z-50 w-[380px] max-w-[90vw] overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4 bg-slate-50/50">
            <div>
              <h3 className="text-[14px] font-bold text-slate-900">Notifications</h3>
              <p className="text-[11px] font-medium text-slate-500 uppercase tracking-widest mt-0.5">LATEST UPDATES</p>
            </div>
            <button className="text-slate-400 hover:text-slate-600 transition-colors">
              <MoreVertical className="h-4 w-4" />
            </button>
          </div>

          <div className="max-h-[420px] overflow-y-auto overscroll-contain px-2 py-2">
            {notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 px-6 text-center">
                <div className="h-12 w-12 rounded-full bg-slate-50 flex items-center justify-center mb-3">
                  <Bell className="h-6 w-6 text-slate-300" />
                </div>
                <p className="text-[13px] font-medium text-slate-900">No notifications yet</p>
                <p className="text-[12px] text-slate-500 mt-1">We'll notify you when something important happens.</p>
              </div>
            ) : (
              notifications.map((item) => (
                <div 
                  key={item.id} 
                  className="group relative flex gap-4 p-3 rounded-lg hover:bg-slate-50 transition-all cursor-pointer mb-1 last:mb-0"
                >
                  <div className="shrink-0 mt-0.5">
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white border border-slate-100 shadow-sm transition-transform group-hover:scale-105">
                      {getNotificationIcon(item.trigger)}
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 group-hover:text-blue-600 transition-colors">
                        {triggerLabelOverride || toTriggerLabel(item.trigger)}
                      </p>
                      <span className="text-[10px] font-medium text-slate-400 whitespace-nowrap">
                        {toShortTimestamp(item.timestamp)}
                      </span>
                    </div>
                    <p className="mt-1 text-[13px] leading-relaxed text-slate-600 group-hover:text-slate-900 transition-colors line-clamp-2">
                      {item.message}
                    </p>
                  </div>
                  <div className="absolute right-3 bottom-3 opacity-0 group-hover:opacity-100 transition-opacity">
                    <ExternalLink className="h-3 w-3 text-blue-500" />
                  </div>
                </div>
              ))
            )}
          </div>

          {viewAllHref ? (
            <div className="bg-slate-50/50 border-t border-slate-100">
              <Link
                to={viewAllHref}
                className="flex items-center justify-center w-full px-4 py-3 text-[13px] font-bold text-blue-600 hover:text-blue-700 hover:bg-white transition-all"
                onClick={() => setIsOpen(false)}
              >
                View all notifications
              </Link>
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  )
}
