import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import HeroSection from '../components/HeroSection'
import TrackerInput from '../components/TrackerInput'
import AppFooter from '../components/layout/AppFooter'
import AppHeader from '../components/layout/AppHeader'
import { AppButton } from '../components/ui/AppButton'
import AiAssistant from '../components/AiAssistant'
import { AGENCIES_DATA } from '../data/agenciesData'
import { getGoogleMapsEmbedUrl } from '../data/unifiedData'

const featureCards = [
  {
    title: 'Unified Tracking',
    description:
      'Monitor your case progress across different government agencies in one place. No more jumping between different websites.',
    icon: 'device_hub',
  },
  {
    title: 'Secure & Private',
    description:
      'Your data is protected following the Data Privacy Act of 2012. We ensure that sensitive information is only accessible by authorized personnel.',
    icon: 'shield',
  },
  {
    title: 'Faster Referrals',
    description:
      'Seamless coordination between DMW, OWWA, DOH, DOLE, DSWD, TESDA, and other partners ensures your needs are addressed with minimal delay.',
    icon: 'speed',
  },
]

const partnerAgencies = AGENCIES_DATA

export default function LandingPage() {
  const navigate = useNavigate()
  const [trackerNumber, setTrackerNumber] = useState('')
  const [errorMessage, setErrorMessage] = useState('')

  const trimmedTrackerNumber = trackerNumber.trim()

  const handleSubmit = () => {
    if (!trimmedTrackerNumber) {
      setErrorMessage('Please enter a tracker number before continuing.')
      return
    }

    setErrorMessage('')
    navigate(`/track/${encodeURIComponent(trimmedTrackerNumber)}`)
  }

  const handleTrackerChange = (value: string) => {
    setTrackerNumber(value)

    if (errorMessage && value.trim()) {
      setErrorMessage('')
    }
  }

  const scrollToTracker = () => {
    const trackerSection = document.getElementById('tracker')
    if (trackerSection) {
      trackerSection.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }

  return (
    <div className="bg-surface font-body text-on-surface">
      <AppHeader
        onTrackCaseClick={scrollToTracker}
      />

      <main>
        <HeroSection
          title="Connecting Government Services for Every OFW"
          description="A unified platform for inter-agency referrals, ensuring secure, transparent, and efficient assistance for migrant workers and their families."
          onTrackAction={scrollToTracker}
        />

        <section id="features" className="bg-surface-container px-8 py-24">
          <div className="mx-auto max-w-7xl">
            <div className="mb-16 flex flex-col items-end justify-between gap-4 md:flex-row">
              <div className="max-w-xl">
                <span className="editorial-label mb-2 block text-secondary">System Advantages</span>
                <h2 className="font-headline text-3xl font-extrabold text-primary">Why Use the Bayanihan One Window?</h2>
              </div>
              <div className="mb-4 hidden h-1 w-24 bg-primary md:block"></div>
            </div>

            <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
              {featureCards.map((feature) => (
                <div
                  key={feature.title}
                  className="rounded-none border border-outline-variant/30 bg-white p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-md"
                >
                  <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-none bg-primary/10 text-primary">
                    <span className="material-symbols-outlined text-3xl" data-icon={feature.icon}>{feature.icon}</span>
                  </div>
                  <h3 className="mb-3 text-lg font-bold text-primary">{feature.title}</h3>
                  <p className="text-sm leading-relaxed text-on-surface-variant">{feature.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="partners" className="overflow-hidden bg-white px-8 py-20">
          <div className="mx-auto max-w-7xl text-center">
            <span className="editorial-label mb-8 block text-slate-500">Network of Care</span>
            <h2 className="mb-12 font-headline text-2xl font-extrabold text-primary">Our Partner Agencies (Region VII)</h2>
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {partnerAgencies.map((agency) => (
                <div
                  key={agency.id}
                  className="group cursor-pointer border border-outline-variant/30 bg-surface-container-lowest p-4 text-left shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-md"
                  onClick={() => navigate(`/agencies/${agency.id}`)}
                >
                  <div className="mb-3 flex items-center gap-3">
                    <div className="flex h-14 w-14 items-center justify-center overflow-hidden rounded-full bg-white shadow-sm">
                      <img src={agency.logoUrl} alt={`${agency.short} Logo`} className="h-full w-full object-cover p-2" />
                    </div>
                    <div>
                      <p className="text-xs font-extrabold uppercase tracking-widest text-primary">{agency.short}</p>
                      <p className="text-sm font-semibold text-on-surface line-clamp-2">{agency.name}</p>
                    </div>
                  </div>
                  <div className="h-[110px] overflow-hidden border border-outline-variant/30 bg-white">
                    <iframe
                      title={`${agency.name} map preview`}
                      src={getGoogleMapsEmbedUrl(agency.locationQuery)}
                      className="h-full w-full"
                      loading="lazy"
                      referrerPolicy="no-referrer-when-downgrade"
                    />
                  </div>
                  <p className="mt-3 text-[11px] font-semibold uppercase tracking-[0.12em] text-secondary">View Agency Location</p>
                </div>
              ))}
            </div>
            
            <div className="mt-16">
              <AppButton 
                type="button" 
                variant="outline" 
                icon="storefront" 
                className="rounded-sm border-2 border-primary px-6 py-3"
                onClick={() => navigate('/agencies')}
              >
                View Agencies
              </AppButton>
            </div>
          </div>
        </section>

        <section id="about" className="border-y border-outline-variant/30 bg-surface-container-low px-8 py-20">
          <div className="mx-auto max-w-4xl text-center">
            <h2 className="mb-4 font-headline text-3xl font-extrabold text-primary">Strengthening the Network of Care</h2>
            <p className="mx-auto mb-8 max-w-2xl text-lg leading-relaxed text-on-surface-variant">
              Are you a government agency or licensed stakeholder? Join our unified platform to streamline referrals and provide faster assistance to our OFWs.
            </p>
            <AppButton type="button" variant="outline" icon="handshake" className="rounded-sm border-2 border-primary px-6 py-3">
              Inquire about Partnership
            </AppButton>
          </div>
        </section>

        <section id="tracker" className="relative mx-auto max-w-6xl px-4 py-24 md:px-8">
          <div className="relative flex min-h-[400px] flex-col bg-[#005288] md:flex-row shadow-2xl">
            {/* Left side content */}
            <div className="flex flex-1 flex-col justify-center p-12 md:p-16 lg:p-20">
              <h2 className="mb-4 font-headline text-4xl font-extrabold text-white md:text-[44px] md:leading-tight">
                Ready to check your<br />status?
              </h2>
              <p className="max-w-md text-lg text-sky-100/90 leading-relaxed">
                Enter your tracking number to get real-time updates on your referral.
              </p>
            </div>

            {/* Right side form */}
            <div className="relative flex flex-1 flex-col justify-center bg-[#003a63] p-12 md:p-16 lg:p-20">
              <TrackerInput
                trackerNumber={trackerNumber}
                onTrackerChange={handleTrackerChange}
                onSubmit={handleSubmit}
                isDisabled={!trimmedTrackerNumber}
                errorMessage={errorMessage}
              />
            </div>
          </div>
        </section>
      </main>
      <AppFooter />
      <AiAssistant />
    </div>
  )
}