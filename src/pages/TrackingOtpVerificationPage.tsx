import { useMemo, useRef, useState } from 'react'
import { Navigate, useNavigate, useParams } from 'react-router-dom'
import { ShieldCheck } from 'lucide-react'
import AppFooter from '../components/layout/AppFooter'
import AppHeader from '../components/layout/AppHeader'
import { setTrackingOtpVerified } from '../utils/authSession'

type OtpDigit = '' | string

export default function TrackingOtpVerificationPage() {
  const navigate = useNavigate()
  const { trackerNumber } = useParams<{ trackerNumber: string }>()
  const trackingId = useMemo(() => (trackerNumber ? decodeURIComponent(trackerNumber).trim().toUpperCase() : ''), [trackerNumber])

  const [otp, setOtp] = useState<OtpDigit[]>(['', '', '', '', '', ''])
  const [error, setError] = useState('')
  const otpRefs = useRef<Array<HTMLInputElement | null>>([])

  if (!trackingId) {
    return <Navigate to="/track" replace />
  }

  const handleOtpChange = (index: number, value: string) => {
    if (value.length > 1) {
      return
    }

    const sanitized = value.replace(/\D/g, '')
    const nextOtp = [...otp]
    nextOtp[index] = sanitized
    setOtp(nextOtp)
    setError('')

    if (sanitized && index < nextOtp.length - 1) {
      otpRefs.current[index + 1]?.focus()
    }
  }

  const handleOtpKeyDown = (index: number, event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Backspace' && otp[index] === '' && index > 0) {
      otpRefs.current[index - 1]?.focus()
    }
  }

  const handlePaste = (event: React.ClipboardEvent<HTMLInputElement>) => {
    event.preventDefault()
    const value = event.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6)
    const nextOtp: OtpDigit[] = ['', '', '', '', '', '']

    value.split('').forEach((digit, index) => {
      nextOtp[index] = digit
    })

    setOtp(nextOtp)
    setError('')

    if (value.length > 0) {
      otpRefs.current[Math.min(value.length - 1, 5)]?.focus()
    }
  }

  const handleVerify = (event: React.FormEvent) => {
    event.preventDefault()
    const otpValue = otp.join('')

    if (otpValue.length !== 6) {
      setError('Please enter the 6-digit OTP to continue.')
      return
    }

    setTrackingOtpVerified(trackingId)
    navigate(`/track/${encodeURIComponent(trackingId)}`, { replace: true })
  }

  return (
    <div className="flex min-h-screen flex-col bg-slate-50 font-body text-slate-900">
      <AppHeader />

      <main className="flex flex-1 items-center justify-center px-4 py-16">
        <section className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] sm:p-10 text-center">
          <div className="mx-auto mb-6 flex h-14 w-14 items-center justify-center rounded-full bg-[#Eef4fb]">
            <ShieldCheck className="h-7 w-7 text-[#0b5c92]" />
          </div>
          <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#0b5c92]">Security Check</p>
          <h1 className="mt-2 text-2xl font-black uppercase tracking-tight text-slate-900">Verify Identity</h1>
          <p className="mt-3 text-sm leading-6 text-slate-600">
            For security, verify your identity before we show progress for tracking ID <span className="font-bold text-slate-900">{trackingId}</span>.
          </p>

          <form className="mt-8 space-y-6" onSubmit={handleVerify}>
            <div className="flex justify-between gap-2 sm:gap-3">
              {otp.map((digit, index) => (
                <input
                  key={`otp-${index}`}
                  ref={(element) => {
                    otpRefs.current[index] = element
                  }}
                  type="text"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  maxLength={1}
                  value={digit}
                  onChange={(event) => handleOtpChange(index, event.target.value)}
                  onKeyDown={(event) => handleOtpKeyDown(index, event)}
                  onPaste={handlePaste}
                  className="h-12 w-12 sm:h-14 sm:w-14 rounded-lg border border-slate-300 bg-slate-50 text-center text-xl font-bold text-[#0b5c92] outline-none transition focus:border-[#0b5c92] focus:ring-2 focus:ring-[#0b5c92] focus:ring-offset-1"
                />
              ))}
            </div>

            {error ? <p className="text-xs font-semibold text-red-600">{error}</p> : null}

            <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row">
              <button
                type="button"
                onClick={() => navigate('/track')}
                className="w-full rounded-lg border border-slate-300 px-4 py-3.5 text-xs font-bold uppercase tracking-widest text-slate-700 transition hover:bg-slate-50 sm:w-auto sm:flex-1"
              >
                Back
              </button>
              <button
                type="submit"
                className="w-full rounded-lg bg-[#0b5c92] px-4 py-3.5 text-xs font-bold uppercase tracking-widest text-white transition hover:bg-[#084b77] sm:w-auto sm:flex-1"
              >
                Verify OTP
              </button>
            </div>
          </form>
        </section>
      </main>

      <AppFooter />
    </div>
  )
}
