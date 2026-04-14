import { useMemo } from 'react'
import { ActivityTimelineView } from '../../components/activity/ActivityTimelineView'
import { buildCaseManagerOversightActivityLogs } from '../../data/unifiedData'

export default function AuditLogsPage() {
  const logs = useMemo(() => buildCaseManagerOversightActivityLogs(), [])
  const actorOptions = useMemo(() => {
    return Array.from(new Set(logs.map((log) => log.actor)))
      .sort()
      .map((actor) => ({ value: actor, label: actor }))
  }, [logs])

  return (
    <ActivityTimelineView
      pageTitle="Audit Logs"
      pageSubtitle="Track cross-agency referral actions and all case lifecycle activity."
      sectionTitle="Case Manager Timeline"
      exportFileName="case-manager-audit-logs.csv"
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