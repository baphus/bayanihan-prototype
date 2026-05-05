import { useState } from "react"
import { useNavigate } from "react-router-dom"
import AppFooter from "../components/layout/AppFooter"
import AppHeader from "../components/layout/AppHeader"
import TrackerInput from "../components/TrackerInput"
import FaqSection from "../components/FaqSection"

export default function TrackYourCasePage() {
  const navigate = useNavigate()
  const [trackerNumber, setTrackerNumber] = useState("")
  const [inputError, setInputError] = useState("")

  const handleTrackSubmit = () => {
    const normalizedTrackingId = trackerNumber.trim().toUpperCase()

    if (!normalizedTrackingId) {
      setInputError("Please enter your Tracking ID.")
      return
    }

    if (!/^OW-[A-Z0-9]{7}$/.test(normalizedTrackingId)) {
      setInputError("Tracking ID must be in the format OW-XXXXXXX.")
      return
    }

    setInputError("")
    navigate(`/track/${encodeURIComponent(normalizedTrackingId)}`)
  }

  const handleTrackerChange = (value: string) => {
    setTrackerNumber(value.toUpperCase())
    if (inputError) {
      setInputError("")
    }
  }

  return (
    <div className="flex min-h-screen flex-col bg-surface font-body text-on-surface">
      <AppHeader />

      <main className="flex-1">
        <section className="relative flex min-h-[400px] w-full items-center justify-center overflow-hidden py-20 bg-primary">
          <div className="absolute inset-0 z-0">
            <div className="absolute inset-0 bg-gradient-to-br from-primary via-primary/90 to-primary-container/30"></div>
          </div>

          <div className="relative z-10 mx-auto w-full max-w-7xl px-4 text-center md:px-8">
            <div className="mx-auto max-w-3xl">
              <h1 className="mb-4 font-headline text-4xl font-extrabold leading-tight tracking-tight text-white sm:text-5xl">
                Track Your Case
              </h1>
              <p className="mx-auto mb-10 max-w-2xl text-lg leading-relaxed text-white/80">
                Enter your unique case tracking number below to view the
                real-time status and history of your OFW application or
                request safely across all partner agencies.
              </p>
            </div>
          </div>
        </section>

        <section className="relative -mt-16 pb-24 px-4">
          <div className="mx-auto max-w-3xl">
            <div className="bg-surface p-6 shadow-2xl border border-outline-variant/30">
              <div className="mb-6 flex items-center gap-3 border-b border-outline-variant pb-4">
                <span className="material-symbols-outlined text-primary text-2xl">confirmation_number</span>
                <h2 className="font-headline text-lg font-bold text-on-surface">Tracking ID Details</h2>
              </div>
              
              <TrackerInput
                trackerNumber={trackerNumber}
                errorMessage={inputError}
                onTrackerChange={handleTrackerChange}
                onSubmit={handleTrackSubmit}
                isDisabled={false}
              />

              <div className="mt-8 bg-surface-container-highest/30 p-4">
                <div className="flex gap-3">
                  <span className="material-symbols-outlined text-primary text-[20px]">info</span>
                  <div className="text-sm text-on-surface-variant leading-relaxed">
                    <p className="font-semibold text-primary mb-1">Where can I find my Tracking ID?</p>
                    <p>Tracking IDs (e.g., OW-A7K2M9Q) are typically found on your acknowledgment receipt or sent via SMS/Email after your initial case intake.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <FaqSection />
      </main>

      <AppFooter />
    </div>
  )
}
