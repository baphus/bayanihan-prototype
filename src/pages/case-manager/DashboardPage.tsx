import { ArrowRightLeft, Users, FolderCheck, Plus, Send, Eye, MoreHorizontal, ChevronRight } from 'lucide-react'
import type { ReactNode } from 'react'
import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { type Column } from '../../components/ui/UnifiedTable'
import { RecentTable } from '../../components/ui/RecentTable'
import {
  CASE_MANAGER_CASES,
  formatDisplayDate,
  getAgencyReferralBreakdown,
  getCaseManagerAgencies,
  getDashboardNotificationDeliveryLogsByRole,
  getExistingClientProfile,
  getStatusBreakdown,
  toCaseHealthStatus,
} from '../../data/unifiedData'
import { getManagedCases, getManagedLatestMilestone, getManagedReferrals } from '../../data/caseLifecycleStore'

import { getStatusBadgeClass } from '../agency/statusBadgeStyles'
import NotificationBell from '../../components/ui/NotificationBell'

type CaseRowData = {
  rowId: string
  caseNo: string
  caseStatus: string
  referralStatus: string
  update: string
  agency: string
  agencyCode: string
  agencyLogoUrl: string
}

export default function DashboardPage() {
  const navigate = useNavigate()

  const managedCases = useMemo(() => getManagedCases(), [])
  const referrals = useMemo(() => getManagedReferrals(), [])

  const latestReferralByCaseId = useMemo(() => {
    const acc: Record<string, (typeof referrals)[number]> = {}

    referrals.forEach((referral) => {
      const existing = acc[referral.caseId]
      if (!existing || new Date(referral.updatedAt).getTime() > new Date(existing.updatedAt).getTime()) {
        acc[referral.caseId] = referral
      }
    })

    return acc
  }, [referrals])

  const sortedCases = useMemo(
    () => [...managedCases].sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()),
    [managedCases],
  )

  const agenciesById = useMemo(
    () =>
      getCaseManagerAgencies().reduce<Record<string, { logoUrl: string }>>((acc, agency) => {
        acc[agency.id] = { logoUrl: agency.logoUrl }
        return acc
      }, {}),
    [],
  )

  const recentCases: CaseRowData[] = sortedCases.slice(0, 5).map((item) => {
    const latestReferral = latestReferralByCaseId[item.id]
    const latestMilestone = latestReferral ? getManagedLatestMilestone(latestReferral.id, '') : ''
    const latestUpdateText = latestMilestone
      ? `"${latestMilestone}"`
      : latestReferral
        ? latestReferral.status === 'PENDING'
          ? '"Awaiting agency acceptance"'
          : latestReferral.status === 'PROCESSING'
            ? '"Referral is being processed"'
            : latestReferral.status === 'COMPLETED'
              ? '"Referral completed by agency"'
              : '"Referral returned by agency"'
        : `"${item.milestone}"`

    return {
      rowId: item.id,
      caseNo: item.caseNo,
      caseStatus: toCaseHealthStatus(item.status),
      referralStatus: latestReferral?.status ?? item.status,
      update: latestUpdateText,
      agency: latestReferral?.agencyName ?? item.agencyName,
      agencyCode: item.agencyShort,
      agencyLogoUrl: agenciesById[(latestReferral?.agencyId ?? item.agencyId)]?.logoUrl ?? '/logo.png',
    }
  })

  const uniqueClientCount = useMemo(() => new Set(referrals.map((item) => item.clientName)).size, [referrals])
  const pendingCount = useMemo(() => referrals.filter((item) => item.status === 'PENDING').length, [referrals])
  const closureReadyCount = useMemo(() => referrals.filter((item) => item.status === 'COMPLETED').length, [referrals])

  const statusBreakdown = useMemo(() => getStatusBreakdown(CASE_MANAGER_CASES), [])
  const totalCases = managedCases.length
  const openCount = managedCases.filter((item) => item.status === 'PENDING' || item.status === 'PROCESSING').length
  const closedCount = managedCases.filter((item) => item.status === 'COMPLETED' || item.status === 'REJECTED').length
  const totalReferrals = referrals.length
  const completedReferralsCount = statusBreakdown.COMPLETED
  const averageReferralCompletionRate = totalReferrals > 0 ? Math.round((completedReferralsCount / totalReferrals) * 100) : 0
  const averageCaseDaysToClose = useMemo(() => {
    const closedCases = managedCases.filter((item) => toCaseHealthStatus(item.status) === 'CLOSED')
    if (closedCases.length === 0) {
      return 0
    }

    const totalDays = closedCases.reduce((sum, item) => {
      const created = new Date(item.createdAt).getTime()
      const closed = new Date(item.updatedAt).getTime()
      const days = Math.max(1, Math.round((closed - created) / (1000 * 60 * 60 * 24)))
      return sum + days
    }, 0)

    return Math.round((totalDays / closedCases.length) * 10) / 10
  }, [managedCases])

  const referralStatusStats = useMemo(() => {
    const total = referrals.length || 1;
    let pending = 0, processing = 0, completed = 0, rejected = 0;
    referrals.forEach(r => {
      if (r.status === 'PENDING') pending++;
      if (r.status === 'PROCESSING') processing++;
      if (r.status === 'COMPLETED') completed++;
      if (r.status === 'REJECTED') rejected++;
    });
    
    return [
      { label: 'Pending', count: pending, color: 'bg-amber-500', hex: '#f59e0b' },
      { label: 'Processing', count: processing, color: 'bg-blue-500', hex: '#3b82f6' },
      { label: 'Completed', count: completed, color: 'bg-emerald-500', hex: '#10b981' },
      { label: 'Rejected', count: rejected, color: 'bg-rose-500', hex: '#f43f5e' },
    ].filter(item => item.count > 0).map(s => ({ ...s, percent: Math.round((s.count / total) * 100) }));
  }, [referrals]);

  const casesStatusStats = useMemo(() => {
    const total = CASE_MANAGER_CASES.length || 1;
    const open = statusBreakdown.PENDING + statusBreakdown.PROCESSING;
    const closed = statusBreakdown.COMPLETED + statusBreakdown.REJECTED;

    return [
      { label: 'Open', count: open, color: 'bg-blue-900', hex: '#1e3a8a' },
      { label: 'Closed', count: closed, color: 'bg-slate-300', hex: '#cbd5e1' },
    ].filter(item => item.count > 0).map(s => ({ ...s, percent: Math.round((s.count / total) * 100) }));
  }, [statusBreakdown]);

  const casesByProvinceStats = useMemo(() => {
    const provinceCounts: Record<string, number> = {};
    const total = CASE_MANAGER_CASES.length || 1;

    CASE_MANAGER_CASES.forEach((item) => {
      const province = item.ofwProfile?.address?.provinceName || getExistingClientProfile(item.clientName).address.provinceName || 'Unknown';
      provinceCounts[province] = (provinceCounts[province] || 0) + 1;
    });

    const colors = ['#0f766e', '#ea580c', '#1e3a8a', '#6d28d9', '#be123c', '#4338ca'];
    const bgColors = ['bg-teal-700', 'bg-orange-600', 'bg-blue-900', 'bg-violet-700', 'bg-rose-700', 'bg-indigo-700'];

    return Object.entries(provinceCounts)
      .map(([province, count], index) => {
        const colorIndex = index % colors.length;
        return {
          label: province,
          count,
          hex: colors[colorIndex],
          color: bgColors[colorIndex],
          percent: Math.round((count / total) * 100),
        };
      })
      .sort((a, b) => b.count - a.count);
  }, []);

  const agencyStats = useMemo(() => {
    const all = getAgencyReferralBreakdown(CASE_MANAGER_CASES);
    const total = all.reduce((sum, a) => sum + a.count, 0) || 1;
    const colors = ['#1e3a8a', '#0f766e', '#ea580c', '#6d28d9', '#be123c', '#4338ca'];
    const bgColors = ['bg-blue-900', 'bg-teal-700', 'bg-orange-600', 'bg-violet-700', 'bg-rose-700', 'bg-indigo-700'];
    
    return all.map((item, i) => {
      const colorIndex = i % colors.length;
      return {
        label: item.agencyName,
        count: item.count,
        hex: colors[colorIndex],
        color: bgColors[colorIndex],
        percent: Math.round((item.count / total) * 100)
      };
    });
  }, []);

  const todayLabel = new Intl.DateTimeFormat('en-US', {
    weekday: 'long',
    month: 'long',
    day: '2-digit',
    year: 'numeric',
  }).format(new Date())

  const dashboardNotifications = useMemo(() => getDashboardNotificationDeliveryLogsByRole('Case Manager'), [])

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

  const casesOverTime = useMemo(() => {
    const sourceCases = managedCases.length > 0 ? managedCases : CASE_MANAGER_CASES
    const buckets = new Map<string, { key: string; label: string; count: number }>()
    const now = new Date()
    const monthStarts: Date[] = []

    for (let offset = 5; offset >= 0; offset -= 1) {
      const monthDate = new Date(now.getFullYear(), now.getMonth() - offset, 1)
      monthStarts.push(monthDate)
      const key = `${monthDate.getFullYear()}-${String(monthDate.getMonth() + 1).padStart(2, '0')}`
      const label = new Intl.DateTimeFormat('en-US', { month: 'short' }).format(monthDate)
      buckets.set(key, { key, label, count: 0 })
    }

    const minMonthStart = monthStarts[0].getTime()

    sourceCases.forEach((item) => {
      const date = new Date(item.createdAt)
      const monthStart = new Date(date.getFullYear(), date.getMonth(), 1).getTime()

      if (monthStart < minMonthStart) {
        return
      }

      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
      const existing = buckets.get(key)

      if (existing) {
        existing.count += 1
      }
    })

    return Array.from(buckets.values())
  }, [managedCases])

  const casesOverTimeMax = casesOverTime.reduce((acc, item) => Math.max(acc, item.count), 1)

  const recentCasesColumns: Column<CaseRowData>[] = [
    {
      key: 'caseNo',
      title: 'TRACKING ID',
      render: (row) => <span className="text-xs text-slate-900 font-body">{row.caseNo}</span>
    },
    {
      key: 'caseStatus',
      title: 'CASE STATUS',
      render: (row) => {
        const isOpen = row.caseStatus === 'OPEN'
        return (
          <span className={`px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-widest rounded ${isOpen ? 'bg-blue-100 text-blue-900' : 'bg-slate-200 text-slate-600'}`}>
            {row.caseStatus}
          </span>
        )
      }
    },
    {
      key: 'referralStatus',
      title: 'REF. STATUS',
      render: (row) => {
        return (
          <span className={`inline-flex rounded-[2px] border px-2 py-1 text-[9px] font-bold uppercase tracking-widest ${getStatusBadgeClass(row.referralStatus as any)}`}>
            {row.referralStatus}
          </span>
        )
      }
    },
    {
      key: 'agency',
      title: 'REFERRED AGENCY',
      render: (row) => (
        <span className="flex items-center justify-center" title={row.agency}>
          <div className="h-6 w-6 overflow-hidden rounded-full border border-white bg-white shadow-sm">
            <img src={row.agencyLogoUrl} alt={row.agencyCode} className="h-full w-full object-contain p-[1px]" />
          </div>
        </span>
      )
    },
    {
      key: 'update',
      title: 'LATEST UPDATE',
      render: (row) => (
        <span className="flex items-center gap-1.5 text-xs text-slate-500 font-body">
          <div className="h-3 w-3 overflow-hidden rounded-full border border-white bg-white shadow-sm">
            <img src={row.agencyLogoUrl} alt={row.agencyCode} className="h-full w-full object-contain" />
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
        <div className="self-start md:self-auto">
          <NotificationBell notifications={dashboardNotifications} />
        </div>
      </header>

      {/* TOP SUMMARY CARDS */}
      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3 mb-6">
        <StatCard
          title="TOTAL CASES"
          value={String(openCount)}
          trend="OPEN CASES"
          desc={`Out of ${totalCases} total managed cases`}
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
        <StatCard
          title="AVG REFERRAL COMPLETION RATE"
          value={`${averageReferralCompletionRate}%`}
          trend={`${completedReferralsCount} completed referrals`}
          desc="Completed out of total referrals"
          icon={<FolderCheck className="w-5 h-5 text-blue-800 opacity-50" />}
        />
        <StatCard
          title="AVG DAYS TO CASE CLOSURE"
          value={averageCaseDaysToClose.toFixed(1)}
          trend={`${closedCount} closed cases`}
          desc="Average days from case creation to closure"
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

          {/* CASES SECTION */}
          <h2 className="text-[13px] font-bold font-headline text-slate-500 mb-3 uppercase tracking-wider">Cases Breakdown</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
              <h3 className="text-[15px] font-bold font-headline text-blue-900 mb-4">Cases by Status</h3>
              <div className="relative flex justify-center items-center py-2">
                <PieChart data={casesStatusStats} className="w-24 h-24" />
                <div className="ml-6 space-y-1.5 flex-1">
                  {casesStatusStats.map(stat => (
                    <div key={stat.label} className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <span className={`w-2 h-2 rounded-full shrink-0 ${stat.color}`}></span>
                        <span className="text-[11px] font-medium text-slate-800 font-label truncate" title={stat.label}>{stat.label}</span>
                      </div>
                      <span className="text-[11px] font-bold text-slate-500 ml-2">{stat.percent}%</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
              <h3 className="text-[15px] font-bold font-headline text-blue-900 mb-4">Cases by Province</h3>
              <div className="relative flex justify-center items-center py-2">
                <PieChart data={casesByProvinceStats} className="w-24 h-24" />
                <div className="ml-6 space-y-1.5 flex-1">
                  {casesByProvinceStats.map(stat => (
                    <div key={stat.label} className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <span className={`w-2 h-2 rounded-full shrink-0 ${stat.color}`}></span>
                        <span className="text-[11px] font-medium text-slate-800 font-label truncate" title={stat.label}>{stat.label}</span>
                      </div>
                      <span className="text-[11px] font-bold text-slate-500 ml-2">{stat.percent}%</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <section className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 mb-6">
            <h3 className="text-[15px] font-bold font-headline text-blue-900 mb-3">Cases Over Time</h3>
            <div className="h-36">
              <div className="flex h-full items-end gap-2">
                {casesOverTime.map((item) => (
                  <div key={item.key} className="flex-1 min-w-0 flex h-full flex-col items-center justify-end gap-1">
                  <div className="text-[10px] font-bold text-slate-500">{item.count}</div>
                  <div
                    className="w-full rounded-t-md bg-blue-800/80"
                    style={{ height: `${Math.max(10, Math.round((item.count / casesOverTimeMax) * 96))}px` }}
                  />
                  <div className="text-[10px] font-bold uppercase tracking-wide text-slate-500">{item.label}</div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* REFERRALS SECTION */}
          <h2 className="text-[13px] font-bold font-headline text-slate-500 mb-3 uppercase tracking-wider">Referrals Breakdown</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
              <h3 className="text-[15px] font-bold font-headline text-blue-900 mb-4">Referrals by Status</h3>
              <div className="relative flex justify-center items-center py-2">
                <PieChart data={referralStatusStats} className="w-24 h-24" />
                <div className="ml-6 space-y-1.5 flex-1">
                  {referralStatusStats.map(stat => (
                    <div key={stat.label} className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <span className={`w-2 h-2 rounded-full shrink-0 ${stat.color}`}></span>
                        <span className="text-[11px] font-medium text-slate-800 font-label truncate" title={stat.label}>{stat.label}</span>
                      </div>
                      <span className="text-[11px] font-bold text-slate-500 ml-2">{stat.percent}%</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
              <h3 className="text-[15px] font-bold font-headline text-blue-900 mb-4">Referrals by Agency</h3>
              <div className="relative flex justify-center items-center py-2">
                <PieChart data={agencyStats} className="w-24 h-24" />
                <div className="ml-6 space-y-1.5 flex-1 h-24 overflow-y-auto pr-1">
                  {agencyStats.map((stat) => (
                    <div key={stat.label} className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <span className={`w-2 h-2 rounded-full shrink-0 ${stat.color}`}></span>
                        <span className="text-[11px] font-medium text-slate-800 font-label truncate max-w-[120px]" title={stat.label}>{stat.label}</span>
                      </div>
                      <span className="text-[11px] font-bold text-slate-500 ml-2">{stat.percent}%</span>
                    </div>
                  ))}
                </div>
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
             <button onClick={() => navigate('/case-manager/cases/new')} className="w-full py-3 px-4 bg-orange-500 text-white rounded-lg flex items-center justify-between shadow-sm shadow-orange-500/20 hover:scale-[1.02] active:scale-[0.98] transition-all">
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

function PieChart({ data, className = "w-16 h-16" }: { data: { label: string; count: number; hex: string }[], className?: string }) {
  const total = data.reduce((sum, item) => sum + item.count, 0) || 1;
  let cumulativePercent = 0;
  
  return (
    <svg viewBox="0 0 63.6619772 63.6619772" className={`${className} -rotate-90 rounded-full shrink-0`}>
      <circle cx="31.8309886" cy="31.8309886" r="31.8309886" fill="#f1f5f9" />
      {data.map(item => {
        const pct = (item.count / total) * 100;
        const offset = 100 - cumulativePercent;
        const strokeDasharray = `${pct} ${100 - pct}`;
        cumulativePercent += pct;
        
        if (pct === 0) return null;
        
        return (
          <circle
            key={item.label}
            r="15.915494309189533"
            cx="31.8309886"
            cy="31.8309886"
            fill="transparent"
            stroke={item.hex}
            strokeWidth="31.8309886"
            strokeDasharray={strokeDasharray}
            strokeDashoffset={offset}
            className="cursor-pointer hover:opacity-80 transition-opacity outline-none"
          >
            <title>{item.label}: {item.count}</title>
          </circle>
        );
      })}
    </svg>
  );
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
        <img src={logoSrc} alt="Activity source" className="h-full w-full object-contain p-[1px]" />
      </span>
      <div className="space-y-0.5">
        <p className="text-xs font-bold text-slate-900 font-body">{title}</p>
        <p className="text-[11px] text-slate-500 font-body leading-relaxed">{desc}</p>
        <p className="text-[9px] font-bold uppercase tracking-widest text-blue-800">{time}</p>
      </div>
    </div>
  )
}