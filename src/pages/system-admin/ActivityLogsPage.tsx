import { useMemo } from 'react'
import { ActivityTimelineView } from '../../components/activity/ActivityTimelineView'
import { buildSystemAdminOversightActivityLogs } from '../../data/unifiedData'

export default function ActivityLogsPage() {
  const logs = useMemo(() => buildSystemAdminOversightActivityLogs(), [])
  const actorOptions = useMemo(() => {
    return Array.from(new Set(logs.map((log) => log.actor)))
      .sort()
      .map((actor) => ({ value: actor, label: actor }))
  }, [logs])

  return (
    <ActivityTimelineView
      pageTitle="Activity Logs"
      pageSubtitle="Global view of all system, user, and entity operations across the platform."
      sectionTitle="System Timeline"
      exportFileName="system-admin-activity-logs.csv"
      searchPlaceholder="Search case, actor, channel, or event details..."
      logs={logs}
      activityOptions={[
        { value: 'ASSIGNED', label: 'Assigned' },
        { value: 'CASE_CREATED', label: 'Case Created' },
        { value: 'REFERRAL_SENT', label: 'Referral Sent' },
        { value: 'EMAIL_SENT', label: 'Email Sent' },
        { value: 'LOGIN_ATTEMPT', label: 'Login Attempt' },
        { value: 'USER_LOGIN', label: 'User Login' },
        { value: 'MILESTONE_UPDATED', label: 'Milestone Updated' },
        { value: 'RECORD_CREATED', label: 'Record Created' },
        { value: 'RECORD_UPDATED', label: 'Record Updated' },
        { value: 'STATUS_CHANGED', label: 'Status Changed' },
        { value: 'ACCEPTED', label: 'Accepted' },
        { value: 'COMPLETED', label: 'Completed' },
        { value: 'REJECTED', label: 'Rejected' },
      ]}
      actorOptions={actorOptions}
      showStatusFilter
      showActorFilter
      density="compact"
    />
  )
}
