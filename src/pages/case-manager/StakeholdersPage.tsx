import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { UnifiedTable, type Column, type FilterChip } from '../../components/ui/UnifiedTable'
import { pageHeadingStyles } from '../agency/pageHeadingStyles'
import { CASE_MANAGER_CASES, getCaseManagerAgencies } from '../../data/unifiedData'

type ActiveReferralsFilter = 'ALL' | 'HAS_ACTIVE' | 'NO_ACTIVE'
type ReferralVolumeFilter = 'ALL' | 'SINGLE_REFERRAL' | 'MULTI_REFERRAL'

type StakeholderRow = {
  id: string
  short: string
  name: string
  contact: string
  email: string
  services: string[]
  totalReferrals: number
  activeReferrals: number
  completedReferrals: number
}

export default function StakeholdersPage() {
  const navigate = useNavigate()
  const [searchValue, setSearchValue] = useState('')
  const [activeReferralsFilter, setActiveReferralsFilter] = useState<ActiveReferralsFilter>('ALL')
  const [referralVolumeFilter, setReferralVolumeFilter] = useState<ReferralVolumeFilter>('ALL')
  const [isFilterOpen, setIsFilterOpen] = useState(false)
  const [isColumnsOpen, setIsColumnsOpen] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [rowsPerPage, setRowsPerPage] = useState(10)
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list')
  const [visibleColumns, setVisibleColumns] = useState<Record<string, boolean>>({
    name: true,
    contact: true,
    email: true,
    services: true,
    totalReferrals: true,
    activeReferrals: true,
    completedReferrals: true,
    actions: true,
  })

  const rows = useMemo<StakeholderRow[]>(() => {
    const agencies = getCaseManagerAgencies()

    return agencies.map((agency) => {
      const referrals = CASE_MANAGER_CASES.filter((item) => item.agencyId === agency.id)
      return {
        id: agency.id,
        short: agency.short,
        name: agency.name,
        contact: agency.contact,
        email: agency.email,
        services: agency.services,
        totalReferrals: referrals.length,
        activeReferrals: referrals.filter((item) => item.status === 'PENDING' || item.status === 'PROCESSING').length,
        completedReferrals: referrals.filter((item) => item.status === 'COMPLETED').length,
      }
    })
  }, [])

  const filteredRows = useMemo(() => {
    const query = searchValue.trim().toLowerCase()

    return rows.filter((row) => {
      const matchesSearch =
        query.length === 0 || [row.name, row.short, row.contact, row.email].join(' ').toLowerCase().includes(query)
      const matchesActiveReferrals =
        activeReferralsFilter === 'ALL' ||
        (activeReferralsFilter === 'HAS_ACTIVE' ? row.activeReferrals > 0 : row.activeReferrals === 0)
      const matchesReferralVolume =
        referralVolumeFilter === 'ALL' ||
        (referralVolumeFilter === 'SINGLE_REFERRAL' ? row.totalReferrals === 1 : row.totalReferrals > 1)

      return matchesSearch && matchesActiveReferrals && matchesReferralVolume
    })
  }, [rows, searchValue, activeReferralsFilter, referralVolumeFilter])

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

    if (activeReferralsFilter !== 'ALL') {
      filters.push({
        key: 'activeReferrals',
        label: 'Active Referrals',
        value: activeReferralsFilter === 'HAS_ACTIVE' ? 'Has Active Referrals' : 'No Active Referrals',
      })
    }

    if (referralVolumeFilter !== 'ALL') {
      filters.push({
        key: 'referralVolume',
        label: 'Referral Volume',
        value: referralVolumeFilter === 'SINGLE_REFERRAL' ? 'Single Referral' : 'Multi-Referral',
      })
    }

    return filters
  }, [activeReferralsFilter, referralVolumeFilter])

  const clearAllFilters = () => {
    setActiveReferralsFilter('ALL')
    setReferralVolumeFilter('ALL')
    setCurrentPage(1)
  }

  const removeFilter = (filter: FilterChip) => {
    if (filter.key === 'activeReferrals') {
      setActiveReferralsFilter('ALL')
      setCurrentPage(1)
      return
    }

    if (filter.key === 'referralVolume') {
      setReferralVolumeFilter('ALL')
      setCurrentPage(1)
    }
  }

  const columns: Column<StakeholderRow>[] = [
    {
      key: 'name',
      title: 'AGENCY',
      render: (row) => (
        <div>
          <p className="text-[13px] font-semibold text-slate-800">{row.name}</p>
          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">{row.short}</p>
        </div>
      ),
    },
    {
      key: 'contact',
      title: 'CONTACT',
      render: (row) => <span className="text-[12px] text-slate-600">{row.contact}</span>,
    },
    {
      key: 'email',
      title: 'EMAIL',
      render: (row) => <span className="text-[12px] text-slate-600">{row.email}</span>,
    },
    {
      key: 'services',
      title: 'SERVICES',
      render: (row) => (
        <span className="text-[12px] text-slate-600">
          {row.services.length ? row.services.join(', ') : 'No configured services'}
        </span>
      ),
    },
    {
      key: 'totalReferrals',
      title: 'TOTAL REFERRALS',
      className: 'text-right',
      render: (row) => <span className="text-[13px] font-bold text-slate-700">{row.totalReferrals}</span>,
    },
    {
      key: 'activeReferrals',
      title: 'ACTIVE',
      className: 'text-right',
      render: (row) => <span className="text-[13px] font-bold text-[#0b5384]">{row.activeReferrals}</span>,
    },
    {
      key: 'completedReferrals',
      title: 'COMPLETED',
      className: 'text-right',
      render: (row) => <span className="text-[13px] font-bold text-emerald-700">{row.completedReferrals}</span>,
    },
    {
      key: 'actions',
      title: 'ACTIONS',
      className: 'whitespace-nowrap text-right',
      render: (row) => (
        <button
          type="button"
          onClick={() => navigate(`/case-manager/stakeholders/${row.id}`)}
          className="h-8 rounded-[3px] border border-slate-300 bg-slate-100 px-3 text-[11px] font-bold text-slate-700 hover:bg-slate-200"
        >
          View
        </button>
      ),
    },
  ]

  const activeColumns = columns.filter((column) => visibleColumns[column.key])
  const visibleColumnCount = Object.values(visibleColumns).filter(Boolean).length

  return (
    <div className="relative mx-auto max-w-7xl space-y-5 pb-4">
      <header>
        <h1 className={pageHeadingStyles.pageTitle}>Stakeholders</h1>
        <p className={pageHeadingStyles.pageSubtitle}>Monitor partner agencies and their current referral workload.</p>
      </header>

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
        searchPlaceholder="Search stakeholder agency, contact, or email..."
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
              <label className="mb-1.5 block text-[12px] font-bold uppercase tracking-wider text-[#64748b]">Active Referrals</label>
              <select
                value={activeReferralsFilter}
                onChange={(event) => {
                  setActiveReferralsFilter(event.target.value as ActiveReferralsFilter)
                  setCurrentPage(1)
                }}
                className="w-full rounded-[3px] border border-[#cbd5e1] bg-slate-50 px-3 py-2 text-[13px] font-bold text-slate-700 outline-none"
              >
                <option value="ALL">All</option>
                <option value="HAS_ACTIVE">Has Active Referrals</option>
                <option value="NO_ACTIVE">No Active Referrals</option>
              </select>
            </div>

            <div>
              <label className="mb-1.5 block text-[12px] font-bold uppercase tracking-wider text-[#64748b]">Referral Volume</label>
              <select
                value={referralVolumeFilter}
                onChange={(event) => {
                  setReferralVolumeFilter(event.target.value as ReferralVolumeFilter)
                  setCurrentPage(1)
                }}
                className="w-full rounded-[3px] border border-[#cbd5e1] bg-slate-50 px-3 py-2 text-[13px] font-bold text-slate-700 outline-none"
              >
                <option value="ALL">All</option>
                <option value="SINGLE_REFERRAL">Single Referral</option>
                <option value="MULTI_REFERRAL">Multi-Referral</option>
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