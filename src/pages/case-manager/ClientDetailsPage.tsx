import { Link, useNavigate, useParams } from 'react-router-dom'
import { UnifiedTable, type Column } from '../../components/ui/UnifiedTable'
import { pageHeadingStyles } from '../agency/pageHeadingStyles'
import { CASE_MANAGER_CASES, formatDisplayDateTime, toCaseHealthStatus } from '../../data/unifiedData'
import { getReferralActorsForCase } from '../../data/unifiedData'
import {
  getCaseClosureRemarkBySeed,
  getCaseNarrativeBySeed,
  getClientDirectoryProfile,
} from '../../data/unifiedData'

type CaseRow = {
  id: string
  caseNo: string
  service: string
  agencyName: string
  milestone: string
  caseStatus: 'OPEN' | 'CLOSED'
  lastUpdated: string
}

type ActivityRow = {
  id: string
  timestamp: string
  type: 'CASE OPENED' | 'CASE CLOSED'
  details: string
  actorName: string
  caseAgeDays: number
  caseNo: string
}

function withOffsetMinutes(iso: string, minutes: number): string {
  return new Date(new Date(iso).getTime() + minutes * 60000).toISOString()
}

function getDaysBetween(start: string, end: string): number {
  const startMs = new Date(start).getTime()
  const endMs = new Date(end).getTime()
  return Math.max(1, Math.round((endMs - startMs) / (1000 * 60 * 60 * 24)))
}

function statusTone(status: CaseRow['caseStatus']): string {
  return status === 'OPEN'
    ? 'border-[#bae6fd] bg-[#e0f2fe] text-[#0369a1]'
    : 'border-[#cbd5e1] bg-slate-100 text-slate-700'
}

export default function ClientDetailsPage() {
  const navigate = useNavigate()
  const { clientId } = useParams<{ clientId: string }>()

  const decodedClientName = decodeURIComponent(clientId ?? '')
  const clientCases = CASE_MANAGER_CASES
    .filter((item) => item.clientName === decodedClientName)
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())

  if (!clientCases.length) {
    return (
      <div className="w-full pb-8 space-y-4">
        <h1 className={pageHeadingStyles.pageTitle}>Client Not Found</h1>
        <p className="text-[14px] text-slate-600">No client record matched this directory entry.</p>
        <button
          type="button"
          onClick={() => navigate('/case-manager/clients')}
          className="px-3 min-h-[32px] bg-[#0b5384] text-white hover:bg-[#09416a] text-[12px] font-bold rounded-[3px] transition-colors border border-[#0b5384]"
        >
          Back to Clients
        </button>
      </div>
    )
  }

  const profile = getClientDirectoryProfile(decodedClientName)

  const caseRows: CaseRow[] = clientCases.map((item) => ({
    id: item.id,
    caseNo: item.caseNo,
    service: item.service,
    agencyName: item.agencyName,
    milestone: item.milestone,
    caseStatus: toCaseHealthStatus(item.status),
    lastUpdated: item.updatedAt,
  }))

  const activityRows: ActivityRow[] = clientCases
    .flatMap((item) => {
      const actors = getReferralActorsForCase(item.id)
      const closedTimestamp = withOffsetMinutes(item.updatedAt, 5)

      const events: ActivityRow[] = [
        {
          id: `${item.id}-opened`,
          timestamp: item.createdAt,
          type: 'CASE OPENED',
          details: getCaseNarrativeBySeed(item.id),
          actorName: actors.caseManager.name,
          caseAgeDays: getDaysBetween(item.createdAt, item.createdAt),
          caseNo: item.caseNo,
        },
      ]

      if (toCaseHealthStatus(item.status) === 'CLOSED') {
        events.push({
          id: `${item.id}-closed`,
          timestamp: closedTimestamp,
          type: 'CASE CLOSED',
          details: `CASE CLOSED. Remark: "${getCaseClosureRemarkBySeed(item.id)}"`,
          actorName: actors.caseManager.name,
          caseAgeDays: getDaysBetween(item.createdAt, closedTimestamp),
          caseNo: item.caseNo,
        })
      }

      return events
    })
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())

  const caseColumns: Column<CaseRow>[] = [
    {
      key: 'caseNo',
      title: 'TRACKING ID',
      render: (row) => <span className="text-[12px] font-bold text-[#0b5384]">{row.caseNo}</span>,
    },
    {
      key: 'service',
      title: 'SERVICE',
      render: (row) => <span className="text-[12px] text-slate-700">{row.service}</span>,
    },
    {
      key: 'agencyName',
      title: 'AGENCY',
      render: (row) => <span className="text-[12px] text-slate-700">{row.agencyName}</span>,
    },
    {
      key: 'milestone',
      title: 'MILESTONE',
      render: (row) => <span className="text-[12px] text-slate-600">{row.milestone}</span>,
    },
    {
      key: 'caseStatus',
      title: 'STATUS',
      className: 'whitespace-nowrap',
      render: (row) => (
        <span className={`inline-flex rounded-[3px] border px-2 py-0.5 text-[10px] font-extrabold uppercase ${statusTone(row.caseStatus)}`}>
          {row.caseStatus}
        </span>
      ),
    },
    {
      key: 'lastUpdated',
      title: 'LAST UPDATED',
      className: 'whitespace-nowrap',
      render: (row) => <span className="text-[12px] text-slate-500">{formatDisplayDateTime(row.lastUpdated)}</span>,
    },
    {
      key: 'action',
      title: 'ACTION',
      className: 'whitespace-nowrap text-right',
      render: (row) => (
        <Link
          to={`/case-manager/cases/${row.id}`}
          className="px-3 min-h-[30px] inline-flex items-center bg-[#f1f5f9] text-slate-700 hover:bg-slate-200 text-[11px] font-bold rounded-[3px] transition-colors border border-slate-300"
        >
          View Case
        </Link>
      ),
    },
  ]

  return (
    <div className="w-full pb-8 space-y-5">
      <div className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-500">
        <Link to="/case-manager/clients" className="transition hover:text-[#0b5384]">Clients</Link>
        <span className="mx-2">&gt;</span>
        <span>{profile.ofwName}</span>
      </div>

      <header>
        <h1 className={pageHeadingStyles.pageTitle}>Client Details</h1>
        <p className={pageHeadingStyles.pageSubtitle}>Client profile, associated cases, and activity history.</p>
      </header>

      <section className="rounded-[3px] border border-[#d8dee8] bg-white p-5 shadow-sm">
        <h2 className={`${pageHeadingStyles.sectionTitle} mb-4 text-[#1f2937]`}>Client Information</h2>

        <div className="space-y-5">
          <div className="space-y-2.5">
            <h3 className="text-[10px] font-extrabold uppercase tracking-[0.14em] text-[#334155]">OFW Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <InfoField label="Full Name" value={profile.ofwName} />
              <InfoField label="Email Address" value={profile.ofwEmail} />
              <InfoField label="Contact Number" value={profile.ofwContact} />
              <InfoField label="Home Address" value={profile.ofwAddress} className="md:col-span-3" />
            </div>
          </div>

          <div className="space-y-2.5">
            <h3 className="text-[10px] font-extrabold uppercase tracking-[0.14em] text-[#334155]">Next of Kin Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <InfoField label="Full Name" value={profile.nextOfKinName} />
              <InfoField label="Contact Number" value={profile.nextOfKinContact} />
              <InfoField label="Email Address" value={profile.nextOfKinEmail} />
              <InfoField label="Home Address" value={profile.nextOfKinAddress} className="md:col-span-3" />
            </div>
          </div>
        </div>
      </section>

      <section className="rounded-[3px] border border-[#d8dee8] bg-white p-5 shadow-sm">
        <h2 className={`${pageHeadingStyles.sectionTitle} mb-4 text-[#1f2937]`}>Associated Cases</h2>
        <UnifiedTable
          variant="embedded"
          data={caseRows}
          columns={caseColumns}
          keyExtractor={(row) => row.id}
          hideControlBar
          hidePagination
        />
      </section>

      <section className="rounded-[3px] border border-[#d8dee8] bg-white p-5 shadow-sm">
        <h2 className={`${pageHeadingStyles.sectionTitle} mb-4 text-[#1f2937]`}>Client Activity</h2>
        <div className="space-y-3">
          {activityRows.map((activity) => (
            <div key={activity.id} className="rounded-[3px] border border-[#e2e8f0] bg-[#f8fafc] p-3">
              <p className="text-[11px] font-extrabold uppercase tracking-[0.1em] text-[#0b5384]">{activity.type}</p>
              <p className="mt-1 text-[12px] text-slate-700">{activity.details}</p>
              <p className="mt-1 text-[10px] text-slate-500">
                Case {activity.caseNo} • {formatDisplayDateTime(activity.timestamp)} • {activity.actorName} • {activity.caseAgeDays} day{activity.caseAgeDays > 1 ? 's' : ''}
              </p>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}

function InfoField({ label, value, className }: { label: string; value: string; className?: string }) {
  return (
    <div className={className}>
      <p className="mb-1.5 block text-[11px] font-bold uppercase tracking-[0.08em] text-slate-600">{label}</p>
      <div className="h-10 w-full rounded-[3px] border border-[#cbd5e1] bg-slate-50 px-3 text-[13px] text-slate-700 flex items-center">
        {value}
      </div>
    </div>
  )
}
