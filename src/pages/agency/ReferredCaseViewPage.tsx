import { useEffect, useRef, useState, type ChangeEvent } from 'react'
import type { JSX, ReactNode } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { pageHeadingStyles } from './pageHeadingStyles'
import { getStatusBadgeClass } from './statusBadgeStyles'
import { getCaseNarrativeBySeed } from '../../data/unifiedData'
import { getCaseAgency } from '../../data/unifiedData'
import { formatAddressParts, getAgencyFocalByAgencyId, getClientPersona, getSpecialCategories, type AddressParts, type CaseManagerReferral, type CaseManagerReferralNote } from '../../data/unifiedData'
import ReferralNotesCarousel from '../../components/ui/ReferralNotesCarousel'
import {
  addManagedReferralMilestone,
  getManagedCaseById,
  getManagedLatestMilestone,
  getManagedReferralById,
  getManagedReferralMilestones,
  updateManagedReferral,
  updateManagedReferralStatus,
} from '../../data/caseLifecycleStore'

type CaseStatus = 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'REJECTED'
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

const CURRENT_USER_ROLE: UserRole = 'Agency Focal'
const BAYANIHAN_LOGO = '/logo.png'
const CASE_MANAGER_ACTOR = 'Case Manager - Marychris M. Relon'

function getAgencyActorLabel(agencyId: string): string {
  const focal = getAgencyFocalByAgencyId(agencyId)
  return `Agency Focal - ${focal.name}`
}

function isAcceptedStatus(status: CaseStatus): boolean {
  return status === 'PROCESSING' || status === 'COMPLETED'
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
    nextOfKin: persona.kinName,
    kinContact: persona.kinContact,
    kinEmail: persona.kinEmail,
    kinAddress: persona.kinAddress,
    lastCountry: persona.lastCountry,
    lastJob: persona.lastJob,
    arrivalDate: persona.arrivalDate,
    specialCategories: getSpecialCategories(referral.caseNo),
    requiredServices: [referral.service],
  }
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

function buildInitialTimeline(caseData: DetailCase, agencyLogoSrc: string, agencyName: string): TimelineItem[] {
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
      title: 'Referral was accepted. Remarks: Initial validation completed.',
      description: 'Status moved to PROCESSING by agency focal.',
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
        title: 'Referral was completed. Remarks: Service delivered successfully.',
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
      title: 'Referral was rejected. Remarks: Incomplete requirements submitted.',
      description: 'Case was returned for correction and re-submission.',
      time: `${caseData.dateUpdated}, 02:45 PM`,
      actor: agencyActor,
      logoSrc: agencyLogoSrc,
    })
  }

  return timeline
}

export default function ReferredCaseViewPage(): JSX.Element {
  const navigate = useNavigate()
  const { caseId } = useParams<{ caseId: string }>()
  const [refreshKey, setRefreshKey] = useState(0)
  const [renderKey, setRenderKey] = useState(0)
  const fileInputRefs = useRef<Record<string, HTMLInputElement | null>>({})
  
  const selectedCase = caseId ? buildDetailCase(caseId) : null
  const selectedReferral = caseId ? getManagedReferralById(caseId) ?? null : null
  const notesHistory = getReferralNotesHistory(selectedReferral)
  const mostRecentCaseManagerNote = notesHistory.find((note) => note.createdBy.includes('Case Manager'))
  const latestNoteText = notesHistory[0]?.content ?? ''

  const [currentStatus, setCurrentStatus] = useState<CaseStatus>('PENDING')
  const [timeline, setTimeline] = useState<TimelineItem[]>([])

  const [pendingDecision, setPendingDecision] = useState<'PROCESSING' | 'REJECTED' | null>(null)
  const [decisionRemark, setDecisionRemark] = useState('')

  const [isMilestoneModalOpen, setIsMilestoneModalOpen] = useState(false)
  const [milestoneTitle, setMilestoneTitle] = useState('')
  const [milestoneDescription, setMilestoneDescription] = useState('')

  const [isUpdateStatusModalOpen, setIsUpdateStatusModalOpen] = useState(false)
  const [nextStatus, setNextStatus] = useState<CaseStatus>('PROCESSING')
  const [statusRemark, setStatusRemark] = useState('')
  const [isAddNoteOpen, setIsAddNoteOpen] = useState(false)
  const [noteDraft, setNoteDraft] = useState('')
  const [pendingNote, setPendingNote] = useState<string | null>(null)
  const [pendingReplacements, setPendingReplacements] = useState<Record<string, File>>({})
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false)
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
  const agencyName = selectedAgency?.name ?? 'Agency'
  const agencyLogoSrc = selectedAgency?.logoUrl ?? BAYANIHAN_LOGO
  const agencyActor = selectedCase ? getAgencyActorLabel(selectedCase.agencyId) : 'Agency Focal'
  const canAddMilestone = isAcceptedStatus(currentStatus) && CURRENT_USER_ROLE === 'Agency Focal'
  const pendingNoteValue = pendingNote?.trim() ?? ''
  const hasPendingChanges = Boolean(pendingNoteValue) || Object.keys(pendingReplacements).length > 0
  const pendingChangeSummary = [
    pendingNoteValue ? `Add note: "${pendingNoteValue.slice(0, 90)}${pendingNoteValue.length > 90 ? '...' : ''}"` : null,
    ...Object.entries(pendingReplacements).map(([docId, file]) => {
      const target = activeDocuments.find((item) => item.id === docId)
      return `Replace document: ${target?.name ?? 'Unknown document'} -> ${file.name}`
    }),
  ].filter((item): item is string => Boolean(item))

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
    setIsAddNoteOpen(false)
    setNoteDraft('')
    setPendingNote(null)
    setPendingReplacements({})
    setIsConfirmModalOpen(false)
    setActiveVersionGroupId(null)
    setSaveMessage('')
    setRefreshKey(0)
    setRenderKey((prev) => prev + 1) // Force a re-render
  }, [caseId])

  useEffect(() => {
    setNoteDraft(latestNoteText)
  }, [latestNoteText, caseId])

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
      setTimeline([...buildInitialTimeline(freshCase, agencyLogoSrc, agencyName), ...milestoneTimeline])
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
      setTimeline([...buildInitialTimeline(selectedCase, agencyLogoSrc, agencyName), ...milestoneTimeline])
    }
  }, [selectedCase, agencyLogoSrc, agencyName, refreshKey, renderKey])

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
                setPendingDecision('PROCESSING')
                setDecisionRemark('')
              }}
              className="h-[34px] px-3 bg-[#0b5384] text-white text-[11px] font-bold rounded-[3px] border border-[#0b5384] hover:bg-[#09416a] transition"
            >
              Accept
            </button>
            <button
              onClick={() => {
                setPendingDecision('REJECTED')
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
                    <InfoCell label="Contact Number" value={selectedCase.kinContact} />
                    <InfoCell label="Email Address" value={selectedCase.kinEmail} />
                    <InfoCell label="Home Address" value={formatAddressParts(selectedCase.kinAddress)} fullRow />
                  </div>
                </div>
              ) : null}
            </div>
          </SectionCard>
        </main>

        <aside className="xl:col-span-4 space-y-4">
          <SideCard title="CASE NARRATIVE">
            <p className="text-[12px] leading-5 text-slate-600">
              {getCaseNarrativeBySeed(selectedCase.id)}
            </p>
          </SideCard>

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

          <section className="bg-white border border-[#d8dee8] rounded-[2px] p-4">
            <div className="mb-3 flex items-center justify-between gap-2">
              <h3 className={`${pageHeadingStyles.sectionTitle} text-[#334155]`}>REFERRAL NOTES</h3>
              <button
                type="button"
                onClick={() => setIsAddNoteOpen((prev) => !prev)}
                className="h-[28px] px-3 bg-[#0b5384] text-white text-[10px] font-bold rounded-[2px] border border-[#0b5384] hover:bg-[#09416a]"
              >
                Add Note
              </button>
            </div>
            <div className="aspect-square border border-[#d8dee8] bg-[#f8fafc] p-3 overflow-y-auto">
              {isAddNoteOpen ? (
                <div className="mb-3 space-y-2 border border-[#d8dee8] bg-white p-3">
                  <textarea
                    value={noteDraft}
                    onChange={(event) => setNoteDraft(event.target.value)}
                    rows={3}
                    className="w-full rounded-[3px] border border-[#cbd5e1] px-3 py-2 text-[12px] text-slate-700 outline-none focus:border-[#0b5384]"
                    placeholder="Write a referral note"
                  />
                  <div className="flex items-center justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setIsAddNoteOpen(false)
                        setNoteDraft(latestNoteText)
                      }}
                      className="h-[28px] px-3 border border-[#cbd5e1] bg-white text-slate-700 text-[10px] font-bold rounded-[2px] hover:bg-slate-50"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const trimmed = noteDraft.trim()
                        if (!trimmed || trimmed === latestNoteText.trim()) {
                          return
                        }
                        setPendingNote(trimmed)
                        setIsAddNoteOpen(false)
                      }}
                      className="h-[28px] px-3 bg-[#0b5384] text-white text-[10px] font-bold rounded-[2px] border border-[#0b5384] hover:bg-[#09416a]"
                    >
                      Queue Note
                    </button>
                  </div>
                </div>
              ) : null}

              {pendingNoteValue ? (
                <div className="mb-3 rounded-[2px] border border-amber-200 bg-amber-50 px-3 py-2">
                  <p className="text-[10px] font-bold uppercase tracking-[0.08em] text-amber-700">Pending Note</p>
                  <p className="mt-1 text-[11px] text-amber-900">{pendingNoteValue}</p>
                </div>
              ) : null}

              <ReferralNotesCarousel notes={notesHistory} mostRecentCaseManagerNoteId={mostRecentCaseManagerNote?.id} />
            </div>
          </section>

          <SideCard title="DOCUMENTS">
            <div className="space-y-2">
              {activeDocuments.map((doc) => (
                <div key={doc.id} className="bg-[#f5f7fb] border border-[#e2e8f0] p-3 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="w-6 h-6 rounded-[2px] bg-slate-100 text-slate-700 flex items-center justify-center text-[10px] font-black">
                      <span>F</span>
                    </div>
                    <div className="min-w-0">
                      <p className="text-[11px] font-bold text-slate-700 truncate">{doc.name}</p>
                      <p className="text-[9px] text-slate-400 truncate">{doc.uploadedBy} • {formatIsoToDisplayDate(doc.uploadedAt)}</p>
                      {pendingReplacements[doc.id] ? (
                        <p className="mt-1 text-[10px] font-semibold text-amber-700">Pending replacement: {pendingReplacements[doc.id].name}</p>
                      ) : null}
                    </div>
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
                      onChange={(event: ChangeEvent<HTMLInputElement>) => {
                        const targetId = event.target.dataset.docId
                        const file = event.target.files?.[0]
                        if (!targetId || !file) {
                          return
                        }

                        setPendingReplacements((prev) => ({
                          ...prev,
                          [targetId]: file,
                        }))
                        event.target.value = ''
                      }}
                      className="hidden"
                    />
                  </div>
                </div>
              ))}
            </div>
          </SideCard>
        </aside>
      </div>

      {saveMessage ? <p className="text-[11px] font-semibold text-[#0b5384]">{saveMessage}</p> : null}

      {hasPendingChanges ? (
        <button
          type="button"
          onClick={() => setIsConfirmModalOpen(true)}
          className="fixed bottom-6 right-6 z-40 h-[38px] px-4 bg-[#0b5384] text-white text-[11px] font-bold rounded-[3px] border border-[#0b5384] shadow-lg hover:bg-[#09416a]"
        >
          Review Pending Changes
        </button>
      ) : null}

      {isConfirmModalOpen ? (
        <ChangeReviewModal
          changes={pendingChangeSummary}
          onClose={() => setIsConfirmModalOpen(false)}
          onDiscard={() => {
            setPendingNote(null)
            setPendingReplacements({})
            setIsConfirmModalOpen(false)
            setNoteDraft(latestNoteText)
          }}
          onSave={() => {
            if (!selectedReferral) {
              return
            }

            const nowIso = new Date().toISOString()
            const nextTimeline = [...timeline]

            if (pendingNoteValue) {
              nextTimeline.push({
                id: `${selectedReferral.id}-agency-note-${Date.now()}`,
                agency: agencyName,
                title: 'Referral Note Added',
                description: 'A referral note was added by Agency Focal.',
                time: nowLabel(),
                actor: agencyActor,
                logoSrc: agencyLogoSrc,
              })
            }

            if (Object.keys(pendingReplacements).length > 0) {
              nextTimeline.push({
                id: `${selectedReferral.id}-agency-docs-${Date.now()}`,
                agency: agencyName,
                title: 'Referral Documents Replaced',
                description: `${Object.keys(pendingReplacements).length} document${Object.keys(pendingReplacements).length > 1 ? 's were' : ' was'} replaced by Agency Focal.`,
                time: nowLabel(),
                actor: agencyActor,
                logoSrc: agencyLogoSrc,
              })
            }

            updateManagedReferral(selectedReferral.id, (current) => {
              const nextNoteHistory = pendingNoteValue
                ? [
                    ...(current.noteHistory?.length ? current.noteHistory : buildFallbackNotesHistory(current)),
                    {
                      id: `note-${current.id}-${Date.now()}`,
                      content: pendingNoteValue,
                      createdAt: nowIso,
                      createdBy: agencyActor,
                    },
                  ]
                : current.noteHistory

              const nextDocuments = [...(current.documents ?? [])]
              Object.entries(pendingReplacements).forEach(([docId, file], index) => {
                const targetIndex = nextDocuments.findIndex((doc) => doc.id === docId)
                if (targetIndex < 0) {
                  return
                }

                const target = nextDocuments[targetIndex]
                const versionGroupId = target.versionGroupId ?? target.id
                const replacementId = `doc-${current.id}-agency-replacement-${Date.now()}-${index}`

                nextDocuments[targetIndex] = {
                  ...target,
                  archived: true,
                  replacedById: replacementId,
                  versionGroupId,
                }

                nextDocuments.push({
                  id: replacementId,
                  name: file.name,
                  uploadedBy: agencyActor,
                  uploadedAt: nowIso,
                  replacesId: target.id,
                  versionGroupId,
                })
              })

              return {
                ...current,
                notes: pendingNoteValue || current.notes,
                noteHistory: nextNoteHistory,
                documents: nextDocuments,
                updatedAt: nowIso,
              }
            })

            setTimeline(nextTimeline)
            setPendingNote(null)
            setPendingReplacements({})
            setIsConfirmModalOpen(false)
            setNoteDraft('')
            setRefreshKey((prev) => prev + 1)
            setSaveMessage(`Saved ${nowLabel()}.`)
          }}
        />
      ) : null}

      {activeVersionGroupId ? (
        <DocumentVersionsModal
          documents={documentVersionRows}
          onClose={() => setActiveVersionGroupId(null)}
        />
      ) : null}

      {pendingDecision ? (
        <DecisionModal
          title={pendingDecision === 'PROCESSING' ? 'Accept Referral' : 'Reject Referral'}
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

            setCurrentStatus(pendingDecision)
            updateManagedReferralStatus(selectedCase.id, pendingDecision, trimmed)
            setRefreshKey((prev) => prev + 1)

            setPendingDecision(null)
            setDecisionRemark('')
          }}
          confirmLabel={pendingDecision === 'PROCESSING' ? 'Confirm Accept' : 'Confirm Reject'}
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

function ChangeReviewModal({
  changes,
  onClose,
  onDiscard,
  onSave,
}: {
  changes: string[]
  onClose: () => void
  onDiscard: () => void
  onSave: () => void
}): JSX.Element {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4">
      <div className="w-full max-w-lg rounded-[3px] border border-[#cbd5e1] bg-white shadow-xl">
        <div className="border-b border-[#e2e8f0] px-5 py-4">
          <h2 className="text-[16px] font-extrabold text-slate-900">Confirm Referral Changes</h2>
          <p className="mt-1 text-[12px] text-slate-500">Review what will be saved to notes and documents.</p>
        </div>

        <div className="max-h-[260px] space-y-2 overflow-y-auto px-5 py-4">
          {changes.length ? (
            changes.map((change) => (
              <p key={change} className="text-[12px] text-slate-700">• {change}</p>
            ))
          ) : (
            <p className="text-[12px] text-slate-500">No pending changes.</p>
          )}
        </div>

        <div className="flex justify-end gap-2 border-t border-[#e2e8f0] px-5 py-3">
          <button
            onClick={onClose}
            className="h-9 rounded-[3px] border border-[#cbd5e1] px-3 text-[12px] font-bold text-slate-700"
          >
            Back
          </button>
          <button
            onClick={onDiscard}
            className="h-9 rounded-[3px] border border-red-200 bg-red-50 px-3 text-[12px] font-bold text-red-700"
          >
            Discard
          </button>
          <button
            onClick={onSave}
            className="h-9 rounded-[3px] bg-[#0b5384] px-3 text-[12px] font-bold text-white"
          >
            Save Changes
          </button>
        </div>
      </div>
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
  title,
  remark,
  onRemarkChange,
  onCancel,
  onConfirm,
  confirmLabel,
}: {
  title: string
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
          <h2 className="text-[16px] font-extrabold text-slate-900">{title}</h2>
          <p className="mt-1 text-[12px] text-slate-500">A remark is required before submitting your decision.</p>
        </div>

        <div className="px-5 py-4">
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
