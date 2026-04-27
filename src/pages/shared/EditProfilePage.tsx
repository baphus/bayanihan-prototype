import { useMemo, useState } from 'react'
import type { ChangeEvent, FormEvent } from 'react'
import { Eye, EyeOff, UploadCloud, Trash2, ShieldCheck } from 'lucide-react'
import { pageHeadingStyles } from '../agency/pageHeadingStyles'
import { AppButton } from '../../components/ui/AppButton'
import AppToast from '../../components/ui/AppToast'
import { getActiveUserProfile, getRoleProfileLabel, updateActiveUserProfile } from '../../utils/authSession'

type ProfileFormState = {
  name: string
  email: string
  contactNumber: string
  avatarUrl?: string
}

type PasswordFormState = {
  currentPassword: string
  newPassword: string
  confirmPassword: string
}

type ValidationErrors = Partial<Record<keyof ProfileFormState, string>>
type PasswordErrors = Partial<Record<keyof PasswordFormState, string>>

function isValidEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim())
}

function validateProfile(values: ProfileFormState): ValidationErrors {
  const errors: ValidationErrors = {}

  if (values.name.trim().length < 3) {
    errors.name = 'Full name must be at least 3 characters.'
  }

  if (!isValidEmail(values.email)) {
    errors.email = 'Please enter a valid email address.'
  }

  if (values.contactNumber.trim().length < 7) {
    errors.contactNumber = 'Contact number must be at least 7 characters.'
  }

  return errors
}

function validatePassword(values: PasswordFormState): PasswordErrors {
  const errors: PasswordErrors = {}

  if (!values.currentPassword) {
    errors.currentPassword = 'Current password is required.'
  }

  if (values.newPassword.length < 8) {
    errors.newPassword = 'New password must be at least 8 characters.'
  }

  if (values.newPassword !== values.confirmPassword) {
    errors.confirmPassword = 'Passwords do not match.'
  }

  return errors
}

function inputClass(hasError: boolean): string {
  return `h-10 w-full rounded-[3px] border px-3 text-[13px] text-slate-700 outline-none transition-colors ${
    hasError ? 'border-red-300 bg-red-50 focus:border-red-400' : 'border-[#cbd5e1] bg-white focus:border-[#0b5384]'
  }`
}

function PasswordField({
  label,
  value,
  onChange,
  error,
}: {
  label: string
  value: string
  onChange: (nextValue: string) => void
  error?: string
}) {
  const [isVisible, setIsVisible] = useState(false)

  return (
    <label className="space-y-1.5 block">
      <span className="text-[11px] font-bold uppercase tracking-[0.08em] text-slate-600">{label}</span>
      <div className="relative">
        <input
          type={isVisible ? 'text' : 'password'}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className={`${inputClass(Boolean(error))} pr-10`}
          autoComplete="new-password"
        />
        <button
          type="button"
          className="absolute inset-y-0 right-0 flex items-center justify-center px-3 text-slate-500"
          onClick={() => setIsVisible((prev) => !prev)}
          aria-label={isVisible ? 'Hide password' : 'Show password'}
        >
          {isVisible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </button>
      </div>
      {error ? <p className="text-[11px] font-semibold text-red-600">{error}</p> : null}
    </label>
  )
}

export default function EditProfilePage() {
  const profile = useMemo(() => getActiveUserProfile(), [])
  const roleLabel = useMemo(() => (profile ? getRoleProfileLabel(profile.role) : 'User'), [profile])

  const [form, setForm] = useState<ProfileFormState>({
    name: profile?.name || '',
    email: profile?.email || '',
    contactNumber: profile?.contactNumber || '',
    avatarUrl: profile?.avatarUrl,
  })
  const [passwordForm, setPasswordForm] = useState<PasswordFormState>({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  })
  const [formErrors, setFormErrors] = useState<ValidationErrors>({})
  const [passwordErrors, setPasswordErrors] = useState<PasswordErrors>({})
  const [toastMessage, setToastMessage] = useState('')

  const initials = useMemo(() => {
    const tokens = form.name.trim().split(/\s+/).filter(Boolean)
    return tokens.slice(0, 2).map((token) => token[0]?.toUpperCase() || '').join('') || 'U'
  }, [form.name])

  const handleImageUpload = (event: ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0]
    if (!selectedFile) {
      return
    }

    if (selectedFile.size > 2 * 1024 * 1024) {
      setToastMessage('Profile photo must be 2MB or smaller.')
      return
    }

    const reader = new FileReader()
    reader.onload = () => {
      const result = reader.result
      if (typeof result !== 'string') {
        return
      }

      setForm((prev) => ({ ...prev, avatarUrl: result }))
    }
    reader.readAsDataURL(selectedFile)
  }

  const handleSaveProfile = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    const validationErrors = validateProfile(form)
    setFormErrors(validationErrors)

    if (Object.keys(validationErrors).length > 0) {
      return
    }

    updateActiveUserProfile({
      name: form.name.trim(),
      email: form.email.trim(),
      contactNumber: form.contactNumber.trim(),
      avatarUrl: form.avatarUrl,
    })

    setToastMessage('Profile details saved.')
  }

  const handleChangePassword = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    const validationErrors = validatePassword(passwordForm)
    setPasswordErrors(validationErrors)

    if (Object.keys(validationErrors).length > 0) {
      return
    }

    setPasswordForm({
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    })
    setToastMessage('Password updated successfully.')
  }

  return (
    <div className="mx-auto max-w-5xl space-y-5 pb-6">
      <header>
        <h1 className={pageHeadingStyles.pageTitle}>Edit Profile</h1>
        <p className={pageHeadingStyles.pageSubtitle}>Update your account details, profile photo, and security credentials.</p>
      </header>

      <section className="rounded-[4px] border border-[#cbd5e1] bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-full border border-[#bfdbfe] bg-[#dbeafe] text-lg font-black text-[#0b5384]">
              {form.avatarUrl ? (
                <img src={form.avatarUrl} alt="Profile" className="h-full w-full object-cover" />
              ) : (
                initials
              )}
            </div>
            <div>
              <p className="text-[15px] font-bold text-slate-900">{form.name || 'Your Name'}</p>
              <p className="text-[12px] text-slate-600">{roleLabel}</p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <label className="inline-flex cursor-pointer items-center gap-2 rounded-[3px] border border-[#cbd5e1] bg-white px-3 py-2 text-[12px] font-bold text-[#0b5384] hover:bg-slate-50">
              <UploadCloud className="h-4 w-4" />
              Upload Photo
              <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
            </label>
            <button
              type="button"
              onClick={() => setForm((prev) => ({ ...prev, avatarUrl: undefined }))}
              className="inline-flex items-center gap-2 rounded-[3px] border border-[#fecaca] bg-[#fff1f2] px-3 py-2 text-[12px] font-bold text-[#be123c] hover:bg-[#ffe4e6]"
            >
              <Trash2 className="h-4 w-4" />
              Remove
            </button>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <form onSubmit={handleSaveProfile} className="rounded-[4px] border border-[#cbd5e1] bg-white p-5 shadow-sm space-y-4">
          <h2 className={pageHeadingStyles.sectionTitle}>Profile Details</h2>

          <label className="space-y-1.5 block">
            <span className="text-[11px] font-bold uppercase tracking-[0.08em] text-slate-600">Full Name</span>
            <input
              value={form.name}
              onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
              className={inputClass(Boolean(formErrors.name))}
            />
            {formErrors.name ? <p className="text-[11px] font-semibold text-red-600">{formErrors.name}</p> : null}
          </label>

          <label className="space-y-1.5 block">
            <span className="text-[11px] font-bold uppercase tracking-[0.08em] text-slate-600">Email Address</span>
            <input
              type="email"
              value={form.email}
              onChange={(event) => setForm((prev) => ({ ...prev, email: event.target.value }))}
              className={inputClass(Boolean(formErrors.email))}
            />
            {formErrors.email ? <p className="text-[11px] font-semibold text-red-600">{formErrors.email}</p> : null}
          </label>

          <label className="space-y-1.5 block">
            <span className="text-[11px] font-bold uppercase tracking-[0.08em] text-slate-600">Contact Number</span>
            <input
              value={form.contactNumber}
              onChange={(event) => setForm((prev) => ({ ...prev, contactNumber: event.target.value }))}
              className={inputClass(Boolean(formErrors.contactNumber))}
            />
            {formErrors.contactNumber ? <p className="text-[11px] font-semibold text-red-600">{formErrors.contactNumber}</p> : null}
          </label>

          <div className="flex justify-end pt-2">
            <AppButton type="submit">Save Profile</AppButton>
          </div>
        </form>

        <form onSubmit={handleChangePassword} className="rounded-[4px] border border-[#cbd5e1] bg-white p-5 shadow-sm space-y-4">
          <h2 className={pageHeadingStyles.sectionTitle}>Change Password</h2>

          <div className="rounded-[3px] border border-[#dbeafe] bg-[#eff6ff] px-3 py-2 text-[12px] text-[#1e3a8a] flex items-start gap-2">
            <ShieldCheck className="h-4 w-4 mt-0.5 shrink-0" />
            <span>Use at least 8 characters with a mix of letters and numbers.</span>
          </div>

          <PasswordField
            label="Current Password"
            value={passwordForm.currentPassword}
            onChange={(nextValue) => setPasswordForm((prev) => ({ ...prev, currentPassword: nextValue }))}
            error={passwordErrors.currentPassword}
          />

          <PasswordField
            label="New Password"
            value={passwordForm.newPassword}
            onChange={(nextValue) => setPasswordForm((prev) => ({ ...prev, newPassword: nextValue }))}
            error={passwordErrors.newPassword}
          />

          <PasswordField
            label="Confirm New Password"
            value={passwordForm.confirmPassword}
            onChange={(nextValue) => setPasswordForm((prev) => ({ ...prev, confirmPassword: nextValue }))}
            error={passwordErrors.confirmPassword}
          />

          <div className="flex justify-end pt-2">
            <AppButton type="submit" variant="outline">Update Password</AppButton>
          </div>
        </form>
      </section>

      {toastMessage ? <AppToast message={toastMessage} onClose={() => setToastMessage('')} tone="success" /> : null}
    </div>
  )
}
