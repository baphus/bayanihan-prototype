import {
  CASE_MANAGER_CASES,
  getCaseManagerAgencies,
  formatAddressParts,
  formatDisplayDate,
  formatDisplayDateTime,
  getCaseNarrativeBySeed,
  getClientPersona,
  getCaseManagerReferrals,
  getAgencyFocalByAgencyId,
  getNextOfKinForClient,
  getReferralCaseByCaseNo,
  getSpecialCategories,
  toCaseHealthStatus,
  type AddressParts,
  type AgencyStep,
  type CaseManagerCase,
  type CaseManagerReferralNote,
  type CaseManagerReferral,
  type CaseOverviewData,
  type CaseTimelineItem,
  type MilestoneInfoRow,
  type MilestoneItem,
  type TrackCasePageData,
  type TrackingAgencyCardData,
  type ReferralStatus,
  type AgencyMilestonePageData,
} from './unifiedData'

export type ReferralMilestoneEntry = {
  id: string
  referralId: string
  title: string
  description: string
  createdAt: string
  actor: string
}

type CaseLifecycleState = {
  cases: CaseManagerCase[]
  referrals: CaseManagerReferral[]
  milestonesByReferralId: Record<string, ReferralMilestoneEntry[]>
}

type StoredLifecycleSnapshot = Partial<CaseLifecycleState>

type TrackingAgencyKey = 'owwa' | 'dmw' | 'tesda'

const TRACKING_AGENCY_META: Record<TrackingAgencyKey, { short: string; path: string; subtitle: string }> = {
  owwa: {
    short: 'OWWA',
    path: '/milestones',
    subtitle: 'Overseas Workers Welfare Administration Processing',
  },
  dmw: {
    short: 'DMW',
    path: '/dmw-milestones',
    subtitle: 'Department of Migrant Workers Processing',
  },
  tesda: {
    short: 'TESDA',
    path: '/tesda-milestones',
    subtitle: 'Technical Education and Skills Development Authority Processing',
  },
}

const TRACKING_AGENCY_ORDER: TrackingAgencyKey[] = ['owwa', 'dmw', 'tesda']

function isTrackingAgencyKey(value: string): value is TrackingAgencyKey {
  return value === 'owwa' || value === 'dmw' || value === 'tesda'
}

function cloneAddress(address: AddressParts): AddressParts {
  return { ...address }
}

function toCaseProfile(caseRecord: CaseManagerCase): {
  narrative: string
  ofw: CaseOverviewData['ofw']
  nextOfKin: CaseOverviewData['nextOfKin']
  workHistory: CaseOverviewData['workHistory']
} {
  const persona = getClientPersona(caseRecord.caseNo)
  const nextOfKin = getNextOfKinForClient(caseRecord.clientName)
  const specialCategories = getSpecialCategories(caseRecord.caseNo)
  const primaryNextOfKinProfile = caseRecord.nextOfKinProfiles?.[0] || caseRecord.nextOfKinProfile
  const hasExplicitNoNextOfKin = Boolean(caseRecord.ofwProfile) && !primaryNextOfKinProfile
  const emptyAddress: AddressParts = {
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

  return {
    narrative: caseRecord.caseNarrative?.trim() || getCaseNarrativeBySeed(caseRecord.caseNo),
    ofw: {
      fullName: caseRecord.ofwProfile?.fullName || caseRecord.clientName,
      dateOfBirth: caseRecord.ofwProfile?.birthDate || persona.ofwBirth.split(' (')[0],
      gender: caseRecord.ofwProfile?.gender || persona.gender,
      homeAddress: formatAddressParts(caseRecord.ofwProfile?.address || persona.ofwAddress),
      homeAddressParts: cloneAddress(caseRecord.ofwProfile?.address || persona.ofwAddress),
      specialCategories: caseRecord.ofwProfile?.specialCategories || specialCategories,
    },
    nextOfKin: {
      fullName: hasExplicitNoNextOfKin ? '-' : primaryNextOfKinProfile?.fullName || nextOfKin.name,
      relationship: hasExplicitNoNextOfKin
        ? '-'
        : primaryNextOfKinProfile?.relationship === 'Other'
          ? (primaryNextOfKinProfile?.relationshipOther?.trim() || 'Other')
          : (primaryNextOfKinProfile?.relationship || '-'),
      contactNumber: hasExplicitNoNextOfKin ? '-' : primaryNextOfKinProfile?.contact || nextOfKin.contact,
      emailAddress: hasExplicitNoNextOfKin ? '-' : primaryNextOfKinProfile?.email || nextOfKin.email,
      homeAddress: formatAddressParts(hasExplicitNoNextOfKin ? emptyAddress : (primaryNextOfKinProfile?.address || nextOfKin.address)),
      homeAddressParts: cloneAddress(hasExplicitNoNextOfKin ? emptyAddress : (primaryNextOfKinProfile?.address || nextOfKin.address)),
      specialCategories: hasExplicitNoNextOfKin
        ? []
        : (primaryNextOfKinProfile?.specialCategories || caseRecord.ofwProfile?.specialCategories || specialCategories),
    },
    workHistory: {
      lastCountry: caseRecord.workHistory?.lastCountry || persona.lastCountry,
      lastPosition: caseRecord.workHistory?.lastJob || persona.lastJob,
      arrivalDate: caseRecord.workHistory?.arrivalDate || persona.arrivalDate,
    },
  }
}

function toTrackingStatusPresentation(status: ReferralStatus): {
  label: string
  statusTone: string
  borderTone: string
  textTone: string
  lineTone: string
  statusContainerTone: string
  statusDotTone: string
  statusTextTone: string
} {
  if (status === 'PROCESSING') {
    return {
      label: 'Processing',
      statusTone: 'bg-blue-100 text-blue-700',
      borderTone: 'border-primary',
      textTone: 'text-primary',
      lineTone: 'bg-primary',
      statusContainerTone: 'bg-blue-100 text-blue-700',
      statusDotTone: 'bg-blue-500',
      statusTextTone: 'text-blue-700',
    }
  }

  if (status === 'COMPLETED') {
    return {
      label: 'Completed',
      statusTone: 'bg-emerald-100 text-emerald-700',
      borderTone: 'border-emerald-400',
      textTone: 'text-emerald-600',
      lineTone: 'bg-emerald-500',
      statusContainerTone: 'bg-emerald-50 text-emerald-700',
      statusDotTone: 'bg-emerald-500',
      statusTextTone: 'text-emerald-700',
    }
  }

  if (status === 'REJECTED') {
    return {
      label: 'Rejected',
      statusTone: 'bg-red-100 text-red-700',
      borderTone: 'border-red-300',
      textTone: 'text-red-600',
      lineTone: 'bg-red-400',
      statusContainerTone: 'bg-red-50 text-red-700',
      statusDotTone: 'bg-red-500',
      statusTextTone: 'text-red-700',
    }
  }

  return {
    label: 'Pending',
    statusTone: 'bg-amber-100 text-amber-700',
    borderTone: 'border-amber-300',
    textTone: 'text-amber-600',
    lineTone: 'bg-amber-400',
    statusContainerTone: 'bg-amber-50 text-amber-700',
    statusDotTone: 'bg-amber-500',
    statusTextTone: 'text-amber-700',
  }
}

function toTrackingSteps(status: ReferralStatus): AgencyStep[] {
  if (status === 'PENDING') {
    return [
      { label: 'Referral Sent', state: 'complete' },
      { label: 'Accepted', state: 'pending' },
      { label: 'Processing', state: 'pending' },
      { label: 'Completed', state: 'pending' },
    ]
  }

  if (status === 'PROCESSING') {
    return [
      { label: 'Referral Sent', state: 'complete' },
      { label: 'Accepted', state: 'complete' },
      { label: 'Processing', state: 'active', icon: 'sync' },
      { label: 'Completed', state: 'pending' },
    ]
  }

  if (status === 'REJECTED') {
    return [
      { label: 'Referral Sent', state: 'complete' },
      { label: 'Accepted', state: 'complete' },
      { label: 'Processing', state: 'complete' },
      { label: 'Completed', state: 'pending' },
    ]
  }

  return [
    { label: 'Referral Sent', state: 'complete' },
    { label: 'Accepted', state: 'complete' },
    { label: 'Processing', state: 'complete' },
    { label: 'Completed', state: 'complete' },
  ]
}

function toAgencyStatusNote(status: ReferralStatus): string {
  if (status === 'PROCESSING') {
    return 'Your request is currently being processed by the agency.'
  }

  if (status === 'COMPLETED') {
    return 'Agency processing is complete for this referral.'
  }

  if (status === 'REJECTED') {
    return 'Agency reviewed the referral and marked it as rejected.'
  }

  return 'Referral was sent and is awaiting agency acceptance.'
}

function toLatestMilestoneLabel(status: ReferralStatus): string {
  if (status === 'PROCESSING') {
    return 'Agency processing underway.'
  }

  if (status === 'COMPLETED') {
    return 'Agency marked referral completed.'
  }

  if (status === 'REJECTED') {
    return 'Agency marked referral rejected.'
  }

  return 'Pending agency acceptance.'
}

function getTrackingAgencyPath(agencyId: string): string | undefined {
  if (!isTrackingAgencyKey(agencyId)) {
    return undefined
  }

  return TRACKING_AGENCY_META[agencyId].path
}

function getAgencyLogoUrl(agencyId?: string): string {
  if (!agencyId) {
    return '/logo.png'
  }

  const agency = getCaseManagerAgencies().find((item) => item.id === agencyId)
  return agency?.logoUrl ?? '/logo.png'
}

function formatDurationDays(startIso: string, endIso: string): string {
  const start = new Date(startIso).getTime()
  const end = new Date(endIso).getTime()
  const diff = Math.max(0, end - start)
  const days = Math.max(1, Math.ceil(diff / (1000 * 60 * 60 * 24)))
  return `${days} Day${days > 1 ? 's' : ''}`
}

function addMinutesIso(iso: string, minutes: number): string {
  return new Date(new Date(iso).getTime() + minutes * 60000).toISOString()
}

function buildCaseTimelineForManagedCase(caseRecord: CaseManagerCase, referrals: CaseManagerReferral[]): CaseTimelineItem[] {
  type SortableTimelineEntry = CaseTimelineItem & { sortAt: string }

  const entries: SortableTimelineEntry[] = [
    {
      date: formatDisplayDateTime(caseRecord.createdAt),
      agency: 'Bayanihan',
      title: 'Case Created',
      detail: 'Case record was created in the Bayanihan portal.',
      icon: 'add_circle',
      logoUrl: '/logo.png',
      sortAt: caseRecord.createdAt,
    },
  ]

  referrals.forEach((referral) => {
    // Always add "Referral Sent" entry first
    entries.push({
      date: formatDisplayDateTime(referral.createdAt),
      agency: referral.agencyName,
      title: 'Referral Sent',
      detail: `Case was endorsed to ${referral.agencyName} for ${referral.service}.`,
      icon: 'send',
      logoUrl: getAgencyLogoUrl(referral.agencyId),
      sortAt: referral.createdAt,
    })

    if (referral.status === 'PENDING') {
      return
    }

    const milestoneEntries = getManagedReferralMilestones(referral.id)
      .slice()
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())

    const acceptedIso = milestoneEntries[0]?.createdAt
      ? addMinutesIso(milestoneEntries[0].createdAt, -1)
      : addMinutesIso(referral.createdAt, 15)

    entries.push({
      date: formatDisplayDateTime(acceptedIso),
      agency: referral.agencyName,
      title: 'Referral Accepted',
      detail: 'Agency accepted the referral and started processing.',
      icon: 'check_circle',
      logoUrl: getAgencyLogoUrl(referral.agencyId),
      sortAt: acceptedIso,
    })

    // Real milestones should appear between Referral Accepted and terminal referral state.
    milestoneEntries.forEach((entry) => {
      entries.push({
        date: formatDisplayDateTime(entry.createdAt),
        agency: referral.agencyName,
        title: entry.title,
        detail: entry.description,
        icon: entry.title.toLowerCase().includes('completed') ? 'check_circle' : entry.title.toLowerCase().includes('reject') ? 'cancel' : 'sync',
        logoUrl: getAgencyLogoUrl(referral.agencyId),
        sortAt: entry.createdAt,
      })
    })

    if (referral.status === 'COMPLETED') {
      entries.push({
        date: formatDisplayDateTime(referral.updatedAt),
        agency: referral.agencyName,
        title: 'Referral Completed',
        detail: 'Agency marked this referral as completed.',
        icon: 'check_circle',
        logoUrl: getAgencyLogoUrl(referral.agencyId),
        sortAt: referral.updatedAt,
      })
      return
    }

    if (referral.status === 'REJECTED') {
      entries.push({
        date: formatDisplayDateTime(referral.updatedAt),
        agency: referral.agencyName,
        title: 'Referral Rejected',
        detail: 'Agency rejected the referral and returned it for follow-up.',
        icon: 'cancel',
        logoUrl: getAgencyLogoUrl(referral.agencyId),
        sortAt: referral.updatedAt,
      })
    }
  })

  if (toCaseHealthStatus(caseRecord.status) === 'CLOSED') {
    const latestReferralUpdate = referrals.reduce((latest, referral) => {
      return new Date(referral.updatedAt).getTime() > new Date(latest).getTime() ? referral.updatedAt : latest
    }, caseRecord.createdAt)

    const closedAt = new Date(caseRecord.updatedAt).getTime() >= new Date(latestReferralUpdate).getTime()
      ? caseRecord.updatedAt
      : addMinutesIso(latestReferralUpdate, 1)

    entries.push({
      date: formatDisplayDateTime(closedAt),
      agency: 'Bayanihan',
      title: 'Case Closed by Case Manager',
      detail: 'Case Manager closed this case after referral processing was completed.',
      icon: 'inventory',
      logoUrl: '/logo.png',
      sortAt: closedAt,
    })
  }

  return entries
    .sort((a, b) => new Date(a.sortAt).getTime() - new Date(b.sortAt).getTime())
    .map(({ sortAt: _sortAt, ...entry }) => entry)
}

function buildTrackingAgenciesForManagedCase(referrals: CaseManagerReferral[]): TrackingAgencyCardData[] {
  return referrals.map((referral) => {
    const presentation = toTrackingStatusPresentation(referral.status)
    const isTrackingAgency = isTrackingAgencyKey(referral.agencyId)
    const meta = isTrackingAgency ? TRACKING_AGENCY_META[referral.agencyId] : undefined

    return {
      name: meta?.short ?? referral.agencyName,
      note: toAgencyStatusNote(referral.status),
      status: presentation.label,
      statusTone: presentation.statusTone,
      borderTone: presentation.borderTone,
      textTone: presentation.textTone,
      lineTone: presentation.lineTone,
      latestMilestoneLabel: toLatestMilestoneLabel(referral.status),
      latestMilestonePath: meta?.path,
      steps: toTrackingSteps(referral.status),
    }
  })
}

function buildMilestoneInfoRows(caseRecord: CaseManagerCase): MilestoneInfoRow[] {
  return [
    { label: 'Tracking ID', value: caseRecord.caseNo },
    { label: 'Date Referred', value: formatDisplayDate(caseRecord.createdAt) },
    { label: 'Referral Duration', value: formatDurationDays(caseRecord.createdAt, caseRecord.updatedAt) },
    { label: 'Client Type', value: caseRecord.clientType === 'Overseas Filipino Worker' ? 'OFW' : 'Next of Kin' },
    { label: 'Province', value: caseRecord.ofwProfile?.address.provinceName || getClientPersona(caseRecord.caseNo).ofwAddress.provinceName },
  ]
}

function buildMilestonesForManagedReferral(referral: CaseManagerReferral): MilestoneItem[] {
  const milestoneEntries = getManagedReferralMilestones(referral.id)

  return milestoneEntries
    .slice()
    .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
    .map((entry, index, array) => {
      const isLatest = index === array.length - 1
      return {
        title: entry.title.toUpperCase(),
        titleTone: isLatest ? 'text-primary' : 'text-on-surface-variant',
        time: formatDisplayDateTime(entry.createdAt).toUpperCase(),
        detail: entry.description,
        dotTone: isLatest ? 'bg-primary ring-[#d2e4f6]' : 'bg-primary ring-surface-container-lowest',
      }
    })
}

function getManagedCaseByCaseNo(caseNo: string): CaseManagerCase | undefined {
  return getManagedCases().find((item) => item.caseNo.toLowerCase() === caseNo.toLowerCase())
}

function getTrackingCaseRecord(trackingId: string): CaseManagerCase | undefined {
  return getManagedCaseByCaseNo(trackingId) ?? getReferralCaseByCaseNo(trackingId)
}

export function getManagedTrackCasePageData(trackingId: string): TrackCasePageData | null {
  const trackedCase = getTrackingCaseRecord(trackingId)

  if (!trackedCase) {
    return null
  }

  const managedCase = trackedCase as CaseManagerCase
  const referrals = getManagedReferralsByCaseId(managedCase.id)

  return {
    trackingId: managedCase.caseNo,
    trackedCase: managedCase,
    caseOverview: toCaseProfile(managedCase),
    caseTimeline: buildCaseTimelineForManagedCase(managedCase, referrals),
    trackingAgencies: buildTrackingAgenciesForManagedCase(referrals),
  }
}

export function getManagedAgencyMilestonePageData(agency: TrackingAgencyKey, trackingId: string): AgencyMilestonePageData | null {
  const caseRecord = getTrackingCaseRecord(trackingId)

  if (!caseRecord) {
    return null
  }

  const managedCase = caseRecord as CaseManagerCase
  const referral = getManagedReferralsByCaseId(managedCase.id).find((item) => item.agencyId === agency)

  if (!referral) {
    return null
  }

  const presentation = toTrackingStatusPresentation(referral.status)
  const agencyMeta = TRACKING_AGENCY_META[agency]

  return {
    breadcrumbLabel: `${agencyMeta.short} MILESTONES`,
    title: `MILESTONE DETAILS: ${agencyMeta.short}`,
    subtitle: agencyMeta.subtitle,
    statusLabel: presentation.label.toUpperCase(),
    statusContainerTone: presentation.statusContainerTone,
    statusDotTone: presentation.statusDotTone,
    statusTextTone: presentation.statusTextTone,
    locationName: referral.agencyName,
    locationSubtitle: 'Managed referral milestone history',
    locationContact: getCaseManagerAgencies().find((item) => item.id === agency)?.contact ?? managedCase.agencyId,
    milestones: buildMilestonesForManagedReferral(referral),
    infoRows: buildMilestoneInfoRows(managedCase),
  }
}

const STORAGE_KEY = 'bayanihan.caseLifecycle.v1'

function cloneState(state: CaseLifecycleState): CaseLifecycleState {
  return {
    cases: state.cases.map((item) => ({ ...item })),
    referrals: state.referrals.map((item) => ({
      ...item,
      documents: (item.documents ?? []).map((doc) => ({ ...doc })),
    })),
    milestonesByReferralId: Object.fromEntries(
      Object.entries(state.milestonesByReferralId).map(([key, entries]) => [
        key,
        entries.map((entry) => ({ ...entry })),
      ]),
    ),
  }
}

function buildInitialState(): CaseLifecycleState {
  const seedReferrals = getCaseManagerReferrals()

  // All referrals start with no milestones
  // Milestones are only created when Agency Focal explicitly adds them via addManagedReferralMilestone()
  const allReferralMilestones = Object.fromEntries(seedReferrals.map((item) => [item.id, []]))

  const seeded: CaseLifecycleState = {
    cases: CASE_MANAGER_CASES.map((item) => ({ ...item })),
    referrals: seedReferrals.map((item) => ({ ...item, documents: item.documents.map((doc) => ({ ...doc })) })),
    milestonesByReferralId: allReferralMilestones,
  }

  return ensureOwwaSupplementalVolume(seeded)
}

function ensureOwwaSupplementalVolume(state: CaseLifecycleState): CaseLifecycleState {
  const markerCasePrefix = 'MB-OWWA-2026-'
  const markerReferralPrefix = 'ref-MB-OWWA-2026-'

  const alreadySeeded = state.cases.some((item) => item.id.startsWith(markerCasePrefix))
  if (alreadySeeded) {
    return state
  }

  const owwaAgency = getCaseManagerAgencies().find((item) => item.id === 'owwa')
  if (!owwaAgency) {
    return state
  }

  const services = owwaAgency.services
  const fallbackService = services[0] ?? 'OWWA Assistance'

  const supplementalCases: CaseManagerCase[] = [
    {
      id: 'MB-OWWA-2026-1001',
      caseNo: 'OW-A1N7K9P',
      clientName: 'Alvarez, Danilo R.',
      clientType: 'Overseas Filipino Worker',
      service: services[0] ?? fallbackService,
      milestone: 'Case Intake',
      status: 'PROCESSING',
      createdAt: '2026-04-02T08:14:00',
      updatedAt: '2026-04-06T13:25:00',
      agencyId: owwaAgency.id,
      agencyShort: owwaAgency.short,
      agencyName: owwaAgency.name,
    },
    {
      id: 'MB-OWWA-2026-1002',
      caseNo: 'OW-B3Q5D7R',
      clientName: 'Benitez, Arlene S.',
      clientType: 'Next of Kin',
      service: services[1] ?? fallbackService,
      milestone: 'Verification',
      status: 'PENDING',
      createdAt: '2026-04-03T09:42:00',
      updatedAt: '2026-04-04T11:18:00',
      agencyId: owwaAgency.id,
      agencyShort: owwaAgency.short,
      agencyName: owwaAgency.name,
    },
    {
      id: 'MB-OWWA-2026-1003',
      caseNo: 'OW-C9T2M4L',
      clientName: 'Cabrera, Joel T.',
      clientType: 'Overseas Filipino Worker',
      service: services[2] ?? fallbackService,
      milestone: 'Document Review',
      status: 'COMPLETED',
      createdAt: '2026-04-01T10:05:00',
      updatedAt: '2026-04-09T16:30:00',
      agencyId: owwaAgency.id,
      agencyShort: owwaAgency.short,
      agencyName: owwaAgency.name,
    },
    {
      id: 'MB-OWWA-2026-1004',
      caseNo: 'OW-D6V8H1N',
      clientName: 'Domingo, Kristine P.',
      clientType: 'Overseas Filipino Worker',
      service: services[0] ?? fallbackService,
      milestone: 'Agency Coordination',
      status: 'PROCESSING',
      createdAt: '2026-04-05T08:55:00',
      updatedAt: '2026-04-10T12:47:00',
      agencyId: owwaAgency.id,
      agencyShort: owwaAgency.short,
      agencyName: owwaAgency.name,
    },
    {
      id: 'MB-OWWA-2026-1005',
      caseNo: 'OW-E4P9S3X',
      clientName: 'Escobar, Maria L.',
      clientType: 'Next of Kin',
      service: services[1] ?? fallbackService,
      milestone: 'Case Intake',
      status: 'PENDING',
      createdAt: '2026-04-07T14:18:00',
      updatedAt: '2026-04-08T09:39:00',
      agencyId: owwaAgency.id,
      agencyShort: owwaAgency.short,
      agencyName: owwaAgency.name,
    },
    {
      id: 'MB-OWWA-2026-1006',
      caseNo: 'OW-F7K1W5Y',
      clientName: 'Ferrer, Noel A.',
      clientType: 'Overseas Filipino Worker',
      service: services[2] ?? fallbackService,
      milestone: 'Validation',
      status: 'COMPLETED',
      createdAt: '2026-04-06T11:23:00',
      updatedAt: '2026-04-12T15:05:00',
      agencyId: owwaAgency.id,
      agencyShort: owwaAgency.short,
      agencyName: owwaAgency.name,
    },
    {
      id: 'MB-OWWA-2026-1007',
      caseNo: 'OW-G2R6C8U',
      clientName: 'Guerrero, Sheila M.',
      clientType: 'Overseas Filipino Worker',
      service: services[0] ?? fallbackService,
      milestone: 'Eligibility Check',
      status: 'PROCESSING',
      createdAt: '2026-04-08T07:40:00',
      updatedAt: '2026-04-13T10:32:00',
      agencyId: owwaAgency.id,
      agencyShort: owwaAgency.short,
      agencyName: owwaAgency.name,
    },
    {
      id: 'MB-OWWA-2026-1008',
      caseNo: 'OW-H5L3Z9B',
      clientName: 'Hernando, Patrick J.',
      clientType: 'Next of Kin',
      service: services[1] ?? fallbackService,
      milestone: 'Document Intake',
      status: 'PENDING',
      createdAt: '2026-04-09T09:12:00',
      updatedAt: '2026-04-10T14:20:00',
      agencyId: owwaAgency.id,
      agencyShort: owwaAgency.short,
      agencyName: owwaAgency.name,
    },
  ]

  const supplementalReferrals: CaseManagerReferral[] = supplementalCases.flatMap((caseItem, index) => {
    const primaryReferral: CaseManagerReferral = {
      id: `${markerReferralPrefix}${index + 1}`,
      caseId: caseItem.id,
      caseNo: caseItem.caseNo,
      clientName: caseItem.clientName,
      service: caseItem.service,
      agencyId: owwaAgency.id,
      agencyName: owwaAgency.name,
      status: caseItem.status,
      createdAt: caseItem.createdAt,
      updatedAt: caseItem.updatedAt,
      remarks: 'Supplemental OWWA referral generated for reporting volume.',
      notes: 'Synthetic referral entry to simulate OWWA-heavy workload.',
      documents: [
        {
          id: `doc-${caseItem.id}-1`,
          name: `Referral_Endorsement_${caseItem.caseNo}.pdf`,
          uploadedBy: 'Case Manager - Marychris M. Relon',
          uploadedAt: caseItem.createdAt,
        },
      ],
    }

    const shouldAddFollowUpReferral = index % 2 === 0
    if (!shouldAddFollowUpReferral) {
      return [primaryReferral]
    }

    const followUpCreatedAt = new Date(new Date(caseItem.createdAt).getTime() + 1000 * 60 * 90).toISOString()
    const followUpUpdatedAt = new Date(new Date(caseItem.updatedAt).getTime() + 1000 * 60 * 180).toISOString()
    const followUpReferral: CaseManagerReferral = {
      ...primaryReferral,
      id: `${markerReferralPrefix}${index + 1}-FU`,
      service: services[(index + 1) % Math.max(services.length, 1)] ?? fallbackService,
      createdAt: followUpCreatedAt,
      updatedAt: followUpUpdatedAt,
      status: primaryReferral.status === 'PENDING' ? 'PROCESSING' : primaryReferral.status,
      remarks: 'Follow-up referral for the same OWWA-managed case.',
      notes: 'Additional OWWA handling stage for volume simulation.',
    }

    return [primaryReferral, followUpReferral]
  })

  const existingCaseIds = new Set(state.cases.map((item) => item.id))
  const existingReferralIds = new Set(state.referrals.map((item) => item.id))

  const nextCases = [...state.cases]
  supplementalCases.forEach((item) => {
    if (!existingCaseIds.has(item.id)) {
      nextCases.push(item)
    }
  })

  const nextReferrals = [...state.referrals]
  supplementalReferrals.forEach((item) => {
    if (!existingReferralIds.has(item.id)) {
      nextReferrals.push(item)
    }
  })

  const nextMilestones = { ...state.milestonesByReferralId }
  supplementalReferrals.forEach((item) => {
    if (!nextMilestones[item.id]) {
      nextMilestones[item.id] = []
    }
  })

  return {
    ...state,
    cases: nextCases,
    referrals: nextReferrals,
    milestonesByReferralId: nextMilestones,
  }
}

/**
 * Cleans up invalid milestone entries - removes:
 * 1. All milestones from PENDING referrals
 * 2. System-generated "Referral Intake Started" milestones (old code artifact)
 * 3. "Referral Sent" milestones (should never be a milestone, only an initial event)
 * Only Agency Focal should create meaningful milestones for progress updates
 */
function cleanupInvalidMilestones(state: CaseLifecycleState): CaseLifecycleState {
  const referralsByStatus = Object.fromEntries(state.referrals.map((r) => [r.id, r.status]))

  const cleanedMilestones = Object.fromEntries(
    Object.entries(state.milestonesByReferralId).map(([referralId, milestones]) => {
      // If referral is PENDING, it should have no milestones
      if (referralsByStatus[referralId] === 'PENDING') {
        return [referralId, []]
      }

      // Remove invalid auto-generated milestones
      const filtered = milestones.filter((m) => {
        const normalizedTitle = m.title.trim().toLowerCase().replace(/\"/g, '')

        // Remove system-generated "Referral Intake Started" milestones
        if (m.actor === 'System' && m.title === 'Referral Intake Started') {
          return false
        }
        // Remove any "Referral Sent" variant - this is an initial event, not a milestone
        if (normalizedTitle === 'referral sent') {
          return false
        }
        return true
      })

      return [referralId, filtered]
    }),
  )

  return {
    ...state,
    milestonesByReferralId: cleanedMilestones,
  }
}

function readState(): CaseLifecycleState {
  if (typeof window === 'undefined') {
    return buildInitialState()
  }

  const raw = window.localStorage.getItem(STORAGE_KEY)
  if (!raw) {
    const seed = buildInitialState()
    writeState(seed)
    return seed
  }

  try {
    const parsed = JSON.parse(raw) as CaseLifecycleState
    if (!parsed || !Array.isArray(parsed.cases) || !Array.isArray(parsed.referrals) || !parsed.milestonesByReferralId) {
      throw new Error('Invalid lifecycle state')
    }
    // Clean up and persist invalid milestone removals so stale entries don't resurface.
    const cleaned = cleanupInvalidMilestones(parsed)
    const supplemented = ensureOwwaSupplementalVolume(cleaned)
    if (JSON.stringify(supplemented) !== JSON.stringify(parsed)) {
      writeState(supplemented)
    }
    return supplemented
  } catch {
    const seed = buildInitialState()
    writeState(seed)
    return seed
  }
}

function writeState(state: CaseLifecycleState): void {
  if (typeof window === 'undefined') {
    return
  }

  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
}

function updateState(updater: (state: CaseLifecycleState) => CaseLifecycleState): CaseLifecycleState {
  const current = readState()
  const next = updater(cloneState(current))
  writeState(next)
  return cloneState(next)
}

export function getManagedCases(): CaseManagerCase[] {
  return cloneState(readState()).cases
}

export function getManagedCasesForOfwEmail(email: string): CaseManagerCase[] {
  const normalizedEmail = email.trim().toLowerCase()
  if (!normalizedEmail) {
    return []
  }

  return getManagedCases().filter((item) => {
    const ownerEmail = (item.ofwUserEmail || item.ofwProfile?.email || getClientPersona(item.caseNo).ofwEmail).trim().toLowerCase()
    return ownerEmail === normalizedEmail
  })
}

export function getManagedCaseById(caseId: string): CaseManagerCase | undefined {
  return getManagedCases().find((item) => item.id === caseId)
}

export function createManagedCase(caseInput: CaseManagerCase): CaseManagerCase {
  const next = updateState((state) => ({
    ...state,
    cases: [caseInput, ...state.cases],
  }))

  return next.cases[0]
}

export function updateManagedCase(caseId: string, updater: (current: CaseManagerCase) => CaseManagerCase): CaseManagerCase | null {
  let updatedCase: CaseManagerCase | null = null

  updateState((state) => {
    const nextCases = state.cases.map((item) => {
      if (item.id !== caseId) {
        return item
      }

      updatedCase = updater(item)
      return updatedCase
    })

    return {
      ...state,
      cases: nextCases,
    }
  })

  return updatedCase
}

export function updateManagedCaseOpenClosed(caseId: string, healthStatus: 'OPEN' | 'CLOSED'): CaseManagerCase | null {
  return updateManagedCase(caseId, (current) => ({
    ...current,
    status: healthStatus === 'CLOSED' ? 'COMPLETED' : 'PROCESSING',
    updatedAt: new Date().toISOString(),
  }))
}

export function getManagedReferrals(): CaseManagerReferral[] {
  return cloneState(readState()).referrals
}

export function getManagedReferralById(referralId: string): CaseManagerReferral | undefined {
  return getManagedReferrals().find((item) => item.id === referralId)
}

export function getManagedReferralsByCaseId(caseId: string): CaseManagerReferral[] {
  return getManagedReferrals().filter((item) => item.caseId === caseId)
}

export function createManagedReferral(referralInput: CaseManagerReferral): CaseManagerReferral {
  const linkedCase = getManagedCaseById(referralInput.caseId)
  if (!linkedCase) {
    throw new Error('Unable to create referral. The linked case no longer exists.')
  }

  if (toCaseHealthStatus(linkedCase.status) === 'CLOSED') {
    throw new Error('Unable to create referral. This case is already closed.')
  }

  const nowIso = new Date().toISOString()

  const next = updateState((state) => ({
    ...state,
    referrals: [referralInput, ...state.referrals],
    milestonesByReferralId: {
      ...state.milestonesByReferralId,
      // New referrals start in PENDING status, so no milestones are created yet
      // Milestones only exist AFTER the referral is accepted (status changes from PENDING)
      [referralInput.id]: [],
    },
  }))

  return next.referrals[0]
}

export function updateManagedReferral(referralId: string, updater: (current: CaseManagerReferral) => CaseManagerReferral): CaseManagerReferral | null {
  let updatedReferral: CaseManagerReferral | null = null

  updateState((state) => {
    const nextReferrals = state.referrals.map((item) => {
      if (item.id !== referralId) {
        return item
      }

      updatedReferral = updater(item)
      return updatedReferral
    })

    return {
      ...state,
      referrals: nextReferrals,
    }
  })

  return updatedReferral
}

export function updateManagedReferralStatus(referralId: string, status: ReferralStatus, remark: string): CaseManagerReferral | null {
  const nowIso = new Date().toISOString()

  const updated = updateManagedReferral(referralId, (current) => ({
    ...current,
    status,
    updatedAt: nowIso,
    remarks: remark.trim() || current.remarks,
    notes: remark.trim() || current.notes,
  }))

  // Status updates are tracked in the referral's updatedAt timestamp and notes/remarks
  // They don't create automatic milestones - only Agency Focal can add milestones via addManagedReferralMilestone()
  return updated
}

export function appendManagedReferralNote(referralId: string, noteContent: string, actor: string, timestamp?: string): CaseManagerReferral | null {
  const trimmedContent = noteContent.trim()
  if (!trimmedContent) {
    return null
  }

  const nowIso = timestamp ?? new Date().toISOString()
  const entry: CaseManagerReferralNote = {
    id: `note-${referralId}-${Date.now()}`,
    content: trimmedContent,
    createdAt: nowIso,
    createdBy: actor,
  }

  return updateManagedReferral(referralId, (current) => ({
    ...current,
    notes: trimmedContent,
    updatedAt: nowIso,
    noteHistory: [...(current.noteHistory ?? []), entry],
  }))
}

export function addManagedReferralMilestone(referralId: string, title: string, description: string): ReferralMilestoneEntry | null {
  const referral = getManagedReferralById(referralId)
  if (!referral) {
    return null
  }

  const agencyFocal = getAgencyFocalByAgencyId(referral.agencyId)

  const nowIso = new Date().toISOString()
  const entry: ReferralMilestoneEntry = {
    id: `milestone-${referralId}-${Date.now()}`,
    referralId,
    title: title.trim(),
    description: description.trim(),
    createdAt: nowIso,
    actor: `Agency Focal - ${agencyFocal.name}`,
  }

  updateState((state) => ({
    ...state,
    referrals: state.referrals.map((item) => {
      if (item.id !== referralId) {
        return item
      }

      return {
        ...item,
        updatedAt: nowIso,
      }
    }),
    milestonesByReferralId: {
      ...state.milestonesByReferralId,
      [referralId]: [...(state.milestonesByReferralId[referralId] ?? []), entry],
    },
  }))

  return entry
}

export function getManagedReferralMilestones(referralId: string): ReferralMilestoneEntry[] {
  const state = readState()
  return (state.milestonesByReferralId[referralId] ?? []).map((item) => ({ ...item }))
}

export function getManagedLatestMilestone(referralId: string, fallback = 'Referral Sent'): string {
  const milestones = getManagedReferralMilestones(referralId)
  return milestones[milestones.length - 1]?.title ?? fallback
}

export function getManagedLatestUpdate(referralId: string): string {
  const referral = getManagedReferralById(referralId)
  if (!referral) {
    return 'Unknown'
  }

  const milestones = getManagedReferralMilestones(referralId)

  // If there are milestones, return the latest one
  if (milestones.length > 0) {
    return milestones[milestones.length - 1].title
  }

  // Otherwise, return the referral status
  if (referral.status === 'PROCESSING') {
    return 'Referral Accepted'
  }
  if (referral.status === 'COMPLETED') {
    return 'Referral Completed'
  }
  if (referral.status === 'REJECTED') {
    return 'Referral Rejected'
  }

  return 'Referral Sent'
}

export function getManagedCaseStatus(caseId: string): 'OPEN' | 'CLOSED' {
  const caseRow = getManagedCaseById(caseId)
  if (!caseRow) {
    return 'OPEN'
  }

  return toCaseHealthStatus(caseRow.status)
}
