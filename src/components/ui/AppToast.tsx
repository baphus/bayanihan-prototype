import { useEffect } from 'react'

type ToastTone = 'success' | 'info' | 'warning' | 'error'

type AppToastProps = {
  message: string
  onClose: () => void
  durationMs?: number
  tone?: ToastTone
  className?: string
}

function toneClasses(tone: ToastTone): string {
  if (tone === 'info') {
    return 'border-sky-300 bg-sky-50 text-sky-800'
  }

  if (tone === 'warning') {
    return 'border-amber-300 bg-amber-50 text-amber-800'
  }

  if (tone === 'error') {
    return 'border-red-300 bg-red-50 text-red-800'
  }

  return 'border-emerald-300 bg-emerald-50 text-emerald-800'
}

export default function AppToast({
  message,
  onClose,
  durationMs = 3200,
  tone = 'success',
  className,
}: AppToastProps) {
  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      onClose()
    }, durationMs)

    return () => {
      window.clearTimeout(timeoutId)
    }
  }, [durationMs, onClose])

  return (
    <div
      role="status"
      aria-live="polite"
      className={`fixed right-6 top-6 z-50 rounded-[4px] border px-4 py-3 text-[13px] font-semibold shadow-lg ${toneClasses(tone)} ${className ?? ''}`}
    >
      {message}
    </div>
  )
}