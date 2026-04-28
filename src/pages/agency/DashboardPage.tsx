import { ClipboardList, ClipboardType, RefreshCcw, CheckCircle2 } from 'lucide-react'
import type { ReactNode } from 'react'
import { useMemo } from 'react'
import { type Column } from '../../components/ui/UnifiedTable'
import { RecentTable } from '../../components/ui/RecentTable'
import NotificationBell from '../../components/ui/NotificationBell'
import { pageHeadingStyles } from './pageHeadingStyles'
import { getStatusBadgeClass, type AgencyStatus } from './statusBadgeStyles'
import { useNavigate } from 'react-router-dom'
import { REFERRAL_CASES, getDashboardNotificationDeliveryLogsByRole, getCaseManagerAgencies } from '../../data/unifiedData'

type ReferralRowData = {
  rowId: string
  id: string
  clientName: string
  service: string
  status: AgencyStatus
  milestone: string
  received: string
  updated: string
  statusColor: string
}

export default function DashboardPage() {
  const navigate = useNavigate()
  const owwaLogo = getCaseManagerAgencies().find((agency) => agency.id === 'owwa')?.logoUrl ?? '/logo.png'
  const dashboardNotifications = useMemo(() => getDashboardNotificationDeliveryLogsByRole('Agency'), [])

  const recentReferrals: ReferralRowData[] = REFERRAL_CASES.slice(0, 8).map((item) => ({
    rowId: item.id,
    id: item.caseNo,
    clientName: item.clientName,
    service: item.service,
    status: item.status,
    milestone: item.status === 'PENDING' ? '---' : item.milestone,
    received: new Date(item.createdAt).toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' }),
    updated: new Date(item.updatedAt).toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' }),
    statusColor: '',
  }))

  const assignedCount = recentReferrals.length
  const pendingCount = recentReferrals.filter((item) => item.status === 'PENDING').length
  const processingCount = recentReferrals.filter((item) => item.status === 'PROCESSING' || item.status === 'FOR_COMPLIANCE').length
  const completedCount = recentReferrals.filter((item) => item.status === 'COMPLETED').length

  const recentReferralsColumns: Column<ReferralRowData>[] = [
    {
      key: 'id',
      title: 'TRACKING ID',
      render: (row) => (
        <button
          type="button"
          onClick={() => navigate(`/agency/referred-cases/${row.id}`)}
          className="text-[13px] font-bold text-[#0b5384] hover:underline inline-block text-left leading-tight"
        >
          {row.id}
        </button>
      ),
    },
    {
      key: 'clientName',
      title: 'CLIENT NAME',
      render: (row) => <span className="text-[13px] font-bold text-slate-700">{row.clientName}</span>,
    },
    {
      key: 'service',
      title: 'SERVICE',
      render: (row) => <span className="text-[13px] text-slate-600">{row.service}</span>,
    },
    {
      key: 'status',
      title: 'STATUS',
      className: 'whitespace-nowrap',
      render: (row) => (
        <span className={`inline-flex rounded-[2px] border px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wide ${getStatusBadgeClass(row.status)}`}>
          {row.status}
        </span>
      ),
    },
    {
      key: 'received',
      title: 'DATE RECEIVED',
      render: (row) => <span className="text-[13px] text-slate-500">{row.received}</span>,
    },
    {
      key: 'action',
      title: 'ACTION',
      className: 'text-center',
      render: (row) => (
        <button
          type="button"
          onClick={() => navigate(`/agency/referred-cases/${row.id}`)}
          className="h-[32px] px-3 bg-[#f1f5f9] text-slate-700 hover:bg-slate-200 text-[12px] font-bold rounded-[3px] transition-colors border border-slate-300"
        >
          View
        </button>
      ),
    },
  ]

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-4">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-2">
        <div>
          <h1 className={`${pageHeadingStyles.pageTitle} font-headline`}>Dashboard</h1>
          <p className={pageHeadingStyles.pageSubtitle}>
            Monitor referral volume, status distribution, and recent agency activity.
          </p>
          <p className={`${pageHeadingStyles.pageSubtitle} font-body mt-0 flex items-center gap-2`}>
           <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-calendar"><path d="M8 2v4"/><path d="M16 2v4"/><rect width="18" height="18" x="3" y="4" rx="2"/><path d="M3 10h18"/></svg>
            Overseas Workers Welfare Administration Region VII • April 09, 2026
          </p>
        </div>
        <div className="self-start md:self-auto">
          <NotificationBell notifications={dashboardNotifications} triggerLabelOverride="NEW REFERRAL" />
        </div>
      </header>

      {/* TOP SUMMARY CARDS */}
      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="ASSIGNED REFERRALS"
          value={String(assignedCount)}
          icon={<ClipboardList className="w-6 h-6 text-blue-400 opacity-60" />}
          activeTopBorder="border-t-[3px] border-blue-500"
        />
        <StatCard
          title="PENDING REFERRALS"
          value={String(pendingCount)}
          icon={<ClipboardType className="w-6 h-6 text-red-400 opacity-60" />}
          activeTopBorder="border-t-[3px] border-red-200"
        />
        <StatCard
          title="PROCESSING REFERRALS"
          value={String(processingCount)}
          icon={<RefreshCcw className="w-6 h-6 text-emerald-400 opacity-60" />}
          activeTopBorder="border-t-[3px] border-emerald-200"
        />
        <StatCard
          title="COMPLETED REFERRALS"
          value={String(completedCount)}
          icon={<CheckCircle2 className="w-6 h-6 text-slate-400 opacity-60" />}
        />
      </section>

      <div className="grid grid-cols-12 gap-8">
        {/* Left Column */}
        <div className="col-span-12 lg:col-span-8 space-y-4">
          {/* RECENT REFERRALS TABLE */}
          <RecentTable
            title="Recent Referrals"
            data={recentReferrals}
            columns={recentReferralsColumns}
            keyExtractor={(row) => row.rowId}
          />
        </div>

        {/* Right Column */}
        <div className="col-span-12 lg:col-span-4">
          <section className="bg-white border border-[#d8dee8] rounded-[2px] p-4 mb-4">
            <h3 className={`${pageHeadingStyles.sectionTitle} mb-3`}>Quick Actions</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-2">
              <button
                type="button"
                onClick={() => navigate('/agency/referred-cases')}
                className="h-[34px] px-3 border border-[#cbd5e1] bg-white text-slate-700 text-[11px] font-bold rounded-[2px] hover:bg-slate-50 transition text-left"
              >
                View Referred Cases
              </button>
              <button
                type="button"
                onClick={() => navigate('/agency/activity')}
                className="h-[34px] px-3 border border-[#cbd5e1] bg-white text-slate-700 text-[11px] font-bold rounded-[2px] hover:bg-slate-50 transition text-left"
              >
                Open Activity Logs
              </button>
              <button
                type="button"
                onClick={() => navigate('/agency/reports')}
                className="h-[34px] px-3 border border-[#cbd5e1] bg-white text-slate-700 text-[11px] font-bold rounded-[2px] hover:bg-slate-50 transition text-left"
              >
                Open Reports
              </button>
              <button
                type="button"
                onClick={() => navigate('/agency/services')}
                className="h-[34px] px-3 border border-[#cbd5e1] bg-white text-slate-700 text-[11px] font-bold rounded-[2px] hover:bg-slate-50 transition text-left"
              >
                Manage Services
              </button>
            </div>
          </section>

          {/* RECENT ACTIVITY */}
          <section className="bg-white border border-[#d8dee8] rounded-[2px] p-4 h-full">
            <h3 className={`${pageHeadingStyles.sectionTitle} mb-3`}>Recent Activity</h3>
            <div className="flex-1">
              <div className="relative pl-4 h-full">
                <div className="absolute left-[4px] top-1 bottom-1 w-px bg-[#cbd5e1]" />
                <div className="space-y-4">
                <ActivityItem 
                  title="New Referral Assigned" 
                  desc="Case MB-2024-4413 assigned to Overseas Workers Welfare Administration Region VII."
                  time="12 MINUTES AGO"
                  logoSrc="/logo.png"
                />
                <ActivityItem 
                  title="Referral Accepted" 
                  desc="Josephus Kim L. Sarsonas accepted Case MB-2024-7751."
                  time="1 HOUR AGO"
                  logoSrc={owwaLogo}
                />
                <ActivityItem 
                  title="Milestone Added" 
                  desc="Milestone 'Release of Aid' logged for Case MB-2024-5521."
                  time="2 HOURS AGO"
                  logoSrc={owwaLogo}
                />
                <ActivityItem 
                  title="Referral Completed" 
                  desc="Case MB-2024-4411 marked as completed."
                  time="4 HOURS AGO"
                  logoSrc={owwaLogo}
                />
                </div>
              </div>
            </div>
            <div className="pt-4 mt-4 border-t border-[#e2e8f0]">
              <button className="w-full h-[30px] px-3 bg-[#0b5384] text-white text-[11px] font-bold rounded-[2px] hover:bg-[#09416a] transition">
                VIEW YOUR ACTIVITY
              </button>
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}

function StatCard({ title, value, icon, activeTopBorder = "border-t-[3px] border-transparent" }: { title: string; value: string; icon: ReactNode, activeTopBorder?: string }) {
  return (
    <div className={`bg-white p-6 rounded-xl shadow-sm border border-slate-100 flex items-center justify-between relative overflow-hidden ${activeTopBorder}`}>
      <div className="flex flex-col">
        <p className={`${pageHeadingStyles.metricLabel} mb-2`}>{title}</p>
        <h3 className="text-3xl font-black text-slate-800">{value}</h3>
      </div>
      <div className="flex-shrink-0">
        {icon}
      </div>
    </div>
  )
}

function ActivityItem({ title, desc, time, logoSrc }: { title: string; desc: string; time: string; logoSrc: string }) {
  return (
    <div className="relative flex items-start gap-3">
      <div className="mt-0.5 -ml-[18px] h-5 w-5 overflow-hidden rounded-full border border-white bg-white shadow-sm z-10">
        <img src={logoSrc} alt="Activity source" className="h-full w-full object-contain p-[1px]" />
      </div>
      <div>
        <p className="text-[11px] leading-5 font-semibold text-slate-700">{title}</p>
        <p className="text-[11px] leading-5 text-slate-600">{desc}</p>
        <p className="mt-0.5 text-[10px] text-slate-400">{time}</p>
      </div>
    </div>
  )
}