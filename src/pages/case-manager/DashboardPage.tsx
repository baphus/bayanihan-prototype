import { ArrowRightLeft, Users, FolderCheck, Plus, Send, Eye, MoreHorizontal, ChevronRight, BarChart3 } from 'lucide-react'
import type { ReactNode } from 'react'
import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { type Column } from '../../components/ui/UnifiedTable'
import { RecentTable } from '../../components/ui/RecentTable'
import {
  CASE_MANAGER_CASES,
  getCaseManagerReferrals,
  formatDisplayDate,
  getAgencyReferralBreakdown,
  getCaseManagerAgencies,
  getStatusBreakdown,
  toCaseHealthStatus,
} from '../../data/unifiedData'

type CaseRowData = {
  rowId: string
  caseNo: string
  status: string
  update: string
  agency: string
  agencyCode: string
  agencyLogoUrl: string
}

export default function DashboardPage() {
  const navigate = useNavigate()

  const referrals = useMemo(() => getCaseManagerReferrals(), [])

  const sortedCases = useMemo(
    () => [...CASE_MANAGER_CASES].sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()),
    [],
  )

  const agenciesById = useMemo(
    () =>
      getCaseManagerAgencies().reduce<Record<string, { logoUrl: string }>>((acc, agency) => {
        acc[agency.id] = { logoUrl: agency.logoUrl }
        return acc
      }, {}),
    [],
  )

  const recentCases: CaseRowData[] = sortedCases.slice(0, 5).map((item) => ({
    rowId: item.id,
    caseNo: item.caseNo,
    status: toCaseHealthStatus(item.status),
    update: `"${item.milestone}"`,
    agency: item.agencyName,
    agencyCode: item.agencyShort,
    agencyLogoUrl: agenciesById[item.agencyId]?.logoUrl ?? '/logo.png',
  }))

  const uniqueClientCount = useMemo(() => new Set(referrals.map((item) => item.clientName)).size, [referrals])
  const pendingCount = useMemo(() => referrals.filter((item) => item.status === 'PENDING').length, [referrals])
  const closureReadyCount = useMemo(() => referrals.filter((item) => item.status === 'COMPLETED').length, [referrals])

  const statusBreakdown = useMemo(() => getStatusBreakdown(CASE_MANAGER_CASES), [])
  const openCount = statusBreakdown.PENDING + statusBreakdown.PROCESSING
  const totalCases = referrals.length
  const openPercent = totalCases > 0 ? Math.round((openCount / totalCases) * 100) : 0
  const closedPercent = 100 - openPercent

  const topAgencies = useMemo(() => getAgencyReferralBreakdown(CASE_MANAGER_CASES).slice(0, 4), [])
  const topAgencyMax = topAgencies[0]?.count ?? 1

  const todayLabel = new Intl.DateTimeFormat('en-US', {
    weekday: 'long',
    month: 'long',
    day: '2-digit',
    year: 'numeric',
  }).format(new Date())

  const clientTypeStats = useMemo(() => {
    const ofw = CASE_MANAGER_CASES.filter((item) => item.clientType === 'Overseas Filipino Worker').length
    const nok = CASE_MANAGER_CASES.filter((item) => item.clientType === 'Next of Kin').length

    return { ofw, nok }
  }, [])

  const recentActivity = useMemo(
    () =>
      [...referrals]
        .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
        .slice(0, 4)
        .map((item) => ({
          id: item.id,
          title:
            item.status === 'PENDING'
              ? 'Referral Queued'
              : item.status === 'PROCESSING'
                ? 'Referral Processing'
                : item.status === 'COMPLETED'
                  ? 'Referral Completed'
                  : 'Referral Returned',
          desc: `${item.caseNo} for ${item.clientName} was updated by ${item.agencyName}.`,
          time: formatDisplayDate(item.updatedAt),
          logoSrc: agenciesById[item.agencyId]?.logoUrl ?? '/logo.png',
        })),
    [referrals, agenciesById],
  )

  const monthlyReferralVolume = useMemo(() => {
    const bucket = new Map<string, { key: string; label: string; count: number }>()

    referrals.forEach((item) => {
      const date = new Date(item.createdAt)
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
      const label = new Intl.DateTimeFormat('en-US', { month: 'short' }).format(date)
      const existing = bucket.get(key)

      if (existing) {
        existing.count += 1
      } else {
        bucket.set(key, { key, label, count: 1 })
      }
    })

    return Array.from(bucket.values())
      .sort((a, b) => a.key.localeCompare(b.key))
      .slice(-6)
  }, [referrals])

  const monthlyVolumeMax = monthlyReferralVolume.reduce((acc, item) => Math.max(acc, item.count), 1)

  const monthlyCompletionRate = useMemo(() => {
    const bucket = new Map<string, { key: string; label: string; total: number; completed: number }>()

    referrals.forEach((item) => {
      const date = new Date(item.updatedAt)
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
      const label = new Intl.DateTimeFormat('en-US', { month: 'short' }).format(date)
      const existing = bucket.get(key)

      if (existing) {
        existing.total += 1
        if (item.status === 'COMPLETED') {
          existing.completed += 1
        }
      } else {
        bucket.set(key, {
          key,
          label,
          total: 1,
          completed: item.status === 'COMPLETED' ? 1 : 0,
        })
      }
    })

    return Array.from(bucket.values())
      .sort((a, b) => a.key.localeCompare(b.key))
      .slice(-6)
      .map((item) => ({
        label: item.label,
        rate: item.total > 0 ? Math.round((item.completed / item.total) * 100) : 0,
      }))
  }, [referrals])

  const recentCasesColumns: Column<CaseRowData>[] = [
    {
      key: 'caseNo',
      title: 'TRACKING ID',
      render: (row) => <span className="text-xs text-slate-900 font-body">{row.caseNo}</span>
    },
    {
      key: 'status',
      title: 'STATUS',
      render: (row) => {
        const isOpen = row.status === 'OPEN'
        return (
          <span className={`px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-widest rounded ${isOpen ? 'bg-blue-100 text-blue-900' : 'bg-slate-200 text-slate-600'}`}>
            {row.status}
          </span>
        )
      }
    },
    {
      key: 'agency',
      title: 'REFERRED AGENCY',
      render: (row) => (
        <span className="flex items-center gap-1.5 text-xs text-slate-700 font-body">
          <div className="h-5 w-5 overflow-hidden rounded-full border border-white bg-white shadow-sm">
            <img src={row.agencyLogoUrl} alt={row.agencyCode} className="h-full w-full object-cover" />
          </div>
          {row.agency}
        </span>
      )
    },
    {
      key: 'update',
      title: 'LATEST UPDATE',
      render: (row) => (
        <span className="flex items-center gap-1.5 text-xs text-slate-500 font-body">
          <div className="h-3 w-3 overflow-hidden rounded-full border border-white bg-white shadow-sm">
            <img src={row.agencyLogoUrl} alt={row.agencyCode} className="h-full w-full object-cover" />
          </div>
          <span>{row.update}</span>
        </span>
      )
    },
    {
      key: 'action',
      title: 'ACTION',
      className: 'text-right',
      render: (row) => (
        <button
          onClick={() => navigate(`/case-manager/cases/${row.rowId}`)}
          className="text-[11px] font-bold font-label text-blue-900 px-2 py-1 rounded bg-blue-50 hover:bg-blue-100 transition-all outline-none"
        >
          View
        </button>
      )
    }
  ]

  return (
    <div className="max-w-7xl mx-auto pb-4">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-2 mb-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold font-headline tracking-tight leading-tight text-blue-900 flex items-center gap-2 mb-1">
            Welcome back, Marychris! <span role="img" aria-label="wave">👋</span>
          </h1>
          <p className="text-xs text-slate-500 font-body mt-0 flex items-center gap-2">
            Today is {todayLabel}
          </p>
        </div>
      </header>

      {/* TOP SUMMARY CARDS */}
      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <StatCard
          title="TOTAL CASES"
          value={String(totalCases)}
          trend={`${openCount} open referrals`}
          desc="Active cases under your management"
          icon={<FolderCheck className="w-5 h-5 text-blue-800 opacity-50" />}
        />
        <StatCard
          title="TOTAL CLIENTS"
          value={String(uniqueClientCount)}
          trend={`${clientTypeStats.ofw} OFW • ${clientTypeStats.nok} NOK`}
          desc="Overseas Filipino Workers / Next of Kin"
          icon={<Users className="w-5 h-5 text-blue-800 opacity-50" />}
        />
        <StatCard
          title="PENDING REFERRALS"
          value={String(pendingCount)}
          desc="Awaiting agency confirmation"
          icon={<ArrowRightLeft className="w-5 h-5 text-blue-800 opacity-50" />}
        />
        <StatCard
          title="READY FOR CLOSURE"
          value={String(closureReadyCount)}
          trend="Referrals marked as Completed"
          desc="Milestones completed"
          icon={<FolderCheck className="w-5 h-5 text-blue-800 opacity-50" />}
        />
      </section>

      <div className="grid grid-cols-12 gap-4">
        {/* Left Column */}
        <div className="col-span-12 lg:col-span-8 space-y-4">
          {/* RECENT CASES TABLE */}
          <RecentTable
            title="Recent Cases"
            data={recentCases}
            columns={recentCasesColumns}
            keyExtractor={(row) => row.rowId}
            onViewAll={() => console.log('View all cases')}
          />

          {/* ANALYTICS */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
              <h3 className="text-[15px] font-bold font-headline text-blue-900 mb-4">Referrals by Status</h3>
              <div className="relative flex justify-center items-center py-2">
                <div className="w-24 h-24 rounded-full bg-slate-200 relative overflow-hidden" style={{ background: `conic-gradient(#1e3a8a 0% ${openPercent}%, #e2e8f0 ${openPercent}% 100%)` }}></div>
                <div className="ml-4 space-y-1">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-blue-900"></span>
                    <span className="text-[11px] font-medium text-slate-800 font-label">{openPercent}% Open</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-slate-200"></span>
                    <span className="text-[11px] font-medium text-slate-500 font-label">{closedPercent}% Closed</span>
                  </div>
                </div>
              </div>
            </div>
            <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
              <h3 className="text-[15px] font-bold font-headline text-blue-900 mb-4">Referrals by Agency</h3>
              <div className="space-y-4">
                {topAgencies.map((item, index) => (
                  <BarItem
                    key={item.agencyName}
                    label={item.agencyName}
                    color={index % 2 === 0 ? 'bg-blue-900' : 'bg-teal-700'}
                    width={`${Math.max(10, Math.round((item.count / topAgencyMax) * 100))}%`}
                    val={String(item.count)}
                  />
                ))}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
              <h3 className="text-[15px] font-bold font-headline text-blue-900 mb-3 flex items-center gap-2">
                <BarChart3 className="h-4 w-4" /> Referral Volume Trend
              </h3>
              <div className="flex items-end gap-2 h-36">
                {monthlyReferralVolume.map((item) => (
                  <div key={item.key} className="flex-1 min-w-0 flex flex-col items-center justify-end gap-1">
                    <div className="text-[10px] font-bold text-slate-500">{item.count}</div>
                    <div
                      className="w-full rounded-t-md bg-blue-800/80"
                      style={{ height: `${Math.max(12, Math.round((item.count / monthlyVolumeMax) * 100))}%` }}
                    />
                    <div className="text-[10px] font-bold uppercase tracking-wide text-slate-500">{item.label}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
              <h3 className="text-[15px] font-bold font-headline text-blue-900 mb-3">Monthly Completion Rate</h3>
              <div className="space-y-3">
                {monthlyCompletionRate.map((item) => (
                  <div key={item.label} className="space-y-1">
                    <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-[0.12em] text-slate-500">
                      <span>{item.label}</span>
                      <span>{item.rate}%</span>
                    </div>
                    <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-emerald-600"
                        style={{ width: `${item.rate}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* REGIONAL BREAKDOWN */}
          <section className="space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="text-[15px] font-bold font-headline text-blue-900">Client Breakdown: <span className="text-slate-900 text-xs">Current referral load</span></h3>
              <button className="text-slate-400 hover:text-slate-600"><MoreHorizontal className="w-4 h-4"/></button>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              <div className="bg-white p-3 rounded-lg border border-slate-200 hover:border-blue-900/30 transition-all cursor-default group shadow-sm flex flex-col">
                <p className="text-[9px] font-bold uppercase tracking-widest text-slate-500 mb-0.5 group-hover:text-blue-900">OFW CLIENTS</p>
                <p className="text-xl font-black text-slate-900">{clientTypeStats.ofw}</p>
                <p className="text-[10px] font-medium text-teal-700 font-label mt-auto">Current records</p>
              </div>
              <div className="bg-white p-3 rounded-lg border border-slate-200 hover:border-blue-900/30 transition-all cursor-default group shadow-sm flex flex-col">
                <p className="text-[9px] font-bold uppercase tracking-widest text-slate-500 mb-0.5 group-hover:text-blue-900">NEXT OF KIN</p>
                <p className="text-xl font-black text-slate-900">{clientTypeStats.nok}</p>
                <p className="text-[10px] font-medium text-teal-700 font-label mt-auto">Current records</p>
              </div>
              <div className="bg-white p-3 rounded-lg border border-slate-200 hover:border-blue-900/30 transition-all cursor-default group shadow-sm flex flex-col">
                <p className="text-[9px] font-bold uppercase tracking-widest text-slate-500 mb-0.5 group-hover:text-blue-900">PROCESSING</p>
                <p className="text-xl font-black text-slate-900">{statusBreakdown.PROCESSING}</p>
                <p className="text-[10px] font-medium text-teal-700 font-label mt-auto">In progress</p>
              </div>
              <div className="bg-white p-3 rounded-lg border border-slate-200 hover:border-blue-900/30 transition-all cursor-default group shadow-sm flex flex-col">
                <p className="text-[9px] font-bold uppercase tracking-widest text-slate-500 mb-0.5 group-hover:text-blue-900">REJECTED</p>
                <p className="text-xl font-black text-slate-900">{statusBreakdown.REJECTED}</p>
                <p className="text-[10px] font-medium text-teal-700 font-label mt-auto">Requires follow-up</p>
              </div>
            </div>
          </section>

        </div>

        {/* Right Column */}
        <div className="col-span-12 lg:col-span-4 space-y-4">
          
          <section className="space-y-2">
             {/* QUICK ACTIONS */}
             <button onClick={() => navigate('/case-manager/cases')} className="w-full py-3 px-4 bg-orange-500 text-white rounded-lg flex items-center justify-between shadow-sm shadow-orange-500/20 hover:scale-[1.02] active:scale-[0.98] transition-all">
                <span className="flex items-center gap-2 text-[12px] font-bold font-label">
                  <Plus className="w-4 h-4" /> Create New Case
                </span>
                <ChevronRight className="w-4 h-4" />
              </button>

              <ActionBtn onClick={() => navigate('/case-manager/referrals')} icon={<Send className="w-4 h-4 text-blue-900 opacity-80" />} label="Create Referral" />
              <ActionBtn onClick={() => navigate('/case-manager/referrals')} icon={<Eye className="w-4 h-4 text-blue-900 opacity-80" />} label="View Referrals" />
          </section>

          {/* RECENT ACTIVITY */}
          <section className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
            <div className="px-4 py-3 border-b border-slate-100">
              <h3 className="text-[10px] font-bold uppercase tracking-[0.15em] text-blue-900">Recent Activity</h3>
            </div>
            <div className="p-4">
              <div className="relative pl-4 border-l-2 border-slate-100 space-y-6">
                {recentActivity.map((activity) => (
                  <ActivityItem
                    key={activity.id}
                    title={activity.title}
                    desc={activity.desc}
                    time={activity.time.toUpperCase()}
                    logoSrc={activity.logoSrc}
                  />
                ))}
              </div>
              <button className="w-full mt-4 text-[11px] font-bold font-label text-blue-900 hover:text-blue-700 transition-colors">
                VIEW ALL ACTIVITIES
              </button>
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}

function StatCard({ title, value, trend, desc }: { title: string; value: string; trend?: string; desc: string; icon: ReactNode }) {
  return (
    <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex flex-col justify-start relative">
      <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-slate-500 mb-1">{title}</p>
      <div className="flex items-baseline gap-1.5 mb-1.5">
        <h3 className="text-2xl font-black text-slate-900">{value}</h3>
      </div>
      {trend && (
          <span className="text-[9px] font-bold uppercase tracking-widest text-blue-900 bg-blue-50 px-1.5 py-0.5 rounded self-start mb-1.5 inline-block">
            {trend}
          </span>
      )}
      <p className="text-[10px] font-medium text-slate-400 font-label mt-auto">{desc}</p>
    </div>
  )
}

function BarItem({ label, color, width, val }: { label: string; color: string; width: string; val: string }) {
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-[10px] font-bold uppercase tracking-[0.15em] text-slate-500">
        <span>{label}</span>
        <span>{val}</span>
      </div>
      <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
        <div className={`h-full ${color} rounded-full`} style={{ width }}></div>
      </div>
    </div>
  )
}

function ActionBtn({ icon, label, onClick }: { icon: ReactNode; label: string; onClick?: () => void }) {
  return (
    <button onClick={onClick} className="w-full py-3 px-4 bg-white text-blue-900 border border-slate-200 rounded-lg flex items-center gap-2 hover:bg-slate-50 transition-all shadow-sm">
      {icon}
      <span className="text-[12px] font-bold font-label">{label}</span>
    </button>
  )
}

function ActivityItem({ title, desc, time, logoSrc }: { title: string; desc: string; time: string; logoSrc: string }) {
  return (
    <div className="relative">
      <span className="absolute -left-[25px] top-0 h-4 w-4 overflow-hidden rounded-full border border-white bg-white shadow-sm">
        <img src={logoSrc} alt="Activity source" className="h-full w-full object-cover" />
      </span>
      <div className="space-y-0.5">
        <p className="text-xs font-bold text-slate-900 font-body">{title}</p>
        <p className="text-[11px] text-slate-500 font-body leading-relaxed">{desc}</p>
        <p className="text-[9px] font-bold uppercase tracking-widest text-blue-800">{time}</p>
      </div>
    </div>
  )
}