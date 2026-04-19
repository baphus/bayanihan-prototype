import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
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
    navigate(`/track/${encodeURIComponent(normalizedTrackingId)}`)
  }

  return (
    <div className="flex min-h-screen flex-col bg-slate-50 font-body text-slate-900">
      <AppHeader />

      <main className="flex-1 flex flex-col items-center justify-center px-4 py-16">
        <div className="w-full max-w-3xl flex flex-col items-center text-center">
          
          <div className="mb-4 inline-flex items-center gap-2 bg-[#Eef4fb] px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-[#0e5b8d] rounded-sm">
          </div>
          
          <h1 className="mb-4 text-4xl sm:text-5xl font-black uppercase text-[#111827] tracking-tight">
            Track Your Case
          </h1>
          
          <p className="mb-10 max-w-xl text-sm sm:text-base text-slate-500">
            Enter your unique case tracking number below to view the
            real-time status and history of your OFW application or
            request.
          </p>
          
          {/* Main Card */}
          <div className="w-full bg-white border border-slate-200 border-l-4 border-l-[#0b5c92] shadow-sm p-6 sm:p-10 mb-10 text-left relative">
            <div className="flex items-center gap-2 mb-4 text-[#0b5c92] font-bold text-xs uppercase tracking-widest">
              <span className="material-symbols-outlined text-sm">confirmation_number</span>
              Case Tracking Number
            </div>
            
            <form onSubmit={handleTrackSubmit}>
              <div className="relative mb-2">
                <input
                  type="text"
                  placeholder="Enter Tracking ID (e.g., OW-A7K2M9Q)"
                  pattern="OW-[A-Za-z0-9]{7}"
                  className="w-full bg-slate-50 border border-slate-100 py-4 px-4 pr-12 text-sm focus:outline-none focus:ring-1 focus:ring-[#0b5c92] focus:border-[#0b5c92] text-slate-800"
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
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-[#0b5c92]"
                >
                  <span className="material-symbols-outlined">search</span>
                </button>
              </div>
              <p className="text-[11px] text-slate-400 mb-6">
                Tracking IDs are typically found on your acknowledgment receipt or sent via SMS/Email.
              </p>

              {inputError ? (
                <p className="mb-4 text-[11px] font-semibold text-red-600">{inputError}</p>
              ) : null}
              
              <button
                type="submit"
                className="w-full bg-[#0b5c92] text-white py-4 font-bold text-sm uppercase tracking-widest hover:bg-[#084b77] transition-colors flex items-center justify-center gap-2"
              >
                Track Case Status
                <span className="material-symbols-outlined text-sm">arrow_forward</span>
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
