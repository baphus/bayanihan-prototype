import { Link, useParams } from 'react-router-dom'
import AppFooter from '../components/layout/AppFooter'
import AppHeader from '../components/layout/AppHeader'
import TrackingNotFoundState from '../components/TrackingNotFoundState'
import { getManagedAgencyMilestonePageData } from '../data/caseLifecycleStore'

export default function DmwMilestonesPage() {
  const { trackerNumber } = useParams()
  const cleanTrackerNumber = trackerNumber ? decodeURIComponent(trackerNumber).trim() : ''
  const pageData = cleanTrackerNumber ? getManagedAgencyMilestonePageData('dmw', cleanTrackerNumber) : null

  if (!pageData) {
    return (
      <div className="bg-surface font-body text-on-surface">
        <AppHeader />
        <main className="mx-auto w-full max-w-[1100px] px-5 py-9">
          <TrackingNotFoundState description="This milestone page is unavailable because the tracking ID does not match an existing case." />
        </main>
        <AppFooter />
      </div>
    )
  }

  const trackingId = pageData.infoRows.find((row) => row.label === 'Tracking ID')?.value ?? cleanTrackerNumber

  return (
    <div className="bg-surface font-body text-on-surface">
      <AppHeader />

      <main className="mx-auto w-full max-w-[1100px] px-5 py-9">
        <section className="mb-[44px] border-l-[3px] border-[#9ccaff] bg-white px-[28px] py-[24px] shadow-[0_1px_3px_rgba(0,0,0,0.05)]">
          <nav className="mb-[6px] flex flex-wrap items-center gap-[6px] font-label text-[8.5px] font-[800] uppercase tracking-[0.18em] text-outline">
            <Link to={`/track/${encodeURIComponent(trackingId)}`} className="text-on-surface hover:text-primary transition-colors">TRACK CASE</Link>
            <span className="material-symbols-outlined text-[10px]">chevron_right</span>
            <span className="text-on-surface">{trackingId}</span>
            <span className="material-symbols-outlined text-[10px]">chevron_right</span>
            <span className="text-primary">{pageData.breadcrumbLabel}</span>
          </nav>

          <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center mt-[12px]">
            <div>
              <h1 className="font-headline text-[26px] font-[900] uppercase tracking-[-0.02em] text-primary leading-none">
                {pageData.title}
              </h1>
              <p className="mt-[8px] text-[11px] font-[500] text-on-surface-variant">{pageData.subtitle}</p>
            </div>

            <div className={`flex items-center gap-[10px] self-start md:self-auto rounded-[3px] px-[12px] py-[6px] ${pageData.statusContainerTone}`}>
              <span className={`h-1.5 w-1.5 rounded-full ${pageData.statusDotTone}`} />
              <span className={`text-[9px] font-bold uppercase tracking-[0.1em] ${pageData.statusTextTone}`}>{pageData.statusLabel}</span>
            </div>
          </div>
        </section>

        <section className="grid grid-cols-1 gap-8 lg:grid-cols-12">
          <div className="space-y-[44px] lg:col-span-8">
            <article className="border-l-[3px] border-primary bg-white px-[28px] py-[24px] shadow-[0_1px_3px_rgba(0,0,0,0.05)]">
              <h2 className="mb-6 flex items-center gap-3 border-b border-surface-container-high pb-[18px] font-base text-[11px] font-black uppercase tracking-[0.14em] text-primary">
                <span className="material-symbols-outlined text-[18px]">timeline</span>
                Milestone Timeline
              </h2>

              <div className="relative ml-2 mt-4 space-y-12 pb-8">
                <div className="absolute left-[7px] top-2 bottom-6 w-[1.5px] bg-[#c1c7d1]/60" />

                {pageData.milestones.map((milestone) => (
                  <article key={`${milestone.title}-${milestone.time}`} className="relative pl-10">
                    <div className={`absolute left-[0.5px] top-[2px] h-3.5 w-3.5 rounded-full ring-4 ${milestone.dotTone} bg-clip-padding`} />
                    <div className="mb-[4px] flex flex-col items-start justify-between gap-1 sm:flex-row">
                      <h3 className={`text-[10px] font-bold leading-[1.3] text-on-surface ${milestone.titleTone === 'text-on-surface-variant' ? 'opacity-70' : ''}`}>
                        {milestone.title}
                      </h3>
                      <span className="text-[7.5px] font-extrabold uppercase tracking-[0.1em] text-primary">
                        {milestone.time}
                      </span>
                    </div>
                    <p className={`whitespace-pre-wrap text-[9px] leading-[1.4] text-slate-500`}>
                      {milestone.detail}
                    </p>
                  </article>
                ))}
              </div>
            </article>

          </div>

          <aside className="space-y-6 lg:col-span-4 pl-0 lg:pl-4 mt-6 lg:mt-0">
            <article className="bg-[#f4f6f8] p-7 shadow-sm">
              <div className="space-y-[20px]">
                {pageData.infoRows.slice(0, 3).map((row) => (
                  <div key={row.label}>
                    <p className="text-[7.5px] font-extrabold uppercase tracking-[0.1em] text-outline mb-[2px]">{row.label}</p>
                    <p className={`font-headline text-[13px] font-black tracking-[-0.01em] ${row.label === 'Tracking ID' ? 'text-primary' : 'text-on-surface'}`}>
                      {row.label === 'Tracking ID' ? trackingId : row.value}
                    </p>
                  </div>
                ))}

                <div className="my-[10px] h-[1px] w-full bg-outline-variant/30" />

                <div className="space-y-[20px]">
                  {pageData.infoRows.slice(3).map((row) => (
                    <div key={row.label}>
                      <p className="text-[7.5px] font-extrabold uppercase tracking-[0.1em] text-outline mb-[2px]">{row.label}</p>
                      <p className="font-headline text-[13px] font-black tracking-[-0.01em] text-on-surface">{row.value}</p>
                    </div>
                  ))}
                </div>
              </div>
            </article>

            <article className="overflow-hidden bg-[#f4f6f8] shadow-sm">
              <div className="p-7 pb-[20px]">
                <h3 className="mb-[18px] flex items-center gap-2 border-b border-surface-container-high pb-[18px] text-[11px] font-black uppercase tracking-[0.14em] text-primary">
                  <span className="material-symbols-outlined text-[16px]">location_on</span>
                  Agency Location
                </h3>

                <div className="space-y-3">
                  <div>
                    <p className="text-[13px] font-bold leading-tight text-on-surface mb-1">{pageData.locationName}</p>
                    <p className="text-[12px] text-[#718096]">{pageData.locationSubtitle}</p>
                  </div>

                  <div className="flex items-center gap-2 pt-1">
                    <span className="material-symbols-outlined text-[16px] text-primary">call</span>
                    <span className="text-[12px] font-bold text-primary">{pageData.locationContact}</span>
                  </div>
                </div>
              </div>

              <div className="relative h-48 w-full bg-[#cbd5e1]/40 border-t border-[#e2e8f0]">
                <div
                  className="h-full w-full bg-cover bg-center opacity-60 grayscale"
                  style={{
                    backgroundImage:
                      'radial-gradient(circle at 50% 50%, #d8dee8 0 40%, transparent 42%), radial-gradient(circle at 45% 45%, #cbd3df 0 20%, transparent 22%)',
                  }}
                />
                <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-[#e2e8f0]/40 to-[#e2e8f0]" />
                
                {/* simulated globe map lines */}
                <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-40 h-40 rounded-full border border-white/60 bg-white/20 overflow-hidden flex justify-center items-center">
                    <div className="absolute w-[180%] h-[180%] border border-white/50 rounded-full top-[-40%]" />
                    <div className="absolute w-[200%] h-[20%] border-t border-white/30 top-1/4" />
                    <div className="absolute w-[200%] h-[20%] border-t border-white/30 top-3/4" />
                </div>
                
                <div className="absolute left-1/2 top-[47%] -translate-x-1/2 -translate-y-1/2 z-10">
                  <span className="material-symbols-outlined text-4xl text-[#005288] drop-shadow-md" style={{ fontVariationSettings: "'FILL' 1" }}>
                    location_on
                  </span>
                </div>
                
                <div className="absolute bottom-3 w-full text-center tracking-widest text-[#94a3b8] font-bold uppercase text-[9px]">
                  Regional Map
                </div>
              </div>
            </article>

          </aside>
        </section>
      </main>

      <AppFooter />
    </div>
  )
}
