import { useEffect, useMemo, useState } from 'react'
import type { JSX, ReactNode } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { UnifiedTable, type Column } from '../../components/ui/UnifiedTable'
import { pageHeadingStyles } from './pageHeadingStyles'
import { getStatusBadgeClass } from './statusBadgeStyles'
import { getCaseNarrativeBySeed } from '../../data/unifiedData'
import { getCaseAgency } from '../../data/unifiedData'
import { formatAddressParts, getAgencyFocalByAgencyId, getClientPersona, getSpecialCategories, getStakeholderServiceDetails, type AddressParts, type CaseManagerReferral, type CaseManagerReferralNote } from '../../data/unifiedData'
import CaseCommentsThread from '../../components/ui/CaseCommentsThread'
import {
  addManagedReferralMilestone,
  getManagedCaseById,
  getManagedLatestMilestone,
  getManagedReferralById,
  getManagedReferralsByCaseId,
  getManagedReferralMilestones,
  updateManagedReferral,
  updateManagedReferralStatus,
} from '../../data/caseLifecycleStore'

type CaseStatus = 'PENDING' | 'PROCESSING' | 'FOR_COMPLIANCE' | 'COMPLETED' | 'REJECTED'
type ClientType = 'Next of Kin' | 'Overseas Filipino Worker'
type SpecialCategory = 'Senior Citizen' | 'PWD' | 'Solo Parent'
type UserRole = 'Agency Focal' | 'Case Manager' | 'System Admin' | 'OFW'

type DetailCase = {
  id: string
  agencyId: string
  caseNo: string
  clientType: ClientType
  service: string
  status: CaseStatus
  dateReceived: string
  dateUpdated: string
  ofwFullName: string
  ofwBirthDate: string
  ofwGender: string
  ofwEmail: string
  ofwContact: string
  ofwAddress: AddressParts
  nextOfKin: string
  kinRelationship: string
  kinContact: string
  kinEmail: string
  kinAddress: AddressParts
  lastCountry: string
  lastJob: string
  arrivalDate: string
  specialCategories: SpecialCategory[]
  requiredServices: string[]
}

type TimelineItem = {
  id: string
  agency: string
  title: string
  description: string
  time: string
  actor: string
  logoSrc: string
}

type ReferralOverviewRow = {
  id: string
  caseNo: string
  agencyName: string
  status: CaseStatus
  service: string
  latestMilestone: string
  dateReferred: string
  dateUpdated: string
}

const CURRENT_USER_ROLE: UserRole = 'Agency Focal'
const BAYANIHAN_LOGO = '/logo.png'
const CASE_MANAGER_ACTOR = 'Case Manager - Marychris M. Relon'

function getAgencyActorLabel(agencyId: string): string {
  const focal = getAgencyFocalByAgencyId(agencyId)
  return `Agency Focal - ${focal.name}`
}

function isAcceptedStatus(status: CaseStatus): boolean {
  return status === 'PROCESSING' || status === 'FOR_COMPLIANCE' || status === 'COMPLETED'
}

function referralStatusTone(status: CaseStatus): string {
  if (status === 'PENDING') {
    return 'border-[#fde68a] bg-[#fef3c7] text-[#b45309]'
  }

  if (status === 'PROCESSING') {
    return 'border-[#bae6fd] bg-[#e0f2fe] text-[#0369a1]'
  }

  if (status === 'FOR_COMPLIANCE') {
    return 'border-[#fed7aa] bg-[#ffedd5] text-[#c2410c]'
  }

  if (status === 'COMPLETED') {
    return 'border-[#bbf7d0] bg-[#dcfce7] text-[#15803d]'
  }

  return 'border-[#fecaca] bg-[#fee2e2] text-[#b91c1c]'
}

function formatIsoToDisplayDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short',
    day: '2-digit',
    year: 'numeric',
  })
}

function buildDetailCase(referralId: string): DetailCase | null {
  const referral = getManagedReferralById(referralId)
  if (!referral) {
    return null
  }

  const linkedCase = getManagedCaseById(referral.caseId)
  const persona = getClientPersona(referral.caseNo)
  const contact = persona.ofwContact
  const primaryNextOfKinProfile = linkedCase?.nextOfKinProfiles?.[0] || linkedCase?.nextOfKinProfile
  const hasExplicitNoNextOfKin = Boolean(linkedCase?.ofwProfile) && !primaryNextOfKinProfile
  const kinRelationship = hasExplicitNoNextOfKin
    ? '-'
    : primaryNextOfKinProfile?.relationship === 'Other'
      ? (primaryNextOfKinProfile?.relationshipOther?.trim() || 'Other')
      : (primaryNextOfKinProfile?.relationship || '-')

  return {
    id: referral.id,
    agencyId: referral.agencyId,
    caseNo: referral.caseNo,
    clientType: linkedCase?.clientType ?? 'Overseas Filipino Worker',
    service: referral.service,
    status: referral.status,
    dateReceived: formatIsoToDisplayDate(referral.createdAt),
    dateUpdated: formatIsoToDisplayDate(referral.updatedAt),
    ofwFullName: referral.clientName,
    ofwBirthDate: persona.ofwBirth,
    ofwGender: persona.gender,
    ofwEmail: persona.ofwEmail,
    ofwContact: contact,
    ofwAddress: persona.ofwAddress,
    nextOfKin: hasExplicitNoNextOfKin ? '-' : primaryNextOfKinProfile?.fullName || persona.kinName,
    kinRelationship,
    kinContact: hasExplicitNoNextOfKin ? '-' : primaryNextOfKinProfile?.contact || persona.kinContact,
    kinEmail: hasExplicitNoNextOfKin ? '-' : primaryNextOfKinProfile?.email || persona.kinEmail,
    kinAddress: hasExplicitNoNextOfKin ? createEmptyAddress() : primaryNextOfKinProfile?.address || persona.kinAddress,
    lastCountry: persona.lastCountry,
    lastJob: persona.lastJob,
    arrivalDate: persona.arrivalDate,
    specialCategories: getSpecialCategories(referral.caseNo),
    requiredServices: [referral.service],
  }
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

function createEmptyAddress(): AddressParts {
  return {
    regionCode: '',
    regionName: '',
    provinceCode: '',
    provinceName: '',
    municipalityCode: '',
    municipalityName: '',
    barangayCode: '',
    barangayName: '',
    streetAddress: '',
  }
}

function getReferralNotesHistory(referral: CaseManagerReferral | null): CaseManagerReferralNote[] {
  if (!referral) {
    return []
  }

  const normalized = (referral.noteHistory?.length ? referral.noteHistory : buildFallbackNotesHistory(referral)).map((note) => ({
    ...note,
    content: note.content.trim(),
  }))

  return normalized
    .filter((note) => note.content.length > 0)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
}

function buildFallbackDocuments(caseData: DetailCase): CaseManagerReferral['documents'] {
  const serviceKey = caseData.service.toLowerCase().replace(/[^a-z]/g, '_')
  return [
    {
      id: `fallback-${caseData.id}-1`,
      name: `${serviceKey}_request_form_${caseData.caseNo}.pdf`,
      uploadedBy: 'Case Manager - Marychris M. Relon',
      uploadedAt: new Date().toISOString(),
    },
    {
      id: `fallback-${caseData.id}-2`,
      name: `client_id_${caseData.caseNo}.jpg`,
      uploadedBy: 'Case Manager - Marychris M. Relon',
      uploadedAt: new Date().toISOString(),
    },
    {
      id: `fallback-${caseData.id}-3`,
      name: `supporting_docs_${caseData.caseNo}.zip`,
      uploadedBy: 'Case Manager - Marychris M. Relon',
      uploadedAt: new Date().toISOString(),
    },
  ]
}

function nowLabel(): string {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  }).format(new Date())
}

function buildInitialTimeline(caseData: DetailCase, agencyLogoSrc: string, agencyName: string, latestRemark?: string): TimelineItem[] {
  const agencyActor = getAgencyActorLabel(caseData.agencyId)
  const timeline: TimelineItem[] = [
    {
      id: `${caseData.caseNo}-received`,
      agency: agencyName,
      title: 'Referral received from Case Manager',
      description: `${caseData.service} request was routed to the agency for review.`,
      time: `${caseData.dateReceived}, 08:30 AM`,
      actor: 'Case Manager - Marychris M. Relon',
      logoSrc: BAYANIHAN_LOGO,
    },
  ]

  if (caseData.status === 'PROCESSING') {
    timeline.push({
      id: `${caseData.caseNo}-processing`,
      agency: agencyName,
      title: `Referral accepted as PROCESSING. Remarks: ${latestRemark?.trim() || 'Initial validation completed.'}`,
      description: 'Status moved to PROCESSING by agency focal.',
      time: `${caseData.dateUpdated}, 09:20 AM`,
      actor: agencyActor,
      logoSrc: agencyLogoSrc,
    })
  }

  if (caseData.status === 'FOR_COMPLIANCE') {
    timeline.push({
      id: `${caseData.caseNo}-for-compliance`,
      agency: agencyName,
      title: `Referral accepted as FOR_COMPLIANCE. Remarks: ${latestRemark?.trim() || 'Additional compliance requirements requested.'}`,
      description: 'Status moved to FOR_COMPLIANCE by agency focal.',
      time: `${caseData.dateUpdated}, 09:20 AM`,
      actor: agencyActor,
      logoSrc: agencyLogoSrc,
    })
  }

  if (caseData.status === 'COMPLETED') {
    timeline.push(
      {
        id: `${caseData.caseNo}-processing`,
        agency: agencyName,
        title: 'Referral was accepted. Remarks: Initial validation completed.',
        description: 'Status moved to PROCESSING by agency focal.',
        time: `${caseData.dateReceived}, 09:20 AM`,
        actor: agencyActor,
        logoSrc: agencyLogoSrc,
      },
      {
        id: `${caseData.caseNo}-completed`,
        agency: agencyName,
        title: `Referral was completed. Remarks: ${latestRemark?.trim() || 'Service delivered successfully.'}`,
        description: 'Case resolution was recorded by agency focal.',
        time: `${caseData.dateUpdated}, 04:10 PM`,
        actor: agencyActor,
        logoSrc: agencyLogoSrc,
      },
    )
  }

  if (caseData.status === 'REJECTED') {
    timeline.push({
      id: `${caseData.caseNo}-rejected`,
      agency: agencyName,
      title: `Referral was rejected. Remarks: ${latestRemark?.trim() || 'Incomplete requirements submitted.'}`,
      description: 'Case was returned for correction and re-submission.',
      time: `${caseData.dateUpdated}, 02:45 PM`,
      actor: agencyActor,
      logoSrc: agencyLogoSrc,
    })
  }

  return timeline
}

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

function matchRequirementsToDocuments(
  requirements: string[],
  documents: CaseManagerReferral['documents'],
): {
  matches: Array<{ requirement: string; document: CaseManagerReferral['documents'][number] | null }>
  unassignedDocuments: CaseManagerReferral['documents']
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

export default function ReferredCaseViewPage(): JSX.Element {
  const navigate = useNavigate()
  const { caseId } = useParams<{ caseId: string }>()
  const [refreshKey, setRefreshKey] = useState(0)
  const [renderKey, setRenderKey] = useState(0)
  const [activeReferralId, setActiveReferralId] = useState<string | null>(caseId ?? null)

  const selectedCase = caseId ? buildDetailCase(caseId) : null
  const selectedReferral = caseId ? getManagedReferralById(caseId) ?? null : null
  const referralOverviewRows = useMemo<ReferralOverviewRow[]>(() => {
    if (!selectedReferral) {
      return []
    }

    return getManagedReferralsByCaseId(selectedReferral.caseId).map((referral) => ({
      id: referral.id,
      caseNo: referral.caseNo,
      agencyName: referral.agencyName,
      status: referral.status,
      service: referral.service,
      latestMilestone: getManagedLatestMilestone(referral.id, 'Referral Sent'),
      dateReferred: formatIsoToDisplayDate(referral.createdAt),
      dateUpdated: formatIsoToDisplayDate(referral.updatedAt),
    }))
  }, [selectedReferral, refreshKey])
  const activeReferral = activeReferralId
    ? getManagedReferralById(activeReferralId) ?? selectedReferral
    : selectedReferral
  const notesHistory = getReferralNotesHistory(activeReferral)
  const mostRecentCaseManagerNote = notesHistory.find((note) => note.createdBy.includes('Case Manager'))

  const [currentStatus, setCurrentStatus] = useState<CaseStatus>('PENDING')
  const [timeline, setTimeline] = useState<TimelineItem[]>([])

  const [pendingDecision, setPendingDecision] = useState<{
    mode: 'ACCEPT' | 'REJECT'
    status: 'PROCESSING' | 'FOR_COMPLIANCE' | 'REJECTED'
  } | null>(null)
  const [decisionRemark, setDecisionRemark] = useState('')

  const [isMilestoneModalOpen, setIsMilestoneModalOpen] = useState(false)
  const [milestoneTitle, setMilestoneTitle] = useState('')
  const [milestoneDescription, setMilestoneDescription] = useState('')

  const [isUpdateStatusModalOpen, setIsUpdateStatusModalOpen] = useState(false)
  const [nextStatus, setNextStatus] = useState<CaseStatus>('PROCESSING')
  const [statusRemark, setStatusRemark] = useState('')
  const [commentDraft, setCommentDraft] = useState('')
  const [replyToNoteId, setReplyToNoteId] = useState<string | null>(null)
  const [activeVersionGroupId, setActiveVersionGroupId] = useState<string | null>(null)
  const [saveMessage, setSaveMessage] = useState('')

  const documents = selectedReferral?.documents?.length
    ? selectedReferral.documents
    : selectedCase
      ? buildFallbackDocuments(selectedCase)
      : []
  const activeDocuments = documents.filter((doc) => !doc.archived)
  const documentVersionRows = activeVersionGroupId
    ? documents
        .filter((doc) => (doc.versionGroupId ?? doc.id) === activeVersionGroupId)
        .sort((a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime())
    : []
  const selectedAgency = selectedCase ? getCaseAgency(selectedCase.id) : null
  const stakeholderServiceDetails = selectedCase ? getStakeholderServiceDetails(selectedCase.agencyId) : []
  const serviceGroups = selectedCase
    ? selectedCase.requiredServices.map((serviceTitle) => {
        const detail = stakeholderServiceDetails.find((item) => item.title === serviceTitle)
        return {
          serviceTitle,
          requiredDocuments: detail?.requiredDocuments ?? [],
        }
      })
    : []
  const agencyName = selectedAgency?.name ?? 'Agency'
  const agencyLogoSrc = selectedAgency?.logoUrl ?? BAYANIHAN_LOGO
  const agencyActor = selectedCase ? getAgencyActorLabel(selectedCase.agencyId) : 'Agency Focal'
  const replyToNote = replyToNoteId ? notesHistory.find((note) => note.id === replyToNoteId) ?? null : null
  const canAddMilestone = isAcceptedStatus(currentStatus) && CURRENT_USER_ROLE === 'Agency Focal'

  const referralColumns: Column<ReferralOverviewRow>[] = [
    {
      key: 'agencyName',
      title: 'AGENCY',
      className: 'w-[24%] whitespace-normal leading-5 align-top',
      render: (row) => <span className="text-[12px] font-semibold text-slate-700">{row.agencyName}</span>,
    },
    {
      key: 'service',
      title: 'SERVICE',
      className: 'w-[23%] whitespace-normal leading-5 align-top',
      render: (row) => <span className="text-[12px] text-slate-600">{row.service}</span>,
    },
    {
      key: 'status',
      title: 'STATUS',
      className: 'w-[14%] whitespace-nowrap align-top',
      render: (row) => (
        <span className={`inline-flex rounded-[3px] border px-2 py-0.5 text-[10px] font-extrabold uppercase ${referralStatusTone(row.status)}`}>
          {row.status}
        </span>
      ),
    },
    {
      key: 'latestMilestone',
      title: 'LATEST MILESTONE',
      className: 'w-[23%] whitespace-normal leading-5 align-top',
      render: (row) => <span className="text-[12px] text-slate-600">{row.latestMilestone}</span>,
    },
    {
      key: 'dateUpdated',
      title: 'UPDATED',
      className: 'w-[10%] whitespace-nowrap align-top',
      render: (row) => <span className="text-[11px] text-slate-500">{row.dateUpdated}</span>,
    },
    {
      key: 'action',
      title: 'ACTIONS',
      className: 'w-[6%] whitespace-nowrap text-right align-top',
      render: (row) => (
        <button
          type="button"
          onClick={() => navigate(`/agency/referrals/${row.id}`)}
          className={`px-2 min-h-[28px] text-[10px] font-bold rounded-[3px] border transition-colors ${
            activeReferralId === row.id
              ? 'bg-[#0b5384] text-white border-[#0b5384]'
              : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
          }`}
        >
          {activeReferralId === row.id ? 'Viewing' : 'View'}
        </button>
      ),
    },
  ]

  // Force state reset when caseId changes - use explicit dependency on caseId
  useEffect(() => {
    setCurrentStatus('PENDING')
    setTimeline([])
    setPendingDecision(null)
    setDecisionRemark('')
    setIsMilestoneModalOpen(false)
    setMilestoneTitle('')
    setMilestoneDescription('')
    setIsUpdateStatusModalOpen(false)
    setStatusRemark('')
    setCommentDraft('')
    setReplyToNoteId(null)
    setActiveVersionGroupId(null)
    setSaveMessage('')
    setRefreshKey(0)
    setRenderKey((prev) => prev + 1) // Force a re-render
    setActiveReferralId(caseId ?? null)
  }, [caseId])

  const submitComment = () => {
    if (!activeReferral) {
      return
    }

    const trimmed = commentDraft.trim()
    if (!trimmed) {
      return
    }

    const nowIso = new Date().toISOString()
    const nextContent = trimmed

    updateManagedReferral(activeReferral.id, (current) => {
      const nextNoteHistory = [
        ...(current.noteHistory?.length ? current.noteHistory : buildFallbackNotesHistory(current)),
        {
          id: `note-${current.id}-${Date.now()}`,
          content: nextContent,
          createdAt: nowIso,
          createdBy: agencyActor,
          parentNoteId: replyToNote?.id,
        },
      ]

      return {
        ...current,
        noteHistory: nextNoteHistory,
        updatedAt: nowIso,
      }
    })

    if (selectedReferral && activeReferral.id === selectedReferral.id) {
      setTimeline((prev) => [
        ...prev,
        {
          id: `${activeReferral.id}-agency-comment-${Date.now()}`,
          agency: agencyName,
          title: replyToNote ? 'Case Reply Added' : 'Case Comment Added',
          description: replyToNote ? 'A reply was posted by Agency Focal.' : 'A case comment was added by Agency Focal.',
          time: nowLabel(),
          actor: agencyActor,
          logoSrc: agencyLogoSrc,
        },
      ])
    }

    setCommentDraft('')
    setReplyToNoteId(null)
    setRefreshKey((prev) => prev + 1)
    setSaveMessage(`Saved ${nowLabel()}.`)
  }

  // Load case data fresh whenever caseId changes
  useEffect(() => {
    if (!caseId) {
      return
    }

    const freshCase = buildDetailCase(caseId)
    if (freshCase) {
      const agencyActor = getAgencyActorLabel(freshCase.agencyId)
      const milestoneEntries = getManagedReferralMilestones(freshCase.id)
      const milestoneTimeline: TimelineItem[] = milestoneEntries.map((item) => ({
        id: `milestone-${item.id}`,
        agency: freshCase.id ? (getCaseAgency(freshCase.id)?.name ?? 'Agency') : 'Agency',
        title: `Milestone: "${item.title}"`,
        description: item.description,
        time: nowLabel(),
        actor: item.actor === 'Agency Focal' ? agencyActor : item.actor,
        logoSrc: freshCase.id ? (getCaseAgency(freshCase.id)?.logoUrl ?? BAYANIHAN_LOGO) : BAYANIHAN_LOGO,
      }))

      setCurrentStatus(freshCase.status)
      const agencyLogoSrc = freshCase.id ? (getCaseAgency(freshCase.id)?.logoUrl ?? BAYANIHAN_LOGO) : BAYANIHAN_LOGO
      const agencyName = freshCase.id ? (getCaseAgency(freshCase.id)?.name ?? 'Agency') : 'Agency'
      const freshReferral = getManagedReferralById(freshCase.id)
      setTimeline([...buildInitialTimeline(freshCase, agencyLogoSrc, agencyName, freshReferral?.remarks), ...milestoneTimeline])
    }
  }, [caseId, refreshKey])

  // Update timeline when refreshKey changes for milestone/status updates
  useEffect(() => {
    if (selectedCase && refreshKey > 0) {
      const agencyActor = getAgencyActorLabel(selectedCase.agencyId)
      const milestoneEntries = getManagedReferralMilestones(selectedCase.id)
      const milestoneTimeline: TimelineItem[] = milestoneEntries.map((item) => ({
        id: `milestone-${item.id}`,
        agency: agencyName,
        title: `Milestone: "${item.title}"`,
        description: item.description,
        time: nowLabel(),
        actor: item.actor === 'Agency Focal' ? agencyActor : item.actor,
        logoSrc: agencyLogoSrc,
      }))

      setCurrentStatus(selectedCase.status)
      setTimeline([...buildInitialTimeline(selectedCase, agencyLogoSrc, agencyName, selectedReferral?.remarks), ...milestoneTimeline])
    }
  }, [selectedCase, selectedReferral?.remarks, agencyLogoSrc, agencyName, refreshKey, renderKey])

  if (!selectedCase) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="bg-white border border-[#cbd5e1] rounded-[3px] p-6">
          <h1 className={pageHeadingStyles.pageTitle}>Case Not Found</h1>
          <p className="mt-2 text-[14px] text-slate-600">The referred case you are trying to view does not exist in this prototype dataset.</p>
          <button
            onClick={() => navigate('/agency/referred-cases')}
            className="mt-5 h-[38px] px-4 bg-[#0b5384] text-white text-[13px] font-bold rounded-[3px] hover:bg-[#09416a] transition"
          >
            Back to Referred Cases
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-[1240px] mx-auto px-4 py-6 space-y-4">
      <div className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-500">
        <Link to="/agency/referred-cases" className="hover:text-[#0b5384] transition">Referrals</Link>
        <span className="mx-2">&gt;</span>
        <span>{selectedCase.caseNo}</span>
      </div>

      <div className="flex items-start justify-between gap-4 flex-wrap">
        <h1 className={pageHeadingStyles.pageTitle}>Referral Details</h1>
        {currentStatus === 'PENDING' ? (
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setPendingDecision({ mode: 'ACCEPT', status: 'PROCESSING' })
                setDecisionRemark('')
              }}
              className="h-[34px] px-3 bg-[#0b5384] text-white text-[11px] font-bold rounded-[3px] border border-[#0b5384] hover:bg-[#09416a] transition"
            >
              Accept
            </button>
            <button
              onClick={() => {
                setPendingDecision({ mode: 'REJECT', status: 'REJECTED' })
                setDecisionRemark('')
              }}
              className="h-[34px] px-3 bg-red-50 text-red-700 text-[11px] font-bold rounded-[3px] border border-red-200 hover:bg-red-100 transition"
            >
              Reject
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-2 bg-white border border-[#d8dee8] rounded-[2px] px-3 py-2">
            <span className="text-[9px] font-extrabold uppercase tracking-[0.14em] text-[#7c889b]">Status</span>
            <span className={`inline-block px-2.5 py-1 text-[10px] font-extrabold uppercase border rounded-[2px] ${getStatusBadgeClass(currentStatus)}`}>
              {currentStatus}
            </span>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-4">
        <main className="xl:col-span-8 space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-6 gap-3">
            <section className="lg:col-span-4 bg-white border border-[#d8dee8] rounded-[2px] overflow-hidden">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
                <HeaderMeta label="Tracking ID" value={selectedCase.caseNo} />
                <HeaderMeta label="Client Type" value={selectedCase.clientType} />
                <HeaderMeta label="Date Received" value={selectedCase.dateReceived} />
                <HeaderMeta label="Date Updated" value={selectedCase.dateUpdated} />
              </div>
            </section>

            <section className="lg:col-span-2 bg-white border border-[#d8dee8] rounded-[2px] p-3">
              <p className="text-[10px] font-extrabold uppercase tracking-[0.14em] text-[#334155]">REQUIRED SERVICES</p>
              <p className="mt-1 text-[11px] text-slate-500">{selectedCase.requiredServices.length} service requests linked to this referral</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {selectedCase.requiredServices.map((service) => (
                  <div key={service} className="px-2.5 py-1 bg-[#eff6ff] text-[#0b5384] border border-[#bfdbfe] text-[11px] font-bold rounded-[2px]">
                    {service}
                  </div>
                ))}
              </div>
            </section>
          </div>

          <section className="rounded-[3px] border-2 border-[#0b5384] bg-gradient-to-r from-[#eff6ff] to-[#f8fafc] p-4 shadow-sm">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-[11px] font-extrabold uppercase tracking-[0.12em] text-[#0b5384]">Case Narrative</h2>
              <span className="inline-flex items-center rounded-[2px] border border-[#bfdbfe] bg-white px-2 py-0.5 text-[9px] font-extrabold uppercase tracking-[0.08em] text-[#0b5384]">
                Priority Context
              </span>
            </div>
            <p className="mt-2 text-[12px] leading-6 text-slate-700">
              {getCaseNarrativeBySeed(selectedCase.id)}
            </p>
          </section>

          <SectionCard title="CLIENT PROFILE">
            <div className="space-y-4">
              <div>
                <h3 className="mb-2 text-[10px] font-extrabold uppercase tracking-[0.14em] text-[#334155]">OFW Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 border border-[#d8dee8]">
                  <InfoCell label="Full Name" value={selectedCase.ofwFullName} />
                  <InfoCell label="Date of Birth" value={selectedCase.ofwBirthDate} />
                  <InfoCell label="Gender" value={selectedCase.ofwGender} />
                  <InfoCell label="Email Address" value={selectedCase.ofwEmail} />
                  <InfoCell label="Contact Number" value={selectedCase.ofwContact} />
                  <InfoCell label=" " value=" " />
                  <InfoCell label="Home Address" value={formatAddressParts(selectedCase.ofwAddress)} fullRow />
                </div>

                {selectedCase.specialCategories.length > 0 ? (
                  <div className="mt-3 border border-[#d8dee8] p-3">
                    <p className="text-[9px] font-extrabold uppercase tracking-[0.14em] text-[#7c889b]">Special Categories</p>
                    <div className="mt-2 flex items-center gap-2 flex-wrap">
                      {selectedCase.specialCategories.map((category) => (
                        <span
                          key={category}
                          className="inline-flex items-center rounded-[2px] border border-[#bfdbfe] bg-[#eff6ff] px-2.5 py-1 text-[11px] font-bold text-[#0b5384]"
                        >
                          {category}
                        </span>
                      ))}
                    </div>
                  </div>
                ) : null}
              </div>

              <div className="border-t border-[#d8dee8] pt-4">
                <h3 className="mb-2 text-[10px] font-extrabold uppercase tracking-[0.14em] text-[#334155]">Work History</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 border border-[#d8dee8]">
                  <InfoCell label="Last Country" value={selectedCase.lastCountry} />
                  <InfoCell label="Last Job Position" value={selectedCase.lastJob} />
                  <InfoCell label="Arrival Date in Philippines" value={selectedCase.arrivalDate} />
                </div>
              </div>

              {selectedCase.clientType === 'Next of Kin' ? (
                <div className="border-t border-[#d8dee8] pt-4">
                  <h3 className="mb-2 text-[10px] font-extrabold uppercase tracking-[0.14em] text-[#334155]">Next of Kin Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 border border-[#d8dee8]">
                    <InfoCell label="Full Name" value={selectedCase.nextOfKin} />
                    <InfoCell label="Relationship to Client" value={selectedCase.kinRelationship} />
                    <InfoCell label="Contact Number" value={selectedCase.kinContact} />
                    <InfoCell label="Email Address" value={selectedCase.kinEmail} />
                    <InfoCell label="Home Address" value={formatAddressParts(selectedCase.kinAddress)} fullRow />
                  </div>
                </div>
              ) : null}
            </div>
          </SectionCard>

          <SectionCard title="CASE REFERRALS">
            <div className="space-y-3">
              <div className="flex items-center justify-between gap-2">
                <p className="text-[11px] text-slate-600">
                  View other agencies handling this case, their latest progress, and open each referral's full details.
                </p>
                <span className="text-[10px] font-extrabold uppercase tracking-[0.08em] text-slate-500">
                  {referralOverviewRows.length} Referral{referralOverviewRows.length === 1 ? '' : 's'}
                </span>
              </div>

              <UnifiedTable
                variant="embedded"
                data={referralOverviewRows}
                columns={referralColumns}
                keyExtractor={(row) => row.id}
                hideControlBar
                hidePagination
              />
            </div>
          </SectionCard>

          <SideCard title="DOCUMENTS">
            <div className="space-y-3">
              {serviceGroups.map((group) => {
                const { matches: requirementMatches } = matchRequirementsToDocuments(group.requiredDocuments, activeDocuments)
                const attachedRequirementCount = requirementMatches.filter((match) => Boolean(match.document)).length

                return (
                  <div key={group.serviceTitle} className="rounded-[2px] border border-[#d8dee8] bg-[#f8fafc] p-3 space-y-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <h3 className="text-[11px] font-extrabold uppercase tracking-[0.08em] text-[#334155]">{group.serviceTitle}</h3>
                      <span className="text-[10px] font-bold text-slate-500">
                        Requirements Attached: {attachedRequirementCount}/{group.requiredDocuments.length}
                      </span>
                    </div>

                    <div className="space-y-1.5">
                      <p className="text-[10px] font-extrabold uppercase tracking-[0.12em] text-slate-500">Required Documents</p>
                      {requirementMatches.length ? (
                        requirementMatches.map(({ requirement, document }) => {
                          const isAttached = Boolean(document)

                          return (
                            <div key={`${group.serviceTitle}-${requirement}`} className="rounded-[2px] border border-[#e2e8f0] bg-white px-2.5 py-2">
                              <div className="flex flex-wrap items-start justify-between gap-2">
                                <p className="text-[11px] text-slate-700">{requirement}</p>
                                <span
                                  className={`inline-flex items-center rounded-[2px] px-2 py-0.5 text-[9px] font-extrabold uppercase tracking-[0.08em] ${
                                    isAttached
                                      ? 'bg-[#ecfdf5] text-[#166534] border border-[#86efac]'
                                      : 'bg-slate-100 text-slate-600 border border-slate-200'
                                  }`}
                                >
                                  {isAttached ? 'Attached' : 'Not Attached'}
                                </span>
                              </div>

                              {document ? (
                                <div className="mt-1.5 flex items-center justify-between gap-3 rounded-[2px] border border-[#dbeafe] bg-[#eff6ff] px-2 py-1.5">
                                  <div className="min-w-0">
                                    <p className="text-[10px] font-bold text-[#0b5384] truncate">{document.name}</p>
                                    <p className="text-[9px] text-slate-500 truncate">{document.uploadedBy} • {formatIsoToDisplayDate(document.uploadedAt)}</p>
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
                                  </div>
                                </div>
                              ) : null}
                            </div>
                          )
                        })
                      ) : (
                        <p className="text-[11px] text-slate-500">No required documents configured for this service.</p>
                      )}
                    </div>

                  </div>

                )
              })}
            </div>
          </SideCard>
        </main>

        <aside className="xl:col-span-4 space-y-4">
          <SideCard title="REFERRAL TIMELINE">
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => {
                  if (!canAddMilestone) {
                    return
                  }
                  setIsMilestoneModalOpen(true)
                  setMilestoneTitle('')
                  setMilestoneDescription('')
                }}
                disabled={!canAddMilestone}
                className="h-[30px] px-3 bg-[#0b5384] text-white text-[11px] font-bold rounded-[2px] hover:bg-[#09416a] transition disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-[#0b5384]"
              >
                Add Milestone
              </button>
              <button
                onClick={() => {
                  setIsUpdateStatusModalOpen(true)
                  setNextStatus(currentStatus === 'PENDING' ? 'PROCESSING' : currentStatus)
                  setStatusRemark('')
                }}
                className="h-[30px] px-3 border border-[#cbd5e1] bg-white text-slate-700 text-[11px] font-bold rounded-[2px] hover:bg-slate-50 transition"
              >
                Update Status
              </button>
            </div>

            <div className="mt-4 relative pl-4">
              {!canAddMilestone ? (
                <p className="mb-3 text-[10px] text-slate-500">
                  {isAcceptedStatus(currentStatus)
                    ? 'Only Agency Focal can add milestones.'
                    : 'Milestones can be added only after referral acceptance.'}
                </p>
              ) : null}
              <div className="absolute left-[4px] top-1 bottom-1 w-px bg-[#cbd5e1]" />
              <div className="flex flex-col-reverse gap-4">
                {timeline.map((item) => (
                  <div key={item.id} className="relative flex items-start gap-3">
                    <div className="mt-0.5 -ml-[18px] h-5 w-5 overflow-hidden rounded-full border border-white bg-white shadow-sm z-10">
                      <img src={item.logoSrc} alt="Timeline source" className="h-full w-full object-contain p-[1px]" />
                    </div>
                    <div>
                      <p className="text-[11px] leading-5 font-semibold text-slate-700">{item.title}</p>
                      <p className="text-[11px] leading-5 text-slate-600">{item.description}</p>
                      <p className="mt-0.5 text-[10px] text-slate-400">{item.time} • {item.actor}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </SideCard>

          <section className="bg-white border border-[#d8dee8] rounded-[2px] p-3">
            <div className="mb-2 flex items-center justify-between gap-2">
              <h3 className={`${pageHeadingStyles.sectionTitle} text-[#334155]`}>REFERRAL COMMENTS</h3>
            </div>
            {activeReferral ? (
              <p className="mb-2 text-[10px] text-slate-500">
                Commenting under: <span className="font-semibold text-slate-700">{activeReferral.agencyName}</span> - {activeReferral.service}
              </p>
            ) : null}
            <div className="border border-[#d8dee8] bg-[#f8fafc] p-2.5 space-y-2">
              <div className="max-h-[260px] overflow-y-auto">
                <CaseCommentsThread
                  notes={notesHistory}
                  mostRecentCaseManagerNoteId={mostRecentCaseManagerNote?.id}
                  onReply={(note) => {
                    setReplyToNoteId(note.id)
                  }}
                />
              </div>

              <div className="border-t border-[#d8dee8] pt-2 space-y-2">
                {replyToNote ? (
                  <div className="flex items-center justify-between gap-2 rounded-[2px] border border-[#d8dee8] bg-white px-2.5 py-1.5">
                    <p className="text-[10px] text-slate-600">Replying to {replyToNote.createdBy}</p>
                    <button
                      type="button"
                      onClick={() => setReplyToNoteId(null)}
                      className="text-[10px] font-semibold text-slate-600 hover:underline"
                    >
                      Cancel
                    </button>
                  </div>
                ) : null}

                <textarea
                  value={commentDraft}
                  onChange={(event) => setCommentDraft(event.target.value)}
                  rows={2}
                  className="w-full rounded-[3px] border border-[#cbd5e1] px-3 py-2 text-[12px] text-slate-700 outline-none focus:border-[#0b5384]"
                  placeholder={replyToNote ? 'Write your reply' : 'Write a new comment'}
                />

                <div className="flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setCommentDraft('')
                      setReplyToNoteId(null)
                    }}
                    className="h-[26px] px-2.5 border border-[#cbd5e1] bg-white text-slate-700 text-[10px] font-semibold rounded-[2px] hover:bg-slate-50"
                  >
                    Clear
                  </button>
                  <button
                    type="button"
                    onClick={submitComment}
                    className="h-[26px] px-2.5 bg-[#0b5384] text-white text-[10px] font-semibold rounded-[2px] border border-[#0b5384] hover:bg-[#09416a]"
                  >
                    {replyToNote ? 'Post Reply' : 'Post Comment'}
                  </button>
                </div>
              </div>
            </div>
          </section>

        </aside>
      </div>

      {saveMessage ? <p className="text-[11px] font-semibold text-[#0b5384]">{saveMessage}</p> : null}

      {activeVersionGroupId ? (
        <DocumentVersionsModal
          documents={documentVersionRows}
          onClose={() => setActiveVersionGroupId(null)}
        />
      ) : null}

      {pendingDecision ? (
        <DecisionModal
          mode={pendingDecision.mode}
          selectedStatus={pendingDecision.status}
          onStatusChange={(status) => {
            if (!pendingDecision || pendingDecision.mode !== 'ACCEPT') {
              return
            }

            setPendingDecision({
              ...pendingDecision,
              status,
            })
          }}
          remark={decisionRemark}
          onRemarkChange={setDecisionRemark}
          onCancel={() => {
            setPendingDecision(null)
            setDecisionRemark('')
          }}
          onConfirm={() => {
            const trimmed = decisionRemark.trim()
            if (!trimmed) {
              return
            }

            setCurrentStatus(pendingDecision.status)
            updateManagedReferralStatus(selectedCase.id, pendingDecision.status, trimmed)
            setRefreshKey((prev) => prev + 1)

            setPendingDecision(null)
            setDecisionRemark('')
          }}
          confirmLabel={pendingDecision.mode === 'ACCEPT' ? 'Confirm Accept' : 'Confirm Reject'}
        />
      ) : null}

      {isMilestoneModalOpen ? (
        <MilestoneModal
          title={milestoneTitle}
          description={milestoneDescription}
          onTitleChange={setMilestoneTitle}
          onDescriptionChange={setMilestoneDescription}
          onCancel={() => {
            setIsMilestoneModalOpen(false)
            setMilestoneTitle('')
            setMilestoneDescription('')
          }}
          onSave={() => {
            if (!canAddMilestone) {
              return
            }

            const title = milestoneTitle.trim()
            const description = milestoneDescription.trim()
            if (!title || !description) {
              return
            }

            addManagedReferralMilestone(selectedCase.id, title, description)
            setRefreshKey((prev) => prev + 1)

            setIsMilestoneModalOpen(false)
            setMilestoneTitle('')
            setMilestoneDescription('')
          }}
        />
      ) : null}

      {isUpdateStatusModalOpen ? (
        <UpdateStatusModal
          nextStatus={nextStatus}
          remark={statusRemark}
          onStatusChange={setNextStatus}
          onRemarkChange={setStatusRemark}
          onCancel={() => {
            setIsUpdateStatusModalOpen(false)
            setStatusRemark('')
          }}
          onSave={() => {
            const trimmed = statusRemark.trim()
            if (!trimmed) {
              return
            }

            setCurrentStatus(nextStatus)
            updateManagedReferralStatus(selectedCase.id, nextStatus, trimmed)
            setRefreshKey((prev) => prev + 1)

            setIsUpdateStatusModalOpen(false)
            setStatusRemark('')
          }}
        />
      ) : null}
    </div>
  )
}

function DocumentVersionsModal({
  documents,
  onClose,
}: {
  documents: CaseManagerReferral['documents']
  onClose: () => void
}): JSX.Element {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4">
      <div className="w-full max-w-xl rounded-[3px] border border-[#cbd5e1] bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-[#e2e8f0] px-5 py-4">
          <h2 className="text-[16px] font-extrabold text-slate-900">Document Versions</h2>
          <button
            onClick={onClose}
            className="h-8 rounded-[3px] border border-[#cbd5e1] px-3 text-[11px] font-bold text-slate-700"
          >
            Close
          </button>
        </div>

        <div className="max-h-[300px] space-y-2 overflow-y-auto px-5 py-4">
          {documents.map((doc) => (
            <div key={doc.id} className="flex items-center justify-between gap-2 border border-[#e2e8f0] bg-[#f8fafc] p-2">
              <div className="min-w-0">
                <p className="text-[11px] font-bold text-slate-700 truncate">{doc.name}</p>
                <p className="text-[10px] text-slate-500">
                  {formatIsoToDisplayDate(doc.uploadedAt)} • {doc.uploadedBy} • {doc.archived ? 'Archived' : 'Current'}
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

function HeaderMeta({ label, value }: { label: string; value: string }): JSX.Element {
  return (
    <div className="px-3 py-3 border-r border-[#e2e8f0] last:border-r-0">
      <p className="text-[8px] font-extrabold uppercase tracking-[0.14em] text-[#7c889b]">{label}</p>
      <p className="mt-1 text-[14px] font-bold text-[#0f172a] break-words">{value}</p>
    </div>
  )
}

function SectionCard({ title, children }: { title: string; children: ReactNode }): JSX.Element {
  return (
    <section className="bg-white border border-[#d8dee8] rounded-[2px] p-3">
      <h2 className={`${pageHeadingStyles.sectionTitle} mb-3 text-[#334155]`}>{title}</h2>
      {children}
    </section>
  )
}

function SideCard({ title, children }: { title: string; children: ReactNode }): JSX.Element {
  return (
    <section className="bg-white border border-[#d8dee8] rounded-[2px] p-4">
      <h3 className={`${pageHeadingStyles.sectionTitle} mb-3`}>{title}</h3>
      {children}
    </section>
  )
}

function InfoCell({ label, value, fullRow = false }: { label: string; value: string; fullRow?: boolean }): JSX.Element {
  return (
    <div className={`p-3 border-r border-b border-[#e2e8f0] md:last:border-r-0 ${fullRow ? 'md:col-span-3' : ''}`}>
      <p className="text-[8px] font-extrabold uppercase tracking-[0.14em] text-[#7c889b]">{label}</p>
      <p className="mt-1 text-[14px] leading-5 font-bold text-[#0b3a67] break-words">{value}</p>
    </div>
  )
}

function DecisionModal({
  mode,
  selectedStatus,
  onStatusChange,
  remark,
  onRemarkChange,
  onCancel,
  onConfirm,
  confirmLabel,
}: {
  mode: 'ACCEPT' | 'REJECT'
  selectedStatus: 'PROCESSING' | 'FOR_COMPLIANCE' | 'REJECTED'
  onStatusChange: (status: 'PROCESSING' | 'FOR_COMPLIANCE') => void
  remark: string
  onRemarkChange: (value: string) => void
  onCancel: () => void
  onConfirm: () => void
  confirmLabel: string
}): JSX.Element {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4">
      <div className="w-full max-w-lg rounded-[3px] border border-[#cbd5e1] bg-white shadow-xl">
        <div className="border-b border-[#e2e8f0] px-5 py-4">
          <h2 className="text-[16px] font-extrabold text-slate-900">{mode === 'ACCEPT' ? 'Accept Referral' : 'Reject Referral'}</h2>
          <p className="mt-1 text-[12px] text-slate-500">A remark is required before submitting your decision.</p>
        </div>

        <div className="space-y-4 px-5 py-4">
          {mode === 'ACCEPT' ? (
            <div>
              <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-[0.08em] text-slate-600">Accepted Status</label>
              <select
                value={selectedStatus}
                onChange={(event) => onStatusChange(event.target.value as 'PROCESSING' | 'FOR_COMPLIANCE')}
                className="h-10 w-full rounded-[3px] border border-[#cbd5e1] px-3 text-[13px] text-slate-700 outline-none"
              >
                <option value="PROCESSING">Processing</option>
                <option value="FOR_COMPLIANCE">For Compliance</option>
              </select>
            </div>
          ) : null}

          <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-[0.08em] text-slate-600">Remark</label>
          <textarea
            value={remark}
            onChange={(event) => onRemarkChange(event.target.value)}
            rows={4}
            placeholder="Enter your remark..."
            className="w-full rounded-[3px] border border-[#cbd5e1] px-3 py-2 text-[13px] text-slate-700 outline-none focus:border-[#0b5384] focus:ring-1 focus:ring-[#0b5384]"
          />
        </div>

        <div className="flex justify-end gap-2 border-t border-[#e2e8f0] px-5 py-3">
          <button
            onClick={onCancel}
            className="h-9 rounded-[3px] border border-[#cbd5e1] px-3 text-[12px] font-bold text-slate-700"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={!remark.trim()}
            className="h-9 rounded-[3px] bg-[#0b5384] px-3 text-[12px] font-bold text-white disabled:cursor-not-allowed disabled:opacity-50"
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}

function MilestoneModal({
  title,
  description,
  onTitleChange,
  onDescriptionChange,
  onCancel,
  onSave,
}: {
  title: string
  description: string
  onTitleChange: (value: string) => void
  onDescriptionChange: (value: string) => void
  onCancel: () => void
  onSave: () => void
}): JSX.Element {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4">
      <div className="w-full max-w-lg rounded-[3px] border border-[#cbd5e1] bg-white shadow-xl">
        <div className="border-b border-[#e2e8f0] px-5 py-4">
          <h2 className="text-[16px] font-extrabold text-slate-900">Add Milestone</h2>
          <p className="mt-1 text-[12px] text-slate-500">Enter a title and short description for this milestone.</p>
        </div>

        <div className="space-y-4 px-5 py-4">
          <div>
            <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-[0.08em] text-slate-600">Title</label>
            <input
              value={title}
              onChange={(event) => onTitleChange(event.target.value)}
              placeholder="e.g. Documents Verified"
              className="h-10 w-full rounded-[3px] border border-[#cbd5e1] px-3 text-[13px] text-slate-700 outline-none focus:border-[#0b5384] focus:ring-1 focus:ring-[#0b5384]"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-[0.08em] text-slate-600">Short Description</label>
            <textarea
              value={description}
              onChange={(event) => onDescriptionChange(event.target.value)}
              rows={4}
              placeholder="Briefly describe this milestone..."
              className="w-full rounded-[3px] border border-[#cbd5e1] px-3 py-2 text-[13px] text-slate-700 outline-none focus:border-[#0b5384] focus:ring-1 focus:ring-[#0b5384]"
            />
          </div>
        </div>

        <div className="flex justify-end gap-2 border-t border-[#e2e8f0] px-5 py-3">
          <button
            onClick={onCancel}
            className="h-9 rounded-[3px] border border-[#cbd5e1] px-3 text-[12px] font-bold text-slate-700"
          >
            Cancel
          </button>
          <button
            onClick={onSave}
            disabled={!title.trim() || !description.trim()}
            className="h-9 rounded-[3px] bg-[#0b5384] px-3 text-[12px] font-bold text-white disabled:cursor-not-allowed disabled:opacity-50"
          >
            Save Milestone
          </button>
        </div>
      </div>
    </div>
  )
}

function UpdateStatusModal({
  nextStatus,
  remark,
  onStatusChange,
  onRemarkChange,
  onCancel,
  onSave,
}: {
  nextStatus: CaseStatus
  remark: string
  onStatusChange: (status: CaseStatus) => void
  onRemarkChange: (value: string) => void
  onCancel: () => void
  onSave: () => void
}): JSX.Element {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4">
      <div className="w-full max-w-lg rounded-[3px] border border-[#cbd5e1] bg-white shadow-xl">
        <div className="border-b border-[#e2e8f0] px-5 py-4">
          <h2 className="text-[16px] font-extrabold text-slate-900">Update Status</h2>
          <p className="mt-1 text-[12px] text-slate-500">A remark is required for each status change.</p>
        </div>

        <div className="space-y-4 px-5 py-4">
          <div>
            <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-[0.08em] text-slate-600">New Status</label>
            <select
              value={nextStatus}
              onChange={(event) => onStatusChange(event.target.value as CaseStatus)}
              className="h-10 w-full rounded-[3px] border border-[#cbd5e1] px-3 text-[13px] text-slate-700 outline-none"
            >
              <option value="PENDING">Pending</option>
              <option value="PROCESSING">Processing</option>
              <option value="FOR_COMPLIANCE">For Compliance</option>
              <option value="COMPLETED">Completed</option>
              <option value="REJECTED">Rejected</option>
            </select>
          </div>

          <div>
            <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-[0.08em] text-slate-600">Remark</label>
            <textarea
              value={remark}
              onChange={(event) => onRemarkChange(event.target.value)}
              rows={4}
              placeholder="Enter status update remark..."
              className="w-full rounded-[3px] border border-[#cbd5e1] px-3 py-2 text-[13px] text-slate-700 outline-none focus:border-[#0b5384] focus:ring-1 focus:ring-[#0b5384]"
            />
          </div>
        </div>

        <div className="flex justify-end gap-2 border-t border-[#e2e8f0] px-5 py-3">
          <button
            onClick={onCancel}
            className="h-9 rounded-[3px] border border-[#cbd5e1] px-3 text-[12px] font-bold text-slate-700"
          >
            Cancel
          </button>
          <button
            onClick={onSave}
            disabled={!remark.trim()}
            className="h-9 rounded-[3px] bg-[#0b5384] px-3 text-[12px] font-bold text-white disabled:cursor-not-allowed disabled:opacity-50"
          >
            Update Status
          </button>
        </div>
      </div>
    </div>
  )
}
