import { useMemo, useState } from 'react'
import { UnifiedTable, type Column } from '../../components/ui/UnifiedTable'
import { pageHeadingStyles } from '../agency/pageHeadingStyles'
import { CASE_MANAGER_CASES, getAgencyReferralBreakdown } from '../../data/unifiedData'

type AgencyReportRow = {
  id: string
  agencyName: string
  totalReferrals: number
  pending: number
  processing: number
  completed: number
  completionRate: number
}

export default function ReportsPage() {
  const [searchValue, setSearchValue] = useState('')

  const rows = useMemo<AgencyReportRow[]>(() => {
    const agencies = getAgencyReferralBreakdown(CASE_MANAGER_CASES)

    return agencies.map((agency) => {
      const scoped = CASE_MANAGER_CASES.filter((item) => item.agencyName === agency.agencyName)
      const total = scoped.length
      const pending = scoped.filter((item) => item.status === 'PENDING').length
      const processing = scoped.filter((item) => item.status === 'PROCESSING').length
      const completed = scoped.filter((item) => item.status === 'COMPLETED').length

      return {
        id: agency.agencyName,
        agencyName: agency.agencyName,
        totalReferrals: total,
        pending,
        processing,
        completed,
        completionRate: total > 0 ? Math.round((completed / total) * 100) : 0,
      }
    })
  }, [])

  const filteredRows = useMemo(() => {
    const query = searchValue.trim().toLowerCase()
    if (!query) {
      return rows
    }
    return rows.filter((row) => row.agencyName.toLowerCase().includes(query))
  }, [rows, searchValue])

  const kpis = useMemo(() => {
    const total = CASE_MANAGER_CASES.length
    const completed = CASE_MANAGER_CASES.filter((item) => item.status === 'COMPLETED').length
    const pending = CASE_MANAGER_CASES.filter((item) => item.status === 'PENDING').length

    return {
      total,
      completed,
      pending,
      completionRate: total > 0 ? Math.round((completed / total) * 100) : 0,
    }
  }, [])

  const columns: Column<AgencyReportRow>[] = [
    {
      key: 'agencyName',
      title: 'AGENCY',
      render: (row) => <span className="text-[13px] font-semibold text-slate-800">{row.agencyName}</span>,
    },
    {
      key: 'totalReferrals',
      title: 'TOTAL REFERRALS',
      className: 'text-right',
      render: (row) => <span className="text-[13px] font-bold text-slate-700">{row.totalReferrals}</span>,
    },
    {
      key: 'pending',
      title: 'PENDING',
      className: 'text-right',
      render: (row) => <span className="text-[13px] font-bold text-amber-700">{row.pending}</span>,
    },
    {
      key: 'processing',
      title: 'PROCESSING',
      className: 'text-right',
      render: (row) => <span className="text-[13px] font-bold text-sky-700">{row.processing}</span>,
    },
    {
      key: 'completed',
      title: 'COMPLETED',
      className: 'text-right',
      render: (row) => <span className="text-[13px] font-bold text-emerald-700">{row.completed}</span>,
    },
    {
      key: 'completionRate',
      title: 'COMPLETION RATE',
      className: 'text-right',
      render: (row) => <span className="text-[13px] font-bold text-[#0b5384]">{row.completionRate}%</span>,
    },
  ]

  return (
    <div className="mx-auto max-w-7xl space-y-5 pb-4">
      <header>
        <h1 className={pageHeadingStyles.pageTitle}>Reports</h1>
        <p className={pageHeadingStyles.pageSubtitle}>Analyze referral outcomes and agency performance based on mock referral data.</p>
      </header>

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard title="TOTAL REFERRALS" value={kpis.total} accent="border-[#0b5384]" />
        <KpiCard title="COMPLETED" value={kpis.completed} accent="border-[#16a34a]" />
        <KpiCard title="PENDING" value={kpis.pending} accent="border-[#f59e0b]" />
        <KpiCard title="COMPLETION RATE" value={`${kpis.completionRate}%`} accent="border-[#0284c7]" />
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
        searchPlaceholder="Search agency name..."
        searchValue={searchValue}
        onSearchChange={setSearchValue}
      />
    </div>
  )
}

function KpiCard({ title, value, accent }: { title: string; value: number | string; accent: string }) {
  return (
    <div className={`rounded-[4px] border border-[#cbd5e1] border-l-[4px] ${accent} bg-white px-4 py-4 shadow-sm`}>
      <p className={pageHeadingStyles.metricLabel}>{title}</p>
      <p className="mt-2 text-[30px] leading-none font-black text-[#0f172a]">{value}</p>
    </div>
  )
}