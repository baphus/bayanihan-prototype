import { useMemo, type ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { Cloud, Database, HardDriveDownload, ShieldCheck, BellRing, Activity, ServerCog, KeyRound } from 'lucide-react'
import NotificationBell from '../../components/ui/NotificationBell'
import { pageHeadingStyles } from '../agency/pageHeadingStyles'
import {
  buildSystemAdminOversightActivityLogs,
  getDashboardNotificationDeliveryLogsByRole,
  getSystemAdminGovernanceHealth,
  getSystemAdminIntegrationSettings,
  getSystemAdminNotificationDeliveryLogs,
  getSystemAdminOverviewCards,
  getSystemAdminSecuritySettings,
} from '../../data/unifiedData'

const PATH_BY_ENTITY = {
  cases: '/system-admin/cases',
  clients: '/system-admin/clients',
  agencies: '/system-admin/agencies',
  services: '/system-admin/services',
  referrals: '/system-admin/referrals',
  users: '/system-admin/users',
} as const

export default function DashboardPage() {
  const navigate = useNavigate()
  const cards = useMemo(() => getSystemAdminOverviewCards(), [])
  const governanceHealth = useMemo(() => getSystemAdminGovernanceHealth(), [])
  const integrationSettings = useMemo(() => getSystemAdminIntegrationSettings(), [])
  const securitySettings = useMemo(() => getSystemAdminSecuritySettings(), [])

  const recentActivity = useMemo(() => {
    return buildSystemAdminOversightActivityLogs().slice(0, 6)
  }, [])

  const notificationStats = useMemo(() => {
    const logs = getSystemAdminNotificationDeliveryLogs()
    return {
      total: logs.length,
      failed: logs.filter((log) => log.status === 'FAILED').length,
      queued: logs.filter((log) => log.status === 'QUEUED').length,
    }
  }, [])

  const dashboardNotifications = useMemo(() => getDashboardNotificationDeliveryLogsByRole('System Admin'), [])

  const totals = useMemo(
    () =>
      cards.reduce(
        (acc, card) => {
          acc.total += card.total
          acc.active += card.active
          return acc
        },
        { total: 0, active: 0 },
      ),
    [cards],
  )

  const storageOverview = useMemo(() => {
    const attachmentUsagePercent = Math.min(92, Math.max(18, Math.round((totals.total / 180) * 100)))
    const reportsUsagePercent = Math.min(88, Math.max(12, Math.round((totals.active / 140) * 100)))

    return {
      attachmentsPercent: attachmentUsagePercent,
      reportsPercent: reportsUsagePercent,
      attachmentUsedGb: (attachmentUsagePercent * 0.78).toFixed(1),
      reportsUsedGb: (reportsUsagePercent * 0.34).toFixed(1),
    }
  }, [totals.total, totals.active])

  return (
    <div className="mx-auto max-w-7xl space-y-5 pb-6">
      <header className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className={pageHeadingStyles.pageTitle}>System Admin Dashboard</h1>
          <p className={pageHeadingStyles.pageSubtitle}>Monitor platform operations, storage integrations, security posture, and recent system activity.</p>
        </div>
        <div className="self-start md:self-auto">
          <NotificationBell notifications={dashboardNotifications} viewAllHref="/system-admin/notifications" />
        </div>
      </header>

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard title="TOTAL PLATFORM RECORDS" value={totals.total} accent="border-[#0b5384]" icon={<Database className="h-4 w-4 text-[#0b5384]" />} />
        <MetricCard title="ACTIVE RECORDS" value={totals.active} accent="border-[#16a34a]" icon={<Activity className="h-4 w-4 text-[#16a34a]" />} />
        <MetricCard title="ACTIVE INTEGRATIONS" value={governanceHealth.activeIntegrations} accent="border-[#0284c7]" icon={<Cloud className="h-4 w-4 text-[#0284c7]" />} />
        <MetricCard title="FAILED NOTIFICATIONS" value={notificationStats.failed} accent="border-[#dc2626]" icon={<BellRing className="h-4 w-4 text-[#dc2626]" />} />
      </section>

      <section className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <article className="rounded-[4px] border border-[#cbd5e1] bg-white p-5 shadow-sm xl:col-span-2">
          <div className="flex items-center gap-2">
            <ServerCog className="h-4 w-4 text-[#0b5a8c]" />
            <h2 className={pageHeadingStyles.sectionTitle}>Cloud & Storage Overview</h2>
          </div>

          <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="rounded-[4px] border border-[#e2e8f0] bg-slate-50 p-4">
              <p className="text-[11px] font-extrabold uppercase tracking-[0.08em] text-slate-600">Supabase</p>
              <p className="mt-2 text-[13px] font-semibold text-slate-700">Endpoint: {integrationSettings.supabase.endpointValue}</p>
              <p className="mt-1 text-[12px] text-slate-600">Status: <span className="font-bold text-slate-800">{integrationSettings.supabase.connectionStatus}</span></p>
              <p className="mt-1 text-[12px] text-slate-600">API Key: <span className="font-mono text-[11px]">{integrationSettings.supabase.apiKeyMasked}</span></p>
            </div>

            <div className="rounded-[4px] border border-[#e2e8f0] bg-slate-50 p-4">
              <p className="text-[11px] font-extrabold uppercase tracking-[0.08em] text-slate-600">Email Provider</p>
              <p className="mt-2 text-[13px] font-semibold text-slate-700">Provider: {integrationSettings.email.provider}</p>
              <p className="mt-1 text-[12px] text-slate-600">Sender: <span className="font-bold text-slate-800">{integrationSettings.email.endpointValue}</span></p>
              <p className="mt-1 text-[12px] text-slate-600">Status: <span className="font-bold text-slate-800">{integrationSettings.email.connectionStatus}</span></p>
            </div>

            <div className="rounded-[4px] border border-[#e2e8f0] bg-white p-4 md:col-span-2">
              <div className="flex items-center gap-2">
                <HardDriveDownload className="h-4 w-4 text-[#0b5a8c]" />
                <p className="text-[11px] font-extrabold uppercase tracking-[0.08em] text-slate-600">Storage Buckets</p>
              </div>

              <div className="mt-3 space-y-3">
                <StorageBar
                  label={integrationSettings.storage.buckets.attachments}
                  used={`${storageOverview.attachmentUsedGb} GB`}
                  limit={`${integrationSettings.storage.uploadLimitMb} MB/upload`}
                  percent={storageOverview.attachmentsPercent}
                />
                <StorageBar
                  label={integrationSettings.storage.buckets.reports}
                  used={`${storageOverview.reportsUsedGb} GB`}
                  limit={`${integrationSettings.storage.uploadLimitMb} MB/upload`}
                  percent={storageOverview.reportsPercent}
                />
              </div>

              <p className="mt-3 text-[11px] text-slate-500">
                Allowed file types: <span className="font-semibold text-slate-700">{integrationSettings.storage.allowedFileTypes.join(', ')}</span>
              </p>
            </div>
          </div>
        </article>

        <article className="rounded-[4px] border border-[#cbd5e1] bg-white p-5 shadow-sm">
          <div className="flex items-center gap-2">
            <KeyRound className="h-4 w-4 text-[#0b5a8c]" />
            <h2 className={pageHeadingStyles.sectionTitle}>Security Posture</h2>
          </div>

          <div className="mt-4 space-y-3 text-[12px] text-slate-700">
            <p>Password Min Length: <span className="font-bold">{securitySettings.password.minLength}</span></p>
            <p>OTP: <span className="font-bold">{securitySettings.otp.enabled ? `Enabled (${securitySettings.otp.channel})` : 'Disabled'}</span></p>
            <p>MFA: <span className="font-bold">{securitySettings.mfa.enabled ? `Enabled (${securitySettings.mfa.requiredRoles.join(', ')})` : 'Disabled'}</span></p>
            <p>Session Timeout: <span className="font-bold">{securitySettings.session.timeoutMinutes} mins</span></p>
            <p>IP Restrictions: <span className="font-bold">{securitySettings.ipRestrictions.enabled ? 'Enabled' : 'Disabled'}</span></p>
            <p>Queued Notifications: <span className="font-bold">{notificationStats.queued}</span></p>
          </div>
        </article>
      </section>

      <section className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <article className="rounded-[4px] border border-[#cbd5e1] bg-white p-5 shadow-sm xl:col-span-2">
          <div className="flex items-center justify-between">
            <h2 className={pageHeadingStyles.sectionTitle}>Recent Activity</h2>
            <button
              type="button"
              onClick={() => navigate('/system-admin/activity-logs')}
              className="rounded-[3px] border border-[#cbd5e1] bg-slate-50 px-2.5 py-1 text-[11px] font-bold text-[#0b5384]"
            >
              Open Activity Logs
            </button>
          </div>

          <div className="mt-4 space-y-3">
            {recentActivity.map((log) => (
              <div key={log.id} className="rounded-[3px] border border-[#e2e8f0] bg-slate-50 px-3 py-2">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-[11px] font-extrabold uppercase tracking-[0.08em] text-[#0b5384]">{log.activityType.replaceAll('_', ' ')}</p>
                  <p className="text-[11px] text-slate-500">{new Date(log.timestamp).toLocaleString('en-US')}</p>
                </div>
                <p className="mt-1 text-[12px] text-slate-700"><span className="font-semibold">{log.actor}</span> • {log.details}</p>
              </div>
            ))}
          </div>
        </article>

        <article className="rounded-[4px] border border-[#cbd5e1] bg-white p-5 shadow-sm">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-[#0b5a8c]" />
            <h2 className={pageHeadingStyles.sectionTitle}>Governance Signals</h2>
          </div>

          <div className="mt-4 space-y-3 text-[12px] text-slate-700">
            <p>Logging Modules Enabled: <span className="font-bold">{governanceHealth.loggingEnabledModules}</span></p>
            <p>Strict Password Policy: <span className="font-bold">{governanceHealth.strictPasswordPolicy ? 'Yes' : 'No'}</span></p>
            <p>Automatic Backup: <span className="font-bold">{governanceHealth.backupEnabled ? 'Enabled' : 'Disabled'}</span></p>
            <p>Notification Failure Count: <span className="font-bold">{governanceHealth.failedNotifications}</span></p>
            <p>Total Notification Logs: <span className="font-bold">{notificationStats.total}</span></p>
          </div>
        </article>
      </section>

      <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {cards.map((card) => (
          <article key={card.id} className="rounded-[4px] border border-[#cbd5e1] bg-white p-5 shadow-sm">
            <p className={pageHeadingStyles.metricLabel}>{card.label.toUpperCase()}</p>
            <p className="mt-2 text-[30px] leading-none font-black text-[#0f172a]">{card.total}</p>
            <p className="mt-2 text-[12px] font-semibold text-slate-600">{card.active} active records</p>
            <button
              type="button"
              onClick={() => navigate(PATH_BY_ENTITY[card.id])}
              className="mt-4 inline-flex min-h-[36px] items-center rounded-[3px] border border-[#cbd5e1] bg-[#f8fafc] px-3 text-[12px] font-bold text-[#0b5384] transition hover:bg-[#eff6ff]"
            >
              Open {card.label}
            </button>
          </article>
        ))}
      </section>
    </div>
  )
}

function MetricCard({
  title,
  value,
  accent,
  icon,
}: {
  title: string
  value: number
  accent: string
  icon?: ReactNode
}) {
  return (
    <div className={`rounded-[4px] border border-[#cbd5e1] border-l-[4px] ${accent} bg-white px-4 py-4 shadow-sm`}>
      {icon ? <div>{icon}</div> : null}
      <p className={pageHeadingStyles.metricLabel}>{title}</p>
      <p className="mt-2 text-[30px] leading-none font-black text-[#0f172a]">{value}</p>
    </div>
  )
}

function StorageBar({
  label,
  used,
  limit,
  percent,
}: {
  label: string
  used: string
  limit: string
  percent: number
}) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-[12px] text-slate-700">
        <span className="font-semibold">{label}</span>
        <span>{used}</span>
      </div>
      <div className="h-2.5 w-full overflow-hidden rounded bg-[#e2e8f0]">
        <div className="h-full bg-[#0b5384]" style={{ width: `${percent}%` }} />
      </div>
      <p className="text-[11px] text-slate-500">Limit: {limit}</p>
    </div>
  )
}
