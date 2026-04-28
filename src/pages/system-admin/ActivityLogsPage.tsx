import { useMemo } from 'react'
import { ActivityTimelineView } from '../../components/activity/ActivityTimelineView'
import type { ActivityLog } from '../../components/activity/ActivityTimelineView'
import { buildSystemAdminOversightActivityLogs } from '../../data/unifiedData'

export default function ActivityLogsPage() {
  const rawLogs = useMemo(() => buildSystemAdminOversightActivityLogs(), [])

  const logs: ActivityLog[] = useMemo(() => rawLogs.map(log => ({
    id: log.id,
    timestamp: log.timestamp,
    actor: log.actor,
    actorRole: log.actorRole,
    activityType: log.activityType,
    details: log.details,
    outcome: log.activityType.includes('FAILED') ? 'FAILED' : 'SUCCESS',
    target: log.caseNo ? `Case #${log.caseNo}` : (log.clientName || 'System'),
    entity: log.entity,
    ipAddress: log.ipAddress,
    emailRecipient: log.emailRecipient,
    caseNo: log.caseNo,
    recordId: log.recordId
  })), [rawLogs])

  return (
    <ActivityTimelineView
      pageTitle="System Activity Logs"
      pageSubtitle="Global activity trail across all agencies and system modules."
      sectionTitle="System-Wide Timeline"
      exportFileName="system-activity-logs"
      logs={logs}
    />
  )
}