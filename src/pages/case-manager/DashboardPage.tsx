import { 
  ArrowRightLeft, Users, FolderCheck, Plus, Send, Eye, ChevronRight, 
  TrendingUp, Clock, PieChart, Map, Activity
} from "lucide-react"
import type { ReactNode } from "react"
import { useMemo } from "react"
import { useNavigate } from "react-router-dom"
import {
  CASE_MANAGER_CASES,
  formatDisplayDate,
  getCaseManagerAgencies,
  getDashboardNotificationDeliveryLogsByRole,
  getExistingClientProfile,
  getStatusBreakdown
} from "../../data/unifiedData"
import { getManagedCases, getManagedReferrals } from "../../data/caseLifecycleStore"
import { getActiveUserProfile } from "../../utils/authSession"
import NotificationBell from "../../components/ui/NotificationBell"
import { Chart as ChartJS, ArcElement, Tooltip, Legend as ChartLegend } from "chart.js"
import { Pie } from "react-chartjs-2"

ChartJS.register(ArcElement, Tooltip, ChartLegend)

type CaseRowData = {
  rowId: string
  caseNo: string
  clientName: string
  clientType: string
  createdOn: string
  caseAge: string
  referredTo: string
}

function formatCaseAge(timestamp: string): string {
  const parsed = new Date(timestamp.replace(" ", "T"))
  if (Number.isNaN(parsed.getTime())) return "N/A"
  const ageInMs = Math.max(0, Date.now() - parsed.getTime())
  const oneDayInMs = 24 * 60 * 60 * 1000
  const ageInDays = Math.floor(ageInMs / oneDayInMs)
  if (ageInDays > 0) return `${ageInDays} day${ageInDays === 1 ? "" : "s"}`
  const ageInHours = Math.floor(ageInMs / (60 * 60 * 1000))
  if (ageInHours > 0) return `${ageInHours} hr${ageInHours === 1 ? "" : "s"}`
  return "Just now"
}

export default function DashboardPage() {
  const navigate = useNavigate()
  const user = getActiveUserProfile()
  const managedCases = useMemo(() => getManagedCases(), [])
  const referrals = useMemo(() => getManagedReferrals(), [])

  const statusBreakdown = useMemo(() => getStatusBreakdown(CASE_MANAGER_CASES), [])
  const openCount = managedCases.filter((item) => item.status === "PENDING" || item.status === "PROCESSING").length
  const totalReferrals = referrals.length
  const averageReferralCompletionRate = useMemo(() => totalReferrals > 0 ? Math.round((statusBreakdown.COMPLETED / totalReferrals) * 100) : 0, [totalReferrals, statusBreakdown.COMPLETED])
  const uniqueClientCount = useMemo(() => new Set(referrals.map((item) => item.clientName)).size, [referrals])

  // Chart Data: Status Pie Chart (Chart.js)
  const pieChartData = useMemo(() => {
    return {
      labels: ["Open", "Closed"],
      datasets: [
        {
          data: [statusBreakdown.PENDING + statusBreakdown.PROCESSING, statusBreakdown.COMPLETED],
          backgroundColor: ["#1e3a8a", "#10b981"],
          borderColor: ["#ffffff", "#ffffff"],
          borderWidth: 2,
          hoverOffset: 4,
        }
      ]
    }
  }, [statusBreakdown])

  const pieChartOptions = useMemo(() => ({
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          label: (context: any) => ` ${context.label}: ${context.raw} cases`
        }
      }
    }
  }), [])

  // Chart Data: Line Graph (Visual mockup with SVG)
  const lineGraphPoints = "0,80 20,60 40,70 60,40 80,45 100,20"

  // Regional Breakdown Data
  const regionalData = useMemo(() => {
    const regionNames = ["Cebu", "Bohol", "Negros Oriental", "Siquijor"]
    const counts: Record<string, number> = { "Cebu": 0, "Bohol": 0, "Negros Oriental": 0, "Siquijor": 0 }
    
    managedCases.forEach(c => {
      const prov = getExistingClientProfile(c.clientName).address.provinceName
      if (prov && regionNames.includes(prov)) {
        counts[prov]++
      }
    })
    
    return regionNames.map(name => ({
      name,
      count: counts[name],
      percent: Math.round((counts[name] / (managedCases.length || 1)) * 100)
    }))
  }, [managedCases])

  const sortedCases = useMemo(() => [...managedCases].sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()), [managedCases])
  const agenciesById = useMemo(() => getCaseManagerAgencies().reduce<Record<string, { logoUrl: string }>>((acc, agency) => { acc[agency.id] = { logoUrl: agency.logoUrl }; return acc }, {}), [])

  const recentCases: CaseRowData[] = sortedCases.slice(0, 5).map((item) => ({
    rowId: item.id,
    caseNo: item.caseNo,
    clientName: item.clientName,
    clientType: item.clientType,
    createdOn: formatDisplayDate(item.createdAt),
    caseAge: formatCaseAge(item.createdAt),
    referredTo: item.agencyName,
  }))

  const recentActivity = useMemo(() => [...referrals].sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()).slice(0, 4).map((item) => ({
    id: item.id,
    title: item.status === "PENDING" ? "Referral Queued" : item.status === "PROCESSING" ? "Referral Processing" : "Referral Updated",
    desc: `${item.caseNo} for ${item.clientName} was updated.`,
    time: formatDisplayDate(item.updatedAt),
    logoSrc: agenciesById[item.agencyId]?.logoUrl ?? "/logo.png",
  })), [referrals, agenciesById])

  return (
    <div className="min-h-screen bg-surface font-body text-on-surface">
      <div className="bg-primary pt-10 pb-20 px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 text-white/60 text-xs font-bold uppercase tracking-widest mb-2">
              <span className="h-1 w-6 bg-[#94f0df]"></span>
              Executive Dashboard
            </div>
            <h1 className="text-3xl font-black text-white uppercase tracking-tight font-headline">
              Welcome Back, <span className="text-[#94f0df]">{user?.name || "Case Manager"}</span>
            </h1>
          </div>
          <div className="flex items-center gap-4">
            <NotificationBell notifications={getDashboardNotificationDeliveryLogsByRole("Case Manager")} />
            <button onClick={() => navigate("/case-manager/cases/new")} className="bg-[#94f0df] text-primary px-6 py-3 font-bold uppercase text-xs tracking-widest flex items-center gap-2 hover:bg-white transition-colors rounded-none shadow-lg">
              <Plus size={18} /> Open New Case
            </button>
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-6 -mt-10 mb-20 space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <MetricCard label="Active Cases" value={openCount.toString()} icon={<FolderCheck size={24} />} trend="+2 new" trendType="up" />
          <MetricCard label="Total Referrals" value={totalReferrals.toString()} icon={<ArrowRightLeft size={24} />} />
          <MetricCard label="Resolution Rate" value={`${averageReferralCompletionRate}%`} icon={<TrendingUp size={24} />} trend="Target 85%" />
          <MetricCard label="Unique Clients" value={uniqueClientCount.toString()} icon={<Users size={24} />} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            
            {/* Charts Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Pie Chart Section */}
              <div className="bg-surface border border-outline-variant/30 p-6 flex flex-col items-center">
                <div className="w-full flex items-center gap-2 mb-6 border-l-4 border-primary pl-3">
                  <PieChart className="text-primary" size={18} />
                  <h3 className="font-headline font-bold uppercase text-xs tracking-widest text-primary">Status Distribution</h3>
                </div>
                
                <div className="relative h-40 w-full mb-6 flex justify-center">
                  <div className="h-40 w-40">
                    <Pie data={pieChartData} options={pieChartOptions} />
                  </div>
                </div>

                <div className="w-full grid grid-cols-2 gap-2">
                  <LegendItem label="Open" color="bg-primary" />
                  <LegendItem label="Closed" color="bg-emerald-500" />
                </div>
              </div>

              {/* Line Graph Section */}
              <div className="bg-surface border border-outline-variant/30 p-6">
                <div className="w-full flex items-center gap-2 mb-6 border-l-4 border-[#94f0df] pl-3">
                  <Activity className="text-primary" size={18} />
                  <h3 className="font-headline font-bold uppercase text-xs tracking-widest text-primary">Case Growth (6mo)</h3>
                </div>
                
                <div className="h-40 w-full relative pt-4">
                  <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="w-full h-full">
                    <polyline
                      fill="none"
                      stroke="#1e3a8a"
                      strokeWidth="3"
                      strokeLinecap="square"
                      points={lineGraphPoints}
                    />
                    <path
                      fill="url(#gradient)"
                      d={`M${lineGraphPoints} L100,100 L0,100 Z`}
                      className="opacity-10"
                    />
                    <defs>
                      <linearGradient id="gradient" x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" stopColor="#1e3a8a" />
                        <stop offset="100%" stopColor="white" />
                      </linearGradient>
                    </defs>
                  </svg>
                  <div className="absolute inset-x-0 bottom-0 flex justify-between px-1 text-[8px] font-bold text-on-surface-variant/40 uppercase tracking-tighter">
                    <span>JAN</span><span>FEB</span><span>MAR</span><span>APR</span><span>MAY</span><span>JUN</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Regional Breakdown Table UI */}
            <div className="bg-surface border border-outline-variant/30 p-6">
              <div className="flex items-center gap-2 mb-6 border-l-4 border-primary pl-3">
                <Map className="text-primary" size={18} />
                <h3 className="font-headline font-bold uppercase text-xs tracking-widest text-primary">Region VII Provincial Breakdown</h3>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {regionalData.map(region => (
                  <div key={region.name} className="bg-surface-container border border-outline-variant/20 p-4">
                    <span className="text-[10px] font-black text-on-surface-variant/60 block uppercase mb-1">{region.name}</span>
                    <div className="flex items-baseline gap-2">
                       <span className="text-2xl font-black text-primary font-headline">{region.count}</span>
                       <span className="text-[10px] font-bold text-emerald-600">{region.percent}%</span>
                    </div>
                    <div className="mt-2 h-1 bg-surface-container-highest w-full">
                      <div className="h-full bg-primary" style={{ width: `${region.percent}%` }}></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Recent Cases Table */}
            <div className="bg-surface border border-outline-variant/30 shadow-sm overflow-hidden">
              <div className="p-6 border-b border-outline-variant flex items-center justify-between bg-surface-container-low">
                <h2 className="font-headline font-bold text-lg uppercase tracking-tight flex items-center gap-3">
                  <Clock className="text-primary" size={20} /> Recent Operations
                </h2>
                <button onClick={() => navigate("/case-manager/cases")} className="text-primary text-xs font-bold uppercase tracking-widest hover:underline flex items-center gap-1">
                  View Full Registry <ChevronRight size={14} />
                </button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-surface-container-highest/20 text-on-surface-variant uppercase text-[10px] font-black tracking-widest border-b border-outline-variant/30">
                    <tr>
                      <th className="px-6 py-4">Reference</th>
                      <th className="px-6 py-4">Client Detail</th>
                      <th className="px-6 py-4 text-right">Age</th>
                      <th className="px-6 py-4 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-outline-variant/30">
                    {recentCases.map((row) => (
                      <tr key={row.rowId} className="hover:bg-primary/[0.02] transition-colors border-l-2 border-transparent hover:border-primary">
                        <td className="px-6 py-4 font-bold text-primary">{row.caseNo}</td>
                        <td className="px-6 py-4 font-medium uppercase text-xs">{row.clientName}</td>
                        <td className="px-6 py-4 text-right text-xs font-medium">{row.caseAge}</td>
                        <td className="px-6 py-4 text-right">
                          <button onClick={() => navigate(`/case-manager/cases/${row.rowId}`)} className="text-on-surface-variant/40 hover:text-primary transition-colors">
                            <Eye size={18} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <div className="space-y-8">
            {/* Feed Component */}
            <div className="bg-surface border border-outline-variant/30 shadow-sm overflow-hidden">
              <div className="p-6 border-b border-outline-variant bg-surface-container-low">
                <h2 className="font-headline font-bold text-lg uppercase tracking-tight flex items-center gap-3">
                  <Send className="text-primary" size={20} /> Inter-Agency Feed
                </h2>
              </div>
              <div className="p-6 space-y-6">
                {recentActivity.map((activity) => (
                  <div key={activity.id} className="flex gap-4 group">
                    <div className="shrink-0 h-10 w-10 border border-outline-variant/50 p-1 flex items-center justify-center bg-white shadow-sm">
                      <img src={activity.logoSrc} alt="" className="h-full w-full object-contain" />
                    </div>
                    <div className="min-w-0">
                      <h4 className="text-xs font-bold text-primary uppercase tracking-tighter">{activity.title}</h4>
                      <p className="text-[11px] text-on-surface-variant leading-relaxed mt-0.5 truncate">{activity.desc}</p>
                      <span className="text-[10px] font-black text-on-surface-variant/30 uppercase mt-1 block">{activity.time}</span>
                    </div>
                  </div>
                ))}
              </div>
              <div className="p-4 bg-surface-container-lowest border-t border-outline-variant/30">
                <button onClick={() => navigate("/case-manager/referrals")} className="w-full py-2 text-[10px] font-black uppercase tracking-widest text-primary hover:bg-primary/5 transition-colors">
                  Expand Real-time Feed
                </button>
              </div>
            </div>

            {/* Network Card */}
          </div>
        </div>
      </main>
    </div>
  )
}

function MetricCard({ label, value, icon, trend, trendType = "neutral" }: { 
  label: string; value: string; icon: ReactNode; trend?: string; trendType?: "up" | "down" | "neutral"
}) {
  return (
    <div className="bg-surface border border-outline-variant/30 p-6 relative overflow-hidden group hover:border-primary/30 transition-colors shadow-sm">
      <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity text-primary">
        {icon}
      </div>
      <div className="relative z-10">
        <span className="text-[10px] font-black text-on-surface-variant uppercase tracking-[0.2em] mb-3 block border-l-2 border-[#94f0df] pl-2">{label}</span>
        <div className="flex items-baseline gap-2 mt-4">
          <span className="text-3xl font-black text-primary font-headline tracking-tighter">{value}</span>
          {trend && (
            <span className={`text-[10px] font-bold uppercase tracking-tight ${trendType === "up" ? "text-emerald-600" : trendType === "down" ? "text-rose-600" : "text-on-surface-variant/40"}`}>
              {trend}
            </span>
          )}
        </div>
      </div>
    </div>
  )
}

function LegendItem({ label, color }: { label: string; color: string }) {
  return (
    <div className="flex flex-col items-center gap-1">
      <div className={`${color} h-1 w-full`}></div>
      <span className="text-[8px] font-black uppercase text-on-surface-variant/60">{label}</span>
    </div>
  )
}
