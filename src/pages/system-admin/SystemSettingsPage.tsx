import { useMemo, useState } from 'react'
import { pageHeadingStyles } from '../agency/pageHeadingStyles'
import AppToggle from '../../components/ui/AppToggle'
import SystemSettingField from '../../components/ui/SystemSettingField'
import {
  getSystemAdminGovernanceHealth,
  getSystemAdminPlatformSettings,
  updateSystemAdminPlatformSettings,
  type BackupFrequency,
  type SystemAdminPlatformSettings,
} from '../../data/unifiedData'
import { validateSoftDeleteDays } from '../../utils/systemAdminValidation'

type SettingErrors = {
  systemName?: string
  timezone?: string
  locale?: string
  softDeleteDays?: string
  rowsPerPage?: string
}

function validateSettings(settings: SystemAdminPlatformSettings): SettingErrors {
  const errors: SettingErrors = {}

  if (settings.systemName.trim().length < 3) {
    errors.systemName = 'System name must be at least 3 characters.'
  }

  if (settings.timezone.trim().length < 3) {
    errors.timezone = 'Timezone is required.'
  }

  if (settings.locale.trim().length < 2) {
    errors.locale = 'Locale is required.'
  }

  const softDeleteError = validateSoftDeleteDays(settings.softDeleteDays)
  if (softDeleteError) {
    errors.softDeleteDays = softDeleteError
  }

  if (![10, 25, 50, 100].includes(settings.performance.defaultRowsPerPage)) {
    errors.rowsPerPage = 'Default rows per page must be one of: 10, 25, 50, 100.'
  }

  return errors
}

export default function SystemSettingsPage() {
  const [settings, setSettings] = useState<SystemAdminPlatformSettings>(() => getSystemAdminPlatformSettings())
  const [errors, setErrors] = useState<SettingErrors>({})
  const [message, setMessage] = useState('')

  const health = useMemo(() => getSystemAdminGovernanceHealth(), [settings])

  const handleSave = () => {
    const validationErrors = validateSettings(settings)
    setErrors(validationErrors)

    if (Object.keys(validationErrors).length > 0) {
      return
    }

    updateSystemAdminPlatformSettings(settings)
    setSettings(getSystemAdminPlatformSettings())
    setMessage('System settings saved.')
  }

  const runBackupNow = () => {
    const nextSettings: SystemAdminPlatformSettings = {
      ...settings,
      backup: {
        ...settings.backup,
        lastBackupAt: new Date().toISOString(),
      },
    }

    updateSystemAdminPlatformSettings(nextSettings)
    setSettings(getSystemAdminPlatformSettings())
    setMessage('Backup execution triggered (simulated).')
  }

  return (
    <div className="mx-auto max-w-7xl space-y-5 pb-6">
      <header>
        <h1 className={pageHeadingStyles.pageTitle}>System Settings</h1>
        <p className={pageHeadingStyles.pageSubtitle}>Manage global identity, lifecycle defaults, backup schedule, and performance behavior.</p>
      </header>

      {message ? (
        <section className="rounded-[4px] border border-[#bbf7d0] bg-[#f0fdf4] px-4 py-3 text-[13px] font-semibold text-[#166534]">
          {message}
        </section>
      ) : null}

      <section className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-5">
        <article className="rounded-[4px] border border-[#e2e8f0] bg-white p-4 xl:col-span-1">
          <p className="text-[10px] font-extrabold uppercase tracking-[0.08em] text-slate-500">Logging Modules</p>
          <p className="mt-2 text-2xl font-extrabold text-[#0b5384]">{health.loggingEnabledModules}</p>
        </article>
        <article className="rounded-[4px] border border-[#e2e8f0] bg-white p-4 xl:col-span-1">
          <p className="text-[10px] font-extrabold uppercase tracking-[0.08em] text-slate-500">Active Integrations</p>
          <p className="mt-2 text-2xl font-extrabold text-[#0b5384]">{health.activeIntegrations}</p>
        </article>
        <article className="rounded-[4px] border border-[#e2e8f0] bg-white p-4 xl:col-span-1">
          <p className="text-[10px] font-extrabold uppercase tracking-[0.08em] text-slate-500">Failed Notifications</p>
          <p className="mt-2 text-2xl font-extrabold text-[#b91c1c]">{health.failedNotifications}</p>
        </article>
        <article className="rounded-[4px] border border-[#e2e8f0] bg-white p-4 xl:col-span-1">
          <p className="text-[10px] font-extrabold uppercase tracking-[0.08em] text-slate-500">Strict Password Policy</p>
          <p className="mt-2 text-lg font-extrabold text-slate-800">{health.strictPasswordPolicy ? 'Enabled' : 'Relaxed'}</p>
        </article>
        <article className="rounded-[4px] border border-[#e2e8f0] bg-white p-4 xl:col-span-1">
          <p className="text-[10px] font-extrabold uppercase tracking-[0.08em] text-slate-500">Backup</p>
          <p className="mt-2 text-lg font-extrabold text-slate-800">{health.backupEnabled ? 'Enabled' : 'Disabled'}</p>
        </article>
      </section>

      <section className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <article className="rounded-[4px] border border-[#cbd5e1] bg-white p-5 shadow-sm space-y-4">
          <h2 className={pageHeadingStyles.sectionTitle}>Platform Identity</h2>

          <SystemSettingField label="System Name" error={errors.systemName}>
            <input
              value={settings.systemName}
              onChange={(event) => setSettings((prev) => ({ ...prev, systemName: event.target.value }))}
              className="h-10 w-full rounded-[3px] border border-[#cbd5e1] px-3 text-[13px] text-slate-700 outline-none"
            />
          </SystemSettingField>

          <SystemSettingField label="Platform Logo" helpText="Logo display is currently fixed for this frontend prototype.">
            <div className="flex h-20 items-center gap-3 rounded-[3px] border border-[#e2e8f0] bg-slate-50 px-3">
              <img src={settings.brandingLogoUrl || '/logo.png'} alt="Bayanihan platform logo" className="h-12 w-12 object-contain" />
              <span className="text-[12px] font-semibold text-slate-600">Bayanihan One Window</span>
            </div>
          </SystemSettingField>

          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <SystemSettingField label="Timezone" error={errors.timezone}>
              <input
                value={settings.timezone}
                onChange={(event) => setSettings((prev) => ({ ...prev, timezone: event.target.value }))}
                className="h-10 w-full rounded-[3px] border border-[#cbd5e1] px-3 text-[13px] text-slate-700 outline-none"
              />
            </SystemSettingField>

            <SystemSettingField label="Locale" error={errors.locale}>
              <input
                value={settings.locale}
                onChange={(event) => setSettings((prev) => ({ ...prev, locale: event.target.value }))}
                className="h-10 w-full rounded-[3px] border border-[#cbd5e1] px-3 text-[13px] text-slate-700 outline-none"
              />
            </SystemSettingField>
          </div>
        </article>

        <article className="rounded-[4px] border border-[#cbd5e1] bg-white p-5 shadow-sm space-y-4">
          <h2 className={pageHeadingStyles.sectionTitle}>Lifecycle and Performance</h2>

          <SystemSettingField label="Soft Delete Grace (days)" error={errors.softDeleteDays}>
            <input
              type="number"
              min={1}
              max={365}
              value={settings.softDeleteDays}
              onChange={(event) => setSettings((prev) => ({ ...prev, softDeleteDays: Number(event.target.value) }))}
              className="h-10 w-full rounded-[3px] border border-[#cbd5e1] px-3 text-[13px] text-slate-700 outline-none"
            />
          </SystemSettingField>

          <SystemSettingField label="Default Rows Per Page" error={errors.rowsPerPage}>
            <select
              value={settings.performance.defaultRowsPerPage}
              onChange={(event) =>
                setSettings((prev) => ({
                  ...prev,
                  performance: {
                    ...prev.performance,
                    defaultRowsPerPage: Number(event.target.value),
                  },
                }))
              }
              className="h-10 w-full rounded-[3px] border border-[#cbd5e1] px-3 text-[13px] text-slate-700 outline-none"
            >
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
          </SystemSettingField>

          <AppToggle
            checked={settings.performance.cacheEnabled}
            onChange={(value) =>
              setSettings((prev) => ({
                ...prev,
                performance: { ...prev.performance, cacheEnabled: value },
              }))
            }
            label="Enable Query Cache"
            description="Caches table and dashboard reads to reduce repeated computation."
          />
        </article>
      </section>

      <section className="rounded-[4px] border border-[#cbd5e1] bg-white p-5 shadow-sm space-y-4">
        <div className="flex items-center justify-between gap-3">
          <h2 className={pageHeadingStyles.sectionTitle}>Backup Settings</h2>
          <button
            type="button"
            onClick={runBackupNow}
            className="h-9 rounded-[3px] border border-[#cbd5e1] bg-white px-3 text-[12px] font-bold text-[#0b5384]"
          >
            Run Backup Now
          </button>
        </div>

        <AppToggle
          checked={settings.backup.enabled}
          onChange={(value) => setSettings((prev) => ({ ...prev, backup: { ...prev.backup, enabled: value } }))}
          label="Enable Automatic Backup"
          description="If enabled, scheduled backups will run using selected cadence."
        />

        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
          <SystemSettingField label="Frequency">
            <select
              value={settings.backup.frequency}
              onChange={(event) =>
                setSettings((prev) => ({
                  ...prev,
                  backup: {
                    ...prev.backup,
                    frequency: event.target.value as BackupFrequency,
                  },
                }))
              }
              className="h-10 w-full rounded-[3px] border border-[#cbd5e1] px-3 text-[13px] text-slate-700 outline-none"
            >
              <option value="DAILY">Daily</option>
              <option value="WEEKLY">Weekly</option>
              <option value="MONTHLY">Monthly</option>
            </select>
          </SystemSettingField>

          <SystemSettingField label="Run Time">
            <input
              type="time"
              value={settings.backup.runAt}
              onChange={(event) => setSettings((prev) => ({ ...prev, backup: { ...prev.backup, runAt: event.target.value } }))}
              className="h-10 w-full rounded-[3px] border border-[#cbd5e1] px-3 text-[13px] text-slate-700 outline-none"
            />
          </SystemSettingField>

          <SystemSettingField label="Last Backup">
            <input
              value={new Date(settings.backup.lastBackupAt).toLocaleString('en-US')}
              readOnly
              className="h-10 w-full rounded-[3px] border border-[#e2e8f0] bg-slate-50 px-3 text-[13px] text-slate-600 outline-none"
            />
          </SystemSettingField>
        </div>
      </section>

      <div className="flex justify-end">
        <button
          type="button"
          onClick={handleSave}
          className="h-10 rounded-[3px] bg-[#0b5384] px-4 text-[13px] font-bold text-white hover:bg-[#09416a]"
        >
          Save System Settings
        </button>
      </div>
    </div>
  )
}
