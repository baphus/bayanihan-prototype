import { useEffect, useMemo, useState, type ChangeEvent, type ReactNode } from 'react'
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom'
import { pageHeadingStyles } from '../agency/pageHeadingStyles'
import { getStatusBadgeClass } from '../agency/statusBadgeStyles'
import { formatDisplayDateTime, getCaseManagerAgencies, getCaseManagerReferralById, type CaseManagerReferral } from '../../data/unifiedData'

type TimelineItem = {
  id: string
  actorType: 'Agency' | 'Case Manager' | 'System'
  agencyId?: string
  logoType: 'bayanihan' | 'agency'
  title: string
  description: string
  timestamp: string
  actor: string
}

function getTimelineLogoSrc(logoType: TimelineItem['logoType'], agencyId?: string): string {
  if (logoType === 'agency' && agencyId) {
    const matchedAgency = getCaseManagerAgencies().find((agency) => agency.id === agencyId)
    if (matchedAgency?.logoUrl) {
      return matchedAgency.logoUrl
    }
  }

  return '/logo.png'
}

function withOffsetMinutes(iso: string, minutes: number): string {
  return new Date(new Date(iso).getTime() + minutes * 60000).toISOString()
}

function buildReferralTimeline(referral: CaseManagerReferral): TimelineItem[] {
  const timeline: TimelineItem[] = [
    {
      id: `${referral.id}-created`,
      actorType: 'Case Manager',
      logoType: 'bayanihan',
      title: 'Referral Sent',
      description: `Case was endorsed to ${referral.agencyName} for ${referral.service}.`,
      timestamp: referral.createdAt,
      actor: 'Case Manager - Marychris M. Relon',
    },
  ]

  if (referral.status === 'PENDING') {
    timeline.push({
      id: `${referral.id}-pending`,
      actorType: 'Agency',
      agencyId: referral.agencyId,
      logoType: 'agency',
      title: 'Awaiting Agency Intake',
      description: 'Referral is pending agency intake acknowledgment.',
      timestamp: withOffsetMinutes(referral.createdAt, 20),
      actor: `Agency Focal - ${referral.agencyName}`,
    })
  }

  if (referral.status === 'PROCESSING') {
    timeline.push({
      id: `${referral.id}-accepted`,
      actorType: 'Agency',
      agencyId: referral.agencyId,
      logoType: 'agency',
      title: 'Referral Accepted',
      description: 'Agency accepted the referral and started processing.',
      timestamp: referral.updatedAt,
      actor: `Agency Focal - ${referral.agencyName}`,
    })
  }

  if (referral.status === 'COMPLETED') {
    timeline.push(
      {
        id: `${referral.id}-accepted`,
        actorType: 'Agency',
        agencyId: referral.agencyId,
        logoType: 'agency',
        title: 'Referral Accepted',
        description: 'Agency accepted the referral and initiated service coordination.',
        timestamp: withOffsetMinutes(referral.updatedAt, -90),
        actor: `Agency Focal - ${referral.agencyName}`,
      },
      {
        id: `${referral.id}-completed`,
        actorType: 'Agency',
        agencyId: referral.agencyId,
        logoType: 'agency',
        title: 'Referral Completed',
        description: 'Service delivery was completed and verified by the agency.',
        timestamp: referral.updatedAt,
        actor: `Agency Focal - ${referral.agencyName}`,
      },
    )
  }

  if (referral.status === 'REJECTED') {
    timeline.push({
      id: `${referral.id}-rejected`,
      actorType: 'Agency',
      agencyId: referral.agencyId,
      logoType: 'agency',
      title: 'Referral Rejected',
      description: 'Agency rejected the referral and returned it for follow-up.',
      timestamp: referral.updatedAt,
      actor: `Agency Focal - ${referral.agencyName}`,
    })
  }

  return timeline
}

export default function ReferralViewPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { referralId = '' } = useParams()

  const routeReferral = (location.state as { referral?: CaseManagerReferral } | null)?.referral
  const resolvedReferral = useMemo(() => {
    if (routeReferral && routeReferral.id === referralId) {
      return routeReferral
    }

    return getCaseManagerReferralById(referralId)
  }, [referralId, routeReferral])

  const [referral, setReferral] = useState<CaseManagerReferral | null>(resolvedReferral ?? null)
  const [timeline, setTimeline] = useState<TimelineItem[]>(() => (resolvedReferral ? buildReferralTimeline(resolvedReferral) : []))
  const [notesDraft, setNotesDraft] = useState(resolvedReferral?.notes ?? '')
  const [newDocuments, setNewDocuments] = useState<File[]>([])
  const [saveMessage, setSaveMessage] = useState('')

  useEffect(() => {
    if (!resolvedReferral) {
      setReferral(null)
      setTimeline([])
      setNotesDraft('')
      setNewDocuments([])
      setSaveMessage('')
      return
    }

    setReferral(resolvedReferral)
    setTimeline(buildReferralTimeline(resolvedReferral))
    setNotesDraft(resolvedReferral.notes)
    setNewDocuments([])
    setSaveMessage('')
  }, [resolvedReferral])

  if (!referral) {
    return (
      <div className="mx-auto max-w-4xl space-y-4 pb-6">
        <button
          type="button"
          onClick={() => navigate('/case-manager/referrals')}
          className="inline-flex items-center gap-1 text-[12px] font-bold text-slate-600 hover:text-slate-800"
        >
          <span className="material-symbols-outlined text-[18px]">arrow_back</span>
          Back to Referrals
        </button>
        <div className="rounded-[4px] border border-[#e2e8f0] bg-white p-6 text-center">
          <p className="text-[14px] font-semibold text-slate-800">Referral record not found.</p>
        </div>
      </div>
    )
  }

  const orderedTimeline = [...timeline].sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
  const documents = referral.documents ?? []
  const notes = referral.notes?.trim().length ? referral.notes : referral.remarks
  const trimmedNotesDraft = notesDraft.trim()
  const isNotesChanged = trimmedNotesDraft !== referral.notes.trim()
  const hasPendingUploads = newDocuments.length > 0
  const canSaveUpdates = isNotesChanged || hasPendingUploads

  const handleDocumentSelect = (event: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? [])
    setNewDocuments(files)
  }

  const saveReferralUpdates = () => {
    if (!canSaveUpdates) {
      return
    }

    const nowIso = new Date().toISOString()
    const uploadedDocs = newDocuments.map((file, index) => ({
      id: `doc-${referral.id}-${Date.now()}-${index}`,
      name: file.name,
      uploadedBy: 'Case Manager - Marychris M. Relon',
      uploadedAt: nowIso,
    }))

    const nextTimeline = [...timeline]

    if (isNotesChanged) {
      nextTimeline.push({
        id: `${referral.id}-notes-${Date.now()}`,
        actorType: 'Case Manager',
        logoType: 'bayanihan',
        title: 'Referral Notes Updated',
        description: 'Referral notes were updated by the Case Manager.',
        timestamp: nowIso,
        actor: 'Case Manager - Marychris M. Relon',
      })
    }

    if (uploadedDocs.length) {
      nextTimeline.push({
        id: `${referral.id}-docs-${Date.now()}`,
        actorType: 'Case Manager',
        logoType: 'bayanihan',
        title: 'Referral Documents Uploaded',
        description: `${uploadedDocs.length} new referral document${uploadedDocs.length > 1 ? 's were' : ' was'} uploaded.`,
        timestamp: nowIso,
        actor: 'Case Manager - Marychris M. Relon',
      })
    }

    setReferral((prev) => {
      if (!prev) {
        return prev
      }

      return {
        ...prev,
        notes: trimmedNotesDraft,
        documents: [...(prev.documents ?? []), ...uploadedDocs],
        updatedAt: nowIso,
      }
    })
    setTimeline(nextTimeline)
    setNewDocuments([])
    setSaveMessage(`Saved ${formatDisplayDateTime(nowIso)}.`)
  }

  return (
    <div className="max-w-[1240px] mx-auto px-4 py-6 space-y-4">
      <div className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-500">
        <Link to="/case-manager/referrals" className="hover:text-[#0b5384] transition">Referrals</Link>
        <span className="mx-2">&gt;</span>
        <span>{referral.caseNo}</span>
      </div>

      <div className="flex items-start justify-between gap-4 flex-wrap">
        <h1 className={pageHeadingStyles.pageTitle}>Referral Details</h1>
        <button
          type="button"
          onClick={() => navigate('/case-manager/referrals')}
          className="h-[34px] px-3 border border-[#cbd5e1] bg-white text-slate-700 text-[11px] font-bold rounded-[3px] hover:bg-slate-50"
        >
          Back
        </button>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-4">
        <main className="xl:col-span-8 space-y-4">
          <section className="bg-white border border-[#d8dee8] rounded-[3px] overflow-hidden">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
              <HeaderMeta label="Receiving Agency" value={referral.agencyName} />
              <HeaderMeta label="Status" value={referral.status} statusClass={getStatusBadgeClass(referral.status)} />
              <HeaderMeta label="Associated Case No." value={referral.caseId} />
              <HeaderMeta label="Tracking ID" value={referral.caseNo} />
              <HeaderMeta label="Date Referred" value={formatDisplayDateTime(referral.createdAt)} />
              <HeaderMeta label="Last Updated" value={formatDisplayDateTime(referral.updatedAt)} />
            </div>
          </section>

          <SectionCard title="Referral Notes">
            <div className="border border-[#d8dee8] bg-[#f8fafc] px-4 py-3 text-[13px] leading-6 text-slate-600">
              {notes || 'No notes provided.'}
            </div>
          </SectionCard>

          <SectionCard title="Attached Documents">
            {documents.length ? (
              <div className="space-y-2">
                {documents.map((doc) => (
                  <div key={doc.id} className="bg-[#f5f7fb] border border-[#e2e8f0] p-3 flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-[11px] font-bold text-slate-700 truncate">{doc.name}</p>
                      <p className="text-[9px] text-slate-400 truncate">
                        {doc.uploadedBy} • {formatDisplayDateTime(doc.uploadedAt)}
                      </p>
                    </div>
                    <button className="text-[10px] text-[#0b5384] font-bold hover:underline">View</button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="border border-dashed border-[#cbd5e1] rounded-[3px] p-4 text-center">
                <p className="text-[11px] text-slate-500">No documents attached to this referral.</p>
              </div>
            )}
          </SectionCard>

          <SectionCard title="Update Referral">
            <div className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="referral-notes" className="text-[10px] font-extrabold uppercase tracking-[0.1em] text-slate-500">
                  Referral Notes
                </label>
                <textarea
                  id="referral-notes"
                  value={notesDraft}
                  onChange={(event) => setNotesDraft(event.target.value)}
                  rows={4}
                  className="w-full rounded-[3px] border border-[#cbd5e1] px-3 py-2 text-[12px] text-slate-700 outline-none focus:border-[#0b5384]"
                  placeholder="Enter updated referral notes"
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="new-referral-documents" className="text-[10px] font-extrabold uppercase tracking-[0.1em] text-slate-500">
                  Upload New Documents
                </label>
                <input
                  id="new-referral-documents"
                  type="file"
                  multiple
                  onChange={handleDocumentSelect}
                  className="block w-full rounded-[3px] border border-[#cbd5e1] bg-white px-3 py-2 text-[11px] text-slate-600 file:mr-3 file:rounded-[3px] file:border-0 file:bg-[#0b5384] file:px-3 file:py-1 file:text-[10px] file:font-bold file:text-white"
                />
                {newDocuments.length > 0 ? (
                  <p className="text-[11px] text-slate-500">{newDocuments.length} new file{newDocuments.length > 1 ? 's' : ''} selected.</p>
                ) : null}
              </div>

              <div className="flex items-center justify-between gap-3">
                <p className="text-[11px] text-slate-500">Only notes and new document uploads can be updated for this referral.</p>
                <button
                  type="button"
                  onClick={saveReferralUpdates}
                  disabled={!canSaveUpdates}
                  className="h-[34px] px-4 bg-[#0b5384] text-white text-[11px] font-bold rounded-[3px] border border-[#0b5384] hover:bg-[#09416a] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Save Updates
                </button>
              </div>

              {saveMessage ? <p className="text-[11px] font-semibold text-[#0b5384]">{saveMessage}</p> : null}
            </div>
          </SectionCard>
        </main>

        <aside className="xl:col-span-4 space-y-4">
          <SectionCard title="Referral Timeline">
            <div className="mt-1 relative pl-4">
              <div className="absolute left-[4px] top-1 bottom-1 w-px bg-[#cbd5e1]" />
              <div className="flex flex-col-reverse gap-4">
                {orderedTimeline.map((item) => (
                  <div key={item.id} className="relative flex items-start gap-3">
                    <div className="mt-0.5 -ml-[18px] h-5 w-5 overflow-hidden rounded-full border border-white bg-white shadow-sm z-10">
                      <img src={getTimelineLogoSrc(item.logoType, item.agencyId)} alt="Timeline source" className="h-full w-full object-cover" />
                    </div>
                    <div>
                      <p className="text-[11px] leading-5 font-semibold text-slate-700">{item.title}</p>
                      <p className="text-[11px] leading-5 text-slate-600">{item.description}</p>
                      <p className="mt-0.5 text-[10px] text-slate-400">
                        {formatDisplayDateTime(item.timestamp)} • {item.actor}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </SectionCard>
        </aside>
      </div>
    </div>
  )
}

function HeaderMeta({
  label,
  value,
  statusClass,
}: {
  label: string
  value: string
  statusClass?: string
}) {
  return (
    <div className="border-b border-r border-[#d8dee8] px-3 py-2">
      <p className="text-[9px] font-extrabold uppercase tracking-[0.1em] text-slate-500">{label}</p>
      {statusClass ? (
        <span className={`mt-1 inline-flex rounded-[2px] border px-2 py-0.5 text-[10px] font-extrabold uppercase ${statusClass}`}>
          {value}
        </span>
      ) : (
        <p className="mt-1 text-[12px] font-semibold text-slate-700">{value}</p>
      )}
    </div>
  )
}

function SectionCard({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="rounded-[3px] border border-[#d8dee8] bg-white p-4 shadow-sm">
      <h3 className={`${pageHeadingStyles.sectionTitle} mb-3 text-[#1f2937]`}>{title}</h3>
      {children}
    </section>
  )
}
