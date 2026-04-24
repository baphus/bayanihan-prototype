import type { MockUserRole } from '../data/unifiedData'

const ACTIVE_ROLE_KEY = 'bayanihan.activeRole'
const TRACKING_OTP_VERIFIED_KEY = 'bayanihan.trackingOtpVerified'

type ActiveSession = {
  role: MockUserRole
  signedInAt: string
  email?: string
  name?: string
}

type TrackingOtpVerificationState = Record<string, string>

function normalizeTrackingId(value: string): string {
  return value.trim().toUpperCase()
}

function readTrackingOtpVerificationState(): TrackingOtpVerificationState {
  const raw = localStorage.getItem(TRACKING_OTP_VERIFIED_KEY)
  if (!raw) {
    return {}
  }

  try {
    const parsed = JSON.parse(raw) as TrackingOtpVerificationState
    if (!parsed || typeof parsed !== 'object') {
      return {}
    }

    return parsed
  } catch {
    return {}
  }
}

function writeTrackingOtpVerificationState(state: TrackingOtpVerificationState): void {
  localStorage.setItem(TRACKING_OTP_VERIFIED_KEY, JSON.stringify(state))
}

export function setActiveRole(role: MockUserRole, session?: { email?: string; name?: string }): void {
  const payload: ActiveSession = {
    role,
    signedInAt: new Date().toISOString(),
    email: session?.email,
    name: session?.name,
  }

  localStorage.setItem(ACTIVE_ROLE_KEY, JSON.stringify(payload))
}

export function getActiveSession(): ActiveSession | null {
  const rawValue = localStorage.getItem(ACTIVE_ROLE_KEY)
  if (!rawValue) {
    return null
  }

  try {
    const parsed = JSON.parse(rawValue) as Partial<ActiveSession>
    if (!parsed.role) {
      return null
    }

    return {
      role: parsed.role,
      signedInAt: parsed.signedInAt ?? new Date().toISOString(),
      email: parsed.email,
      name: parsed.name,
    }
  } catch {
    return null
  }
}

export function getActiveRole(): MockUserRole | null {
  return getActiveSession()?.role ?? null
}

export function getActiveUserEmail(): string | null {
  return getActiveSession()?.email ?? null
}

export function clearActiveRole(): void {
  localStorage.removeItem(ACTIVE_ROLE_KEY)
  localStorage.removeItem(TRACKING_OTP_VERIFIED_KEY)
}

export function hasRequiredRole(role: MockUserRole): boolean {
  return getActiveRole() === role
}

export function setTrackingOtpVerified(trackingId: string): void {
  const normalizedTrackingId = normalizeTrackingId(trackingId)
  if (!normalizedTrackingId) {
    return
  }

  const current = readTrackingOtpVerificationState()
  current[normalizedTrackingId] = new Date().toISOString()
  writeTrackingOtpVerificationState(current)
}

export function isTrackingOtpVerified(trackingId: string): boolean {
  const normalizedTrackingId = normalizeTrackingId(trackingId)
  if (!normalizedTrackingId) {
    return false
  }

  const current = readTrackingOtpVerificationState()
  return Boolean(current[normalizedTrackingId])
}
