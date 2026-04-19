import { useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import AppFooter from '../components/layout/AppFooter'
import AppHeader from '../components/layout/AppHeader'
import { toCaseHealthStatus, type TrackingAgencyCardData } from '../data/unifiedData'
import { getManagedTrackCasePageData } from '../data/caseLifecycleStore'
import TrackingNotFoundState from '../components/TrackingNotFoundState'
import ServqualFeedbackPanel from '../components/ServqualFeedbackPanel'

type AgencyCardProps = TrackingAgencyCardData & {
  latestMilestoneHref?: string
}

function AgencyCard({
  name,
  note,
  status,
  statusTone,
  borderTone,
  textTone,
  lineTone,
  steps,
  latestMilestoneLabel,
  latestMilestoneHref,
}: AgencyCardProps) {
  const completedCount = steps.filter((step) => step.state === 'complete').length
  const progressPercent = (completedCount / (steps.length - 1)) * 100

  return (
    <article className={`border-l-4 bg-surface-container-lowest p-[24px] shadow-sm ${borderTone}`}>
      <div className="mb-6 flex items-center justify-between gap-4 border-b border-surface-container-high pb-[18px]">
        <div>
          <h3 className="text-[16px] font-bold text-on-surface leading-tight">{name}</h3>
          <p className="text-[12px] text-on-surface-variant mt-1 leading-tight">{note}</p>
        </div>
        <div className="flex items-center gap-3">
          {latestMilestoneHref ? (
            <Link
              to={latestMilestoneHref}
              className={`inline-flex items-center gap-1 text-[9px] font-bold uppercase tracking-wider ${textTone} hover:underline`}
            >
              <span className="material-symbols-outlined text-[13px]">list_alt</span>
              View Milestones
            </Link>
          ) : null}
          <span className={`px-2.5 py-[3px] text-[9px] font-bold uppercase tracking-widest ${statusTone} min-w-[70px] text-center`}>{status}</span>
        </div>
      </div>

      <div className="relative mt-7 px-4">
        <div className="absolute left-[32px] right-[32px] top-[15px] h-[2px] bg-slate-200" />
        <div className="absolute left-[32px] right-[32px] top-[15px] h-[2px]">
          <div className={`h-full transition-all duration-500 ${lineTone}`} style={{ width: `${progressPercent}%` }} />
        </div>

        <div className="relative z-10 flex justify-between">
          {steps.map((step) => {
            return (
              <div key={`${name}-${step.label}`} className="flex flex-col items-center">
                <div
                  className={[
                    'mb-2.5 flex h-8 w-8 items-center justify-center rounded-full',
                    step.state === 'complete' ? 'bg-white text-primary ring-2 ring-primary shadow-sm' : '',
                    step.state === 'active' ? 'bg-white text-secondary ring-2 ring-secondary shadow-sm' : '',
                    step.state === 'pending' ? 'bg-surface-container text-outline-variant font-black' : '',
                  ].join(' ')}
                >
                  {step.state === 'active' ? (
                     <span className="material-symbols-outlined text-[15px] text-secondary" style={{ fontVariationSettings: "'FILL' 1, 'wght' 700" }}>
                       sync
                     </span>
                  ) : step.state === 'pending' ? (
                    <span className="material-symbols-outlined text-[10px] font-black">radio_button_unchecked</span>
                  ) : (
                    <span
                      className="material-symbols-outlined text-[16px] font-bold text-primary"
                      style={{ fontVariationSettings: "'FILL' 1, 'wght' 700" }}
                    >
                      check
                    </span>
                  )}
                </div>
                <span
                  className={[
                    'text-[8.5px] font-bold uppercase tracking-wider',
                    step.state === 'active' ? textTone : 'text-on-surface-variant',
                    step.state === 'complete' ? 'text-on-surface' : '',
                  ].join(' ')}
                >
                  {step.label}
                </span>
                {step.state === 'active' && latestMilestoneLabel ? (
                  latestMilestoneHref ? (
                    <Link
                      to={latestMilestoneHref}
                      className="mt-1 text-center text-[8px] font-semibold text-primary underline decoration-primary/50 underline-offset-2 hover:text-primary"
                    >
                      {latestMilestoneLabel}
                    </Link>
                  ) : (
                    <span className="mt-1 text-center text-[8px] font-semibold text-primary">
                      {latestMilestoneLabel}
                    </span>
                  )
                ) : null}
              </div>
            );
          })}
        </div>
      </div>
    </article>
  )
}

import AiAssistant from '../components/AiAssistant'

export default function TrackCasePage() {
  const { trackerNumber } = useParams()
  const cleanTrackerNumber = trackerNumber ? decodeURIComponent(trackerNumber).trim() : ''
  const pageData = cleanTrackerNumber ? getManagedTrackCasePageData(cleanTrackerNumber) : null
  const [timelineAgencyFilter, setTimelineAgencyFilter] = useState('ALL')

  if (!pageData) {
    return (
      <div className="bg-surface font-body text-on-surface">
        <AppHeader />
        <main className="mx-auto w-full max-w-[1100px] px-5 py-9">
          <TrackingNotFoundState description="We could not find a case matching this tracking ID. Please verify your ID and try again." />
        </main>
        <AppFooter />
      </div>
    )
  }

  const trackingId = pageData.trackingId
  const involvedAgencyCount = pageData.trackingAgencies.length

  const timelineAgencies = useMemo(() => {
    const unique = new Set<string>()
    pageData.caseTimeline.forEach((item) => {
      if (item.agency && item.agency !== 'Bayanihan') {
        unique.add(item.agency)
      }
    })
    return Array.from(unique).sort((a, b) => a.localeCompare(b))
  }, [pageData.caseTimeline])

  useEffect(() => {
    if (timelineAgencyFilter !== 'ALL' && !timelineAgencies.includes(timelineAgencyFilter)) {
      setTimelineAgencyFilter('ALL')
    }
  }, [timelineAgencyFilter, timelineAgencies])

  const filteredTimeline = useMemo(() => {
    if (timelineAgencyFilter === 'ALL') {
      return pageData.caseTimeline
    }

    return pageData.caseTimeline.filter((item) => item.agency === timelineAgencyFilter)
  }, [pageData.caseTimeline, timelineAgencyFilter])

  const caseHealthStatus = toCaseHealthStatus(pageData.trackedCase.status)
  const caseHealthTone =
    caseHealthStatus === 'OPEN'
      ? 'bg-blue-100 text-blue-900'
      : 'bg-slate-200 text-slate-600'
  
  return (
    <div className="bg-surface font-body text-on-surface">
      <AppHeader />

      <main className="mx-auto w-full max-w-[1100px] px-5 py-9">
        <ServqualFeedbackPanel trackingId={trackingId} />
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
          <section className="space-y-[44px] lg:col-span-8">
            <header className="border-l-[3px] border-primary bg-white px-[28px] py-[24px] shadow-[0_1px_3px_rgba(0,0,0,0.05)]">
              <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
                <div>
                  <h1 className="mt-[2px] font-headline text-[26px] font-[900] uppercase tracking-[-0.02em] text-primary">
                    Tracking ID: {trackingId}
                  </h1>
                  <p className="mt-[6px] text-[11px] font-[500] text-on-surface-variant">
                    {involvedAgencyCount === 0
                      ? 'Your case has been created, but no agency referrals have been sent yet.'
                      : involvedAgencyCount === 1
                      ? 'Your case is currently being handled by one agency.'
                      : `Your case is currently being handled by ${involvedAgencyCount} agencies.`}
                  </p>
                </div>
                <div className={`flex items-center gap-[14px] self-start md:self-auto rounded-[3px] px-[12px] py-[6px] ${caseHealthTone}`}>
                  <span className="text-[9px] font-bold uppercase tracking-[0.1em]">
                    Status: {caseHealthStatus}
                  </span>
                  <span className="material-symbols-outlined text-[16px]" style={{ fontVariationSettings: "'FILL' 0, 'wght' 600" }}>verified_user</span>
                </div>
              </div>
            </header>

            <section className="space-y-4">
              <h2 className="px-1 text-[9px] font-[800] uppercase tracking-[0.15em] text-outline">Case Overview</h2>
              <article className="border-l-[3px] border-[#9ccaff] bg-white px-[28px] py-[24px] shadow-[0_1px_3px_rgba(0,0,0,0.05)]">
                <div className="mb-[32px]">
                  <h3 className="border-b border-surface-container-high pb-[10px] text-[9.5px] font-[800] uppercase tracking-[0.1em] text-primary">Case Narrative</h3>
                  <p className="mt-[16px] text-[11px] leading-[1.8] text-on-surface-variant font-[400]">
                    {pageData.caseOverview.narrative}
                  </p>
                </div>
                
                <div className="grid grid-cols-1 gap-x-12 gap-y-8 lg:grid-cols-3">
                  <div>
                    <h3 className="border-b border-surface-container-high pb-[10px] text-[9.5px] font-[800] uppercase tracking-[0.1em] text-primary">OFW Information</h3>
                    <dl className="mt-[18px] space-y-[18px] text-[11px]">
                      <div><dt className="text-[7.5px] font-bold uppercase tracking-[0.05em] text-on-surface-variant mb-0.5">Full Name</dt><dd className="font-bold text-[11.5px] text-on-surface">{pageData.caseOverview.ofw.fullName}</dd></div>
                      <div><dt className="text-[7.5px] font-bold uppercase tracking-[0.05em] text-on-surface-variant mb-0.5">Date of Birth</dt><dd className="font-bold text-[11.5px] text-on-surface">{pageData.caseOverview.ofw.dateOfBirth}</dd></div>
                      <div><dt className="text-[7.5px] font-bold uppercase tracking-[0.05em] text-on-surface-variant mb-0.5">Gender</dt><dd className="font-bold text-[11.5px] text-on-surface">{pageData.caseOverview.ofw.gender}</dd></div>
                      <div><dt className="text-[7.5px] font-bold uppercase tracking-[0.05em] text-on-surface-variant mb-0.5">Home Address</dt><dd className="font-bold text-[11.5px] text-on-surface leading-snug">{pageData.caseOverview.ofw.homeAddress}</dd></div>
                      {pageData.caseOverview.ofw.specialCategories.length > 0 ? (
                        <div>
                          <dt className="mb-[6px] text-[7.5px] font-bold uppercase tracking-[0.05em] text-on-surface-variant">Special Categories</dt>
                          <dd className="flex flex-wrap gap-[6px]">
                            {pageData.caseOverview.ofw.specialCategories.map((category) => (
                              <span key={category} className="flex items-center gap-[2px] rounded-[3px] bg-[#eef4f9] px-[6px] py-[3px] text-[8px] font-[700] text-primary">
                                <span className="material-symbols-outlined text-[10px]" style={{ fontVariationSettings: "'FILL' 1" }}>escalator_warning</span>
                                {category}
                              </span>
                            ))}
                          </dd>
                        </div>
                      ) : null}
                    </dl>
                  </div>

                  <div>
                    <h3 className="border-b border-surface-container-high pb-[10px] text-[9.5px] font-[800] uppercase tracking-[0.1em] text-primary">Next of Kin</h3>
                    <dl className="mt-[18px] space-y-[18px] text-[11px]">
                      <div><dt className="text-[7.5px] font-bold uppercase tracking-[0.05em] text-on-surface-variant mb-0.5">Full Name</dt><dd className="font-bold text-[11.5px] text-on-surface">{pageData.caseOverview.nextOfKin.fullName}</dd></div>
                      <div><dt className="text-[7.5px] font-bold uppercase tracking-[0.05em] text-on-surface-variant mb-0.5">Contact Number</dt><dd className="font-bold text-[11.5px] text-on-surface">{pageData.caseOverview.nextOfKin.contactNumber}</dd></div>
                      <div><dt className="text-[7.5px] font-bold uppercase tracking-[0.05em] text-on-surface-variant mb-0.5">Email Address</dt><dd className="font-bold text-[11.5px] text-on-surface">{pageData.caseOverview.nextOfKin.emailAddress}</dd></div>
                      <div><dt className="text-[7.5px] font-bold uppercase tracking-[0.05em] text-on-surface-variant mb-0.5">Home Address</dt><dd className="font-bold text-[11.5px] text-on-surface leading-snug">{pageData.caseOverview.nextOfKin.homeAddress}</dd></div>
                      {pageData.caseOverview.nextOfKin.specialCategories.length > 0 ? (
                        <div>
                          <dt className="mb-[6px] text-[7.5px] font-bold uppercase tracking-[0.05em] text-on-surface-variant">Special Categories</dt>
                          <dd className="flex flex-wrap gap-[6px]">
                            {pageData.caseOverview.nextOfKin.specialCategories.map((category) => (
                              <span key={category} className="flex items-center gap-[2px] rounded-[3px] bg-[#eef4f9] px-[6px] py-[3px] text-[8px] font-[700] text-primary">
                                <span className="material-symbols-outlined text-[10px]" style={{ fontVariationSettings: "'FILL' 1" }}>escalator_warning</span>
                                {category}
                              </span>
                            ))}
                          </dd>
                        </div>
                      ) : null}
                    </dl>
                  </div>

                  <div>
                    <h3 className="border-b border-surface-container-high pb-[10px] text-[9.5px] font-[800] uppercase tracking-[0.1em] text-primary">Work History</h3>
                    <dl className="mt-[18px] space-y-[18px] text-[11px]">
                      <div><dt className="text-[7.5px] font-bold uppercase tracking-[0.05em] text-on-surface-variant mb-0.5">Last Country</dt><dd className="font-bold text-[11.5px] text-on-surface">{pageData.caseOverview.workHistory.lastCountry}</dd></div>
                      <div><dt className="text-[7.5px] font-bold uppercase tracking-[0.05em] text-on-surface-variant mb-0.5">Last Position</dt><dd className="font-bold text-[11.5px] text-on-surface">{pageData.caseOverview.workHistory.lastPosition}</dd></div>
                      <div><dt className="text-[7.5px] font-bold uppercase tracking-[0.05em] text-on-surface-variant mb-0.5">Arrival Date</dt><dd className="font-bold text-[11.5px] text-on-surface">{pageData.caseOverview.workHistory.arrivalDate}</dd></div>
                    </dl>
                  </div>
                </div>
              </article>
            </section>

            <section className="space-y-4">
              <h2 className="px-1 text-[9px] font-[800] uppercase tracking-[0.15em] text-outline">Agency Breakdown</h2>

              {pageData.trackingAgencies.length > 0 ? (
                pageData.trackingAgencies.map((agency) => (
                  <AgencyCard
                    key={agency.name}
                    {...agency}
                    latestMilestoneHref={
                      agency.latestMilestonePath
                        ? `/track/${encodeURIComponent(trackingId)}${agency.latestMilestonePath}`
                        : undefined
                    }
                  />
                ))
              ) : (
                <article className="border-l-[3px] border-[#d1d5db] bg-white px-[28px] py-[24px] shadow-[0_1px_3px_rgba(0,0,0,0.05)]">
                  <h3 className="text-[10px] font-bold uppercase tracking-[0.1em] text-slate-500">No referrals yet</h3>
                  <p className="mt-3 text-[11px] leading-6 text-on-surface-variant">
                    This case exists in the system, but it has not been referred to any agencies yet.
                  </p>
                </article>
              )}
            </section>
          </section>

          <aside className="col-span-1 lg:col-span-4 pl-0 lg:pl-4 mt-6 lg:mt-0">
            <div id="case-timeline" className="h-full bg-[#f4f6f8] p-7 shadow-sm">
              <div className="mb-[28px] flex flex-wrap items-center justify-between gap-2 border-b border-surface-container-high pb-[18px]">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-[18px] text-primary">history</span>
                  <h2 className="text-[11px] font-black uppercase tracking-[0.14em] text-primary">Case Timeline</h2>
                </div>
                <select
                  value={timelineAgencyFilter}
                  onChange={(event) => setTimelineAgencyFilter(event.target.value)}
                  className="h-[30px] w-[170px] max-w-full shrink-0 rounded-[3px] border border-surface-container-high bg-white px-2 text-[10px] font-semibold uppercase tracking-[0.08em] text-on-surface"
                >
                  <option value="ALL">All agencies</option>
                  {timelineAgencies.map((agency) => (
                    <option key={agency} value={agency}>{agency}</option>
                  ))}
                </select>
              </div>

              <div className="relative pt-1">
                <div className="absolute left-[10px] top-[14px] bottom-6 w-[1.5px] bg-[#c1c7d1]/60" />
                <div className="flex flex-col-reverse gap-[32px]">
                  {filteredTimeline.map((item, index) => (
                    <article key={`${item.date}-${index}`} className="relative grid grid-cols-[22px_1fr] items-start gap-3">
                      <div className="z-10 flex h-[22px] w-[22px] items-center justify-center overflow-hidden rounded-full border border-white bg-white shadow-sm">
                        <img src={item.logoUrl} alt={`${item.agency} timeline source`} className="h-full w-full object-cover" />
                      </div>
                      <div className="min-w-0">
                        <p className="mb-[2px] text-[7.5px] font-extrabold uppercase tracking-[0.1em] text-primary">{item.date}</p>
                        <h3 className="mb-[3px] text-[10px] font-bold leading-[1.3] text-on-surface">{item.title}</h3>
                        <p className="whitespace-pre-wrap text-[9px] leading-[1.4] text-slate-500">{item.detail}</p>
                      </div>
                    </article>
                  ))}
                </div>
              </div>
            </div>
          </aside>
        </div>
      </main>
      <AppFooter />
      <AiAssistant trackingId={trackingId} />
    </div>
  )
}