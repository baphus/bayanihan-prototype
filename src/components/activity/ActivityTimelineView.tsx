import { useMemo, useState } from "react"
import { Download } from "lucide-react"
import { exportToCsv } from "../../utils/export/exportCsv"
import { exportToPdf } from "../../utils/export/exportPdf"
import { UnifiedTable, type Column } from "../ui/UnifiedTable"

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
showStatusFilter?: boolean
showActorFilter?: boolean
showEntityFilter?: boolean
}

export const ActivityTimelineView = ({
logs,
pageTitle,
pageSubtitle,
sectionTitle,
searchPlaceholder = "Search logs by actor, activity, or target...",
exportFileName = "activity-logs",
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

const columns = useMemo<Column<ActivityLog>[]>(() => [
{
  key: 'timestamp',
  title: 'Timestamp',
  sortable: true,
  sortAccessor: (row) => new Date(row.timestamp).getTime(),
  render: (row) => (
    <span className="text-slate-600 font-medium">
      {new Date(row.timestamp).toLocaleString("en-US", {
        month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit"
      })}
    </span>
  ),
},
{
  key: 'activityType',
  title: 'Activity',
  sortable: true,
  render: (row) => (
    <span className="font-bold text-[#0b5384]">{row.activityType.replace(/_/g, " ")}</span>
  )
},
{
  key: 'outcome',
  title: 'Outcome',
  sortable: true,
  render: (row) => (
    <span className={`inline-flex items-center gap-1.5 rounded-[2px] px-2 py-0.5 text-[11px] font-extrabold uppercase tracking-wider border ${
      row.outcome === "FAILED" ? "border-rose-200 bg-rose-50 text-rose-700" : 
      row.outcome === "WARNING" ? "border-amber-200 bg-amber-50 text-amber-700" : 
      row.outcome === "SUCCESS" ? "border-emerald-200 bg-emerald-50 text-emerald-700" : 
      "border-sky-200 bg-sky-50 text-sky-700"
    }`}>
      <div className={`h-1.5 w-1.5 rounded-full ${
        row.outcome === "FAILED" ? "bg-rose-500 animate-pulse" : 
        row.outcome === "WARNING" ? "bg-amber-500" : 
        row.outcome === "SUCCESS" ? "bg-emerald-500" : "bg-sky-500"
      }`} />
      {row.outcome}
    </span>
  )
},
{
  key: 'actor',
  title: 'Actor',
  sortable: true,
  render: (row) => (
    <div className="flex flex-col">
      <span className="font-bold text-slate-800">{row.actor}</span>
      <span className="text-[11px] uppercase tracking-widest text-slate-500 font-semibold">{row.actorRole}</span>
    </div>
  )
},
{
  key: 'target',
  title: 'Target',
  sortable: true,
  sortAccessor: (row) => toTarget(row),
  render: (row) => (
    <span className="text-slate-700 font-medium">{toTarget(row)}</span>
  )
},
{
  key: 'details',
  title: 'Details',
  sortable: false,
  render: (row) => (
    <span className="text-slate-600 text-[13px]">{row.details}</span>
  )
}
], [])

const advancedFiltersContent = (
<div className="flex flex-col gap-4 min-w-[240px]">
  <div className="space-y-1.5">
    <label className="block text-[11px] font-extrabold uppercase tracking-widest text-[#94a3b8]">Activity Type</label>
    <select
      value={activityFilter}
      onChange={(e) => {
        setActivityFilter(e.target.value)
        setCurrentPage(1)
      }}
      className="w-full h-[36px] rounded-[2px] border border-[#cbd5e1] bg-white px-3 text-[13px] font-bold text-slate-700 outline-none focus:border-[#0b5384]"
    >
      <option value="ALL">All Activities</option>
      {activityOptions.map((opt) => (
        <option key={opt.value} value={opt.value}>{opt.label}</option>
      ))}
    </select>
  </div>

  {showStatusFilter && (
    <div className="space-y-1.5">
      <label className="block text-[11px] font-extrabold uppercase tracking-widest text-[#94a3b8]">Outcome</label>
      <select
        value={statusFilter}
        onChange={(e) => {
          setStatusFilter(e.target.value as "ALL" | LogOutcome)
          setCurrentPage(1)
        }}
        className="w-full h-[36px] rounded-[2px] border border-[#cbd5e1] bg-white px-3 text-[13px] font-bold text-slate-700 outline-none focus:border-[#0b5384]"
      >
        <option value="ALL">All Outcomes</option>
        <option value="SUCCESS">Success</option>
        <option value="INFO">Info</option>
        <option value="WARNING">Warning</option>
        <option value="FAILED">Failed</option>
      </select>
    </div>
  )}

  {showActorFilter && (
    <div className="space-y-1.5">
      <label className="block text-[11px] font-extrabold uppercase tracking-widest text-[#94a3b8]">Actor</label>
      <select
        value={actorFilter}
        onChange={(e) => {
          setActorFilter(e.target.value)
          setCurrentPage(1)
        }}
        className="w-full h-[36px] rounded-[2px] border border-[#cbd5e1] bg-white px-3 text-[13px] font-bold text-slate-700 outline-none focus:border-[#0b5384]"
      >
        <option value="ALL">All Actors</option>
        {actorOptions.map((opt) => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>
    </div>
  )}

  {showEntityFilter && (
    <div className="space-y-1.5">
      <label className="block text-[11px] font-extrabold uppercase tracking-widest text-[#94a3b8]">Entity</label>
      <select
        value={entityFilter}
        onChange={(e) => {
          setEntityFilter(e.target.value)
          setCurrentPage(1)
        }}
        className="w-full h-[36px] rounded-[2px] border border-[#cbd5e1] bg-white px-3 text-[13px] font-bold text-slate-700 outline-none focus:border-[#0b5384]"
      >
        <option value="ALL">All Entities</option>
        {entityOptions.map((opt) => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>
    </div>
  )}
</div>
)

return (
<div className="mx-auto max-w-7xl space-y-6 pb-12">
  <header className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 border-b border-[#e2e8f0] pb-6">
    <div>
      <h1 className="text-3xl font-extrabold tracking-tight text-[#0b5384]">{pageTitle}</h1>
      <p className="mt-1 text-[15px] font-medium text-slate-600">{pageSubtitle}</p>
    </div>
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={() => exportToCsv(filteredLogs, exportColumns, exportFileName)}
        className="inline-flex h-[40px] items-center gap-2 rounded-[2px] border border-[#cbd5e1] bg-white px-4 text-[13px] font-bold text-slate-600 transition-colors hover:bg-slate-50 hover:text-[#0b5384]"
      >
        <Download className="h-4 w-4" />
        CSV
      </button>
      <button
        type="button"
        onClick={() => exportToPdf(filteredLogs, exportColumns, `${exportFileName}.pdf`, { title: sectionTitle })}
        className="inline-flex h-[40px] items-center gap-2 rounded-[2px] border border-[#cbd5e1] bg-white px-4 text-[13px] font-bold text-slate-600 transition-colors hover:bg-slate-50 hover:text-[#0b5384]"
      >
        <Download className="h-4 w-4" />
        PDF
      </button>
    </div>
  </header>

  <UnifiedTable
    title={sectionTitle}
    data={pagedLogs}
    columns={columns}
    keyExtractor={(row) => row.id}
    searchPlaceholder={searchPlaceholder}
    searchValue={searchValue}
    onSearchChange={(v) => { setSearchValue(v); setCurrentPage(1); }}
    isAdvancedFiltersOpen={isFilterOpen}
    onAdvancedFilters={() => setIsFilterOpen(!isFilterOpen)}
    advancedFiltersContent={advancedFiltersContent}
    activeFilters={activeFilters}
    onRemoveFilter={(f) => {
      if (f.key === "activity") setActivityFilter("ALL");
      if (f.key === "status") setStatusFilter("ALL");
      if (f.key === "actor") setActorFilter("ALL");
      if (f.key === "entity") setEntityFilter("ALL");
      setCurrentPage(1);
    }}
    onClearFilters={() => {
      setActivityFilter("ALL");
      setStatusFilter("ALL");
      setActorFilter("ALL");
      setEntityFilter("ALL");
      setCurrentPage(1);
    }}
    currentPage={currentPage}
    totalPages={totalPages}
    totalRecords={totalRecords}
    startIndex={startIndex}
    endIndex={endIndex}
    rowsPerPage={rowsPerPage}
    onPageChange={setCurrentPage}
    onRowsPerPageChange={(v) => { setRowsPerPage(v); setCurrentPage(1); }}
  />
</div>
)
}