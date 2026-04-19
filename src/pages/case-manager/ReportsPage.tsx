import { CalendarRange, Download, Hourglass, Building2, TrendingUp } from 'lucide-react'
import { useMemo, useState, type ReactNode } from 'react'
import { UnifiedTable, type Column, type FilterChip } from '../../components/ui/UnifiedTable'
import { pageHeadingStyles } from '../agency/pageHeadingStyles'
import { getStatusBadgeClass } from '../agency/statusBadgeStyles'
import { getClientPersona } from '../../data/unifiedData'
import { getManagedCases, getManagedLatestUpdate, getManagedReferrals } from '../../data/caseLifecycleStore'
import { getExistingClientProfile } from '../../data/unifiedData'

type ReportCase = {
  id: string
  caseNo: string
  clientName: string
  agencyName: string
  service: string
  latestUpdate: string
  createdOn: string
  completedOn?: string
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'REJECTED'
}

type ReportManagedCase = {
  id: string
  caseNo: string
  clientName: string
  clientType: 'Overseas Filipino Worker' | 'Next of Kin'
  agencyName: string
  milestone: string
  lastJob?: string
  lastCountry?: string
  provinceName?: string
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'REJECTED'
  createdOn: string
  updatedOn: string
}

type ReportManagedClient = {
  id: string
  clientName: string
  clientType: 'Overseas Filipino Worker' | 'Next of Kin'
  provinceName?: string
  totalCases: number
  openCases: number
  closedCases: number
  primaryAgency: string
  latestActivity: string
}

type TrendGranularity = 'day' | 'week' | 'month' | 'year'
type QuickRangeOption = '7_DAYS' | '14_DAYS' | '30_DAYS' | '6_MONTHS' | '1_YEAR' | 'CUSTOM'

const DAY_MS = 1000 * 60 * 60 * 24

function toCalendarDate(isoDate: string): Date {
  const [year, month, day] = isoDate.split('-').map(Number)
  return new Date(year, month - 1, day)
}

function addDays(date: Date, days: number): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate() + days)
}

function toISODateInputValue(date: Date): string {
  const year = date.getFullYear()
  const month = `${date.getMonth() + 1}`.padStart(2, '0')
  const day = `${date.getDate()}`.padStart(2, '0')
  return `${year}-${month}-${day}`
}

function getQuickRangeDates(option: Exclude<QuickRangeOption, 'CUSTOM'>): { fromISO: string; toISO: string } {
  const toDate = new Date()
  let fromDate = new Date(toDate.getFullYear(), toDate.getMonth(), toDate.getDate())

  if (option === '7_DAYS') {
    fromDate = addDays(toDate, -6)
  }

  if (option === '14_DAYS') {
    fromDate = addDays(toDate, -13)
  }

  if (option === '30_DAYS') {
    fromDate = addDays(toDate, -29)
  }

  if (option === '6_MONTHS') {
    fromDate = new Date(toDate.getFullYear(), toDate.getMonth() - 6, toDate.getDate())
  }

  if (option === '1_YEAR') {
    fromDate = new Date(toDate.getFullYear() - 1, toDate.getMonth(), toDate.getDate())
  }

  return {
    fromISO: toISODateInputValue(fromDate),
    toISO: toISODateInputValue(toDate),
  }
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

function buildTrendData(from: Date, to: Date, rows: ReportCase[]) {
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

function PieChart({ data, className = "w-16 h-16" }: { data: { label: string; count: number; hex: string }[], className?: string }) {
  const total = data.reduce((sum, item) => sum + item.count, 0) || 1;
  let cumulativePercent = 0;
  
  return (
    <svg viewBox="0 0 63.6619772 63.6619772" className={`${className} -rotate-90 rounded-full shrink-0`}>
      <circle cx="31.8309886" cy="31.8309886" r="31.8309886" fill="#f1f5f9" />
      {data.map(item => {
        const pct = (item.count / total) * 100;
        const offset = 100 - cumulativePercent;
        const strokeDasharray = `${pct} ${100 - pct}`;
        cumulativePercent += pct;
        
        if (pct === 0) return null;
        
        return (
          <circle
            key={item.label}
            r="15.915494309189533"
            cx="31.8309886"
            cy="31.8309886"
            fill="transparent"
            stroke={item.hex}
            strokeWidth="31.8309886"
            strokeDasharray={strokeDasharray}
            strokeDashoffset={offset}
            className="cursor-pointer hover:opacity-80 transition-opacity outline-none"
          >
            <title>{item.label}: {item.count}</title>
          </circle>
        );
      })}
    </svg>
  );
}

export default function ReportsPage() {
  const defaultFromISO = '2026-03-01'
  const defaultToISO = '2026-04-30'

  const [fromDateISO, setFromDateISO] = useState(defaultFromISO)
  const [toDateISO, setToDateISO] = useState(defaultToISO)
  const [quickRange, setQuickRange] = useState<QuickRangeOption>('CUSTOM')

  const [searchValue, setSearchValue] = useState('')
  const [isFilterOpen, setIsFilterOpen] = useState(false)
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'REJECTED'>('ALL')
  const [agencyFilter, setAgencyFilter] = useState('ALL')
  const [casesCurrentPage, setCasesCurrentPage] = useState(1)
  const [casesRowsPerPage, setCasesRowsPerPage] = useState(10)
  const [clientsCurrentPage, setClientsCurrentPage] = useState(1)
  const [clientsRowsPerPage, setClientsRowsPerPage] = useState(10)
  const [referralsCurrentPage, setReferralsCurrentPage] = useState(1)
  const [referralsRowsPerPage, setReferralsRowsPerPage] = useState(10)

  const reportCases: ReportCase[] = getManagedReferrals().map((item) => ({
    id: item.id,
    caseNo: item.caseNo,
    clientName: item.clientName,
    agencyName: item.agencyName,
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
      reportCases.filter((row) => {
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
      const searchable = [row.caseNo, row.clientName, row.agencyName, row.service, row.latestUpdate].join(' ').toLowerCase()
      return searchable.includes(query)
    })
  }, [dateRangeCases, searchValue])

  const filteredCases = useMemo(
    () =>
      searchedCases.filter((row) => {
        const statusMatch = statusFilter === 'ALL' ? true : row.status === statusFilter
        const agencyMatch = agencyFilter === 'ALL' ? true : row.agencyName === agencyFilter
        return statusMatch && agencyMatch
      }),
    [searchedCases, statusFilter, agencyFilter],
  )

  const reportManagedCases = useMemo<ReportManagedCase[]>(() => {
    return getManagedCases().map((item) => ({
      id: item.id,
      caseNo: item.caseNo,
      clientName: item.clientName,
      clientType: item.clientType,
      agencyName: item.agencyName,
      milestone: item.milestone,
      lastJob: item.workHistory?.lastJob,
      lastCountry: item.workHistory?.lastCountry,
      provinceName: item.ofwProfile?.address?.provinceName || getExistingClientProfile(item.clientName).address.provinceName || 'Unknown',
      status: item.status,
      createdOn: item.createdAt.slice(0, 10),
      updatedOn: item.updatedAt.slice(0, 10),
    }))
  }, [])

  const filteredManagedCases = useMemo(() => {
    return reportManagedCases.filter((row) => {
      const created = toCalendarDate(row.createdOn)
      if (created < activeFromDate || created > activeToDate) {
        return false
      }

      const query = searchValue.trim().toLowerCase()
      const matchesSearch =
        query.length === 0 ||
        [row.caseNo, row.clientName, row.clientType, row.agencyName, row.milestone].join(' ').toLowerCase().includes(query)
      const matchesStatus = statusFilter === 'ALL' ? true : row.status === statusFilter
      const matchesAgency = agencyFilter === 'ALL' ? true : row.agencyName === agencyFilter

      return matchesSearch && matchesStatus && matchesAgency
    })
  }, [reportManagedCases, activeFromDate, activeToDate, searchValue, statusFilter, agencyFilter])

  const referralsTotalRecords = filteredCases.length
  const referralsTotalPages = Math.max(1, Math.ceil(referralsTotalRecords / referralsRowsPerPage))
  const safeReferralsPage = Math.min(referralsCurrentPage, referralsTotalPages)
  const referralsStartIndex = referralsTotalRecords === 0 ? 0 : (safeReferralsPage - 1) * referralsRowsPerPage + 1
  const referralsEndIndex =
    referralsTotalRecords === 0 ? 0 : Math.min(safeReferralsPage * referralsRowsPerPage, referralsTotalRecords)
  const paginatedReferrals = useMemo(() => {
    const start = (safeReferralsPage - 1) * referralsRowsPerPage
    return filteredCases.slice(start, start + referralsRowsPerPage)
  }, [filteredCases, safeReferralsPage, referralsRowsPerPage])

  const casesTotalRecords = filteredManagedCases.length
  const casesTotalPages = Math.max(1, Math.ceil(casesTotalRecords / casesRowsPerPage))
  const safeCasesPage = Math.min(casesCurrentPage, casesTotalPages)
  const casesStartIndex = casesTotalRecords === 0 ? 0 : (safeCasesPage - 1) * casesRowsPerPage + 1
  const casesEndIndex = casesTotalRecords === 0 ? 0 : Math.min(safeCasesPage * casesRowsPerPage, casesTotalRecords)
  const paginatedManagedCases = useMemo(() => {
    const start = (safeCasesPage - 1) * casesRowsPerPage
    return filteredManagedCases.slice(start, start + casesRowsPerPage)
  }, [filteredManagedCases, safeCasesPage, casesRowsPerPage])

  const managedClients = useMemo<ReportManagedClient[]>(() => {
    const grouped = new Map<string, ReportManagedClient>()

    filteredManagedCases.forEach((row) => {
      const existing = grouped.get(row.clientName)
      const isClosed = row.status === 'COMPLETED' || row.status === 'REJECTED'

      if (!existing) {
        grouped.set(row.clientName, {
          id: row.clientName,
          clientName: row.clientName,
          clientType: row.clientType,
          provinceName: row.provinceName,
          totalCases: 1,
          openCases: isClosed ? 0 : 1,
          closedCases: isClosed ? 1 : 0,
          primaryAgency: row.agencyName,
          latestActivity: row.updatedOn,
        })
        return
      }

      const existingLatest = toCalendarDate(existing.latestActivity)
      const rowLatest = toCalendarDate(row.updatedOn)

      existing.totalCases += 1
      existing.openCases += isClosed ? 0 : 1
      existing.closedCases += isClosed ? 1 : 0
      if (rowLatest > existingLatest) {
        existing.latestActivity = row.updatedOn
        existing.primaryAgency = row.agencyName
      }
    })

    return Array.from(grouped.values()).sort((a, b) => b.totalCases - a.totalCases)
  }, [filteredManagedCases])

  const clientsTotalRecords = managedClients.length
  const clientsTotalPages = Math.max(1, Math.ceil(clientsTotalRecords / clientsRowsPerPage))
  const safeClientsPage = Math.min(clientsCurrentPage, clientsTotalPages)
  const clientsStartIndex = clientsTotalRecords === 0 ? 0 : (safeClientsPage - 1) * clientsRowsPerPage + 1
  const clientsEndIndex = clientsTotalRecords === 0 ? 0 : Math.min(safeClientsPage * clientsRowsPerPage, clientsTotalRecords)
  const paginatedManagedClients = useMemo(() => {
    const start = (safeClientsPage - 1) * clientsRowsPerPage
    return managedClients.slice(start, start + clientsRowsPerPage)
  }, [managedClients, safeClientsPage, clientsRowsPerPage])

  const kpiData = useMemo(() => {
    const total = dateRangeCases.length
    const completed = dateRangeCases.filter((row) => row.status === 'COMPLETED').length
    const pending = dateRangeCases.filter((row) => row.status === 'PENDING').length
    const averageReferralCompletionRate = total > 0 ? (completed / total) * 100 : 0

    const closedCases = getManagedCases().filter((item) => {
      const isClosed = item.status === 'COMPLETED' || item.status === 'REJECTED'
      if (!isClosed) {
        return false
      }

      const closedDate = toCalendarDate(item.updatedAt.slice(0, 10))
      return closedDate >= activeFromDate && closedDate <= activeToDate
    })

    const averageCaseClosureDays =
      closedCases.length > 0
        ? closedCases.reduce((sum, item) => {
            const start = toCalendarDate(item.createdAt.slice(0, 10)).getTime()
            const end = toCalendarDate(item.updatedAt.slice(0, 10)).getTime()
            return sum + Math.max(1, (end - start) / DAY_MS)
          }, 0) / closedCases.length
        : 0

    const completedDurations = dateRangeCases
      .filter((row) => row.status === 'COMPLETED' && row.completedOn)
      .map((row) => {
        const start = toCalendarDate(row.createdOn).getTime()
        const end = toCalendarDate(row.completedOn as string).getTime()
        return (end - start) / DAY_MS
      })

    const averageReferralCompletionDays =
      completedDurations.length > 0
        ? completedDurations.reduce((sum, value) => sum + value, 0) / completedDurations.length
        : 0

    return {
      total,
      completed,
      pending,
      averageDays: averageCaseClosureDays,
      averageReferralCompletionRate,
      averageReferralCompletionDays,
    }
  }, [dateRangeCases, activeFromDate, activeToDate])

  const statusBreakdown = useMemo(() => {
    const total = dateRangeCases.length || 1
    const completed = dateRangeCases.filter((row) => row.status === 'COMPLETED').length
    const processing = dateRangeCases.filter((row) => row.status === 'PROCESSING').length
    const pending = dateRangeCases.filter((row) => row.status === 'PENDING').length
    const rejected = dateRangeCases.filter((row) => row.status === 'REJECTED').length

    return [
      { label: 'Completed', count: completed, hex: '#10b981', color: 'bg-emerald-500' },
      { label: 'Processing', count: processing, hex: '#3b82f6', color: 'bg-blue-500' },
      { label: 'Pending', count: pending, hex: '#f59e0b', color: 'bg-amber-500' },
      { label: 'Rejected', count: rejected, hex: '#f43f5e', color: 'bg-rose-500' },
    ].filter(item => item.count > 0).map(s => ({ ...s, percent: Math.round((s.count / total) * 100) }))
  }, [dateRangeCases])

  const casesStatusStats = useMemo(() => {
    const cases = getManagedReferrals()
    const total = cases.length || 1
    const open = cases.filter(row => row.status === 'PENDING' || row.status === 'PROCESSING').length
    const closed = cases.filter(row => row.status === 'COMPLETED' || row.status === 'REJECTED').length

    return [
      { label: 'Open', count: open, hex: '#1e3a8a', color: 'bg-blue-900' },
      { label: 'Closed', count: closed, hex: '#cbd5e1', color: 'bg-slate-300' },
    ].filter(item => item.count > 0).map(s => ({ ...s, percent: Math.round((s.count / total) * 100) }))
  }, [])

  const casesByProvinceStats = useMemo(() => {
    const casesInRange = reportManagedCases.filter((item) => {
      const created = toCalendarDate(item.createdOn)
      return created >= activeFromDate && created <= activeToDate
    })

    const provinceCounts: Record<string, number> = {};
    const total = casesInRange.length || 1;

    casesInRange.forEach((item) => {
      const province = item.provinceName || 'Unknown';
      provinceCounts[province] = (provinceCounts[province] || 0) + 1;
    });

    const colors = ['#0f766e', '#ea580c', '#1e3a8a', '#6d28d9', '#be123c', '#4338ca'];
    const bgColors = ['bg-teal-700', 'bg-orange-600', 'bg-blue-900', 'bg-violet-700', 'bg-rose-700', 'bg-indigo-700'];

    return Object.entries(provinceCounts)
      .map(([province, count], index) => {
        const colorIndex = index % colors.length;
        return {
          label: province,
          count,
          hex: colors[colorIndex],
          color: bgColors[colorIndex],
          percent: Math.round((count / total) * 100),
        };
      })
      .sort((a, b) => b.count - a.count);
  }, [reportManagedCases, activeFromDate, activeToDate])

  const clientInsights = useMemo(() => {
    const casesInRange = reportManagedCases.filter((item) => {
      const created = toCalendarDate(item.createdOn)
      return created >= activeFromDate && created <= activeToDate
    })

    const occupationBuckets = new Map<string, number>()
    const countryBuckets = new Map<string, number>()

    casesInRange.forEach((item) => {
      const persona = getClientPersona(item.caseNo)
      const previousOccupation = item.lastJob || persona.lastJob
      const lastCountry = item.lastCountry || persona.lastCountry

      occupationBuckets.set(previousOccupation, (occupationBuckets.get(previousOccupation) ?? 0) + 1)
      countryBuckets.set(lastCountry, (countryBuckets.get(lastCountry) ?? 0) + 1)
    })

    const topOccupation =
      Array.from(occupationBuckets.entries()).sort((a, b) => b[1] - a[1])[0] ?? ['No data in range', 0]
    const topCountry =
      Array.from(countryBuckets.entries()).sort((a, b) => b[1] - a[1])[0] ?? ['No data in range', 0]

    const toPieStats = (buckets: Map<string, number>, palette: { hex: string; color: string }[]) => {
      const entries = Array.from(buckets.entries()).sort((a, b) => b[1] - a[1])
      const total = entries.reduce((sum, [, count]) => sum + count, 0) || 1
      const topEntries = entries.slice(0, 5)

      return topEntries.map(([label, count], index) => ({
        label,
        count,
        hex: palette[index % palette.length].hex,
        color: palette[index % palette.length].color,
        percent: Math.round((count / total) * 100),
      }))
    }

    const occupationPalette = [
      { hex: '#0f766e', color: 'bg-teal-700' },
      { hex: '#0ea5e9', color: 'bg-sky-500' },
      { hex: '#f59e0b', color: 'bg-amber-500' },
      { hex: '#7c3aed', color: 'bg-violet-600' },
      { hex: '#e11d48', color: 'bg-rose-600' },
    ]
    const countryPalette = [
      { hex: '#1e3a8a', color: 'bg-blue-900' },
      { hex: '#ea580c', color: 'bg-orange-600' },
      { hex: '#059669', color: 'bg-emerald-600' },
      { hex: '#9333ea', color: 'bg-purple-600' },
      { hex: '#0d9488', color: 'bg-teal-600' },
    ]

    return {
      topOccupation: { label: topOccupation[0], count: topOccupation[1] },
      topCountry: { label: topCountry[0], count: topCountry[1] },
      occupationStats: toPieStats(occupationBuckets, occupationPalette),
      countryStats: toPieStats(countryBuckets, countryPalette),
    }
  }, [reportManagedCases, activeFromDate, activeToDate])

  const agencyStats = useMemo(() => {
    if (dateRangeCases.length === 0) return [];
    const buckets = dateRangeCases.reduce<Record<string, number>>((acc, row) => {
      acc[row.agencyName] = (acc[row.agencyName] ?? 0) + 1
      return acc
    }, {})

    const sorted = Object.entries(buckets).sort((a, b) => b[1] - a[1])
    const total = dateRangeCases.length || 1;
    const colors = ['#1e3a8a', '#0f766e', '#ea580c', '#6d28d9', '#be123c', '#4338ca'];
    const bgColors = ['bg-blue-900', 'bg-teal-700', 'bg-orange-600', 'bg-violet-700', 'bg-rose-700', 'bg-indigo-700'];
    
    return sorted.map((item, i) => {
      const colorIndex = i % colors.length;
      return {
        label: item[0],
        count: item[1],
        hex: colors[colorIndex],
        color: bgColors[colorIndex],
        percent: Math.round((item[1] / total) * 100)
      };
    });
  }, [dateRangeCases]);

  const serviceStats = useMemo(() => {
    if (dateRangeCases.length === 0) {
      return []
    }

    const buckets = dateRangeCases.reduce<Record<string, number>>((acc, row) => {
      const label = `${row.service} (${row.agencyName})`
      acc[label] = (acc[label] ?? 0) + 1
      return acc
    }, {})

    const sorted = Object.entries(buckets).sort((a, b) => b[1] - a[1])
    const total = dateRangeCases.length || 1
    const colors = ['#0369a1', '#0f766e', '#ea580c', '#7c3aed', '#be123c', '#4338ca']
    const bgColors = ['bg-sky-700', 'bg-teal-700', 'bg-orange-600', 'bg-violet-700', 'bg-rose-700', 'bg-indigo-700']

    return sorted.slice(0, 6).map((item, i) => {
      const colorIndex = i % colors.length
      return {
        label: item[0],
        count: item[1],
        hex: colors[colorIndex],
        color: bgColors[colorIndex],
        percent: Math.round((item[1] / total) * 100),
      }
    })
  }, [dateRangeCases])

  const mostRequestedService = useMemo(() => {
    if (serviceStats.length === 0) {
      return { label: 'No data in range', count: 0, share: 0 }
    }

    const top = serviceStats[0]
    return {
      label: top.label,
      count: top.count,
      share: Math.round((top.count / (dateRangeCases.length || 1)) * 100),
    }
  }, [serviceStats, dateRangeCases.length])

  const trendData = useMemo(() => buildTrendData(activeFromDate, activeToDate, dateRangeCases), [activeFromDate, activeToDate, dateRangeCases])
  const linePath = useMemo(() => buildLinePath(trendData.series, 530, 220), [trendData.series])

  const caseTrendRows = useMemo<ReportCase[]>(() => {
    return getManagedCases().map((item) => ({
      id: item.id,
      caseNo: item.caseNo,
      clientName: item.clientName,
      agencyName: item.agencyName,
      service: item.service,
      latestUpdate: item.milestone,
      createdOn: item.createdAt.slice(0, 10),
      completedOn: item.status === 'COMPLETED' || item.status === 'REJECTED' ? item.updatedAt.slice(0, 10) : undefined,
      status: item.status,
    }))
  }, [])

  const casesTrendData = useMemo(
    () => buildTrendData(activeFromDate, activeToDate, caseTrendRows),
    [activeFromDate, activeToDate, caseTrendRows],
  )
  const casesLinePath = useMemo(() => buildLinePath(casesTrendData.series, 530, 220), [casesTrendData.series])

  const trendLabelStep = useMemo(() => {
    if (trendData.labels.length <= 8) {
      return 1
    }

    return Math.ceil(trendData.labels.length / 6)
  }, [trendData.labels.length])

  const casesTrendLabelStep = useMemo(() => {
    if (casesTrendData.labels.length <= 8) {
      return 1
    }

    return Math.ceil(casesTrendData.labels.length / 6)
  }, [casesTrendData.labels.length])

  const trendTitle =
    trendData.granularity === 'day'
      ? 'Daily Trend'
      : trendData.granularity === 'week'
        ? 'Weekly Trend'
        : trendData.granularity === 'month'
          ? 'Monthly Trend'
          : 'Yearly Trend'

  const casesTrendTitle =
    casesTrendData.granularity === 'day'
      ? 'Daily Trend'
      : casesTrendData.granularity === 'week'
        ? 'Weekly Trend'
        : casesTrendData.granularity === 'month'
          ? 'Monthly Trend'
          : 'Yearly Trend'

  const mostActiveAgency = useMemo(() => {
    if (dateRangeCases.length === 0) {
      return { name: 'No data in range', count: 0, share: 0 }
    }

    const buckets = dateRangeCases.reduce<Record<string, number>>((acc, row) => {
      acc[row.agencyName] = (acc[row.agencyName] ?? 0) + 1
      return acc
    }, {})

    const sorted = Object.entries(buckets).sort((a, b) => b[1] - a[1])
    const [name, count] = sorted[0]
    const share = Math.round((count / dateRangeCases.length) * 100)

    return { name, count, share }
  }, [dateRangeCases])

  const agencies = useMemo(() => {
    return Array.from(new Set(reportCases.map((row) => row.agencyName))).sort((a, b) => a.localeCompare(b))
  }, [])

  const activeFilters: FilterChip[] = useMemo(() => {
    const filters: FilterChip[] = []

    if (statusFilter !== 'ALL') {
      filters.push({ key: 'status', label: 'Status', value: statusFilter })
    }

    if (agencyFilter !== 'ALL') {
      filters.push({ key: 'agency', label: 'Agency', value: agencyFilter })
    }

    return filters
  }, [statusFilter, agencyFilter])

  const resetDateRange = () => {
    setFromDateISO(defaultFromISO)
    setToDateISO(defaultToISO)
    setQuickRange('CUSTOM')
    setStatusFilter('ALL')
    setAgencyFilter('ALL')
    setSearchValue('')
  }

  const handleQuickRangeSelect = (option: QuickRangeOption) => {
    setQuickRange(option)

    if (option === 'CUSTOM') {
      return
    }

    const nextRange = getQuickRangeDates(option)
    setFromDateISO(nextRange.fromISO)
    setToDateISO(nextRange.toISO)
  }

  const columns: Column<ReportCase>[] = [
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
      key: 'agencyName',
      title: 'AGENCY',
      render: (row) => <span className="text-[12px] text-slate-700">{row.agencyName}</span>,
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

  const caseColumns: Column<ReportManagedCase>[] = [
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
      key: 'clientType',
      title: 'CLIENT TYPE',
      render: (row) => <span className="text-[12px] text-slate-700">{row.clientType}</span>,
    },
    {
      key: 'agencyName',
      title: 'PRIMARY AGENCY',
      render: (row) => <span className="text-[12px] text-slate-700">{row.agencyName}</span>,
    },
    {
      key: 'milestone',
      title: 'LATEST MILESTONE',
      render: (row) => <span className="text-[12px] text-slate-600">{row.milestone}</span>,
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
      key: 'updatedOn',
      title: 'LAST UPDATED',
      render: (row) => <span className="text-[12px] text-slate-600">{formatDisplayDate(row.updatedOn)}</span>,
    },
  ]

  const clientColumns: Column<ReportManagedClient>[] = [
    {
      key: 'clientName',
      title: 'CLIENT NAME',
      render: (row) => <span className="text-[12px] font-semibold text-slate-700">{row.clientName}</span>,
    },
    {
      key: 'provinceName',
      title: 'PROVINCE',
      render: (row) => <span className="text-[12px] text-slate-700">{row.provinceName || 'Unknown'}</span>,
    },
    {
      key: 'totalCases',
      title: 'TOTAL CASES',
      render: (row) => <span className="text-[12px] font-bold text-[#0b5a8c]">{row.totalCases}</span>,
    },
    {
      key: 'openCases',
      title: 'OPEN CASES',
      render: (row) => <span className="text-[12px] text-slate-700">{row.openCases}</span>,
    },
    {
      key: 'closedCases',
      title: 'CLOSED CASES',
      render: (row) => <span className="text-[12px] text-slate-700">{row.closedCases}</span>,
    },
    {
      key: 'primaryAgency',
      title: 'LATEST AGENCY',
      render: (row) => <span className="text-[12px] text-slate-700">{row.primaryAgency}</span>,
    },
    {
      key: 'latestActivity',
      title: 'LATEST ACTIVITY',
      render: (row) => <span className="text-[12px] text-slate-600">{formatDisplayDate(row.latestActivity)}</span>,
    },
  ]

  return (
    <div className="mx-auto max-w-7xl space-y-5 pb-4">
      <header className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h1 className={pageHeadingStyles.pageTitle}>Reports</h1>
          <p className={pageHeadingStyles.pageSubtitle}>Case manager oversight of referral outcomes and agency workload.</p>
        </div>

        <div className="flex w-full max-w-[620px] flex-wrap items-center gap-2 rounded-[2px] border border-[#cfd6de] bg-[#f7f9fc] p-2.5">
          <div className="inline-flex h-9 items-center gap-2 border border-[#cbd5e1] bg-white px-3 text-[10px] font-bold uppercase tracking-[0.08em] text-slate-600">
            <CalendarRange className="h-4 w-4" />
            Date Range
          </div>
          <div className="flex flex-wrap items-center gap-1.5">
            {[
              { label: '7 Days', value: '7_DAYS' },
              { label: '14 Days', value: '14_DAYS' },
              { label: '30 Days', value: '30_DAYS' },
              { label: '6 Months', value: '6_MONTHS' },
              { label: '1 Year', value: '1_YEAR' },
              { label: 'Custom', value: 'CUSTOM' },
            ].map((option) => {
              const isActive = quickRange === option.value

              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => handleQuickRangeSelect(option.value as QuickRangeOption)}
                  className={`h-8 border px-2.5 text-[10px] font-extrabold uppercase tracking-[0.08em] ${
                    isActive
                      ? 'border-[#0b5a8c] bg-[#0b5a8c] text-white'
                      : 'border-[#cbd5e1] bg-white text-slate-600 hover:border-[#94a3b8]'
                  }`}
                >
                  {option.label}
                </button>
              )
            })}
          </div>
          {quickRange === 'CUSTOM' ? (
            <>
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
            </>
          ) : (
            <span className="text-[11px] font-bold text-slate-600">
              {formatDisplayDate(fromDateISO)} - {formatDisplayDate(toDateISO)}
            </span>
          )}
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
          label="Avg Days to Case Closure"
          value={kpiData.averageDays.toFixed(1)}
          accent="border-l-[#0b5a8c]"
          description="Average days from case creation to case closure"
        />
        <MetricCard
          label="Avg Referral Completion Days"
          value={`${kpiData.averageReferralCompletionDays.toFixed(1)} Days`}
          accent="border-l-[#0b7a75]"
          trailing={<div className="h-[4px] w-8 rounded-full bg-[#0b7a75]" />}
        />
      </section>

      <h2 className={`mb-3 mt-8 ${pageHeadingStyles.sectionTitle}`}>Cases Breakdown</h2>
      <section className="grid grid-cols-1 gap-4 md:grid-cols-2 mb-6">
        <article className="border border-[#cbd5e1] bg-white p-4">
          <h3 className="mb-4 text-[14px] font-bold text-blue-900">Cases By Status</h3>
          <div className="flex items-center justify-center">
            <PieChart data={casesStatusStats} className="w-32 h-32" />
          </div>
          <div className="mt-4 space-y-2">
            {casesStatusStats.map((item) => (
              <div key={item.label} className="flex items-center justify-between text-[12px]">
                <span className="inline-flex items-center gap-2 text-slate-600">
                  <span className={`h-2.5 w-2.5 rounded-full shrink-0 ${item.color}`} />
                  {item.label}
                </span>
                <span className="font-bold text-slate-700">{item.percent}%</span>
              </div>
            ))}
          </div>
        </article>

        <article className="border border-[#cbd5e1] bg-white p-4">
          <h3 className="mb-4 text-[14px] font-bold text-blue-900">Cases By Province</h3>
          <div className="flex items-center justify-center">
            <PieChart data={casesByProvinceStats} className="w-32 h-32" />
          </div>
          <div className="mt-4 space-y-2">
            {casesByProvinceStats.map((item) => (
              <div key={item.label} className="flex items-center justify-between text-[12px]">
                <span className="inline-flex items-center gap-2 text-slate-600">
                  <span className={`h-2.5 w-2.5 rounded-full shrink-0 ${item.color}`} />
                  {item.label}
                </span>
                <span className="font-bold text-slate-700">{item.percent}%</span>
              </div>
            ))}
          </div>
        </article>
      </section>

      <section className="grid grid-cols-1 gap-4 mb-6">
        <article className="border border-[#cbd5e1] bg-white p-4">
          <div className="mb-3 flex items-center justify-between">
            <h3 className={pageHeadingStyles.sectionTitle}>Cases Over Time</h3>
            <span className="text-[10px] font-extrabold uppercase tracking-[0.12em] text-[#0b5a8c]">{casesTrendTitle}</span>
          </div>
          <svg width="100%" viewBox="0 0 530 220" preserveAspectRatio="none" className="h-[220px]">
            {[0, 1, 2, 3, 4].map((idx) => (
              <line
                key={`cases-grid-${idx}`}
                x1="20"
                x2="510"
                y1={30 + idx * 40}
                y2={30 + idx * 40}
                stroke="#e2e8f0"
                strokeWidth="1"
              />
            ))}
            <path d={casesLinePath} fill="none" stroke="#0b5a8c" strokeWidth="3" strokeLinecap="round" />
            {casesTrendData.series.map((value, idx) => {
              const min = Math.min(...casesTrendData.series)
              const max = Math.max(...casesTrendData.series)
              const range = Math.max(1, max - min)
              const x = getLinePointX(idx, casesTrendData.series.length)
              const y = 20 + (1 - (value - min) / range) * (220 - 40)

              return <circle key={`cases-pt-${idx}`} cx={x} cy={y} r="2.6" fill="#0b5a8c" />
            })}
            <g fill="#94a3b8" fontSize="8" fontWeight="700" letterSpacing="0.05em">
              {casesTrendData.labels.map((label, index) => {
                const shouldRender = index % casesTrendLabelStep === 0 || index === casesTrendData.labels.length - 1
                if (!shouldRender) {
                  return null
                }

                return (
                  <text key={`cases-${label}-${index}`} x={getLinePointX(index, casesTrendData.labels.length) - 12} y="214">
                    {label}
                  </text>
                )
              })}
            </g>
          </svg>
        </article>
      </section>

      <h2 className={`mb-3 mt-8 ${pageHeadingStyles.sectionTitle}`}>Client Insights</h2>
      <section className="grid grid-cols-1 gap-4 md:grid-cols-2 mb-6">
        <article className="border border-[#cbd5e1] bg-white p-4">
          <h3 className="mb-4 text-[14px] font-bold text-blue-900">Previous Occupations</h3>
          <div className="flex items-center justify-center">
            <PieChart data={clientInsights.occupationStats} className="w-32 h-32" />
          </div>
          <div className="mt-4 space-y-2">
            {clientInsights.occupationStats.map((item) => (
              <div key={item.label} className="flex items-center justify-between text-[12px]">
                <span className="inline-flex items-center gap-2 text-slate-600">
                  <span className={`h-2.5 w-2.5 rounded-full shrink-0 ${item.color}`} />
                  {item.label}
                </span>
                <span className="font-bold text-slate-700">{item.percent}%</span>
              </div>
            ))}
            {clientInsights.occupationStats.length === 0 ? (
              <p className="text-[11px] font-semibold text-slate-500">No occupation data in selected date range.</p>
            ) : null}
          </div>
        </article>

        <article className="border border-[#cbd5e1] bg-white p-4">
          <h3 className="mb-4 text-[14px] font-bold text-blue-900">Last Employment Countries</h3>
          <div className="flex items-center justify-center">
            <PieChart data={clientInsights.countryStats} className="w-32 h-32" />
          </div>
          <div className="mt-4 space-y-2">
            {clientInsights.countryStats.map((item) => (
              <div key={item.label} className="flex items-center justify-between text-[12px]">
                <span className="inline-flex items-center gap-2 text-slate-600">
                  <span className={`h-2.5 w-2.5 rounded-full shrink-0 ${item.color}`} />
                  {item.label}
                </span>
                <span className="font-bold text-slate-700">{item.percent}%</span>
              </div>
            ))}
            {clientInsights.countryStats.length === 0 ? (
              <p className="text-[11px] font-semibold text-slate-500">No country data in selected date range.</p>
            ) : null}
          </div>
        </article>
      </section>

      <section className="grid grid-cols-1 gap-4 md:grid-cols-2 mb-6">
        <article className="rounded-[2px] border border-[#cbd5e1] bg-[#f8fafc] p-4">
          <p className="text-[10px] font-extrabold uppercase tracking-[0.1em] text-slate-500">Top Previous Occupation</p>
          <p className="mt-1 text-[18px] font-black text-slate-800 leading-tight">{clientInsights.topOccupation.label}</p>
          <p className="mt-1 text-[12px] font-semibold text-slate-500">{clientInsights.topOccupation.count} case(s) in range</p>
        </article>

        <article className="rounded-[2px] border border-[#cbd5e1] bg-[#f8fafc] p-4">
          <p className="text-[10px] font-extrabold uppercase tracking-[0.1em] text-slate-500">Top Last Employment Country</p>
          <p className="mt-1 text-[18px] font-black text-slate-800 leading-tight">{clientInsights.topCountry.label}</p>
          <p className="mt-1 text-[12px] font-semibold text-slate-500">{clientInsights.topCountry.count} case(s) in range</p>
        </article>
      </section>

      <h2 className={`mb-3 mt-8 ${pageHeadingStyles.sectionTitle}`}>Referrals Breakdown</h2>
      <section className="grid grid-cols-1 gap-4 md:grid-cols-3 mb-6">
        <article className="border border-[#cbd5e1] bg-white p-4">
          <h3 className="mb-4 text-[14px] font-bold text-blue-900">Referrals By Status</h3>
          <div className="flex items-center justify-center">
            <PieChart data={statusBreakdown} className="w-32 h-32" />
          </div>
          <div className="mt-4 space-y-2">
            {statusBreakdown.map((item) => (
              <div key={item.label} className="flex items-center justify-between text-[12px]">
                <span className="inline-flex items-center gap-2 text-slate-600">
                  <span className={`h-2.5 w-2.5 rounded-full shrink-0 ${item.color}`} />
                  {item.label}
                </span>
                <span className="font-bold text-slate-700">{item.percent}%</span>
              </div>
            ))}
          </div>
        </article>

        <article className="border border-[#cbd5e1] bg-white p-4 flex flex-col">
          <h3 className="mb-4 text-[14px] font-bold text-blue-900">Referrals By Agency</h3>
          <div className="flex items-center justify-center">
            <PieChart data={agencyStats} className="w-32 h-32" />
          </div>
          <div className="mt-4 space-y-2 overflow-y-auto max-h-[120px] pr-2">
            {agencyStats.map((item) => (
              <div key={item.label} className="flex items-center justify-between text-[12px]">
                <span className="inline-flex items-center gap-2 text-slate-600">
                  <span className={`h-2.5 w-2.5 rounded-full shrink-0 ${item.color}`} />
                  <span className="truncate max-w-[150px]" title={item.label}>{item.label}</span>
                </span>
                <span className="font-bold text-slate-700">{item.percent}%</span>
              </div>
            ))}
          </div>
        </article>

        <article className="border border-[#cbd5e1] bg-white p-4 flex flex-col">
          <h3 className="mb-4 text-[14px] font-bold text-blue-900">Referrals By Service</h3>
          <div className="flex items-center justify-center">
            <PieChart data={serviceStats} className="w-32 h-32" />
          </div>
          <div className="mt-4 space-y-2 overflow-y-auto max-h-[120px] pr-2">
            {serviceStats.map((item) => (
              <div key={item.label} className="flex items-center justify-between text-[12px]">
                <span className="inline-flex items-center gap-2 text-slate-600">
                  <span className={`h-2.5 w-2.5 rounded-full shrink-0 ${item.color}`} />
                  <span className="truncate max-w-[170px]" title={item.label}>{item.label}</span>
                </span>
                <span className="font-bold text-slate-700">{item.percent}%</span>
              </div>
            ))}
          </div>
        </article>
      </section>

      <section className="grid grid-cols-1 gap-4 mb-6">
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

      <section className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <article className="flex items-center gap-4 bg-[#0b3f69] px-6 py-5 text-white shadow-sm">
          <div className="flex h-12 w-12 items-center justify-center rounded-[2px] bg-white/10">
            <Building2 className="h-6 w-6" />
          </div>
          <div>
            <p className="text-[10px] font-extrabold uppercase tracking-[0.14em] text-[#8cc7e7]">Most Active Agency</p>
            <p className="text-3xl font-black leading-tight">{mostActiveAgency.name}</p>
            <p className="text-[13px] text-[#bee1f3]">
              {mostActiveAgency.count} referrals • {mostActiveAgency.share}% of selected range
            </p>
          </div>
        </article>

        <article className="flex items-center gap-4 bg-[#9de8db] px-6 py-5 text-[#045f68] shadow-sm">
          <div className="flex h-12 w-12 items-center justify-center rounded-[2px] bg-white/40">
            <Hourglass className="h-6 w-6" />
          </div>
          <div>
            <p className="text-[10px] font-extrabold uppercase tracking-[0.14em] text-[#0f7f7c]">Average Referral Completion</p>
            <p className="text-3xl font-black leading-tight">{kpiData.averageReferralCompletionDays.toFixed(1)} Days</p>
            <p className="text-[13px] text-[#0f7f7c]">Calculated from referral creation to referral completion in selected range</p>
          </div>
          <TrendingUp className="ml-auto h-5 w-5 opacity-70" />
        </article>

        <article className="flex items-center gap-4 bg-[#eff6ff] px-6 py-5 text-[#1e3a8a] shadow-sm">
          <div className="flex h-12 w-12 items-center justify-center rounded-[2px] bg-white/70">
            <TrendingUp className="h-6 w-6" />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] font-extrabold uppercase tracking-[0.14em] text-[#1d4ed8]">Most Requested Service</p>
            <p className="truncate text-[24px] font-black leading-tight" title={mostRequestedService.label}>{mostRequestedService.label}</p>
            <p className="text-[13px] text-[#1d4ed8]">
              {mostRequestedService.count} referrals • {mostRequestedService.share}% of selected range
            </p>
          </div>
        </article>
      </section>

      <section className="border border-[#cbd5e1] bg-white">
        <div className="flex items-center justify-between border-b border-[#cbd5e1] px-4 py-3">
          <h3 className={pageHeadingStyles.sectionTitle}>Managed Cases</h3>
          <button className="inline-flex items-center gap-1.5 text-[10px] font-extrabold uppercase tracking-[0.11em] text-slate-500 hover:text-slate-700">
            <Download className="h-3.5 w-3.5" />
            Export CSV
          </button>
        </div>

        <UnifiedTable
          variant="embedded"
          data={paginatedManagedCases}
          columns={caseColumns}
          keyExtractor={(row) => row.id}
          totalRecords={casesTotalRecords}
          startIndex={casesStartIndex}
          endIndex={casesEndIndex}
          currentPage={safeCasesPage}
          totalPages={casesTotalPages}
          rowsPerPage={casesRowsPerPage}
          rowsPerPageOptions={[5, 10, 25, 50]}
          onPageChange={(page) => setCasesCurrentPage(Math.min(Math.max(page, 1), casesTotalPages))}
          onRowsPerPageChange={(rows) => {
            setCasesRowsPerPage(rows)
            setCasesCurrentPage(1)
          }}
        />
      </section>

      <section className="border border-[#cbd5e1] bg-white">
        <div className="flex items-center justify-between border-b border-[#cbd5e1] px-4 py-3">
          <h3 className={pageHeadingStyles.sectionTitle}>Managed Referrals</h3>
          <button className="inline-flex items-center gap-1.5 text-[10px] font-extrabold uppercase tracking-[0.11em] text-slate-500 hover:text-slate-700">
            <Download className="h-3.5 w-3.5" />
            Export CSV
          </button>
        </div>

        <UnifiedTable
          variant="embedded"
          data={paginatedReferrals}
          columns={columns}
          keyExtractor={(row) => row.id}
          searchPlaceholder="Search case no, client, agency, service..."
          searchValue={searchValue}
          onSearchChange={setSearchValue}
          onAdvancedFilters={() => setIsFilterOpen((prev) => !prev)}
          isAdvancedFiltersOpen={isFilterOpen}
          advancedFiltersContent={
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-[12px] font-bold uppercase tracking-[0.08em] text-slate-700">Report Filters</h4>
                <button
                  onClick={() => setIsFilterOpen(false)}
                  className="text-[11px] font-bold uppercase tracking-[0.06em] text-slate-500"
                >
                  Close
                </button>
              </div>
              <div className="space-y-2">
                <label className="text-[11px] font-bold uppercase tracking-[0.08em] text-slate-600">Status</label>
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
              <div className="space-y-2">
                <label className="text-[11px] font-bold uppercase tracking-[0.08em] text-slate-600">Agency</label>
                <select
                  value={agencyFilter}
                  onChange={(event) => setAgencyFilter(event.target.value)}
                  className="h-10 w-full border border-[#cbd5e1] px-3 text-[13px] font-semibold text-slate-700 outline-none"
                >
                  <option value="ALL">All agencies</option>
                  {agencies.map((agency) => (
                    <option key={agency} value={agency}>
                      {agency}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          }
          activeFilters={activeFilters}
          onRemoveFilter={(filter) => {
            if (filter.key === 'status') {
              setStatusFilter('ALL')
              return
            }

            if (filter.key === 'agency') {
              setAgencyFilter('ALL')
            }
          }}
          onClearFilters={() => {
            setStatusFilter('ALL')
            setAgencyFilter('ALL')
          }}
          totalRecords={referralsTotalRecords}
          startIndex={referralsStartIndex}
          endIndex={referralsEndIndex}
          currentPage={safeReferralsPage}
          totalPages={referralsTotalPages}
          rowsPerPage={referralsRowsPerPage}
          rowsPerPageOptions={[5, 10, 25, 50]}
          onPageChange={(page) => setReferralsCurrentPage(Math.min(Math.max(page, 1), referralsTotalPages))}
          onRowsPerPageChange={(rows) => {
            setReferralsRowsPerPage(rows)
            setReferralsCurrentPage(1)
          }}
        />
      </section>

      <section className="border border-[#cbd5e1] bg-white">
        <div className="flex items-center justify-between border-b border-[#cbd5e1] px-4 py-3">
          <h3 className={pageHeadingStyles.sectionTitle}>Managed Clients</h3>
          <button className="inline-flex items-center gap-1.5 text-[10px] font-extrabold uppercase tracking-[0.11em] text-slate-500 hover:text-slate-700">
            <Download className="h-3.5 w-3.5" />
            Export CSV
          </button>
        </div>

        <UnifiedTable
          variant="embedded"
          data={paginatedManagedClients}
          columns={clientColumns}
          keyExtractor={(row) => row.id}
          totalRecords={clientsTotalRecords}
          startIndex={clientsStartIndex}
          endIndex={clientsEndIndex}
          currentPage={safeClientsPage}
          totalPages={clientsTotalPages}
          rowsPerPage={clientsRowsPerPage}
          rowsPerPageOptions={[5, 10, 25, 50]}
          onPageChange={(page) => setClientsCurrentPage(Math.min(Math.max(page, 1), clientsTotalPages))}
          onRowsPerPageChange={(rows) => {
            setClientsRowsPerPage(rows)
            setClientsCurrentPage(1)
          }}
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