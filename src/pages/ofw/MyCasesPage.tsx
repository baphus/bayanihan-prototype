import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { UnifiedTable, type Column, type FilterChip } from '../../components/ui/UnifiedTable'
import { getActiveUserEmail } from '../../utils/authSession'
import { buildOfwCaseRows, getOfwCaseMetrics, type OfwCaseRow } from './ofwCaseInsights'

type StatusFilter = 'ALL' | 'OPEN' | 'CLOSED'
type SortBy = 'LATEST_UPDATE' | 'OLDEST_UPDATE' | 'TRACKING_ASC' | 'TRACKING_DESC'

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

export default function MyCasesPage() {
  const navigate = useNavigate()
  const activeOfwEmail = getActiveUserEmail()
  const [searchValue, setSearchValue] = useState('')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('ALL')
  const [selectedService, setSelectedService] = useState('ALL')
  const [sortBy, setSortBy] = useState<SortBy>('LATEST_UPDATE')
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list')
  const [isFilterOpen, setIsFilterOpen] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [rowsPerPage, setRowsPerPage] = useState(10)

  const rows = useMemo<OfwCaseRow[]>(() => {
    return buildOfwCaseRows(activeOfwEmail)
  }, [activeOfwEmail])

  const metrics = useMemo(() => getOfwCaseMetrics(rows), [rows])

  const serviceOptions = useMemo(() => {
    const uniqueServices = Array.from(new Set(rows.map((item) => item.service))).sort((a, b) => a.localeCompare(b))
    return ['ALL', ...uniqueServices]
  }, [rows])

  const filteredRows = useMemo(() => {
    const query = searchValue.trim().toLowerCase()

    const base = rows.filter((item) => {
      const matchesQuery =
        query.length === 0 ||
        [item.caseNo, item.service, item.healthStatus, item.progressSummary]
          .join(' ')
          .toLowerCase()
          .includes(query)

      const matchesStatus = statusFilter === 'ALL' || item.healthStatus === statusFilter
      const matchesService = selectedService === 'ALL' || item.service === selectedService

      return matchesQuery && matchesStatus && matchesService
    })

    return base.toSorted((a, b) => {
      if (sortBy === 'OLDEST_UPDATE') {
        return new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime()
      }

      if (sortBy === 'TRACKING_ASC') {
        return a.caseNo.localeCompare(b.caseNo)
      }

      if (sortBy === 'TRACKING_DESC') {
        return b.caseNo.localeCompare(a.caseNo)
      }

      return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    })
  }, [rows, searchValue, statusFilter, selectedService, sortBy])

  const activeFilters = useMemo<FilterChip[]>(() => {
    const filters: FilterChip[] = []

    if (statusFilter !== 'ALL') {
      filters.push({ key: 'status', label: 'Status', value: statusFilter })
    }

    if (selectedService !== 'ALL') {
      filters.push({ key: 'service', label: 'Service', value: selectedService })
    }

    if (sortBy !== 'LATEST_UPDATE') {
      const sortLabels: Record<SortBy, string> = {
        LATEST_UPDATE: 'Latest update',
        OLDEST_UPDATE: 'Oldest update',
        TRACKING_ASC: 'Tracking A-Z',
        TRACKING_DESC: 'Tracking Z-A',
      }
      filters.push({ key: 'sort', label: 'Sort', value: sortLabels[sortBy] })
    }

    return filters
  }, [selectedService, sortBy, statusFilter])

  const clearAllFilters = () => {
    setStatusFilter('ALL')
    setSelectedService('ALL')
    setSortBy('LATEST_UPDATE')
    setCurrentPage(1)
  }

  const removeFilter = (filter: FilterChip) => {
    if (filter.key === 'status') {
      setStatusFilter('ALL')
      return
    }

    if (filter.key === 'service') {
      setSelectedService('ALL')
      return
    }

    if (filter.key === 'sort') {
      setSortBy('LATEST_UPDATE')
    }
  }

  const totalRecords = filteredRows.length
  const totalPages = Math.max(1, Math.ceil(totalRecords / rowsPerPage))
  const currentSafePage = Math.min(currentPage, totalPages)
  const startIndex = totalRecords === 0 ? 0 : (currentSafePage - 1) * rowsPerPage + 1
  const endIndex = totalRecords === 0 ? 0 : Math.min(currentSafePage * rowsPerPage, totalRecords)

  const paginatedRows = useMemo(() => {
    const start = (currentSafePage - 1) * rowsPerPage
    return filteredRows.slice(start, start + rowsPerPage)
  }, [currentSafePage, filteredRows, rowsPerPage])

  const columns: Column<OfwCaseRow>[] = [
    {
      key: 'caseNo',
      title: 'Tracking ID',
      render: (row) => (
        <div>
          <span className="font-bold text-[#0b5384]">{row.caseNo}</span>
          <p className="text-[11px] text-slate-500">Created {formatDate(row.createdAt)}</p>
        </div>
      ),
    },
    {
      key: 'service',
      title: 'Service',
      render: (row) => <span className="text-sm font-semibold text-slate-700">{row.service}</span>,
    },
    {
      key: 'progressSummary',
      title: 'Progress',
      render: (row) => (
        <div className="min-w-[220px]">
          <div className="mb-1 flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-600">{row.progressSummary}</span>
            <span className="text-[11px] font-bold text-slate-900">{row.progressPercent}%</span>
          </div>
          <div className="h-2 w-full rounded-full bg-slate-200">
            <div className="h-2 rounded-full bg-[#0b5c92]" style={{ width: `${row.progressPercent}%` }} />
          </div>
        </div>
      ),
    },
    {
      key: 'referrals',
      title: 'Agencies',
      render: (row) => (
        <span className="text-xs font-semibold text-slate-600">
          {row.totalReferrals === 0 ? 'No referrals yet' : `${row.totalReferrals} linked`}
        </span>
      ),
    },
    {
      key: 'updatedAt',
      title: 'Last Updated',
      render: (row) => <span className="text-sm text-slate-700">{formatDate(row.updatedAt)}</span>,
    },
    {
      key: 'status',
      title: 'Status',
      render: (row) => (
        <span
          className={`rounded-[3px] px-2 py-1 text-[10px] font-extrabold uppercase tracking-widest ${
            row.healthStatus === 'OPEN' ? 'bg-blue-100 text-blue-800' : 'bg-slate-200 text-slate-700'
          }`}
        >
          {row.healthStatus}
        </span>
      ),
    },
    {
      key: 'actions',
      title: 'Actions',
      className: 'text-right',
      render: (row) => (
        <button
          type="button"
          onClick={() => navigate(`/track/${encodeURIComponent(row.caseNo)}/verify`)}
          className="rounded-[3px] bg-[#0b5c92] px-3 py-2 text-xs font-bold uppercase tracking-wider text-white transition hover:bg-[#084b77]"
        >
          View Progress
        </button>
      ),
    },
  ]

  return (
    <div className="mx-auto w-full max-w-[1200px]">
      <div className="mb-6">
        <div className="mb-5 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-[11px] font-bold uppercase tracking-[0.15em] text-[#0b5c92]">OFW Workspace</p>
          <h1 className="mt-1 text-3xl font-black uppercase tracking-tight text-slate-900">My Cases</h1>
          <p className="mt-2 max-w-2xl text-sm text-slate-600">
            Review all your cases in one place, prioritize updates with quick filters, and jump into progress details faster.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-6">
          <article className="rounded-lg border border-slate-200 bg-white p-3 shadow-sm xl:col-span-1">
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Total</p>
            <p className="mt-1 text-2xl font-black text-slate-900">{metrics.totalCases}</p>
          </article>
          <article className="rounded-lg border border-amber-200 bg-amber-50 p-3 shadow-sm xl:col-span-1">
            <p className="text-[10px] font-bold uppercase tracking-wider text-amber-700">Open</p>
            <p className="mt-1 text-2xl font-black text-amber-900">{metrics.openCases}</p>
          </article>
          <article className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 shadow-sm xl:col-span-1">
            <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-700">Closed</p>
            <p className="mt-1 text-2xl font-black text-emerald-900">{metrics.closedCases}</p>
          </article>
          <article className="rounded-lg border border-blue-200 bg-blue-50 p-3 shadow-sm xl:col-span-1">
            <p className="text-[10px] font-bold uppercase tracking-wider text-blue-700">Avg Progress</p>
            <p className="mt-1 text-2xl font-black text-blue-900">{metrics.averageProgress}%</p>
          </article>
          <article className="rounded-lg border border-slate-200 bg-white p-3 shadow-sm xl:col-span-1">
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">In Processing</p>
            <p className="mt-1 text-2xl font-black text-slate-900">{metrics.activelyProcessingCases}</p>
          </article>
          <article className="rounded-lg border border-slate-200 bg-white p-3 shadow-sm xl:col-span-1">
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Awaiting Action</p>
            <p className="mt-1 text-2xl font-black text-slate-900">{metrics.awaitingCases}</p>
          </article>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => {
              setStatusFilter('ALL')
              setCurrentPage(1)
            }}
            className={`rounded-[4px] border px-3 py-2 text-xs font-bold uppercase tracking-wider ${
              statusFilter === 'ALL'
                ? 'border-[#0b5c92] bg-[#0b5c92] text-white'
                : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50'
            }`}
          >
            All
          </button>
          <button
            type="button"
            onClick={() => {
              setStatusFilter('OPEN')
              setCurrentPage(1)
            }}
            className={`rounded-[4px] border px-3 py-2 text-xs font-bold uppercase tracking-wider ${
              statusFilter === 'OPEN'
                ? 'border-[#0b5c92] bg-[#0b5c92] text-white'
                : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50'
            }`}
          >
            Open Cases
          </button>
          <button
            type="button"
            onClick={() => {
              setStatusFilter('CLOSED')
              setCurrentPage(1)
            }}
            className={`rounded-[4px] border px-3 py-2 text-xs font-bold uppercase tracking-wider ${
              statusFilter === 'CLOSED'
                ? 'border-[#0b5c92] bg-[#0b5c92] text-white'
                : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50'
            }`}
          >
            Closed Cases
          </button>
        </div>
      </div>

      <UnifiedTable
        title=""
        description=""
        data={paginatedRows}
        columns={columns}
        keyExtractor={(row) => row.id}
        searchPlaceholder="Search by tracking ID, service, or status"
        searchValue={searchValue}
        onSearchChange={(value) => {
          setSearchValue(value)
          setCurrentPage(1)
        }}
        onAdvancedFilters={() => setIsFilterOpen((current) => !current)}
        isAdvancedFiltersOpen={isFilterOpen}
        advancedFiltersContent={(
          <div className="space-y-4">
            <div>
              <label className="mb-2 block text-[10px] font-bold uppercase tracking-[0.08em] text-slate-500">Service</label>
              <select
                value={selectedService}
                onChange={(event) => {
                  setSelectedService(event.target.value)
                  setCurrentPage(1)
                }}
                className="w-full rounded-[3px] border border-slate-300 px-3 py-2 text-sm text-slate-700 outline-none focus:border-[#0b5c92]"
              >
                {serviceOptions.map((option) => (
                  <option key={option} value={option}>
                    {option === 'ALL' ? 'All services' : option}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-2 block text-[10px] font-bold uppercase tracking-[0.08em] text-slate-500">Sort by</label>
              <select
                value={sortBy}
                onChange={(event) => {
                  setSortBy(event.target.value as SortBy)
                  setCurrentPage(1)
                }}
                className="w-full rounded-[3px] border border-slate-300 px-3 py-2 text-sm text-slate-700 outline-none focus:border-[#0b5c92]"
              >
                <option value="LATEST_UPDATE">Latest update</option>
                <option value="OLDEST_UPDATE">Oldest update</option>
                <option value="TRACKING_ASC">Tracking ID A-Z</option>
                <option value="TRACKING_DESC">Tracking ID Z-A</option>
              </select>
            </div>
          </div>
        )}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        activeFilters={activeFilters}
        onRemoveFilter={removeFilter}
        onClearFilters={clearAllFilters}
        currentPage={currentSafePage}
        totalPages={totalPages}
        totalRecords={totalRecords}
        startIndex={startIndex}
        endIndex={endIndex}
        rowsPerPage={rowsPerPage}
        onPageChange={setCurrentPage}
        onRowsPerPageChange={(nextRows) => {
          setRowsPerPage(nextRows)
          setCurrentPage(1)
        }}
      />
    </div>
  )
}
