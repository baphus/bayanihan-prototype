import { useEffect, useState } from 'react'
import type { JSX, ReactNode } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { pageHeadingStyles } from './pageHeadingStyles'
import { getStatusBadgeClass } from './statusBadgeStyles'
import { REFERRAL_CASES } from '../../data/unifiedData'
import { getCaseNarrativeBySeed } from '../../data/unifiedData'
import { getCaseAgency } from '../../data/unifiedData'

type CaseStatus = 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'REJECTED'
type ClientType = 'Next of Kin' | 'Overseas Filipino Worker'
type SpecialCategory = 'Senior Citizen' | 'PWD' | 'Solo Parent'
type UserRole = 'Agency Focal' | 'Case Manager' | 'System Admin' | 'OFW'

type DetailCase = {
  id: string
  caseNo: string
  clientType: ClientType
  service: string
  milestone: string
  status: CaseStatus
  dateReceived: string
  dateUpdated: string
  ofwFullName: string
  ofwBirthDate: string
  ofwGender: string
  ofwEmail: string
  ofwContact: string
  ofwAddress: string
  nextOfKin: string
  kinContact: string
  kinEmail: string
  kinAddress: string
  lastCountry: string
  lastJob: string
  arrivalDate: string
  specialCategories: SpecialCategory[]
  requiredServices: string[]
}

type CaseSeed = {
  id: string
  caseNo: string
  clientName: string
  clientType: ClientType
  service: string
  milestone: string
  status: CaseStatus
  dateReceived: string
  dateUpdated: string
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

const AGENCY_ACTOR = 'Agency Focal - Marychris M. Relon'
const CURRENT_USER_ROLE: UserRole = 'Agency Focal'
const BAYANIHAN_LOGO = '/logo.png'

function isAcceptedStatus(status: CaseStatus): boolean {
  return status === 'PROCESSING' || status === 'COMPLETED'
}

type CaseDocument = {
  name: string
  meta: string
  color: string
}

function formatIsoToDisplayDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short',
    day: '2-digit',
    year: 'numeric',
  })
}

const CASE_SEEDS: CaseSeed[] = REFERRAL_CASES.map((item) => ({
  id: item.id,
  caseNo: item.caseNo,
  clientName: item.clientName,
  clientType: item.clientType,
  service: item.service,
  milestone: item.milestone,
  status: item.status,
  dateReceived: formatIsoToDisplayDate(item.createdAt),
  dateUpdated: formatIsoToDisplayDate(item.updatedAt),
}))

const CASES: DetailCase[] = CASE_SEEDS.map((seed, index) => {
  const kinName = `Kin of ${seed.clientName.split(',')[0]}`
  const contact = `+63 917 123 45${(index + 10).toString().slice(-2)}`
  const specialCategories: SpecialCategory[] = []

  if (index % 5 === 0) {
    specialCategories.push('Senior Citizen')
  }

  if (index % 4 === 0) {
    specialCategories.push('PWD')
  }

  if (index % 6 === 0) {
    specialCategories.push('Solo Parent')
  }

  return {
    id: seed.id,
    caseNo: seed.caseNo,
    clientType: seed.clientType,
    service: seed.service,
    milestone: seed.milestone,
    status: seed.status,
    dateReceived: seed.dateReceived,
    dateUpdated: seed.dateUpdated,
    ofwFullName: seed.clientName,
    ofwBirthDate: `May ${String((index % 20) + 1).padStart(2, '0')}, ${1985 + (index % 10)} (${30 + (index % 12)} yrs)`,
    ofwGender: index % 2 === 0 ? 'Male' : 'Female',
    ofwEmail: `${seed.clientName.toLowerCase().replace(/[^a-z]/g, '.').replace(/\.+/g, '.').replace(/^\.|\.$/g, '')}@email.ph`,
    ofwContact: contact,
    ofwAddress: `Blk ${index + 10}, Lot ${index + 30}, Greenview Subd., Brgy. San Jose, Quezon City`,
    nextOfKin: kinName,
    kinContact: contact,
    kinEmail: `kin.${seed.id.toLowerCase()}@email.ph`,
    kinAddress: `Blk ${index + 10}, Lot ${index + 30}, Greenview Subd., Brgy. San Jose, Quezon City`,
    lastCountry: ['Saudi Arabia', 'Qatar', 'UAE', 'Kuwait'][index % 4],
    lastJob: ['Construction Supervisor', 'Caregiver', 'Machine Operator', 'Domestic Worker'][index % 4],
    arrivalDate: `Oct ${String((index % 28) + 1).padStart(2, '0')}, 2023`,
    specialCategories,
    requiredServices: [seed.service],
  }
})

function buildDocuments(caseData: DetailCase): CaseDocument[] {
  const serviceKey = caseData.service.toLowerCase().replace(/[^a-z]/g, '_')
  return [
    { name: `${serviceKey}_request_form_${caseData.caseNo}.pdf`, meta: 'Marychris M. Relon - Case Manager', color: 'text-red-600 bg-red-50' },
    { name: `client_id_${caseData.caseNo}.jpg`, meta: 'Marychris M. Relon - Case Manager', color: 'text-blue-600 bg-blue-50' },
    { name: `supporting_docs_${caseData.caseNo}.zip`, meta: 'Marychris M. Relon - Case Manager', color: 'text-amber-600 bg-amber-50' },
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

  if (isAcceptedStatus(caseData.status)) {
    timeline.push({
      id: `${caseData.caseNo}-initial-milestone`,
      agency: agencyName,
      title: `Milestone: "${caseData.milestone}"`,
      description: `Tracking started for ${caseData.service.toLowerCase()}.`,
      time: `${caseData.dateReceived}, 10:10 AM`,
      actor: AGENCY_ACTOR,
      logoSrc: agencyLogoSrc,
    })
  }

  if (caseData.status === 'PROCESSING') {
    timeline.push({
      id: `${caseData.caseNo}-processing`,
      agency: agencyName,
      title: 'Referral was accepted. Remarks: Initial validation completed.',
      description: 'Status moved to PROCESSING by agency focal.',
      time: `${caseData.dateUpdated}, 09:20 AM`,
      actor: AGENCY_ACTOR,
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
        actor: AGENCY_ACTOR,
        logoSrc: agencyLogoSrc,
      },
      {
        id: `${caseData.caseNo}-completed`,
        agency: agencyName,
        title: 'Referral was completed. Remarks: Service delivered successfully.',
        description: 'Case resolution was recorded by agency focal.',
        time: `${caseData.dateUpdated}, 04:10 PM`,
        actor: AGENCY_ACTOR,
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
      actor: AGENCY_ACTOR,
      logoSrc: agencyLogoSrc,
    })
  }

  return timeline
}

export default function ReferredCaseViewPage(): JSX.Element {
  const navigate = useNavigate()
  const { caseId } = useParams<{ caseId: string }>()
  const selectedCase = CASES.find((entry) => entry.id === caseId)

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

  const documents = selectedCase ? buildDocuments(selectedCase) : []
  const selectedAgency = selectedCase ? getCaseAgency(selectedCase.id) : null
  const agencyName = selectedAgency?.name ?? 'Agency'
  const agencyLogoSrc = selectedAgency?.logoUrl ?? BAYANIHAN_LOGO
  const canAddMilestone = isAcceptedStatus(currentStatus) && CURRENT_USER_ROLE === 'Agency Focal'

  useEffect(() => {
    if (selectedCase) {
      setCurrentStatus(selectedCase.status)
      setTimeline(buildInitialTimeline(selectedCase, agencyLogoSrc, agencyName))
    }
  }, [selectedCase, agencyLogoSrc, agencyName])

  const pushTimelineEntry = (entry: { title: string; description: string; actor?: string; logoSrc?: string; agency?: string }) => {
    setTimeline((prev) => [
      ...prev,
      {
        id: `evt-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`,
        agency: entry.agency ?? agencyName,
        time: nowLabel(),
        title: entry.title,
        description: entry.description,
        actor: entry.actor ?? AGENCY_ACTOR,
        logoSrc: entry.logoSrc ?? agencyLogoSrc,
      },
    ])
  }

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
                  <InfoCell label="Home Address" value={selectedCase.ofwAddress} fullRow />
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
                    <InfoCell label="Home Address" value={selectedCase.kinAddress} fullRow />
                  </div>
                </div>
              ) : null}
            </div>
          </SectionCard>

          <SectionCard title="NOTES">
            <div className="border border-[#d8dee8] bg-[#f8fafc] px-4 py-3 text-[13px] leading-6 text-slate-600">
              Lorem ipsum dolor sit amet consectetur adipiscing elit Ut et massa mi. Aliquam in hendrerit urna. Pellentesque sit amet sapien fringilla, mattis ligula consectetur, ultrices mauris. Maecenas vitae mattis tellus. Nullam quis imperdiet augue. Vestibulum auctor ornare leo, non suscipit magna interdum eu. Curabitur pellentesque nibh nibh, at maximus ante fermentum sit amet. Pellentesque commodo lacus at sodales sodales.
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
                      <img src={item.logoSrc} alt="Timeline source" className="h-full w-full object-cover" />
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

          <SideCard title="DOCUMENTS">
            <div className="space-y-2">
              {documents.map((doc) => (
                <div key={doc.name} className="bg-[#f5f7fb] border border-[#e2e8f0] p-3 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2 min-w-0">
                    <div className={`w-6 h-6 rounded-[2px] ${doc.color} flex items-center justify-center text-[10px] font-black`}>
                      <span>F</span>
                    </div>
                    <div className="min-w-0">
                      <p className="text-[11px] font-bold text-slate-700 truncate">{doc.name}</p>
                      <p className="text-[9px] text-slate-400 truncate">{doc.meta}</p>
                    </div>
                  </div>
                  <button className="text-[10px] text-[#0b5384] font-bold hover:underline">View</button>
                </div>
              ))}
            </div>
          </SideCard>
        </aside>
      </div>

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
            if (pendingDecision === 'PROCESSING') {
              pushTimelineEntry({
                title: `Referral was accepted. Remarks: ${trimmed}`,
                description: 'Status moved to PROCESSING by agency focal.',
              })
            } else {
              pushTimelineEntry({
                title: `Referral was rejected. Remarks: ${trimmed}`,
                description: 'Status moved to REJECTED by agency focal.',
              })
            }

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

            pushTimelineEntry({
              title: `Milestone: "${title}"`,
              description,
            })

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
            const label =
              nextStatus === 'REJECTED'
                ? 'Referral was rejected'
                : nextStatus === 'COMPLETED'
                  ? 'Referral was completed'
                  : nextStatus === 'PROCESSING'
                    ? 'Referral was accepted'
                    : 'Referral was set to pending'

            pushTimelineEntry({
              title: `${label}. Remarks: ${trimmed}`,
              description: `Status updated to ${nextStatus} by agency focal.`,
            })

            setIsUpdateStatusModalOpen(false)
            setStatusRemark('')
          }}
        />
      ) : null}
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
