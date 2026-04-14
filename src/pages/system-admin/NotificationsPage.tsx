import { useMemo, useState } from 'react'
import { Download } from 'lucide-react'
import { UnifiedTable, type Column, type FilterChip } from '../../components/ui/UnifiedTable'
import { pageHeadingStyles } from '../agency/pageHeadingStyles'
import AppToggle from '../../components/ui/AppToggle'
import SystemSettingField from '../../components/ui/SystemSettingField'
import {
  addSystemAdminNotificationDeliveryLog,
  getSystemAdminNotificationDeliveryLogs,
  getSystemAdminNotificationSettings,
  updateSystemAdminNotificationSettings,
  type NotificationDeliveryLog,
  type NotificationDeliveryStatus,
  type NotificationTriggerKey,
  type SystemAdminNotificationSettings,
} from '../../data/unifiedData'
import { exportToCsv, type ExportColumn } from '../../utils/export/exportCsv'
import { exportToPdf } from '../../utils/export/exportPdf'
import { validateTemplatePlaceholders } from '../../utils/systemAdminValidation'

const TEMPLATE_KEYS = ['case_id', 'client_name', 'milestone', 'agency_name']

function toTriggerLabel(trigger: NotificationTriggerKey): string {
  return trigger.replaceAll('_', ' ')
}

export default function NotificationsPage() {
  const [settings, setSettings] = useState<SystemAdminNotificationSettings>(() => getSystemAdminNotificationSettings())
  const [logs, setLogs] = useState<NotificationDeliveryLog[]>(() => getSystemAdminNotificationDeliveryLogs())
  const [activeTrigger, setActiveTrigger] = useState<NotificationTriggerKey>('CASE_REGISTERED')
  const [searchValue, setSearchValue] = useState('')
  const [statusFilter, setStatusFilter] = useState<'ALL' | NotificationDeliveryStatus>('ALL')
  const [triggerFilter, setTriggerFilter] = useState<'ALL' | NotificationTriggerKey>('ALL')
  const [isFilterOpen, setIsFilterOpen] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [rowsPerPage, setRowsPerPage] = useState(10)
  const [validationError, setValidationError] = useState<string | null>(null)
  const [message, setMessage] = useState('')

  const triggerEntries = useMemo(() => Object.entries(settings.triggers) as Array<[NotificationTriggerKey, SystemAdminNotificationSettings['triggers'][NotificationTriggerKey]]>, [settings])

  const activeTemplate = settings.triggers[activeTrigger]

  const filteredLogs = useMemo(() => {
    const query = searchValue.trim().toLowerCase()

    return logs.filter((item) => {
      const matchesSearch =
        query.length === 0 ||
        [item.recipient, item.message, item.trigger, item.status].join(' ').toLowerCase().includes(query)

      const matchesStatus = statusFilter === 'ALL' || item.status === statusFilter
      const matchesTrigger = triggerFilter === 'ALL' || item.trigger === triggerFilter
      return matchesSearch && matchesStatus && matchesTrigger
    })
  }, [logs, searchValue, statusFilter, triggerFilter])

  const totalRecords = filteredLogs.length
  const totalPages = Math.max(1, Math.ceil(totalRecords / rowsPerPage))
  const safePage = Math.min(currentPage, totalPages)
  const startIndex = totalRecords === 0 ? 0 : (safePage - 1) * rowsPerPage + 1
  const endIndex = totalRecords === 0 ? 0 : Math.min(safePage * rowsPerPage, totalRecords)

  const paginatedLogs = useMemo(() => {
    const start = (safePage - 1) * rowsPerPage
    return filteredLogs.slice(start, start + rowsPerPage)
  }, [filteredLogs, safePage, rowsPerPage])

  const activeFilters: FilterChip[] = useMemo(() => {
    const chips: FilterChip[] = []
    if (statusFilter !== 'ALL') {
      chips.push({ key: 'status', label: 'Status', value: statusFilter })
    }

    if (triggerFilter !== 'ALL') {
      chips.push({ key: 'trigger', label: 'Trigger', value: toTriggerLabel(triggerFilter) })
    }

    return chips
  }, [statusFilter, triggerFilter])

  const statusSummary = useMemo(() => {
    return {
      sent: logs.filter((item) => item.status === 'SENT').length,
      failed: logs.filter((item) => item.status === 'FAILED').length,
      queued: logs.filter((item) => item.status === 'QUEUED').length,
    }
  }, [logs])

  const logColumns: Column<NotificationDeliveryLog>[] = [
    {
      key: 'timestamp',
      title: 'TIMESTAMP',
      render: (row) => <span className="text-[12px] text-slate-600">{new Date(row.timestamp).toLocaleString('en-US')}</span>,
    },
    {
      key: 'trigger',
      title: 'TRIGGER',
      render: (row) => <span className="text-[11px] font-bold uppercase tracking-wider text-slate-600">{toTriggerLabel(row.trigger)}</span>,
    },
    {
      key: 'recipient',
      title: 'RECIPIENT',
      render: (row) => <span className="text-[12px] text-slate-700">{row.recipient}</span>,
    },
    {
      key: 'status',
      title: 'STATUS',
      render: (row) => (
        <span
          className={`inline-flex rounded-[2px] border px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wide ${
            row.status === 'SENT'
              ? 'border-[#bbf7d0] bg-[#dcfce7] text-[#166534]'
              : row.status === 'FAILED'
                ? 'border-[#fecaca] bg-[#fee2e2] text-[#b91c1c]'
                : 'border-[#bae6fd] bg-[#e0f2fe] text-[#075985]'
          }`}
        >
          {row.status}
        </span>
      ),
    },
    {
      key: 'message',
      title: 'MESSAGE',
      render: (row) => <span className="text-[12px] text-slate-600">{row.message}</span>,
    },
  ]

  const exportColumns: ExportColumn<NotificationDeliveryLog>[] = [
    { header: 'Timestamp', accessor: (row) => row.timestamp },
    { header: 'Trigger', accessor: (row) => row.trigger },
    { header: 'Recipient', accessor: (row) => row.recipient },
    { header: 'Status', accessor: (row) => row.status },
    { header: 'Message', accessor: (row) => row.message },
  ]

  const saveNotificationSettings = () => {
    const triggerConfig = settings.triggers[activeTrigger]
    const subjectError = validateTemplatePlaceholders(triggerConfig.template.subject, TEMPLATE_KEYS)
    const bodyError = validateTemplatePlaceholders(triggerConfig.template.body, TEMPLATE_KEYS)
    const error = subjectError ?? bodyError
    setValidationError(error)

    if (error) {
      return
    }

    updateSystemAdminNotificationSettings(settings)
    addSystemAdminNotificationDeliveryLog({
      timestamp: new Date().toISOString(),
      trigger: activeTrigger,
      recipient: 'system-admin@bayanihan.gov.ph',
      status: 'QUEUED',
      message: 'Template settings updated and queued for propagation.',
    })
    setLogs(getSystemAdminNotificationDeliveryLogs())
    setMessage('Notification settings saved.')
  }

  return (
    <div className="mx-auto max-w-7xl space-y-5 pb-6">
      <header>
        <h1 className={pageHeadingStyles.pageTitle}>Notifications</h1>
        <p className={pageHeadingStyles.pageSubtitle}>Configure trigger-based emails and monitor delivery outcomes.</p>
      </header>

      {message ? (
        <section className="rounded-[4px] border border-[#bfdbfe] bg-[#eff6ff] px-4 py-3 text-[13px] font-semibold text-[#1d4ed8]">
          {message}
        </section>
      ) : null}

      <section className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <article className="rounded-[4px] border border-[#cbd5e1] bg-white p-5 shadow-sm space-y-4 xl:col-span-2">
          <h2 className={pageHeadingStyles.sectionTitle}>Trigger Configuration</h2>

          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            {triggerEntries.map(([trigger, config]) => (
              <div key={trigger} className="rounded-[3px] border border-[#e2e8f0] bg-slate-50 px-3 py-3 space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <button
                    type="button"
                    onClick={() => setActiveTrigger(trigger)}
                    className={`text-[11px] font-extrabold uppercase tracking-[0.08em] ${activeTrigger === trigger ? 'text-[#0b5384]' : 'text-slate-600'}`}
                  >
                    {toTriggerLabel(trigger)}
                  </button>
                  <AppToggle
                    checked={config.enabled}
                    onChange={(value) =>
                      setSettings((prev) => ({
                        ...prev,
                        triggers: {
                          ...prev.triggers,
                          [trigger]: { ...prev.triggers[trigger], enabled: value },
                        },
                      }))
                    }
                  />
                </div>
                <p className="text-[12px] text-slate-500">{config.template.subject}</p>
              </div>
            ))}
          </div>

          <div className="rounded-[3px] border border-[#e2e8f0] bg-white p-4 space-y-3">
            <h3 className="text-[12px] font-bold uppercase tracking-[0.08em] text-slate-700">Edit Template: {toTriggerLabel(activeTrigger)}</h3>

            <SystemSettingField
              label="Subject"
              helpText="Allowed placeholders: {{case_id}}, {{client_name}}, {{milestone}}, {{agency_name}}"
              error={validationError}
            >
              <input
                value={activeTemplate.template.subject}
                onChange={(event) =>
                  setSettings((prev) => ({
                    ...prev,
                    triggers: {
                      ...prev.triggers,
                      [activeTrigger]: {
                        ...prev.triggers[activeTrigger],
                        template: {
                          ...prev.triggers[activeTrigger].template,
                          subject: event.target.value,
                        },
                      },
                    },
                  }))
                }
                className="h-10 w-full rounded-[3px] border border-[#cbd5e1] px-3 text-[13px] text-slate-700 outline-none"
              />
            </SystemSettingField>

            <SystemSettingField label="Body">
              <textarea
                rows={5}
                value={activeTemplate.template.body}
                onChange={(event) =>
                  setSettings((prev) => ({
                    ...prev,
                    triggers: {
                      ...prev.triggers,
                      [activeTrigger]: {
                        ...prev.triggers[activeTrigger],
                        template: {
                          ...prev.triggers[activeTrigger].template,
                          body: event.target.value,
                        },
                      },
                    },
                  }))
                }
                className="w-full rounded-[3px] border border-[#cbd5e1] px-3 py-2 text-[13px] text-slate-700 outline-none"
              />
            </SystemSettingField>

            <div className="flex justify-end">
              <button
                type="button"
                onClick={saveNotificationSettings}
                className="h-9 rounded-[3px] bg-[#0b5384] px-3 text-[12px] font-bold text-white hover:bg-[#09416a]"
              >
                Save Notification Settings
              </button>
            </div>
          </div>
        </article>

        <article className="rounded-[4px] border border-[#cbd5e1] bg-white p-5 shadow-sm">
          <h2 className={pageHeadingStyles.sectionTitle}>Delivery Snapshot</h2>
          <div className="mt-3 space-y-2">
            <p className="text-[12px] text-slate-600">Sent: <span className="font-bold text-slate-800">{statusSummary.sent}</span></p>
            <p className="text-[12px] text-slate-600">Failed: <span className="font-bold text-[#b91c1c]">{statusSummary.failed}</span></p>
            <p className="text-[12px] text-slate-600">Queued: <span className="font-bold text-[#0369a1]">{statusSummary.queued}</span></p>
          </div>
          <div className="mt-4 rounded-[3px] border border-[#e2e8f0] bg-slate-50 p-3 text-[12px] text-slate-600">
            Placeholder keys:
            <div className="mt-2 flex flex-wrap gap-1">
              {TEMPLATE_KEYS.map((key) => (
                <span key={key} className="rounded-[2px] border border-[#cbd5e1] bg-white px-2 py-0.5 text-[11px] font-semibold text-slate-700">
                  {'{{'}{key}{'}}'}
                </span>
              ))}
            </div>
          </div>
        </article>
      </section>

      <section className="rounded-[4px] border border-[#cbd5e1] bg-white p-4 shadow-sm space-y-3">
        <div className="flex items-center justify-between gap-2">
          <h2 className={pageHeadingStyles.sectionTitle}>Notification Delivery Logs</h2>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => exportToCsv(filteredLogs, exportColumns, 'notification-logs.csv')}
              className="inline-flex h-8 items-center gap-2 rounded-[3px] border border-[#cbd5e1] bg-white px-3 text-[10px] font-bold uppercase tracking-[0.08em] text-[#0b5a8c]"
            >
              <Download className="h-3.5 w-3.5" />
              Export CSV
            </button>
            <button
              type="button"
              onClick={() => exportToPdf(filteredLogs, exportColumns, 'notification-logs.pdf', { title: 'Notification Delivery Logs' })}
              className="inline-flex h-8 items-center gap-2 rounded-[3px] border border-[#cbd5e1] bg-white px-3 text-[10px] font-bold uppercase tracking-[0.08em] text-[#0b5a8c]"
            >
              <Download className="h-3.5 w-3.5" />
              Export PDF
            </button>
          </div>
        </div>

        <UnifiedTable
          data={paginatedLogs}
          columns={logColumns}
          keyExtractor={(row) => row.id}
          totalRecords={totalRecords}
          startIndex={startIndex}
          endIndex={endIndex}
          currentPage={safePage}
          totalPages={totalPages}
          rowsPerPage={rowsPerPage}
          rowsPerPageOptions={[10, 25, 50]}
          onPageChange={(page) => setCurrentPage(Math.min(Math.max(page, 1), totalPages))}
          onRowsPerPageChange={(rowsCount) => {
            setRowsPerPage(rowsCount)
            setCurrentPage(1)
          }}
          searchPlaceholder="Search recipient, trigger, status, or message..."
          searchValue={searchValue}
          onSearchChange={(value) => {
            setSearchValue(value)
            setCurrentPage(1)
          }}
          onAdvancedFilters={() => setIsFilterOpen((prev) => !prev)}
          isAdvancedFiltersOpen={isFilterOpen}
          activeFilters={activeFilters}
          onRemoveFilter={(filter) => {
            if (filter.key === 'status') {
              setStatusFilter('ALL')
            }

            if (filter.key === 'trigger') {
              setTriggerFilter('ALL')
            }
            setCurrentPage(1)
          }}
          onClearFilters={() => {
            setStatusFilter('ALL')
            setTriggerFilter('ALL')
            setCurrentPage(1)
          }}
          advancedFiltersContent={(
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-[14px] font-bold text-slate-800">Apply Filters</h3>
                <button type="button" onClick={() => setIsFilterOpen(false)} className="text-slate-400 hover:text-slate-600">
                  <span className="material-symbols-outlined text-[18px]">close</span>
                </button>
              </div>

              <div>
                <label className="mb-1.5 block text-[12px] font-bold uppercase tracking-wider text-[#64748b]">Status</label>
                <select
                  value={statusFilter}
                  onChange={(event) => {
                    setStatusFilter(event.target.value as 'ALL' | NotificationDeliveryStatus)
                    setCurrentPage(1)
                  }}
                  className="w-full rounded-[3px] border border-[#cbd5e1] bg-slate-50 px-3 py-2 text-[13px] font-bold text-slate-700 outline-none"
                >
                  <option value="ALL">All</option>
                  <option value="SENT">Sent</option>
                  <option value="FAILED">Failed</option>
                  <option value="QUEUED">Queued</option>
                </select>
              </div>

              <div>
                <label className="mb-1.5 block text-[12px] font-bold uppercase tracking-wider text-[#64748b]">Trigger</label>
                <select
                  value={triggerFilter}
                  onChange={(event) => {
                    setTriggerFilter(event.target.value as 'ALL' | NotificationTriggerKey)
                    setCurrentPage(1)
                  }}
                  className="w-full rounded-[3px] border border-[#cbd5e1] bg-slate-50 px-3 py-2 text-[13px] font-bold text-slate-700 outline-none"
                >
                  <option value="ALL">All</option>
                  {triggerEntries.map(([trigger]) => (
                    <option key={trigger} value={trigger}>{toTriggerLabel(trigger)}</option>
                  ))}
                </select>
              </div>
            </div>
          )}
        />
      </section>
    </div>
  )
}
