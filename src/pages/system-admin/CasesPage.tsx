import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { UnifiedTable, type Column, type FilterChip } from '../../components/ui/UnifiedTable'
import { pageHeadingStyles } from '../agency/pageHeadingStyles'
import { getCaseManagerAgencies, getClientPersona, getSpecialCategories, toCaseHealthStatus, type CaseManagerCase } from '../../data/unifiedData'
import { getManagedCases, getManagedReferralsByCaseId } from '../../data/caseLifecycleStore'

type StatusFilter = 'ALL' | 'OPEN' | 'CLOSED'
type ClientTypeFilter = 'ALL' | 'Overseas Filipino Worker' | 'Next of Kin'
type VulnerabilityFilter = 'ALL' | 'Senior Citizen' | 'PWD' | 'Solo Parent' | 'None'

type CaseViewRow = CaseManagerCase & {
  caseStatus: 'OPEN' | 'CLOSED'
  specialCategory: string
  displayClientName: string
  referredTo: string
  referredToLogoUrl: string
}

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

export default function CasesPage() {
  const navigate = useNavigate()
  const [searchValue, setSearchValue] = useState('')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('ALL')
  const [clientTypeFilter, setClientTypeFilter] = useState<ClientTypeFilter>('ALL')
  const [vulnerabilityFilter, setVulnerabilityFilter] = useState<VulnerabilityFilter>('ALL')
  const [isFilterOpen, setIsFilterOpen] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [rowsPerPage, setRowsPerPage] = useState(10)
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list')
  const [isColumnsOpen, setIsColumnsOpen] = useState(false)
  const [deletedCaseIds, setDeletedCaseIds] = useState<string[]>([])
  const [visibleColumns, setVisibleColumns] = useState<Record<string, boolean>>({
    caseNo: true,
    clientType: true,
    clientName: true,
    specialCategory: true,
    createdAt: true,
    caseStatus: true,
    referredTo: true,
    actions: true,
  })

  const agenciesById = useMemo(
    () =>
      getCaseManagerAgencies().reduce<Record<string, { name: string; logoUrl: string }>>((acc, agency) => {
        acc[agency.id] = { name: agency.name, logoUrl: agency.logoUrl }
        return acc
      }, {}),
    [],
  )

  const rowsBase = useMemo<CaseViewRow[]>(() => {
    return getManagedCases().map((item) => ({
      ...item,
      caseStatus: toCaseHealthStatus(item.status),
      displayClientName:
        item.clientType === 'Next of Kin'
          ? item.nextOfKinProfile?.fullName || getClientPersona(item.caseNo).kinName
          : item.ofwProfile?.fullName || getClientPersona(item.caseNo).ofwName,
      referredTo: (() => {
        const agencies = Array.from(new Set(getManagedReferralsByCaseId(item.id).map((referral) => referral.agencyName)))
        if (agencies.length === 0) {
          return item.agencyName
        }

        return agencies.join(', ')
      })(),
      referredToLogoUrl: (() => {
        const referralAgencyIds = Array.from(new Set(getManagedReferralsByCaseId(item.id).map((referral) => referral.agencyId)))
        const firstAgencyId = referralAgencyIds[0] ?? item.agencyId
        return agenciesById[firstAgencyId]?.logoUrl ?? '/logo.png'
      })(),
      specialCategory: (() => {
        const categories =
          item.clientType === 'Next of Kin'
            ? item.nextOfKinProfile?.specialCategories ?? getSpecialCategories(item.caseNo)
            : item.ofwProfile?.specialCategories ?? getSpecialCategories(item.caseNo)
        return categories.length > 0 ? categories.join(', ') : 'None'
      })(),
    }))
  }, [agenciesById])

  const rows = useMemo(() => rowsBase.filter((item) => !deletedCaseIds.includes(item.id)), [rowsBase, deletedCaseIds])

  const filteredCases = useMemo(() => {
    const query = searchValue.trim().toLowerCase()

    return rows.filter((item) => {
      const matchesSearch =
        query.length === 0 ||
        [item.id, item.caseNo, item.displayClientName, item.clientType, item.specialCategory, item.referredTo]
          .join(' ')
          .toLowerCase()
          .includes(query)

      const matchesStatus = statusFilter === 'ALL' || item.caseStatus === statusFilter
      const matchesClientType = clientTypeFilter === 'ALL' || item.clientType === clientTypeFilter
      const matchesVulnerability =
        vulnerabilityFilter === 'ALL' ||
        (vulnerabilityFilter === 'None'
          ? item.specialCategory === 'None'
          : item.specialCategory.includes(vulnerabilityFilter))

      return matchesSearch && matchesStatus && matchesClientType && matchesVulnerability
    })
  }, [rows, searchValue, statusFilter, clientTypeFilter, vulnerabilityFilter])

  const totalRecords = filteredCases.length
  const totalPages = Math.max(1, Math.ceil(totalRecords / rowsPerPage))

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages)
    }
  }, [currentPage, totalPages])

  const startIndex = totalRecords === 0 ? 0 : (currentPage - 1) * rowsPerPage + 1
  const endIndex = totalRecords === 0 ? 0 : Math.min(currentPage * rowsPerPage, totalRecords)

  const paginatedCases = useMemo(() => {
    const start = (currentPage - 1) * rowsPerPage
    return filteredCases.slice(start, start + rowsPerPage)
  }, [filteredCases, currentPage, rowsPerPage])

  const kpis = useMemo(() => {
    const closedCount = rows.filter((item) => item.caseStatus === 'CLOSED').length
    return {
      total: rows.length,
      open: rows.filter((item) => item.caseStatus === 'OPEN').length,
      closed: closedCount,
      closedRate: rows.length > 0 ? Math.round((closedCount / rows.length) * 100) : 0,
    }
  }, [rows])

  const activeFilters: FilterChip[] = useMemo(() => {
    const filters: FilterChip[] = []

    if (statusFilter !== 'ALL') {
      filters.push({ key: 'status', label: 'Status', value: statusFilter })
    }

    if (clientTypeFilter !== 'ALL') {
      filters.push({ key: 'clientType', label: 'Client Type', value: clientTypeFilter })
    }

    if (vulnerabilityFilter !== 'ALL') {
      filters.push({ key: 'specialCategory', label: 'Vulnerability', value: vulnerabilityFilter })
    }

    return filters
  }, [statusFilter, clientTypeFilter, vulnerabilityFilter])

  const clearAllFilters = () => {
    setStatusFilter('ALL')
    setClientTypeFilter('ALL')
    setVulnerabilityFilter('ALL')
    setCurrentPage(1)
  }

  const removeFilter = (filter: FilterChip) => {
    if (filter.key === 'status') {
      setStatusFilter('ALL')
      return
    }

    if (filter.key === 'clientType') {
      setClientTypeFilter('ALL')
      return
    }

    if (filter.key === 'specialCategory') {
      setVulnerabilityFilter('ALL')
    }
  }

  const handleDelete = (row: CaseViewRow) => {
    const shouldDelete = window.confirm(`Delete case ${row.caseNo}?`)
    if (!shouldDelete) {
      return
    }

    setDeletedCaseIds((prev) => [...prev, row.id])
  }

  const columns: Column<CaseViewRow>[] = [
    {
      key: 'caseNo',
      title: 'TRACKING ID',
      className: 'whitespace-nowrap',
      render: (row) => <span className="font-bold text-[#0b5384] text-[15px] whitespace-nowrap">{row.caseNo}</span>,
    },
    {
      key: 'clientType',
      title: 'CLIENT TYPE',
      render: (row) => <span className="text-[13px] text-slate-600 font-medium">{row.clientType}</span>,
    },
    {
      key: 'clientName',
      title: 'CLIENT NAME',
      render: (row) => <span className="font-bold text-[15px] text-slate-800">{row.displayClientName}</span>,
    },
    {
      key: 'specialCategory',
      title: 'VULNERABILITY',
      render: (row) => <span className="text-[13px] text-slate-600 font-medium">{row.specialCategory}</span>,
    },
    {
      key: 'createdAt',
      title: 'DATE CREATED',
      render: (row) => <span className="text-[13px] text-slate-600 font-medium">{formatTimestamp(row.createdAt)}</span>,
    },
    {
      key: 'caseStatus',
      title: 'STATUS',
      className: 'whitespace-nowrap',
      render: (row) => (
        <span
          className={`px-2 py-0.5 text-[11px] font-extrabold uppercase rounded-[3px] border ${
            row.caseStatus === 'OPEN'
              ? 'border-[#bae6fd] bg-[#e0f2fe] text-[#0369a1]'
              : 'border-[#cbd5e1] bg-slate-100 text-slate-700'
          }`}
        >
          {row.caseStatus}
        </span>
      ),
    },
    {
      key: 'referredTo',
      title: 'REFERRED TO',
      className: 'whitespace-nowrap text-center',
      render: (row) => (
        <div className="flex justify-center" title={row.referredTo}>
          <div className="h-7 w-7 overflow-hidden rounded-full border border-white bg-white shadow-sm">
            <img src={row.referredToLogoUrl} alt="Referred agency" className="h-full w-full object-contain p-[1px]" />
          </div>
        </div>
      ),
    },
    {
      key: 'actions',
      title: 'ACTIONS',
      className: 'whitespace-nowrap text-right',
      render: (row) => (
        <div className="flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={() => navigate(`/system-admin/cases/${row.id}`)}
            className="px-3 min-h-[32px] bg-[#f1f5f9] text-slate-700 hover:bg-slate-200 text-[12px] font-bold rounded-[3px] transition-colors border border-slate-300"
          >
            View
          </button>
          <button
            type="button"
            className="px-3 min-h-[32px] bg-[#f1f5f9] text-slate-700 hover:bg-slate-200 text-[12px] font-bold rounded-[3px] transition-colors border border-slate-300"
          >
            Edit
          </button>
          <button
            type="button"
            onClick={() => handleDelete(row)}
            className="px-3 min-h-[32px] bg-[#fee2e2] text-[#b91c1c] hover:bg-[#fecaca] text-[12px] font-bold rounded-[3px] transition-colors border border-[#fecaca]"
          >
            Delete
          </button>
        </div>
      ),
    },
  ]

  const activeColumns = useMemo(
    () => columns.filter((column) => visibleColumns[column.key]),
    [columns, visibleColumns],
  )

  return (
    <div className="w-full pb-8 relative mt-0 z-0 space-y-5">
      <header>
        <h1 className={pageHeadingStyles.pageTitle}>Cases</h1>
        <p className={pageHeadingStyles.pageSubtitle}>Manage all tracked cases and monitor referral progress by agency.</p>
      </header>

      <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <KpiCard title="TOTAL CASES" value={kpis.total} icon="analytics" accent="border-[#0b5384]" />
        <KpiCard title="OPEN CASES" value={kpis.open} icon="folder_open" accent="border-[#0284c7]" />
        <KpiCard title="CLOSED CASES" value={kpis.closed} icon="task_alt" accent="border-[#16a34a]" />
        <KpiCard title="CLOSED RATE" value={kpis.closedRate} suffix="%" icon="query_stats" accent="border-[#f59e0b]" />
      </section>

      <UnifiedTable
        data={paginatedCases}
        columns={activeColumns}
        keyExtractor={(row) => row.id}
        totalRecords={totalRecords}
        startIndex={startIndex}
        endIndex={endIndex}
        currentPage={currentPage}
        totalPages={totalPages}
        rowsPerPage={rowsPerPage}
        rowsPerPageOptions={[5, 10, 25, 50]}
        onPageChange={(page) => setCurrentPage(Math.min(Math.max(page, 1), totalPages))}
        onRowsPerPageChange={(rowsCount) => {
          setRowsPerPage(rowsCount)
          setCurrentPage(1)
        }}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        searchPlaceholder="Search tracking ID, client type, or client name..."
        searchValue={searchValue}
        onSearchChange={(value) => {
          setSearchValue(value)
          setCurrentPage(1)
        }}
        onAdvancedFilters={() => setIsFilterOpen((prev) => !prev)}
        onColumnsControl={() => setIsColumnsOpen((prev) => !prev)}
        onNewRecord={() => navigate('/system-admin/cases/new')}
        newRecordLabel="+ New Case"
        isAdvancedFiltersOpen={isFilterOpen}
        activeFilters={activeFilters}
        onRemoveFilter={removeFilter}
        onClearFilters={clearAllFilters}
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
                onChange={(event) => {
                  setStatusFilter(event.target.value as StatusFilter)
                  setCurrentPage(1)
                }}
                className="w-full rounded-[3px] border border-[#cbd5e1] bg-slate-50 px-3 py-2 text-[13px] font-bold text-slate-700 outline-none"
              >
                <option value="ALL">All</option>
                <option value="OPEN">Open</option>
                <option value="CLOSED">Closed</option>
              </select>
            </div>

            <div>
              <label className="mb-1.5 block text-[12px] font-bold uppercase tracking-wider text-[#64748b]">Client Type</label>
              <select
                value={clientTypeFilter}
                onChange={(event) => {
                  setClientTypeFilter(event.target.value as ClientTypeFilter)
                  setCurrentPage(1)
                }}
                className="w-full rounded-[3px] border border-[#cbd5e1] bg-slate-50 px-3 py-2 text-[13px] font-bold text-slate-700 outline-none"
              >
                <option value="ALL">All</option>
                <option value="Overseas Filipino Worker">Overseas Filipino Worker</option>
                <option value="Next of Kin">Next of Kin</option>
              </select>
            </div>

            <div>
              <label className="mb-1.5 block text-[12px] font-bold uppercase tracking-wider text-[#64748b]">Vulnerability</label>
              <select
                value={vulnerabilityFilter}
                onChange={(event) => {
                  setVulnerabilityFilter(event.target.value as VulnerabilityFilter)
                  setCurrentPage(1)
                }}
                className="w-full rounded-[3px] border border-[#cbd5e1] bg-slate-50 px-3 py-2 text-[13px] font-bold text-slate-700 outline-none"
              >
                <option value="ALL">All</option>
                <option value="Senior Citizen">Senior Citizen</option>
                <option value="PWD">PWD</option>
                <option value="Solo Parent">Solo Parent</option>
                <option value="None">None</option>
              </select>
            </div>

            <button
              type="button"
              className="mt-2 flex h-[38px] w-full items-center justify-center rounded-[3px] border border-[#cbd5e1] text-[13px] font-bold text-[#0b5384] transition hover:bg-slate-50"
              onClick={clearAllFilters}
            >
              Clear Attributes
            </button>
          </div>
        )}
      />

      {isColumnsOpen ? (
        <div className="absolute right-8 top-[220px] z-40 w-56 rounded-[3px] border border-[#cbd5e1] bg-white p-4 shadow-lg">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-[13px] font-bold text-slate-800">Visible Columns</h3>
            <button type="button" onClick={() => setIsColumnsOpen(false)} className="text-slate-400 hover:text-slate-600">
              <span className="material-symbols-outlined text-[18px]">close</span>
            </button>
          </div>
          <div className="space-y-2">
            {columns.map((column) => (
              <label key={column.key} className="flex items-center gap-2 text-[12px] text-slate-700">
                <input
                  type="checkbox"
                  checked={visibleColumns[column.key]}
                  onChange={() =>
                    setVisibleColumns((prev) => ({
                      ...prev,
                      [column.key]: !prev[column.key],
                    }))
                  }
                />
                <span>{column.title}</span>
              </label>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  )
}

function KpiCard({
  title,
  value,
  accent,
  suffix = '',
  icon,
}: {
  title: string
  value: number
  accent: string
  suffix?: string
  icon: string
}) {
  return (
    <div className={`bg-white border border-[#cbd5e1] border-l-[4px] ${accent} rounded-[4px] px-4 py-4 shadow-sm`}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className={pageHeadingStyles.metricLabel}>{title}</p>
          <p className="mt-2 text-[30px] leading-none font-black text-[#0f172a]">{value}{suffix}</p>
        </div>
        <span className="material-symbols-outlined text-[24px] text-slate-400">{icon}</span>
      </div>
    </div>
  )
}
