import { useState } from 'react'
import { pageHeadingStyles } from '../agency/pageHeadingStyles'
import AppToggle from '../../components/ui/AppToggle'
import SystemSettingField from '../../components/ui/SystemSettingField'
import ConfirmDialog from '../../components/ui/ConfirmDialog'
import {
  getSystemAdminSecuritySettings,
  updateSystemAdminSecuritySettings,
  type SystemAdminSecuritySettings,
} from '../../data/unifiedData'
import { validateIpRange, validatePasswordMinLength, validateRateLimit } from '../../utils/systemAdminValidation'

type ErrorState = {
  minLength?: string
  expirationDays?: string
  lockoutAttempts?: string
  lockoutDuration?: string
  perUserRate?: string
  perIpRate?: string
  timeoutMinutes?: string
  ipRanges?: string
  otpCodeLength?: string
  otpExpiry?: string
  otpAttempts?: string
  trustedDeviceDays?: string
  mfaRoles?: string
}

function validateSecuritySettings(settings: SystemAdminSecuritySettings): ErrorState {
  const errors: ErrorState = {}

  const minLengthError = validatePasswordMinLength(settings.password.minLength)
  if (minLengthError) {
    errors.minLength = minLengthError
  }

  if (!Number.isFinite(settings.password.expirationDays) || settings.password.expirationDays < 1 || settings.password.expirationDays > 365) {
    errors.expirationDays = 'Password expiration must be between 1 and 365 days.'
  }

  if (!Number.isFinite(settings.lockout.maxFailedAttempts) || settings.lockout.maxFailedAttempts < 3 || settings.lockout.maxFailedAttempts > 20) {
    errors.lockoutAttempts = 'Max failed attempts must be between 3 and 20.'
  }

  if (!Number.isFinite(settings.lockout.lockoutDurationMinutes) || settings.lockout.lockoutDurationMinutes < 1 || settings.lockout.lockoutDurationMinutes > 240) {
    errors.lockoutDuration = 'Lockout duration must be between 1 and 240 minutes.'
  }

  const perUserRateError = validateRateLimit(settings.rateLimit.perUserPerMinute)
  if (perUserRateError) {
    errors.perUserRate = perUserRateError
  }

  const perIpRateError = validateRateLimit(settings.rateLimit.perIpPerMinute)
  if (perIpRateError) {
    errors.perIpRate = perIpRateError
  }

  if (!Number.isFinite(settings.session.timeoutMinutes) || settings.session.timeoutMinutes < 5 || settings.session.timeoutMinutes > 1440) {
    errors.timeoutMinutes = 'Session timeout must be between 5 and 1440 minutes.'
  }

  if (settings.ipRestrictions.enabled) {
    const invalidEntry = settings.ipRestrictions.ranges.find((entry) => !!validateIpRange(entry))
    if (invalidEntry) {
      errors.ipRanges = `Invalid IP range: ${invalidEntry}`
    }
  }

  if (!Number.isFinite(settings.otp.codeLength) || settings.otp.codeLength < 4 || settings.otp.codeLength > 8) {
    errors.otpCodeLength = 'OTP code length must be between 4 and 8 digits.'
  }

  if (!Number.isFinite(settings.otp.expiryMinutes) || settings.otp.expiryMinutes < 1 || settings.otp.expiryMinutes > 30) {
    errors.otpExpiry = 'OTP expiry must be between 1 and 30 minutes.'
  }

  if (!Number.isFinite(settings.otp.maxAttempts) || settings.otp.maxAttempts < 1 || settings.otp.maxAttempts > 10) {
    errors.otpAttempts = 'OTP max attempts must be between 1 and 10.'
  }

  if (!Number.isFinite(settings.mfa.trustedDeviceDays) || settings.mfa.trustedDeviceDays < 0 || settings.mfa.trustedDeviceDays > 90) {
    errors.trustedDeviceDays = 'Trusted device duration must be between 0 and 90 days.'
  }

  if (settings.mfa.enabled && settings.mfa.requiredRoles.length === 0) {
    errors.mfaRoles = 'Select at least one role when MFA is enabled.'
  }

  return errors
}

export default function SecurityPoliciesPage() {
  const [settings, setSettings] = useState<SystemAdminSecuritySettings>(() => getSystemAdminSecuritySettings())
  const [ipInput, setIpInput] = useState(settings.ipRestrictions.ranges.join('\n'))
  const [errors, setErrors] = useState<ErrorState>({})
  const [message, setMessage] = useState('')
  const [isConfirmOpen, setIsConfirmOpen] = useState(false)
  const [pendingSettings, setPendingSettings] = useState<SystemAdminSecuritySettings | null>(null)

  const toggleMfaRole = (role: 'System Admin' | 'Case Manager' | 'Agency', checked: boolean) => {
    setSettings((prev) => {
      const nextRoles = checked
        ? Array.from(new Set([...prev.mfa.requiredRoles, role]))
        : prev.mfa.requiredRoles.filter((item) => item !== role)

      return {
        ...prev,
        mfa: {
          ...prev.mfa,
          requiredRoles: nextRoles,
        },
      }
    })
  }

  const handleSave = () => {
    const ranges = ipInput
      .split('\n')
      .map((item) => item.trim())
      .filter(Boolean)

    const nextSettings: SystemAdminSecuritySettings = {
      ...settings,
      ipRestrictions: {
        ...settings.ipRestrictions,
        ranges,
      },
    }

    const validationErrors = validateSecuritySettings(nextSettings)
    setErrors(validationErrors)
    if (Object.keys(validationErrors).length > 0) {
      return
    }

    if (nextSettings.session.forceLogoutEnabled) {
      setPendingSettings(nextSettings)
      setIsConfirmOpen(true)
      return
    }

    updateSystemAdminSecuritySettings(nextSettings)
    setSettings(getSystemAdminSecuritySettings())
    setMessage('Security policies saved.')
  }

  return (
    <div className="mx-auto max-w-7xl space-y-5 pb-6">
      <header>
        <h1 className={pageHeadingStyles.pageTitle}>Security Policies</h1>
        <p className={pageHeadingStyles.pageSubtitle}>Define password, lockout, rate limiting, session, and IP restriction rules.</p>
      </header>

      {message ? (
        <section className="rounded-[4px] border border-[#bbf7d0] bg-[#f0fdf4] px-4 py-3 text-[13px] font-semibold text-[#166534]">
          {message}
        </section>
      ) : null}

      <section className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <article className="rounded-[4px] border border-[#cbd5e1] bg-white p-5 shadow-sm space-y-4">
          <h2 className={pageHeadingStyles.sectionTitle}>Password Policy</h2>

          <SystemSettingField label="Minimum Length" error={errors.minLength}>
            <input
              type="number"
              min={8}
              max={64}
              value={settings.password.minLength}
              onChange={(event) =>
                setSettings((prev) => ({
                  ...prev,
                  password: { ...prev.password, minLength: Number(event.target.value) },
                }))
              }
              className="h-10 w-full rounded-[3px] border border-[#cbd5e1] px-3 text-[13px] text-slate-700 outline-none"
            />
          </SystemSettingField>

          <SystemSettingField label="Expiration Days" error={errors.expirationDays}>
            <input
              type="number"
              min={1}
              max={365}
              value={settings.password.expirationDays}
              onChange={(event) =>
                setSettings((prev) => ({
                  ...prev,
                  password: { ...prev.password, expirationDays: Number(event.target.value) },
                }))
              }
              className="h-10 w-full rounded-[3px] border border-[#cbd5e1] px-3 text-[13px] text-slate-700 outline-none"
            />
          </SystemSettingField>

          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <AppToggle
              checked={settings.password.requireUppercase}
              onChange={(value) =>
                setSettings((prev) => ({
                  ...prev,
                  password: { ...prev.password, requireUppercase: value },
                }))
              }
              label="Require Uppercase"
            />
            <AppToggle
              checked={settings.password.requireLowercase}
              onChange={(value) =>
                setSettings((prev) => ({
                  ...prev,
                  password: { ...prev.password, requireLowercase: value },
                }))
              }
              label="Require Lowercase"
            />
            <AppToggle
              checked={settings.password.requireNumber}
              onChange={(value) =>
                setSettings((prev) => ({
                  ...prev,
                  password: { ...prev.password, requireNumber: value },
                }))
              }
              label="Require Number"
            />
            <AppToggle
              checked={settings.password.requireSpecial}
              onChange={(value) =>
                setSettings((prev) => ({
                  ...prev,
                  password: { ...prev.password, requireSpecial: value },
                }))
              }
              label="Require Special Character"
            />
          </div>
        </article>

        <article className="rounded-[4px] border border-[#cbd5e1] bg-white p-5 shadow-sm space-y-4">
          <h2 className={pageHeadingStyles.sectionTitle}>Lockout and Rate Limits</h2>

          <SystemSettingField label="Max Failed Attempts" error={errors.lockoutAttempts}>
            <input
              type="number"
              min={3}
              max={20}
              value={settings.lockout.maxFailedAttempts}
              onChange={(event) =>
                setSettings((prev) => ({
                  ...prev,
                  lockout: { ...prev.lockout, maxFailedAttempts: Number(event.target.value) },
                }))
              }
              className="h-10 w-full rounded-[3px] border border-[#cbd5e1] px-3 text-[13px] text-slate-700 outline-none"
            />
          </SystemSettingField>

          <SystemSettingField label="Lockout Duration (minutes)" error={errors.lockoutDuration}>
            <input
              type="number"
              min={1}
              max={240}
              value={settings.lockout.lockoutDurationMinutes}
              onChange={(event) =>
                setSettings((prev) => ({
                  ...prev,
                  lockout: { ...prev.lockout, lockoutDurationMinutes: Number(event.target.value) },
                }))
              }
              className="h-10 w-full rounded-[3px] border border-[#cbd5e1] px-3 text-[13px] text-slate-700 outline-none"
            />
          </SystemSettingField>

          <SystemSettingField label="Per User Requests/Minute" error={errors.perUserRate}>
            <input
              type="number"
              min={1}
              max={5000}
              value={settings.rateLimit.perUserPerMinute}
              onChange={(event) =>
                setSettings((prev) => ({
                  ...prev,
                  rateLimit: { ...prev.rateLimit, perUserPerMinute: Number(event.target.value) },
                }))
              }
              className="h-10 w-full rounded-[3px] border border-[#cbd5e1] px-3 text-[13px] text-slate-700 outline-none"
            />
          </SystemSettingField>

          <SystemSettingField label="Per IP Requests/Minute" error={errors.perIpRate}>
            <input
              type="number"
              min={1}
              max={5000}
              value={settings.rateLimit.perIpPerMinute}
              onChange={(event) =>
                setSettings((prev) => ({
                  ...prev,
                  rateLimit: { ...prev.rateLimit, perIpPerMinute: Number(event.target.value) },
                }))
              }
              className="h-10 w-full rounded-[3px] border border-[#cbd5e1] px-3 text-[13px] text-slate-700 outline-none"
            />
          </SystemSettingField>
        </article>
      </section>

      <section className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <article className="rounded-[4px] border border-[#cbd5e1] bg-white p-5 shadow-sm space-y-4">
          <h2 className={pageHeadingStyles.sectionTitle}>OTP Policy</h2>

          <AppToggle
            checked={settings.otp.enabled}
            onChange={(value) =>
              setSettings((prev) => ({
                ...prev,
                otp: { ...prev.otp, enabled: value },
              }))
            }
            label="Enable OTP Verification"
            description="Require one-time passcodes during authentication flow."
          />

          <SystemSettingField label="OTP Channel">
            <select
              value={settings.otp.channel}
              onChange={(event) =>
                setSettings((prev) => ({
                  ...prev,
                  otp: {
                    ...prev.otp,
                    channel: event.target.value as SystemAdminSecuritySettings['otp']['channel'],
                  },
                }))
              }
              className="h-10 w-full rounded-[3px] border border-[#cbd5e1] px-3 text-[13px] text-slate-700 outline-none"
            >
              <option value="EMAIL">Email</option>
              <option value="SMS">SMS</option>
              <option value="AUTH_APP">Authenticator App</option>
            </select>
          </SystemSettingField>

          <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
            <SystemSettingField label="Code Length" error={errors.otpCodeLength}>
              <input
                type="number"
                min={4}
                max={8}
                value={settings.otp.codeLength}
                onChange={(event) =>
                  setSettings((prev) => ({
                    ...prev,
                    otp: { ...prev.otp, codeLength: Number(event.target.value) },
                  }))
                }
                className="h-10 w-full rounded-[3px] border border-[#cbd5e1] px-3 text-[13px] text-slate-700 outline-none"
              />
            </SystemSettingField>

            <SystemSettingField label="Expiry (minutes)" error={errors.otpExpiry}>
              <input
                type="number"
                min={1}
                max={30}
                value={settings.otp.expiryMinutes}
                onChange={(event) =>
                  setSettings((prev) => ({
                    ...prev,
                    otp: { ...prev.otp, expiryMinutes: Number(event.target.value) },
                  }))
                }
                className="h-10 w-full rounded-[3px] border border-[#cbd5e1] px-3 text-[13px] text-slate-700 outline-none"
              />
            </SystemSettingField>

            <SystemSettingField label="Max Attempts" error={errors.otpAttempts}>
              <input
                type="number"
                min={1}
                max={10}
                value={settings.otp.maxAttempts}
                onChange={(event) =>
                  setSettings((prev) => ({
                    ...prev,
                    otp: { ...prev.otp, maxAttempts: Number(event.target.value) },
                  }))
                }
                className="h-10 w-full rounded-[3px] border border-[#cbd5e1] px-3 text-[13px] text-slate-700 outline-none"
              />
            </SystemSettingField>
          </div>
        </article>

        <article className="rounded-[4px] border border-[#cbd5e1] bg-white p-5 shadow-sm space-y-4">
          <h2 className={pageHeadingStyles.sectionTitle}>Multi-Factor Authentication</h2>

          <AppToggle
            checked={settings.mfa.enabled}
            onChange={(value) =>
              setSettings((prev) => ({
                ...prev,
                mfa: { ...prev.mfa, enabled: value },
              }))
            }
            label="Enable MFA"
            description="Enforce an additional authentication factor for selected roles."
          />

          <div className="rounded-[3px] border border-[#e2e8f0] bg-slate-50 px-3 py-3">
            <p className="mb-2 text-[11px] font-extrabold uppercase tracking-[0.08em] text-slate-600">Roles Requiring MFA</p>
            <div className="grid grid-cols-1 gap-2 md:grid-cols-3">
              <label className="flex items-center gap-2 text-[13px] text-slate-700">
                <input
                  type="checkbox"
                  checked={settings.mfa.requiredRoles.includes('System Admin')}
                  onChange={(event) => toggleMfaRole('System Admin', event.target.checked)}
                />
                System Admin
              </label>
              <label className="flex items-center gap-2 text-[13px] text-slate-700">
                <input
                  type="checkbox"
                  checked={settings.mfa.requiredRoles.includes('Case Manager')}
                  onChange={(event) => toggleMfaRole('Case Manager', event.target.checked)}
                />
                Case Manager
              </label>
              <label className="flex items-center gap-2 text-[13px] text-slate-700">
                <input
                  type="checkbox"
                  checked={settings.mfa.requiredRoles.includes('Agency')}
                  onChange={(event) => toggleMfaRole('Agency', event.target.checked)}
                />
                Agency
              </label>
            </div>
            {errors.mfaRoles ? <p className="mt-2 text-[12px] font-semibold text-red-600">{errors.mfaRoles}</p> : null}
          </div>

          <SystemSettingField label="Trusted Device (days)" error={errors.trustedDeviceDays}>
            <input
              type="number"
              min={0}
              max={90}
              value={settings.mfa.trustedDeviceDays}
              onChange={(event) =>
                setSettings((prev) => ({
                  ...prev,
                  mfa: { ...prev.mfa, trustedDeviceDays: Number(event.target.value) },
                }))
              }
              className="h-10 w-full rounded-[3px] border border-[#cbd5e1] px-3 text-[13px] text-slate-700 outline-none"
            />
          </SystemSettingField>

          <AppToggle
            checked={settings.mfa.enforceOnRiskySignIn}
            onChange={(value) =>
              setSettings((prev) => ({
                ...prev,
                mfa: { ...prev.mfa, enforceOnRiskySignIn: value },
              }))
            }
            label="Enforce MFA on Risky Sign-ins"
            description="Always challenge on unusual devices, locations, or repeated failures."
          />
        </article>
      </section>

      <section className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <article className="rounded-[4px] border border-[#cbd5e1] bg-white p-5 shadow-sm space-y-4">
          <h2 className={pageHeadingStyles.sectionTitle}>Session Controls</h2>

          <SystemSettingField label="Session Timeout (minutes)" error={errors.timeoutMinutes}>
            <input
              type="number"
              min={5}
              max={1440}
              value={settings.session.timeoutMinutes}
              onChange={(event) =>
                setSettings((prev) => ({
                  ...prev,
                  session: { ...prev.session, timeoutMinutes: Number(event.target.value) },
                }))
              }
              className="h-10 w-full rounded-[3px] border border-[#cbd5e1] px-3 text-[13px] text-slate-700 outline-none"
            />
          </SystemSettingField>

          <AppToggle
            checked={settings.session.forceLogoutEnabled}
            onChange={(value) =>
              setSettings((prev) => ({
                ...prev,
                session: { ...prev.session, forceLogoutEnabled: value },
              }))
            }
            label="Force Logout Existing Sessions"
            description="When enabled, all active sessions will be revoked on policy save."
          />
        </article>

        <article className="rounded-[4px] border border-[#cbd5e1] bg-white p-5 shadow-sm space-y-4">
          <h2 className={pageHeadingStyles.sectionTitle}>IP Restrictions</h2>

          <AppToggle
            checked={settings.ipRestrictions.enabled}
            onChange={(value) =>
              setSettings((prev) => ({
                ...prev,
                ipRestrictions: { ...prev.ipRestrictions, enabled: value },
              }))
            }
            label="Enable IP Restrictions"
          />

          <SystemSettingField label="Restriction Mode">
            <select
              value={settings.ipRestrictions.mode}
              onChange={(event) =>
                setSettings((prev) => ({
                  ...prev,
                  ipRestrictions: {
                    ...prev.ipRestrictions,
                    mode: event.target.value as SystemAdminSecuritySettings['ipRestrictions']['mode'],
                  },
                }))
              }
              className="h-10 w-full rounded-[3px] border border-[#cbd5e1] px-3 text-[13px] text-slate-700 outline-none"
            >
              <option value="ALLOW">Allow List</option>
              <option value="BLOCK">Block List</option>
            </select>
          </SystemSettingField>

          <SystemSettingField
            label="IP Ranges"
            error={errors.ipRanges}
            helpText="One IPv4 or CIDR entry per line (example: 192.168.10.0/24)."
          >
            <textarea
              rows={6}
              value={ipInput}
              onChange={(event) => setIpInput(event.target.value)}
              className="w-full rounded-[3px] border border-[#cbd5e1] px-3 py-2 text-[13px] text-slate-700 outline-none"
            />
          </SystemSettingField>
        </article>
      </section>

      <div className="flex justify-end">
        <button
          type="button"
          onClick={handleSave}
          className="h-10 rounded-[3px] bg-[#0b5384] px-4 text-[13px] font-bold text-white hover:bg-[#09416a]"
        >
          Save Security Policies
        </button>
      </div>

      <ConfirmDialog
        open={isConfirmOpen}
        title="Force Logout Sessions"
        message="This will revoke currently active sessions after policy save. Continue?"
        tone="default"
        confirmLabel="Save and Revoke Sessions"
        onCancel={() => {
          setIsConfirmOpen(false)
          setPendingSettings(null)
        }}
        onConfirm={() => {
          if (pendingSettings) {
            updateSystemAdminSecuritySettings(pendingSettings)
            setSettings(getSystemAdminSecuritySettings())
            setMessage('Security policies saved and active sessions were marked for revocation.')
          }
          setIsConfirmOpen(false)
          setPendingSettings(null)
        }}
      />
    </div>
  )
}
