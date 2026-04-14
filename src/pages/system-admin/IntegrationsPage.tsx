import { useMemo, useState } from 'react'
import { pageHeadingStyles } from '../agency/pageHeadingStyles'
import AppToggle from '../../components/ui/AppToggle'
import SystemSettingField from '../../components/ui/SystemSettingField'
import ConfirmDialog from '../../components/ui/ConfirmDialog'
import {
  getSystemAdminIntegrationSettings,
  testSystemAdminIntegrationConnection,
  updateSystemAdminIntegrationSettings,
  type SystemAdminIntegrationSettings,
} from '../../data/unifiedData'
import { validateUploadLimitMb } from '../../utils/systemAdminValidation'

function toMaskedApiKey(secret: string): string {
  const visible = secret.slice(-4)
  return `${'*'.repeat(Math.max(8, secret.length - 4))}${visible}`
}

export default function IntegrationsPage() {
  const [settings, setSettings] = useState<SystemAdminIntegrationSettings>(() => getSystemAdminIntegrationSettings())
  const [supabaseApiKeyInput, setSupabaseApiKeyInput] = useState('')
  const [emailApiKeyInput, setEmailApiKeyInput] = useState('')
  const [allowedFileTypesInput, setAllowedFileTypesInput] = useState(settings.storage.allowedFileTypes.join(', '))
  const [uploadLimitError, setUploadLimitError] = useState<string | null>(null)
  const [message, setMessage] = useState('')
  const [isConfirmOpen, setIsConfirmOpen] = useState(false)
  const [pendingSettings, setPendingSettings] = useState<SystemAdminIntegrationSettings | null>(null)

  const disabledServices = useMemo(() => {
    const previous = getSystemAdminIntegrationSettings()
    const disabled: string[] = []

    if (previous.supabase.enabled && !settings.supabase.enabled) {
      disabled.push('Supabase')
    }

    if (previous.email.enabled && !settings.email.enabled) {
      disabled.push('Email Service')
    }

    return disabled
  }, [settings])

  const buildSettingsWithSecrets = (): SystemAdminIntegrationSettings => {
    const normalizedTypes = allowedFileTypesInput
      .split(',')
      .map((item) => item.trim().toLowerCase())
      .filter(Boolean)

    return {
      ...settings,
      supabase: {
        ...settings.supabase,
        hasApiKey: settings.supabase.hasApiKey || supabaseApiKeyInput.trim().length > 0,
        apiKeyMasked: supabaseApiKeyInput.trim().length > 0
          ? toMaskedApiKey(supabaseApiKeyInput.trim())
          : settings.supabase.apiKeyMasked,
      },
      email: {
        ...settings.email,
        hasApiKey: settings.email.hasApiKey || emailApiKeyInput.trim().length > 0,
        apiKeyMasked: emailApiKeyInput.trim().length > 0
          ? toMaskedApiKey(emailApiKeyInput.trim())
          : settings.email.apiKeyMasked,
      },
      storage: {
        ...settings.storage,
        allowedFileTypes: normalizedTypes,
      },
    }
  }

  const applySettings = (nextSettings: SystemAdminIntegrationSettings) => {
    updateSystemAdminIntegrationSettings(nextSettings)
    setSettings(getSystemAdminIntegrationSettings())
    setSupabaseApiKeyInput('')
    setEmailApiKeyInput('')
    setMessage('Integration settings saved.')
  }

  const handleSave = () => {
    const limitValidation = validateUploadLimitMb(settings.storage.uploadLimitMb)
    setUploadLimitError(limitValidation)

    const nextSettings = buildSettingsWithSecrets()
    if (nextSettings.storage.allowedFileTypes.length === 0) {
      setUploadLimitError('Provide at least one allowed file type.')
      return
    }

    if (limitValidation) {
      return
    }

    if (disabledServices.length > 0) {
      setPendingSettings(nextSettings)
      setIsConfirmOpen(true)
      return
    }

    applySettings(nextSettings)
  }

  const handleTestConnection = (service: 'supabase' | 'email') => {
    const nextSettings = buildSettingsWithSecrets()
    updateSystemAdminIntegrationSettings(nextSettings)
    const result = testSystemAdminIntegrationConnection(service)
    const refreshed = getSystemAdminIntegrationSettings()
    setSettings(refreshed)
    setMessage(`${service === 'supabase' ? 'Supabase' : 'Email service'} connection ${result.toLowerCase()}.`)
  }

  return (
    <div className="mx-auto max-w-7xl space-y-5 pb-6">
      <header>
        <h1 className={pageHeadingStyles.pageTitle}>Integrations</h1>
        <p className={pageHeadingStyles.pageSubtitle}>Configure Supabase, email delivery, and platform storage constraints.</p>
      </header>

      {message ? (
        <section className="rounded-[4px] border border-[#bfdbfe] bg-[#eff6ff] px-4 py-3 text-[13px] font-semibold text-[#1d4ed8]">
          {message}
        </section>
      ) : null}

      <section className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <article className="rounded-[4px] border border-[#cbd5e1] bg-white p-5 shadow-sm space-y-4">
          <h2 className={pageHeadingStyles.sectionTitle}>Supabase Integration</h2>

          <AppToggle
            checked={settings.supabase.enabled}
            onChange={(value) => setSettings((prev) => ({ ...prev, supabase: { ...prev.supabase, enabled: value } }))}
            label="Enable Supabase"
            description="Database and storage integration for records and attachments."
          />

          <SystemSettingField label="Project URL" tooltip="Supabase project endpoint used by the app.">
            <input
              value={settings.supabase.endpointValue}
              onChange={(event) =>
                setSettings((prev) => ({
                  ...prev,
                  supabase: { ...prev.supabase, endpointValue: event.target.value },
                }))
              }
              className="h-10 w-full rounded-[3px] border border-[#cbd5e1] px-3 text-[13px] text-slate-700 outline-none"
            />
          </SystemSettingField>

          <SystemSettingField
            label="API Key"
            helpText={`Stored value: ${settings.supabase.hasApiKey ? settings.supabase.apiKeyMasked : 'Not configured'}`}
            tooltip="API key values are always masked after save."
          >
            <input
              type="password"
              value={supabaseApiKeyInput}
              onChange={(event) => setSupabaseApiKeyInput(event.target.value)}
              placeholder="Enter new key to rotate"
              className="h-10 w-full rounded-[3px] border border-[#cbd5e1] px-3 text-[13px] text-slate-700 outline-none"
            />
          </SystemSettingField>

          <div className="flex items-center justify-between rounded-[3px] border border-[#e2e8f0] bg-slate-50 px-3 py-2 text-[12px]">
            <span className="font-semibold text-slate-700">Status: {settings.supabase.connectionStatus}</span>
            <button
              type="button"
              onClick={() => handleTestConnection('supabase')}
              className="h-8 rounded-[3px] border border-[#cbd5e1] bg-white px-3 text-[11px] font-bold text-[#0b5384]"
            >
              Test Connection
            </button>
          </div>
        </article>

        <article className="rounded-[4px] border border-[#cbd5e1] bg-white p-5 shadow-sm space-y-4">
          <h2 className={pageHeadingStyles.sectionTitle}>Email Service</h2>

          <AppToggle
            checked={settings.email.enabled}
            onChange={(value) => setSettings((prev) => ({ ...prev, email: { ...prev.email, enabled: value } }))}
            label="Enable Email Service"
            description="Notification channel for case and referral updates."
          />

          <SystemSettingField label="Provider" tooltip="Choose SMTP or API provider.">
            <select
              value={settings.email.provider}
              onChange={(event) =>
                setSettings((prev) => ({
                  ...prev,
                  email: {
                    ...prev.email,
                    provider: event.target.value as SystemAdminIntegrationSettings['email']['provider'],
                  },
                }))
              }
              className="h-10 w-full rounded-[3px] border border-[#cbd5e1] px-3 text-[13px] text-slate-700 outline-none"
            >
              <option value="SendGrid">SendGrid</option>
              <option value="SMTP">SMTP</option>
            </select>
          </SystemSettingField>

          <SystemSettingField label="Sender Address" tooltip="Default sender identity for outbound email.">
            <input
              value={settings.email.endpointValue}
              onChange={(event) =>
                setSettings((prev) => ({
                  ...prev,
                  email: { ...prev.email, endpointValue: event.target.value },
                }))
              }
              className="h-10 w-full rounded-[3px] border border-[#cbd5e1] px-3 text-[13px] text-slate-700 outline-none"
            />
          </SystemSettingField>

          <SystemSettingField
            label="Provider Key"
            helpText={`Stored value: ${settings.email.hasApiKey ? settings.email.apiKeyMasked : 'Not configured'}`}
            tooltip="Provider keys are masked immediately after save."
          >
            <input
              type="password"
              value={emailApiKeyInput}
              onChange={(event) => setEmailApiKeyInput(event.target.value)}
              placeholder="Enter new key to rotate"
              className="h-10 w-full rounded-[3px] border border-[#cbd5e1] px-3 text-[13px] text-slate-700 outline-none"
            />
          </SystemSettingField>

          <div className="flex items-center justify-between rounded-[3px] border border-[#e2e8f0] bg-slate-50 px-3 py-2 text-[12px]">
            <span className="font-semibold text-slate-700">Status: {settings.email.connectionStatus}</span>
            <button
              type="button"
              onClick={() => handleTestConnection('email')}
              className="h-8 rounded-[3px] border border-[#cbd5e1] bg-white px-3 text-[11px] font-bold text-[#0b5384]"
            >
              Test Connection
            </button>
          </div>
        </article>
      </section>

      <section className="rounded-[4px] border border-[#cbd5e1] bg-white p-5 shadow-sm space-y-4">
        <h2 className={pageHeadingStyles.sectionTitle}>Storage Settings</h2>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <SystemSettingField
            label="Upload Limit (MB)"
            error={uploadLimitError}
            tooltip="Maximum file size allowed for uploads."
          >
            <input
              type="number"
              min={1}
              max={100}
              value={settings.storage.uploadLimitMb}
              onChange={(event) =>
                setSettings((prev) => ({
                  ...prev,
                  storage: { ...prev.storage, uploadLimitMb: Number(event.target.value) },
                }))
              }
              className="h-10 w-full rounded-[3px] border border-[#cbd5e1] px-3 text-[13px] text-slate-700 outline-none"
            />
          </SystemSettingField>

          <SystemSettingField
            label="Allowed File Types"
            helpText="Comma-separated values (example: pdf, jpg, png)."
            tooltip="Restricts upload extension whitelist."
          >
            <input
              value={allowedFileTypesInput}
              onChange={(event) => setAllowedFileTypesInput(event.target.value)}
              className="h-10 w-full rounded-[3px] border border-[#cbd5e1] px-3 text-[13px] text-slate-700 outline-none"
            />
          </SystemSettingField>

          <SystemSettingField label="Attachments Bucket" tooltip="Storage bucket for case files.">
            <input
              value={settings.storage.buckets.attachments}
              onChange={(event) =>
                setSettings((prev) => ({
                  ...prev,
                  storage: {
                    ...prev.storage,
                    buckets: { ...prev.storage.buckets, attachments: event.target.value },
                  },
                }))
              }
              className="h-10 w-full rounded-[3px] border border-[#cbd5e1] px-3 text-[13px] text-slate-700 outline-none"
            />
          </SystemSettingField>

          <SystemSettingField label="Reports Bucket" tooltip="Storage bucket for generated reports.">
            <input
              value={settings.storage.buckets.reports}
              onChange={(event) =>
                setSettings((prev) => ({
                  ...prev,
                  storage: {
                    ...prev.storage,
                    buckets: { ...prev.storage.buckets, reports: event.target.value },
                  },
                }))
              }
              className="h-10 w-full rounded-[3px] border border-[#cbd5e1] px-3 text-[13px] text-slate-700 outline-none"
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
          Save Integration Settings
        </button>
      </div>

      <ConfirmDialog
        open={isConfirmOpen}
        title="Disable Integration"
        message={`You are disabling: ${disabledServices.join(', ')}. Continue?`}
        tone="danger"
        confirmLabel="Disable and Save"
        onCancel={() => {
          setIsConfirmOpen(false)
          setPendingSettings(null)
        }}
        onConfirm={() => {
          if (pendingSettings) {
            applySettings(pendingSettings)
          }
          setIsConfirmOpen(false)
          setPendingSettings(null)
        }}
      />
    </div>
  )
}
