import { useMemo } from 'react'
import { ActivityTimelineView } from '../../components/activity/ActivityTimelineView'
import type { ActivityLog } from '../../components/activity/ActivityTimelineView'
import { buildAgencyActivityLogs } from '../../data/unifiedData'

export default function ActivityLogsPage() {
  const rawLogs = useMemo(() => buildAgencyActivityLogs(), [])
  
  const logs: ActivityLog[] = useMemo(() => rawLogs.map(log => ({
    id: log.id,
    timestamp: log.timestamp,
    actor: log.actor,
    actorRole: log.actorRole,
    activityType: log.activityType,
    details: log.details,
    outcome: (log.status === 'REJECTED' || log.status === 'FOR_COMPLIANCE') ? 'WARNING' : 'SUCCESS',
    target: log.caseNo ? `Case #${log.caseNo}` : (log.clientName || 'N/A'),
    entity: log.entity,
    ipAddress: log.ipAddress,
    emailRecipient: log.emailRecipient,
    caseNo: log.caseNo,
    recordId: log.recordId
  })), [rawLogs])

  return (
    <ActivityTimelineView
      pageTitle="Activity Logs"
      pageSubtitle="Track referral actions, actor activity, and channel events."
      sectionTitle="Agency Timeline"
      exportFileName="agency-activity-logs"
      searchPlaceholder="Search case, actor, channel, or event details..."
      logs={logs}
      showStatusFilter
    />
  )
}