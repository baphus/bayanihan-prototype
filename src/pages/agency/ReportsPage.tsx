import { CalendarRange, Download, Hourglass, Briefcase, TrendingUp } from 'lucide-react'
import { useMemo, useState, type ReactNode } from 'react'
import { UnifiedTable, type Column, type FilterChip } from '../../components/ui/UnifiedTable'
import { pageHeadingStyles } from './pageHeadingStyles'
import { getStatusBadgeClass } from './statusBadgeStyles'
import { getManagedLatestUpdate, getManagedReferrals } from '../../data/caseLifecycleStore'

type ReferredCase = {
  id: string
  caseNo: string
  clientName: string
  service: string
  latestUpdate: string
  createdOn: string
  completedOn?: string
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'REJECTED'
}

type TrendGranularity = 'day' | 'week' | 'month' | 'year'

const DAY_MS = 1000 * 60 * 60 * 24

function toCalendarDate(isoDate: string): Date {
  const [year, month, day] = isoDate.split('-').map(Number)
  return new Date(year, month - 1, day)
}

function addDays(date: Date, days: number): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate() + days)
}

function differenceInDays(start: Date, end: Date): number {
  return Math.floor((end.getTime() - start.getTime()) / DAY_MS)
}

function formatMonthLabel(date: Date, withYear: boolean): string {
  const month = date.toLocaleDateString('en-US', { month: 'short' }).toUpperCase()
  if (!withYear) {
    return month
  }

  return `${month} ${date.getFullYear()}`
}

function formatDayLabel(date: Date): string {
  const month = date.toLocaleDateString('en-US', { month: 'short' }).toUpperCase()
  const day = `${date.getDate()}`.padStart(2, '0')
  return `${month} ${day}`
}

function getTrendGranularity(totalDays: number): TrendGranularity {
  if (totalDays <= 31) {
    return 'day'
  }

  if (totalDays <= 180) {
    return 'week'
  }

  if (totalDays <= 1095) {
    return 'month'
  }

  return 'year'
}

function getLinePointX(index: number, points: number, width = 530, inset = 20): number {
  if (points <= 1) {
    return width / 2
  }

  return inset + index * ((width - inset * 2) / (points - 1))
}

function buildTrendData(from: Date, to: Date, rows: ReferredCase[]) {
  const totalDays = Math.max(1, differenceInDays(from, to) + 1)
  const granularity = getTrendGranularity(totalDays)
  const labels: string[] = []
  const series: number[] = []

  if (granularity === 'day') {
    for (let day = 0; day < totalDays; day += 1) {
      labels.push(formatDayLabel(addDays(from, day)))
      series.push(0)
    }

    rows.forEach((row) => {
      const idx = differenceInDays(from, toCalendarDate(row.createdOn))
      if (idx >= 0 && idx < series.length) {
        series[idx] += 1
      }
    })
  }

  if (granularity === 'week') {
    const weekCount = Math.ceil(totalDays / 7)

    for (let week = 0; week < weekCount; week += 1) {
      const start = addDays(from, week * 7)
      const end = addDays(start, Math.min(6, differenceInDays(start, to)))
      labels.push(`${formatDayLabel(start)}-${formatDayLabel(end)}`)
      series.push(0)
    }

    rows.forEach((row) => {
      const idx = Math.floor(differenceInDays(from, toCalendarDate(row.createdOn)) / 7)
      if (idx >= 0 && idx < series.length) {
        series[idx] += 1
      }
    })
  }

  if (granularity === 'month') {
    const monthStart = new Date(from.getFullYear(), from.getMonth(), 1)
    const monthEnd = new Date(to.getFullYear(), to.getMonth(), 1)
    const includeYear = monthStart.getFullYear() !== monthEnd.getFullYear()

    for (
      let cursor = new Date(monthStart.getFullYear(), monthStart.getMonth(), 1);
      cursor <= monthEnd;
      cursor = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1)
    ) {
      labels.push(formatMonthLabel(cursor, includeYear))
      series.push(0)
    }

    rows.forEach((row) => {
      const created = toCalendarDate(row.createdOn)
      const idx = (created.getFullYear() - monthStart.getFullYear()) * 12 + (created.getMonth() - monthStart.getMonth())
      if (idx >= 0 && idx < series.length) {
        series[idx] += 1
      }
    })
  }

  if (granularity === 'year') {
    const startYear = from.getFullYear()
    const endYear = to.getFullYear()
    const yearCount = endYear - startYear + 1

    for (let year = 0; year < yearCount; year += 1) {
      labels.push(`${startYear + year}`)
      series.push(0)
    }

    rows.forEach((row) => {
      const idx = toCalendarDate(row.createdOn).getFullYear() - startYear
      if (idx >= 0 && idx < series.length) {
        series[idx] += 1
      }
    })
  }

  return {
    granularity,
    labels,
    series,
  }
}

function formatDisplayDate(isoDate?: string): string {
  if (!isoDate) {
    return '---'
  }

  return toCalendarDate(isoDate).toLocaleDateString('en-US', {
    month: 'short',
    day: '2-digit',
    year: 'numeric',
  })
}

function buildLinePath(series: number[], width: number, height: number, inset = 20) {
  if (series.length === 0) {
    return ''
  }

  const min = Math.min(...series)
  const max = Math.max(...series)
  const range = Math.max(1, max - min)
  return series
    .map((value, index) => {
      const x = getLinePointX(index, series.length, width, inset)
      const y = inset + (1 - (value - min) / range) * (height - inset * 2)
      return `${index === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)}`
    })
    .join(' ')
}

function buildPieSegments(items: { value: number; color: string }[]) {
  const radius = 54
  const center = 72
  let startAngle = -90

  return items.map((item, index) => {
    const sweep = (item.value / 100) * 360
    const endAngle = startAngle + sweep

    const startRad = (Math.PI / 180) * startAngle
    const endRad = (Math.PI / 180) * endAngle
    const x1 = center + radius * Math.cos(startRad)
    const y1 = center + radius * Math.sin(startRad)
    const x2 = center + radius * Math.cos(endRad)
    const y2 = center + radius * Math.sin(endRad)
    const largeArcFlag = sweep > 180 ? 1 : 0

    const path = `M ${center} ${center} L ${x1.toFixed(2)} ${y1.toFixed(2)} A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2.toFixed(2)} ${y2.toFixed(2)} Z`

    startAngle = endAngle

    return {
      key: `slice-${index}`,
      color: item.color,
      path,
    }
  })
}

export default function ReportsPage() {
  const defaultFromISO = '2026-03-01'
  const defaultToISO = '2026-04-30'

  const [fromDateISO, setFromDateISO] = useState(defaultFromISO)
  const [toDateISO, setToDateISO] = useState(defaultToISO)

  const [searchValue, setSearchValue] = useState('')
  const [isFilterOpen, setIsFilterOpen] = useState(false)
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'REJECTED'>('ALL')

  const referredCases: ReferredCase[] = getManagedReferrals().map((item) => ({
    id: item.id,
    caseNo: item.caseNo,
    clientName: item.clientName,
    service: item.service,
    latestUpdate: getManagedLatestUpdate(item.id),
    createdOn: item.createdAt.slice(0, 10),
    completedOn: item.status === 'COMPLETED' ? item.updatedAt.slice(0, 10) : undefined,
    status: item.status,
  }))

  const activeFromDate = useMemo(() => toCalendarDate(fromDateISO), [fromDateISO])
  const activeToDate = useMemo(() => toCalendarDate(toDateISO), [toDateISO])

  const dateRangeCases = useMemo(
    () =>
      referredCases.filter((row) => {
        const created = toCalendarDate(row.createdOn)
        return created >= activeFromDate && created <= activeToDate
      }),
    [activeFromDate, activeToDate],
  )

  const searchedCases = useMemo(() => {
    const query = searchValue.trim().toLowerCase()
    if (!query) {
      return dateRangeCases
    }

    return dateRangeCases.filter((row) => {
      const searchable = [row.caseNo, row.clientName, row.service, row.latestUpdate].join(' ').toLowerCase()
      return searchable.includes(query)
    })
  }, [dateRangeCases, searchValue])

  const filteredCases = useMemo(
    () => searchedCases.filter((row) => (statusFilter === 'ALL' ? true : row.status === statusFilter)),
    [searchedCases, statusFilter],
  )

  const kpiData = useMemo(() => {
    const total = dateRangeCases.length
    const completed = dateRangeCases.filter((row) => row.status === 'COMPLETED').length
    const pending = dateRangeCases.filter((row) => row.status === 'PENDING').length
    const completionRate = total > 0 ? (completed / total) * 100 : 0

    const completedDurations = dateRangeCases
      .filter((row) => row.status === 'COMPLETED' && row.completedOn)
      .map((row) => {
        const start = toCalendarDate(row.createdOn).getTime()
        const end = toCalendarDate(row.completedOn as string).getTime()
        return (end - start) / (1000 * 60 * 60 * 24)
      })

    const averageDays =
      completedDurations.length > 0
        ? completedDurations.reduce((sum, value) => sum + value, 0) / completedDurations.length
        : 0

    return {
      total,
      completed,
      pending,
      averageDays,
      completionRate,
    }
  }, [dateRangeCases])

  const statusBreakdown = useMemo(() => {
    const total = dateRangeCases.length
    const completed = dateRangeCases.filter((row) => row.status === 'COMPLETED').length
    const processing = dateRangeCases.filter((row) => row.status === 'PROCESSING').length
    const pending = dateRangeCases.filter((row) => row.status === 'PENDING').length
    const rejected = dateRangeCases.filter((row) => row.status === 'REJECTED').length

    const toPercent = (count: number) => (total > 0 ? Math.round((count / total) * 100) : 0)

    return [
      { label: 'Completed', value: toPercent(completed), color: '#0b7a75' },
      { label: 'Processing', value: toPercent(processing), color: '#0b5a8c' },
      { label: 'Pending', value: toPercent(pending), color: '#9a5b1a' },
      { label: 'Rejected', value: toPercent(rejected), color: '#b91c1c' },
    ]
  }, [dateRangeCases])

  const trendData = useMemo(() => buildTrendData(activeFromDate, activeToDate, dateRangeCases), [activeFromDate, activeToDate, dateRangeCases])
  const linePath = useMemo(() => buildLinePath(trendData.series, 530, 220), [trendData.series])

  const trendLabelStep = useMemo(() => {
    if (trendData.labels.length <= 8) {
      return 1
    }

    return Math.ceil(trendData.labels.length / 6)
  }, [trendData.labels.length])

  const trendTitle =
    trendData.granularity === 'day'
      ? 'Daily Trend'
      : trendData.granularity === 'week'
        ? 'Weekly Trend'
        : trendData.granularity === 'month'
          ? 'Monthly Trend'
          : 'Yearly Trend'
  const pieSegments = useMemo(
    () => buildPieSegments(statusBreakdown.map((item) => ({ value: item.value, color: item.color }))),
    [statusBreakdown],
  )

  const mostRequestedService = useMemo(() => {
    if (dateRangeCases.length === 0) {
      return { name: 'No data in range', count: 0, share: 0 }
    }

    const buckets = dateRangeCases.reduce<Record<string, number>>((acc, row) => {
      acc[row.service] = (acc[row.service] ?? 0) + 1
      return acc
    }, {})

    const sorted = Object.entries(buckets).sort((a, b) => b[1] - a[1])
    const [name, count] = sorted[0]
    const share = Math.round((count / dateRangeCases.length) * 100)

    return { name, count, share }
  }, [dateRangeCases])

  const averageTimeInsight = useMemo(() => {
    const selectedAvg = kpiData.averageDays
    const rangeDays = Math.max(1, differenceInDays(activeFromDate, activeToDate) + 1)
    const previousTo = addDays(activeFromDate, -1)
    const previousFrom = addDays(previousTo, -(rangeDays - 1))

    const previousRangeCases = referredCases.filter((row) => {
      const created = toCalendarDate(row.createdOn)
      return created >= previousFrom && created <= previousTo
    })

    const previousDurations = previousRangeCases
      .filter((row) => row.status === 'COMPLETED' && row.completedOn)
      .map((row) => {
        const start = toCalendarDate(row.createdOn).getTime()
        const end = toCalendarDate(row.completedOn as string).getTime()
        return (end - start) / DAY_MS
      })

    const previousAvg =
      previousDurations.length > 0
        ? previousDurations.reduce((sum, value) => sum + value, 0) / previousDurations.length
        : 0

    if (selectedAvg === 0) {
      return 'No completed referrals in selected range.'
    }

    if (previousAvg === 0) {
      return 'No completed referrals in previous period for comparison.'
    }

    const deltaPercent = Math.abs(((selectedAvg - previousAvg) / previousAvg) * 100)
    if (selectedAvg < previousAvg) {
      return `Improved by ${deltaPercent.toFixed(1)}% vs previous period.`
    }

    if (selectedAvg > previousAvg) {
      return `Slower by ${deltaPercent.toFixed(1)}% vs previous period.`
    }

    return 'No change vs previous period.'
  }, [activeFromDate, activeToDate, kpiData.averageDays])

  const activeFilters: FilterChip[] = useMemo(() => {
    if (statusFilter === 'ALL') {
      return []
    }

    return [{ key: 'status', label: 'Status', value: statusFilter }]
  }, [statusFilter])

  const resetDateRange = () => {
    setFromDateISO(defaultFromISO)
    setToDateISO(defaultToISO)
    setStatusFilter('ALL')
    setSearchValue('')
  }

  const columns: Column<ReferredCase>[] = [
    {
      key: 'caseNo',
      title: 'TRACKING ID',
      render: (row) => <span className="text-[12px] font-bold text-[#0b5a8c]">{row.caseNo}</span>,
    },
    {
      key: 'clientName',
      title: 'CLIENT NAME',
      render: (row) => <span className="text-[12px] font-semibold text-slate-700">{row.clientName}</span>,
    },
    {
      key: 'service',
      title: 'SERVICE',
      render: (row) => <span className="text-[12px] text-slate-700">{row.service}</span>,
    },
    {
      key: 'latestUpdate',
      title: 'LATEST UPDATE',
      render: (row) => <span className="text-[12px] text-slate-600">{row.latestUpdate}</span>,
    },
    {
      key: 'status',
      title: 'STATUS',
      render: (row) => (
        <span className={`inline-flex rounded-[2px] border px-2 py-1 text-[10px] font-extrabold tracking-wide ${getStatusBadgeClass(row.status)}`}>
          {row.status}
        </span>
      ),
    },
    {
      key: 'createdOn',
      title: 'CREATED ON',
      render: (row) => <span className="text-[12px] text-slate-600">{formatDisplayDate(row.createdOn)}</span>,
    },
    {
      key: 'completedOn',
      title: 'COMPLETED ON',
      render: (row) => <span className="text-[12px] text-slate-600">{formatDisplayDate(row.completedOn)}</span>,
    },
  ]

  return (
    <div className="mx-auto max-w-7xl space-y-5 pb-4">
      <header className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h1 className={pageHeadingStyles.pageTitle}>Reports</h1>
          <p className={pageHeadingStyles.pageSubtitle}>Agency performance overview</p>
        </div>

        <div className="flex w-full max-w-[470px] flex-wrap items-center gap-2 rounded-[2px] border border-[#cfd6de] bg-[#f7f9fc] p-2.5">
          <div className="inline-flex h-9 items-center gap-2 border border-[#cbd5e1] bg-white px-3 text-[10px] font-bold uppercase tracking-[0.08em] text-slate-600">
            <CalendarRange className="h-4 w-4" />
            Date Range
          </div>
          <input
            type="date"
            value={fromDateISO}
            onChange={(event) => {
              const nextFrom = event.target.value
              setFromDateISO(nextFrom)
              if (nextFrom > toDateISO) {
                setToDateISO(nextFrom)
              }
            }}
            className="h-9 w-[132px] border border-[#cbd5e1] bg-white px-2 text-[11px] font-medium text-slate-700 outline-none"
          />
          <span className="px-0.5 text-slate-400">—</span>
          <input
            type="date"
            value={toDateISO}
            onChange={(event) => {
              const nextTo = event.target.value
              setToDateISO(nextTo)
              if (nextTo < fromDateISO) {
                setFromDateISO(nextTo)
              }
            }}
            className="h-9 w-[132px] border border-[#cbd5e1] bg-white px-2 text-[11px] font-medium text-slate-700 outline-none"
          />
          <button
            onClick={resetDateRange}
            className="h-9 px-2 text-[10px] font-extrabold uppercase tracking-[0.08em] text-slate-500"
          >
            Reset
          </button>
          <button className="ml-auto inline-flex h-9 items-center gap-2 border border-[#cbd5e1] bg-white px-3 text-[10px] font-bold uppercase tracking-[0.08em] text-[#0b5a8c]">
            <Download className="h-3.5 w-3.5" />
            Export
          </button>
        </div>
      </header>

      <section className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-5">
        <MetricCard label="Total Referrals" value={`${kpiData.total}`} accent="border-l-[#0b5a8c]" />
        <MetricCard label="Completed" value={`${kpiData.completed}`} accent="border-l-[#0b7a75]" />
        <MetricCard
          label="Pending"
          value={`${kpiData.pending}`}
          accent="border-l-[#9a5b1a]"
          valueTone="text-[#9a5b1a]"
        />
        <MetricCard
          label="Avg Completion Time (days)"
          value={kpiData.averageDays.toFixed(1)}
          accent="border-l-[#0b5a8c]"
          description="Calculated from Referral Sent to Referral Completion"
        />
        <MetricCard
          label="Completion Rate"
          value={`${Math.round(kpiData.completionRate)}%`}
          accent="border-l-[#0b7a75]"
          trailing={<div className="h-[4px] w-8 rounded-full bg-[#0b7a75]" />}
        />
      </section>

      <section className="grid grid-cols-1 gap-4 xl:grid-cols-[1.05fr_2.2fr]">
        <article className="border border-[#cbd5e1] bg-white p-4">
          <h3 className={`mb-4 ${pageHeadingStyles.sectionTitle}`}>Referrals By Status</h3>
          <div className="flex items-center justify-center">
            <svg width="150" height="150" viewBox="0 0 144 144" aria-label="Referrals by status pie chart">
              {pieSegments.map((segment) => (
                <path key={segment.key} d={segment.path} fill={segment.color} />
              ))}
            </svg>
          </div>
          <div className="mt-3 space-y-2">
            {statusBreakdown.map((item) => (
              <div key={item.label} className="flex items-center justify-between text-[12px]">
                <span className="inline-flex items-center gap-2 text-slate-600">
                  <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                  {item.label}
                </span>
                <span className="font-bold text-slate-700">{item.value}%</span>
              </div>
            ))}
          </div>
        </article>

        <article className="border border-[#cbd5e1] bg-white p-4">
          <div className="mb-3 flex items-center justify-between">
            <h3 className={pageHeadingStyles.sectionTitle}>Referrals Over Time</h3>
            <span className="text-[10px] font-extrabold uppercase tracking-[0.12em] text-[#0b5a8c]">{trendTitle}</span>
          </div>
          <svg width="100%" viewBox="0 0 530 220" preserveAspectRatio="none" className="h-[220px]">
            {[0, 1, 2, 3, 4].map((idx) => (
              <line
                key={`grid-${idx}`}
                x1="20"
                x2="510"
                y1={30 + idx * 40}
                y2={30 + idx * 40}
                stroke="#e2e8f0"
                strokeWidth="1"
              />
            ))}
            <path d={linePath} fill="none" stroke="#0b5a8c" strokeWidth="3" strokeLinecap="round" />
            {trendData.series.map((value, idx) => {
              const min = Math.min(...trendData.series)
              const max = Math.max(...trendData.series)
              const range = Math.max(1, max - min)
              const x = getLinePointX(idx, trendData.series.length)
              const y = 20 + (1 - (value - min) / range) * (220 - 40)

              return <circle key={`pt-${idx}`} cx={x} cy={y} r="2.6" fill="#0b5a8c" />
            })}
            <g fill="#94a3b8" fontSize="8" fontWeight="700" letterSpacing="0.05em">
              {trendData.labels.map((label, index) => {
                const shouldRender = index % trendLabelStep === 0 || index === trendData.labels.length - 1
                if (!shouldRender) {
                  return null
                }

                return (
                  <text key={`${label}-${index}`} x={getLinePointX(index, trendData.labels.length) - 12} y="214">
                  {label}
                </text>
                )
              })}
            </g>
          </svg>
        </article>
      </section>

      <section className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <article className="flex items-center gap-4 bg-[#0b3f69] px-6 py-5 text-white shadow-sm">
          <div className="flex h-12 w-12 items-center justify-center rounded-[2px] bg-white/10">
            <Briefcase className="h-6 w-6" />
          </div>
          <div>
            <p className="text-[10px] font-extrabold uppercase tracking-[0.14em] text-[#8cc7e7]">Most Requested Service</p>
            <p className="text-3xl font-black leading-tight">{mostRequestedService.name}</p>
            <p className="text-[13px] text-[#bee1f3]">
              {mostRequestedService.count} referrals • {mostRequestedService.share}% of selected range
            </p>
          </div>
        </article>

        <article className="flex items-center gap-4 bg-[#9de8db] px-6 py-5 text-[#045f68] shadow-sm">
          <div className="flex h-12 w-12 items-center justify-center rounded-[2px] bg-white/40">
            <Hourglass className="h-6 w-6" />
          </div>
          <div>
            <p className="text-[10px] font-extrabold uppercase tracking-[0.14em] text-[#0f7f7c]">Average Time Per Referral</p>
            <p className="text-3xl font-black leading-tight">{kpiData.averageDays.toFixed(1)} Days</p>
            <p className="text-[13px] text-[#0f7f7c]">Calculated from Referral Sent to Referral Completion</p>
            <p className="text-[11px] text-[#0f7f7c]">{averageTimeInsight}</p>
          </div>
          <TrendingUp className="ml-auto h-5 w-5 opacity-70" />
        </article>
      </section>

      <section className="border border-[#cbd5e1] bg-white">
        <div className="flex items-center justify-between border-b border-[#cbd5e1] px-4 py-3">
          <h3 className={pageHeadingStyles.sectionTitle}>Referred Cases</h3>
          <button className="inline-flex items-center gap-1.5 text-[10px] font-extrabold uppercase tracking-[0.11em] text-slate-500 hover:text-slate-700">
            <Download className="h-3.5 w-3.5" />
            Export CSV
          </button>
        </div>

        <UnifiedTable
          variant="embedded"
          data={filteredCases}
          columns={columns}
          keyExtractor={(row) => row.id}
          searchPlaceholder="Search case no, client, service, latest update..."
          searchValue={searchValue}
          onSearchChange={setSearchValue}
          onAdvancedFilters={() => setIsFilterOpen((prev) => !prev)}
          isAdvancedFiltersOpen={isFilterOpen}
          advancedFiltersContent={
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-[12px] font-bold uppercase tracking-[0.08em] text-slate-700">Status Filter</h4>
                <button
                  onClick={() => setIsFilterOpen(false)}
                  className="text-[11px] font-bold uppercase tracking-[0.06em] text-slate-500"
                >
                  Close
                </button>
              </div>
              <select
                value={statusFilter}
                onChange={(event) =>
                  setStatusFilter(event.target.value as 'ALL' | 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'REJECTED')
                }
                className="h-10 w-full border border-[#cbd5e1] px-3 text-[13px] font-semibold text-slate-700 outline-none"
              >
                <option value="ALL">All statuses</option>
                <option value="PENDING">Pending</option>
                <option value="PROCESSING">Processing</option>
                <option value="COMPLETED">Completed</option>
                <option value="REJECTED">Rejected</option>
              </select>
            </div>
          }
          activeFilters={activeFilters}
          onRemoveFilter={() => setStatusFilter('ALL')}
          onClearFilters={() => setStatusFilter('ALL')}
          totalRecords={filteredCases.length}
          startIndex={filteredCases.length > 0 ? 1 : 0}
          endIndex={filteredCases.length}
          hidePagination
        />
      </section>
    </div>
  )
}

function MetricCard({
  label,
  value,
  accent,
  description,
  valueTone,
  trailing,
}: {
  label: string
  value: string
  accent: string
  description?: string
  valueTone?: string
  trailing?: ReactNode
}) {
  return (
    <article className={`border border-[#d5dbe3] border-l-[3px] ${accent} bg-[#f8fafc] px-4 py-3`}>
      <p className={pageHeadingStyles.metricLabel}>{label}</p>
      <div className="mt-1 flex items-end justify-between">
        <p className={`text-[33px] font-black leading-none text-[#0f172a] ${valueTone ?? ''}`}>{value}</p>
        {trailing}
      </div>
      {description ? <p className="mt-1 text-[10px] font-semibold text-slate-500">{description}</p> : null}
    </article>
  )
}