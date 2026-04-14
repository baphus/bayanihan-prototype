import { useMemo, useState, type ReactNode } from 'react'
import {
  CheckCircle2,
  ClipboardList,
  Clock3,
  Download,
  Flag,
  History,
  KeyRound,
  Mail,
  RefreshCw,
  ShieldCheck,
  UserCheck,
  XCircle,
} from 'lucide-react'
import { type AgencyStatus, getStatusBadgeClass } from '../../pages/agency/statusBadgeStyles'
import { pageHeadingStyles } from '../../pages/agency/pageHeadingStyles'
import type { OversightActivityLog } from '../../data/unifiedData'

type TimelineOption = {
  value: string
  label: string
}

type ActivityTimelineViewProps = {
  pageTitle: string
  pageSubtitle: string
  sectionTitle: string
  exportFileName: string
  searchPlaceholder: string
  logs: OversightActivityLog[]
  activityOptions: TimelineOption[]
  entityOptions?: TimelineOption[]
  defaultFromISO?: string
  defaultToISO?: string
  showStatusFilter?: boolean
  showEntityFilter?: boolean
}

function formatDateTime(timestamp: string): string {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  }).format(new Date(timestamp))
}

function formatDateOnly(timestamp: string): string {
  return new Intl.DateTimeFormat('en-US', {
    month: 'long',
    day: '2-digit',
    year: 'numeric',
  }).format(new Date(timestamp))
}

function formatTimeOnly(timestamp: string): string {
  return new Intl.DateTimeFormat('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  }).format(new Date(timestamp))
}

function formatActivityLabel(type: string): string {
  if (type === 'ACCEPTED' || type === 'COMPLETED' || type === 'REJECTED') {
    return 'STATUS UPDATE'
  }

  if (type === 'MILESTONE_UPDATED') {
    return 'MILESTONE UPDATED'
  }

  return type.replaceAll('_', ' ')
}

function formatLogDetail(log: OversightActivityLog): string {
  if (log.activityType === 'REJECTED') {
    return `Referral was rejected. Remarks: ${log.remarks ?? 'N/A'}`
  }

  if (log.activityType === 'ACCEPTED') {
    return `Referral was accepted. Remarks: ${log.remarks ?? 'N/A'}`
  }

  if (log.activityType === 'COMPLETED') {
    return `Referral was completed. Remarks: ${log.remarks ?? 'N/A'}`
  }

  return log.details
}

function toCsvValue(value: string): string {
  return `"${value.replaceAll('"', '""')}"`
}

function exportLogsAsCsv(rows: OversightActivityLog[], fileName: string): void {
  const header = [
    'Timestamp',
    'Entity',
    'Record ID',
    'Case No',
    'Client Name',
    'Activity Type',
    'Status',
    'Actor',
    'Actor Role',
    'Channel',
    'IP Address',
    'Email Recipient',
    'Details',
    'Remarks',
  ]

  const body = rows.map((row) => {
    return [
      row.timestamp,
      row.entity ?? '',
      row.recordId ?? '',
      row.caseNo ?? '',
      row.clientName ?? '',
      row.activityType,
      row.status ?? '',
      row.actor,
      row.actorRole,
      row.channel,
      row.ipAddress ?? '',
      row.emailRecipient ?? '',
      row.details,
      row.remarks ?? '',
    ]
      .map((value) => toCsvValue(String(value)))
      .join(',')
  })

  const csv = [header.join(','), ...body].join('\n')
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = fileName
  link.click()
  URL.revokeObjectURL(url)
}

function getActivityIcon(activityType: string): ReactNode {
  if (activityType === 'LOGIN_ATTEMPT') {
    return <KeyRound className="h-3.5 w-3.5" />
  }

  if (activityType === 'EMAIL_SENT') {
    return <Mail className="h-3.5 w-3.5" />
  }

  if (activityType === 'ASSIGNED' || activityType === 'CASE_CREATED' || activityType === 'RECORD_CREATED') {
    return <ClipboardList className="h-3.5 w-3.5" />
  }

  if (activityType === 'REFERRAL_SENT' || activityType === 'MILESTONE_UPDATED' || activityType === 'RECORD_UPDATED') {
    return <RefreshCw className="h-3.5 w-3.5" />
  }

  if (activityType === 'ACCEPTED' || activityType === 'USER_LOGIN') {
    return <CheckCircle2 className="h-3.5 w-3.5" />
  }

  if (activityType === 'COMPLETED') {
    return <Flag className="h-3.5 w-3.5" />
  }

  return <XCircle className="h-3.5 w-3.5" />
}

export function ActivityTimelineView({
  pageTitle,
  pageSubtitle,
  sectionTitle,
  exportFileName,
  searchPlaceholder,
  logs,
  activityOptions,
  entityOptions,
  defaultFromISO = '2026-03-01',
  defaultToISO = '2026-04-30',
  showStatusFilter = true,
  showEntityFilter = false,
}: ActivityTimelineViewProps) {
  const [searchValue, setSearchValue] = useState('')
  const [fromDateISO, setFromDateISO] = useState(defaultFromISO)
  const [toDateISO, setToDateISO] = useState(defaultToISO)
  const [statusFilter, setStatusFilter] = useState<'ALL' | AgencyStatus>('ALL')
  const [activityFilter, setActivityFilter] = useState('ALL')
  const [entityFilter, setEntityFilter] = useState('ALL')

  const filteredLogs = useMemo(() => {
    const query = searchValue.trim().toLowerCase()

    return logs.filter((log) => {
      const matchesSearch =
        query.length === 0 ||
        [
          log.caseNo ?? '',
          log.clientName ?? '',
          log.recordId ?? '',
          log.entity ?? '',
          log.actor,
          log.actorRole,
          log.channel,
          log.activityType,
          log.ipAddress ?? '',
          log.emailRecipient ?? '',
          log.details,
          log.remarks ?? '',
        ]
          .join(' ')
          .toLowerCase()
          .includes(query)

      const matchesStatus = !showStatusFilter || statusFilter === 'ALL' || log.status === statusFilter
      const matchesEntity = !showEntityFilter || entityFilter === 'ALL' || log.entity === entityFilter
      const matchesActivity = activityFilter === 'ALL' || log.activityType === activityFilter
      const logDate = log.timestamp.slice(0, 10)
      const matchesDate = logDate >= fromDateISO && logDate <= toDateISO

      return matchesSearch && matchesStatus && matchesEntity && matchesActivity && matchesDate
    })
  }, [activityFilter, entityFilter, fromDateISO, logs, searchValue, showEntityFilter, showStatusFilter, statusFilter, toDateISO])

  const kpis = useMemo(() => {
    const total = filteredLogs.length
    const completed = filteredLogs.filter((log) => log.status === 'COMPLETED').length
    const pending = filteredLogs.filter((log) => log.status === 'PENDING').length
    const processing = filteredLogs.filter((log) => log.status === 'PROCESSING').length

    return {
      total,
      completed,
      pending,
      processing,
    }
  }, [filteredLogs])

  const timelineGroups = useMemo(() => {
    const sorted = [...filteredLogs].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    const grouped: Array<{ date: string; logs: OversightActivityLog[] }> = []

    sorted.forEach((log) => {
      const dateKey = formatDateOnly(log.timestamp)
      const existing = grouped.find((group) => group.date === dateKey)
      if (existing) {
        existing.logs.push(log)
        return
      }

      grouped.push({ date: dateKey, logs: [log] })
    })

    return grouped
  }, [filteredLogs])

  return (
    <div className="mx-auto max-w-7xl space-y-5 pb-4">
      <header className="flex items-center justify-between gap-3">
        <div>
          <h1 className={pageHeadingStyles.pageTitle}>{pageTitle}</h1>
          <p className={pageHeadingStyles.pageSubtitle}>{pageSubtitle}</p>
        </div>
        <button
          type="button"
          onClick={() => exportLogsAsCsv(filteredLogs, exportFileName)}
          className="inline-flex h-9 items-center gap-2 rounded-[3px] border border-[#cbd5e1] bg-white px-3 text-[10px] font-bold uppercase tracking-[0.08em] text-[#0b5a8c]"
        >
          <Download className="h-3.5 w-3.5" />
          Export CSV
        </button>
      </header>

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard title="TOTAL LOGS" value={kpis.total} icon={<History className="h-5 w-5" />} accent="border-[#0b5384]" />
        <KpiCard title="COMPLETED" value={kpis.completed} icon={<ShieldCheck className="h-5 w-5" />} accent="border-[#16a34a]" />
        <KpiCard title="PENDING" value={kpis.pending} icon={<Clock3 className="h-5 w-5" />} accent="border-[#f59e0b]" />
        <KpiCard title="PROCESSING" value={kpis.processing} icon={<UserCheck className="h-5 w-5" />} accent="border-[#0284c7]" />
      </section>

      <section className="border border-[#cbd5e1] bg-white">
        <div className="flex items-center justify-between border-b border-[#cbd5e1] px-4 py-3">
          <h3 className={pageHeadingStyles.sectionTitle}>{sectionTitle}</h3>
        </div>

        <div className="border-b border-[#cbd5e1] bg-[#f8fafc] p-4">
          <div className="flex flex-wrap items-center gap-3">
            <input
              value={searchValue}
              onChange={(event) => setSearchValue(event.target.value)}
              placeholder={searchPlaceholder}
              className="h-10 min-w-[260px] flex-1 rounded-[3px] border border-[#cbd5e1] bg-white px-3 text-[13px] text-slate-700 outline-none"
            />
            <input
              type="date"
              value={fromDateISO}
              onChange={(event) => {
                const nextFrom = event.target.value
                setFromDateISO(nextFrom)
                if (nextFrom > toDateISO) {
                  setToDateISO(nextFrom)
                }
              }}
              className="h-10 min-w-[150px] rounded-[3px] border border-[#cbd5e1] bg-white px-3 text-[12px] text-slate-700 outline-none"
            />
            <input
              type="date"
              value={toDateISO}
              onChange={(event) => {
                const nextTo = event.target.value
                setToDateISO(nextTo)
                if (nextTo < fromDateISO) {
                  setFromDateISO(nextTo)
                }
              }}
              className="h-10 min-w-[150px] rounded-[3px] border border-[#cbd5e1] bg-white px-3 text-[12px] text-slate-700 outline-none"
            />
            {showStatusFilter ? (
              <select
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value as 'ALL' | AgencyStatus)}
                className="h-10 min-w-[160px] rounded-[3px] border border-[#cbd5e1] bg-white px-3 text-[13px] text-slate-700 outline-none"
              >
                <option value="ALL">All statuses</option>
                <option value="PENDING">Pending</option>
                <option value="PROCESSING">Processing</option>
                <option value="COMPLETED">Completed</option>
                <option value="REJECTED">Rejected</option>
              </select>
            ) : null}
            {showEntityFilter ? (
              <select
                value={entityFilter}
                onChange={(event) => setEntityFilter(event.target.value)}
                className="h-10 min-w-[160px] rounded-[3px] border border-[#cbd5e1] bg-white px-3 text-[13px] text-slate-700 outline-none"
              >
                <option value="ALL">All entities</option>
                {(entityOptions ?? []).map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            ) : null}
            <select
              value={activityFilter}
              onChange={(event) => setActivityFilter(event.target.value)}
              className="h-10 min-w-[180px] rounded-[3px] border border-[#cbd5e1] bg-white px-3 text-[13px] text-slate-700 outline-none"
            >
              <option value="ALL">All activities</option>
              {activityOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={() => {
                setSearchValue('')
                setFromDateISO(defaultFromISO)
                setToDateISO(defaultToISO)
                setStatusFilter('ALL')
                setActivityFilter('ALL')
                setEntityFilter('ALL')
              }}
              className="h-10 rounded-[3px] border border-[#cbd5e1] px-3 text-[12px] font-bold text-[#0b5384]"
            >
              Clear
            </button>
          </div>
        </div>

        <div className="p-5">
          {timelineGroups.length === 0 ? (
            <div className="rounded-[3px] border border-dashed border-[#cbd5e1] bg-slate-50 p-8 text-center text-[13px] text-slate-500">
              No activities found for the selected filters.
            </div>
          ) : (
            <div className="space-y-6">
              {timelineGroups.map((group) => (
                <div key={group.date}>
                  <p className="mb-3 text-[10px] font-extrabold uppercase tracking-[0.12em] text-slate-500">{group.date}</p>
                  <div className="relative pl-8">
                    <div className="absolute left-[14px] top-1 bottom-1 w-px bg-[#cbd5e1]" />
                    <div className="space-y-4">
                      {group.logs.map((log) => (
                        <TimelineItem key={log.id} log={log} />
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  )
}

function TimelineItem({ log }: { log: OversightActivityLog }) {
  const identifier = log.caseNo ?? log.recordId ?? 'SYSTEM'
  const subject = log.clientName ?? 'System Record'

  return (
    <div className="relative">
      <div className="absolute left-[-18px] top-4 h-2.5 w-2.5 -translate-x-1/2 rounded-full border border-white bg-[#0b5384]" />
      <article className="rounded-[3px] border border-[#e2e8f0] bg-white p-3">
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1 rounded-[2px] border border-[#cbd5e1] bg-slate-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.06em] text-slate-600">
              {getActivityIcon(log.activityType)}
              {formatActivityLabel(log.activityType)}
            </span>
            {log.status ? (
              <span className={`inline-flex rounded-[2px] border px-2 py-0.5 text-[10px] font-extrabold tracking-wide ${getStatusBadgeClass(log.status)}`}>
                {log.status}
              </span>
            ) : null}
            {log.entity ? (
              <span className="inline-flex rounded-[2px] border border-[#cbd5e1] bg-white px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wide text-slate-600">
                {log.entity}
              </span>
            ) : null}
            <span className="text-[10px] font-semibold uppercase tracking-[0.06em] text-slate-500">{identifier}</span>
            <span className="text-[10px] text-slate-500">• {subject}</span>
          </div>

          <p className="text-[12px] leading-5 text-slate-700">
            <span className="font-semibold">{log.actor}</span> ({log.actorRole}) • {formatLogDetail(log)}
          </p>

          {(log.ipAddress || log.emailRecipient) ? (
            <div className="flex flex-wrap items-center gap-2 text-[10px] text-slate-500">
              {log.ipAddress ? (
                <span className="inline-flex rounded-[2px] border border-[#cbd5e1] bg-white px-2 py-0.5 font-semibold">
                  IP: {log.ipAddress}
                </span>
              ) : null}
              {log.emailRecipient ? (
                <span className="inline-flex rounded-[2px] border border-[#cbd5e1] bg-white px-2 py-0.5 font-semibold">
                  To: {log.emailRecipient}
                </span>
              ) : null}
            </div>
          ) : null}

          <div className="flex items-center gap-3 text-[10px] text-slate-500">
            <span>{formatTimeOnly(log.timestamp)}</span>
            <span>•</span>
            <span>{log.channel}</span>
            <span>•</span>
            <span>{formatDateTime(log.timestamp)}</span>
          </div>
        </div>
      </article>
    </div>
  )
}

function KpiCard({
  title,
  value,
  icon,
  accent,
}: {
  title: string
  value: number
  icon: ReactNode
  accent: string
}) {
  return (
    <div className={`rounded-[4px] border border-[#cbd5e1] border-l-[4px] ${accent} bg-white px-4 py-4 shadow-sm`}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className={pageHeadingStyles.metricLabel}>{title}</p>
          <p className="mt-2 text-[30px] leading-none font-black text-[#0f172a]">{value}</p>
        </div>
        <span className="text-slate-400">{icon}</span>
      </div>
    </div>
  )
}