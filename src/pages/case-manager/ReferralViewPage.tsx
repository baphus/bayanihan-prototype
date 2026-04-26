import { useEffect, useMemo, useRef, useState, type ChangeEvent, type ReactNode } from 'react'
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom'
import { pageHeadingStyles } from '../agency/pageHeadingStyles'
import { getStatusBadgeClass } from '../agency/statusBadgeStyles'
import { formatDisplayDateTime, getAgencyFocalByAgencyId, getCaseManagerAgencies, type CaseManagerReferral, type CaseManagerReferralNote } from '../../data/unifiedData'
import { getManagedReferralById, updateManagedReferral } from '../../data/caseLifecycleStore'
import CaseCommentsThread from '../../components/ui/CaseCommentsThread'

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

const CASE_MANAGER_ACTOR = 'Case Manager - Marychris M. Relon'

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

function buildFallbackNotesHistory(referral: CaseManagerReferral): CaseManagerReferralNote[] {
  const source = referral.notes.trim() || referral.remarks.trim()
  if (!source) {
    return []
  }

  return [
    {
      id: `${referral.id}-legacy-note`,
      content: source,
      createdAt: referral.updatedAt || referral.createdAt,
      createdBy: CASE_MANAGER_ACTOR,
    },
  ]
}

function getReferralNotesHistory(referral: CaseManagerReferral): CaseManagerReferralNote[] {
  const normalized = (referral.noteHistory?.length ? referral.noteHistory : buildFallbackNotesHistory(referral)).map((note) => ({
    ...note,
    content: note.content.trim(),
  }))

  return normalized
    .filter((note) => note.content.length > 0)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
}

function buildReferralTimeline(referral: CaseManagerReferral): TimelineItem[] {
  const agencyFocal = getAgencyFocalByAgencyId(referral.agencyId)
  const agencyActor = `Agency Focal - ${agencyFocal.name}`

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

  if (referral.status === 'PROCESSING') {
    timeline.push({
      id: `${referral.id}-accepted`,
      actorType: 'Agency',
      agencyId: referral.agencyId,
      logoType: 'agency',
      title: 'Referral Accepted',
      description: 'Agency accepted the referral and started processing.',
      timestamp: referral.updatedAt,
      actor: agencyActor,
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
        actor: agencyActor,
      },
      {
        id: `${referral.id}-completed`,
        actorType: 'Agency',
        agencyId: referral.agencyId,
        logoType: 'agency',
        title: 'Referral Completed',
        description: 'Service delivery was completed and verified by the agency.',
        timestamp: referral.updatedAt,
        actor: agencyActor,
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
      actor: agencyActor,
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

    return getManagedReferralById(referralId)
  }, [referralId, routeReferral])

  const [referral, setReferral] = useState<CaseManagerReferral | null>(resolvedReferral ?? null)
  const [timeline, setTimeline] = useState<TimelineItem[]>(() => (resolvedReferral ? buildReferralTimeline(resolvedReferral) : []))
  const [notesDraft, setNotesDraft] = useState(() => {
    if (!resolvedReferral) {
      return ''
    }

    const latestCaseManagerNote = getReferralNotesHistory(resolvedReferral).find((note) => note.createdBy.includes('Case Manager'))
    return latestCaseManagerNote?.content ?? resolvedReferral.notes
  })
  const fileInputRefs = useRef<Record<string, HTMLInputElement | null>>({})
  const [isAddNoteOpen, setIsAddNoteOpen] = useState(false)
  const [pendingNote, setPendingNote] = useState<string | null>(null)
  const [pendingReplacements, setPendingReplacements] = useState<Record<string, File>>({})
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false)
  const [activeVersionGroupId, setActiveVersionGroupId] = useState<string | null>(null)
  const [saveMessage, setSaveMessage] = useState('')

  useEffect(() => {
    if (!resolvedReferral) {
      setReferral(null)
      setTimeline([])
      setNotesDraft('')
      setIsAddNoteOpen(false)
      setPendingNote(null)
      setPendingReplacements({})
      setIsConfirmModalOpen(false)
      setActiveVersionGroupId(null)
      setSaveMessage('')
      return
    }

    setReferral(resolvedReferral)
    setTimeline(buildReferralTimeline(resolvedReferral))
    const latestCaseManagerNote = getReferralNotesHistory(resolvedReferral).find((note) => note.createdBy.includes('Case Manager'))
    setNotesDraft(latestCaseManagerNote?.content ?? resolvedReferral.notes)
    setIsAddNoteOpen(false)
    setPendingNote(null)
    setPendingReplacements({})
    setIsConfirmModalOpen(false)
    setActiveVersionGroupId(null)
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
  const activeDocuments = documents.filter((doc) => !doc.archived)
  const notesHistory = getReferralNotesHistory(referral)
  const mostRecentCaseManagerNote = notesHistory.find((note) => note.createdBy.includes('Case Manager'))
  const latestNoteText = mostRecentCaseManagerNote?.content ?? referral.notes?.trim() ?? ''
  const pendingNoteValue = pendingNote?.trim() ?? ''
  const hasPendingChanges = Boolean(pendingNoteValue) || Object.keys(pendingReplacements).length > 0
  const documentVersionRows = activeVersionGroupId
    ? documents
        .filter((doc) => (doc.versionGroupId ?? doc.id) === activeVersionGroupId)
        .sort((a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime())
    : []
  const pendingChangeSummary = [
    pendingNoteValue ? `Add comment: "${pendingNoteValue.slice(0, 90)}${pendingNoteValue.length > 90 ? '...' : ''}"` : null,
    ...Object.entries(pendingReplacements).map(([docId, file]) => {
      const targetDoc = activeDocuments.find((doc) => doc.id === docId)
      return `Replace document: ${targetDoc?.name ?? 'Unknown document'} -> ${file.name}`
    }),
  ].filter((item): item is string => Boolean(item))

  const handleDocumentSelect = (event: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? [])
    const targetId = event.target.dataset.docId
    if (!targetId || !files[0]) {
      return
    }

    setPendingReplacements((prev) => ({
      ...prev,
      [targetId]: files[0],
    }))
    event.target.value = ''
  }

  const queueNote = () => {
    const trimmed = notesDraft.trim()
    if (!trimmed || trimmed === latestNoteText.trim()) {
      return
    }

    setPendingNote(trimmed)
    setIsAddNoteOpen(false)
  }

  const discardPendingChanges = () => {
    setPendingNote(null)
    setPendingReplacements({})
    setIsConfirmModalOpen(false)
    setNotesDraft(latestNoteText)
  }

  const saveConfirmedChanges = () => {
    if (!hasPendingChanges) {
      return
    }

    const nowIso = new Date().toISOString()

    const nextTimeline = [...timeline]

    if (pendingNoteValue) {
      nextTimeline.push({
        id: `${referral.id}-notes-${Date.now()}`,
        actorType: 'Case Manager',
        logoType: 'bayanihan',
        title: 'Case Comment Added',
        description: 'A new case comment was added by the Case Manager.',
        timestamp: nowIso,
        actor: CASE_MANAGER_ACTOR,
      })
    }

    if (Object.keys(pendingReplacements).length > 0) {
      nextTimeline.push({
        id: `${referral.id}-docs-replaced-${Date.now()}`,
        actorType: 'Case Manager',
        logoType: 'bayanihan',
        title: 'Referral Documents Replaced',
        description: `${Object.keys(pendingReplacements).length} referral document${Object.keys(pendingReplacements).length > 1 ? 's were' : ' was'} replaced by the Case Manager.`,
        timestamp: nowIso,
        actor: CASE_MANAGER_ACTOR,
      })
    }

    setReferral((prev) => {
      if (!prev) {
        return prev
      }

      const nextHistory = pendingNoteValue
        ? [
            ...(prev.noteHistory ?? buildFallbackNotesHistory(prev)),
            {
              id: `note-${prev.id}-${Date.now()}`,
              content: pendingNoteValue,
              createdAt: nowIso,
              createdBy: CASE_MANAGER_ACTOR,
            },
          ]
        : prev.noteHistory

      const nextDocuments = [...(prev.documents ?? [])]
      Object.entries(pendingReplacements).forEach(([docId, file], index) => {
        const targetIndex = nextDocuments.findIndex((doc) => doc.id === docId)
        if (targetIndex < 0) {
          return
        }

        const target = nextDocuments[targetIndex]
        const versionGroupId = target.versionGroupId ?? target.id
        const replacementId = `doc-${prev.id}-replacement-${Date.now()}-${index}`

        nextDocuments[targetIndex] = {
          ...target,
          archived: true,
          replacedById: replacementId,
          versionGroupId,
        }

        nextDocuments.push({
          id: replacementId,
          name: file.name,
          uploadedBy: CASE_MANAGER_ACTOR,
          uploadedAt: nowIso,
          replacesId: target.id,
          versionGroupId,
        })
      })

      const updatedReferral = {
        ...prev,
        notes: pendingNoteValue || prev.notes,
        noteHistory: nextHistory,
        documents: nextDocuments,
        updatedAt: nowIso,
      }

      updateManagedReferral(prev.id, () => updatedReferral)

      return updatedReferral
    })
    setTimeline(nextTimeline)
    setPendingNote(null)
    setPendingReplacements({})
    setIsConfirmModalOpen(false)
    setNotesDraft('')
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

          <SectionCard title="Attached Documents">
            {activeDocuments.length ? (
              <div className="space-y-2">
                {activeDocuments.map((doc) => (
                  <div key={doc.id} className="bg-[#f5f7fb] border border-[#e2e8f0] p-3 flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-[11px] font-bold text-slate-700 truncate">{doc.name}</p>
                      <p className="text-[9px] text-slate-400 truncate">
                        {doc.uploadedBy} • {formatDisplayDateTime(doc.uploadedAt)}
                      </p>
                      {pendingReplacements[doc.id] ? (
                        <p className="mt-1 text-[10px] font-semibold text-amber-700">
                          Pending replacement: {pendingReplacements[doc.id].name}
                        </p>
                      ) : null}
                    </div>
                    <div className="flex items-center gap-2">
                      <button className="text-[10px] text-[#0b5384] font-bold hover:underline">View</button>
                      <button
                        type="button"
                        onClick={() => setActiveVersionGroupId(doc.versionGroupId ?? doc.id)}
                        className="text-[10px] text-slate-600 font-bold hover:underline"
                      >
                        View Versions
                      </button>
                      <button
                        type="button"
                        onClick={() => fileInputRefs.current[doc.id]?.click()}
                        className="text-[10px] text-[#0b5384] font-bold hover:underline"
                      >
                        Replace Document
                      </button>
                      <input
                        ref={(element) => {
                          fileInputRefs.current[doc.id] = element
                        }}
                        data-doc-id={doc.id}
                        type="file"
                        onChange={handleDocumentSelect}
                        className="hidden"
                      />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="border border-dashed border-[#cbd5e1] rounded-[3px] p-4 text-center">
                <p className="text-[11px] text-slate-500">No documents attached to this referral.</p>
              </div>
            )}
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
                      <img src={getTimelineLogoSrc(item.logoType, item.agencyId)} alt="Timeline source" className="h-full w-full object-contain p-[1px]" />
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

          <section className="rounded-[3px] border border-[#d8dee8] bg-white p-4 shadow-sm">
            <div className="mb-3 flex items-center justify-between gap-2">
              <h3 className={`${pageHeadingStyles.sectionTitle} text-[#1f2937]`}>Case Comments</h3>
              <button
                type="button"
                onClick={() => setIsAddNoteOpen((prev) => !prev)}
                className="h-[28px] px-3 bg-[#0b5384] text-white text-[10px] font-bold rounded-[3px] border border-[#0b5384] hover:bg-[#09416a]"
              >
                Add Comment
              </button>
            </div>

            <div className="max-h-[340px] border border-[#d8dee8] bg-[#f8fafc] p-3 overflow-y-auto">
              {isAddNoteOpen ? (
                <div className="mb-3 space-y-2 border border-[#d8dee8] bg-white p-3">
                  <textarea
                    value={notesDraft}
                    onChange={(event) => setNotesDraft(event.target.value)}
                    rows={3}
                    className="w-full rounded-[3px] border border-[#cbd5e1] px-3 py-2 text-[12px] text-slate-700 outline-none focus:border-[#0b5384]"
                    placeholder="Write a case comment"
                  />
                  <div className="flex items-center justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setIsAddNoteOpen(false)
                        setNotesDraft(latestNoteText)
                      }}
                      className="h-[28px] px-3 border border-[#cbd5e1] bg-white text-slate-700 text-[10px] font-bold rounded-[3px] hover:bg-slate-50"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={queueNote}
                      className="h-[28px] px-3 bg-[#0b5384] text-white text-[10px] font-bold rounded-[3px] border border-[#0b5384] hover:bg-[#09416a]"
                    >
                      Queue Comment
                    </button>
                  </div>
                </div>
              ) : null}

              {pendingNoteValue ? (
                <div className="mb-3 rounded-[3px] border border-amber-200 bg-amber-50 px-3 py-2">
                  <p className="text-[10px] font-bold uppercase tracking-[0.08em] text-amber-700">Pending Comment</p>
                  <p className="mt-1 text-[11px] text-amber-900">{pendingNoteValue}</p>
                </div>
              ) : null}

              <CaseCommentsThread notes={notesHistory} mostRecentCaseManagerNoteId={mostRecentCaseManagerNote?.id} />
            </div>
          </section>
        </aside>
      </div>

      {saveMessage ? <p className="text-[11px] font-semibold text-[#0b5384]">{saveMessage}</p> : null}

      {hasPendingChanges ? (
        <button
          type="button"
          onClick={() => setIsConfirmModalOpen(true)}
          className="fixed bottom-6 right-6 z-30 h-[38px] px-4 bg-[#0b5384] text-white text-[11px] font-bold rounded-[3px] border border-[#0b5384] shadow-lg hover:bg-[#09416a]"
        >
          Review Pending Changes
        </button>
      ) : null}

      {isConfirmModalOpen ? (
        <ChangeReviewModal
          changes={pendingChangeSummary}
          onDiscard={discardPendingChanges}
          onSave={saveConfirmedChanges}
          onClose={() => setIsConfirmModalOpen(false)}
        />
      ) : null}

      {activeVersionGroupId ? (
        <DocumentVersionsModal
          documents={documentVersionRows}
          onClose={() => setActiveVersionGroupId(null)}
        />
      ) : null}
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

function ChangeReviewModal({
  changes,
  onDiscard,
  onSave,
  onClose,
}: {
  changes: string[]
  onDiscard: () => void
  onSave: () => void
  onClose: () => void
}) {
  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-950/40 p-4">
      <div className="w-full max-w-lg rounded-[3px] border border-[#d8dee8] bg-white p-4 shadow-xl">
        <h3 className="text-[14px] font-extrabold text-slate-800">Confirm Referral Changes</h3>
        <p className="mt-1 text-[11px] text-slate-500">Review what will be saved to comments and documents.</p>
        <div className="mt-3 max-h-[260px] space-y-2 overflow-y-auto border border-[#e2e8f0] bg-[#f8fafc] p-3">
          {changes.length ? (
            changes.map((change) => (
              <p key={change} className="text-[11px] text-slate-700">• {change}</p>
            ))
          ) : (
            <p className="text-[11px] text-slate-500">No pending changes.</p>
          )}
        </div>
        <div className="mt-4 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="h-[32px] px-3 border border-[#cbd5e1] bg-white text-slate-700 text-[11px] font-bold rounded-[3px] hover:bg-slate-50"
          >
            Back
          </button>
          <button
            type="button"
            onClick={onDiscard}
            className="h-[32px] px-3 border border-red-200 bg-red-50 text-red-700 text-[11px] font-bold rounded-[3px] hover:bg-red-100"
          >
            Discard
          </button>
          <button
            type="button"
            onClick={onSave}
            className="h-[32px] px-3 bg-[#0b5384] text-white text-[11px] font-bold rounded-[3px] border border-[#0b5384] hover:bg-[#09416a]"
          >
            Save Changes
          </button>
        </div>
      </div>
    </div>
  )
}

function DocumentVersionsModal({ documents, onClose }: { documents: CaseManagerReferral['documents']; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-950/40 p-4">
      <div className="w-full max-w-xl rounded-[3px] border border-[#d8dee8] bg-white p-4 shadow-xl">
        <div className="flex items-center justify-between gap-2">
          <h3 className="text-[14px] font-extrabold text-slate-800">Document Versions</h3>
          <button
            type="button"
            onClick={onClose}
            className="h-[28px] px-3 border border-[#cbd5e1] bg-white text-slate-700 text-[10px] font-bold rounded-[3px] hover:bg-slate-50"
          >
            Close
          </button>
        </div>
        <div className="mt-3 max-h-[300px] space-y-2 overflow-y-auto border border-[#e2e8f0] bg-[#f8fafc] p-3">
          {documents.map((doc) => (
            <div key={doc.id} className="flex items-center justify-between gap-2 border border-[#d8dee8] bg-white p-2">
              <div className="min-w-0">
                <p className="truncate text-[11px] font-bold text-slate-700">{doc.name}</p>
                <p className="text-[10px] text-slate-500">
                  {formatDisplayDateTime(doc.uploadedAt)} • {doc.uploadedBy} • {doc.archived ? 'Archived' : 'Current'}
                </p>
              </div>
              <button className="text-[10px] text-[#0b5384] font-bold hover:underline">View</button>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
