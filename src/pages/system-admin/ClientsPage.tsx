import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { UnifiedTable, type Column, type FilterChip } from '../../components/ui/UnifiedTable'
import { pageHeadingStyles } from '../agency/pageHeadingStyles'
import { CASE_MANAGER_CASES, formatDisplayDateTime, getClientPersona } from '../../data/unifiedData'
import { getNextOfKinForClient } from '../../data/unifiedData'

type OpenCasesFilter = 'ALL' | 'HAS_OPEN_CASES' | 'NO_OPEN_CASES'
type CaseVolumeFilter = 'ALL' | 'SINGLE_CASE' | 'MULTI_CASE'

type ClientRow = {
  id: string
  clientName: string
  clientContact: string
  totalCases: number
  openCases: number
  caseRefs: Array<{ id: string; caseNo: string }>
  lastUpdated: string
}

export default function ClientsPage() {
  const navigate = useNavigate()
  const [searchValue, setSearchValue] = useState('')
  const [openCasesFilter, setOpenCasesFilter] = useState<OpenCasesFilter>('ALL')
  const [caseVolumeFilter, setCaseVolumeFilter] = useState<CaseVolumeFilter>('ALL')
  const [isFilterOpen, setIsFilterOpen] = useState(false)
  const [isColumnsOpen, setIsColumnsOpen] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [rowsPerPage, setRowsPerPage] = useState(10)
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list')
  const [deletedClientIds, setDeletedClientIds] = useState<string[]>([])
  const [visibleColumns, setVisibleColumns] = useState<Record<string, boolean>>({
    clientName: true,
    clientContact: true,
    caseRefs: true,
    lastUpdated: true,
    actions: true,
  })

  const rowsBase = useMemo<ClientRow[]>(() => {
    const grouped = CASE_MANAGER_CASES.reduce<Record<string, ClientRow>>((acc, item) => {
      if (!acc[item.clientName]) {
        const kin = getNextOfKinForClient(item.clientName)
        const persona = getClientPersona(item.caseNo)
        acc[item.clientName] = {
          id: item.clientName,
          clientName: item.clientType === 'Next of Kin' ? kin.name : item.clientName,
          clientContact: item.clientType === 'Next of Kin' ? kin.contact : item.ofwProfile?.contact || persona.ofwContact,
          totalCases: 0,
          openCases: 0,
          caseRefs: [],
          lastUpdated: item.updatedAt,
        }
      }

      const row = acc[item.clientName]
      row.totalCases += 1
      row.caseRefs.push({ id: item.id, caseNo: item.caseNo })

      if (item.status === 'PENDING' || item.status === 'PROCESSING') {
        row.openCases += 1
      }

      if (new Date(item.updatedAt).getTime() > new Date(row.lastUpdated).getTime()) {
        const persona = getClientPersona(item.caseNo)
        row.lastUpdated = item.updatedAt
        const kin = getNextOfKinForClient(item.clientName)
        row.clientName = item.clientType === 'Next of Kin' ? kin.name : item.clientName
        row.clientContact = item.clientType === 'Next of Kin' ? kin.contact : item.ofwProfile?.contact || persona.ofwContact
      }

      return acc
    }, {})

    return Object.values(grouped)
      .map((row) => ({
        ...row,
        caseRefs: row.caseRefs.sort((a, b) => a.caseNo.localeCompare(b.caseNo)),
      }))
      .sort((a, b) => a.clientName.localeCompare(b.clientName))
  }, [])

  const rows = useMemo(() => rowsBase.filter((row) => !deletedClientIds.includes(row.id)), [rowsBase, deletedClientIds])

  const filteredRows = useMemo(() => {
    const query = searchValue.trim().toLowerCase()

    return rows.filter((row) => {
      const caseTokens = row.caseRefs.map((caseRef) => caseRef.caseNo).join(' ')
      const matchesSearch =
        query.length === 0 ||
        [row.clientName, row.clientContact, caseTokens].join(' ').toLowerCase().includes(query)
      const matchesOpenCases =
        openCasesFilter === 'ALL' ||
        (openCasesFilter === 'HAS_OPEN_CASES' ? row.openCases > 0 : row.openCases === 0)
      const matchesCaseVolume =
        caseVolumeFilter === 'ALL' ||
        (caseVolumeFilter === 'SINGLE_CASE' ? row.totalCases === 1 : row.totalCases > 1)

      return matchesSearch && matchesOpenCases && matchesCaseVolume
    })
  }, [rows, searchValue, openCasesFilter, caseVolumeFilter])

  const kpis = useMemo(() => {
    return {
      totalClients: rows.length,
      totalCases: rows.reduce((acc, row) => acc + row.totalCases, 0),
      ofwCases: CASE_MANAGER_CASES.filter((item) => item.clientType === 'Overseas Filipino Worker').length,
      nokCases: CASE_MANAGER_CASES.filter((item) => item.clientType === 'Next of Kin').length,
    }
  }, [rows])

  const totalRecords = filteredRows.length
  const totalPages = Math.max(1, Math.ceil(totalRecords / rowsPerPage))
  const safeCurrentPage = Math.min(currentPage, totalPages)
  const startIndex = totalRecords === 0 ? 0 : (safeCurrentPage - 1) * rowsPerPage + 1
  const endIndex = totalRecords === 0 ? 0 : Math.min(safeCurrentPage * rowsPerPage, totalRecords)

  const paginatedRows = useMemo(() => {
    const start = (safeCurrentPage - 1) * rowsPerPage
    return filteredRows.slice(start, start + rowsPerPage)
  }, [filteredRows, safeCurrentPage, rowsPerPage])

  const activeFilters: FilterChip[] = useMemo(() => {
    const filters: FilterChip[] = []

    if (openCasesFilter !== 'ALL') {
      filters.push({
        key: 'openCases',
        label: 'Open Cases',
        value: openCasesFilter === 'HAS_OPEN_CASES' ? 'Has Open Cases' : 'No Open Cases',
      })
    }

    if (caseVolumeFilter !== 'ALL') {
      filters.push({
        key: 'caseVolume',
        label: 'Case Volume',
        value: caseVolumeFilter === 'SINGLE_CASE' ? 'Single Case' : 'Multi-Case',
      })
    }

    return filters
  }, [openCasesFilter, caseVolumeFilter])

  const clearAllFilters = () => {
    setOpenCasesFilter('ALL')
    setCaseVolumeFilter('ALL')
    setCurrentPage(1)
  }

  const removeFilter = (filter: FilterChip) => {
    if (filter.key === 'openCases') {
      setOpenCasesFilter('ALL')
      setCurrentPage(1)
      return
    }

    if (filter.key === 'caseVolume') {
      setCaseVolumeFilter('ALL')
      setCurrentPage(1)
    }
  }

  const handleDelete = (row: ClientRow) => {
    const shouldDelete = window.confirm(`Delete client ${row.clientName}?`)
    if (!shouldDelete) {
      return
    }

    setDeletedClientIds((prev) => [...prev, row.id])
  }

  const columns: Column<ClientRow>[] = [
    {
      key: 'clientName',
      title: 'CLIENT NAME',
      render: (row) => <span className="text-[13px] font-semibold text-slate-800">{row.clientName}</span>,
    },
    {
      key: 'clientContact',
      title: 'CONTACT',
      className: 'whitespace-nowrap',
      render: (row) => <span className="text-[12px] text-slate-600">{row.clientContact}</span>,
    },
    {
      key: 'caseRefs',
      title: 'RELATED CASES',
      render: (row) => (
        <div className="flex flex-wrap items-center gap-1.5">
          {row.caseRefs.slice(0, 3).map((caseRef) => (
            <Link
              key={caseRef.id}
              to={`/system-admin/cases/${caseRef.id}`}
              className="inline-flex rounded-[3px] border border-[#bfdbfe] bg-[#eff6ff] px-2 py-0.5 text-[11px] font-bold text-[#0b5384]"
            >
              {caseRef.caseNo}
            </Link>
          ))}
          {row.caseRefs.length > 3 ? (
            <span className="text-[11px] font-semibold text-slate-500">+{row.caseRefs.length - 3} more</span>
          ) : null}
        </div>
      ),
    },
    {
      key: 'lastUpdated',
      title: 'LAST UPDATED',
      className: 'whitespace-nowrap',
      render: (row) => <span className="text-[12px] text-slate-500">{formatDisplayDateTime(row.lastUpdated)}</span>,
    },
    {
      key: 'actions',
      title: 'ACTIONS',
      className: 'whitespace-nowrap text-right',
      render: (row) => {
        const targetCase = row.caseRefs[row.caseRefs.length - 1]

        return (
          <div className="flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => {
                if (!targetCase) {
                  return
                }

                navigate(`/system-admin/clients/${encodeURIComponent(row.id)}`)
              }}
              disabled={!targetCase}
              className="px-3 min-h-[30px] bg-[#f1f5f9] text-slate-700 hover:bg-slate-200 text-[11px] font-bold rounded-[3px] transition-colors border border-slate-300 disabled:cursor-not-allowed disabled:opacity-50"
            >
              View Details
            </button>
            <button
              type="button"
              onClick={() => handleDelete(row)}
              className="px-3 min-h-[30px] bg-[#fee2e2] text-[#b91c1c] hover:bg-[#fecaca] text-[11px] font-bold rounded-[3px] transition-colors border border-[#fecaca]"
            >
              Delete
            </button>
          </div>
        )
      },
    },
  ]

  const activeColumns = columns.filter((column) => visibleColumns[column.key])

  const visibleColumnCount = Object.values(visibleColumns).filter(Boolean).length

  return (
    <div className="relative mx-auto max-w-7xl space-y-5 pb-4">
      <header>
        <h1 className={pageHeadingStyles.pageTitle}>Clients</h1>
        <p className={pageHeadingStyles.pageSubtitle}>Directory of OFWs and next of kin with linked case records.</p>
      </header>

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard title="TOTAL CLIENTS" value={kpis.totalClients} accent="border-[#0b5384]" />
        <KpiCard title="TOTAL CASES" value={kpis.totalCases} accent="border-[#0284c7]" />
        <KpiCard title="OFW CASES" value={kpis.ofwCases} accent="border-[#f59e0b]" />
        <KpiCard title="NOK CASES" value={kpis.nokCases} accent="border-[#16a34a]" />
      </section>

      <UnifiedTable
        data={paginatedRows}
        columns={activeColumns}
        keyExtractor={(row) => row.id}
        totalRecords={totalRecords}
        startIndex={startIndex}
        endIndex={endIndex}
        currentPage={safeCurrentPage}
        totalPages={totalPages}
        rowsPerPage={rowsPerPage}
        rowsPerPageOptions={[5, 10, 25, 50]}
        onPageChange={(page) => setCurrentPage(Math.min(Math.max(page, 1), totalPages))}
        onRowsPerPageChange={(nextRows) => {
          setRowsPerPage(nextRows)
          setCurrentPage(1)
        }}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        searchPlaceholder="Search OFW, next of kin, contact, or case number..."
        searchValue={searchValue}
        onSearchChange={(value) => {
          setSearchValue(value)
          setCurrentPage(1)
        }}
        onAdvancedFilters={() => setIsFilterOpen((prev) => !prev)}
        onColumnsControl={() => setIsColumnsOpen((prev) => !prev)}
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
              <label className="mb-1.5 block text-[12px] font-bold uppercase tracking-wider text-[#64748b]">Open Cases</label>
              <select
                value={openCasesFilter}
                onChange={(event) => {
                  setOpenCasesFilter(event.target.value as OpenCasesFilter)
                  setCurrentPage(1)
                }}
                className="w-full rounded-[3px] border border-[#cbd5e1] bg-slate-50 px-3 py-2 text-[13px] font-bold text-slate-700 outline-none"
              >
                <option value="ALL">All</option>
                <option value="HAS_OPEN_CASES">Has Open Cases</option>
                <option value="NO_OPEN_CASES">No Open Cases</option>
              </select>
            </div>

            <div>
              <label className="mb-1.5 block text-[12px] font-bold uppercase tracking-wider text-[#64748b]">Case Volume</label>
              <select
                value={caseVolumeFilter}
                onChange={(event) => {
                  setCaseVolumeFilter(event.target.value as CaseVolumeFilter)
                  setCurrentPage(1)
                }}
                className="w-full rounded-[3px] border border-[#cbd5e1] bg-slate-50 px-3 py-2 text-[13px] font-bold text-slate-700 outline-none"
              >
                <option value="ALL">All</option>
                <option value="SINGLE_CASE">Single Case</option>
                <option value="MULTI_CASE">Multi-Case</option>
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
            {columns.map((column) => {
              const isLastVisible = visibleColumns[column.key] && visibleColumnCount === 1

              return (
                <label key={column.key} className="flex items-center gap-2 text-[12px] text-slate-700">
                  <input
                    type="checkbox"
                    checked={visibleColumns[column.key]}
                    disabled={isLastVisible}
                    onChange={() =>
                      setVisibleColumns((prev) => ({
                        ...prev,
                        [column.key]: !prev[column.key],
                      }))
                    }
                  />
                  <span>{column.title}</span>
                </label>
              )
            })}
          </div>
        </div>
      ) : null}
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
