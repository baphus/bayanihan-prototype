import { LayoutDashboard, BarChart3, History, Briefcase, ClipboardList } from 'lucide-react'
import { Outlet, useNavigate } from 'react-router-dom'
import type { JSX } from 'react'
import { useEffect, useMemo, useState } from 'react'
import AppSidebar from './AppSidebar'
import { clearActiveRole, getActiveUserProfile, getRoleProfileLabel, subscribeToActiveUserProfile } from '../../utils/authSession'

const navigation = [
  { name: 'Dashboard', href: '/agency/dashboard', icon: LayoutDashboard },
  { name: 'Referred Cases', href: '/agency/referred-cases', icon: ClipboardList },
  { name: 'Feedbacks', href: '/agency/feedbacks', icon: ClipboardList },
  { name: 'Services', href: '/agency/services', icon: Briefcase },
  { name: 'Reports', href: '/agency/reports', icon: BarChart3 },
  { name: 'Activity', href: '/agency/activity', icon: History },
]

export default function AgencyLayout(): JSX.Element {
  const navigate = useNavigate()
  const [activeProfile, setActiveProfile] = useState(() => getActiveUserProfile())

  useEffect(() => {
    return subscribeToActiveUserProfile(() => {
      setActiveProfile(getActiveUserProfile())
    })
  }, [])

  const initials = useMemo(() => {
    const tokens = (activeProfile?.name || 'Agency User').trim().split(/\s+/).filter(Boolean)
    return tokens.slice(0, 2).map((token) => token[0]?.toUpperCase() || '').join('') || 'AF'
  }, [activeProfile?.name])

  const handleLogout = () => {
    clearActiveRole()
    navigate('/login')
  }

  return (
    <div className="flex h-screen bg-[#f1f4fa] font-sans">
      <AppSidebar 
        navigation={navigation} 
        user={{
          name: activeProfile?.name || 'Josephus Kim L. Sarsonas',
          role: getRoleProfileLabel(activeProfile?.role || 'Agency'),
          initials,
          avatarUrl: activeProfile?.avatarUrl,
        }}
        profileHref="/agency/profile"
        onLogout={handleLogout}
      />

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col overflow-hidden">
        <div className="flex-1 overflow-y-auto p-8 pt-10">
          <Outlet />
        </div>
      </main>
    </div>
  )
}