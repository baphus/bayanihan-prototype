import { LayoutDashboard, FolderOpen, User, ArrowLeftRight, Users, BarChart3, History } from 'lucide-react'
import { Outlet, useNavigate } from 'react-router-dom'
import type { JSX } from 'react'
import AppSidebar from './AppSidebar'
import { clearActiveRole } from '../../utils/authSession'

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

  const handleLogout = () => {
    clearActiveRole()
    navigate('/login')
  }

  return (
    <div className="flex h-screen bg-[#f1f4fa] font-sans">
      {/* Reusable Sidebar */}
      <AppSidebar 
        navigation={navigation} 
        user={{
          name: 'Marychris M. Relon',
          role: 'Case Manager',
          initials: 'MR',
           // Assuming there's a profile url optionally available
        }}
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
