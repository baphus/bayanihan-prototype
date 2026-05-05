import { ClipboardList, ClipboardType, RefreshCcw, CheckCircle2 } from 'lucide-react'
import type { ReactNode } from 'react'
import { useMemo, useState } from 'react'
import { UnifiedTable, type Column } from '../../components/ui/UnifiedTable'
import NotificationBell from '../../components/ui/NotificationBell'
import AgencyFeedbacksPanel from '../../components/AgencyFeedbacksPanel'
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

  const [search, setSearch] = useState("")
  const [currentPage, setCurrentPage] = useState(1)

  const filteredReferrals = useMemo(() => {
    if (!search) return recentReferrals
    const lower = search.toLowerCase()
    return recentReferrals.filter(r => r.id.toLowerCase().includes(lower) || r.clientName.toLowerCase().includes(lower))
  }, [recentReferrals, search])

  const recentReferralsColumns: Column<ReferralRowData>[] = [
    {
      key: 'id',
      title: 'TRACKING ID',
      sortable: true,
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
      sortable: true,
      render: (row) => <span className="text-[13px] font-bold text-slate-700">{row.clientName}</span>,
    },
    {
      key: 'service',
      title: 'SERVICE',
      sortable: true,
      render: (row) => <span className="text-[13px] text-slate-600">{row.service}</span>,
    },
    {
      key: 'status',
      title: 'STATUS',
      sortable: true,
      className: 'whitespace-nowrap',
      render: (row) => (
        <span className={`inline-flex items-center gap-1.5 rounded-[2px] px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wide border ${getStatusBadgeClass(row.status)}`}>
          {row.status}
        </span>
      ),
    },
    {
      key: 'received',
      title: 'DATE RECEIVED',
      sortable: true,
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
          className="h-[32px] px-3 bg-white text-[#0b5384] hover:bg-slate-50 text-[12px] font-bold rounded-[3px] transition-colors border border-[#cbd5e1]"
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
          <UnifiedTable
            title="Recent Referrals"
            description="A list of incoming cases referred to your agency."
            data={filteredReferrals}
            columns={recentReferralsColumns}
            keyExtractor={(row) => row.rowId}
            searchValue={search}
            onSearchChange={setSearch}
            currentPage={currentPage}
            onPageChange={setCurrentPage}
            rowsPerPage={5}
            hidePagination={filteredReferrals.length <= 5}
          />
        </div>

        {/* Right Column */}
        <div className="col-span-12 lg:col-span-4">
          <div className="mb-4">
            <AgencyFeedbacksPanel isConcise />
          </div>
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
          <section className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm flex flex-col h-full">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-[14px] font-bold text-slate-900 uppercase tracking-wider">Recent Activity</h3>
              <div className="h-2 w-2 rounded-full bg-blue-500 animate-pulse" title="Live Updates" />
            </div>
            
            <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
              <div className="space-y-1">
                <ActivityItem 
                  title="New Referral Assigned" 
                  desc="Case MB-2024-4413 assigned to Overseas Workers Welfare Administration Region VII."
                  time="12m ago"
                  logoSrc="/logo.png"
                />
                <ActivityItem 
                  title="Referral Accepted" 
                  desc="Josephus Kim L. Sarsonas accepted Case MB-2024-7751."
                  time="1h ago"
                  logoSrc={owwaLogo}
                />
                <ActivityItem 
                  title="Milestone Added" 
                  desc="Milestone 'Release of Aid' logged for Case MB-2024-5521."
                  time="2h ago"
                  logoSrc={owwaLogo}
                />
                <ActivityItem 
                  title="Referral Completed" 
                  desc="Case MB-2024-4411 marked as completed."
                  time="4h ago"
                  logoSrc={owwaLogo}
                  isLast
                />
              </div>
            </div>

            <div className="mt-4 pt-4 border-t border-slate-100 px-1">
              <button 
                onClick={() => navigate('/agency/activities')}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-50 text-slate-600 text-[12px] font-bold rounded-lg hover:bg-slate-100 hover:text-blue-900 transition-all active:scale-[0.98]"
              >
                <span>VIEW FULL AUDIT LOG</span>
                <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
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

function ActivityItem({ title, desc, time, logoSrc, isLast }: { title: string; desc: string; time: string; logoSrc: string, isLast?: boolean }) {
  return (
    <div className="relative flex items-start gap-4 group cursor-pointer transition-all duration-200">
      {/* Timeline Line */}
      {!isLast && (
        <div className="absolute left-[13px] top-[30px] bottom-[-20px] w-0.5 bg-slate-100 group-hover:bg-blue-100 transition-colors" />
      )}
      
      {/* Activity Logo/Icon */}
      <div className="relative z-10 shrink-0 mt-0.5">
        <div className="h-7 w-7 rounded-lg bg-white border border-slate-200 shadow-sm flex items-center justify-center overflow-hidden group-hover:border-blue-200 group-hover:shadow-md transition-all group-hover:scale-105">
          <img src={logoSrc} alt="" className="h-5 w-5 object-contain" />
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0 pb-6">
        <div className="flex items-center justify-between gap-2">
          <p className="text-[13px] font-bold text-slate-800 group-hover:text-blue-900 transition-colors truncate">{title}</p>
          <span className="text-[10px] font-bold text-slate-400 group-hover:text-slate-500 whitespace-nowrap uppercase tracking-wider">{time}</span>
        </div>
        <p className="mt-1 text-[12px] leading-relaxed text-slate-500 group-hover:text-slate-600 transition-colors line-clamp-2">
          {desc}
        </p>
      </div>
    </div>
  )
}