import { useMemo } from 'react'
import { ActivityTimelineView } from '../../components/activity/ActivityTimelineView'
import { buildSystemAdminOversightActivityLogs } from '../../data/unifiedData'

export default function ActivityLogsPage() {
  const logs = useMemo(() => buildSystemAdminOversightActivityLogs(), [])

  const activityOptions = useMemo(() => {
    return Array.from(new Set(logs.map((log) => log.activityType)))
      .sort()
      .map((item) => ({ value: item, label: item.replaceAll('_', ' ') }))
  }, [logs])

  return (
    <ActivityTimelineView
      pageTitle="Activity Logs"
      pageSubtitle="Global view of all system, user, and entity operations across the platform."
      sectionTitle="System Timeline"
      exportFileName="system-admin-activity-logs.csv"
      searchPlaceholder="Search case, record ID, actor, entity, IP, email recipient, or details..."
      logs={logs}
      activityOptions={activityOptions}
      entityOptions={[
        { value: 'cases', label: 'Cases' },
        { value: 'clients', label: 'Clients' },
        { value: 'agencies', label: 'Agencies' },
        { value: 'services', label: 'Services' },
        { value: 'referrals', label: 'Referrals' },
        { value: 'users', label: 'Users' },
      ]}
      showStatusFilter
      showEntityFilter
    />
  )
}
