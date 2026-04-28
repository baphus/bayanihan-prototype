import { useEffect, useMemo, useRef, useState, type ChangeEvent, type ReactNode } from 'react'
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom'
import { pageHeadingStyles } from '../agency/pageHeadingStyles'
import { getStatusBadgeClass } from '../agency/statusBadgeStyles'
import { formatDisplayDateTime, getAgencyFocalByAgencyId, getCaseManagerAgencies, getStakeholderServiceDetails, type CaseManagerReferral, type CaseManagerReferralNote } from '../../data/unifiedData'
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
  const source = referral.remarks.trim()
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

type ReferralDocument = NonNullable<CaseManagerReferral['documents']>[number]

function normalizeDocumentMatchValue(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim()
}

function getRequirementMatchScore(requirement: string, documentName: string): number {
  const normalizedRequirement = normalizeDocumentMatchValue(requirement)
  const normalizedDocumentName = normalizeDocumentMatchValue(documentName)

  if (!normalizedRequirement || !normalizedDocumentName) {
    return 0
  }

  if (normalizedDocumentName.includes(normalizedRequirement)) {
    return 100
  }

  const requirementKeywords = normalizedRequirement.split(' ').filter((token) => token.length >= 4)
  if (!requirementKeywords.length) {
    return normalizedDocumentName.includes(normalizedRequirement) ? 1 : 0
  }

  return requirementKeywords.reduce((score, keyword) => {
    return normalizedDocumentName.includes(keyword) ? score + 1 : score
  }, 0)
}

function matchRequirementsToDocuments(requirements: string[], documents: ReferralDocument[]): {
  matches: Array<{ requirement: string; document: ReferralDocument | null }>
  unassignedDocuments: ReferralDocument[]
} {
  const remainingDocuments = [...documents]

  const matches = requirements.map((requirement, requirementIndex) => {
    let bestIndex = -1
    let bestScore = 0

    remainingDocuments.forEach((doc, index) => {
      const score = getRequirementMatchScore(requirement, doc.name)
      if (score > bestScore) {
        bestScore = score
        bestIndex = index
      }
    })

    if (bestIndex === -1 && requirementIndex < remainingDocuments.length) {
      bestIndex = requirementIndex
    }

    const matchedDocument = bestIndex >= 0 ? remainingDocuments.splice(bestIndex, 1)[0] : null

    return {
      requirement,
      document: matchedDocument,
    }
  })

  return {
    matches,
    unassignedDocuments: remainingDocuments,
  }
}

function parseReferredServices(serviceValue: string): string[] {
  const normalized = serviceValue
    .split(/[,;]+/)
    .map((service) => service.trim())
    .filter(Boolean)

  return normalized.length ? normalized : [serviceValue.trim()].filter(Boolean)
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
  const referralListPath = location.pathname.startsWith('/agency')
    ? '/agency/referred-cases'
    : location.pathname.startsWith('/system-admin')
      ? '/system-admin/referrals'
      : '/case-manager/referrals'

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
    return latestCaseManagerNote?.content ?? resolvedReferral.remarks ?? ''
  })
  const fileInputRefs = useRef<Record<string, HTMLInputElement | null>>({})
  const attachInputRef = useRef<HTMLInputElement | null>(null)
  const requirementUploadInputRef = useRef<HTMLInputElement | null>(null)
  const [isAddNoteOpen, setIsAddNoteOpen] = useState(false)
  const [pendingNote, setPendingNote] = useState<string | null>(null)
  const [pendingReplyToNoteId, setPendingReplyToNoteId] = useState<string | null>(null)
  const [pendingReplacements, setPendingReplacements] = useState<Record<string, File>>({})
  const [pendingAttachments, setPendingAttachments] = useState<File[]>([])
  const [pendingRequirementTarget, setPendingRequirementTarget] = useState<{
    serviceTitle: string
    requirement: string
  } | null>(null)
  const [pendingRequirementUploads, setPendingRequirementUploads] = useState<
    Array<{ key: string; serviceTitle: string; requirement: string; file: File }>
  >([])
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
      setPendingReplyToNoteId(null)
      setPendingReplacements({})
      setPendingAttachments([])
      setPendingRequirementTarget(null)
      setPendingRequirementUploads([])
      setIsConfirmModalOpen(false)
      setActiveVersionGroupId(null)
      setSaveMessage('')
      return
    }

    setReferral(resolvedReferral)
    setTimeline(buildReferralTimeline(resolvedReferral))
    const latestCaseManagerNote = getReferralNotesHistory(resolvedReferral).find((note) => note.createdBy.includes('Case Manager'))
    setNotesDraft(latestCaseManagerNote?.content ?? resolvedReferral.remarks ?? '')
    setIsAddNoteOpen(false)
    setPendingNote(null)
    setPendingReplyToNoteId(null)
    setPendingReplacements({})
    setPendingAttachments([])
    setPendingRequirementTarget(null)
    setPendingRequirementUploads([])
    setIsConfirmModalOpen(false)
    setActiveVersionGroupId(null)
    setSaveMessage('')
  }, [resolvedReferral])

  if (!referral) {
    return (
      <div className="mx-auto max-w-4xl space-y-4 pb-6">
        <button
          type="button"
          onClick={() => navigate(referralListPath)}
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
  const stakeholderServiceDetails = getStakeholderServiceDetails(referral.agencyId)
  const referredServices = parseReferredServices(referral.service)
  const serviceRequirementGroups = referredServices.map((serviceTitle) => {
    const matchedServiceDetail = stakeholderServiceDetails.find(
      (serviceDetail) => serviceDetail.title.toLowerCase() === serviceTitle.toLowerCase(),
    )

    return {
      serviceTitle,
      requiredDocuments: matchedServiceDetail?.requiredDocuments ?? [],
    }
  })
  const groupedRequirements = useMemo(() => {
    const initial = {
      groups: [] as Array<{
        serviceTitle: string
        requiredDocuments: string[]
        matches: Array<{ requirement: string; document: ReferralDocument | null }>
      }>,
      unassignedDocuments: [...activeDocuments],
    }

    return serviceRequirementGroups.reduce((acc, group) => {
      const { matches, unassignedDocuments } = matchRequirementsToDocuments(group.requiredDocuments, acc.unassignedDocuments)

      return {
        groups: [...acc.groups, { ...group, matches }],
        unassignedDocuments,
      }
    }, initial)
  }, [activeDocuments, serviceRequirementGroups])
  const notesHistory = getReferralNotesHistory(referral)
  const mostRecentCaseManagerNote = notesHistory.find((note) => note.createdBy.includes('Case Manager'))
  const latestNoteText = mostRecentCaseManagerNote?.content ?? referral.remarks?.trim() ?? ''
  const pendingNoteValue = pendingNote?.trim() ?? ''
  const replyToNote = pendingReplyToNoteId
    ? notesHistory.find((note) => note.id === pendingReplyToNoteId) ?? null
    : null
  const hasPendingChanges =
    Boolean(pendingNoteValue) ||
    Object.keys(pendingReplacements).length > 0 ||
    pendingAttachments.length > 0 ||
    pendingRequirementUploads.length > 0
  const documentVersionRows = activeVersionGroupId
    ? documents
        .filter((doc) => (doc.versionGroupId ?? doc.id) === activeVersionGroupId)
        .sort((a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime())
    : []
  const pendingChangeSummary = [
    pendingNoteValue
      ? `${replyToNote ? `Add reply to ${replyToNote.createdBy}` : 'Add comment'}: "${pendingNoteValue.slice(0, 90)}${pendingNoteValue.length > 90 ? '...' : ''}"`
      : null,
    ...Object.entries(pendingReplacements).map(([docId, file]) => {
      const targetDoc = activeDocuments.find((doc) => doc.id === docId)
      return `Replace document: ${targetDoc?.name ?? 'Unknown document'} -> ${file.name}`
    }),
    ...pendingAttachments.map((file) => `Attach document: ${file.name}`),
    ...pendingRequirementUploads.map((entry) => `Attach required document: ${entry.requirement} -> ${entry.file.name}`),
  ].filter((item): item is string => Boolean(item))

  const buildRequirementKey = (serviceTitle: string, requirement: string) => `${serviceTitle}::${requirement}`

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

  const handleAttachDocumentsSelect = (event: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? [])
    if (!files.length) {
      return
    }

    setPendingAttachments((prev) => [...prev, ...files])
    event.target.value = ''
  }

  const requestMissingRequirementUpload = (serviceTitle: string, requirement: string) => {
    setPendingRequirementTarget({ serviceTitle, requirement })
    requirementUploadInputRef.current?.click()
  }

  const handleMissingRequirementSelect = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file || !pendingRequirementTarget) {
      return
    }

    const key = buildRequirementKey(pendingRequirementTarget.serviceTitle, pendingRequirementTarget.requirement)
    setPendingRequirementUploads((prev) => {
      const next = prev.filter((entry) => entry.key !== key)
      return [...next, { key, ...pendingRequirementTarget, file }]
    })
    setPendingRequirementTarget(null)
    event.target.value = ''
  }

  const removePendingRequirementUpload = (requirementKey: string) => {
    setPendingRequirementUploads((prev) => prev.filter((entry) => entry.key !== requirementKey))
  }

  const removePendingAttachment = (index: number) => {
    setPendingAttachments((prev) => prev.filter((_, itemIndex) => itemIndex !== index))
  }

  const queueNote = () => {
    const trimmed = notesDraft.trim()
    if (!trimmed || (!pendingReplyToNoteId && trimmed === latestNoteText.trim())) {
      return
    }

    setPendingNote(trimmed)
    setIsAddNoteOpen(false)
  }

  const discardPendingChanges = () => {
    setPendingNote(null)
    setPendingReplyToNoteId(null)
    setPendingReplacements({})
    setPendingAttachments([])
    setPendingRequirementTarget(null)
    setPendingRequirementUploads([])
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
        title: replyToNote ? 'Case Reply Added' : 'Case Comment Added',
        description: replyToNote
          ? `A reply was posted by the Case Manager to ${replyToNote.createdBy}.`
          : 'A new case comment was added by the Case Manager.',
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

    if (pendingAttachments.length > 0) {
      nextTimeline.push({
        id: `${referral.id}-docs-attached-${Date.now()}`,
        actorType: 'Case Manager',
        logoType: 'bayanihan',
        title: 'Referral Documents Attached',
        description: `${pendingAttachments.length} new referral document${pendingAttachments.length > 1 ? 's were' : ' was'} attached by the Case Manager.`,
        timestamp: nowIso,
        actor: CASE_MANAGER_ACTOR,
      })
    }

    if (pendingRequirementUploads.length > 0) {
      nextTimeline.push({
        id: `${referral.id}-required-docs-attached-${Date.now()}`,
        actorType: 'Case Manager',
        logoType: 'bayanihan',
        title: 'Required Documents Uploaded',
        description: `${pendingRequirementUploads.length} required document${pendingRequirementUploads.length > 1 ? 's were' : ' was'} uploaded by the Case Manager.`,
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
              parentNoteId: replyToNote?.id,
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

      pendingAttachments.forEach((file, index) => {
        const attachmentId = `doc-${prev.id}-attachment-${Date.now()}-${index}`

        nextDocuments.push({
          id: attachmentId,
          name: file.name,
          uploadedBy: CASE_MANAGER_ACTOR,
          uploadedAt: nowIso,
          versionGroupId: attachmentId,
        })
      })

      pendingRequirementUploads.forEach((entry, index) => {
        const normalizedService = normalizeDocumentMatchValue(entry.serviceTitle).replace(/\s+/g, '-') || 'service'
        const normalizedRequirement = normalizeDocumentMatchValue(entry.requirement).replace(/\s+/g, '-') || 'requirement'
        const versionGroupId = `req-${prev.id}-${normalizedService}-${normalizedRequirement}`
        const attachmentId = `doc-${prev.id}-requirement-${Date.now()}-${index}`

        nextDocuments.push({
          id: attachmentId,
          name: `${entry.requirement} - ${entry.file.name}`,
          uploadedBy: CASE_MANAGER_ACTOR,
          uploadedAt: nowIso,
          versionGroupId,
        })
      })

      const updatedReferral = {
        ...prev,
        noteHistory: nextHistory,
        documents: nextDocuments,
        updatedAt: nowIso,
      }

      updateManagedReferral(prev.id, () => updatedReferral)

      return updatedReferral
    })
    setTimeline(nextTimeline)
    setPendingNote(null)
    setPendingReplyToNoteId(null)
    setPendingReplacements({})
    setPendingAttachments([])
    setPendingRequirementTarget(null)
    setPendingRequirementUploads([])
    setIsConfirmModalOpen(false)
    setNotesDraft('')
    setSaveMessage(`Saved ${formatDisplayDateTime(nowIso)}.`)
  }

  return (
    <div className="max-w-[1240px] mx-auto px-4 py-6 space-y-4">
      <div className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-500">
        <Link to={referralListPath} className="hover:text-[#0b5384] transition">Referrals</Link>
        <span className="mx-2">&gt;</span>
        <span>{referral.caseNo}</span>
      </div>

      <div className="flex items-start justify-between gap-4 flex-wrap">
        <h1 className={pageHeadingStyles.pageTitle}>Referral Details</h1>
        <button
          type="button"
          onClick={() => navigate(referralListPath)}
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
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2 rounded-[3px] border border-[#d8dee8] bg-[#f8fafc] px-3 py-2">
              <p className="text-[10px] text-slate-600">Attach additional files for this referral.</p>
              <button
                type="button"
                onClick={() => attachInputRef.current?.click()}
                className="h-[28px] px-3 bg-[#0b5384] text-white text-[10px] font-bold rounded-[3px] border border-[#0b5384] hover:bg-[#09416a]"
              >
                Attach Document
              </button>
              <input
                ref={attachInputRef}
                type="file"
                multiple
                onChange={handleAttachDocumentsSelect}
                className="hidden"
              />
              <input
                ref={requirementUploadInputRef}
                type="file"
                onChange={handleMissingRequirementSelect}
                className="hidden"
              />
            </div>

            {pendingAttachments.length ? (
              <div className="mb-3 rounded-[3px] border border-amber-200 bg-amber-50 px-3 py-2 space-y-2">
                <p className="text-[10px] font-bold uppercase tracking-[0.08em] text-amber-700">Pending Attachments</p>
                <div className="space-y-1.5">
                  {pendingAttachments.map((file, index) => (
                    <div key={`${file.name}-${file.size}-${index}`} className="flex items-center justify-between gap-2 rounded-[2px] border border-amber-200 bg-white px-2 py-1.5">
                      <p className="min-w-0 truncate text-[11px] text-slate-700">{file.name}</p>
                      <button
                        type="button"
                        onClick={() => removePendingAttachment(index)}
                        className="text-[10px] font-semibold text-amber-700 hover:underline"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}

            {activeDocuments.length ? (
              <div className="space-y-3">
                {groupedRequirements.groups.map((group) => {
                  const attachedRequirementCount = group.matches.filter((match) => Boolean(match.document)).length

                  return (
                    <div key={group.serviceTitle} className="rounded-[3px] border border-[#d8dee8] bg-[#f8fafc] p-3 space-y-2">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <h4 className="text-[11px] font-extrabold uppercase tracking-[0.08em] text-[#334155]">{group.serviceTitle}</h4>
                        <span className="text-[10px] font-bold text-slate-500">
                          Requirements Attached: {attachedRequirementCount}/{group.requiredDocuments.length}
                        </span>
                      </div>

                      {group.requiredDocuments.length ? (
                        <div className="space-y-2">
                          {group.matches.map(({ requirement, document }) => {
                            const isAttached = Boolean(document)
                            const requirementKey = buildRequirementKey(group.serviceTitle, requirement)
                            const pendingRequirement = pendingRequirementUploads.find((entry) => entry.key === requirementKey)

                            return (
                              <div key={`${group.serviceTitle}-${requirement}`} className="rounded-[2px] border border-[#e2e8f0] bg-white px-2.5 py-2">
                                <div className="flex flex-wrap items-start justify-between gap-2">
                                  <p className="text-[11px] text-slate-700">{requirement}</p>
                                  <span
                                    className={`inline-flex items-center rounded-[2px] px-2 py-0.5 text-[9px] font-extrabold uppercase tracking-[0.08em] ${
                                      isAttached
                                        ? 'bg-[#ecfdf5] text-[#166534] border border-[#86efac]'
                                        : 'bg-amber-50 text-amber-700 border border-amber-200'
                                    }`}
                                  >
                                    {isAttached ? 'Attached' : 'Missing'}
                                  </span>
                                </div>

                                {document ? (
                                  <div className="mt-1.5 flex items-center justify-between gap-3 rounded-[2px] border border-[#dbeafe] bg-[#eff6ff] px-2 py-1.5">
                                    <div className="min-w-0">
                                      <p className="text-[10px] font-bold text-[#0b5384] truncate">{document.name}</p>
                                      <p className="text-[9px] text-slate-500 truncate">{document.uploadedBy} • {formatDisplayDateTime(document.uploadedAt)}</p>
                                      {pendingReplacements[document.id] ? (
                                        <p className="mt-1 text-[10px] font-semibold text-amber-700">
                                          Pending replacement: {pendingReplacements[document.id].name}
                                        </p>
                                      ) : null}
                                    </div>
                                    <div className="flex items-center gap-2 shrink-0">
                                      <button className="text-[10px] text-[#0b5384] font-bold hover:underline">View</button>
                                      <button
                                        type="button"
                                        onClick={() => setActiveVersionGroupId(document.versionGroupId ?? document.id)}
                                        className="text-[10px] text-slate-600 font-bold hover:underline"
                                      >
                                        View Versions
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => fileInputRefs.current[document.id]?.click()}
                                        className="text-[10px] text-[#0b5384] font-bold hover:underline"
                                      >
                                        Replace Document
                                      </button>
                                      <input
                                        ref={(element) => {
                                          fileInputRefs.current[document.id] = element
                                        }}
                                        data-doc-id={document.id}
                                        type="file"
                                        onChange={handleDocumentSelect}
                                        className="hidden"
                                      />
                                    </div>
                                  </div>
                                ) : (
                                  <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
                                    {pendingRequirement ? (
                                      <div className="text-[10px] text-amber-700">
                                        Pending upload: {pendingRequirement.file.name}
                                      </div>
                                    ) : (
                                      <span className="text-[10px] text-amber-700">Document required.</span>
                                    )}
                                    <div className="flex items-center gap-2">
                                      {pendingRequirement ? (
                                        <button
                                          type="button"
                                          onClick={() => removePendingRequirementUpload(requirementKey)}
                                          className="text-[10px] font-semibold text-amber-700 hover:underline"
                                        >
                                          Remove
                                        </button>
                                      ) : null}
                                      <button
                                        type="button"
                                        onClick={() => requestMissingRequirementUpload(group.serviceTitle, requirement)}
                                        className="h-[26px] px-2.5 bg-[#0b5384] text-white text-[10px] font-bold rounded-[2px] border border-[#0b5384] hover:bg-[#09416a]"
                                      >
                                        Upload Requirement
                                      </button>
                                    </div>
                                  </div>
                                )}
                              </div>
                            )
                          })}
                        </div>
                      ) : (
                        <p className="text-[11px] text-slate-500">No required documents configured for this referred service.</p>
                      )}
                    </div>
                  )
                })}

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
              <h3 className={`${pageHeadingStyles.sectionTitle} text-[#1f2937]`}>Referral Comments</h3>
              <button
                type="button"
                onClick={() => setIsAddNoteOpen((prev) => !prev)}
                className="h-[28px] px-3 bg-[#0b5384] text-white text-[10px] font-bold rounded-[3px] border border-[#0b5384] hover:bg-[#09416a]"
              >
                {pendingReplyToNoteId ? 'Reply' : 'Add Comment'}
              </button>
            </div>

            <div className="max-h-[340px] border border-[#d8dee8] bg-[#f8fafc] p-3 overflow-y-auto">
              {isAddNoteOpen ? (
                <div className="mb-3 space-y-2 border border-[#d8dee8] bg-white p-3">
                  {replyToNote ? (
                    <div className="flex items-center justify-between gap-2 rounded-[2px] border border-[#d8dee8] bg-[#f8fafc] px-2.5 py-1.5">
                      <p className="text-[10px] text-slate-600">Replying to {replyToNote.createdBy}</p>
                      <button
                        type="button"
                        onClick={() => setPendingReplyToNoteId(null)}
                        className="text-[10px] font-semibold text-slate-600 hover:underline"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : null}
                  <textarea
                    value={notesDraft}
                    onChange={(event) => setNotesDraft(event.target.value)}
                    rows={3}
                    className="w-full rounded-[3px] border border-[#cbd5e1] px-3 py-2 text-[12px] text-slate-700 outline-none focus:border-[#0b5384]"
                    placeholder={replyToNote ? 'Write a case reply' : 'Write a case comment'}
                  />
                  <div className="flex items-center justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setIsAddNoteOpen(false)
                        setNotesDraft(latestNoteText)
                        setPendingReplyToNoteId(null)
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
                      {replyToNote ? 'Queue Reply' : 'Queue Comment'}
                    </button>
                  </div>
                </div>
              ) : null}

              {pendingNoteValue ? (
                <div className="mb-3 rounded-[3px] border border-amber-200 bg-amber-50 px-3 py-2">
                  <p className="text-[10px] font-bold uppercase tracking-[0.08em] text-amber-700">{replyToNote ? 'Pending Reply' : 'Pending Comment'}</p>
                  {replyToNote ? <p className="mt-1 text-[10px] text-amber-700">Replying to {replyToNote.createdBy}</p> : null}
                  <p className="mt-1 text-[11px] text-amber-900">{pendingNoteValue}</p>
                </div>
              ) : null}

              <CaseCommentsThread
                notes={notesHistory}
                mostRecentCaseManagerNoteId={mostRecentCaseManagerNote?.id}
                onReply={(note) => {
                  setPendingReplyToNoteId(note.id)
                  setIsAddNoteOpen(true)
                  setNotesDraft('')
                }}
              />
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
