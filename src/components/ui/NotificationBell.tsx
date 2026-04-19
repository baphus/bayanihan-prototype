import { useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import type { NotificationDeliveryLog, NotificationTriggerKey } from '../../data/unifiedData'

type NotificationBellProps = {
  notifications: NotificationDeliveryLog[]
  viewAllHref?: string
  triggerLabelOverride?: string
}

function toTriggerLabel(trigger: NotificationTriggerKey): string {
  return trigger.replaceAll('_', ' ')
}

function toShortTimestamp(value: string): string {
  return new Date(value).toLocaleString('en-US', {
    month: 'short',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
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
        className="relative inline-flex h-10 w-10 items-center justify-center rounded-[3px] border border-[#cbd5e1] bg-white text-slate-600 transition-colors hover:bg-slate-50 hover:text-[#0b5384]"
        aria-label="Open notifications"
        aria-expanded={isOpen}
      >
        <span className="material-symbols-outlined text-[20px]">notifications</span>
        {unreadCount > 0 ? (
          <span className="absolute -right-1 -top-1 inline-flex min-w-[18px] items-center justify-center rounded-full bg-[#0b5384] px-1.5 text-[10px] font-extrabold text-white">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        ) : null}
      </button>

      {isOpen ? (
        <div className="absolute right-0 top-[calc(100%+8px)] z-50 w-[340px] max-w-[90vw] overflow-hidden rounded-[3px] border border-[#cbd5e1] bg-white shadow-lg">
          <div className="border-b border-[#e2e8f0] px-4 py-3">
            <p className="text-[11px] font-extrabold uppercase tracking-[0.08em] text-[#0b5384]">Notifications</p>
            <p className="mt-0.5 text-[12px] text-slate-500">Recent delivery updates</p>
          </div>

          <div className="max-h-[360px] overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="px-4 py-6 text-center text-[13px] text-slate-500">No notifications to show.</div>
            ) : (
              notifications.map((item) => (
                <div key={item.id} className="border-b border-[#f1f5f9] px-4 py-3 last:border-b-0">
                  <div className="flex items-start gap-2">
                    <p className="text-[11px] font-extrabold uppercase tracking-[0.08em] text-slate-600">
                      {triggerLabelOverride || toTriggerLabel(item.trigger)}
                    </p>
                  </div>
                  <p className="mt-1 text-[12px] text-slate-700">{item.message}</p>
                  <p className="mt-1 text-[11px] text-slate-500">{toShortTimestamp(item.timestamp)}</p>
                </div>
              ))
            )}
          </div>

          {viewAllHref ? (
            <div className="border-t border-[#e2e8f0] px-4 py-2.5">
              <Link
                to={viewAllHref}
                className="text-[12px] font-bold text-[#0b5384] hover:underline"
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
