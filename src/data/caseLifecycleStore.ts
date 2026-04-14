import {
  CASE_MANAGER_CASES,
  getCaseManagerReferrals,
  toCaseHealthStatus,
  type CaseManagerCase,
  type CaseManagerReferral,
  type ReferralStatus,
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

  return {
    cases: CASE_MANAGER_CASES.map((item) => ({ ...item })),
    referrals: seedReferrals.map((item) => ({ ...item, documents: item.documents.map((doc) => ({ ...doc })) })),
    milestonesByReferralId: Object.fromEntries(
      seedReferrals.map((item) => [
        item.id,
        [
          {
            id: `milestone-${item.id}-seed`,
            referralId: item.id,
            title: item.status === 'PENDING' ? 'Referral Sent' : 'Referral Intake Started',
            description: 'Initial referral activity was recorded.',
            createdAt: item.createdAt,
            actor: 'System',
          },
        ],
      ]),
    ),
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
    return parsed
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
      [referralInput.id]: [
        {
          id: `milestone-${referralInput.id}-${Date.now()}`,
          referralId: referralInput.id,
          title: 'Referral Sent',
          description: 'Referral was created and sent to the selected agency.',
          createdAt: nowIso,
          actor: 'Case Manager',
        },
      ],
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

  if (!updated) {
    return null
  }

  updateState((state) => {
    const previousMilestones = state.milestonesByReferralId[referralId] ?? []
    const nextMilestones = [
      ...previousMilestones,
      {
        id: `milestone-${referralId}-${Date.now()}`,
        referralId,
        title: `Status: ${status}`,
        description: remark.trim() || 'Referral status updated.',
        createdAt: nowIso,
        actor: 'Agency Focal',
      },
    ]

    return {
      ...state,
      milestonesByReferralId: {
        ...state.milestonesByReferralId,
        [referralId]: nextMilestones,
      },
    }
  })

  return updated
}

export function addManagedReferralMilestone(referralId: string, title: string, description: string): ReferralMilestoneEntry | null {
  const referral = getManagedReferralById(referralId)
  if (!referral) {
    return null
  }

  const nowIso = new Date().toISOString()
  const entry: ReferralMilestoneEntry = {
    id: `milestone-${referralId}-${Date.now()}`,
    referralId,
    title: title.trim(),
    description: description.trim(),
    createdAt: nowIso,
    actor: 'Agency Focal',
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

export function getManagedCaseStatus(caseId: string): 'OPEN' | 'CLOSED' {
  const caseRow = getManagedCaseById(caseId)
  if (!caseRow) {
    return 'OPEN'
  }

  return toCaseHealthStatus(caseRow.status)
}
