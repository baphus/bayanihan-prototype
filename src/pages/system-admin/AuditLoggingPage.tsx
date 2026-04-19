import { useMemo, useState } from 'react'
import { Download } from 'lucide-react'
import { UnifiedTable, type Column, type FilterChip } from '../../components/ui/UnifiedTable'
import { pageHeadingStyles } from '../agency/pageHeadingStyles'
import AppToggle from '../../components/ui/AppToggle'
import SystemSettingField from '../../components/ui/SystemSettingField'
import ConfirmDialog from '../../components/ui/ConfirmDialog'
import {
  buildSystemAdminOversightActivityLogs,
  getSystemAdminAuditSettings,
  updateSystemAdminAuditSettings,
  type AdminLogLevel,
  type AdminLogModuleKey,
  type OversightActivityLog,
  type SystemAdminAuditSettings,
} from '../../data/unifiedData'
import { exportToCsv, type ExportColumn } from '../../utils/export/exportCsv'
import { exportToPdf } from '../../utils/export/exportPdf'
import { validateRetentionDays } from '../../utils/systemAdminValidation'

type AuditPreviewRow = {
  id: string
  timestamp: string
  module: AdminLogModuleKey
  level: AdminLogLevel
  actor: string
  activity: string
  status: string
  details: string
}

const MODULE_LABELS: Record<AdminLogModuleKey, string> = {
  authentication: 'Authentication',
  referrals: 'Referrals',
  caseUpdates: 'Case Updates',
  notifications: 'Notifications',
  integrations: 'Integrations',
  security: 'Security',
}

const LEVEL_ORDER: Record<AdminLogLevel, number> = {
  INFO: 1,
  WARNING: 2,
  ERROR: 3,
  CRITICAL: 4,
}

function inferModule(log: OversightActivityLog): AdminLogModuleKey {
  if (log.activityType === 'LOGIN_ATTEMPT' || log.activityType === 'USER_LOGIN') {
    return 'authentication'
  }

  if (log.activityType === 'EMAIL_SENT') {
    return 'notifications'
  }

  if (log.entity === 'services') {
    return 'integrations'
  }

  if (log.activityType === 'REFERRAL_SENT' || log.activityType === 'ASSIGNED' || log.activityType === 'ACCEPTED' || log.activityType === 'COMPLETED' || log.activityType === 'REJECTED') {
    return 'referrals'
  }

  if (log.activityType === 'MILESTONE_UPDATED' || log.activityType === 'STATUS_CHANGED') {
    return 'caseUpdates'
  }

  return 'security'
}

function inferLevel(log: OversightActivityLog): AdminLogLevel {
  if (log.activityType === 'LOGIN_ATTEMPT' && log.status === 'REJECTED') {
    return 'WARNING'
  }

  if (log.activityType === 'REJECTED' || log.activityType === 'STATUS_CHANGED') {
    return 'ERROR'
  }

  if (log.activityType === 'RECORD_UPDATED' && log.status === 'REJECTED') {
    return 'CRITICAL'
  }

  return 'INFO'
}

export default function AuditLoggingPage() {
  const [settings, setSettings] = useState<SystemAdminAuditSettings>(() => getSystemAdminAuditSettings())
  const [retentionError, setRetentionError] = useState<string | null>(null)
  const [message, setMessage] = useState('')
  const [isConfirmOpen, setIsConfirmOpen] = useState(false)
  const [pendingSettings, setPendingSettings] = useState<SystemAdminAuditSettings | null>(null)

  const [searchValue, setSearchValue] = useState('')
  const [levelFilter, setLevelFilter] = useState<'ALL' | AdminLogLevel>('ALL')
  const [moduleFilter, setModuleFilter] = useState<'ALL' | AdminLogModuleKey>('ALL')
  const [isFilterOpen, setIsFilterOpen] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [rowsPerPage, setRowsPerPage] = useState(10)

  const logs = useMemo(() => buildSystemAdminOversightActivityLogs(), [])

  const previewRows = useMemo<AuditPreviewRow[]>(() => {
    return logs.map((log) => ({
      id: log.id,
      timestamp: log.timestamp,
      module: inferModule(log),
      level: inferLevel(log),
      actor: log.actor,
      activity: log.activityType,
      status: log.status ?? 'COMPLETED',
      details: log.details,
    }))
  }, [logs])

  const filteredRows = useMemo(() => {
    const query = searchValue.trim().toLowerCase()
    const minimumLevel = LEVEL_ORDER[settings.level]

    return previewRows.filter((row) => {
      if (!settings.modules[row.module]) {
        return false
      }

      if (LEVEL_ORDER[row.level] < minimumLevel) {
        return false
      }

      const matchesSearch =
        query.length === 0 ||
        [row.actor, row.activity, row.details, row.status, row.module, row.level].join(' ').toLowerCase().includes(query)

      const matchesLevel = levelFilter === 'ALL' || row.level === levelFilter
      const matchesModule = moduleFilter === 'ALL' || row.module === moduleFilter

      return matchesSearch && matchesLevel && matchesModule
    })
  }, [previewRows, searchValue, levelFilter, moduleFilter, settings])

  const totalRecords = filteredRows.length
  const totalPages = Math.max(1, Math.ceil(totalRecords / rowsPerPage))
  const safePage = Math.min(currentPage, totalPages)
  const startIndex = totalRecords === 0 ? 0 : (safePage - 1) * rowsPerPage + 1
  const endIndex = totalRecords === 0 ? 0 : Math.min(safePage * rowsPerPage, totalRecords)

  const paginatedRows = useMemo(() => {
    const start = (safePage - 1) * rowsPerPage
    return filteredRows.slice(start, start + rowsPerPage)
  }, [filteredRows, safePage, rowsPerPage])

  const activeFilters: FilterChip[] = useMemo(() => {
    const chips: FilterChip[] = []

    if (levelFilter !== 'ALL') {
      chips.push({ key: 'level', label: 'Level', value: levelFilter })
    }

    if (moduleFilter !== 'ALL') {
      chips.push({ key: 'module', label: 'Module', value: MODULE_LABELS[moduleFilter] })
    }

    return chips
  }, [levelFilter, moduleFilter])

  const columns: Column<AuditPreviewRow>[] = [
    {
      key: 'timestamp',
      title: 'TIMESTAMP',
      render: (row) => <span className="text-[12px] text-slate-600">{new Date(row.timestamp).toLocaleString('en-US')}</span>,
    },
    {
      key: 'module',
      title: 'MODULE',
      render: (row) => <span className="text-[11px] font-bold uppercase tracking-wider text-slate-700">{MODULE_LABELS[row.module]}</span>,
    },
    {
      key: 'actor',
      title: 'ACTOR',
      render: (row) => <span className="text-[12px] text-slate-700">{row.actor}</span>,
    },
    {
      key: 'activity',
      title: 'ACTIVITY',
      render: (row) => <span className="text-[11px] font-bold uppercase tracking-wider text-slate-600">{row.activity.replaceAll('_', ' ')}</span>,
    },
    {
      key: 'details',
      title: 'DETAILS',
      render: (row) => <span className="text-[12px] text-slate-600">{row.details}</span>,
    },
  ]

  const exportColumns: ExportColumn<AuditPreviewRow>[] = [
    { header: 'Timestamp', accessor: (row) => row.timestamp },
    { header: 'Module', accessor: (row) => MODULE_LABELS[row.module] },
    { header: 'Level', accessor: (row) => row.level },
    { header: 'Actor', accessor: (row) => row.actor },
    { header: 'Activity', accessor: (row) => row.activity },
    { header: 'Status', accessor: (row) => row.status },
    { header: 'Details', accessor: (row) => row.details },
  ]

  const saveAuditSettings = (nextSettings: SystemAdminAuditSettings) => {
    updateSystemAdminAuditSettings(nextSettings)
    setSettings(getSystemAdminAuditSettings())
    setMessage('Audit and logging settings saved.')
  }

  const handleSave = () => {
    const retentionValidation = validateRetentionDays(settings.retentionDays)
    setRetentionError(retentionValidation)
    if (retentionValidation) {
      return
    }

    if (settings.retentionPolicy === 'DELETE') {
      setPendingSettings(settings)
      setIsConfirmOpen(true)
      return
    }

    saveAuditSettings(settings)
  }

  return (
    <div className="mx-auto max-w-7xl space-y-5 pb-6">
      <header>
        <h1 className={pageHeadingStyles.pageTitle}>Audit & Logging</h1>
        <p className={pageHeadingStyles.pageSubtitle}>Control audit coverage, severity thresholds, and retention policy for governance logs.</p>
      </header>

      {message ? (
        <section className="rounded-[4px] border border-[#bfdbfe] bg-[#eff6ff] px-4 py-3 text-[13px] font-semibold text-[#1d4ed8]">
          {message}
        </section>
      ) : null}

      <section className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <article className="rounded-[4px] border border-[#cbd5e1] bg-white p-5 shadow-sm space-y-4 xl:col-span-2">
          <h2 className={pageHeadingStyles.sectionTitle}>Module Coverage</h2>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            {(Object.keys(settings.modules) as AdminLogModuleKey[]).map((moduleKey) => (
              <div key={moduleKey} className="rounded-[3px] border border-[#e2e8f0] bg-slate-50 px-3 py-3">
                <AppToggle
                  checked={settings.modules[moduleKey]}
                  onChange={(value) =>
                    setSettings((prev) => ({
                      ...prev,
                      modules: {
                        ...prev.modules,
                        [moduleKey]: value,
                      },
                    }))
                  }
                  label={MODULE_LABELS[moduleKey]}
                />
              </div>
            ))}
          </div>
        </article>

        <article className="rounded-[4px] border border-[#cbd5e1] bg-white p-5 shadow-sm space-y-4">
          <h2 className={pageHeadingStyles.sectionTitle}>Retention Policy</h2>

          <SystemSettingField label="Minimum Log Level" tooltip="Only events at or above this level are retained.">
            <select
              value={settings.level}
              onChange={(event) => setSettings((prev) => ({ ...prev, level: event.target.value as AdminLogLevel }))}
              className="h-10 w-full rounded-[3px] border border-[#cbd5e1] px-3 text-[13px] text-slate-700 outline-none"
            >
              <option value="INFO">Info</option>
              <option value="WARNING">Warning</option>
              <option value="ERROR">Error</option>
              <option value="CRITICAL">Critical</option>
            </select>
          </SystemSettingField>

          <SystemSettingField
            label="Retention Days"
            tooltip="How long logs are kept before retention policy runs."
            error={retentionError}
          >
            <input
              type="number"
              min={1}
              max={3650}
              value={settings.retentionDays}
              onChange={(event) => setSettings((prev) => ({ ...prev, retentionDays: Number(event.target.value) }))}
              className="h-10 w-full rounded-[3px] border border-[#cbd5e1] px-3 text-[13px] text-slate-700 outline-none"
            />
          </SystemSettingField>

          <SystemSettingField label="Retention Action" tooltip="Archive preserves snapshots, delete permanently removes expired logs.">
            <select
              value={settings.retentionPolicy}
              onChange={(event) => setSettings((prev) => ({ ...prev, retentionPolicy: event.target.value as SystemAdminAuditSettings['retentionPolicy'] }))}
              className="h-10 w-full rounded-[3px] border border-[#cbd5e1] px-3 text-[13px] text-slate-700 outline-none"
            >
              <option value="ARCHIVE">Archive Expired Logs</option>
              <option value="DELETE">Delete Expired Logs</option>
            </select>
          </SystemSettingField>
        </article>
      </section>

      <section className="rounded-[4px] border border-[#cbd5e1] bg-white p-4 shadow-sm space-y-3">
        <div className="flex items-center justify-between gap-2">
          <h2 className={pageHeadingStyles.sectionTitle}>Audit Stream Preview</h2>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => exportToCsv(filteredRows, exportColumns, 'audit-logging-preview.csv')}
              className="inline-flex h-8 items-center gap-2 rounded-[3px] border border-[#cbd5e1] bg-white px-3 text-[10px] font-bold uppercase tracking-[0.08em] text-[#0b5a8c]"
            >
              <Download className="h-3.5 w-3.5" />
              Export CSV
            </button>
            <button
              type="button"
              onClick={() => exportToPdf(filteredRows, exportColumns, 'audit-logging-preview.pdf', { title: 'Audit Stream Preview' })}
              className="inline-flex h-8 items-center gap-2 rounded-[3px] border border-[#cbd5e1] bg-white px-3 text-[10px] font-bold uppercase tracking-[0.08em] text-[#0b5a8c]"
            >
              <Download className="h-3.5 w-3.5" />
              Export PDF
            </button>
          </div>
        </div>

        <UnifiedTable
          data={paginatedRows}
          columns={columns}
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
          searchPlaceholder="Search actor, module, activity, status, or details..."
          searchValue={searchValue}
          onSearchChange={(value) => {
            setSearchValue(value)
            setCurrentPage(1)
          }}
          onAdvancedFilters={() => setIsFilterOpen((prev) => !prev)}
          isAdvancedFiltersOpen={isFilterOpen}
          activeFilters={activeFilters}
          onRemoveFilter={(filter) => {
            if (filter.key === 'level') {
              setLevelFilter('ALL')
            }

            if (filter.key === 'module') {
              setModuleFilter('ALL')
            }
            setCurrentPage(1)
          }}
          onClearFilters={() => {
            setLevelFilter('ALL')
            setModuleFilter('ALL')
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
                <label className="mb-1.5 block text-[12px] font-bold uppercase tracking-wider text-[#64748b]">Level</label>
                <select
                  value={levelFilter}
                  onChange={(event) => {
                    setLevelFilter(event.target.value as 'ALL' | AdminLogLevel)
                    setCurrentPage(1)
                  }}
                  className="w-full rounded-[3px] border border-[#cbd5e1] bg-slate-50 px-3 py-2 text-[13px] font-bold text-slate-700 outline-none"
                >
                  <option value="ALL">All</option>
                  <option value="INFO">Info</option>
                  <option value="WARNING">Warning</option>
                  <option value="ERROR">Error</option>
                  <option value="CRITICAL">Critical</option>
                </select>
              </div>

              <div>
                <label className="mb-1.5 block text-[12px] font-bold uppercase tracking-wider text-[#64748b]">Module</label>
                <select
                  value={moduleFilter}
                  onChange={(event) => {
                    setModuleFilter(event.target.value as 'ALL' | AdminLogModuleKey)
                    setCurrentPage(1)
                  }}
                  className="w-full rounded-[3px] border border-[#cbd5e1] bg-slate-50 px-3 py-2 text-[13px] font-bold text-slate-700 outline-none"
                >
                  <option value="ALL">All</option>
                  {(Object.keys(MODULE_LABELS) as AdminLogModuleKey[]).map((moduleKey) => (
                    <option key={moduleKey} value={moduleKey}>{MODULE_LABELS[moduleKey]}</option>
                  ))}
                </select>
              </div>
            </div>
          )}
        />
      </section>

      <div className="flex justify-end">
        <button
          type="button"
          onClick={handleSave}
          className="h-10 rounded-[3px] bg-[#0b5384] px-4 text-[13px] font-bold text-white hover:bg-[#09416a]"
        >
          Save Audit Settings
        </button>
      </div>

      <ConfirmDialog
        open={isConfirmOpen}
        title="Permanent Deletion Policy"
        message="Deleting expired logs is irreversible. Confirm if this policy should be applied."
        tone="danger"
        confirmLabel="Apply Deletion Policy"
        onCancel={() => {
          setIsConfirmOpen(false)
          setPendingSettings(null)
        }}
        onConfirm={() => {
          if (pendingSettings) {
            saveAuditSettings(pendingSettings)
          }
          setIsConfirmOpen(false)
          setPendingSettings(null)
        }}
      />
    </div>
  )
}
