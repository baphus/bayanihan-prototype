import { useEffect, useMemo, useState } from 'react'
import { UnifiedTable, type Column, type FilterChip } from '../../components/ui/UnifiedTable'
import { pageHeadingStyles } from '../agency/pageHeadingStyles'
import {
  formatDisplayDateTime,
  getSystemAdminRows,
  type SystemAdminEntity,
  type SystemAdminCrudRow,
  type SystemAdminRowStatus,
} from '../../data/unifiedData'

type SystemAdminCrudPageProps = {
  entity: SystemAdminEntity
  title: string
  subtitle: string
  recordLabel: string
  newRecordLabel: string
  searchPlaceholder: string
}

export default function SystemAdminCrudPage({
  entity,
  title,
  subtitle,
  recordLabel,
  newRecordLabel,
  searchPlaceholder,
}: SystemAdminCrudPageProps) {
  const [searchValue, setSearchValue] = useState('')
  const [statusFilter, setStatusFilter] = useState<SystemAdminRowStatus | 'ALL'>('ALL')
  const [scopeFilter, setScopeFilter] = useState('ALL')
  const [isFilterOpen, setIsFilterOpen] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [rowsPerPage, setRowsPerPage] = useState(10)
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list')
  const [rows, setRows] = useState<SystemAdminCrudRow[]>(() => getSystemAdminRows(entity))
  const [selectedRow, setSelectedRow] = useState<SystemAdminCrudRow | null>(null)
  const [actionMessage, setActionMessage] = useState('')

  useEffect(() => {
    setRows(getSystemAdminRows(entity))
    setSearchValue('')
    setStatusFilter('ALL')
    setScopeFilter('ALL')
    setCurrentPage(1)
    setSelectedRow(null)
    setActionMessage('')
  }, [entity])

  const summary = useMemo(() => {
    const oneWeekAgo = new Date('2026-04-03T00:00:00').getTime()

    return {
      total: rows.length,
      active: rows.filter((row) => row.status === 'ACTIVE').length,
      archived: rows.filter((row) => row.status === 'ARCHIVED').length,
      updatedThisWeek: rows.filter((row) => new Date(row.updatedAt).getTime() >= oneWeekAgo).length,
    }
  }, [rows])

  const scopeOptions = useMemo(() => {
    return ['ALL', ...Array.from(new Set(rows.map((row) => row.scope))).sort((a, b) => a.localeCompare(b))]
  }, [rows])

  const touchRow = (row: SystemAdminCrudRow): SystemAdminCrudRow => ({
    ...row,
    updatedAt: new Date().toISOString(),
  })

  const handleCreate = () => {
    const recordName = window.prompt(`Enter ${recordLabel.toLowerCase()} name:`)?.trim()
    if (!recordName) {
      return
    }

    const scope = window.prompt('Enter scope for this record:', scopeOptions[1] ?? 'National')?.trim() || 'National'
    const status = window.confirm('Mark record as ACTIVE? Click Cancel for ARCHIVED.') ? 'ACTIVE' : 'ARCHIVED'

    const nextRow: SystemAdminCrudRow = {
      id: `admin-${entity}-${Date.now()}`,
      entity,
      recordId: `${entity.slice(0, 3).toUpperCase()}-${String(rows.length + 1).padStart(4, '0')}`,
      recordLabel: recordName,
      scope,
      status,
      updatedAt: new Date().toISOString(),
    }

    setRows((prev) => [nextRow, ...prev])
    setActionMessage(`Created ${recordLabel.toLowerCase()} record: ${recordName}.`)
  }

  const handleView = (row: SystemAdminCrudRow) => {
    setSelectedRow(row)
    setActionMessage(`Viewing ${row.recordId}.`)
  }

  const handleEdit = (row: SystemAdminCrudRow) => {
    const nextLabel = window.prompt(`Update ${recordLabel.toLowerCase()} name:`, row.recordLabel)?.trim()
    if (!nextLabel) {
      return
    }

    const nextScope = window.prompt('Update scope:', row.scope)?.trim() || row.scope
    const nextStatus = window.confirm('Set status to ACTIVE? Click Cancel for ARCHIVED.') ? 'ACTIVE' : 'ARCHIVED'

    setRows((prev) =>
      prev.map((item) =>
        item.id === row.id
          ? touchRow({
              ...item,
              recordLabel: nextLabel,
              scope: nextScope,
              status: nextStatus,
            })
          : item,
      ),
    )

    setSelectedRow((prev) => (prev?.id === row.id ? touchRow({ ...row, recordLabel: nextLabel, scope: nextScope, status: nextStatus }) : prev))
    setActionMessage(`Updated ${row.recordId}.`)
  }

  const handleDelete = (row: SystemAdminCrudRow) => {
    const shouldDelete = window.confirm(`Delete ${row.recordId} (${row.recordLabel})?`)
    if (!shouldDelete) {
      return
    }

    setRows((prev) => prev.filter((item) => item.id !== row.id))
    setSelectedRow((prev) => (prev?.id === row.id ? null : prev))
    setActionMessage(`Deleted ${row.recordId}.`)
  }

  const filteredRows = useMemo(() => {
    const query = searchValue.trim().toLowerCase()

    return rows.filter((row) => {
      const matchesSearch =
        query.length === 0 ||
        [row.recordId, row.recordLabel, row.scope].join(' ').toLowerCase().includes(query)

      const matchesStatus = statusFilter === 'ALL' || row.status === statusFilter
      const matchesScope = scopeFilter === 'ALL' || row.scope === scopeFilter

      return matchesSearch && matchesStatus && matchesScope
    })
  }, [rows, searchValue, statusFilter, scopeFilter])

  const totalRecords = filteredRows.length
  const totalPages = Math.max(1, Math.ceil(totalRecords / rowsPerPage))
  const safePage = Math.min(currentPage, totalPages)
  const startIndex = totalRecords === 0 ? 0 : (safePage - 1) * rowsPerPage + 1
  const endIndex = totalRecords === 0 ? 0 : Math.min(safePage * rowsPerPage, totalRecords)

  const paginatedRows = useMemo(() => {
    const start = (safePage - 1) * rowsPerPage
    return filteredRows.slice(start, start + rowsPerPage)
  }, [filteredRows, safePage, rowsPerPage])

  const activeFilters: FilterChip[] = useMemo(() => {
    const filters: FilterChip[] = []

    if (statusFilter !== 'ALL') {
      filters.push({ key: 'status', label: 'Status', value: statusFilter })
    }

    if (scopeFilter !== 'ALL') {
      filters.push({ key: 'scope', label: 'Scope', value: scopeFilter })
    }

    return filters
  }, [statusFilter, scopeFilter])

  const clearAllFilters = () => {
    setStatusFilter('ALL')
    setScopeFilter('ALL')
    setCurrentPage(1)
  }

  const removeFilter = (filter: FilterChip) => {
    if (filter.key === 'status') {
      setStatusFilter('ALL')
      return
    }

    if (filter.key === 'scope') {
      setScopeFilter('ALL')
    }
  }

  const columns: Column<SystemAdminCrudRow>[] = [
    {
      key: 'recordId',
      title: 'RECORD ID',
      render: (row) => <span className="text-[13px] font-bold text-[#0b5384]">{row.recordId}</span>,
    },
    {
      key: 'recordLabel',
      title: recordLabel.toUpperCase(),
      render: (row) => <span className="text-[13px] font-semibold text-slate-800">{row.recordLabel}</span>,
    },
    {
      key: 'scope',
      title: 'SCOPE',
      render: (row) => <span className="text-[12px] text-slate-600">{row.scope}</span>,
    },
    {
      key: 'status',
      title: 'STATUS',
      className: 'whitespace-nowrap',
      render: (row) => (
        <span
          className={`px-2 py-0.5 text-[11px] font-extrabold uppercase rounded-[3px] border ${
            row.status === 'ACTIVE'
              ? 'border-[#86efac] bg-[#dcfce7] text-[#166534]'
              : 'border-[#cbd5e1] bg-slate-100 text-slate-700'
          }`}
        >
          {row.status}
        </span>
      ),
    },
    {
      key: 'updatedAt',
      title: 'LAST UPDATED',
      className: 'whitespace-nowrap',
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
            onClick={() => handleView(row)}
            className="px-3 min-h-[32px] bg-[#f1f5f9] text-slate-700 hover:bg-slate-200 text-[12px] font-bold rounded-[3px] transition-colors border border-slate-300"
          >
            View
          </button>
          <button
            type="button"
            onClick={() => handleEdit(row)}
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

  return (
    <div className="w-full pb-8 space-y-5">
      <header>
        <h1 className={pageHeadingStyles.pageTitle}>{title}</h1>
        <p className={pageHeadingStyles.pageSubtitle}>{subtitle}</p>
      </header>

      <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <KpiCard title="TOTAL RECORDS" value={summary.total} accent="border-[#0b5384]" />
        <KpiCard title="ACTIVE" value={summary.active} accent="border-[#16a34a]" />
        <KpiCard title="ARCHIVED" value={summary.archived} accent="border-[#64748b]" />
        <KpiCard title="UPDATED (7D)" value={summary.updatedThisWeek} accent="border-[#0284c7]" />
      </section>

      {actionMessage ? (
        <section className="rounded-[4px] border border-[#bfdbfe] bg-[#eff6ff] px-4 py-3 text-[13px] font-semibold text-[#1d4ed8]">
          {actionMessage}
        </section>
      ) : null}

      {selectedRow ? (
        <section className="rounded-[4px] border border-[#cbd5e1] bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <h3 className="text-[14px] font-bold text-slate-800">Selected Record</h3>
            <button
              type="button"
              onClick={() => setSelectedRow(null)}
              className="rounded-[3px] border border-slate-300 bg-slate-50 px-2 py-1 text-[11px] font-bold text-slate-600"
            >
              Close
            </button>
          </div>
          <div className="mt-3 grid grid-cols-1 gap-2 text-[12px] text-slate-700 md:grid-cols-2 xl:grid-cols-3">
            <p><span className="font-bold text-slate-900">Record ID:</span> {selectedRow.recordId}</p>
            <p><span className="font-bold text-slate-900">{recordLabel}:</span> {selectedRow.recordLabel}</p>
            <p><span className="font-bold text-slate-900">Scope:</span> {selectedRow.scope}</p>
            <p><span className="font-bold text-slate-900">Status:</span> {selectedRow.status}</p>
            <p><span className="font-bold text-slate-900">Updated:</span> {formatDisplayDateTime(selectedRow.updatedAt)}</p>
          </div>
        </section>
      ) : null}

      <UnifiedTable
        data={paginatedRows}
        columns={columns}
        keyExtractor={(row) => row.id}
        totalRecords={totalRecords}
        startIndex={startIndex}
        endIndex={endIndex}
        currentPage={safePage}
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
        searchPlaceholder={searchPlaceholder}
        searchValue={searchValue}
        onSearchChange={(value) => {
          setSearchValue(value)
          setCurrentPage(1)
        }}
        onAdvancedFilters={() => setIsFilterOpen((prev) => !prev)}
        onNewRecord={handleCreate}
        newRecordLabel={newRecordLabel}
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
                  setStatusFilter(event.target.value as SystemAdminRowStatus | 'ALL')
                  setCurrentPage(1)
                }}
                className="w-full rounded-[3px] border border-[#cbd5e1] bg-slate-50 px-3 py-2 text-[13px] font-bold text-slate-700 outline-none"
              >
                <option value="ALL">All</option>
                <option value="ACTIVE">Active</option>
                <option value="ARCHIVED">Archived</option>
              </select>
            </div>

            <div>
              <label className="mb-1.5 block text-[12px] font-bold uppercase tracking-wider text-[#64748b]">Scope</label>
              <select
                value={scopeFilter}
                onChange={(event) => {
                  setScopeFilter(event.target.value)
                  setCurrentPage(1)
                }}
                className="w-full rounded-[3px] border border-[#cbd5e1] bg-slate-50 px-3 py-2 text-[13px] font-bold text-slate-700 outline-none"
              >
                <option value="ALL">All</option>
                {scopeOptions.map((option) => (
                  <option key={option} value={option}>{option}</option>
                ))}
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
