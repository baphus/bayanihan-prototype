import { useMemo } from 'react'
import { ActivityTimelineView } from '../../components/activity/ActivityTimelineView'
import { buildAgencyActivityLogs } from '../../data/unifiedData'

export default function ActivityLogsPage() {
  const logs = useMemo(() => buildAgencyActivityLogs(), [])

  return (
    <ActivityTimelineView
      pageTitle="Activity Logs"
      pageSubtitle="Track referral actions, actor activity, and channel events."
      sectionTitle="Agency Timeline"
      exportFileName="agency-activity-logs.csv"
      searchPlaceholder="Search case, actor, channel, or event details..."
      logs={logs}
      activityOptions={[
        { value: 'ASSIGNED', label: 'Assigned' },
        { value: 'ACCEPTED', label: 'Accepted' },
        { value: 'MILESTONE_UPDATED', label: 'Milestone Updated' },
        { value: 'COMPLETED', label: 'Completed' },
        { value: 'REJECTED', label: 'Rejected' },
      ]}
      showStatusFilter
    />
  )
}
