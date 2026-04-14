import { AGENCIES_DATA } from './agenciesData'

export function getGoogleMapsEmbedUrl(locationQuery: string): string {
  return `https://www.google.com/maps?q=${encodeURIComponent(locationQuery)}&output=embed`
}

export function getGoogleMapsPlaceUrl(locationQuery: string): string {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(locationQuery)}`
}

export type ReferralStatus = 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'REJECTED'
export type ClientType = 'Next of Kin' | 'Overseas Filipino Worker'
export type ReferralActorRole = 'Agency Focal' | 'Case Manager' | 'System'
export type MockUserRole = 'System Admin' | 'Case Manager' | 'Agency'

export type MockAuthUser = {
  email: string
  password: string
  role: MockUserRole
  name: string
}

export const MOCK_AUTH_USERS: MockAuthUser[] = [
  {
    email: 'admin@example.com',
    password: 'password123',
    role: 'System Admin',
    name: 'System Administrator',
  },
  {
    email: 'manager@example.com',
    password: 'password123',
    role: 'Case Manager',
    name: 'Marychris M. Relon',
  },
  {
    email: 'agency@example.com',
    password: 'password123',
    role: 'Agency',
    name: 'Josephus Kim L. Sarsonas',
  },
]

export type ReferralActor = {
  id: string
  name: string
  role: ReferralActorRole
}

export type SharedReferralCase = {
  id: string
  caseNo: string
  clientName: string
  clientType: ClientType
  service: string
  milestone: string
  status: ReferralStatus
  createdAt: string
  updatedAt: string
}

export const REFERRAL_CASES: SharedReferralCase[] = [
  { id: 'MB-2024-8812', caseNo: 'OW-A7K2M9Q', clientName: 'Mariano, Ricardo J.', clientType: 'Overseas Filipino Worker', service: 'Repatriation Services', milestone: 'Verification', status: 'PENDING', createdAt: '2026-03-18T09:14:23', updatedAt: '2026-03-20T16:42:51' },
  { id: 'MB-2024-7751', caseNo: 'OW-P4T8X1L', clientName: 'Dela Cruz, Elena S.', clientType: 'Next of Kin', service: 'Legal Assistance', milestone: 'Case Intake', status: 'PROCESSING', createdAt: '2026-03-14T08:03:17', updatedAt: '2026-03-22T13:11:38' },
  { id: 'MB-2024-5521', caseNo: 'OW-Z9D3R6N', clientName: 'Panganiban, Arturo', clientType: 'Overseas Filipino Worker', service: 'Medical Assistance', milestone: 'Release of Aid', status: 'COMPLETED', createdAt: '2026-03-09T11:27:40', updatedAt: '2026-03-27T17:29:05' },
  { id: 'MB-2024-4409', caseNo: 'OW-H2V7Q5B', clientName: 'Santos, Maria Clara', clientType: 'Overseas Filipino Worker', service: 'Financial Relief', milestone: 'Eligibility Check', status: 'PENDING', createdAt: '2026-03-21T10:55:13', updatedAt: '2026-03-23T14:08:44' },
  { id: 'MB-2024-4410', caseNo: 'OW-M8J1C4Y', clientName: 'Reyes, Juan L.', clientType: 'Next of Kin', service: 'Livelihood Support', milestone: 'Training Match', status: 'PROCESSING', createdAt: '2026-03-12T07:49:59', updatedAt: '2026-03-19T12:33:21' },
  { id: 'MB-2024-4411', caseNo: 'OW-R3W9L2F', clientName: 'Garcia, Ramon P.', clientType: 'Overseas Filipino Worker', service: 'Reintegration Seminar', milestone: 'Orientation', status: 'COMPLETED', createdAt: '2026-03-08T15:19:06', updatedAt: '2026-03-15T18:02:47' },
  { id: 'MB-2024-4412', caseNo: 'OW-K6N4T8P', clientName: 'Flores, Anita M.', clientType: 'Overseas Filipino Worker', service: 'Medical Assistance', milestone: 'Document Review', status: 'PENDING', createdAt: '2026-03-24T09:22:35', updatedAt: '2026-03-25T11:44:09' },
  { id: 'MB-2024-4413', caseNo: 'OW-X1B7G3D', clientName: 'Bautista, Luis H.', clientType: 'Overseas Filipino Worker', service: 'Repatriation Services', milestone: 'Coordination', status: 'PENDING', createdAt: '2026-03-26T13:16:11', updatedAt: '2026-03-28T16:07:58' },
  { id: 'MB-2024-4414', caseNo: 'OW-Q5S2H9M', clientName: 'Cruz, Teresa D.', clientType: 'Next of Kin', service: 'Legal Assistance', milestone: 'Case Intake', status: 'PROCESSING', createdAt: '2026-03-11T08:37:26', updatedAt: '2026-03-18T10:53:12' },
  { id: 'MB-2024-4415', caseNo: 'OW-L8F4V1R', clientName: 'Torres, Mark A.', clientType: 'Overseas Filipino Worker', service: 'Financial Relief', milestone: 'Disbursement', status: 'COMPLETED', createdAt: '2026-03-10T14:40:02', updatedAt: '2026-03-29T19:26:30' },
  { id: 'MB-2024-4416', caseNo: 'OW-T3Y6K2C', clientName: 'Gomez, Sarah R.', clientType: 'Overseas Filipino Worker', service: 'Livelihood Support', milestone: 'Eligibility Check', status: 'PENDING', createdAt: '2026-03-25T09:58:41', updatedAt: '2026-03-26T12:15:22' },
  { id: 'MB-2024-4417', caseNo: 'OW-N7P1Z8W', clientName: 'Lopez, Ferdinand E.', clientType: 'Next of Kin', service: 'Medical Assistance', milestone: 'Hospital Endorsement', status: 'PROCESSING', createdAt: '2026-03-13T11:04:54', updatedAt: '2026-03-21T15:30:49' },
  { id: 'MB-2024-4418', caseNo: 'OW-C4R9M5J', clientName: 'Castro, Lourdes V.', clientType: 'Overseas Filipino Worker', service: 'Repatriation Services', milestone: 'Verification', status: 'PENDING', createdAt: '2026-03-22T07:46:28', updatedAt: '2026-03-24T10:21:37' },
  { id: 'MB-2024-4419', caseNo: 'OW-G2D8X6L', clientName: 'Villanueva, Paolo J.', clientType: 'Overseas Filipino Worker', service: 'Reintegration Seminar', milestone: 'Attendance Complete', status: 'COMPLETED', createdAt: '2026-03-07T16:12:09', updatedAt: '2026-03-16T18:48:15' },
  { id: 'MB-2024-4420', caseNo: 'OW-B9H3Q7T', clientName: 'Mendoza, Carmen L.', clientType: 'Next of Kin', service: 'Financial Relief', milestone: 'Validation', status: 'PENDING', createdAt: '2026-03-27T08:29:33', updatedAt: '2026-03-28T11:59:27' },
  { id: 'MB-2024-4421', caseNo: 'OW-V1K5N4S', clientName: 'Navarro, Evelyn P.', clientType: 'Next of Kin', service: 'Legal Assistance', milestone: 'Document Intake', status: 'PROCESSING', createdAt: '2026-03-28T09:41:12', updatedAt: '2026-03-30T10:05:14' },
  { id: 'MB-2024-4422', caseNo: 'OW-J8W2F6P', clientName: 'Salazar, Dennis R.', clientType: 'Overseas Filipino Worker', service: 'Livelihood Support', milestone: 'Eligibility Review', status: 'PENDING', createdAt: '2026-03-29T08:15:46', updatedAt: '2026-03-29T16:22:03' },
  { id: 'MB-2024-4423', caseNo: 'OW-S4L9C1Y', clientName: 'Hernandez, Liza M.', clientType: 'Next of Kin', service: 'Medical Assistance', milestone: 'Hospital Coordination', status: 'PROCESSING', createdAt: '2026-03-30T10:09:57', updatedAt: '2026-03-31T11:40:19' },
  { id: 'MB-2024-4424', caseNo: 'OW-D7T3R8M', clientName: 'Aquino, Joel T.', clientType: 'Overseas Filipino Worker', service: 'Repatriation Services', milestone: 'Travel Clearance', status: 'COMPLETED', createdAt: '2026-03-31T07:58:33', updatedAt: '2026-04-01T14:17:42' },
  { id: 'MB-2024-4425', caseNo: 'OW-P2X6G5N', clientName: 'De Leon, Patricia S.', clientType: 'Overseas Filipino Worker', service: 'Financial Relief', milestone: 'Assessment', status: 'PENDING', createdAt: '2026-04-01T09:26:05', updatedAt: '2026-04-01T13:11:58' },
]

export const REFERRAL_ACTORS = {
  system: { id: 'actor-system-001', name: 'System', role: 'System' as const },
  caseManagers: [
    { id: 'actor-cm-001', name: 'Marychris M. Relon', role: 'Case Manager' as const },
    { id: 'actor-cm-002', name: 'Anjelica R. Flores', role: 'Case Manager' as const },
    { id: 'actor-cm-003', name: 'Ramon T. Lim', role: 'Case Manager' as const },
  ],
  agencyFocals: [
    { id: 'actor-af-001', name: 'Josephus Kim L. Sarsonas', role: 'Agency Focal' as const },
    { id: 'actor-af-002', name: 'Frances M. Sevilla', role: 'Agency Focal' as const },
    { id: 'actor-af-003', name: 'Miguel A. Solis', role: 'Agency Focal' as const },
  ],
}

function computeStableIndex(value: string, modulo: number): number {
  const sum = Array.from(value).reduce((acc, char) => acc + char.charCodeAt(0), 0)
  return sum % modulo
}

export function getReferralActorsForCase(caseId: string): {
  system: ReferralActor
  caseManager: ReferralActor
  agencyFocal: ReferralActor
} {
  const caseManager = REFERRAL_ACTORS.caseManagers[
    computeStableIndex(caseId, REFERRAL_ACTORS.caseManagers.length)
  ]

  const agencyFocal = REFERRAL_ACTORS.agencyFocals[
    computeStableIndex(caseId, REFERRAL_ACTORS.agencyFocals.length)
  ]

  return {
    system: REFERRAL_ACTORS.system,
    caseManager,
    agencyFocal,
  }
}

export function getReferralCaseById(id: string): SharedReferralCase | undefined {
  return REFERRAL_CASES.find((item) => item.id === id)
}

export function getReferralCaseByCaseNo(caseNo: string): SharedReferralCase | undefined {
  return REFERRAL_CASES.find((item) => item.caseNo.toLowerCase() === caseNo.toLowerCase())
}

export type SpecialCategory = 'Senior Citizen' | 'PWD' | 'Solo Parent'

export type ClientPersona = {
  ofwName: string
  ofwBirth: string
  gender: string
  ofwEmail: string
  ofwContact: string
  ofwAddress: string
  kinName: string
  kinContact: string
  kinEmail: string
  kinAddress: string
  lastCountry: string
  lastJob: string
  arrivalDate: string
}

export type ExistingClientProfile = {
  fullName: string
  birthDate: string
  gender: string
  email: string
  contact: string
  address: string
  lastCountry: string
  lastJob: string
  arrivalDate: string
  hasNextOfKin: boolean
  kinName: string
  kinContact: string
  kinEmail: string
  kinAddress: string
}

export function stableSeed(value: string): number {
  return Array.from(value).reduce((acc, char) => acc + char.charCodeAt(0), 0)
}

export function getSpecialCategories(seed: string): SpecialCategory[] {
  const sum = stableSeed(seed)
  const specialCategories: SpecialCategory[] = []

  if (sum % 5 === 0) {
    specialCategories.push('Senior Citizen')
  }

  if (sum % 4 === 0) {
    specialCategories.push('PWD')
  }

  if (sum % 6 === 0) {
    specialCategories.push('Solo Parent')
  }

  return specialCategories
}

export function getCaseNarrativeBySeed(seed: string): string {
  const narratives = [
    'Client reported severe emotional distress after abrupt contract termination and forced repatriation, with no immediate family support on arrival.',
    'Client described traumatic workplace exploitation overseas and returned home without stable income, requiring urgent psychosocial and reintegration support.',
    'Client experienced intimidation and unsafe living conditions abroad, and opened this case to seek protection, welfare assistance, and recovery services.',
    'Client shared a difficult repatriation experience due to unpaid wages and unresolved abuse concerns, which triggered the need for formal case intervention.',
  ]

  return narratives[stableSeed(seed) % narratives.length]
}

export function getCaseClosureRemarkBySeed(seed: string): string {
  const remarks = [
    'Final case requirements were completed and validated.',
    'Client support objectives were achieved and closure criteria were met.',
    'Required interventions were finalized and documented for case closure.',
    'All pending actions were resolved and the case was endorsed for closure.',
  ]

  return remarks[stableSeed(seed) % remarks.length]
}

export function getClientPersona(seed: string): ClientPersona {
  const firstNames = ['Miguel', 'Elaine', 'Carlos', 'Anita', 'Ramon', 'Liza', 'Teresa', 'Joel']
  const middleNames = ['Santos', 'Delos', 'Garcia', 'Mendoza', 'Rivera', 'Castillo']
  const lastNames = ['Rodriguez', 'Bautista', 'Lopez', 'Villanueva', 'Torres', 'Aquino']
  const countries = ['Saudi Arabia', 'Qatar', 'UAE', 'Kuwait']
  const jobs = ['Construction Supervisor', 'Caregiver', 'Machine Operator', 'Domestic Worker']

  const sum = stableSeed(seed)
  const firstName = firstNames[sum % firstNames.length]
  const middleName = middleNames[sum % middleNames.length]
  const lastName = lastNames[sum % lastNames.length]

  const firstNameKin = firstNames[(sum + 2) % firstNames.length]
  const middleNameKin = middleNames[(sum + 3) % middleNames.length]
  const lastNameKin = lastNames[(sum + 1) % lastNames.length]

  return {
    ofwName: `${firstName} ${middleName} R. ${lastName}`,
    ofwBirth: `May ${(sum % 28) + 1}, ${1988 + (sum % 10)} (${28 + (sum % 12)} yrs)`,
    gender: sum % 2 === 0 ? 'Male' : 'Female',
    ofwEmail: `${firstName.toLowerCase()}.${lastName.toLowerCase()}@email.ph`,
    ofwContact: `+63 917 ${(100 + (sum % 900)).toString().padStart(3, '0')} ${(1000 + (sum % 9000)).toString().padStart(4, '0')}`,
    ofwAddress: `Blk ${(sum % 30) + 1}, Lot ${(sum % 50) + 1}, Greenview Subd., Brgy. San Jose, Quezon City`,
    kinName: `${firstNameKin} ${middleNameKin} B. ${lastNameKin}`,
    kinContact: `+63 917 ${(200 + (sum % 700)).toString().padStart(3, '0')} ${(1000 + ((sum + 33) % 9000)).toString().padStart(4, '0')}`,
    kinEmail: `${firstNameKin.toLowerCase()}.${lastNameKin.toLowerCase()}@email.ph`,
    kinAddress: `Blk ${(sum % 30) + 1}, Lot ${(sum % 50) + 1}, Greenview Subd., Brgy. San Jose, Quezon City`,
    lastCountry: countries[sum % countries.length],
    lastJob: jobs[sum % jobs.length],
    arrivalDate: `Oct ${(sum % 28) + 1}, 2023`,
  }
}

export function getNextOfKinForClient(clientName: string): { name: string; contact: string; email: string; address: string } {
  const seed = stableSeed(clientName)
  const firstName = clientName.split(',')[0].trim() || clientName

  return {
    name: `Relative of ${firstName}`,
    contact: `+63 917 ${(200 + (seed % 700)).toString().padStart(3, '0')} ${(1000 + ((seed + 33) % 9000)).toString().padStart(4, '0')}`,
    email: `kin.${firstName.toLowerCase().replace(/\s+/g, '.')}@email.ph`,
    address: `Blk ${(seed % 30) + 1}, Lot ${(seed % 50) + 1}, Greenview Subd., Brgy. San Jose, Quezon City`,
  }
}

export function getExistingClientProfile(clientName: string): ExistingClientProfile {
  const seed = stableSeed(clientName)
  const countries = ['Saudi Arabia', 'Qatar', 'UAE', 'Kuwait']
  const jobs = ['Construction Supervisor', 'Caregiver', 'Machine Operator', 'Domestic Worker']
  const firstName = clientName.split(',')[0].trim() || clientName
  const kin = getNextOfKinForClient(clientName)

  return {
    fullName: clientName,
    birthDate: `May ${(seed % 28) + 1}, ${1988 + (seed % 10)}`,
    gender: seed % 2 === 0 ? 'Male' : 'Female',
    email: `${firstName.toLowerCase().replace(/\s+/g, '.')}.${(seed % 90) + 10}@email.ph`,
    contact: `+63 917 ${(100 + (seed % 900)).toString().padStart(3, '0')} ${(1000 + (seed % 9000)).toString().padStart(4, '0')}`,
    address: `Blk ${(seed % 30) + 1}, Lot ${(seed % 50) + 1}, Greenview Subd., Brgy. San Jose, Quezon City`,
    lastCountry: countries[seed % countries.length],
    lastJob: jobs[seed % jobs.length],
    arrivalDate: `Oct ${(seed % 28) + 1}, 2023`,
    hasNextOfKin: seed % 4 !== 0,
    kinName: kin.name,
    kinContact: kin.contact,
    kinEmail: kin.email,
    kinAddress: kin.address,
  }
}

export function getClientDirectoryProfile(clientName: string): {
  ofwName: string
  ofwEmail: string
  ofwContact: string
  ofwAddress: string
  nextOfKinName: string
  nextOfKinContact: string
  nextOfKinEmail: string
  nextOfKinAddress: string
} {
  const seed = stableSeed(clientName)
  const firstName = clientName.split(',')[0].trim() || clientName
  const kin = getNextOfKinForClient(clientName)

  return {
    ofwName: clientName,
    ofwEmail: `${firstName.toLowerCase().replace(/\s+/g, '.')}@email.ph`,
    ofwContact: `+63 917 ${(100 + (seed % 900)).toString().padStart(3, '0')} ${(1000 + (seed % 9000)).toString().padStart(4, '0')}`,
    ofwAddress: `Blk ${(seed % 30) + 1}, Lot ${(seed % 50) + 1}, Greenview Subd., Brgy. San Jose, Quezon City`,
    nextOfKinName: kin.name,
    nextOfKinContact: kin.contact,
    nextOfKinEmail: kin.email,
    nextOfKinAddress: kin.address,
  }
}

export type CaseManagerAgency = {
  id: string
  short: string
  name: string
  logoUrl: string
  contact: string
  email: string
  locationQuery: string
  services: string[]
}

export type StakeholderServiceDetail = {
  id: string
  title: string
  description: string
  requiredDocuments: string[]
  processingDays: number
}

function getDefaultProcessingDays(seed: string): number {
  return (stableSeed(seed) % 10) + 3
}

export type CaseManagerCase = SharedReferralCase & {
  agencyId: string
  agencyShort: string
  agencyName: string
}

export type CaseManagerReferral = {
  id: string
  caseId: string
  caseNo: string
  clientName: string
  service: string
  agencyId: string
  agencyName: string
  status: ReferralStatus
  createdAt: string
  updatedAt: string
  remarks: string
  notes: string
  documents: Array<{
    id: string
    name: string
    uploadedBy: string
    uploadedAt: string
  }>
}

const CASE_MANAGER_AGENCIES: CaseManagerAgency[] = AGENCIES_DATA.map((agency) => ({
  id: agency.id,
  short: agency.short,
  name: agency.name,
  logoUrl: agency.logoUrl,
  contact: agency.contact,
  email: agency.email,
  locationQuery: agency.locationQuery,
  services: agency.services.map((service) => service.title),
}))

export function getCaseAgency(caseId: string): CaseManagerAgency {
  return CASE_MANAGER_AGENCIES[computeStableIndex(caseId, CASE_MANAGER_AGENCIES.length)]
}

export const CASE_MANAGER_CASES: CaseManagerCase[] = REFERRAL_CASES.map((item) => {
  const agency = getCaseAgency(item.id)

  return {
    ...item,
    agencyId: agency.id,
    agencyShort: agency.short,
    agencyName: agency.name,
  }
})

export function formatDisplayDateTime(iso: string): string {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  }).format(new Date(iso))
}

export function formatDisplayDate(iso: string): string {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: '2-digit',
    year: 'numeric',
  }).format(new Date(iso))
}

export type OversightActivityType =
  | 'ASSIGNED'
  | 'ACCEPTED'
  | 'MILESTONE_UPDATED'
  | 'COMPLETED'
  | 'REJECTED'
  | 'CASE_CREATED'
  | 'REFERRAL_SENT'
  | 'RECORD_CREATED'
  | 'RECORD_UPDATED'
  | 'STATUS_CHANGED'
  | 'LOGIN_ATTEMPT'
  | 'EMAIL_SENT'
  | 'USER_LOGIN'

export type OversightActivityLog = {
  id: string
  caseNo?: string
  clientName?: string
  recordId?: string
  entity?: SystemAdminEntity
  activityType: OversightActivityType
  actor: string
  actorRole: 'Agency Focal' | 'Case Manager' | 'System' | 'System Admin' | 'User'
  channel: 'Portal'
  status?: ReferralStatus
  timestamp: string
  details: string
  remarks?: string
  ipAddress?: string
  emailRecipient?: string
}

function addMinutesToIso(iso: string, minutes: number): string {
  return new Date(new Date(iso).getTime() + minutes * 60_000).toISOString()
}

function getStatusActivityType(status: ReferralStatus): OversightActivityType {
  if (status === 'PROCESSING') {
    return 'ACCEPTED'
  }

  if (status === 'COMPLETED') {
    return 'COMPLETED'
  }

  return 'REJECTED'
}

function getStatusRemarks(status: ReferralStatus): string {
  if (status === 'PROCESSING') {
    return 'Initial intake documents verified and accepted.'
  }

  if (status === 'COMPLETED') {
    return 'Service completed and beneficiary notified.'
  }

  return 'Requirements are incomplete and need resubmission.'
}

function toSyntheticIpAddress(seed: string): string {
  const value = stableSeed(seed)
  return `${(value % 223) + 1}.${(value * 3) % 255}.${(value * 5) % 255}.${(value * 7) % 255}`
}

function toRecipientEmail(clientName: string): string {
  const normalized = clientName
    .toLowerCase()
    .replace(',', '')
    .replace(/\s+/g, '.')
    .replace(/[^a-z.]/g, '')

  return `${normalized || 'recipient'}@mail.ph`
}

export function buildAgencyActivityLogs(): OversightActivityLog[] {
  return REFERRAL_CASES.flatMap((item) => {
    const actors = getReferralActorsForCase(item.id)

    const assignedLog: OversightActivityLog = {
      id: `agency-${item.id}-assigned`,
      caseNo: item.caseNo,
      clientName: item.clientName,
      activityType: 'ASSIGNED',
      actor: actors.system.name,
      actorRole: actors.system.role,
      channel: 'Portal',
      status: 'PENDING',
      timestamp: item.createdAt,
      details: 'New referral assigned to agency queue for processing.',
    }

    const milestoneLog: OversightActivityLog = {
      id: `agency-${item.id}-milestone`,
      caseNo: item.caseNo,
      clientName: item.clientName,
      activityType: 'MILESTONE_UPDATED',
      actor: actors.agencyFocal.name,
      actorRole: actors.agencyFocal.role,
      channel: 'Portal',
      status: item.status === 'REJECTED' ? 'PROCESSING' : item.status,
      timestamp: item.updatedAt,
      details: `Milestone moved to ${item.milestone}.`,
    }

    if (item.status === 'PENDING') {
      return [assignedLog]
    }

    const statusLog: OversightActivityLog = {
      id: `agency-${item.id}-status`,
      caseNo: item.caseNo,
      clientName: item.clientName,
      activityType: getStatusActivityType(item.status),
      actor: actors.agencyFocal.name,
      actorRole: actors.agencyFocal.role,
      channel: 'Portal',
      status: item.status,
      timestamp: item.updatedAt,
      details: 'Referral status was updated.',
      remarks: getStatusRemarks(item.status),
    }

    return [assignedLog, milestoneLog, statusLog]
  }).sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
}

export function buildCaseManagerOversightActivityLogs(): OversightActivityLog[] {
  const caseLogs = CASE_MANAGER_CASES.flatMap((item) => {
    const actors = getReferralActorsForCase(item.id)
    const receivingAgency = getCaseAgency(item.id)

    const assignedLog: OversightActivityLog = {
      id: `cm-${item.id}-assigned`,
      caseNo: item.caseNo,
      clientName: item.clientName,
      activityType: 'ASSIGNED',
      actor: actors.system.name,
      actorRole: actors.system.role,
      channel: 'Portal',
      status: 'PENDING',
      timestamp: item.createdAt,
      details: 'Referral entered the shared case manager queue.',
    }

    const createdLog: OversightActivityLog = {
      id: `cm-${item.id}-created`,
      caseNo: item.caseNo,
      clientName: item.clientName,
      activityType: 'CASE_CREATED',
      actor: actors.caseManager.name,
      actorRole: actors.caseManager.role,
      channel: 'Portal',
      status: 'PENDING',
      timestamp: addMinutesToIso(item.createdAt, 15),
      details: 'Case record created and queued for referral processing.',
    }

    const sentLog: OversightActivityLog = {
      id: `cm-${item.id}-sent`,
      caseNo: item.caseNo,
      clientName: item.clientName,
      activityType: 'REFERRAL_SENT',
      actor: actors.caseManager.name,
      actorRole: actors.caseManager.role,
      channel: 'Portal',
      status: 'PENDING',
      timestamp: addMinutesToIso(item.createdAt, 35),
      details: `Referral sent to ${item.agencyName}.`,
    }

    const emailLog: OversightActivityLog = {
      id: `cm-${item.id}-email`,
      caseNo: item.caseNo,
      clientName: item.clientName,
      recordId: item.caseNo,
      entity: 'referrals',
      activityType: 'EMAIL_SENT',
      actor: actors.caseManager.name,
      actorRole: actors.caseManager.role,
      channel: 'Portal',
      status: 'COMPLETED',
      timestamp: addMinutesToIso(item.createdAt, 50),
      details: `Referral endorsement email sent to ${item.agencyName}.`,
      emailRecipient: receivingAgency.email,
    }

    const milestoneLog: OversightActivityLog = {
      id: `cm-${item.id}-milestone`,
      caseNo: item.caseNo,
      clientName: item.clientName,
      activityType: 'MILESTONE_UPDATED',
      actor: actors.agencyFocal.name,
      actorRole: actors.agencyFocal.role,
      channel: 'Portal',
      status: item.status === 'REJECTED' ? 'PROCESSING' : item.status,
      timestamp: item.updatedAt,
      details: `Milestone moved to ${item.milestone}.`,
    }

    if (item.status === 'PENDING') {
      return [assignedLog, createdLog, sentLog, emailLog]
    }

    const statusLog: OversightActivityLog = {
      id: `cm-${item.id}-status`,
      caseNo: item.caseNo,
      clientName: item.clientName,
      activityType: getStatusActivityType(item.status),
      actor: actors.agencyFocal.name,
      actorRole: actors.agencyFocal.role,
      channel: 'Portal',
      status: item.status,
      timestamp: addMinutesToIso(item.updatedAt, 20),
      details: `Status changed to ${item.status} at milestone ${item.milestone}.`,
      remarks: getStatusRemarks(item.status),
    }

    return [assignedLog, createdLog, sentLog, emailLog, milestoneLog, statusLog]
  })

  const loginLogs = REFERRAL_ACTORS.caseManagers.flatMap((manager, index) => {
    const baseTimestamp = addMinutesToIso('2026-04-10T08:00:00.000Z', index * 45)
    const ipAddress = toSyntheticIpAddress(manager.id)

    const attemptLog: OversightActivityLog = {
      id: `cm-login-attempt-${manager.id}`,
      activityType: 'LOGIN_ATTEMPT',
      actor: manager.name,
      actorRole: manager.role,
      channel: 'Portal',
      status: 'COMPLETED',
      timestamp: baseTimestamp,
      details: 'Case Manager login attempt succeeded after MFA validation.',
      ipAddress,
    }

    const loginLog: OversightActivityLog = {
      id: `cm-login-${manager.id}`,
      activityType: 'USER_LOGIN',
      actor: manager.name,
      actorRole: manager.role,
      channel: 'Portal',
      status: 'COMPLETED',
      timestamp: addMinutesToIso(baseTimestamp, 1),
      details: 'Case Manager session established in the portal.',
      ipAddress,
    }

    return [attemptLog, loginLog]
  })

  return [...caseLogs, ...loginLogs].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
}

export function buildSystemAdminOversightActivityLogs(): OversightActivityLog[] {
  const entitySources: SystemAdminEntity[] = ['cases', 'clients', 'agencies', 'services', 'referrals', 'users']

  const entityLogs = entitySources.flatMap((entity) => {
    return getSystemAdminRows(entity).flatMap((row) => {
      const isUser = entity === 'users'

      if (isUser) {
        const ipAddress = toSyntheticIpAddress(row.id)
        const isSuccessfulAttempt = stableSeed(row.id) % 4 !== 0

        const attemptLog: OversightActivityLog = {
          id: `sa-${entity}-${row.id}-attempt`,
          recordId: row.recordId,
          entity,
          activityType: 'LOGIN_ATTEMPT',
          actor: row.recordLabel,
          actorRole: 'User',
          channel: 'Portal',
          status: isSuccessfulAttempt ? 'COMPLETED' : 'REJECTED',
          timestamp: addMinutesToIso(row.updatedAt, -20),
          details: isSuccessfulAttempt
            ? 'Login attempt succeeded after credential verification.'
            : 'Login attempt failed due to invalid credentials.',
          ipAddress,
        }

        if (!isSuccessfulAttempt) {
          return [attemptLog]
        }

        const loginLog: OversightActivityLog = {
          id: `sa-${entity}-${row.id}`,
          recordId: row.recordId,
          entity,
          activityType: 'USER_LOGIN',
          actor: row.recordLabel,
          actorRole: 'User',
          channel: 'Portal',
          status: 'COMPLETED',
          timestamp: row.updatedAt,
          details: 'User successfully authenticated into the portal.',
          ipAddress,
        }

        return [attemptLog, loginLog]
      }

      const createdLog: OversightActivityLog = {
        id: `sa-${entity}-${row.id}-created`,
        caseNo: entity === 'cases' ? row.recordId : undefined,
        clientName: entity === 'cases' || entity === 'clients' ? row.recordLabel : undefined,
        recordId: row.recordId,
        entity,
        activityType: 'RECORD_CREATED',
        actor: 'System Admin',
        actorRole: 'System Admin',
        channel: 'Portal',
        status: 'PENDING',
        timestamp: addMinutesToIso(row.updatedAt, -45),
        details: `Created ${entity.slice(0, -1)} record in ${row.scope} scope.`,
      }

      const updatedLog: OversightActivityLog = {
        id: `sa-${entity}-${row.id}`,
        caseNo: entity === 'cases' ? row.recordId : undefined,
        clientName: entity === 'cases' || entity === 'clients' ? row.recordLabel : undefined,
        recordId: row.recordId,
        entity,
        activityType: row.status === 'ARCHIVED' ? 'STATUS_CHANGED' : 'RECORD_UPDATED',
        actor: 'System Admin',
        actorRole: 'System Admin',
        channel: 'Portal',
        status: row.status === 'ARCHIVED' ? 'REJECTED' : 'PROCESSING',
        timestamp: row.updatedAt,
        details:
          row.status === 'ARCHIVED'
            ? `Archived ${entity.slice(0, -1)} record in ${row.scope} scope.`
            : `Updated ${entity.slice(0, -1)} record in ${row.scope} scope.`,
      }

      return [createdLog, updatedLog]
    })
  })

  const lifecycleLogs = CASE_MANAGER_CASES.flatMap((item) => {
    const actors = getReferralActorsForCase(item.id)

    const assignedLog: OversightActivityLog = {
      id: `sa-${item.id}-assigned`,
      caseNo: item.caseNo,
      clientName: item.clientName,
      recordId: item.caseNo,
      entity: 'cases',
      activityType: 'ASSIGNED',
      actor: actors.system.name,
      actorRole: actors.system.role,
      channel: 'Portal',
      status: 'PENDING',
      timestamp: item.createdAt,
      details: `Referral assigned under ${item.agencyName}.`,
    }

    const sentLog: OversightActivityLog = {
      id: `sa-${item.id}-sent`,
      caseNo: item.caseNo,
      clientName: item.clientName,
      recordId: item.caseNo,
      entity: 'referrals',
      activityType: 'REFERRAL_SENT',
      actor: actors.caseManager.name,
      actorRole: actors.caseManager.role,
      channel: 'Portal',
      status: 'PENDING',
      timestamp: addMinutesToIso(item.createdAt, 30),
      details: `Referral sent to ${item.agencyName}.`,
    }

    const statusLog: OversightActivityLog = {
      id: `sa-${item.id}-status`,
      caseNo: item.caseNo,
      clientName: item.clientName,
      recordId: item.caseNo,
      entity: 'cases',
      activityType: getStatusActivityType(item.status),
      actor: item.status === 'PENDING' ? actors.caseManager.name : actors.agencyFocal.name,
      actorRole: item.status === 'PENDING' ? actors.caseManager.role : actors.agencyFocal.role,
      channel: 'Portal',
      status: item.status,
      timestamp: item.updatedAt,
      details: `Case status is now ${item.status} at ${item.milestone}.`,
      remarks: item.status === 'PENDING' ? undefined : getStatusRemarks(item.status),
    }

    return [assignedLog, sentLog, statusLog]
  })

  const emailLogs = CASE_MANAGER_CASES.flatMap((item) => {
    const agency = getCaseAgency(item.id)

    const clientEmailLog: OversightActivityLog = {
      id: `sa-${item.id}-email-client`,
      caseNo: item.caseNo,
      clientName: item.clientName,
      recordId: item.caseNo,
      entity: 'referrals',
      activityType: 'EMAIL_SENT',
      actor: 'System',
      actorRole: 'System',
      channel: 'Portal',
      status: 'COMPLETED',
      timestamp: addMinutesToIso(item.updatedAt, -10),
      details: 'Case status update email sent to beneficiary.',
      emailRecipient: toRecipientEmail(item.clientName),
    }

    const agencyEmailLog: OversightActivityLog = {
      id: `sa-${item.id}-email-agency`,
      caseNo: item.caseNo,
      clientName: item.clientName,
      recordId: item.caseNo,
      entity: 'referrals',
      activityType: 'EMAIL_SENT',
      actor: 'Case Manager',
      actorRole: 'Case Manager',
      channel: 'Portal',
      status: 'COMPLETED',
      timestamp: addMinutesToIso(item.updatedAt, -5),
      details: `Referral coordination email sent to ${agency.name}.`,
      emailRecipient: agency.email,
    }

    return [clientEmailLog, agencyEmailLog]
  })

  return [...entityLogs, ...lifecycleLogs, ...emailLogs].sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
  )
}

export function toCaseHealthStatus(status: ReferralStatus): 'OPEN' | 'CLOSED' {
  return status === 'COMPLETED' || status === 'REJECTED' ? 'CLOSED' : 'OPEN'
}

export function getAgencyReferralBreakdown(cases: CaseManagerCase[]): Array<{ agencyName: string; count: number }> {
  const buckets = cases.reduce<Record<string, number>>((acc, row) => {
    acc[row.agencyName] = (acc[row.agencyName] ?? 0) + 1
    return acc
  }, {})

  return Object.entries(buckets)
    .map(([agencyName, count]) => ({ agencyName, count }))
    .sort((a, b) => b.count - a.count)
}

export function getStatusBreakdown(cases: CaseManagerCase[]): Record<ReferralStatus, number> {
  return cases.reduce(
    (acc, row) => {
      acc[row.status] += 1
      return acc
    },
    {
      PENDING: 0,
      PROCESSING: 0,
      COMPLETED: 0,
      REJECTED: 0,
    } as Record<ReferralStatus, number>,
  )
}

export function getCaseManagerAgencies(): CaseManagerAgency[] {
  return CASE_MANAGER_AGENCIES
}

export function getStakeholderServices(agencyId: string): string[] {
  const agency = CASE_MANAGER_AGENCIES.find((item) => item.id === agencyId)
  return agency?.services ?? []
}

export function getStakeholderServiceDetails(agencyId: string): StakeholderServiceDetail[] {
  const agency = AGENCIES_DATA.find((item) => item.id === agencyId)
  if (!agency) {
    return []
  }

  return agency.services.map((service) => ({
    id: service.id,
    title: service.title,
    description: service.description,
    requiredDocuments: service.requiredDocuments,
    processingDays: getDefaultProcessingDays(`${agency.id}-${service.id}`),
  }))
}

export function resolveStakeholderService(agencyId: string, preferredService?: string): string {
  const services = getStakeholderServices(agencyId)

  if (preferredService && services.includes(preferredService)) {
    return preferredService
  }

  return services[0] ?? ''
}

const CASE_MANAGER_REFERRALS: CaseManagerReferral[] = CASE_MANAGER_CASES.map((item) => ({
  id: `ref-${item.id}`,
  caseId: item.id,
  caseNo: item.caseNo,
  clientName: item.clientName,
  service: resolveStakeholderService(item.agencyId, item.service),
  agencyId: item.agencyId,
  agencyName: item.agencyName,
  status: item.status,
  createdAt: item.createdAt,
  updatedAt: item.updatedAt,
  remarks: 'Initial referral from Case Manager queue.',
  notes: 'Referral endorsement prepared by Case Manager for agency intake and service coordination.',
  documents: [
    {
      id: `doc-${item.id}-1`,
      name: `Referral_Endorsement_${item.caseNo}.pdf`,
      uploadedBy: 'Case Manager - Marychris M. Relon',
      uploadedAt: item.createdAt,
    },
    {
      id: `doc-${item.id}-2`,
      name: `Client_Document_Packet_${item.caseNo}.zip`,
      uploadedBy: 'Case Manager - Marychris M. Relon',
      uploadedAt: item.updatedAt,
    },
  ],
}))

export function getCaseManagerReferrals(): CaseManagerReferral[] {
  return CASE_MANAGER_REFERRALS
}

export function getCaseManagerReferralById(referralId: string): CaseManagerReferral | undefined {
  return CASE_MANAGER_REFERRALS.find((item) => item.id === referralId)
}

export type SystemAdminEntity = 'cases' | 'clients' | 'agencies' | 'services' | 'referrals' | 'users'

export type SystemAdminRowStatus = 'ACTIVE' | 'ARCHIVED'

export type SystemAdminCrudRow = {
  id: string
  entity: SystemAdminEntity
  recordId: string
  recordLabel: string
  scope: string
  status: SystemAdminRowStatus
  updatedAt: string
}

function toSystemAdminStatus(seed: string): SystemAdminRowStatus {
  return stableSeed(seed) % 5 === 0 ? 'ARCHIVED' : 'ACTIVE'
}

export function getSystemAdminRows(entity: SystemAdminEntity): SystemAdminCrudRow[] {
  if (entity === 'cases') {
    return CASE_MANAGER_CASES.map((item) => ({
      id: `admin-case-${item.id}`,
      entity,
      recordId: item.caseNo,
      recordLabel: item.clientName,
      scope: item.agencyShort,
      status: toSystemAdminStatus(item.id),
      updatedAt: item.updatedAt,
    }))
  }

  if (entity === 'clients') {
    const uniqueClients = Array.from(new Set(CASE_MANAGER_CASES.map((item) => item.clientName)))

    return uniqueClients.map((clientName) => {
      const relatedCases = CASE_MANAGER_CASES.filter((item) => item.clientName === clientName)
      const latest = relatedCases.reduce((latestCase, currentCase) => {
        return new Date(currentCase.updatedAt).getTime() > new Date(latestCase.updatedAt).getTime()
          ? currentCase
          : latestCase
      }, relatedCases[0])

      return {
        id: `admin-client-${clientName}`,
        entity,
        recordId: `CLIENT-${stableSeed(clientName)}`,
        recordLabel: clientName,
        scope: latest.agencyShort,
        status: toSystemAdminStatus(clientName),
        updatedAt: latest.updatedAt,
      }
    })
  }

  if (entity === 'agencies') {
    return getCaseManagerAgencies().map((agency) => ({
      id: `admin-agency-${agency.id}`,
      entity,
      recordId: agency.short,
      recordLabel: agency.name,
      scope: 'National',
      status: toSystemAdminStatus(agency.id),
      updatedAt: '2026-04-08T10:30:00',
    }))
  }

  if (entity === 'services') {
    return AGENCIES_DATA.flatMap((agency) =>
      agency.services.map((service) => ({
        id: `admin-service-${agency.id}-${service.id}`,
        entity,
        recordId: service.id.toUpperCase(),
        recordLabel: service.title,
        scope: agency.short,
        status: toSystemAdminStatus(`${agency.id}-${service.id}`),
        updatedAt: '2026-04-06T09:15:00',
      })),
    )
  }

  if (entity === 'referrals') {
    return getCaseManagerReferrals().map((item) => ({
      id: `admin-referral-${item.id}`,
      entity,
      recordId: item.id.toUpperCase(),
      recordLabel: `${item.clientName} - ${item.service}`,
      scope: item.agencyName,
      status: toSystemAdminStatus(item.id),
      updatedAt: item.updatedAt,
    }))
  }

  return MOCK_AUTH_USERS.map((user) => ({
    id: `admin-user-${user.email}`,
    entity: 'users',
    recordId: user.email,
    recordLabel: user.name,
    scope: user.role,
    status: 'ACTIVE',
    updatedAt: '2026-04-09T15:00:00',
  }))
}

export function getSystemAdminEntitySummary(entity: SystemAdminEntity): {
  total: number
  active: number
  archived: number
  updatedThisWeek: number
} {
  const rows = getSystemAdminRows(entity)
  const oneWeekAgo = new Date('2026-04-03T00:00:00').getTime()

  return {
    total: rows.length,
    active: rows.filter((row) => row.status === 'ACTIVE').length,
    archived: rows.filter((row) => row.status === 'ARCHIVED').length,
    updatedThisWeek: rows.filter((row) => new Date(row.updatedAt).getTime() >= oneWeekAgo).length,
  }
}

export function getSystemAdminOverviewCards(): Array<{
  id: SystemAdminEntity
  label: string
  total: number
  active: number
}> {
  const entities: Array<{ id: SystemAdminEntity; label: string }> = [
    { id: 'cases', label: 'Cases' },
    { id: 'clients', label: 'Clients' },
    { id: 'agencies', label: 'Agencies' },
    { id: 'services', label: 'Services' },
    { id: 'referrals', label: 'Referrals' },
    { id: 'users', label: 'Users' },
  ]

  return entities.map((entity) => {
    const summary = getSystemAdminEntitySummary(entity.id)
    return {
      id: entity.id,
      label: entity.label,
      total: summary.total,
      active: summary.active,
    }
  })
}

export function getAllowedReferralStatusTransitions(currentStatus: ReferralStatus): ReferralStatus[] {
  if (currentStatus === 'PENDING') {
    return ['PENDING', 'PROCESSING', 'REJECTED']
  }

  if (currentStatus === 'PROCESSING') {
    return ['PROCESSING', 'COMPLETED', 'REJECTED']
  }

  return [currentStatus]
}

export function isValidReferralStatusTransition(currentStatus: ReferralStatus, nextStatus: ReferralStatus): boolean {
  return getAllowedReferralStatusTransitions(currentStatus).includes(nextStatus)
}

export type StepState = 'complete' | 'active' | 'pending'

export type MilestoneItem = {
  title: string
  titleTone: string
  time: string
  detail: string
  dotTone: string
}

export type MilestoneInfoRow = {
  label: string
  value: string
}

export type AgencyStep = {
  label: string
  state: StepState
  icon?: string
}

export type TrackingAgencyCardData = {
  name: string
  note: string
  status: string
  statusTone: string
  borderTone: string
  textTone: string
  lineTone: string
  steps: AgencyStep[]
  latestMilestoneLabel?: string
  latestMilestonePath?: string
}

export type CaseTimelineItem = {
  date: string
  agency: string
  title: string
  detail: string
  icon: string
  logoUrl: string
}

export type CaseOverviewData = {
  narrative: string
  ofw: {
    fullName: string
    dateOfBirth: string
    gender: string
    homeAddress: string
    specialCategories: string[]
  }
  nextOfKin: {
    fullName: string
    contactNumber: string
    emailAddress: string
  }
  workHistory: {
    lastCountry: string
    lastPosition: string
    arrivalDate: string
  }
}

type TrackingAgencyKey = 'owwa' | 'dmw' | 'tesda'

type TrackingStatusPresentation = {
  label: string
  statusTone: string
  borderTone: string
  textTone: string
  lineTone: string
  statusContainerTone: string
  statusDotTone: string
  statusTextTone: string
}

type TimelineDraftItem = {
  at: string
  agency: string
  agencyId?: string
  title: string
  detail: string
  icon: string
}

type MilestoneDraftItem = {
  at: string
  title: string
  detail: string
  state: 'active' | 'complete' | 'pending'
}

type TrackingAgencyMeta = {
  key: TrackingAgencyKey
  short: string
  path: string
  subtitle: string
}

const TRACKING_AGENCIES: TrackingAgencyMeta[] = [
  {
    key: 'owwa',
    short: 'OWWA',
    path: '/milestones',
    subtitle: 'Overseas Workers Welfare Administration Processing',
  },
  {
    key: 'dmw',
    short: 'DMW',
    path: '/dmw-milestones',
    subtitle: 'Department of Migrant Workers Processing',
  },
  {
    key: 'tesda',
    short: 'TESDA',
    path: '/tesda-milestones',
    subtitle: 'Technical Education and Skills Development Authority Processing',
  },
]

const PROVINCES = ['Cebu', 'Bohol', 'Negros Oriental', 'Siquijor']

export type AgencyMilestonePageData = {
  breadcrumbLabel: string
  title: string
  subtitle: string
  statusLabel: string
  statusContainerTone: string
  statusDotTone: string
  statusTextTone: string
  locationName: string
  locationSubtitle: string
  locationContact: string
  milestones: MilestoneItem[]
  infoRows: MilestoneInfoRow[]
}

export type TrackCasePageData = {
  trackingId: string
  trackedCase: SharedReferralCase
  caseOverview: CaseOverviewData
  caseTimeline: CaseTimelineItem[]
  trackingAgencies: TrackingAgencyCardData[]
}

function addHours(iso: string, hours: number): string {
  const date = new Date(iso)
  date.setHours(date.getHours() + hours)
  return date.toISOString()
}

function formatTimelineDate(iso: string): string {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  })
    .format(new Date(iso))
    .toUpperCase()
    .replace(', ', '  ')
}

function toTrackingStatusPresentation(status: ReferralStatus): TrackingStatusPresentation {
  if (status === 'PROCESSING') {
    return {
      label: 'Processing',
      statusTone: 'bg-blue-100 text-blue-700',
      borderTone: 'border-primary',
      textTone: 'text-primary',
      lineTone: 'bg-primary',
      statusContainerTone: 'bg-blue-100',
      statusDotTone: 'bg-blue-700',
      statusTextTone: 'text-blue-700',
    }
  }

  if (status === 'COMPLETED') {
    return {
      label: 'Completed',
      statusTone: 'bg-green-100 text-green-700',
      borderTone: 'border-secondary',
      textTone: 'text-secondary',
      lineTone: 'bg-secondary',
      statusContainerTone: 'bg-green-100',
      statusDotTone: 'bg-green-700',
      statusTextTone: 'text-green-700',
    }
  }

  if (status === 'REJECTED') {
    return {
      label: 'Rejected',
      statusTone: 'bg-red-100 text-red-700',
      borderTone: 'border-red-600',
      textTone: 'text-red-700',
      lineTone: 'bg-red-600',
      statusContainerTone: 'bg-red-100',
      statusDotTone: 'bg-red-700',
      statusTextTone: 'text-red-700',
    }
  }

  return {
    label: 'Pending',
    statusTone: 'bg-amber-100 text-amber-700',
    borderTone: 'border-slate-400',
    textTone: 'text-on-surface-variant',
    lineTone: 'bg-slate-400',
    statusContainerTone: 'bg-amber-100',
    statusDotTone: 'bg-amber-700',
    statusTextTone: 'text-amber-700',
  }
}

function toTrackingSteps(status: ReferralStatus, hasReferral: boolean): AgencyStep[] {
  if (!hasReferral) {
    return [
      { label: 'Referral Sent', state: 'pending' },
      { label: 'Accepted', state: 'pending' },
      { label: 'Processing', state: 'pending' },
      { label: 'Completed', state: 'pending' },
    ]
  }

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

function toAgencyStatusNote(status: ReferralStatus, hasReferral: boolean): string {
  if (!hasReferral) {
    return 'No referral record yet for this agency.'
  }

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

function toLatestMilestoneLabel(status: ReferralStatus, hasReferral: boolean): string {
  if (!hasReferral) {
    return 'Awaiting referral assignment.'
  }

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

function getInvolvedAgencyIdsForService(service: string): string[] {
  if (service === 'Repatriation Services') {
    return ['dmw', 'owwa', 'doh']
  }

  if (service === 'Legal Assistance') {
    return ['dmw', 'owwa', 'dole']
  }

  if (service === 'Medical Assistance') {
    return ['doh', 'owwa', 'dswd']
  }

  if (service === 'Financial Relief') {
    return ['owwa', 'dswd', 'dole']
  }

  if (service === 'Livelihood Support') {
    return ['tesda', 'owwa', 'dole']
  }

  if (service === 'Reintegration Seminar') {
    return ['owwa', 'tesda', 'dmw']
  }

  return ['owwa']
}

function buildTrackingReferrals(trackedCase: SharedReferralCase): CaseManagerReferral[] {
  const involvedAgencyIds = getInvolvedAgencyIdsForService(trackedCase.service)

  return involvedAgencyIds.reduce<CaseManagerReferral[]>((acc, agencyId, index) => {
    const agency = CASE_MANAGER_AGENCIES.find((item) => item.id === agencyId)

    if (!agency) {
      return acc
    }

    // Referral actions always happen after the case has been created.
    const createdAt = addHours(trackedCase.createdAt, (index + 1) * 2)
    const updatedAt = trackedCase.status === 'PENDING' ? addHours(createdAt, 2) : addHours(trackedCase.updatedAt, index)
    const remarks =
      trackedCase.status === 'PENDING'
        ? 'Referral sent and awaiting agency acceptance.'
        : trackedCase.status === 'PROCESSING'
          ? 'Referral accepted and currently being processed.'
          : trackedCase.status === 'COMPLETED'
            ? 'Agency interventions completed and documented.'
            : 'Agency reviewed referral and issued rejection.'

    acc.push({
      id: `track-ref-${trackedCase.id}-${agency.id}`,
      caseId: trackedCase.id,
      caseNo: trackedCase.caseNo,
      clientName: trackedCase.clientName,
      service: trackedCase.service,
      agencyId: agency.id,
      agencyName: agency.name,
      status: trackedCase.status,
      createdAt,
      updatedAt,
      remarks,
      notes: 'Tracking projection generated from case service routing.',
      documents: [],
    })

    return acc
  }, [])
}

function getTrackingAgencyRecord(referrals: CaseManagerReferral[], agencyId: TrackingAgencyKey): CaseManagerReferral | undefined {
  return referrals.find((item) => item.agencyId === agencyId)
}

function getCaseProvince(seed: string): string {
  return PROVINCES[stableSeed(seed) % PROVINCES.length]
}

function getDurationDays(startIso: string, endIso: string): number {
  const start = new Date(startIso).getTime()
  const end = new Date(endIso).getTime()
  const diff = Math.max(0, end - start)
  return Math.max(1, Math.ceil(diff / (1000 * 60 * 60 * 24)))
}

function getTimelineLogoUrl(agencyId?: string): string {
  if (!agencyId) {
    return '/logo.png'
  }

  const agency = CASE_MANAGER_AGENCIES.find((item) => item.id === agencyId)
  return agency?.logoUrl ?? '/logo.png'
}

function buildMilestoneInfoRows(trackedCase: SharedReferralCase): MilestoneInfoRow[] {
  const clientType = trackedCase.clientType === 'Overseas Filipino Worker' ? 'OFW' : 'Next of Kin'
  const duration = getDurationDays(trackedCase.createdAt, trackedCase.updatedAt)

  return [
    { label: 'Tracking ID', value: trackedCase.caseNo },
    { label: 'Date Referred', value: formatDisplayDate(trackedCase.createdAt) },
    { label: 'Referral Duration', value: `${duration} Days` },
    { label: 'Client Type', value: clientType },
    { label: 'Province', value: getCaseProvince(trackedCase.id) },
  ]
}

function buildCaseOverview(trackedCase: SharedReferralCase): CaseOverviewData {
  const persona = getClientPersona(trackedCase.id)
  const nextOfKin = getNextOfKinForClient(trackedCase.clientName)
  const specialCategories = getSpecialCategories(trackedCase.id)

  return {
    narrative: getCaseNarrativeBySeed(trackedCase.id),
    ofw: {
      fullName: trackedCase.clientName,
      dateOfBirth: persona.ofwBirth.split(' (')[0],
      gender: persona.gender,
      homeAddress: persona.ofwAddress,
      specialCategories,
    },
    nextOfKin: {
      fullName: nextOfKin.name,
      contactNumber: nextOfKin.contact,
      emailAddress: nextOfKin.email,
    },
    workHistory: {
      lastCountry: persona.lastCountry,
      lastPosition: persona.lastJob,
      arrivalDate: persona.arrivalDate,
    },
  }
}

function buildCaseTimeline(trackedCase: SharedReferralCase): CaseTimelineItem[] {
  const actors = getReferralActorsForCase(trackedCase.id)
  const referrals = buildTrackingReferrals(trackedCase)
  const events: TimelineDraftItem[] = [
    {
      at: trackedCase.createdAt,
      agency: 'Bayanihan',
      title: 'Case created',
      detail: `${actors.caseManager.name} created case ${trackedCase.caseNo}.`,
      icon: 'add_circle',
    },
  ]

  referrals.forEach((referral) => {
    const agencyShort = referral.agencyId.toUpperCase()

    events.push({
      at: referral.createdAt,
      agency: agencyShort,
      agencyId: referral.agencyId,
      title: `${agencyShort}: Referral Sent`,
      detail: `Case was endorsed to ${referral.agencyName} for ${referral.service}.`,
      icon: 'send',
    })

    if (referral.status === 'PENDING') {
      events.push({
        at: addHours(referral.createdAt, 1),
        agency: agencyShort,
        agencyId: referral.agencyId,
        title: `${agencyShort}: Awaiting Agency Intake`,
        detail: 'Referral is pending agency intake acknowledgment.',
        icon: 'hourglass_empty',
      })
    }

    if (referral.status === 'PROCESSING' || referral.status === 'COMPLETED') {
      events.push({
        at: referral.status === 'COMPLETED' ? addHours(referral.updatedAt, -2) : referral.updatedAt,
        agency: agencyShort,
        agencyId: referral.agencyId,
        title: `${agencyShort}: Referral Accepted`,
        detail:
          referral.status === 'COMPLETED'
            ? 'Agency accepted the referral and initiated service coordination.'
            : 'Agency accepted the referral and started processing.',
        icon: 'account_circle',
      })
    }

    if (referral.status === 'COMPLETED') {
      events.push({
        at: referral.updatedAt,
        agency: agencyShort,
        agencyId: referral.agencyId,
        title: `${agencyShort}: Referral Completed`,
        detail: 'Service delivery was completed and verified by the agency.',
        icon: 'check_circle',
      })
    }

    if (referral.status === 'REJECTED') {
      events.push({
        at: referral.updatedAt,
        agency: agencyShort,
        agencyId: referral.agencyId,
        title: `${agencyShort}: Referral Rejected`,
        detail: 'Agency rejected the referral and returned it for follow-up.',
        icon: 'cancel',
      })
    }
  })

  return events
    .sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime())
    .map((item) => ({
      date: formatTimelineDate(item.at),
      agency: item.agency,
      title: item.title,
      detail: item.detail,
      icon: item.icon,
      logoUrl: getTimelineLogoUrl(item.agencyId),
    }))
}

function buildTrackingAgencies(trackedCase: SharedReferralCase): TrackingAgencyCardData[] {
  const caseReferrals = buildTrackingReferrals(trackedCase)

  return caseReferrals.map((referral) => {
    const status = referral.status
    const tones = toTrackingStatusPresentation(status)
    const agencyRecord = CASE_MANAGER_AGENCIES.find((item) => item.id === referral.agencyId)
    const supportedMilestoneAgency = TRACKING_AGENCIES.find((item) => item.key === referral.agencyId)

    return {
      name: agencyRecord?.short ?? referral.agencyName,
      note: toAgencyStatusNote(status, true),
      status: tones.label,
      statusTone: tones.statusTone,
      borderTone: tones.borderTone,
      textTone: tones.textTone,
      lineTone: tones.lineTone,
      latestMilestoneLabel: toLatestMilestoneLabel(status, true),
      latestMilestonePath: supportedMilestoneAgency?.path,
      steps: toTrackingSteps(status, true),
    }
  })
}

function buildAgencyMilestones(referral: CaseManagerReferral | undefined, agencyName: string, trackingId: string): MilestoneItem[] {
  if (!referral) {
    return [
      {
        title: 'AWAITING REFERRAL ASSIGNMENT',
        titleTone: 'text-on-surface-variant',
        time: formatDisplayDateTime(new Date().toISOString()).toUpperCase(),
        detail: `${agencyName} has no referral record yet for ${trackingId}.`,
        dotTone: 'bg-outline-variant/50 ring-surface-container-lowest',
      },
    ]
  }

  const events: MilestoneDraftItem[] = [
    {
      at: referral.createdAt,
      title: 'REFERRAL SENT',
      detail: `Case was endorsed to ${agencyName} for ${referral.service}.`,
      state: 'complete',
    },
  ]

  if (referral.status === 'PENDING') {
    events.push({
      at: addHours(referral.createdAt, 4),
      title: 'AWAITING AGENCY INTAKE',
      detail: 'Referral is pending agency intake acknowledgment.',
      state: 'pending',
    })
  }

  if (referral.status === 'PROCESSING' || referral.status === 'COMPLETED') {
    events.push({
      at: addHours(referral.createdAt, 4),
      title: 'REFERRAL ACCEPTED',
      detail:
        referral.status === 'COMPLETED'
          ? 'Agency accepted the referral and initiated service coordination.'
          : 'Agency accepted the referral and started processing.',
      state: 'complete',
    })
  }

  if (referral.status === 'COMPLETED') {
    events.push({
      at: referral.updatedAt,
      title: 'REFERRAL COMPLETED',
      detail: 'Service delivery was completed and verified by the agency.',
      state: 'active',
    })
  }

  if (referral.status === 'REJECTED') {
    events.push({
      at: referral.updatedAt,
      title: 'REFERRAL REJECTED',
      detail: 'Agency rejected the referral and returned it for follow-up.',
      state: 'active',
    })
  }

  return events
    .sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime())
    .map((event) => ({
      title: event.title,
      titleTone: event.state === 'pending' ? 'text-on-surface-variant' : event.state === 'active' ? 'text-primary' : 'text-on-surface',
      time: formatDisplayDateTime(event.at).toUpperCase(),
      detail: event.detail,
      dotTone:
        event.state === 'pending'
          ? 'bg-outline-variant/50 ring-surface-container-lowest'
          : event.state === 'active'
            ? 'bg-primary ring-[#d2e4f6]'
            : 'bg-primary ring-surface-container-lowest',
    }))
}

function getTrackingStatusLabel(status: ReferralStatus): string {
  return toTrackingStatusPresentation(status).label.toUpperCase()
}

export function getAgencyMilestonePageData(agency: TrackingAgencyKey, trackingId: string): AgencyMilestonePageData | null {
  const trackedCase = getReferralCaseByCaseNo(trackingId)

  if (!trackedCase) {
    return null
  }

  const agencyMeta = TRACKING_AGENCIES.find((item) => item.key === agency)

  if (!agencyMeta) {
    return null
  }

  const caseReferrals = buildTrackingReferrals(trackedCase)
  const agencyRecord = CASE_MANAGER_AGENCIES.find((item) => item.id === agency)
  const referral = getTrackingAgencyRecord(caseReferrals, agency)
  if (!referral) {
    return null
  }

  const status = referral?.status ?? 'PENDING'
  const statusPresentation = toTrackingStatusPresentation(status)

  return {
    breadcrumbLabel: `${agencyMeta.short} MILESTONES`,
    title: `MILESTONE DETAILS: ${agencyMeta.short}`,
    subtitle: agencyMeta.subtitle,
    statusLabel: getTrackingStatusLabel(status),
    statusContainerTone: statusPresentation.statusContainerTone,
    statusDotTone: statusPresentation.statusDotTone,
    statusTextTone: statusPresentation.statusTextTone,
    locationName: agencyRecord?.name ?? `${agencyMeta.short} Regional Office`,
    locationSubtitle: 'Central Visayas Regional Center',
    locationContact: agencyRecord?.contact ?? 'N/A',
    milestones: buildAgencyMilestones(referral, referral.agencyName, trackedCase.caseNo),
    infoRows: buildMilestoneInfoRows(trackedCase),
  }
}

export function getTrackCasePageData(trackingId: string): TrackCasePageData | null {
  const trackedCase = getReferralCaseByCaseNo(trackingId)

  if (!trackedCase) {
    return null
  }

  return {
    trackingId: trackedCase.caseNo,
    trackedCase,
    caseOverview: buildCaseOverview(trackedCase),
    caseTimeline: buildCaseTimeline(trackedCase),
    trackingAgencies: buildTrackingAgencies(trackedCase),
  }
}
