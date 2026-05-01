import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import AppFooter from '../components/layout/AppFooter'
import AppHeader from '../components/layout/AppHeader'
import TrackingNotFoundState from '../components/TrackingNotFoundState'
import { getManagedAgencyMilestonePageData, getManagedTrackCasePageData } from '../data/caseLifecycleStore'
import { getFeedbackByCase, submitFeedback, type FeedbackEntry } from '../data/feedbackData'

export default function DmwMilestonesPage() {
  const { trackerNumber } = useParams()
  const cleanTrackerNumber = trackerNumber ? decodeURIComponent(trackerNumber).trim() : ''
  const pageData = cleanTrackerNumber ? getManagedAgencyMilestonePageData('dmw', cleanTrackerNumber) : null
  const casePageData = cleanTrackerNumber ? getManagedTrackCasePageData(cleanTrackerNumber) : null

  const [feedbackList, setFeedbackList] = useState<FeedbackEntry[]>([])
  const [isFeedbackModalOpen, setIsFeedbackModalOpen] = useState(false)
  const [isViewModalOpen, setIsViewModalOpen] = useState(false)
  const [feedbackRating, setFeedbackRating] = useState(4)
  const [feedbackComments, setFeedbackComments] = useState('')
  const [isSubmittingFeedback, setIsSubmittingFeedback] = useState(false)

  useEffect(() => {
    if (pageData?.caseId) {
      const allFeedback = getFeedbackByCase(pageData.caseId)
      setFeedbackList(allFeedback)
    }
  }, [pageData?.caseId])

  const isCompleted = pageData?.referralStatus === 'COMPLETED'
  const hasExistingFeedback = feedbackList.length > 0

  function handleSubmitFeedback(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!pageData?.caseId) return

    setIsSubmittingFeedback(true)
    try {
      submitFeedback(pageData.caseId, feedbackRating, feedbackComments, pageData?.referralServices)
      const updated = getFeedbackByCase(pageData.caseId)
      setFeedbackList(updated)
      setIsFeedbackModalOpen(false)
      setFeedbackRating(4)
      setFeedbackComments('')
    } catch (err) {
      // swallow for demo
    } finally {
      setIsSubmittingFeedback(false)
    }
  }

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

  const trackingId = pageData.trackingId || pageData.infoRows.find((row) => row.label === 'Tracking ID')?.value || cleanTrackerNumber

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
            {/* Unified Referral Timeline */}
            <article className="border-l-[3px] border-primary bg-white px-[28px] py-[24px] shadow-[0_1px_3px_rgba(0,0,0,0.05)]">
              <h2 className="mb-6 flex items-center gap-3 border-b border-surface-container-high pb-[18px] font-base text-[11px] font-black uppercase tracking-[0.14em] text-primary">
                <span className="material-symbols-outlined text-[18px]">timeline</span>
                Referral Timeline
              </h2>

              <div className="relative ml-2 mt-4 space-y-8 pb-8">
                <div className="absolute left-[7px] top-2 bottom-6 w-[1.5px] bg-[#c1c7d1]/60" />

                {(() => {
                  // Merge milestones and status updates, sorted by date
                  const mergedTimeline = [
                    ...pageData.milestones.map((m) => ({
                      type: 'milestone' as const,
                      title: m.title,
                      detail: m.detail,
                      time: m.time,
                      timeObj: new Date(m.time || 0),
                      dotTone: m.dotTone,
                      titleTone: m.titleTone,
                    })),
                    ...(casePageData?.caseTimeline || []).map((item) => ({
                      type: 'status' as const,
                      title: item.title,
                      detail: item.detail,
                      date: item.date,
                      timeObj: new Date(item.date),
                      agency: item.agency,
                    })),
                  ].sort((a, b) => b.timeObj.getTime() - a.timeObj.getTime())

                  return mergedTimeline.map((item, idx) =>
                    item.type === 'milestone' ? (
                      <article key={`milestone-${item.title}-${item.time}`} className="relative pl-10">
                        <div className={`absolute left-[0.5px] top-[2px] h-3.5 w-3.5 rounded-full ring-4 ${item.dotTone} bg-clip-padding`} />
                        <div className="mb-[4px] flex flex-col items-start justify-between gap-1 sm:flex-row">
                          <h3 className={`text-[10px] font-bold leading-[1.3] text-on-surface ${item.titleTone === 'text-on-surface-variant' ? 'opacity-70' : ''}`}>
                            {item.title}
                          </h3>
                          <span className="text-[7.5px] font-extrabold uppercase tracking-[0.1em] text-primary">
                            {item.time}
                          </span>
                        </div>
                        <p className={`whitespace-pre-wrap text-[9px] leading-[1.4] text-slate-500`}>
                          {item.detail}
                        </p>
                      </article>
                    ) : (
                      <article key={`status-${idx}`} className="relative pl-10">
                        <div className="absolute left-[0.5px] top-[2px] h-3.5 w-3.5 rounded-full ring-4 ring-blue-100 bg-blue-500" />
                        <div className="mb-[4px] flex flex-col items-start justify-between gap-1 sm:flex-row">
                          <h3 className="text-[10px] font-bold leading-[1.3] text-on-surface">
                            {item.title}
                          </h3>
                          <span className="text-[7.5px] font-extrabold uppercase tracking-[0.1em] text-blue-600">
                            {new Date(item.date).toLocaleDateString()}
                          </span>
                        </div>
                        <p className="text-[9px] leading-[1.4] text-slate-600">{item.detail}</p>
                        {item.agency && <p className="text-[8px] text-slate-500 mt-1">Agency: {item.agency}</p>}
                      </article>
                    )
                  )
                })()}
              </div>
            </article>

            {/* Feedback Section */}
            {isCompleted && (
              <article className="border-l-[3px] border-emerald-500 bg-white px-[28px] py-[24px] shadow-[0_1px_3px_rgba(0,0,0,0.05)]">
                <h2 className="mb-6 flex items-center gap-3 border-b border-surface-container-high pb-[18px] font-base text-[11px] font-black uppercase tracking-[0.14em] text-emerald-700">
                  <span className="material-symbols-outlined text-[18px]">rate_review</span>
                  Your Feedback
                </h2>

                <div className="space-y-4">
                  {!hasExistingFeedback && (
                    <div className="text-center py-6">
                      <p className="text-[11px] text-slate-600 mb-4">Share your experience with this agency to help them improve their services.</p>
                      <button
                        type="button"
                        onClick={() => setIsFeedbackModalOpen(true)}
                        className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 text-white px-6 py-2 text-[11px] font-bold uppercase tracking-wider hover:brightness-110 transition-all"
                      >
                        <span className="material-symbols-outlined text-[14px]">rate_review</span>
                        Submit Feedback
                      </button>
                    </div>
                  )}

                  {hasExistingFeedback && (
                    <>
                      <div className="rounded-lg bg-emerald-50 p-4 border border-emerald-200">
                        <p className="text-[11px] text-slate-600 mb-3">Feedback submitted: <span className="font-bold text-slate-900">{feedbackList[0]?.overallRating?.toFixed(1) || feedbackList[0]?.rating.toFixed(2)}/5</span></p>
                        <button
                          type="button"
                          onClick={() => setIsViewModalOpen(true)}
                          className="inline-flex items-center gap-2 rounded border border-emerald-600 text-emerald-700 px-4 py-2 text-[10px] font-bold uppercase hover:bg-emerald-50 transition"
                        >
                          <span className="material-symbols-outlined text-[12px]">visibility</span>
                          View Details
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </article>
            )}

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

      {/* Feedback Modal */}
      {isFeedbackModalOpen && (
        <div className="fixed inset-0 z-[60] bg-black/40 p-4 flex items-center justify-center">
          <div className="w-full max-w-md rounded-lg bg-white shadow-xl">
            <div className="border-b border-slate-200 px-5 py-4">
              <h3 className="text-sm font-bold text-slate-900">Submit Feedback</h3>
              <p className="text-xs text-slate-500 mt-1">{pageData?.locationName}</p>
            </div>

            <form onSubmit={handleSubmitFeedback} className="p-5 space-y-4">
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-slate-700 block mb-2">Rating (1-5)</label>
                <select
                  value={feedbackRating}
                  onChange={(event) => setFeedbackRating(Number(event.target.value))}
                  className="w-full rounded border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 focus:border-primary focus:outline-none"
                >
                  {[1, 2, 3, 4, 5].map((score) => (
                    <option key={score} value={score}>{score}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-slate-700 block mb-2">Comments (optional)</label>
                <textarea
                  value={feedbackComments}
                  onChange={(event) => setFeedbackComments(event.target.value)}
                  placeholder="Share your experience..."
                  rows={3}
                  className="w-full rounded border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 placeholder:text-slate-400 focus:border-primary focus:outline-none resize-none"
                />
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setIsFeedbackModalOpen(false)}
                  className="flex-1 rounded border border-slate-300 bg-white px-4 py-2 text-xs font-bold uppercase text-slate-700 hover:bg-slate-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingFeedback}
                  className="flex-1 rounded bg-primary px-4 py-2 text-xs font-bold uppercase text-white hover:brightness-110 disabled:opacity-50 transition"
                >
                  Submit
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Feedback Modal */}
      {isViewModalOpen && hasExistingFeedback && (
        <div className="fixed inset-0 z-[60] bg-black/40 p-4 flex items-center justify-center overflow-y-auto">
          <div className="w-full max-w-lg rounded-lg bg-white shadow-xl my-8">
            <div className="border-b border-slate-200 px-5 py-4 sticky top-0 bg-white">
              <h3 className="text-sm font-bold text-slate-900">Your Feedback</h3>
              <p className="text-xs text-slate-500 mt-1">{pageData?.locationName}</p>
            </div>

            <div className="p-5 space-y-4 max-h-[70vh] overflow-y-auto">
              {feedbackList.map((feedback) => (
                <div key={feedback.id} className="space-y-4">
                  {/* Rating */}
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-slate-700">Rating</span>
                    <span className="text-[13px] font-bold text-primary">{feedback.overallRating?.toFixed(1) || feedback.rating.toFixed(2)}/5</span>
                  </div>

                  {/* Services Applied */}
                  {feedback.serviceName && (
                    <div>
                      <p className="text-[11px] font-bold text-slate-700 mb-2">Service Applied</p>
                      <div className="inline-block px-2.5 py-1.5 bg-blue-50 text-blue-700 border border-blue-200 text-[10px] font-bold rounded">
                        {feedback.serviceName}
                      </div>
                    </div>
                  )}

                  {/* Submission Date */}
                  <div className="flex items-center justify-between text-[10px] text-slate-500">
                    <span>Submitted:</span>
                    <span>{new Date(feedback.createdAt).toLocaleDateString()}</span>
                  </div>

                  {/* Comments */}
                  {feedback.comments && (
                    <div className="pt-2 border-t border-slate-200">
                      <p className="text-[10px] font-bold text-slate-700 mb-1.5">Comments</p>
                      <p className="text-[11px] text-slate-600 leading-relaxed italic">{feedback.comments}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div className="border-t border-slate-200 px-5 py-4 sticky bottom-0 bg-white">
              <button
                type="button"
                onClick={() => setIsViewModalOpen(false)}
                className="w-full rounded border border-slate-300 bg-white px-4 py-2 text-xs font-bold uppercase text-slate-700 hover:bg-slate-50 transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      <AppFooter />
    </div>
  )
}
