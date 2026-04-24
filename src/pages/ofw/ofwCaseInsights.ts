import { getManagedCasesForOfwEmail, getManagedReferralsByCaseId } from '../../data/caseLifecycleStore'
import { toCaseHealthStatus, type CaseManagerCase } from '../../data/unifiedData'

export type OfwCaseRow = {
  id: string
  caseNo: string
  service: string
  createdAt: string
  updatedAt: string
  healthStatus: 'OPEN' | 'CLOSED'
  progressSummary: string
  progressPercent: number
  completedCount: number
  processingCount: number
  pendingCount: number
  totalReferrals: number
}

export type OfwCaseMetrics = {
  totalCases: number
  openCases: number
  closedCases: number
  averageProgress: number
  activelyProcessingCases: number
  awaitingCases: number
}

function toProgressSummary(caseRecord: CaseManagerCase): {
  progressSummary: string
  progressPercent: number
  completedCount: number
  processingCount: number
  pendingCount: number
  totalReferrals: number
} {
  const referrals = getManagedReferralsByCaseId(caseRecord.id)

  if (referrals.length === 0) {
    return {
      progressSummary: 'No agency progress yet',
      progressPercent: 0,
      completedCount: 0,
      processingCount: 0,
      pendingCount: 0,
      totalReferrals: 0,
    }
  }

  const completedCount = referrals.filter((item) => item.status === 'COMPLETED').length
  const processingCount = referrals.filter((item) => item.status === 'PROCESSING').length
  const pendingCount = referrals.filter((item) => item.status === 'PENDING').length
  const totalReferrals = referrals.length
  const progressPercent = Math.round((completedCount / totalReferrals) * 100)

  return {
    progressSummary: `${completedCount} completed, ${processingCount} in progress, ${pendingCount} pending`,
    progressPercent,
    completedCount,
    processingCount,
    pendingCount,
    totalReferrals,
  }
}

export function buildOfwCaseRows(email: string | null): OfwCaseRow[] {
  if (!email) {
    return []
  }

  return getManagedCasesForOfwEmail(email)
    .map((item) => {
      const progress = toProgressSummary(item)

      return {
        id: item.id,
        caseNo: item.caseNo,
        service: item.service,
        createdAt: item.createdAt,
        updatedAt: item.updatedAt,
        healthStatus: toCaseHealthStatus(item.status),
        progressSummary: progress.progressSummary,
        progressPercent: progress.progressPercent,
        completedCount: progress.completedCount,
        processingCount: progress.processingCount,
        pendingCount: progress.pendingCount,
        totalReferrals: progress.totalReferrals,
      }
    })
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
}

export function getOfwCaseMetrics(rows: OfwCaseRow[]): OfwCaseMetrics {
  const totalCases = rows.length
  const openCases = rows.filter((item) => item.healthStatus === 'OPEN').length
  const closedCases = rows.filter((item) => item.healthStatus === 'CLOSED').length
  const activelyProcessingCases = rows.filter((item) => item.processingCount > 0).length
  const awaitingCases = rows.filter((item) => item.pendingCount > 0 && item.processingCount === 0).length

  const averageProgress =
    totalCases === 0
      ? 0
      : Math.round(rows.reduce((acc, item) => acc + item.progressPercent, 0) / totalCases)

  return {
    totalCases,
    openCases,
    closedCases,
    averageProgress,
    activelyProcessingCases,
    awaitingCases,
  }
}
