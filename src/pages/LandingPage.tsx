import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import HeroSection from '../components/HeroSection'
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
    src: 'https://scontent.fmnl17-1.fna.fbcdn.net/v/t39.30808-6/660944559_1360051849482631_3105403094835739593_n.jpg?_nc_cat=101&ccb=1-7&_nc_sid=7b2446&_nc_eui2=AeFZ-dZTBOjMg0O-pWzlw5kEqLXmz4RBp_OotebPhEGn85aba9F1mkVSoWbBnkzzJhl4WrHEpaLSf3MpIWW81IjW&_nc_ohc=_zLLdjJHmAIQ7kNvwGuL9An&_nc_oc=AdoSxTnV0ol4NDnSfmqIRisBYeZiFVSDNhQrbgvWYWzAWRDSlJs2FJlpAZBCGUB-Y0o&_nc_zt=23&_nc_ht=scontent.fmnl17-1.fna&_nc_gid=CeoQm66EtjTMljQaE-9ctg&_nc_ss=7a3a8&oh=00_Af0Gk3sMt9AkD4YvaweAKh1JTIEK6d32oys3bXbOQ40enQ&oe=69E5DF04',
    alt: 'Bayanihan One Window launch photo 1',
    sourceLabel: 'Facebook',
    sourceUrl: 'https://www.facebook.com/',
  },
  {
    src: 'https://scontent.fmnl17-6.fna.fbcdn.net/v/t39.30808-6/660233970_1360051916149291_3192494263508356837_n.jpg?_nc_cat=109&ccb=1-7&_nc_sid=7b2446&_nc_eui2=AeGM6rSa_AeVM0Q-WfF-seaV6tX4ZjnVvzXq1fhmOdW_Nbx7RE5IIgEEhc3TCr86RYQHw772F4kTSo4ga5x32GiE&_nc_ohc=KPtP6ObaCp0Q7kNvwFfiU1m&_nc_oc=AdosfXr7c5qc3my1rqfemwELJm31M8J1lEah9RO1uLdFoMeLzzLBa23Qpup00teE3VA&_nc_zt=23&_nc_ht=scontent.fmnl17-6.fna&_nc_gid=CiDb_nnIidmpPzwPPFk6GQ&_nc_ss=7a3a8&oh=00_Af1Rkj7kPNSCczeH_42guZ6Upbb_kMO2KlEj4vLgyELS1Q&oe=69E5C671',
    alt: 'Bayanihan One Window launch photo 2',
    sourceLabel: 'Facebook',
    sourceUrl: 'https://www.facebook.com/',
  },
  {
    src: 'https://scontent.fmnl17-7.fna.fbcdn.net/v/t39.30808-6/658838990_1360052356149247_7243023287121769876_n.jpg?_nc_cat=108&ccb=1-7&_nc_sid=7b2446&_nc_eui2=AeGA33JmEHEVrs_8gPIElNcenl6kYOTeyl6eXqRg5N7KXo_HlnxMMZfG9spX5ayhInRjcAHdSZA0MbMUknwym-Cf&_nc_ohc=2dNozjKC0PIQ7kNvwFtrung&_nc_oc=AdprgazoQl8flGPuZGQdxPDf8xbgFsmhFOxNJivVFRRGIiUOE2tLfCY_CgPH7mL1KcI&_nc_zt=23&_nc_ht=scontent.fmnl17-7.fna&_nc_gid=3RGXAO3c7m5xTatk0-PIzQ&_nc_ss=7a3a8&oh=00_Af155nUmK7TpvHL3iT6DpKTZTmKI2ybF3p9elHAmL_dSOQ&oe=69E5DE00',
    alt: 'Bayanihan One Window launch photo 3',
    sourceLabel: 'Facebook',
    sourceUrl: 'https://www.facebook.com/',
  },
  {
    src: 'https://scontent.fmnl17-7.fna.fbcdn.net/v/t39.30808-6/657584302_1360051739482642_354477979701982341_n.jpg?_nc_cat=108&ccb=1-7&_nc_sid=7b2446&_nc_eui2=AeGs7g4g03kNzRW3FIOTISW3-aP0XGzQqDf5o_RcbNCoNzX_XpNAbhH5JHVaJxq9cY5OI9XcEPpErxS69gwHFHh_&_nc_ohc=KtfcrFHU5J0Q7kNvwHw1SCM&_nc_oc=Adp8zx-PiWYfHT-OCj1seoqSO9RZiJr9_GnvniHXXzKxoyQ-iR17ciSAVuouTsv8PvQ&_nc_zt=23&_nc_ht=scontent.fmnl17-7.fna&_nc_gid=UNCsW7COlK9aT0h5bZ3phA&_nc_ss=7a3a8&oh=00_Af3fsFMCXrRn8Yl5FsSJwTCrUBMpbAYNT6yScVQeRXJGcw&oe=69E5E42C',
    alt: 'Bayanihan One Window launch photo 4',
    sourceLabel: 'Facebook',
    sourceUrl: 'https://www.facebook.com/',
  },
  {
    src: 'https://scontent.fmnl17-2.fna.fbcdn.net/v/t39.30808-6/657671382_1360052062815943_1169222622750192392_n.jpg?_nc_cat=107&ccb=1-7&_nc_sid=7b2446&_nc_eui2=AeGtc1logtQT1iGomXwR8G-Cb51_MwFI-rxvnX8zAUj6vDRv2JbcorefcOGKKzAB_iLXn3ePDnHPBijyO0S2ouVm&_nc_ohc=tjP6aKBbfMEQ7kNvwHWNSk8&_nc_oc=AdpCUV_eur4Mn51PC1qr0ufiepTNleW6nt1V7Rj5GFrQs_fFTL5HZVeBwFPazU4m35I&_nc_zt=23&_nc_ht=scontent.fmnl17-2.fna&_nc_gid=TnyEzYmGkoRw2hismQk_nQ&_nc_ss=7a3a8&oh=00_Af1_mbhN70ORolTnwWa6e_Z-_qRmuRHWuyEjOxJ9Ef16Dg&oe=69E5E907',
    alt: 'Bayanihan One Window launch photo 5',
    sourceLabel: 'Facebook',
    sourceUrl: 'https://www.facebook.com/',
  },
  {
    src: 'https://scontent.fmnl17-1.fna.fbcdn.net/v/t39.30808-6/658823749_1360051989482617_863446173363019231_n.jpg?_nc_cat=100&ccb=1-7&_nc_sid=7b2446&_nc_eui2=AeG9AElCc1bMhjza0LpRMWPqj-eNxlJsa5iP543GUmxrmD1xxx7sG_WaiPRVtBYPf39Ywezh4TuZzpEqAFy1MJdq&_nc_ohc=hAeB4VrnHngQ7kNvwGnwtS0&_nc_oc=Adpwir1s5c-S4anDcyKjqj8gy8NA74RKidCuKjYl2y4SFZtI-F5YyQbPt1eaYecygy4&_nc_zt=23&_nc_ht=scontent.fmnl17-1.fna&_nc_gid=9UozGlMO1ThgNPdXM4lHAQ&_nc_ss=7a3a8&oh=00_Af0y45xaDBuSuBaBGyWxkCwgFI4T8Gb99I4yzdXvhpztTA&oe=69E5CC4D',
    alt: 'Bayanihan One Window launch photo 6',
    sourceLabel: 'Facebook',
    sourceUrl: 'https://www.facebook.com/',
  },
  {
    src: 'https://scontent.fmnl17-5.fna.fbcdn.net/v/t39.30808-6/662424810_1360052149482601_7481996049433898532_n.jpg?_nc_cat=110&ccb=1-7&_nc_sid=7b2446&_nc_eui2=AeHtg1JZsiFJ_GLzqviVLbTVuqtvEae3yGa6q28Rp7fIZjst_W1z5SJGM-cuzqU2AIioL-HGc-R67Gt6kzMRBGG1&_nc_ohc=zgvqYUvXAFUQ7kNvwE3_C0b&_nc_oc=AdoxDNsPEbemL1IcjhOEIAtlYGTFhLBLF179D3AsqdzcgPpMpn6V7EpOA1bdOEH1zNE&_nc_zt=23&_nc_ht=scontent.fmnl17-5.fna&_nc_gid=kQ3GK95B1kIIEyXUCs9cgQ&_nc_ss=7a3a8&oh=00_Af3jiGZU8Vgr2nQdZDFngA_RpOFlbdfv_0ra5a97Svb9Kg&oe=69E5F448',
    alt: 'Bayanihan One Window launch photo 7',
    sourceLabel: 'Facebook',
    sourceUrl: 'https://www.facebook.com/',
  },
  {
    src: 'https://scontent.fmnl17-8.fna.fbcdn.net/v/t39.30808-6/658985430_1360052252815924_2569027912943518121_n.jpg?_nc_cat=104&ccb=1-7&_nc_sid=7b2446&_nc_eui2=AeE_AZJHIOTFmOz9vt5Pvd1JQ6I8_Sq_yHJDojz9Kr_IcsT8BDEevaISicfosbFBjQemOz3DZYTD51VtB6UiUzAY&_nc_ohc=sTGsckTIn0YQ7kNvwFR1KV2&_nc_oc=AdoWMMHowBx5OR99BiME8-pOTFbaptuK6AqI6PlT6XEqvG3mUJiXBLDlexSJywvx9CY&_nc_zt=23&_nc_ht=scontent.fmnl17-8.fna&_nc_gid=9IW3SX7b9uDsQqu-fcjGTw&_nc_ss=7a3a8&oh=00_Af3bj8iPWNHN3hVRS_k2ZmQHRJzruW5bB3l0CO72z0KZog&oe=69E5D542',
    alt: 'Bayanihan One Window launch photo 8',
    sourceLabel: 'Facebook',
    sourceUrl: 'https://www.facebook.com/',
  },
  {
    src: 'https://scontent.fmnl17-2.fna.fbcdn.net/v/t39.30808-6/658139229_1360052309482585_7543745008453068084_n.jpg?_nc_cat=107&ccb=1-7&_nc_sid=7b2446&_nc_eui2=AeH6-x5cwyP_h1hIa1EUHzNQoNn-MjPbiJ-g2f4yM9uIn3yMdD5HMF6enOQyJlpP8WCfR4AlaueYWVf3RnqB0SaF&_nc_ohc=SeVZ4CZEBEsQ7kNvwHEFKLa&_nc_oc=Adr9O13MNYFnfp0ddkqAszeIScV-Oc8drIK7zYNvUc6gvSRJCn1rb59SzseRdCyb8oU&_nc_zt=23&_nc_ht=scontent.fmnl17-2.fna&_nc_gid=FQPbTcyKXsJgyICz8_S9pw&_nc_ss=7a3a8&oh=00_Af1x8-KUhC7_CYSuXgIL9nnycJvwnsmbICMgA0qhZPUBqg&oe=69E5F5C4',
    alt: 'Bayanihan One Window launch photo 9',
    sourceLabel: 'Facebook',
    sourceUrl: 'https://www.facebook.com/',
  },
  {
    src: 'https://scontent.fmnl17-8.fna.fbcdn.net/v/t39.30808-6/659320993_1360052392815910_7839795982858111659_n.jpg?_nc_cat=104&ccb=1-7&_nc_sid=7b2446&_nc_eui2=AeG5HdAN_0P3R6JxDrQ-8p_YlcVso3ZVt8WVxWyjdlW3xfuW8z5IOyR8OK8zyIe6F0i8UlSN5Br7WRM3uoyvpdee&_nc_ohc=cTvejqVA0F4Q7kNvwHoWLaU&_nc_oc=AdpRBJjypCdSqCO85d6A9FRrAGQ9F0wVs1OCks3gSgAIchr6TBpLsQR2GZ6cbbQiw3Q&_nc_zt=23&_nc_ht=scontent.fmnl17-8.fna&_nc_gid=RKLSaWphgYk5f_uftt1aGg&_nc_ss=7a3a8&oh=00_Af08kP4WUvgVTUfPP61YdWVUFscFOlJwq3w8sgN73XOk3g&oe=69E5DC39',
    alt: 'Bayanihan One Window launch photo 10',
    sourceLabel: 'Facebook',
    sourceUrl: 'https://www.facebook.com/',
  },
  {
    src: 'https://scontent.fmnl17-4.fna.fbcdn.net/v/t39.30808-6/659025086_1360052436149239_7122273410421081069_n.jpg?_nc_cat=105&ccb=1-7&_nc_sid=7b2446&_nc_eui2=AeFc4z1apCb5QMMEzOHlyzbw-pgYOBXlQAD6mBg4FeVAALLLSEvSFNPdr-cZchX5hJzfkjrpViftEUkiQJbfKmaK&_nc_ohc=JsL9KdrpWDAQ7kNvwEw9kyg&_nc_oc=AdpArM6Hb7qYs7IhSHfWN0xOU2wz8efAYDsecYMTgjK-272cawOcTwhQN2LRxtzunQE&_nc_zt=23&_nc_ht=scontent.fmnl17-4.fna&_nc_gid=tXEdxdFknCYzZtsF37PE-Q&_nc_ss=7a3a8&oh=00_Af1ojJLID-V2sVykf_Qu9SjFidN7Jty2YGUUhnRoZ3iNjA&oe=69E5C94B',
    alt: 'Bayanihan One Window launch photo 11',
    sourceLabel: 'Facebook',
    sourceUrl: 'https://www.facebook.com/',
  },
  {
    src: 'https://scontent.fmnl17-5.fna.fbcdn.net/v/t39.30808-6/657599681_1360052482815901_7680030183386662545_n.jpg?_nc_cat=110&ccb=1-7&_nc_sid=7b2446&_nc_eui2=AeHpoOTvW0t1NFbtmkPp0lhWZvsrEFLKMZpm-ysQUsoxmtLxpYWtv4IkXiDYsjKy_62Dm6UgGMm4Ml31HXpP3Wve&_nc_ohc=MbzMJ6H8vtIQ7kNvwGZ2NLM&_nc_oc=AdrpT5GboP0lmTEx2jz_c7wyLAXkgl9wCWYi-NgwY_AkCf2AvowY2oGmWwkLNJvIAck&_nc_zt=23&_nc_ht=scontent.fmnl17-5.fna&_nc_gid=x48bQA47a26gEVqUnssTmw&_nc_ss=7a3a8&oh=00_Af1Hi4dTZ4pyrMK3c01Cb9LkOrgIR-juptxRL8M5fid5QA&oe=69E5E9CB',
    alt: 'Bayanihan One Window launch photo 12',
    sourceLabel: 'Facebook',
    sourceUrl: 'https://www.facebook.com/',
  },
  {
    src: 'https://scontent.fmnl17-1.fna.fbcdn.net/v/t39.30808-6/661605403_1360052529482563_3363202878426972927_n.jpg?_nc_cat=101&ccb=1-7&_nc_sid=7b2446&_nc_eui2=AeGqIztKHR8IXOIhh_D2OIwS4UWMOGagp-DhRYw4ZqCn4PlUXs4tpE2b8DvrQayp-rjUoo756C6yw_bwew8TmZC2&_nc_ohc=sJ3E_wTOcIAQ7kNvwH8shp_&_nc_oc=AdqnpuRfvRocLRAl5PvQmDq-TVbmC__6NxhUpyYChguPFvQN1G1cWuRvKD9YHBf0yB4&_nc_zt=23&_nc_ht=scontent.fmnl17-1.fna&_nc_gid=SzYlKztyzfIc1aC3OLhu_w&_nc_ss=7a3a8&oh=00_Af10OJ-UdB5hrEAOzc7gUqyV7lx1_ByxntmhHlA4PH30wA&oe=69E5CD07',
    alt: 'Bayanihan One Window launch photo 13',
    sourceLabel: 'Facebook',
    sourceUrl: 'https://www.facebook.com/',
  },
  {
    src: 'https://scontent.fmnl17-1.fna.fbcdn.net/v/t39.30808-6/657718698_1360052579482558_4889318046132039400_n.jpg?_nc_cat=101&ccb=1-7&_nc_sid=7b2446&_nc_eui2=AeHtTCgptxcOgVqzv9P6qvt4cySsKHCk2lZzJKwocKTaVn0ydfi86ZmCVXKBlHbEsDvNKunMWUEBiOJsG6n0DWtq&_nc_ohc=jLLyys52rhgQ7kNvwFTTquK&_nc_oc=AdoRVmGcb1J_nu6MkA4QRK65l7elP0zaxRRlAinjN2CsQVLOUbguPuTUe8VatCbXheg&_nc_zt=23&_nc_ht=scontent.fmnl17-1.fna&_nc_gid=ecoFF8B--0hTxxGS-GBZcg&_nc_ss=7a3a8&oh=00_Af0E4-F9toSJ2Qf5MAozBA07fUBa7H4X3_6c5QJte6nBzA&oe=69E5EF00',
    alt: 'Bayanihan One Window launch photo 14',
    sourceLabel: 'Facebook',
    sourceUrl: 'https://www.facebook.com/',
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
          title="Connecting Government Services for Every OFW"
          description="A unified platform for inter-agency referrals, ensuring secure, transparent, and efficient assistance for migrant workers and their families."
          onTrackAction={scrollToTracker}
        />

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
                        href={bayanihanArticlePhotos[activePhotoIndex].sourceUrl}
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
                Bayanihan One Window is a unified, ICT-based platform that connects Overseas Filipino Workers (OFWs) to multiple government agencies through a single system.
              </p>
              <p>
                It streamlines assistance through one-time case intake, automated referrals, and real-time tracking, ensuring faster, more coordinated, and transparent support from welfare to reintegration services.
              </p>
              <p>
                Built through collaboration between the Department of Migrant Workers (DMW), local government units, and partner agencies, the system reflects a shared commitment to ensure that no OFW is left behind.
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
              Are you a government agency or licensed stakeholder? Join our unified platform to streamline referrals and provide faster assistance to our OFWs.
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