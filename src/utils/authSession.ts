import type { MockUserRole } from '../data/unifiedData'

const ACTIVE_ROLE_KEY = 'bayanihan.activeRole'

type ActiveSession = {
  role: MockUserRole
  signedInAt: string
}

export function setActiveRole(role: MockUserRole): void {
  const payload: ActiveSession = {
    role,
    signedInAt: new Date().toISOString(),
  }

  localStorage.setItem(ACTIVE_ROLE_KEY, JSON.stringify(payload))
}

export function getActiveRole(): MockUserRole | null {
  const rawValue = localStorage.getItem(ACTIVE_ROLE_KEY)
  if (!rawValue) {
    return null
  }

  try {
    const parsed = JSON.parse(rawValue) as Partial<ActiveSession>
    if (!parsed.role) {
      return null
    }

    return parsed.role
  } catch {
    return null
  }
}

export function clearActiveRole(): void {
  localStorage.removeItem(ACTIVE_ROLE_KEY)
}

export function hasRequiredRole(role: MockUserRole): boolean {
  return getActiveRole() === role
}
