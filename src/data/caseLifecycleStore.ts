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
      fullName: caseRecord.nextOfKinProfile?.fullName || nextOfKin.name,
      contactNumber: caseRecord.nextOfKinProfile?.contact || nextOfKin.contact,
      emailAddress: caseRecord.nextOfKinProfile?.email || nextOfKin.email,
      homeAddress: formatAddressParts(caseRecord.nextOfKinProfile?.address || nextOfKin.address),
      homeAddressParts: cloneAddress(caseRecord.nextOfKinProfile?.address || nextOfKin.address),
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

function buildCaseTimelineForManagedCase(caseRecord: CaseManagerCase, referrals: CaseManagerReferral[]): CaseTimelineItem[] {
  const entries: CaseTimelineItem[] = [
    {
      date: formatDisplayDateTime(caseRecord.createdAt),
      agency: 'Bayanihan',
      title: 'Case Created',
      detail: 'Case record was created in the Bayanihan portal.',
      icon: 'add_circle',
      logoUrl: '/logo.png',
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
    })

    // Then add any milestones if the referral has been accepted
    const milestoneEntries = getManagedReferralMilestones(referral.id)
    milestoneEntries.forEach((entry) => {
      entries.push({
        date: formatDisplayDateTime(entry.createdAt),
        agency: referral.agencyName,
        title: entry.title,
        detail: entry.description,
        icon: entry.title.toLowerCase().includes('completed') ? 'check_circle' : entry.title.toLowerCase().includes('reject') ? 'cancel' : 'sync',
        logoUrl: getAgencyLogoUrl(referral.agencyId),
      })
    })
  })

  return entries.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
}

function buildTrackingAgenciesForManagedCase(referrals: CaseManagerReferral[]): TrackingAgencyCardData[] {
  return referrals
    .filter((referral) => isTrackingAgencyKey(referral.agencyId))
    .map((referral) => {
      const presentation = toTrackingStatusPresentation(referral.status)
      const meta = TRACKING_AGENCY_META[referral.agencyId]

      return {
        name: meta.short,
        note: toAgencyStatusNote(referral.status),
        status: presentation.label,
        statusTone: presentation.statusTone,
        borderTone: presentation.borderTone,
        textTone: presentation.textTone,
        lineTone: presentation.lineTone,
        latestMilestoneLabel: toLatestMilestoneLabel(referral.status),
        latestMilestonePath: meta.path,
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

  return {
    cases: CASE_MANAGER_CASES.map((item) => ({ ...item })),
    referrals: seedReferrals.map((item) => ({ ...item, documents: item.documents.map((doc) => ({ ...doc })) })),
    milestonesByReferralId: allReferralMilestones,
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
    if (JSON.stringify(cleaned) !== JSON.stringify(parsed)) {
      writeState(cleaned)
    }
    return cleaned
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
