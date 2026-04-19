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
import AppSidebar from './AppSidebar'
import { clearActiveRole } from '../../utils/authSession'

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

  const handleLogout = () => {
    clearActiveRole()
    navigate('/login')
  }

  return (
    <div className="flex h-screen bg-[#f1f4fa] font-sans">
      <AppSidebar
        navigationGroups={navigationGroups}
        user={{
          name: 'System Administrator',
          role: 'Platform Governance',
          initials: 'SA',
        }}
        onLogout={handleLogout}
      />

      <main className="flex-1 flex flex-col overflow-hidden">
        <div className="flex-1 overflow-y-auto p-8 pt-10">
          <Outlet />
        </div>
      </main>
    </div>
  )
}
