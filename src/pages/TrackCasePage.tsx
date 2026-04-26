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
    <article className={`rounded-xl border border-slate-200 bg-white p-6 shadow-sm overflow-hidden relative transition hover:shadow-md ${borderTone.replace('border-', 'border-t-4 border-t-')}`}>
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-5">
        <div>
          <h3 className="text-lg font-bold text-slate-900 leading-tight">{name}</h3>
          <p className="text-xs text-slate-500 mt-1.5 leading-tight">{note}</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          {latestMilestoneHref ? (
            <Link
              to={latestMilestoneHref}
              className={`inline-flex items-center gap-1 text-[9px] font-bold uppercase tracking-wider ${textTone} hover:underline`}
            >
              <span className="material-symbols-outlined text-[13px]">list_alt</span>
              View Milestones
            </Link>
          ) : null}
            <span className={`px-3 py-1 text-[10px] font-bold uppercase tracking-widest rounded-full ${statusTone} min-w-[80px] text-center`}>{status}</span>
        </div>
      </div>

      <div className="relative mt-8 px-2 sm:px-4">
        <div className="absolute left-[28px] right-[28px] sm:left-[32px] sm:right-[32px] top-[15px] h-[3px] rounded-full bg-slate-100" />
        <div className="absolute left-[28px] right-[28px] sm:left-[32px] sm:right-[32px] top-[15px] h-[3px] rounded-full">
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
      ? 'bg-blue-50 text-blue-800 border-blue-200'
      : 'bg-slate-50 text-slate-700 border-slate-200'
  
  return (
    <div className="bg-[#F5F7FA] min-h-screen font-body text-slate-900">
      <AppHeader />

      <main className="mx-auto w-full max-w-[1200px] px-4 py-8 sm:px-6 lg:py-12">
        <ServqualFeedbackPanel trackingId={trackingId} />
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
          <section className="space-y-8 lg:col-span-8">
            <header className="rounded-xl border border-slate-200 bg-white px-6 py-6 shadow-sm flex flex-col justify-between gap-4 md:flex-row md:items-center relative overflow-hidden">
              <div className="absolute top-0 left-0 w-1 h-full bg-[#0b5c92]" />
              <div className="pl-2">
                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-1">Case Tracking Status</p>
                <h1 className="font-headline text-2xl sm:text-3xl font-black uppercase tracking-tight text-slate-900">
                  {trackingId}
                </h1>
                <p className="mt-2 text-sm font-medium text-slate-600">
                  {involvedAgencyCount === 0
                    ? 'Your case has been created, but no agency referrals have been sent yet.'
                    : involvedAgencyCount === 1
                    ? 'Your case is currently being handled by one agency.'
                    : `Your case is currently being handled by ${involvedAgencyCount} agencies.`}
                </p>
              </div>
              <div className={`flex items-center gap-2 self-start md:self-auto rounded-lg border px-4 py-2 ${caseHealthTone}`}>
                <span className="material-symbols-outlined text-[18px]" style={{ fontVariationSettings: "'FILL' 1, 'wght' 600" }}>
                  {caseHealthStatus === 'OPEN' ? 'pending_actions' : 'check_circle'}
                </span>
                <span className="text-[11px] font-bold uppercase tracking-widest">
                  Status: {caseHealthStatus}
                </span>
              </div>
            </header>

            <section className="space-y-4">
              <h2 className="px-2 text-[11px] font-bold uppercase tracking-[0.15em] text-slate-500">Case Overview</h2>
              <article className="rounded-xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm">
                <div className="mb-8 rounded-lg bg-slate-50 p-5 border border-slate-100">
                  <h3 className="mb-3 text-[10px] font-bold uppercase tracking-[0.1em] text-[#0b5c92] flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-[14px]">subject</span> Case Narrative
                  </h3>
                  <p className="text-sm leading-relaxed text-slate-700">
                    {pageData.caseOverview.narrative}
                  </p>
                </div>
                
                <div className="grid grid-cols-1 gap-x-12 gap-y-10 lg:grid-cols-3">
                  <div>
                    <h3 className="border-b border-slate-200 pb-3 text-[11px] font-bold uppercase tracking-widest text-slate-900">OFW Profile</h3>
                    <dl className="mt-5 space-y-4 text-sm">
                      <div><dt className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">Full Name</dt><dd className="font-semibold text-slate-900">{pageData.caseOverview.ofw.fullName}</dd></div>
                      <div><dt className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">Date of Birth</dt><dd className="font-semibold text-slate-900">{pageData.caseOverview.ofw.dateOfBirth}</dd></div>
                      <div><dt className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">Gender</dt><dd className="font-semibold text-slate-900">{pageData.caseOverview.ofw.gender}</dd></div>
                      <div><dt className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">Home Address</dt><dd className="font-semibold text-slate-900 leading-snug">{pageData.caseOverview.ofw.homeAddress}</dd></div>
                      {pageData.caseOverview.ofw.specialCategories.length > 0 ? (
                        <div>
                          <dt className="mb-2 text-[10px] font-bold uppercase tracking-wider text-slate-500">Special Categories</dt>
                          <dd className="flex flex-wrap gap-1.5">
                            {pageData.caseOverview.ofw.specialCategories.map((category) => (
                              <span key={category} className="flex items-center gap-1 rounded-md bg-amber-50 border border-amber-200 px-2 py-1 text-[10px] font-bold text-amber-800">
                                <span className="material-symbols-outlined text-[12px]" style={{ fontVariationSettings: "'FILL' 1" }}>stars</span>
                                {category}
                              </span>
                            ))}
                          </dd>
                        </div>
                      ) : null}
                    </dl>
                  </div>

                  <div>
                    <h3 className="border-b border-slate-200 pb-3 text-[11px] font-bold uppercase tracking-widest text-slate-900">Next of Kin</h3>
                    <dl className="mt-5 space-y-4 text-sm">
                      <div><dt className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">Full Name</dt><dd className="font-semibold text-slate-900">{pageData.caseOverview.nextOfKin.fullName}</dd></div>
                      <div><dt className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">Relationship to Client</dt><dd className="font-semibold text-slate-900">{pageData.caseOverview.nextOfKin.relationship}</dd></div>
                      <div><dt className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">Contact Number</dt><dd className="font-semibold text-slate-900">{pageData.caseOverview.nextOfKin.contactNumber}</dd></div>
                      <div><dt className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">Email Address</dt><dd className="font-semibold text-slate-900">{pageData.caseOverview.nextOfKin.emailAddress}</dd></div>
                      <div><dt className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">Home Address</dt><dd className="font-semibold text-slate-900 leading-snug">{pageData.caseOverview.nextOfKin.homeAddress}</dd></div>
                      {pageData.caseOverview.nextOfKin.specialCategories.length > 0 ? (
                        <div>
                          <dt className="mb-2 text-[10px] font-bold uppercase tracking-wider text-slate-500">Special Categories</dt>
                          <dd className="flex flex-wrap gap-1.5">
                            {pageData.caseOverview.nextOfKin.specialCategories.map((category) => (
                              <span key={category} className="flex items-center gap-1 rounded-md bg-amber-50 border border-amber-200 px-2 py-1 text-[10px] font-bold text-amber-800">
                                <span className="material-symbols-outlined text-[12px]" style={{ fontVariationSettings: "'FILL' 1" }}>stars</span>
                                {category}
                              </span>
                            ))}
                          </dd>
                        </div>
                      ) : null}
                    </dl>
                  </div>

                  <div>
                    <h3 className="border-b border-slate-200 pb-3 text-[11px] font-bold uppercase tracking-widest text-slate-900">Work History</h3>
                    <dl className="mt-5 space-y-4 text-sm">
                      <div><dt className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">Last Country</dt><dd className="font-semibold text-slate-900">{pageData.caseOverview.workHistory.lastCountry}</dd></div>
                      <div><dt className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">Last Position</dt><dd className="font-semibold text-slate-900">{pageData.caseOverview.workHistory.lastPosition}</dd></div>
                      <div><dt className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">Arrival Date</dt><dd className="font-semibold text-slate-900">{pageData.caseOverview.workHistory.arrivalDate}</dd></div>
                    </dl>
                  </div>
                </div>
              </article>
            </section>

            <section className="space-y-4">
              <h2 className="px-2 text-[11px] font-bold uppercase tracking-[0.15em] text-slate-500">Agency Breakdown</h2>

              {pageData.trackingAgencies.length > 0 ? (
                <div className="grid grid-cols-1 gap-4">
                  {pageData.trackingAgencies.map((agency) => (
                    <AgencyCard
                      key={agency.name}
                      {...agency}
                      latestMilestoneHref={
                        agency.latestMilestonePath
                          ? `/track/${encodeURIComponent(trackingId)}${agency.latestMilestonePath}`
                          : undefined
                      }
                    />
                  ))}
                </div>
              ) : (
                <article className="rounded-xl border border-slate-200 bg-white p-8 text-center shadow-sm">
                  <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-slate-100">
                    <span className="material-symbols-outlined text-slate-400">hourglass_empty</span>
                  </div>
                  <h3 className="text-sm font-bold text-slate-900">No referrals yet</h3>
                  <p className="mt-2 text-sm text-slate-500">
                    This case exists in the system, but it has not been referred to any agencies yet.
                  </p>
                </article>
              )}
            </section>
          </section>

          <aside className="col-span-1 lg:col-span-4 mt-6 lg:mt-0">
            <div id="case-timeline" className="h-full rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="mb-6 flex flex-col gap-4 border-b border-slate-100 pb-5">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-[18px] text-[#0b5c92]">history</span>
                  <h2 className="text-[11px] font-bold uppercase tracking-widest text-[#0b5c92]">Case Timeline</h2>
                </div>
                <select
                  value={timelineAgencyFilter}
                  onChange={(event) => setTimelineAgencyFilter(event.target.value)}
                  className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-700 outline-none focus:border-[#0b5c92]"
                >
                  <option value="ALL">All agencies</option>
                  {timelineAgencies.map((agency) => (
                    <option key={agency} value={agency}>{agency}</option>
                  ))}
                </select>
              </div>

              <div className="relative pt-2">
                <div className="absolute left-[14px] top-6 bottom-6 w-0.5 bg-slate-100" />
                <div className="flex flex-col-reverse gap-8">
                  {filteredTimeline.map((item, index) => (
                    <article key={`${item.date}-${index}`} className="relative grid grid-cols-[28px_1fr] items-start gap-4">
                      <div className="z-10 flex h-7 w-7 items-center justify-center overflow-hidden rounded-full border border-slate-200 bg-white shadow-sm p-0.5">
                        <img src={item.logoUrl} alt={`${item.agency} timeline source`} className="h-full w-full object-contain rounded-full" />
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