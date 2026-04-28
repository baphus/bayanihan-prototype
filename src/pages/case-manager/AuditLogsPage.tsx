import { useMemo } from 'react'
import { ActivityTimelineView } from '../../components/activity/ActivityTimelineView'
import type { ActivityLog } from '../../components/activity/ActivityTimelineView'
import { buildCaseManagerOversightActivityLogs } from '../../data/unifiedData'

export default function AuditLogsPage() {
  const rawLogs = useMemo(() => buildCaseManagerOversightActivityLogs(), [])

  const logs: ActivityLog[] = useMemo(() => rawLogs.map(log => ({
    id: log.id,
    timestamp: log.timestamp,
    actor: log.actor,
    actorRole: log.actorRole,
    activityType: log.activityType,
    details: log.details,
    outcome: log.status === 'REJECTED' ? 'FAILED' : (log.status === 'PENDING' ? 'INFO' : 'SUCCESS'),
    target: log.caseNo ? `Case #${log.caseNo}` : (log.clientName || 'N/A'),
    entity: log.entity,
    ipAddress: log.ipAddress,
    emailRecipient: log.emailRecipient,
    caseNo: log.caseNo,
    recordId: log.recordId
  })), [rawLogs])

  return (
    <ActivityTimelineView
      pageTitle="Audit Logs"
      pageSubtitle="Comprehensive trail of case management actions and system events."
      sectionTitle="Case Management Audit"
      exportFileName="cm-audit-logs"
      logs={logs}
    />
  )
}