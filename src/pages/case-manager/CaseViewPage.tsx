import { useMemo, useState, type JSX } from 'react'
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom'
import { Eye } from 'lucide-react'
import { UnifiedTable, type Column } from '../../components/ui/UnifiedTable'
import AppToast from '../../components/ui/AppToast'
import { pageHeadingStyles } from '../agency/pageHeadingStyles'
import {
  formatAddressParts,
  formatDisplayDateTime,
  getCaseManagerAgencies,
  toCaseHealthStatus,
  type CaseManagerReferral,
} from '../../data/unifiedData'
import {
  getManagedCaseById,
  getManagedLatestMilestone,
  getManagedReferralsByCaseId,
  updateManagedCaseOpenClosed,
  updateManagedCase,
} from '../../data/caseLifecycleStore'
import { getReferralActorsForCase } from '../../data/unifiedData'
import {
  getCaseNarrativeBySeed,
  getClientPersona,
  getSpecialCategories,
  type SpecialCategory,
} from '../../data/unifiedData'

type TimelineActor = 'System' | 'Agency' | 'Case Manager'

type TimelineItem = {
  id: string
  actorType: TimelineActor
  agency: string
  agencyId?: string
  logoType: 'bayanihan' | 'agency'
  actorName: string
  milestone?: string
  isMilestoneUpdate?: boolean
  title: string
  description: string
  timestamp: string
}

type ReferralRow = {
  id: string
  referral: CaseManagerReferral
  agency: string
  referralStatus: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'REJECTED'
  service: string
  latestMilestone: string
  dateReferred: string
  dateReferredIso: string
  updatedAtIso: string
}

type CaseDocument = {
  id: string
  name: string
  uploadedBy: string
  uploadedAt: string
}

type CreatedCaseState = {
  createdCase?: {
    id: string
    caseNo: string
    clientName: string
    clientType: 'Overseas Filipino Worker' | 'Next of Kin'
    service: string
    milestone: string
    status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'REJECTED'
    createdAt: string
    updatedAt: string
    agencyId: string
    agencyShort: string
    agencyName: string
    caseNarrative?: string
  }
  toastMessage?: string
}

function withOffsetMinutes(iso: string, minutes: number): string {
  return new Date(new Date(iso).getTime() + minutes * 60000).toISOString()
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

function referralStatusTone(status: ReferralRow['referralStatus']): string {
  if (status === 'PENDING') {
    return 'border-[#fde68a] bg-[#fef3c7] text-[#b45309]'
  }

  if (status === 'PROCESSING') {
    return 'border-[#bae6fd] bg-[#e0f2fe] text-[#0369a1]'
  }

  if (status === 'COMPLETED') {
    return 'border-[#bbf7d0] bg-[#dcfce7] text-[#15803d]'
  }

  return 'border-[#fecaca] bg-[#fee2e2] text-[#b91c1c]'
}

function getCaseAgeDays(createdAt: string, updatedAt: string): string {
  const created = new Date(createdAt).getTime()
  const updated = new Date(updatedAt).getTime()
  const days = Math.max(1, Math.round((updated - created) / (1000 * 60 * 60 * 24)))
  return `${days} day${days > 1 ? 's' : ''}`
}

function buildCaseTimeline(
  caseId: string,
  createdAt: string,
  referrals: ReferralRow[],
  caseStatus: 'OPEN' | 'CLOSED',
  caseUpdatedAt: string,
): TimelineItem[] {
  const actors = getReferralActorsForCase(caseId)
  const timeline: TimelineItem[] = [
    {
      id: `${caseId}-system-created`,
      actorType: 'Case Manager',
      agency: 'Bayanihan',
      logoType: 'bayanihan',
      actorName: actors.caseManager.name,
      title: 'Case Created',
      description: 'Case record was created in the Bayanihan portal.',
      timestamp: createdAt,
    },
  ]

  referrals.forEach((referralRow) => {
    timeline.push({
      id: `${referralRow.id}-referred`,
      actorType: 'Case Manager',
      agency: referralRow.agency,
      logoType: 'bayanihan',
      actorName: actors.caseManager.name,
      title: 'Referral Sent',
      description: `Case was referred to ${referralRow.agency} for ${referralRow.service}.`,
      timestamp: referralRow.dateReferredIso,
    })

    if (referralRow.referralStatus === 'PENDING') {
      return
    }

    if (referralRow.referralStatus === 'PROCESSING') {
      timeline.push(
        {
          id: `${referralRow.id}-accepted`,
          actorType: 'Agency',
          agency: referralRow.agency,
          agencyId: referralRow.referral.agencyId,
          logoType: 'agency',
          actorName: actors.agencyFocal.name,
          title: 'Referral Accepted',
          description: 'Agency accepted the referral and started processing.',
          timestamp: withOffsetMinutes(referralRow.dateReferredIso, 30),
        },
      )
      return
    }

    if (referralRow.referralStatus === 'COMPLETED') {
      timeline.push(
        {
          id: `${referralRow.id}-accepted`,
          actorType: 'Agency',
          agency: referralRow.agency,
          agencyId: referralRow.referral.agencyId,
          logoType: 'agency',
          actorName: actors.agencyFocal.name,
          title: 'Referral Accepted',
          description: 'Agency accepted the referral and started processing.',
          timestamp: withOffsetMinutes(referralRow.dateReferredIso, 20),
        },
        {
          id: `${referralRow.id}-completed`,
          actorType: 'Agency',
          agency: referralRow.agency,
          agencyId: referralRow.referral.agencyId,
          logoType: 'agency',
          actorName: actors.agencyFocal.name,
          title: 'Referral Completed',
          description: 'Agency marked this referral as completed.',
          timestamp: referralRow.updatedAtIso,
        },
      )
      return
    }

    timeline.push({
      id: `${referralRow.id}-rejected`,
      actorType: 'Agency',
      agency: referralRow.agency,
      agencyId: referralRow.referral.agencyId,
      logoType: 'agency',
      actorName: actors.agencyFocal.name,
      title: 'Referral Rejected',
      description: 'Agency rejected the referral and returned it for follow-up.',
      timestamp: referralRow.updatedAtIso,
    })
  })

  if (caseStatus === 'CLOSED') {
    const latestReferralUpdate = referrals.reduce((latest, row) => {
      return new Date(row.updatedAtIso).getTime() > new Date(latest).getTime() ? row.updatedAtIso : latest
    }, createdAt)

    const closeTimestamp =
      new Date(caseUpdatedAt).getTime() >= new Date(latestReferralUpdate).getTime()
        ? caseUpdatedAt
        : withOffsetMinutes(latestReferralUpdate, 1)

    timeline.push({
      id: `${caseId}-case-closed`,
      actorType: 'Case Manager',
      agency: 'Bayanihan',
      logoType: 'bayanihan',
      actorName: actors.caseManager.name,
      title: 'Case Closed by Case Manager',
      description: 'Case Manager closed this case after referral processing was completed.',
      timestamp: closeTimestamp,
    })
  }

  timeline.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())

  return timeline
}

export default function CaseViewPage(): JSX.Element {
  const navigate = useNavigate()
  const location = useLocation()
  const { caseId } = useParams<{ caseId: string }>()
  const [refreshKey, setRefreshKey] = useState(0)

  const routeState = (location.state ?? {}) as CreatedCaseState
  const selectedCase = caseId ? getManagedCaseById(caseId) : undefined
  const createdCaseFromState = routeState.createdCase && routeState.createdCase.id === caseId
    ? routeState.createdCase
    : undefined
  const caseRecord = selectedCase ?? createdCaseFromState

  if (!caseRecord) {
    return (
      <div className="mx-auto max-w-5xl py-8">
        <div className="rounded-[3px] border border-[#cbd5e1] bg-white p-6">
          <h1 className={pageHeadingStyles.pageTitle}>Case Not Found</h1>
          <p className="mt-2 text-[14px] text-slate-600">The requested case does not exist in the current prototype data.</p>
          <button
            type="button"
            onClick={() => navigate('/case-manager/cases')}
            className="mt-5 h-[38px] rounded-[3px] bg-[#0b5384] px-4 text-[13px] font-bold text-white hover:bg-[#09416a]"
          >
            Back to Cases
          </button>
        </div>
      </div>
    )
  }

  const persona = getClientPersona(caseRecord.caseNo)
  const hasExplicitNoNextOfKin = Boolean(caseRecord.ofwProfile) && !caseRecord.nextOfKinProfile
  const ofwDetails = {
    fullName: caseRecord.ofwProfile?.fullName || persona.ofwName,
    birthDate: caseRecord.ofwProfile?.birthDate || persona.ofwBirth,
    gender: caseRecord.ofwProfile?.gender || persona.gender,
    email: caseRecord.ofwProfile?.email || persona.ofwEmail,
    contact: caseRecord.ofwProfile?.contact || persona.ofwContact,
    address: caseRecord.ofwProfile?.address || persona.ofwAddress,
  }
  const workHistory = {
    lastCountry: caseRecord.workHistory?.lastCountry || persona.lastCountry,
    lastJob: caseRecord.workHistory?.lastJob || persona.lastJob,
    arrivalDate: caseRecord.workHistory?.arrivalDate || persona.arrivalDate,
  }
  const nextOfKinDetails = hasExplicitNoNextOfKin
    ? null
    : {
        fullName: caseRecord.nextOfKinProfile?.fullName || persona.kinName,
        relationship: caseRecord.nextOfKinProfile?.relationship === 'Other'
          ? (caseRecord.nextOfKinProfile?.relationshipOther?.trim() || 'Other')
          : (caseRecord.nextOfKinProfile?.relationship || '-'),
        contact: caseRecord.nextOfKinProfile?.contact || persona.kinContact,
        email: caseRecord.nextOfKinProfile?.email || persona.kinEmail,
        address: caseRecord.nextOfKinProfile?.address || persona.kinAddress,
      }
  const caseStatus = toCaseHealthStatus(caseRecord.status)
  const fallbackSpecialCategories = getSpecialCategories(caseRecord.caseNo)
  const ofwSpecialCategories =
    caseRecord.ofwProfile?.specialCategories || (caseRecord.clientType === 'Overseas Filipino Worker' ? fallbackSpecialCategories : [])
  const nextOfKinSpecialCategories =
    hasExplicitNoNextOfKin
      ? []
      : (caseRecord.nextOfKinProfile?.specialCategories || (caseRecord.clientType === 'Next of Kin' ? fallbackSpecialCategories : []))
  const [isEditDetailsOpen, setIsEditDetailsOpen] = useState(false)
  const [editableClientType, setEditableClientType] = useState(caseRecord.clientType)
  const [editableNarrative, setEditableNarrative] = useState(
    caseRecord.caseNarrative?.trim().length
      ? caseRecord.caseNarrative
      : createdCaseFromState?.caseNarrative?.trim().length
        ? createdCaseFromState.caseNarrative
        : getCaseNarrativeBySeed(caseRecord.id),
  )
  const [toastMessage, setToastMessage] = useState(routeState.toastMessage ?? '')

  const allAgencies = getCaseManagerAgencies()
  const referralRows = useMemo(() => {
    return getManagedReferralsByCaseId(caseRecord.id).map((referral) => ({
      id: referral.id,
      referral,
      agency: referral.agencyName,
      referralStatus: referral.status,
      service: referral.service,
      latestMilestone: getManagedLatestMilestone(referral.id, 'Referral Sent'),
      dateReferred: formatDisplayDateTime(referral.createdAt),
      dateReferredIso: referral.createdAt,
      updatedAtIso: referral.updatedAt,
    }))
  }, [caseRecord.id, refreshKey])
  const timeline = buildCaseTimeline(caseRecord.id, caseRecord.createdAt, referralRows, caseStatus, caseRecord.updatedAt)
  const [timelineAgencyFilter, setTimelineAgencyFilter] = useState('ALL')

  const referredAgencyIds = useMemo(() => new Set(referralRows.map((row) => row.referral.agencyId)), [referralRows])
  const referableAgencies = useMemo(
    () => allAgencies.filter((agency) => !referredAgencyIds.has(agency.id)),
    [allAgencies, referredAgencyIds],
  )

  const timelineAgencies = useMemo(() => {
    const unique = new Set<string>()
    referralRows.forEach((row) => unique.add(row.agency))
    return Array.from(unique).sort((a, b) => a.localeCompare(b))
  }, [referralRows])

  const filteredTimeline = useMemo(() => {
    if (timelineAgencyFilter === 'ALL') {
      return timeline
    }

    return timeline.filter((item) => item.agency === timelineAgencyFilter)
  }, [timeline, timelineAgencyFilter])

  const saveCaseDetails = () => {
    updateManagedCase(caseRecord.id, (current) => ({
      ...current,
      clientType: editableClientType,
      caseNarrative: editableNarrative.trim(),
      updatedAt: new Date().toISOString(),
    }))
    setIsEditDetailsOpen(false)
    setRefreshKey((prev) => prev + 1)
  }

  const referralColumns: Column<ReferralRow>[] = [
    {
      key: 'agency',
      title: 'AGENCY',
      className: 'w-[34%] whitespace-normal leading-5 align-top',
      render: (row) => <span className="text-[12px] font-semibold text-slate-700">{row.agency}</span>,
    },
    {
      key: 'referralStatus',
      title: 'REFERRAL STATUS',
      className: 'w-[14%] whitespace-nowrap align-top',
      render: (row) => (
        <span className={`inline-flex rounded-[3px] border px-2 py-0.5 text-[10px] font-extrabold uppercase ${referralStatusTone(row.referralStatus)}`}>
          {row.referralStatus}
        </span>
      ),
    },
    {
      key: 'latestMilestone',
      title: 'LATEST MILESTONE',
      className: 'w-[29%] whitespace-normal leading-5 align-top',
      render: (row) => <span className="text-[12px] text-slate-600">{row.latestMilestone}</span>,
    },
    {
      key: 'dateReferred',
      title: 'DATE REFERRED',
      className: 'w-[16%] whitespace-nowrap align-top',
      render: (row) => <span className="text-[12px] text-slate-500">{row.dateReferred}</span>,
    },
    {
      key: 'action',
      title: 'ACTION',
      className: 'w-[6%] whitespace-nowrap text-right align-top',
      render: (row) => (
        <button
          type="button"
          onClick={() => navigate(`/case-manager/referrals/${row.referral.id}`, { state: { referral: row.referral } })}
          className="px-2 min-h-[28px] bg-[#f1f5f9] text-slate-700 hover:bg-slate-200 text-[11px] font-bold rounded-[3px] transition-colors border border-slate-300"
        >
          View
        </button>
      ),
    },
  ]

  const caseDocuments: CaseDocument[] = [
    {
      id: `${caseRecord.id}-doc-1`,
      name: `Passport_Copy_${caseRecord.caseNo}.pdf`,
      uploadedBy: 'Case Manager',
      uploadedAt: formatDisplayDateTime(caseRecord.createdAt),
    },
    {
      id: `${caseRecord.id}-doc-2`,
      name: `Sworn_Statement_${caseRecord.caseNo}.docx`,
      uploadedBy: 'Case Manager',
      uploadedAt: formatDisplayDateTime(withOffsetMinutes(caseRecord.createdAt, 45)),
    },
  ]

  return (
    <div className="w-full pb-8 space-y-5">
      {toastMessage.trim() ? (
        <AppToast message={toastMessage} onClose={() => setToastMessage('')} tone="success" />
      ) : null}
      <div className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-500">
        <Link to="/case-manager/cases" className="transition hover:text-[#0b5384]">Cases</Link>
        <span className="mx-2">&gt;</span>
        <span>{caseRecord.caseNo}</span>
      </div>

      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className={pageHeadingStyles.pageTitle}>Case Details</h1>
          <p className={pageHeadingStyles.pageSubtitle}>Overview of client profile, referral progress, and timeline updates.</p>
        </div>
        <div className="flex items-center gap-2">
          <span
            className={`px-2 py-0.5 text-[11px] font-extrabold uppercase rounded-[3px] border ${
              caseStatus === 'OPEN'
                ? 'border-[#bae6fd] bg-[#e0f2fe] text-[#0369a1]'
                : 'border-[#cbd5e1] bg-slate-100 text-slate-700'
            }`}
          >
            {caseStatus}
          </span>
          <button
            type="button"
            onClick={() => setIsEditDetailsOpen(true)}
            className="px-3 min-h-[32px] bg-[#f1f5f9] text-slate-700 hover:bg-slate-200 text-[12px] font-bold rounded-[3px] transition-colors border border-slate-300"
          >
            Edit Details
          </button>
          <button
            type="button"
            onClick={() => {
              updateManagedCaseOpenClosed(caseRecord.id, caseStatus === 'OPEN' ? 'CLOSED' : 'OPEN')
              setRefreshKey((prev) => prev + 1)
            }}
            className="px-3 min-h-[32px] bg-[#0b5384] text-white hover:bg-[#09416a] text-[12px] font-bold rounded-[3px] transition-colors border border-[#0b5384]"
          >
            {caseStatus === 'OPEN' ? 'Close Case' : 'Reopen Case'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-4">
        <main className="xl:col-span-8 space-y-4">
          <CardSection title="Case Information">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3">
              <MetaTile label="Case No." value={caseRecord.id} />
              <MetaTile label="Tracking ID" value={caseRecord.caseNo} />
              <MetaTile label="Client Type" value={editableClientType} />
              <MetaTile label="Date Created" value={formatDisplayDateTime(caseRecord.createdAt)} />
              <MetaTile label="Case Age" value={getCaseAgeDays(caseRecord.createdAt, caseRecord.updatedAt)} />
            </div>
          </CardSection>

          <CardSection title="Client Information">
            <div className="space-y-5">
              <Subsection title="OFW Information">
                <div className="grid grid-cols-1 md:grid-cols-3 border border-[#d8dee8]">
                  <InfoCell label="Full Name" value={ofwDetails.fullName} />
                  <InfoCell label="Date of Birth" value={ofwDetails.birthDate} />
                  <InfoCell label="Gender" value={ofwDetails.gender} />
                  <InfoCell label="Email Address" value={ofwDetails.email} />
                  <InfoCell label="Contact Number" value={ofwDetails.contact} />
                  <InfoCell label=" " value=" " />
                  <InfoCell label="Home Address" value={formatAddressParts(ofwDetails.address)} fullRow />
                </div>

                {ofwSpecialCategories.length > 0 ? (
                  <div className="rounded-[3px] border border-[#d8dee8] bg-[#f8fafc] p-3">
                    <p className="text-[9px] font-extrabold uppercase tracking-[0.14em] text-[#7c889b]">Vulnerability</p>
                    <div className="mt-2 flex flex-wrap items-center gap-4">
                      {(['Senior Citizen', 'PWD', 'Solo Parent'] as SpecialCategory[]).map((category) => (
                        <label key={category} className="inline-flex items-center gap-2 text-[12px] text-slate-600">
                          <input type="checkbox" checked={ofwSpecialCategories.includes(category)} readOnly className="h-3.5 w-3.5" />
                          <span>{category}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                ) : null}
              </Subsection>

              <Subsection title="Work History">
                <div className="grid grid-cols-1 md:grid-cols-3 border border-[#d8dee8]">
                  <InfoCell label="Last Country" value={workHistory.lastCountry} />
                  <InfoCell label="Last Job Position" value={workHistory.lastJob} />
                  <InfoCell label="Arrival Date in Philippines" value={workHistory.arrivalDate} />
                </div>
              </Subsection>

              <Subsection title="Next of Kin Information">
                {nextOfKinDetails ? (
                  <div className="grid grid-cols-1 md:grid-cols-3 border border-[#d8dee8]">
                    <InfoCell label="Full Name" value={nextOfKinDetails.fullName} />
                    <InfoCell label="Relationship to Client" value={nextOfKinDetails.relationship} />
                    <InfoCell label="Contact Number" value={nextOfKinDetails.contact} />
                    <InfoCell label="Email Address" value={nextOfKinDetails.email} />
                    <InfoCell label="Home Address" value={formatAddressParts(nextOfKinDetails.address)} fullRow />
                  </div>
                ) : (
                  <div className="rounded-[3px] border border-[#d8dee8] bg-[#f8fafc] px-3 py-2 text-[12px] text-slate-600">
                    No next of kin indicated for this case.
                  </div>
                )}
                {nextOfKinSpecialCategories.length > 0 ? (
                  <div className="mt-3 rounded-[3px] border border-[#d8dee8] bg-[#f8fafc] p-3">
                    <p className="text-[9px] font-extrabold uppercase tracking-[0.14em] text-[#7c889b]">Vulnerability</p>
                    <div className="mt-2 flex flex-wrap items-center gap-4">
                      {(['Senior Citizen', 'PWD', 'Solo Parent'] as SpecialCategory[]).map((category) => (
                        <label key={category} className="inline-flex items-center gap-2 text-[12px] text-slate-600">
                          <input type="checkbox" checked={nextOfKinSpecialCategories.includes(category)} readOnly className="h-3.5 w-3.5" />
                          <span>{category}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                ) : null}
              </Subsection>
            </div>
          </CardSection>

          <CardSection title="Referrals">
            <div className="mb-3 flex items-center justify-between">
              <h4 className="text-[10px] font-extrabold uppercase tracking-[0.12em] text-[#64748b]">Agency Referrals</h4>
              <button
                type="button"
                onClick={() => navigate(`/case-manager/cases/${caseRecord.id}/refer`)}
                disabled={referableAgencies.length === 0 || caseStatus === 'CLOSED'}
                className="px-3 min-h-[30px] bg-[#f1f5f9] text-slate-700 hover:bg-slate-200 text-[11px] font-bold rounded-[3px] transition-colors border border-slate-300 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                + Refer to Agency
              </button>
            </div>
            <UnifiedTable
              variant="embedded"
              data={referralRows}
              columns={referralColumns}
              keyExtractor={(row) => row.id}
              hideControlBar
              hidePagination
            />
          </CardSection>

          <section className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <CardSection title="Case Documents">
              <div className="space-y-2">
                {caseDocuments.map((document) => (
                  <div key={document.id} className="flex items-center justify-between rounded-[3px] border border-[#e2e8f0] bg-[#f8fafc] px-3 py-2">
                    <div>
                      <p className="text-[12px] font-semibold text-slate-700">{document.name}</p>
                      <p className="text-[10px] text-slate-500">{document.uploadedBy} • {document.uploadedAt}</p>
                    </div>
                    <button type="button" className="text-slate-500 hover:text-[#0b5384]"><Eye className="h-4 w-4" /></button>
                  </div>
                ))}
              </div>
            </CardSection>

            <div className="bg-white border border-dashed border-[#cbd5e1] rounded-[3px] p-4 flex items-center justify-center">
              <div className="text-center">
                <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-[#eff6ff] text-[#0b5384] border border-[#bfdbfe]">
                  <span className="material-symbols-outlined text-[20px]">upload</span>
                </div>
                <p className="mt-2 text-[11px] font-bold uppercase tracking-[0.08em] text-[#0b5384]">Upload New File</p>
                <p className="mt-1 text-[10px] text-slate-500">PDF or image up to 10MB</p>
              </div>
            </div>
          </section>
        </main>

        <aside className="xl:col-span-4 space-y-4">
          <CardSection title="Case Narrative">
            <p className="text-[12px] leading-5 text-slate-600">
              {editableNarrative}
            </p>
          </CardSection>

          <CardSection title="Case Timeline">
            <div className="flex flex-wrap items-center justify-end gap-2">
              <select
                value={timelineAgencyFilter}
                onChange={(event) => setTimelineAgencyFilter(event.target.value)}
                className="h-[30px] w-[170px] max-w-full shrink-0 rounded-[3px] border border-[#cbd5e1] bg-white px-2 text-[10px] font-extrabold uppercase tracking-[0.08em] text-slate-600"
              >
                <option value="ALL">All agencies</option>
                {timelineAgencies.map((agency) => (
                  <option key={agency} value={agency}>{agency}</option>
                ))}
              </select>
            </div>
            <div className="relative mt-4">
              <div className="absolute left-[10px] top-1 bottom-1 w-px bg-[#cbd5e1]" />
              <div className="flex flex-col-reverse gap-4">
                {filteredTimeline.map((item) => {
                  const logoSrc = getTimelineLogoSrc(item.logoType, item.agencyId)
                  return (
                    <div key={item.id} className="relative grid grid-cols-[22px_1fr] items-start gap-3">
                      <div className="z-10 mt-0.5 flex h-[22px] w-[22px] items-center justify-center overflow-hidden rounded-full border border-white bg-white shadow-sm">
                        <img src={logoSrc} alt="Timeline source" className="h-full w-full object-cover" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-[11px] leading-5 font-semibold text-slate-700">{item.title}</p>
                        <p className="text-[11px] leading-5 text-slate-600">{item.description}</p>
                        <p className="mt-0.5 text-[10px] text-slate-400">
                            {formatDisplayDateTime(item.timestamp)} • {item.actorName}
                        </p>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </CardSection>
        </aside>
      </div>

      {isEditDetailsOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4">
          <div className="w-full max-w-2xl rounded-[3px] border border-[#cbd5e1] bg-white shadow-xl">
            <div className="border-b border-[#e2e8f0] px-5 py-4">
              <h2 className="text-[16px] font-extrabold text-slate-900">Edit Case Details</h2>
              <p className="mt-1 text-[12px] text-slate-500">Update visible case details for this record.</p>
            </div>

            <div className="grid grid-cols-1 gap-4 px-5 py-4 md:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-[0.08em] text-slate-600">Client Type</label>
                <select
                  value={editableClientType}
                  onChange={(event) => setEditableClientType(event.target.value as 'Overseas Filipino Worker' | 'Next of Kin')}
                  className="h-10 w-full rounded-[3px] border border-[#cbd5e1] px-3 text-[13px] text-slate-700 outline-none"
                >
                  <option value="Overseas Filipino Worker">Overseas Filipino Worker</option>
                  <option value="Next of Kin">Next of Kin</option>
                </select>
              </div>

              <div className="md:col-span-2">
                <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-[0.08em] text-slate-600">Case Narrative</label>
                <textarea
                  rows={5}
                  value={editableNarrative}
                  onChange={(event) => setEditableNarrative(event.target.value)}
                  className="w-full rounded-[3px] border border-[#cbd5e1] px-3 py-2 text-[13px] text-slate-700 outline-none"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 border-t border-[#e2e8f0] px-5 py-3">
              <button
                type="button"
                onClick={() => setIsEditDetailsOpen(false)}
                className="h-9 rounded-[3px] border border-[#cbd5e1] px-3 text-[12px] font-bold text-slate-700"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={saveCaseDetails}
                className="h-9 rounded-[3px] bg-[#0b5384] px-3 text-[12px] font-bold text-white"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}

function MetaTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[3px] border border-[#e2e8f0] bg-[#f8fafc] px-3 py-2">
      <p className="text-[10px] font-extrabold uppercase tracking-[0.1em] text-slate-500">{label}</p>
      <p className="mt-1 text-[13px] font-semibold text-slate-800">{value}</p>
    </div>
  )
}

function InfoCell({ label, value, fullRow = false }: { label: string; value: string; fullRow?: boolean }) {
  return (
    <div className={`border-b border-r border-[#d8dee8] px-3 py-2 ${fullRow ? 'md:col-span-3' : ''}`}>
      <p className="text-[9px] font-extrabold uppercase tracking-[0.1em] text-slate-500">{label}</p>
      <p className="mt-1 text-[12px] font-semibold text-slate-700">{value}</p>
    </div>
  )
}

function CardSection({ title, children }: { title: string; children: JSX.Element | JSX.Element[] | string }) {
  return (
    <section className="rounded-[3px] border border-[#d8dee8] bg-white p-4 shadow-sm">
      <h3 className={`${pageHeadingStyles.sectionTitle} mb-3 text-[#1f2937]`}>{title}</h3>
      {children}
    </section>
  )
}

function Subsection({ title, children }: { title: string; children: JSX.Element | JSX.Element[] }) {
  return (
    <div className="space-y-2.5">
      <h4 className="text-[10px] font-extrabold uppercase tracking-[0.14em] text-[#334155]">{title}</h4>
      {children}
    </div>
  )
}
