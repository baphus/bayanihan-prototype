import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, ArrowRight, Ticket } from 'lucide-react'
import AppFooter from '../components/layout/AppFooter'
import AppHeader from '../components/layout/AppHeader'
import FaqSection from '../components/FaqSection'

export default function TrackYourCasePage() {
  const navigate = useNavigate()
  const [trackerNumber, setTrackerNumber] = useState('')
  const [inputError, setInputError] = useState('')

  const handleTrackSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const normalizedTrackingId = trackerNumber.trim().toUpperCase()

    if (!normalizedTrackingId) {
      setInputError('Please enter your Tracking ID.')
      return
    }

    if (!/^OW-[A-Z0-9]{7}$/.test(normalizedTrackingId)) {
      setInputError('Tracking ID must be in the format OW-XXXXXXX.')
      return
    }

    setInputError('')
    navigate(`/track/${encodeURIComponent(normalizedTrackingId)}/verify`)
  }

  return (
    <div className="flex min-h-screen flex-col bg-slate-50 font-body text-slate-900">
      <AppHeader />

      <main className="flex-1 flex flex-col items-center justify-center px-4 py-16 bg-gradient-to-b from-slate-50 to-slate-100">
        <div className="w-full max-w-3xl flex flex-col items-center text-center">
          
          <h1 className="mb-4 text-4xl sm:text-5xl font-black uppercase text-[#111827] tracking-tight">
            Track Your Case
          </h1>
          
          <p className="mb-10 max-w-xl text-sm sm:text-base text-slate-500">
            Enter your unique case tracking number below to view the
            real-time status and history of your OFW application or
            request across all partner agencies.
          </p>
          
          {/* Main Card */}
          <div className="w-full bg-white rounded-2xl border border-slate-200 shadow-[0_8px_30px_rgb(0,0,0,0.04)] p-6 sm:p-10 mb-10 text-left relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#0b5c92] to-[#00A59B]" />
            
            <div className="flex items-center gap-2 mb-6 text-slate-800 font-bold text-sm uppercase tracking-widest">
              <Ticket className="w-5 h-5 text-[#0b5c92]" />
              Tracking Details
            </div>
            
            <form onSubmit={handleTrackSubmit}>
              <div className="relative mb-3">
                <input
                  type="text"
                  placeholder="Enter Tracking ID (e.g., OW-A7K2M9Q)"
                  pattern="OW-[A-Za-z0-9]{7}"
                  className="w-full bg-slate-50 rounded-xl border border-slate-200 py-4 pl-5 pr-14 text-base font-medium focus:outline-none focus:ring-2 focus:ring-[#0b5c92] focus:border-[#0b5c92] text-slate-800 transition-shadow placeholder:text-slate-400"
                  value={trackerNumber}
                  onChange={(e) => {
                    setTrackerNumber(e.target.value.toUpperCase())
                    if (inputError) {
                      setInputError('')
                    }
                  }}
                />
                <button
                  type="submit"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-white bg-[#0b5c92] hover:bg-[#084b77] rounded-lg p-2 transition-colors flex items-center justify-center"
                >
                  <Search className="w-5 h-5" />
                </button>
              </div>
              
              <p className="text-xs text-slate-500 mb-8 flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[14px]">info</span>
                Tracking IDs are typically found on your acknowledgment receipt or sent via SMS/Email.
              </p>

              {inputError ? (
                <div className="mb-6 rounded-lg bg-red-50 p-4 border border-red-100">
                  <p className="text-sm font-semibold text-red-600 flex items-center gap-2">
                    <span className="material-symbols-outlined text-[18px]">error</span>
                    {inputError}
                  </p>
                </div>
              ) : null}
              
              <button
                type="submit"
                className="w-full rounded-xl bg-[#0b5c92] text-white py-4 font-bold text-sm uppercase tracking-widest hover:bg-[#084b77] transition-colors flex items-center justify-center gap-2 shadow-sm"
              >
                Track Case Status
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          </div>
          
        </div>
      </main>

      <div className="w-full">
        <FaqSection categories={['Tracking Your Case']} />
      </div>

      <AppFooter />
    </div>
  )
}
