import { useState, useMemo } from 'react'
import type { JSX, ReactNode } from 'react'
import { UnifiedTable, type Column, type FilterChip } from '../../components/ui/UnifiedTable'
import { useNavigate } from 'react-router-dom'
import { pageHeadingStyles } from './pageHeadingStyles'
import { getStatusBadgeClass } from './statusBadgeStyles'
import { REFERRAL_CASES } from '../../data/unifiedData'

type ReferredCase = {
  id: string
  caseNo: string
  clientName: string
  service: string
  milestone: string
  createdOn: string
  updatedOn: string
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'REJECTED'
}

function formatIsoToTableTimestamp(iso: string): string {
  const date = new Date(iso)
  const year = date.getFullYear()
  const month = `${date.getMonth() + 1}`.padStart(2, '0')
  const day = `${date.getDate()}`.padStart(2, '0')
  const hour = `${date.getHours()}`.padStart(2, '0')
  const minute = `${date.getMinutes()}`.padStart(2, '0')
  const second = `${date.getSeconds()}`.padStart(2, '0')
  return `${year}-${month}-${day} ${hour}:${minute}:${second}`
}

const initialMockData: ReferredCase[] = REFERRAL_CASES.map((item) => ({
  id: item.id,
  caseNo: item.caseNo,
  clientName: item.clientName,
  service: item.service,
  milestone: item.milestone,
  createdOn: formatIsoToTableTimestamp(item.createdAt),
  updatedOn: formatIsoToTableTimestamp(item.updatedAt),
  status: item.status,
}))

function formatTimestamp(timestamp: string): string {
  const parsed = new Date(timestamp.replace(' ', 'T'))
  if (Number.isNaN(parsed.getTime())) {
    return timestamp
  }

  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true,
  }).format(parsed)
}

export default function ReferredCasesPage(): JSX.Element {
  const navigate = useNavigate()
  const [data, setData] = useState<ReferredCase[]>(initialMockData)
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list')
  const [searchValue, setSearchValue] = useState('')
  const [isFilterOpen, setIsFilterOpen] = useState(false)
  const [isColumnsOpen, setIsColumnsOpen] = useState(false)
  
  const [visibleColumns, setVisibleColumns] = useState<Record<string, boolean>>({
    caseNo: true,
    clientName: true,
    service: true,
    milestone: true,
    createdOn: true,
    updatedOn: true,
    status: true,
    actions: true
  })

  // Filters state
  const [activeFilters, setActiveFilters] = useState<FilterChip[]>([])
  const [pendingDecision, setPendingDecision] = useState<{ id: string; action: 'Accept' | 'Reject' } | null>(null)
  const [decisionRemark, setDecisionRemark] = useState('')

  const handleAction = (id: string, action: 'Accept' | 'Reject', remark: string) => {
    const now = new Date().toISOString().slice(0, 19).replace('T', ' ')

    setData(prev => prev.map(item => {
      if (item.id === id) {
        if (action === 'Accept') {
          return { ...item, status: 'PROCESSING', updatedOn: now }
        }
        if (action === 'Reject') {
          return { ...item, status: 'REJECTED', updatedOn: now, milestone: `Rejected: ${remark}` }
        }
      }
      return item
    }))
  }

  const requestDecision = (id: string, action: 'Accept' | 'Reject') => {
    setPendingDecision({ id, action })
    setDecisionRemark('')
  }

  const submitDecision = () => {
    if (!pendingDecision) {
      return
    }

    const trimmedRemark = decisionRemark.trim()
    if (!trimmedRemark) {
      return
    }

    handleAction(pendingDecision.id, pendingDecision.action, trimmedRemark)
    setPendingDecision(null)
    setDecisionRemark('')
  }

  const allColumns: Column<ReferredCase>[] = [
    {
      key: 'caseNo',
      title: 'TRACKING ID',
      render: (row) => (
        <span className="font-bold text-[#0b5384] text-[15px] leading-tight">      
          {row.caseNo}
        </span>
      )
    },
    {
      key: 'clientName',
      title: 'CLIENT NAME',
      render: (row) => (
        <span className="font-bold text-[15px] text-slate-800">{row.clientName}</span>
      )
    },
    {
      key: 'service',
      title: 'SERVICE',
      render: (row) => (
        <span className="text-[14px] text-slate-600 font-medium">{row.service}</span>
      )
    },
    {
      key: 'milestone',
      title: 'MILESTONE',
      render: (row) => (
        <span className="text-[13px] text-slate-700 font-semibold">{row.status === 'PENDING' ? '---' : row.milestone}</span>
      )
    },
    {
      key: 'createdOn',
      title: 'CREATED ON',
      render: (row) => (
        <span className="text-[13px] text-slate-600 font-medium">{formatTimestamp(row.createdOn)}</span>
      )
    },
    {
      key: 'updatedOn',
      title: 'UPDATED ON',
      render: (row) => (
        <span className="text-[13px] text-slate-600 font-medium">{formatTimestamp(row.updatedOn)}</span>
      )
    },
    {
      key: 'status',
      title: 'STATUS',
      render: (row) => (
        <span className={`px-2 py-0.5 text-[11px] font-extrabold uppercase rounded-[3px] border ${getStatusBadgeClass(row.status)}`}>
          {row.status}
        </span>
      )
    },
    {
      key: 'actions',
      title: 'ACTIONS',
      className: 'text-right min-w-[240px]',
      render: (row) => (
        <div className="flex items-center justify-end gap-2 flex-wrap">
          <button
            onClick={() => navigate(`/agency/referred-cases/${row.id}`)}
            className="px-3 min-h-[32px] bg-[#f1f5f9] text-slate-700 hover:bg-slate-200 text-[12px] font-bold rounded-[3px] transition-colors border border-slate-300"
          >
            View
          </button>
          {row.status === 'PENDING' && (
            <>
              <button 
                onClick={() => requestDecision(row.id, 'Accept')} 
                className="px-3 min-h-[32px] bg-[#0b5384] text-white hover:bg-[#09416a] text-[12px] font-bold rounded-[3px] shadow-sm transition-colors border border-[#0b5384]"
              >
                Accept
              </button>
              <button 
                onClick={() => requestDecision(row.id, 'Reject')} 
                className="px-3 min-h-[32px] bg-red-50 text-red-600 hover:bg-red-100 text-[12px] font-bold rounded-[3px] transition-colors border border-red-200"
              >
                Reject
              </button>
            </>
          )}
        </div>
      )
    }
  ]

  const activeColumns = useMemo(() => {
    return allColumns.filter(col => visibleColumns[col.key])
  }, [visibleColumns]) // Removed allColumns from dependency array to avoid warning as it isn't memoized

  const filteredData = useMemo(() => {
    return data.filter(row => {
      const searchTerms = [row.caseNo, row.clientName, row.service, row.milestone, row.createdOn, row.updatedOn].join(' ').toLowerCase()
      const matchesSearch = searchTerms.includes(searchValue.toLowerCase())
      
      const statusFilter = activeFilters.find(f => f.key === 'status')
      const matchesFilters = statusFilter ? row.status === statusFilter.value : true
      
      return matchesSearch && matchesFilters && row.status !== 'REJECTED'
    })
  }, [data, searchValue, activeFilters])

  const kpiData = useMemo(() => {
    const nonRejected = data.filter((row) => row.status !== 'REJECTED')
    return {
      total: nonRejected.length,
      pending: nonRejected.filter((row) => row.status === 'PENDING').length,
      processing: nonRejected.filter((row) => row.status === 'PROCESSING').length,
      completed: nonRejected.filter((row) => row.status === 'COMPLETED').length,
    }
  }, [data])

  return (
    <div className="w-full pb-8 relative mt-0 z-0 space-y-5">
      <div>
        <h1 className={pageHeadingStyles.pageTitle}>Referred Cases</h1>
        <p className={pageHeadingStyles.pageSubtitle}>Review referrals assigned to Overseas Workers Welfare Administration Region VII.</p>
      </div>

      <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <KpiCard title="TOTAL REFERRALS" value={kpiData.total} icon="analytics" accent="border-[#0b5384]" />
        <KpiCard title="PENDING" value={kpiData.pending} icon="schedule" accent="border-[#f59e0b]" />
        <KpiCard title="PROCESSING" value={kpiData.processing} icon="sync" accent="border-[#0284c7]" />
        <KpiCard title="COMPLETED" value={kpiData.completed} icon="check_circle" accent="border-[#16a34a]" />
      </section>

      <UnifiedTable
        data={filteredData}
        columns={activeColumns}
        keyExtractor={(row) => row.id}
        totalRecords={filteredData.length}
        startIndex={filteredData.length > 0 ? 1 : 0}
        endIndex={filteredData.length}
        currentPage={1}
        totalPages={1}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        activeFilters={activeFilters}
        onRemoveFilter={(f) => setActiveFilters(prev => prev.filter(chip => chip.key !== f.key))}
        onClearFilters={() => setActiveFilters([])}
        searchPlaceholder="Search case no, client, service, milestone..."
        searchValue={searchValue}
        onSearchChange={setSearchValue}
        onAdvancedFilters={() => setIsFilterOpen(!isFilterOpen)}
        isAdvancedFiltersOpen={isFilterOpen}
        advancedFiltersContent={(
          <>
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-slate-800 text-[14px] flex items-center gap-2">
                <span className="material-symbols-outlined text-[18px]">filter_alt</span> Apply Filters
              </h3>
              <button onClick={() => setIsFilterOpen(false)} className="text-slate-400 hover:text-slate-600 transition-colors">
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-[12px] font-bold text-[#64748b] tracking-wider uppercase mb-1.5">Status</label>
                <select
                  value={activeFilters.find((f) => f.key === 'status')?.value ?? ''}
                  className="w-full border border-[#cbd5e1] bg-slate-50 font-bold rounded-[3px] px-3 py-2 text-[13px] text-slate-700 outline-none focus:border-[#0b5384] focus:ring-1 focus:ring-[#0b5384] transition"
                  onChange={(e) => {
                    if (e.target.value) {
                      setActiveFilters((prev) => [
                        ...prev.filter((f) => f.key !== 'status'),
                        { key: 'status', label: 'Status', value: e.target.value },
                      ])
                    } else {
                      setActiveFilters((prev) => prev.filter((f) => f.key !== 'status'))
                    }
                  }}
                >
                  <option value="">All Statuses</option>
                  <option value="PENDING">Pending</option>
                  <option value="PROCESSING">Processing</option>
                  <option value="COMPLETED">Completed</option>
                </select>
              </div>

              <button
                className="w-full mt-2 h-[38px] flex items-center justify-center font-bold text-[#0b5384] hover:bg-slate-50 border border-[#cbd5e1] rounded-[3px] text-[13px] transition"
                onClick={() => {
                  setActiveFilters([])
                }}
              >
                Clear Attributes
              </button>
            </div>
          </>
        )}
        onColumnsControl={() => setIsColumnsOpen(!isColumnsOpen)}
      />

      {pendingDecision ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4">
          <div className="w-full max-w-lg rounded-[3px] border border-[#cbd5e1] bg-white shadow-xl">
            <div className="border-b border-[#e2e8f0] px-5 py-4">
              <h2 className="text-[16px] font-extrabold text-slate-900">
                {pendingDecision.action} Referral
              </h2>
              <p className="mt-1 text-[12px] text-slate-500">
                A remark is required before you can continue.
              </p>
            </div>

            <div className="px-5 py-4">
              <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-[0.08em] text-slate-600">
                Remark
              </label>
              <textarea
                value={decisionRemark}
                onChange={(event) => setDecisionRemark(event.target.value)}
                rows={4}
                placeholder="Enter your decision remark..."
                className="w-full rounded-[3px] border border-[#cbd5e1] px-3 py-2 text-[13px] text-slate-700 outline-none focus:border-[#0b5384] focus:ring-1 focus:ring-[#0b5384]"
              />
            </div>

            <div className="flex justify-end gap-2 border-t border-[#e2e8f0] px-5 py-3">
              <button
                onClick={() => {
                  setPendingDecision(null)
                  setDecisionRemark('')
                }}
                className="h-9 rounded-[3px] border border-[#cbd5e1] px-3 text-[12px] font-bold text-slate-700"
              >
                Cancel
              </button>
              <button
                onClick={submitDecision}
                disabled={!decisionRemark.trim()}
                className="h-9 rounded-[3px] bg-[#0b5384] px-3 text-[12px] font-bold text-white disabled:cursor-not-allowed disabled:opacity-50"
              >
                Confirm {pendingDecision.action}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {isColumnsOpen && (
        <div className="absolute top-[80px] lg:left-[560px] right-[16px] z-50 w-56 bg-white border border-[#cbd5e1] rounded-[3px] shadow-lg p-5">
          <div className="flex justify-between items-center mb-4">
             <h3 className="font-bold text-slate-800 text-[14px] flex items-center gap-2">
                 <span className="material-symbols-outlined text-[18px]">view_column</span> Visible Columns
             </h3>
             <button onClick={() => setIsColumnsOpen(false)} className="text-slate-400 hover:text-slate-600 transition-colors">
               <span className="material-symbols-outlined text-[18px]">close</span>
             </button>
          </div>
          
          <div className="space-y-3">
            {allColumns.map(col => (
              <label key={col.key} className="flex items-center gap-3 cursor-pointer group">
                <input 
                  type="checkbox" 
                  checked={visibleColumns[col.key]}
                  onChange={() => setVisibleColumns(prev => ({...prev, [col.key]: !prev[col.key]}))}
                  className="rounded-[2px] w-4 h-4 border-[#cbd5e1] text-[#0b5384] focus:ring-[#0b5384] cursor-pointer"
                />
                <span className="text-[13px] text-slate-700 font-bold group-hover:text-[#0b5384] transition">{col.title}</span>
              </label>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function KpiCard({ title, value, icon, accent }: { title: string; value: number; icon: string; accent: string }): ReactNode {
  return (
    <div className={`bg-white border border-[#cbd5e1] border-l-[4px] ${accent} rounded-[4px] px-4 py-4 shadow-sm`}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className={pageHeadingStyles.metricLabel}>{title}</p>
          <p className="mt-2 text-[30px] leading-none font-black text-[#0f172a]">{value}</p>
        </div>
        <span className="material-symbols-outlined text-[24px] text-slate-400">{icon}</span>
      </div>
    </div>
  )
}
