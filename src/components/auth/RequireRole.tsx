import { Navigate } from 'react-router-dom'
import type { ReactNode } from 'react'
import type { MockUserRole } from '../../data/unifiedData'
import { hasRequiredRole } from '../../utils/authSession'

type RequireRoleProps = {
  role: MockUserRole
  children: ReactNode
}

export default function RequireRole({ role, children }: RequireRoleProps) {
  if (!hasRequiredRole(role)) {
    return <Navigate to="/login" replace />
  }

  return <>{children}</>
}
