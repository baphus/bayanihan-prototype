import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import HeroSection from '../components/HeroSection'
import LogoMarquee from '../components/ui/LogoMarquee'
import TrackerInput from '../components/TrackerInput'
import AppFooter from '../components/layout/AppFooter'
import AppHeader from '../components/layout/AppHeader'
import FaqSection from '../components/FaqSection'
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

const bayanihanArticlePhotos = [
  {
    src: 'https://res.cloudinary.com/dzjshue6h/image/upload/v1777287564/660944559_1360051849482631_3105403094835739593_n_yzazps.jpg',
    alt: 'Bayanihan One Window launch photo 1',
    sourceLabel: 'Facebook',
  },
  {
    src: 'https://res.cloudinary.com/dzjshue6h/image/upload/v1777287564/660233970_1360051916149291_3192494263508356837_n_irsajg.jpg',
    alt: 'Bayanihan One Window launch photo 2',
    sourceLabel: 'Facebook',

  },
  {
    src: 'https://res.cloudinary.com/dzjshue6h/image/upload/v1777287563/658985430_1360052252815924_2569027912943518121_n_d18cxa.jpg',
    alt: 'Bayanihan One Window launch photo 3',
    sourceLabel: 'Facebook',

  },
  {
    src: 'https://res.cloudinary.com/dzjshue6h/image/upload/v1777287563/662424810_1360052149482601_7481996049433898532_n_n5odlc.jpg',
    alt: 'Bayanihan One Window launch photo 4',
    sourceLabel: 'Facebook',

  },
  {
    src: 'https://res.cloudinary.com/dzjshue6h/image/upload/v1777287563/658985435_1360052099482606_4379608225627495418_n_vmgmlr.jpg',
    alt: 'Bayanihan One Window launch photo 5',
    sourceLabel: 'Facebook',

  },
  {
    src: 'https://res.cloudinary.com/dzjshue6h/image/upload/v1777287563/658139229_1360052309482585_7543745008453068084_n_jf927g.jpg',
    alt: 'Bayanihan One Window launch photo 6',
    sourceLabel: 'Facebook',

  },
  {
    src: 'https://res.cloudinary.com/dzjshue6h/image/upload/v1777287563/658838990_1360052356149247_7243023287121769876_n_guubqz.jpg',
    alt: 'Bayanihan One Window launch photo 7',
    sourceLabel: 'Facebook',

  },
  {
    src: 'https://res.cloudinary.com/dzjshue6h/image/upload/v1777287562/657718698_1360052579482558_4889318046132039400_n_kvtbja.jpg',
    alt: 'Bayanihan One Window launch photo 8',
    sourceLabel: 'Facebook',

  },
  {
    src: 'https://res.cloudinary.com/dzjshue6h/image/upload/v1777287562/659025086_1360052436149239_7122273410421081069_n_gmu1ky.jpg',
    alt: 'Bayanihan One Window launch photo 9',
    sourceLabel: 'Facebook',

  },
  {
    src: 'https://res.cloudinary.com/dzjshue6h/image/upload/v1777287562/659320993_1360052392815910_7839795982858111659_n_jlifus.jpg',
    alt: 'Bayanihan One Window launch photo 10',
    sourceLabel: 'Facebook',

  },
  {
    src: 'https://res.cloudinary.com/dzjshue6h/image/upload/v1777287562/661605403_1360052529482563_3363202878426972927_n_acqxmh.jpg',
    alt: 'Bayanihan One Window launch photo 11',
    sourceLabel: 'Facebook',

  },
  {
    src: 'https://res.cloudinary.com/dzjshue6h/image/upload/v1777287567/657584302_1360051739482642_354477979701982341_n_xm6pho.jpg',
    alt: 'Bayanihan One Window launch photo 12',
    sourceLabel: 'Facebook',

  },
]

export default function LandingPage() {
  const navigate = useNavigate()
  const [trackerNumber, setTrackerNumber] = useState('')
  const [errorMessage, setErrorMessage] = useState('')
  const [activePhotoIndex, setActivePhotoIndex] = useState(0)

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

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      setActivePhotoIndex((current) => (current + 1) % bayanihanArticlePhotos.length)
    }, 5000)

    return () => window.clearInterval(intervalId)
  }, [])

  const handlePreviousPhoto = () => {
    setActivePhotoIndex((current) => (current - 1 + bayanihanArticlePhotos.length) % bayanihanArticlePhotos.length)
  }

  const handleNextPhoto = () => {
    setActivePhotoIndex((current) => (current + 1) % bayanihanArticlePhotos.length)
  }

  return (
    <div className="bg-surface font-body text-on-surface">
      <AppHeader
        onTrackCaseClick={scrollToTracker}
      />

      <main>
        <HeroSection
          title="Connecting Government Services Through One Window"
          description="A unified platform for inter-agency referrals, ensuring secure, transparent, and efficient assistance for migrant workers and their families."
          onTrackAction={() => navigate('/track')}
        />

        <section className="bg-surface py-12">
          <div className="container mx-auto px-8">
            <h3 className="text-center font-headline text-sm font-bold uppercase tracking-widest text-on-surface-variant/70 mb-8">
              Trusted by Partner Agencies & Stakeholders
            </h3>
            <LogoMarquee />
          </div>
        </section>

        <section id="features" className="bg-surface-container px-8 py-24">
          <div className="mx-auto max-w-7xl">
            <div className="mb-12 max-w-4xl">
              <h2 className="font-headline text-3xl font-extrabold text-primary md:text-4xl">What is Bayanihan One Window and Why It Matters</h2>
            </div>

            <div className="relative overflow-hidden border border-outline-variant/30 bg-surface-container-lowest shadow-md">
              <figure className="relative">
                <img
                  src={bayanihanArticlePhotos[activePhotoIndex].src}
                  alt={bayanihanArticlePhotos[activePhotoIndex].alt}
                  className="h-[340px] w-full object-cover md:h-[520px]"
                  loading="lazy"
                  referrerPolicy="no-referrer"
                />

                <button
                  type="button"
                  onClick={handlePreviousPhoto}
                  className="absolute left-4 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-black/55 text-white transition-colors hover:bg-black/70"
                  aria-label="Show previous photo"
                >
                  <span className="material-symbols-outlined" aria-hidden="true">chevron_left</span>
                </button>

                <button
                  type="button"
                  onClick={handleNextPhoto}
                  className="absolute right-4 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-black/55 text-white transition-colors hover:bg-black/70"
                  aria-label="Show next photo"
                >
                  <span className="material-symbols-outlined" aria-hidden="true">chevron_right</span>
                </button>

                <figcaption className="absolute bottom-0 left-0 right-0 bg-black/60 px-5 py-4 text-sm text-white backdrop-blur-sm">
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <span>
                      Source:{' '}
                      <a
                        href="https://www.facebook.com/"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-semibold underline underline-offset-2"
                      >
                        {bayanihanArticlePhotos[activePhotoIndex].sourceLabel}
                      </a>
                    </span>
                    <span className="text-xs uppercase tracking-[0.1em] text-white/85">
                      {activePhotoIndex + 1} / {bayanihanArticlePhotos.length}
                    </span>
                  </div>
                </figcaption>
              </figure>

              <div className="flex items-center justify-center gap-2 border-t border-outline-variant/30 bg-white px-4 py-4">
                {bayanihanArticlePhotos.map((photo, index) => (
                  <button
                    key={photo.src}
                    type="button"
                    onClick={() => setActivePhotoIndex(index)}
                    className={`h-2.5 rounded-full transition-all ${index === activePhotoIndex ? 'w-8 bg-primary' : 'w-2.5 bg-outline-variant/70 hover:bg-primary/60'}`}
                    aria-label={`Go to photo ${index + 1}`}
                    aria-current={index === activePhotoIndex ? 'true' : undefined}
                  />
                ))}
              </div>
            </div>

            <article className="mb-12 mt-12 max-w-4xl space-y-6 text-base leading-relaxed text-on-surface-variant md:text-lg">
              <p>
                One Window Bayanihan Assistance Program (OWBAP) is a unified, ICT-enabled platform designed to transform how assistance is delivered to Overseas Filipino Workers (OFWs).
              </p>
              <p>
                It serves as a centralized inter-agency referral and tracking system, enabling the Department of Migrant Workers (DMW), local government units, and partner agencies to work together through one coordinated digital platform.
              </p>
              <p>
                Built on the principle of<br />
                &quot;One OFW. One Entry. One Coordinated System.&quot;<br />
                OWBAP eliminates fragmented processes by introducing a single-entry, assisted case intake, where case managers handle encoding, service assignment, and document management, removing the need for OFWs to repeatedly submit information or navigate multiple offices.
              </p>
              <p>
                Through automated referrals, standardized workflows, and real-time case tracking via a unique tracker number, the system ensures faster response, improved transparency, and seamless coordination from assistance to reintegration.
              </p>
              <p>
                By centralizing case visibility and strengthening inter-agency collaboration, OWBAP delivers efficient, accountable, and people-centered support, ensuring that every OFW receives timely help and that no case is left behind.
              </p>
            </article>

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
                      <img src={agency.logoUrl} alt={`${agency.short} Logo`} className="h-full w-full object-contain p-2" />
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

        <FaqSection />

        <section id="about" className="border-y border-outline-variant/30 bg-surface-container-low px-8 py-20">
          <div className="mx-auto max-w-4xl text-center">
            <h2 className="mb-4 font-headline text-3xl font-extrabold text-primary">Strengthening the Network of Care</h2>
            <p className="mx-auto mb-8 max-w-2xl text-lg leading-relaxed text-on-surface-variant">
              Are you a government agency or licensed stakeholder? Join our unified platform to streamline referrals and provide faster assistance through coordinated case handling and tracker-based updates.
            </p>
            <AppButton type="button" onClick={() => navigate('/contact')} variant="outline" icon="handshake" className="rounded-sm border-2 border-primary px-6 py-3">
              Inquire Now
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