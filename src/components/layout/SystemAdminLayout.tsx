import {
  LayoutDashboard,
  FolderOpen,
  User,
  Building2,
  ArrowRightLeft,
  ShieldCheck,
  History,
  ScrollText,
  Plug,
  Mail,
  ShieldAlert,
  Settings2,
} from 'lucide-react'
import { Outlet, useNavigate } from 'react-router-dom'
import type { JSX } from 'react'
import { useEffect, useMemo, useState } from 'react'
import AppSidebar from './AppSidebar'
import { clearActiveRole, getActiveUserProfile, getRoleProfileLabel, subscribeToActiveUserProfile } from '../../utils/authSession'

const navigationGroups = [
  {
    label: 'Overview',
    items: [{ name: 'Dashboard', href: '/system-admin/dashboard', icon: LayoutDashboard }],
  },
  {
    label: 'Case Operations',
    items: [
      { name: 'Cases', href: '/system-admin/cases', icon: FolderOpen },
      { name: 'Clients', href: '/system-admin/clients', icon: User },
      { name: 'Agencies', href: '/system-admin/agencies', icon: Building2 },
      { name: 'Referrals', href: '/system-admin/referrals', icon: ArrowRightLeft },
    ],
  },
  {
    label: 'Governance',
    items: [
      { name: 'Users', href: '/system-admin/users', icon: ShieldCheck },
      { name: 'Activity Logs', href: '/system-admin/activity-logs', icon: History },
      { name: 'Audit & Logging', href: '/system-admin/audit-logging', icon: ScrollText },
    ],
  },
  {
    label: 'Platform',
    items: [
      { name: 'Integrations', href: '/system-admin/integrations', icon: Plug },
      { name: 'Emails', href: '/system-admin/emails', icon: Mail },
      { name: 'Security Policies', href: '/system-admin/security-policies', icon: ShieldAlert },
      { name: 'System Settings', href: '/system-admin/system-settings', icon: Settings2 },
    ],
  },
]

export default function SystemAdminLayout(): JSX.Element {
  const navigate = useNavigate()
  const [activeProfile, setActiveProfile] = useState(() => getActiveUserProfile())

  useEffect(() => {
    return subscribeToActiveUserProfile(() => {
      setActiveProfile(getActiveUserProfile())
    })
  }, [])

  const initials = useMemo(() => {
    const tokens = (activeProfile?.name || 'System Admin').trim().split(/\s+/).filter(Boolean)
    return tokens.slice(0, 2).map((token) => token[0]?.toUpperCase() || '').join('') || 'SA'
  }, [activeProfile?.name])

  const handleLogout = () => {
    clearActiveRole()
    navigate('/login')
  }

  return (
    <div className="flex h-screen overflow-hidden bg-[#f1f4fa] font-sans">
      <AppSidebar
        navigationGroups={navigationGroups}
        user={{
          name: activeProfile?.name || 'System Administrator',
          role: getRoleProfileLabel(activeProfile?.role || 'System Admin'),
          initials,
          avatarUrl: activeProfile?.avatarUrl,
        }}
        profileHref="/system-admin/profile"
        onLogout={handleLogout}
      />

      <main className="flex min-h-0 flex-1 flex-col overflow-hidden">
        <div className="min-h-0 flex-1 overflow-y-auto p-8 pt-10">
          <Outlet />
        </div>
      </main>
    </div>
  )
}
