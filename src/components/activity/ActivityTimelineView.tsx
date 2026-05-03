import { useMemo, useState } from "react"
import { Download, Search, Filter, History, ChevronLeft, ChevronRight, Hash, Globe, Mail, Target, Database } from "lucide-react"
import { exportToCsv } from "../../utils/export/exportCsv"
import { exportToPdf } from "../../utils/export/exportPdf"

export type LogOutcome = "SUCCESS" | "INFO" | "WARNING" | "FAILED"

export interface ActivityLog {
id: string
timestamp: string
actor: string
actorRole: string
activityType: string
details: string
outcome: LogOutcome
target: string
entity?: string
ipAddress?: string
emailRecipient?: string
caseNo?: string
recordId?: string
}

interface ActivityTimelineViewProps {
logs: ActivityLog[]
pageTitle: string
pageSubtitle: string
sectionTitle: string
searchPlaceholder?: string
exportFileName?: string
isCompact?: boolean
showStatusFilter?: boolean
showActorFilter?: boolean
showEntityFilter?: boolean
}

const getOutcomeClasses = (outcome: LogOutcome) => {
switch (outcome) {
case "SUCCESS":
return "border-emerald-100 bg-emerald-50 text-emerald-700"
case "FAILED":
return "border-rose-100 bg-rose-50 text-rose-700"
case "WARNING":
return "border-amber-100 bg-amber-50 text-amber-700"
case "INFO":
default:
return "border-sky-100 bg-sky-50 text-sky-700"
}
}

export const ActivityTimelineView = ({
logs,
pageTitle,
pageSubtitle,
sectionTitle,
searchPlaceholder = "Search logs by actor, activity, or target...",
exportFileName = "activity-logs",
isCompact = false,
showStatusFilter = true,
showActorFilter = true,
showEntityFilter = true,
}: ActivityTimelineViewProps) => {
const [searchValue, setSearchValue] = useState("")
const [currentPage, setCurrentPage] = useState(1)
const [rowsPerPage, setRowsPerPage] = useState(25)
const [isFilterOpen, setIsFilterOpen] = useState(false)
const [activityFilter, setActivityFilter] = useState("ALL")
const [statusFilter, setStatusFilter] = useState<"ALL" | LogOutcome>("ALL")
const [actorFilter, setActorFilter] = useState("ALL")
const [entityFilter, setEntityFilter] = useState("ALL")

const filteredLogs = useMemo(() => {
return logs.filter((log) => {
const matchesSearch =
log.actor.toLowerCase().includes(searchValue.toLowerCase()) ||
log.activityType.toLowerCase().includes(searchValue.toLowerCase()) ||
log.details.toLowerCase().includes(searchValue.toLowerCase()) ||
log.target.toLowerCase().includes(searchValue.toLowerCase())

const matchesActivity = activityFilter === "ALL" || log.activityType === activityFilter
const matchesStatus = statusFilter === "ALL" || log.outcome === statusFilter
const matchesActor = actorFilter === "ALL" || log.actor === actorFilter
const matchesEntity = entityFilter === "ALL" || log.entity === entityFilter

return matchesSearch && matchesActivity && matchesStatus && matchesActor && matchesEntity
})
}, [logs, searchValue, activityFilter, statusFilter, actorFilter, entityFilter])

const activityOptions = useMemo(() => {
const types = new Set(logs.map((log) => log.activityType))
return Array.from(types).map((t) => ({ label: t, value: t }))
}, [logs])

const actorOptions = useMemo(() => {
const actors = new Set(logs.map((log) => log.actor))
return Array.from(actors).map((a) => ({ label: a, value: a }))
}, [logs])

const entityOptions = useMemo(() => {
const entities = new Set(logs.map((log) => log.entity).filter(Boolean))
return Array.from(entities).map((e) => ({ label: e as string, value: e as string }))
}, [logs])

const totalRecords = filteredLogs.length
const totalPages = Math.ceil(totalRecords / rowsPerPage)
const safePage = Math.max(1, Math.min(currentPage, totalPages || 1))
const startIndex = (safePage - 1) * rowsPerPage + 1
const endIndex = Math.min(safePage * rowsPerPage, totalRecords)

const pagedLogs = useMemo(() => {
return filteredLogs.slice((safePage - 1) * rowsPerPage, safePage * rowsPerPage)
}, [filteredLogs, safePage, rowsPerPage])

const timelineRows = useMemo(() => {
return pagedLogs.map((log) => {
const date = new Date(log.timestamp)
const today = new Date()
const yesterday = new Date()
yesterday.setDate(yesterday.getDate() - 1)

let dayLabel = date.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })
if (date.toDateString() === today.toDateString()) dayLabel = "Today"
else if (date.toDateString() === yesterday.toDateString()) dayLabel = "Yesterday"

return {
...log,
dayLabel,
eventLabel: log.activityType.replace(/_/g, " "),
}
})
}, [pagedLogs])

const activeFilters = [
{ key: "activity", label: "Activity", value: activityFilter },
{ key: "status", label: "Outcome", value: statusFilter },
{ key: "actor", label: "Actor", value: actorFilter },
{ key: "entity", label: "Entity", value: entityFilter },
].filter((f) => f.value !== "ALL")

const toTarget = (row: ActivityLog) => {
if (row.caseNo) return `Case #${row.caseNo}`
if (row.recordId) return `Rec ID: ${row.recordId}`
return row.target
}

const exportColumns = [
{ header: "Date", accessor: (row: ActivityLog) => new Date(row.timestamp).toLocaleString() },
{ header: "Activity", accessor: (row: ActivityLog) => row.activityType },
{ header: "Outcome", accessor: (row: ActivityLog) => row.outcome },
{ header: "Actor", accessor: (row: ActivityLog) => row.actor },
{ header: "Role", accessor: (row: ActivityLog) => row.actorRole },
{ header: "Target", accessor: (row: ActivityLog) => toTarget(row) },
{ header: "Entity", accessor: (row: ActivityLog) => row.entity ?? "" },
{ header: "Case No", accessor: (row: ActivityLog) => row.caseNo ?? "" },
{ header: "Record ID", accessor: (row: ActivityLog) => row.recordId ?? "" },
{ header: "IP Address", accessor: (row: ActivityLog) => row.ipAddress ?? "" },
{ header: "Email Recipient", accessor: (row: ActivityLog) => row.emailRecipient ?? "" },
{ header: "Details", accessor: (row: ActivityLog) => row.details },
]

return (
<div className="mx-auto max-w-7xl space-y-8 pb-12">
<header className="border-b border-primary/10 pb-6">
<h1 className="font-headline text-3xl font-extrabold tracking-tight text-primary sm:text-4xl">{pageTitle}</h1>
<p className="mt-2 text-lg text-slate-600 font-medium">{pageSubtitle}</p>
</header>

<section className="rounded-2xl border border-slate-200 bg-white shadow-lg shadow-primary/5 overflow-hidden">
<div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between p-6 border-b border-slate-100 bg-slate-50/50">
<div className="relative w-full max-w-lg group">
<Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 h-5 w-5 group-focus-within:text-primary transition-colors" />
<input
type="text"
placeholder={searchPlaceholder}
value={searchValue}
onChange={(event) => {
setSearchValue(event.target.value)
setCurrentPage(1)
}}
className="h-12 w-full rounded-xl border border-slate-200 bg-white pl-12 pr-4 text-[14px] text-slate-700 outline-none focus:border-primary focus:ring-4 focus:ring-primary/5 transition-all placeholder:text-slate-400 font-medium"
/>
</div>

<div className="flex flex-wrap items-center gap-3">
<button
type="button"
onClick={() => setIsFilterOpen((prev) => !prev)}
className={`inline-flex h-12 items-center gap-2 rounded-xl border px-5 text-[13px] font-bold transition-all active:scale-95 ${
isFilterOpen 
? "border-primary/20 bg-primary/5 text-primary" 
: "border-slate-200 bg-white text-slate-600 hover:bg-slate-50 hover:border-slate-300"
}`}
>
<Filter className="h-4 w-4" />
Filter Records
</button>
<div className="h-8 w-px bg-slate-200 mx-1 hidden sm:block" />
<button
type="button"
onClick={() => exportToCsv(filteredLogs, exportColumns, exportFileName)}
className="inline-flex h-12 items-center gap-2 rounded-xl border border-slate-200 bg-white px-5 text-[13px] font-bold text-slate-600 hover:text-primary hover:bg-slate-50 transition-all active:scale-95"
>
<Download className="h-4 w-4" />
CSV
</button>
<button
type="button"
onClick={() => exportToPdf(filteredLogs, exportColumns, `${exportFileName}.pdf`, { title: sectionTitle })}
className="inline-flex h-12 items-center gap-2 rounded-xl border border-slate-200 bg-white px-5 text-[13px] font-bold text-slate-600 hover:text-primary hover:bg-slate-50 transition-all active:scale-95"
>
<Download className="h-4 w-4" />
PDF Report
</button>
</div>
</div>

{isFilterOpen ? (
<div className="border-b border-slate-100 bg-slate-50/30 p-8 animate-in fade-in slide-in-from-top-4 duration-300">
<div className="grid grid-cols-1 gap-6 md:grid-cols-4">
<div className="space-y-2">
<label className="block text-[12px] font-bold uppercase tracking-widest text-slate-500 px-1">Activity Type</label>
<select
value={activityFilter}
onChange={(event) => {
setActivityFilter(event.target.value)
setCurrentPage(1)
}}
className="w-full h-11 rounded-xl border border-slate-200 bg-white px-4 text-[14px] font-bold text-slate-700 focus:border-primary outline-none shadow-sm transition-all"
>
<option value="ALL">All Activities</option>
{activityOptions.map((option) => (
<option key={option.value} value={option.value}>{option.label}</option>
))}
</select>
</div>

{showStatusFilter ? (
<div className="space-y-2">
<label className="block text-[12px] font-bold uppercase tracking-widest text-slate-500 px-1">Outcome</label>
<select
value={statusFilter}
onChange={(event) => {
setStatusFilter(event.target.value as "ALL" | LogOutcome)
setCurrentPage(1)
}}
className="w-full h-11 rounded-xl border border-slate-200 bg-white px-4 text-[14px] font-bold text-slate-700 focus:border-primary outline-none shadow-sm transition-all"
>
<option value="ALL">All Outcomes</option>
<option value="SUCCESS">Success</option>
<option value="INFO">Info</option>
<option value="WARNING">Warning</option>
<option value="FAILED">Failed</option>
</select>
</div>
) : null}

{showActorFilter ? (
<div className="space-y-2">
<label className="block text-[12px] font-bold uppercase tracking-widest text-slate-500 px-1">Actor</label>
<select
value={actorFilter}
onChange={(event) => {
setActorFilter(event.target.value)
setCurrentPage(1)
}}
className="w-full h-11 rounded-xl border border-slate-200 bg-white px-4 text-[14px] font-bold text-slate-700 focus:border-primary outline-none shadow-sm transition-all"
>
<option value="ALL">All Actors</option>
{actorOptions.map((option) => (
<option key={option.value} value={option.value}>{option.label}</option>
))}
</select>
</div>
) : null}

{showEntityFilter ? (
<div className="space-y-2">
<label className="block text-[12px] font-bold uppercase tracking-widest text-slate-500 px-1">Entity</label>
<select
value={entityFilter}
onChange={(event) => {
setEntityFilter(event.target.value)
setCurrentPage(1)
}}
className="w-full h-11 rounded-xl border border-slate-200 bg-white px-4 text-[14px] font-bold text-slate-700 focus:border-primary outline-none shadow-sm transition-all"
>
<option value="ALL">All Entities</option>
{entityOptions.map((option) => (
<option key={option.value} value={option.value}>{option.label}</option>
))}
</select>
</div>
) : null}
</div>

{activeFilters.length > 0 ? (
<div className="mt-6 flex flex-wrap items-center gap-3 pt-6 border-t border-slate-200/60">
<span className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] mr-1">Active Filters:</span>
{activeFilters.map((filter) => (
<button
type="button"
key={filter.key}
onClick={() => {
if (filter.key === "activity") setActivityFilter("ALL")
if (filter.key === "status") setStatusFilter("ALL")
if (filter.key === "actor") setActorFilter("ALL")
if (filter.key === "entity") setEntityFilter("ALL")
}}
className="group flex items-center gap-2 rounded-lg border border-primary/10 bg-primary/5 px-3 py-1.5 text-[12px] font-bold text-primary hover:bg-primary/10 transition-colors"
>
<span>{filter.label}: {filter.value}</span>
<span className="material-symbols-outlined text-[16px] opacity-60 group-hover:opacity-100">close</span>
</button>
))}
<button 
onClick={() => {
setActivityFilter("ALL")
setStatusFilter("ALL")
setActorFilter("ALL")
setEntityFilter("ALL")
}}
className="text-[12px] font-bold text-slate-500 hover:text-rose-600 transition-colors ml-2"
>
Reset All
</button>
</div>
) : null}
</div>
) : null}

<div className="p-8 md:p-10">
<div className="flex items-center gap-3 mb-10">
<div className="h-10 w-10 rounded-xl bg-primary text-white flex items-center justify-center shadow-lg shadow-primary/20">
<History className="h-5 w-5" />
</div>
<h2 className="font-headline text-2xl font-extrabold text-slate-900">{sectionTitle}</h2>
</div>

<div className={isCompact ? "space-y-6" : "space-y-10"}>
{timelineRows.map((row, index) => {
const showDayHeader = index === 0 || timelineRows[index - 1].dayLabel !== row.dayLabel

return (
<div key={row.id}>
{showDayHeader ? (
<div className="flex items-center gap-6 mb-10 mt-6 px-4">
<div className="rounded-2xl border border-slate-200 bg-white px-6 py-2.5 text-[12px] font-black uppercase tracking-[0.2em] text-primary shadow-sm">
{row.dayLabel}
</div>
<div className="h-px flex-1 bg-gradient-to-r from-slate-200 to-transparent" />
</div>
) : null}

<div className={`relative flex group transition-all duration-300 ${isCompact ? "gap-6" : "gap-8"}`}>
<div className={`relative flex ${isCompact ? "w-10" : "w-12"} shrink-0 justify-center`}>
{index !== timelineRows.length - 1 ? (
<span className="absolute w-0.5 bg-slate-100 left-1/2 -translate-x-1/2 top-12 -bottom-12 group-hover:bg-primary/20 transition-colors" />
) : null}
<div className={`relative z-10 mt-1 flex h-10 w-10 items-center justify-center rounded-xl border-4 border-white bg-slate-50 shadow-md transition-all group-hover:scale-110 group-hover:shadow-xl ${
row.outcome === "FAILED" ? "text-rose-600 group-hover:bg-rose-50" : 
row.outcome === "WARNING" ? "text-amber-600 group-hover:bg-amber-50" : 
row.outcome === "SUCCESS" ? "text-emerald-600 group-hover:bg-emerald-50" : "text-primary group-hover:bg-primary/5"
}`}>
<span className="material-symbols-outlined text-[20px]">
{row.activityType.includes("CASE") ? "folder_open" : 
 row.activityType.includes("USER") ? "person" : 
 row.activityType.includes("EMAIL") ? "mail" : 
 row.activityType.includes("LOGIN") ? "key" : "bolt"}
</span>
</div>
</div>

<div className={`min-w-0 flex-1 rounded-2xl border border-slate-200 bg-white shadow-sm transition-all group-hover:border-primary/20 group-hover:shadow-xl group-hover:shadow-primary/5 ${isCompact ? "px-6 py-5" : "px-8 py-6"}`}>
<div className="flex flex-wrap items-start justify-between gap-4">
<div className="min-w-0 flex-1">
<div className="flex items-center gap-3 mb-2">
<p className={`font-headline font-black uppercase tracking-wider text-slate-800 ${isCompact ? "text-[14px]" : "text-[16px]"}`}>{row.eventLabel}</p>
<span className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[11px] font-black uppercase tracking-[0.1em] shadow-sm transition-colors ${getOutcomeClasses(row.outcome)}`}>
<div className={`h-1.5 w-1.5 rounded-full ${
row.outcome === "FAILED" ? "bg-rose-500 animate-pulse" : 
row.outcome === "WARNING" ? "bg-amber-500" : 
row.outcome === "SUCCESS" ? "bg-emerald-500" : "bg-sky-500"
}`} />
{row.outcome}
</span>
</div>
<div className="flex items-center gap-3 text-slate-500">
<div className="h-6 w-6 rounded-lg bg-primary/10 text-primary border border-primary/10 flex items-center justify-center text-[11px] font-black">
{row.actor.charAt(0)}
</div>
<p className={`font-bold ${isCompact ? "text-[12px]" : "text-[13px]"}`}>
<span className="text-slate-900 group-hover:text-primary transition-colors">{row.actor}</span>
<span className="mx-2 opacity-30">•</span>
<span className="uppercase tracking-[0.1em] text-[11px] text-slate-400 font-black">{row.actorRole}</span>
</p>
</div>
</div>
<div className="shrink-0 text-right">
<div className="inline-flex items-center gap-2 rounded-lg bg-slate-50 px-3 py-1 border border-slate-100 font-bold tabular-nums text-slate-500 text-[12px]">
<History className="h-3 w-3 opacity-50" />
{new Date(row.timestamp).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
</div>
</div>
</div>

<div className={`mt-5 rounded-xl bg-slate-50/80 border border-slate-100 p-4 text-slate-700 leading-relaxed font-medium group-hover:bg-white transition-colors group-hover:border-primary/10 ${isCompact ? "text-[13px]" : "text-[14px]"}`}>
{row.details}
</div>

<div className={`mt-6 flex flex-wrap items-center gap-x-6 gap-y-3 border-t border-slate-50 pt-5 ${isCompact ? "text-[11px]" : "text-[12px]"}`}>
<div className="flex items-center gap-2.5 group/meta">
<Target className="h-4 w-4 text-slate-300 group-hover/meta:text-primary transition-colors" />
<span className="text-slate-400 font-bold uppercase tracking-wider text-[10px]">Target:</span>
<span className="text-slate-700 font-black">{toTarget(row)}</span>
</div>
{row.entity && (
<div className="flex items-center gap-2.5 group/meta">
<Database className="h-4 w-4 text-slate-300 group-hover/meta:text-primary transition-colors" />
<span className="text-slate-400 font-bold uppercase tracking-wider text-[10px]">Entity:</span>
<span className="text-slate-700 font-black uppercase">{row.entity}</span>
</div>
)}
{row.ipAddress && (
<div className="flex items-center gap-2.5 group/meta">
<Globe className="h-4 w-4 text-slate-300 group-hover/meta:text-primary transition-colors" />
<span className="text-slate-400 font-bold uppercase tracking-wider text-[10px]">IP ADDR:</span>
<span className="text-slate-700 font-black tabular-nums">{row.ipAddress}</span>
</div>
)}
{row.emailRecipient && (
<div className="flex items-center gap-2.5 group/meta">
<Mail className="h-4 w-4 text-slate-300 group-hover/meta:text-primary transition-colors" />
<span className="text-slate-400 font-bold uppercase tracking-wider text-[10px]">Email:</span>
<span className="text-slate-700 font-black">{row.emailRecipient}</span>
</div>
)}
<div className="flex items-center gap-2.5 group/meta ml-auto">
<Hash className="h-4 w-4 text-slate-300 group-hover/meta:text-primary transition-colors" />
<span className="text-slate-400 font-bold uppercase tracking-wider text-[10px]">Event UID:</span>
<span className="text-slate-700 font-black tabular-nums tracking-tighter">{row.id}</span>
</div>
</div>
</div>
</div>
</div>
)
})}

{timelineRows.length === 0 ? (
<div className="flex flex-col items-center justify-center py-24 bg-slate-50/30 rounded-3xl border-2 border-dashed border-slate-200">
<div className="h-20 w-20 rounded-2xl bg-white border border-slate-100 flex items-center justify-center mb-6 shadow-sm">
<History className="h-10 w-10 text-slate-300" />
</div>
<h3 className="font-headline text-xl font-extrabold text-slate-900">No matching logs</h3>
<p className="text-slate-500 mt-2 max-w-xs text-center font-medium">Try broadening your filters or refine your search query.</p>
</div>
) : null}
</div>
</div>

<div className="flex flex-col gap-6 border-t border-slate-100 bg-slate-50/50 px-8 py-6 md:flex-row md:items-center md:justify-between">
<div className="flex items-center gap-4">
<span className="text-[13px] text-slate-500 font-bold">
Showing <span className="text-slate-900 font-black">{startIndex} - {endIndex}</span> of <span className="text-slate-900 font-black">{totalRecords}</span> entries
</span>
<div className="h-5 w-px bg-slate-200" />
<select
value={rowsPerPage}
onChange={(event) => {
setRowsPerPage(Number(event.target.value))
setCurrentPage(1)
}}
className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-[12px] font-black text-slate-700 focus:border-primary outline-none shadow-sm transition-all"
>
<option value={10}>10 per page</option>
<option value={25}>25 per page</option>
<option value={50}>50 per page</option>
</select>
</div>

<div className="flex items-center gap-2">
<button
disabled={safePage === 1}
onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
className="group flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 transition-all hover:border-primary hover:text-primary disabled:opacity-30 disabled:hover:border-slate-200 disabled:hover:text-slate-600"
>
<ChevronLeft className="h-5 w-5" />
</button>
<div className="flex h-10 items-center justify-center rounded-xl border border-primary/10 bg-primary/5 px-5 text-[13px] font-black text-primary">
{safePage} <span className="mx-2 opacity-30 text-slate-400 font-medium">/</span> {totalPages || 1}
</div>
<button
disabled={safePage === totalPages}
onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
className="group flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 transition-all hover:border-primary hover:text-primary disabled:opacity-30 disabled:hover:border-slate-200 disabled:hover:text-slate-600"
>
<ChevronRight className="h-5 w-5" />
</button>
</div>
</div>
</section>
</div>
)
}