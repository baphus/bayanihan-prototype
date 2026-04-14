import { LayoutDashboard, FolderOpen, User, Building2, Briefcase, ArrowRightLeft, ShieldCheck, History } from 'lucide-react'
import { Outlet, useNavigate } from 'react-router-dom'
import type { JSX } from 'react'
import AppSidebar from './AppSidebar'
import { clearActiveRole } from '../../utils/authSession'

const navigation = [
  { name: 'Dashboard', href: '/system-admin/dashboard', icon: LayoutDashboard },
  { name: 'Cases', href: '/system-admin/cases', icon: FolderOpen },
  { name: 'Clients', href: '/system-admin/clients', icon: User },
  { name: 'Agencies', href: '/system-admin/agencies', icon: Building2 },
  { name: 'Services', href: '/system-admin/services', icon: Briefcase },
  { name: 'Referrals', href: '/system-admin/referrals', icon: ArrowRightLeft },
  { name: 'Users', href: '/system-admin/users', icon: ShieldCheck },
  { name: 'Activity Logs', href: '/system-admin/activity-logs', icon: History },
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
        navigation={navigation}
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
