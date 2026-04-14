import { useMemo, useState } from 'react'
import { Download } from 'lucide-react'
import { pageHeadingStyles } from '../../pages/agency/pageHeadingStyles'
import { exportToCsv, type ExportColumn } from '../../utils/export/exportCsv'
import { exportToPdf } from '../../utils/export/exportPdf'
import type { OversightActivityLog } from '../../data/unifiedData'

type TimelineOption = {
	value: string
	label: string
}

type LogOutcome = 'SUCCESS' | 'WARNING' | 'FAILED' | 'INFO'

type ActivityTimelineViewProps = {
	pageTitle: string
	pageSubtitle: string
	sectionTitle: string
	exportFileName: string
	searchPlaceholder: string
	logs: OversightActivityLog[]
	activityOptions: TimelineOption[]
	actorOptions?: TimelineOption[]
	entityOptions?: TimelineOption[]
	showStatusFilter?: boolean
	showActorFilter?: boolean
	showEntityFilter?: boolean
	density?: 'compact' | 'comfortable'
}

type TimelineLogItem = OversightActivityLog & {
	outcome: LogOutcome
	eventLabel: string
	target: string
	dayLabel: string
}

function toPdfFileName(fileName: string): string {
	return fileName.toLowerCase().endsWith('.csv') ? fileName.slice(0, -4) + '.pdf' : `${fileName}.pdf`
}

function toOutcome(log: OversightActivityLog): LogOutcome {
	if (log.activityType === 'LOGIN_ATTEMPT' && log.status === 'REJECTED') {
		return 'FAILED'
	}

	if (log.activityType === 'REJECTED' || log.status === 'REJECTED') {
		return 'FAILED'
	}

	if (log.activityType === 'STATUS_CHANGED') {
		return 'WARNING'
	}

	if (log.activityType === 'USER_LOGIN' || log.activityType === 'EMAIL_SENT') {
		return 'SUCCESS'
	}

	if (log.activityType === 'ACCEPTED' || log.activityType === 'COMPLETED' || log.activityType === 'RECORD_CREATED') {
		return 'SUCCESS'
	}

	return 'INFO'
}

function toTarget(log: OversightActivityLog): string {
	if (log.caseNo) {
		return `Case ${log.caseNo}`
	}

	if (log.recordId) {
		return log.recordId
	}

	if (log.clientName) {
		return log.clientName
	}

	return 'System'
}

function getOutcomeClasses(outcome: LogOutcome): string {
	if (outcome === 'SUCCESS') {
		return 'border-[#bbf7d0] bg-[#f0fdf4] text-[#166534]'
	}

	if (outcome === 'WARNING') {
		return 'border-[#fde68a] bg-[#fffbeb] text-[#92400e]'
	}

	if (outcome === 'FAILED') {
		return 'border-[#fecaca] bg-[#fff1f2] text-[#b91c1c]'
	}

	return 'border-[#cbd5e1] bg-[#f8fafc] text-slate-700'
}

function toDayLabel(iso: string): string {
	return new Intl.DateTimeFormat('en-US', {
		month: 'long',
		day: '2-digit',
		year: 'numeric',
	}).format(new Date(iso))
}

export function ActivityTimelineView({
	pageTitle,
	pageSubtitle,
	sectionTitle,
	exportFileName,
	searchPlaceholder,
	logs,
	activityOptions,
	actorOptions = [],
	entityOptions = [],
	showStatusFilter = false,
	showActorFilter = false,
	showEntityFilter = false,
	density = 'comfortable',
}: ActivityTimelineViewProps) {
	const [searchValue, setSearchValue] = useState('')
	const [activityFilter, setActivityFilter] = useState('ALL')
	const [actorFilter, setActorFilter] = useState('ALL')
	const [statusFilter, setStatusFilter] = useState<'ALL' | LogOutcome>('ALL')
	const [entityFilter, setEntityFilter] = useState('ALL')
	const [isFilterOpen, setIsFilterOpen] = useState(false)
	const [currentPage, setCurrentPage] = useState(1)
	const [rowsPerPage, setRowsPerPage] = useState(10)
	const isCompact = density === 'compact'

	const sortedLogs = useMemo(() => {
		return [...logs].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
	}, [logs])

	const filteredLogs = useMemo(() => {
		const query = searchValue.trim().toLowerCase()

		return sortedLogs.filter((log) => {
			const outcome = toOutcome(log)
			const target = toTarget(log)

			const matchesSearch =
				query.length === 0 ||
				[
					log.caseNo,
					log.recordId,
					log.clientName,
					log.actor,
					log.actorRole,
					log.activityType,
					log.status,
					log.details,
					log.entity,
					log.ipAddress,
					log.emailRecipient,
					target,
					outcome,
				]
					.filter(Boolean)
					.join(' ')
					.toLowerCase()
					.includes(query)

			const matchesActivity = activityFilter === 'ALL' || log.activityType === activityFilter
			const matchesActor = !showActorFilter || actorFilter === 'ALL' || log.actor === actorFilter
			const matchesStatus = !showStatusFilter || statusFilter === 'ALL' || outcome === statusFilter
			const matchesEntity = !showEntityFilter || entityFilter === 'ALL' || log.entity === entityFilter

			return matchesSearch && matchesActivity && matchesActor && matchesStatus && matchesEntity
		})
	}, [sortedLogs, searchValue, activityFilter, actorFilter, statusFilter, entityFilter, showActorFilter, showStatusFilter, showEntityFilter])

	const totalRecords = filteredLogs.length
	const totalPages = Math.max(1, Math.ceil(totalRecords / rowsPerPage))
	const safePage = Math.min(currentPage, totalPages)
	const startIndex = totalRecords === 0 ? 0 : (safePage - 1) * rowsPerPage + 1
	const endIndex = totalRecords === 0 ? 0 : Math.min(safePage * rowsPerPage, totalRecords)

	const timelineRows = useMemo<TimelineLogItem[]>(() => {
		const start = (safePage - 1) * rowsPerPage
		const pageRows = filteredLogs.slice(start, start + rowsPerPage)

		return pageRows.map((log) => ({
			...log,
			outcome: toOutcome(log),
			eventLabel: log.activityType.replaceAll('_', ' '),
			target: toTarget(log),
			dayLabel: toDayLabel(log.timestamp),
		}))
	}, [filteredLogs, safePage, rowsPerPage])

	const activeFilters = useMemo(() => {
		const chips: Array<{ key: string; label: string; value: string }> = []

		if (activityFilter !== 'ALL') {
			chips.push({ key: 'activity', label: 'Activity', value: activityFilter.replaceAll('_', ' ') })
		}

		if (showStatusFilter && statusFilter !== 'ALL') {
			chips.push({ key: 'status', label: 'Outcome', value: statusFilter })
		}

		if (showActorFilter && actorFilter !== 'ALL') {
			chips.push({ key: 'actor', label: 'Actor', value: actorFilter })
		}

		if (showEntityFilter && entityFilter !== 'ALL') {
			chips.push({ key: 'entity', label: 'Entity', value: entityFilter })
		}

		return chips
	}, [activityFilter, actorFilter, statusFilter, entityFilter, showActorFilter, showStatusFilter, showEntityFilter])

	const exportColumns: ExportColumn<OversightActivityLog>[] = [
		{ header: 'Timestamp', accessor: (row) => row.timestamp },
		{ header: 'Event ID', accessor: (row) => row.id },
		{ header: 'Activity', accessor: (row) => row.activityType },
		{ header: 'Outcome', accessor: (row) => toOutcome(row) },
		{ header: 'Actor', accessor: (row) => row.actor },
		{ header: 'Role', accessor: (row) => row.actorRole },
		{ header: 'Target', accessor: (row) => toTarget(row) },
		{ header: 'Entity', accessor: (row) => row.entity ?? '' },
		{ header: 'Case No', accessor: (row) => row.caseNo ?? '' },
		{ header: 'Record ID', accessor: (row) => row.recordId ?? '' },
		{ header: 'IP Address', accessor: (row) => row.ipAddress ?? '' },
		{ header: 'Email Recipient', accessor: (row) => row.emailRecipient ?? '' },
		{ header: 'Details', accessor: (row) => row.details },
	]

	return (
		<div className="mx-auto max-w-7xl space-y-5 pb-6">
			<header>
				<h1 className={pageHeadingStyles.pageTitle}>{pageTitle}</h1>
				<p className={pageHeadingStyles.pageSubtitle}>{pageSubtitle}</p>
			</header>

			<section className={`rounded-[4px] border border-[#cbd5e1] bg-white shadow-sm ${isCompact ? 'p-3 space-y-3' : 'p-4 space-y-4'}`}>
				<div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
					<div className="relative w-full max-w-lg">
						<span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-[20px]">
							search
						</span>
						<input
							type="text"
							placeholder={searchPlaceholder}
							value={searchValue}
							onChange={(event) => {
								setSearchValue(event.target.value)
								setCurrentPage(1)
							}}
							className="h-10 w-full rounded-[3px] border border-[#cbd5e1] bg-white pl-10 pr-3 text-[13px] text-slate-700 outline-none"
						/>
					</div>

					<div className="flex flex-wrap items-center gap-2">
						<button
							type="button"
							onClick={() => setIsFilterOpen((prev) => !prev)}
							className="inline-flex h-9 items-center gap-1 rounded-[3px] border border-[#cbd5e1] bg-white px-3 text-[11px] font-bold uppercase tracking-[0.08em] text-slate-700"
						>
							<span className="material-symbols-outlined text-[16px]">tune</span>
							Filters
						</button>
						<button
							type="button"
							onClick={() => exportToCsv(filteredLogs, exportColumns, exportFileName)}
							className="inline-flex h-9 items-center gap-1 rounded-[3px] border border-[#cbd5e1] bg-white px-3 text-[11px] font-bold uppercase tracking-[0.08em] text-[#0b5a8c]"
						>
							<Download className="h-3.5 w-3.5" />
							CSV
						</button>
						<button
							type="button"
							onClick={() => exportToPdf(filteredLogs, exportColumns, toPdfFileName(exportFileName), { title: sectionTitle })}
							className="inline-flex h-9 items-center gap-1 rounded-[3px] border border-[#cbd5e1] bg-white px-3 text-[11px] font-bold uppercase tracking-[0.08em] text-[#0b5a8c]"
						>
							<Download className="h-3.5 w-3.5" />
							PDF
						</button>
					</div>
				</div>

				{isFilterOpen ? (
					<div className="rounded-[3px] border border-[#cbd5e1] bg-slate-50 p-4">
						<div className="grid grid-cols-1 gap-3 md:grid-cols-3">
							<div>
								<label className="mb-1.5 block text-[12px] font-bold uppercase tracking-wider text-[#64748b]">Activity Type</label>
								<select
									value={activityFilter}
									onChange={(event) => {
										setActivityFilter(event.target.value)
										setCurrentPage(1)
									}}
									className="w-full rounded-[3px] border border-[#cbd5e1] bg-white px-3 py-2 text-[13px] font-bold text-slate-700 outline-none"
								>
									<option value="ALL">All</option>
									{activityOptions.map((option) => (
										<option key={option.value} value={option.value}>{option.label}</option>
									))}
								</select>
							</div>

							{showStatusFilter ? (
								<div>
									<label className="mb-1.5 block text-[12px] font-bold uppercase tracking-wider text-[#64748b]">Outcome</label>
									<select
										value={statusFilter}
										onChange={(event) => {
											setStatusFilter(event.target.value as 'ALL' | LogOutcome)
											setCurrentPage(1)
										}}
										className="w-full rounded-[3px] border border-[#cbd5e1] bg-white px-3 py-2 text-[13px] font-bold text-slate-700 outline-none"
									>
										<option value="ALL">All</option>
										<option value="SUCCESS">Success</option>
										<option value="INFO">Info</option>
										<option value="WARNING">Warning</option>
										<option value="FAILED">Failed</option>
									</select>
								</div>
							) : null}

							{showActorFilter ? (
								<div>
									<label className="mb-1.5 block text-[12px] font-bold uppercase tracking-wider text-[#64748b]">Actor</label>
									<select
										value={actorFilter}
										onChange={(event) => {
											setActorFilter(event.target.value)
											setCurrentPage(1)
										}}
										className="w-full rounded-[3px] border border-[#cbd5e1] bg-white px-3 py-2 text-[13px] font-bold text-slate-700 outline-none"
									>
										<option value="ALL">All</option>
										{actorOptions.map((option) => (
											<option key={option.value} value={option.value}>{option.label}</option>
										))}
									</select>
								</div>
							) : null}

							{showEntityFilter ? (
								<div>
									<label className="mb-1.5 block text-[12px] font-bold uppercase tracking-wider text-[#64748b]">Entity</label>
									<select
										value={entityFilter}
										onChange={(event) => {
											setEntityFilter(event.target.value)
											setCurrentPage(1)
										}}
										className="w-full rounded-[3px] border border-[#cbd5e1] bg-white px-3 py-2 text-[13px] font-bold text-slate-700 outline-none"
									>
										<option value="ALL">All</option>
										{entityOptions.map((option) => (
											<option key={option.value} value={option.value}>{option.label}</option>
										))}
									</select>
								</div>
							) : null}
						</div>

						{activeFilters.length > 0 ? (
							<div className="mt-3 flex flex-wrap items-center gap-2">
								{activeFilters.map((filter) => (
									<button
										type="button"
										key={filter.key}
										onClick={() => {
											if (filter.key === 'activity') {
												setActivityFilter('ALL')
											}
											if (filter.key === 'status') {
												setStatusFilter('ALL')
											}
											if (filter.key === 'actor') {
												setActorFilter('ALL')
											}
											if (filter.key === 'entity') {
												setEntityFilter('ALL')
											}
										}}
										className="rounded-[2px] border border-[#d2e5f3] bg-[#f0f7fc] px-2 py-1 text-[11px] font-bold text-[#0b5384]"
									>
										{filter.label}: {filter.value}
									</button>
								))}
							</div>
						) : null}
					</div>
				) : null}

				<div>
					<h2 className={pageHeadingStyles.sectionTitle}>{sectionTitle}</h2>
					<div className={`${isCompact ? 'mt-3 space-y-3' : 'mt-4 space-y-4'}`}>
						{timelineRows.map((row, index) => {
							const showDayHeader = index === 0 || timelineRows[index - 1].dayLabel !== row.dayLabel

							return (
								<div key={row.id}>
									{showDayHeader ? (
										<div className="mb-2 inline-flex rounded-[3px] border border-[#cbd5e1] bg-[#f8fafc] px-2 py-1 text-[11px] font-bold uppercase tracking-[0.08em] text-slate-600">
											{row.dayLabel}
										</div>
									) : null}

									<div className={`relative flex ${isCompact ? 'gap-2' : 'gap-3'}`}>
										<div className={`relative flex ${isCompact ? 'w-5' : 'w-6'} shrink-0 justify-center`}>
											{index !== timelineRows.length - 1 ? <span className={`absolute w-[2px] bg-[#cbd5e1] ${isCompact ? 'top-3 bottom-[-14px]' : 'top-3 bottom-[-18px]'}`} /> : null}
											<span className={`relative mt-1 inline-flex rounded-full border-2 border-white bg-[#0b5384] shadow ${isCompact ? 'h-2.5 w-2.5' : 'h-3 w-3'}`} />
										</div>

										<div className={`min-w-0 flex-1 rounded-[4px] border border-[#cbd5e1] bg-white shadow-sm ${isCompact ? 'px-3 py-2.5' : 'px-4 py-3'}`}>
											<div className="flex flex-wrap items-start justify-between gap-2">
												<div>
													<p className={`${isCompact ? 'text-[11px]' : 'text-[12px]'} font-extrabold uppercase tracking-[0.08em] text-[#0b5384]`}>{row.eventLabel}</p>
													<p className={`mt-0.5 ${isCompact ? 'text-[11px]' : 'text-[12px]'} text-slate-700`}>{row.actor} • {row.actorRole}</p>
												</div>
												<div className="flex flex-wrap items-center gap-1.5">
													<span className={`${isCompact ? 'text-[10px]' : 'text-[11px]'} text-slate-500`}>{new Date(row.timestamp).toLocaleTimeString('en-US')}</span>
													<span className={`inline-flex rounded-[3px] border px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-[0.08em] ${getOutcomeClasses(row.outcome)}`}>
														{row.outcome}
													</span>
												</div>
											</div>

											<p className={`mt-2 ${isCompact ? 'text-[12px]' : 'text-[13px]'} text-slate-700`}>{row.details}</p>

											<div className={`mt-2 grid grid-cols-1 gap-1 ${isCompact ? 'text-[10px]' : 'text-[11px]'} text-slate-500 md:grid-cols-2`}>
												<span>Target: <strong className="text-slate-700">{row.target}</strong></span>
												{row.entity ? <span>Entity: <strong className="text-slate-700 uppercase">{row.entity}</strong></span> : null}
												{row.ipAddress ? <span>IP: <strong className="text-slate-700">{row.ipAddress}</strong></span> : null}
												{row.emailRecipient ? <span>Email: <strong className="text-slate-700">{row.emailRecipient}</strong></span> : null}
												<span>ID: <strong className="text-slate-700">{row.id}</strong></span>
											</div>
										</div>
									</div>
								</div>
							)
						})}

						{timelineRows.length === 0 ? (
							<div className="rounded-[4px] border border-[#e2e8f0] bg-[#f8fafc] p-6 text-center text-[13px] font-semibold text-slate-500">
								No activity logs found for current filters.
							</div>
						) : null}
					</div>
				</div>

				<div className="flex flex-col gap-3 border-t border-[#e2e8f0] pt-3 md:flex-row md:items-center md:justify-between">
					<p className="text-[12px] text-slate-600">
						Showing <span className="font-bold text-slate-800">{startIndex}-{endIndex}</span> of <span className="font-bold text-slate-800">{totalRecords}</span> logs
					</p>
					<div className="flex flex-wrap items-center gap-2">
						<label className="text-[11px] font-bold uppercase tracking-[0.08em] text-slate-500">Rows</label>
						<select
							value={rowsPerPage}
							onChange={(event) => {
								setRowsPerPage(Number(event.target.value))
								setCurrentPage(1)
							}}
							className="h-8 rounded-[3px] border border-[#cbd5e1] bg-white px-2 text-[12px] font-bold text-slate-700"
						>
							<option value={10}>10</option>
							<option value={25}>25</option>
							<option value={50}>50</option>
						</select>
						<button
							type="button"
							onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
							className="h-8 rounded-[3px] border border-[#cbd5e1] bg-white px-2 text-[12px] font-bold text-slate-700"
						>
							Prev
						</button>
						<span className="text-[12px] font-bold text-slate-700">{safePage} / {totalPages}</span>
						<button
							type="button"
							onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
							className="h-8 rounded-[3px] border border-[#cbd5e1] bg-white px-2 text-[12px] font-bold text-slate-700"
						>
							Next
						</button>
					</div>
				</div>
			</section>
		</div>
	)
}

export default ActivityTimelineView
