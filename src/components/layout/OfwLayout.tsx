import { FolderOpen, LayoutDashboard, LogOut, Menu, Search, X } from 'lucide-react'
import { Link, Navigate, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { useState, type JSX } from 'react'
import AppSidebar from './AppSidebar'
import { clearActiveRole, getActiveSession } from '../../utils/authSession'

const navigation = [
  { name: 'Dashboard', href: '/ofw/dashboard', icon: LayoutDashboard },
  { name: 'My Cases', href: '/ofw/my-cases', icon: FolderOpen },
  { name: 'Track by ID', href: '/track', icon: Search },
]

function getInitials(name: string): string {
  const tokens = name
    .split(' ')
    .map((part) => part.trim())
    .filter(Boolean)

  if (tokens.length === 0) {
    return 'OFW'
  }

  if (tokens.length === 1) {
    return tokens[0].slice(0, 2).toUpperCase()
  }

  return `${tokens[0][0]}${tokens[1][0]}`.toUpperCase()
}

export default function OfwLayout(): JSX.Element {
  const location = useLocation()
  const navigate = useNavigate()
  const activeSession = getActiveSession()
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false)

  if (!activeSession) {
    return <Navigate to="/login" replace />
  }

  const displayName = activeSession.name || 'OFW User'

  const handleLogout = () => {
    clearActiveRole()
    navigate('/login')
  }

  const handleMobileLogout = () => {
    setIsMobileNavOpen(false)
    handleLogout()
  }

  return (
    <div className="flex h-screen bg-[#f1f4fa] font-sans">
      <AppSidebar
        navigation={navigation}
        user={{
          name: displayName,
          role: 'Overseas Filipino Worker',
          initials: getInitials(displayName),
        }}
        onLogout={handleLogout}
      />

      <main className="flex-1 flex flex-col overflow-hidden relative">
        <header className="md:hidden flex items-center justify-between border-b border-slate-200 bg-white px-4 py-3">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 text-xs font-bold text-blue-900 border border-blue-200">
              {getInitials(displayName)}
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-slate-500">OFW Portal</p>
              <h1 className="text-sm font-bold text-slate-900">{displayName}</h1>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setIsMobileNavOpen(true)}
            className="inline-flex items-center justify-center rounded-md border border-slate-300 p-2 text-slate-700"
            aria-label="Open navigation menu"
          >
            <Menu className="h-5 w-5" />
          </button>
        </header>

        {isMobileNavOpen ? (
          <div className="md:hidden absolute inset-0 z-50 bg-black/40">
            <div className="flex h-full w-[82%] max-w-[320px] flex-col bg-white shadow-xl">
              <div className="flex items-center justify-between border-b border-slate-200 px-4 py-4">
                <p className="text-sm font-bold text-slate-900">Navigation</p>
                <button
                  type="button"
                  onClick={() => setIsMobileNavOpen(false)}
                  className="inline-flex items-center justify-center rounded-md border border-slate-300 p-2 text-slate-700"
                  aria-label="Close navigation menu"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <nav className="px-3 py-4">
                <ul className="space-y-1">
                  {navigation.map((item) => {
                    const isActive = location.pathname.startsWith(item.href)

                    return (
                      <li key={item.href}>
                        <Link
                          to={item.href}
                          onClick={() => setIsMobileNavOpen(false)}
                          className={`flex items-center gap-3 rounded-md px-3 py-3 text-sm font-semibold ${
                            isActive ? 'bg-blue-50 text-blue-900' : 'text-slate-700 hover:bg-slate-100'
                          }`}
                        >
                          <item.icon className="h-4 w-4" />
                          {item.name}
                        </Link>
                      </li>
                    )
                  })}
                </ul>
              </nav>

              <div className="mt-auto border-t border-slate-200 px-3 py-4">
                <button
                  type="button"
                  onClick={handleMobileLogout}
                  className="flex w-full items-center gap-3 rounded-md px-3 py-3 text-sm font-semibold text-red-700 hover:bg-red-50"
                >
                  <LogOut className="h-4 w-4" />
                  Logout
                </button>
              </div>
            </div>
          </div>
        ) : null}

        <div className="flex-1 overflow-y-auto p-8 pt-10">
          <Outlet />
        </div>
      </main>
    </div>
  )
}