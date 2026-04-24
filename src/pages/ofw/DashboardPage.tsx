import { Activity, AlertCircle, CircleCheckBig, Clock3, FolderOpen, Sparkles, ChevronRight } from 'lucide-react'
import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { getActiveSession, getActiveUserEmail } from '../../utils/authSession'
import { buildOfwCaseRows, getOfwCaseMetrics } from './ofwCaseInsights'

function formatDate(value: string): string {
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) {
    return value
  }

  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  }).format(parsed)
}

function StatCard({
  label,
  value,
  icon,
  tone,
}: {
  label: string
  value: string
  icon: React.ReactNode
  tone: 'blue' | 'emerald' | 'amber' | 'slate'
}) {
  const toneClass =
    tone === 'blue'
      ? 'bg-blue-50 border-blue-200 text-blue-900'
      : tone === 'emerald'
      ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
      : tone === 'amber'
      ? 'bg-amber-50 border-amber-200 text-amber-900'
      : 'bg-slate-50 border-slate-200 text-slate-900'

  return (
    <article className={`rounded-lg border p-4 ${toneClass}`}>
      <div className="mb-3 inline-flex h-9 w-9 items-center justify-center rounded-md bg-white/80">{icon}</div>
      <p className="text-[11px] font-bold uppercase tracking-[0.08em] opacity-80">{label}</p>
      <p className="mt-1 text-2xl font-black tracking-tight">{value}</p>
    </article>
  )
}

export default function OfwDashboardPage() {
  const navigate = useNavigate()
  const activeUserEmail = getActiveUserEmail()
  const activeSession = getActiveSession()

  const rows = useMemo(() => buildOfwCaseRows(activeUserEmail), [activeUserEmail])
  const metrics = useMemo(() => getOfwCaseMetrics(rows), [rows])

  const actionNeededRows = useMemo(() => {
    // Mocking an "Action Needed" logic: e.g. open cases with low progress
    return rows.filter(r => r.healthStatus === 'OPEN' && r.progressPercent < 50).slice(0, 2)
  }, [rows])

  const recentRows = rows.filter(r => !actionNeededRows.find(ar => ar.id === r.id)).slice(0, 4)
  const completionRatio = metrics.totalCases === 0 ? 0 : Math.round((metrics.closedCases / metrics.totalCases) * 100)

  return (
    <div className="mx-auto w-full max-w-[1200px] space-y-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.15em] text-[#0b5c92]">Dashboard</p>
          <h1 className="mt-1 text-2xl font-black tracking-tight text-slate-900">
            Welcome back, {activeSession?.name?.split(' ')[0] || 'User'} 👋
          </h1>
          <p className="mt-1 text-sm text-slate-500">Here's what's happening with your cases today.</p>
        </div>
        <button
          type="button"
          onClick={() => navigate('/ofw/my-cases')}
          className="inline-flex items-center gap-2 rounded-md bg-[#0b5c92] px-4 py-2.5 text-xs font-bold uppercase tracking-widest text-white transition hover:bg-[#084b77] shadow-sm"
        >
          <Sparkles className="h-4 w-4" />
          View All Cases
        </button>
      </header>

      {actionNeededRows.length > 0 && (
        <section className="rounded-xl border border-amber-200 bg-amber-50 p-5 shadow-sm">
          <div className="mb-4 flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-amber-600" />
            <h2 className="text-sm font-bold text-amber-900">Action Recommended</h2>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {actionNeededRows.map(row => (
              <div key={`action-${row.id}`} className="flex flex-col justify-between rounded-lg border border-amber-200 bg-white p-4 shadow-sm transition hover:shadow-md">
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-900">{row.caseNo}</span>
                    <span className="rounded bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-800 uppercase">Needs Review</span>
                  </div>
                  <p className="mt-1 text-xs text-slate-600 line-clamp-1">{row.service}</p>
                </div>
                <button
                  onClick={() => navigate(`/track/${encodeURIComponent(row.caseNo)}/verify`)}
                  className="mt-4 inline-flex items-center text-xs font-bold text-[#0b5c92] hover:text-[#084b77]"
                >
                  Check Progress <ChevronRight className="ml-1 h-3 w-3" />
                </button>
              </div>
            ))}
          </div>
        </section>
      )}

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Total Cases" value={`${metrics.totalCases}`} icon={<FolderOpen className="h-4 w-4" />} tone="blue" />
        <StatCard label="Active Cases" value={`${metrics.openCases}`} icon={<Activity className="h-4 w-4" />} tone="amber" />
        <StatCard label="Completed Cases" value={`${metrics.closedCases}`} icon={<CircleCheckBig className="h-4 w-4" />} tone="emerald" />
        <StatCard label="Avg Completion" value={`${metrics.averageProgress}%`} icon={<Clock3 className="h-4 w-4" />} tone="slate" />
      </section>

      <section className="grid grid-cols-1 gap-5">
        <article className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center justify-between gap-3">
            <h2 className="text-lg font-bold text-slate-900">Recent Case Updates</h2>
            <button
              type="button"
              onClick={() => navigate('/ofw/my-cases')}
              className="text-xs font-bold uppercase tracking-wider text-[#0b5c92] hover:underline"
            >
              View all
            </button>
          </div>

          {recentRows.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-300 bg-slate-50 py-12 text-center">
              <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-slate-200">
                <FolderOpen className="h-6 w-6 text-slate-400" />
              </div>
              <p className="text-sm font-medium text-slate-600">No recent updates</p>
              <p className="mt-1 text-xs text-slate-500">Your case progress will appear here.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {recentRows.map((row) => (
                <div key={row.id} className="rounded-xl border border-slate-200 bg-slate-50/50 p-4 transition-colors hover:bg-slate-50">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <p className="text-sm font-black text-[#0b5c92]">{row.caseNo}</p>
                      <p className="text-xs text-slate-500">{row.service}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => navigate(`/track/${encodeURIComponent(row.caseNo)}/verify`)}
                      className="rounded-[3px] bg-[#0b5c92] px-3 py-2 text-[11px] font-bold uppercase tracking-wider text-white hover:bg-[#084b77]"
                    >
                      View Progress
                    </button>
                  </div>
                  <div className="mt-3">
                    <div className="mb-1 flex items-center justify-between text-[11px]">
                      <span className="font-semibold text-slate-600">Completion</span>
                      <span className="font-bold text-slate-800">{row.progressPercent}%</span>
                    </div>
                    <div className="h-2 w-full rounded-full bg-slate-200">
                      <div className="h-2 rounded-full bg-[#0b5c92]" style={{ width: `${row.progressPercent}%` }} />
                    </div>
                    <p className="mt-2 text-xs text-slate-500">Updated {formatDate(row.updatedAt)}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </article>
      </section>
    </div>
  )
}
