import { Link, useLocation } from 'react-router-dom'
import { AppAnchorButton, AppButton } from '../ui/AppButton'

type HeaderLink = {
  label: string
  href: string
  useRouterLink?: boolean
  isActive?: boolean
}

export const APP_NAV_LINKS: HeaderLink[] = [
  { label: 'Home', href: '/', useRouterLink: true },
  { label: 'Track Your Case', href: '/track', useRouterLink: true },
  { label: 'Partner Agencies', href: '/agencies', useRouterLink: true },
  { label: 'Contact Us', href: '/contact', useRouterLink: true },
]

type AppHeaderProps = {
  navLinks?: HeaderLink[]
  onTrackCaseClick?: () => void
  trackCaseHref?: string
  trackCaseUsesRouterLink?: boolean
}

function HeaderNavigationLink({ label, href, useRouterLink, isActive }: HeaderLink) {
  const classes = isActive
    ? 'border-b-2 border-[#005288] pb-1 font-label text-[14px] font-bold text-[#005288]'
    : 'font-label text-[14px] font-medium text-slate-600 transition-colors duration-200 hover:text-[#005288]'

  if (useRouterLink) {
    return (
      <Link className={classes} to={href}>
        {label}
      </Link>
    )
  }

  return (
    <a className={classes} href={href}>
      {label}
    </a>
  )
}

export default function AppHeader({
  navLinks,
  onTrackCaseClick,
  trackCaseHref = '/track',
  trackCaseUsesRouterLink = true,
}: AppHeaderProps) {
  const location = useLocation()

  const linksToRender = navLinks || APP_NAV_LINKS.map(link => ({
    ...link,
    // Provide a simple active state heuristic based on pathname
    isActive: location.pathname !== '/' && link.href.startsWith(location.pathname) 
      ? true 
      : (location.pathname === '/' && link.href === '/'),
  }))

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-gray-200 bg-white">
      <div className="mx-auto flex w-full max-w-7xl items-center justify-between px-4 py-4 md:px-8">
        <div className="flex items-center gap-4">
          <div className="flex h-[40px] w-[40px] items-center justify-center overflow-hidden rounded-full border border-gray-200 bg-white">
            <img src="/logo.png" alt="Bayanihan Logo" className="h-8 w-8 object-contain" />
          </div>
          <div className="flex flex-col">
            <span className="font-headline text-[18px] font-bold text-[#005288]">Bayanihan One Window</span>
            <span className="text-[12px] font-medium text-slate-500 uppercase tracking-wide">DMW Region VII</span>
          </div>
        </div>

        <div className="hidden items-center gap-8 md:flex">
          {linksToRender.map((navLink) => (
            <HeaderNavigationLink key={`${navLink.label}-${navLink.href}`} {...navLink} />
          ))}
        </div>

        <div className="flex items-center gap-4">
          {onTrackCaseClick ? (
            <AppButton variant="primary" onClick={onTrackCaseClick}>
              Track Case
            </AppButton>
          ) : trackCaseHref ? (
            <AppAnchorButton
              href={trackCaseHref}
              useRouterLink={trackCaseUsesRouterLink}
              variant="primary"
            >
              Track Case
            </AppAnchorButton>
          ) : (
            <AppButton variant="primary">
              Track Case
            </AppButton>
          )}
          <Link to="/login">
            <AppButton variant="outline">Login</AppButton>
          </Link>
        </div>
      </div>
    </nav>
  )
}
