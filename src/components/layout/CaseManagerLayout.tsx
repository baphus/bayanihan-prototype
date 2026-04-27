import { LayoutDashboard, FolderOpen, User, ArrowLeftRight, Users, BarChart3, History } from 'lucide-react'
import { Outlet, useNavigate } from 'react-router-dom'
import type { JSX } from 'react'
import { useEffect, useMemo, useState } from 'react'
import AppSidebar from './AppSidebar'
import { clearActiveRole, getActiveUserProfile, getRoleProfileLabel, subscribeToActiveUserProfile } from '../../utils/authSession'

const navigation = [
  { name: 'Dashboard', href: '/case-manager/dashboard', icon: LayoutDashboard },
  { name: 'Cases', href: '/case-manager/cases', icon: FolderOpen },
  { name: 'Clients', href: '/case-manager/clients', icon: User },
  { name: 'Referrals', href: '/case-manager/referrals', icon: ArrowLeftRight },
  { name: 'Stakeholders', href: '/case-manager/stakeholders', icon: Users },
  { name: 'Reports', href: '/case-manager/reports', icon: BarChart3 },
  { name: 'Audit Logs', href: '/case-manager/audit-logs', icon: History },
]

export default function CaseManagerLayout(): JSX.Element {
  const navigate = useNavigate()
  const [activeProfile, setActiveProfile] = useState(() => getActiveUserProfile())

  useEffect(() => {
    return subscribeToActiveUserProfile(() => {
      setActiveProfile(getActiveUserProfile())
    })
  }, [])

  const initials = useMemo(() => {
    const tokens = (activeProfile?.name || 'Case Manager').trim().split(/\s+/).filter(Boolean)
    return tokens.slice(0, 2).map((token) => token[0]?.toUpperCase() || '').join('') || 'CM'
  }, [activeProfile?.name])

  const handleLogout = () => {
    clearActiveRole()
    navigate('/login')
  }

  return (
    <div className="flex h-screen overflow-hidden bg-[#f1f4fa] font-sans">
      {/* Reusable Sidebar */}
      <AppSidebar 
        navigation={navigation} 
        user={{
          name: activeProfile?.name || 'Marychris M. Relon',
          role: getRoleProfileLabel(activeProfile?.role || 'Case Manager'),
          initials,
          avatarUrl: activeProfile?.avatarUrl,
        }}
        profileHref="/case-manager/profile"
        onLogout={handleLogout}
      />

      {/* Main Content Area */}
      <main className="flex min-h-0 flex-1 flex-col overflow-hidden">
        <div className="min-h-0 flex-1 overflow-y-auto p-8 pt-10">
          <Outlet />
        </div>
      </main>
    </div>
  )
}
