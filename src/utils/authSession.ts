import type { MockUserRole } from '../data/unifiedData'

const ACTIVE_ROLE_KEY = 'bayanihan.activeRole'
const TRACKING_OTP_VERIFIED_KEY = 'bayanihan.trackingOtpVerified'
const USER_PROFILE_MAP_KEY = 'bayanihan.userProfiles'
const PROFILE_UPDATED_EVENT = 'bayanihan.profileUpdated'

type ActiveSession = {
  role: MockUserRole
  signedInAt: string
  email?: string
  name?: string
}

type TrackingOtpVerificationState = Record<string, string>

export type ActiveUserProfile = {
  role: MockUserRole
  name: string
  email: string
  contactNumber: string
  avatarUrl?: string
}

type StoredUserProfile = Omit<ActiveUserProfile, 'role'>
type StoredUserProfileMap = Record<string, StoredUserProfile>

function getProfileKey(role: MockUserRole): string {
  return `role:${role}`
}

export function getRoleProfileLabel(role: MockUserRole): string {
  if (role === 'System Admin') {
    return 'System Administrator'
  }

  if (role === 'Agency') {
    return 'Agency Focal Person'
  }

  if (role === 'OFW') {
    return 'Overseas Filipino Worker'
  }

  return 'Case Manager'
}

function getDefaultContactNumber(role: MockUserRole): string {
  if (role === 'System Admin') {
    return '+63 917 100 2001'
  }

  if (role === 'Agency') {
    return '+63 917 100 2002'
  }

  if (role === 'OFW') {
    return '+63 917 100 2004'
  }

  return '+63 917 100 2003'
}

function readUserProfiles(): StoredUserProfileMap {
  const raw = localStorage.getItem(USER_PROFILE_MAP_KEY)
  if (!raw) {
    return {}
  }

  try {
    const parsed = JSON.parse(raw) as StoredUserProfileMap
    if (!parsed || typeof parsed !== 'object') {
      return {}
    }

    return parsed
  } catch {
    return {}
  }
}

function writeUserProfiles(state: StoredUserProfileMap): void {
  localStorage.setItem(USER_PROFILE_MAP_KEY, JSON.stringify(state))
}

function getDefaultActiveProfile(session: ActiveSession): ActiveUserProfile {
  const roleLabel = getRoleProfileLabel(session.role)

  return {
    role: session.role,
    name: session.name || roleLabel,
    email: session.email || '',
    contactNumber: getDefaultContactNumber(session.role),
  }
}

function notifyProfileUpdated(): void {
  if (typeof window === 'undefined') {
    return
  }

  window.dispatchEvent(new Event(PROFILE_UPDATED_EVENT))
}

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

export function getActiveUserProfile(): ActiveUserProfile | null {
  const session = getActiveSession()
  if (!session) {
    return null
  }

  const defaults = getDefaultActiveProfile(session)
  const profileMap = readUserProfiles()
  const profileKey = getProfileKey(session.role)
  const stored = profileMap[profileKey]

  return {
    role: session.role,
    name: stored?.name || defaults.name,
    email: stored?.email || defaults.email,
    contactNumber: stored?.contactNumber || defaults.contactNumber,
    avatarUrl: stored?.avatarUrl,
  }
}

export function updateActiveUserProfile(profile: Partial<StoredUserProfile>): ActiveUserProfile | null {
  const session = getActiveSession()
  const current = getActiveUserProfile()
  if (!session || !current) {
    return null
  }

  const merged: ActiveUserProfile = {
    ...current,
    ...profile,
  }

  const profileMap = readUserProfiles()
  profileMap[getProfileKey(session.role)] = {
    name: merged.name,
    email: merged.email,
    contactNumber: merged.contactNumber,
    avatarUrl: merged.avatarUrl,
  }
  writeUserProfiles(profileMap)

  const nextSession: ActiveSession = {
    ...session,
    name: merged.name,
    email: merged.email,
  }
  localStorage.setItem(ACTIVE_ROLE_KEY, JSON.stringify(nextSession))
  notifyProfileUpdated()

  return merged
}

export function subscribeToActiveUserProfile(listener: () => void): () => void {
  if (typeof window === 'undefined') {
    return () => undefined
  }

  const handleUpdate = () => {
    listener()
  }

  window.addEventListener(PROFILE_UPDATED_EVENT, handleUpdate)
  window.addEventListener('storage', handleUpdate)

  return () => {
    window.removeEventListener(PROFILE_UPDATED_EVENT, handleUpdate)
    window.removeEventListener('storage', handleUpdate)
  }
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
