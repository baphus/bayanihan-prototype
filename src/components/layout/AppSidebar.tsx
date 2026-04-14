import { Link, useLocation } from 'react-router-dom'
import { clsx } from 'clsx'
import type { ElementType, JSX, ReactNode } from 'react'
import { HelpCircle, LogOut } from 'lucide-react'

export interface NavigationItem {
  name: string
  href: string
  icon: ElementType
}

export interface NavigationGroup {
  label: string
  items: NavigationItem[]
}

export interface UserProfile {
  name: string
  role: string
  avatarUrl?: string
  initials: string
}

interface AppSidebarProps {
  navigation?: NavigationItem[]
  navigationGroups?: NavigationGroup[]
  user: UserProfile
  onLogout?: () => void
  logo?: ReactNode
}

export default function AppSidebar({ navigation = [], navigationGroups, user, onLogout, logo }: AppSidebarProps): JSX.Element {
  const location = useLocation()
  const groupedNavigation = navigationGroups ?? [{ label: '', items: navigation }]

  return (
    <aside className="w-64 bg-[#f8f9fa] border-r border-slate-200 hidden md:flex shrink-0 h-full font-body flex-col">
      <div className="flex-1 min-h-0">
        {/* Logo Section */}
        <div className="h-24 flex items-center px-8 border-b border-transparent">
          {logo || (
            <div className="flex items-center gap-3 w-full">
              <div className="w-10 h-10 flex items-center justify-center shrink-0">
                <img src="/logo.png" alt="Bayanihan Logo" className="w-full h-full object-contain" />
              </div>
              <div className="flex flex-col">
                <span className="text-lg font-extrabold font-headline tracking-tight text-blue-950">Bayanihan</span>
                <span className="text-[10px] font-bold font-label uppercase tracking-[0.08em] text-slate-500">Region VII</span>
              </div>
            </div>
          )}
        </div>

        {/* Navigation Links */}
        <nav className="h-[calc(100%-6rem)] overflow-y-auto pt-3 pb-4">
          {groupedNavigation.map((group) => (
            <div key={group.label || 'default'} className="mb-3">
              {group.label ? (
                <p className="px-8 pb-2 text-[10px] font-bold font-label uppercase tracking-[0.09em] text-slate-500">
                  {group.label}
                </p>
              ) : null}
              <div className="space-y-1">
                {group.items.map((item) => {
                  const isActive = location.pathname.startsWith(item.href)
                  return (
                    <Link
                      key={item.name}
                      to={item.href}
                      className={clsx(
                        'flex items-center gap-4 px-8 py-3.5 text-[14px] font-label transition-colors border-l-4',
                        isActive
                          ? 'bg-slate-100/60 text-blue-900 font-bold border-blue-900'
                          : 'text-slate-600 font-medium hover:bg-slate-100/40 hover:text-slate-900 border-transparent'
                      )}
                    >
                      <item.icon className={clsx('w-[22px] h-[22px]', isActive ? 'text-blue-900' : 'text-slate-600')} strokeWidth={isActive ? 2.5 : 2} />
                      {item.name}
                    </Link>
                  )
                })}
              </div>
            </div>
          ))}
        </nav>
      </div>

      {/* Bottom Section */}
      <div className="flex flex-col">
        {/* Help Center */}
        <div className="border-t border-slate-200 border-b border-slate-200">
          <Link
            to="/help"
            className="flex items-center gap-4 px-8 py-5 text-[14px] font-medium font-label text-slate-600 hover:text-slate-900 hover:bg-slate-100/40 transition-colors"
          >
            <HelpCircle className="w-[22px] h-[22px] text-slate-600" strokeWidth={2} />
            <span>Help Center</span>
          </Link>
        </div>

        {/* User Profile */}
        <div className="flex items-center justify-between px-6 py-6 bg-white">
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <div className="flex flex-col">
              <span className="text-[13px] text-blue-950 font-bold font-body leading-tight whitespace-nowrap">{user.name}</span>
              <span className="text-[10px] font-bold tracking-[0.06em] text-slate-500 mt-0.5 whitespace-nowrap max-w-[150px] overflow-hidden text-ellipsis">{user.role}</span>
            </div>
          </div>
          <button 
            onClick={onLogout}
            className="text-red-500 hover:text-red-700 transition-colors ml-2" 
            title="Log Out"
          >
            <LogOut className="w-[22px] h-[22px]" strokeWidth={2} />
          </button>
        </div>
      </div>
    </aside>
  )
}