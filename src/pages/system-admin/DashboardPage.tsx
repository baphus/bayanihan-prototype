import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { pageHeadingStyles } from '../agency/pageHeadingStyles'
import { getSystemAdminOverviewCards } from '../../data/unifiedData'

const PATH_BY_ENTITY = {
  cases: '/system-admin/cases',
  clients: '/system-admin/clients',
  agencies: '/system-admin/agencies',
  services: '/system-admin/services',
  referrals: '/system-admin/referrals',
  users: '/system-admin/users',
} as const

export default function DashboardPage() {
  const navigate = useNavigate()
  const cards = useMemo(() => getSystemAdminOverviewCards(), [])

  const totals = useMemo(
    () =>
      cards.reduce(
        (acc, card) => {
          acc.total += card.total
          acc.active += card.active
          return acc
        },
        { total: 0, active: 0 },
      ),
    [cards],
  )

  return (
    <div className="mx-auto max-w-7xl space-y-5 pb-6">
      <header>
        <h1 className={pageHeadingStyles.pageTitle}>System Admin Dashboard</h1>
        <p className={pageHeadingStyles.pageSubtitle}>Monitor and manage all platform entities with full CRUD authority.</p>
      </header>

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <MetricCard title="TOTAL PLATFORM RECORDS" value={totals.total} accent="border-[#0b5384]" />
        <MetricCard title="ACTIVE RECORDS" value={totals.active} accent="border-[#16a34a]" />
        <MetricCard title="MANAGED MODULES" value={cards.length} accent="border-[#0284c7]" />
      </section>

      <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {cards.map((card) => (
          <article key={card.id} className="rounded-[4px] border border-[#cbd5e1] bg-white p-5 shadow-sm">
            <p className={pageHeadingStyles.metricLabel}>{card.label.toUpperCase()}</p>
            <p className="mt-2 text-[30px] leading-none font-black text-[#0f172a]">{card.total}</p>
            <p className="mt-2 text-[12px] font-semibold text-slate-600">{card.active} active records</p>
            <button
              type="button"
              onClick={() => navigate(PATH_BY_ENTITY[card.id])}
              className="mt-4 inline-flex min-h-[36px] items-center rounded-[3px] border border-[#cbd5e1] bg-[#f8fafc] px-3 text-[12px] font-bold text-[#0b5384] transition hover:bg-[#eff6ff]"
            >
              Open {card.label}
            </button>
          </article>
        ))}
      </section>
    </div>
  )
}

function MetricCard({ title, value, accent }: { title: string; value: number; accent: string }) {
  return (
    <div className={`rounded-[4px] border border-[#cbd5e1] border-l-[4px] ${accent} bg-white px-4 py-4 shadow-sm`}>
      <p className={pageHeadingStyles.metricLabel}>{title}</p>
      <p className="mt-2 text-[30px] leading-none font-black text-[#0f172a]">{value}</p>
    </div>
  )
}
