import { useMemo, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { UnifiedTable, type Column, type FilterChip } from '../../components/ui/UnifiedTable'
import AppToast from '../../components/ui/AppToast'
import { pageHeadingStyles } from '../agency/pageHeadingStyles'
import { getStatusBadgeClass } from '../agency/statusBadgeStyles'
import { formatDisplayDateTime, type CaseManagerReferral } from '../../data/unifiedData'
import { getManagedLatestMilestone, getManagedReferrals } from '../../data/caseLifecycleStore'

type StatusFilter = 'ALL' | 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'REJECTED'
type ReferralsPageState = {
  toastMessage?: string
}

export default function ReferralsPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const routeState = (location.state ?? {}) as ReferralsPageState
  const rows = useMemo<CaseManagerReferral[]>(() => getManagedReferrals(), [])

  const [searchValue, setSearchValue] = useState('')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('ALL')
  const [isFilterOpen, setIsFilterOpen] = useState(false)
  const [toastMessage, setToastMessage] = useState(routeState.toastMessage ?? '')

  const filteredRows = useMemo(() => {
    const query = searchValue.trim().toLowerCase()

    return rows.filter((item) => {
      const matchesSearch =
        query.length === 0 ||
        [item.caseNo, item.clientName, item.service, item.agencyName, item.remarks].join(' ').toLowerCase().includes(query)
      const matchesStatus = statusFilter === 'ALL' || item.status === statusFilter
      return matchesSearch && matchesStatus
    })
  }, [rows, searchValue, statusFilter])

  const activeFilters: FilterChip[] = useMemo(() => {
    return statusFilter === 'ALL' ? [] : [{ key: 'status', label: 'Status', value: statusFilter }]
  }, [statusFilter])

  const kpis = useMemo(() => {
    return {
      total: rows.length,
      pending: rows.filter((item) => item.status === 'PENDING').length,
      processing: rows.filter((item) => item.status === 'PROCESSING').length,
      completed: rows.filter((item) => item.status === 'COMPLETED').length,
    }
  }, [rows])

  const latestUpdateByReferralId = useMemo(() => {
    return rows.reduce<Record<string, string>>((acc, row) => {
      const milestone = getManagedLatestMilestone(row.id, '')
      acc[row.id] =
        milestone ||
        (row.status === 'PENDING'
          ? 'Awaiting agency acceptance'
          : row.status === 'PROCESSING'
            ? 'Referral is being processed'
            : row.status === 'COMPLETED'
              ? 'Referral completed by agency'
              : 'Referral returned by agency')
      return acc
    }, {})
  }, [rows])

  const columns: Column<CaseManagerReferral>[] = [
    {
      key: 'caseNo',
      title: 'TRACKING ID',
      render: (row) => <span className="text-[13px] font-extrabold text-[#0b5384]">{row.caseNo}</span>,
    },
    {
      key: 'clientName',
      title: 'CLIENT NAME',
      render: (row) => <span className="text-[13px] font-semibold text-slate-700">{row.clientName}</span>,
    },
    {
      key: 'agencyName',
      title: 'AGENCY',
      render: (row) => <span className="text-[13px] text-slate-700">{row.agencyName}</span>,
    },
    {
      key: 'service',
      title: 'SERVICE',
      render: (row) => <span className="text-[13px] text-slate-600">{row.service}</span>,
    },
    {
      key: 'latestUpdate',
      title: 'LATEST UPDATE',
      render: (row) => <span className="text-[12px] text-slate-700">{latestUpdateByReferralId[row.id]}</span>,
    },
    {
      key: 'status',
      title: 'STATUS',
      className: 'whitespace-nowrap',
      render: (row) => (
        <span className={`inline-flex rounded-[2px] border px-2 py-0.5 text-[10px] font-extrabold tracking-wide ${getStatusBadgeClass(row.status)}`}>
          {row.status}
        </span>
      ),
    },
    {
      key: 'updatedAt',
      title: 'LAST UPDATED',
      render: (row) => <span className="text-[12px] text-slate-500">{formatDisplayDateTime(row.updatedAt)}</span>,
    },
    {
      key: 'actions',
      title: 'ACTIONS',
      className: 'whitespace-nowrap text-right',
      render: (row) => (
        <div className="flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={() => navigate(`/case-manager/referrals/${row.id}`, { state: { referral: row } })}
            className="h-8 rounded-[3px] border border-slate-300 bg-slate-100 px-3 text-[11px] font-bold text-slate-700 hover:bg-slate-200"
          >
            View
          </button>
        </div>
      ),
    },
  ]

  return (
    <div className="mx-auto max-w-7xl space-y-5 pb-4">
      {toastMessage.trim() ? (
        <AppToast message={toastMessage} onClose={() => setToastMessage('')} tone="success" />
      ) : null}

      <header>
        <h1 className={pageHeadingStyles.pageTitle}>Referrals</h1>
        <p className={pageHeadingStyles.pageSubtitle}>Refer cases to partner agencies and monitor status updates from intake to closure.</p>
      </header>

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard title="TOTAL REFERRALS" value={kpis.total} accent="border-[#0b5384]" />
        <KpiCard title="PENDING" value={kpis.pending} accent="border-[#f59e0b]" />
        <KpiCard title="PROCESSING" value={kpis.processing} accent="border-[#0284c7]" />
        <KpiCard title="COMPLETED" value={kpis.completed} accent="border-[#16a34a]" />
      </section>

      <UnifiedTable
        data={filteredRows}
        columns={columns}
        keyExtractor={(row) => row.id}
        totalRecords={filteredRows.length}
        startIndex={filteredRows.length ? 1 : 0}
        endIndex={filteredRows.length}
        currentPage={1}
        totalPages={1}
        searchPlaceholder="Search tracking ID, client, service, or agency..."
        searchValue={searchValue}
        onSearchChange={setSearchValue}
        onAdvancedFilters={() => setIsFilterOpen((prev) => !prev)}
        isAdvancedFiltersOpen={isFilterOpen}
        activeFilters={activeFilters}
        onRemoveFilter={() => setStatusFilter('ALL')}
        onClearFilters={() => setStatusFilter('ALL')}
        onNewRecord={() => navigate('/case-manager/referrals/new')}
        newRecordLabel="+ New Referral"
        advancedFiltersContent={(
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-[14px] font-bold text-slate-800">Apply Filters</h3>
              <button type="button" onClick={() => setIsFilterOpen(false)} className="text-slate-400 hover:text-slate-600">
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>
            <div>
              <label className="mb-1.5 block text-[12px] font-bold uppercase tracking-wider text-[#64748b]">Status</label>
              <select
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value as StatusFilter)}
                className="w-full rounded-[3px] border border-[#cbd5e1] bg-slate-50 px-3 py-2 text-[13px] font-bold text-slate-700 outline-none"
              >
                <option value="ALL">All</option>
                <option value="PENDING">Pending</option>
                <option value="PROCESSING">Processing</option>
                <option value="COMPLETED">Completed</option>
                <option value="REJECTED">Rejected</option>
              </select>
            </div>
          </div>
        )}
      />
    </div>
  )
}

function KpiCard({ title, value, accent }: { title: string; value: number; accent: string }) {
  return (
    <div className={`rounded-[4px] border border-[#cbd5e1] border-l-[4px] ${accent} bg-white px-4 py-4 shadow-sm`}>
      <p className={pageHeadingStyles.metricLabel}>{title}</p>
      <p className="mt-2 text-[30px] leading-none font-black text-[#0f172a]">{value}</p>
    </div>
  )
}
