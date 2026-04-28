import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { UnifiedTable, type Column, type FilterChip } from '../../components/ui/UnifiedTable'
import CountryCodePhoneInput from '../../components/ui/CountryCodePhoneInput'
import { pageHeadingStyles } from '../agency/pageHeadingStyles'
import { AGENCIES_DATA } from '../../data/agenciesData'
import {
  formatDisplayDateTime,
  getGoogleMapsPlaceUrl,
  getSystemAdminRows,
  type SystemAdminEntity,
  type SystemAdminCrudRow,
  type SystemAdminRowStatus,
  type MockUserRole,
} from '../../data/unifiedData'

type SystemAdminCrudPageProps = {
  entity: SystemAdminEntity
  title: string
  subtitle: string
  recordLabel: string
  newRecordLabel: string
  searchPlaceholder: string
  allowCreate?: boolean
}

type AgencyAttributes = {
  description: string
  contactNumber: string
  email: string
  mapLink: string
  createdAt: string
  updatedAt: string
}

function isValidHttpUrl(value: string): boolean {
  try {
    const parsed = new URL(value)
    return parsed.protocol === 'http:' || parsed.protocol === 'https:'
  } catch {
    return false
  }
}

function isValidEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim())
}

function isValidTemporaryPassword(value: string): boolean {
  const trimmed = value.trim()
  return trimmed.length >= 8 && /[A-Z]/.test(trimmed) && /\d/.test(trimmed) && /[^A-Za-z0-9]/.test(trimmed)
}

export default function SystemAdminCrudPage({
  entity,
  title,
  subtitle,
  recordLabel,
  newRecordLabel,
  searchPlaceholder,
  allowCreate = true,
}: SystemAdminCrudPageProps) {
  const navigate = useNavigate()
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
  const [agencyAttributesById, setAgencyAttributesById] = useState<Record<string, AgencyAttributes>>({})
  const [editAgencyRow, setEditAgencyRow] = useState<SystemAdminCrudRow | null>(null)
  const [editAgencyName, setEditAgencyName] = useState('')
  const [editAgencyDescription, setEditAgencyDescription] = useState('')
  const [editAgencyContactNumber, setEditAgencyContactNumber] = useState('')
  const [editAgencyEmail, setEditAgencyEmail] = useState('')
  const [editAgencyMapLink, setEditAgencyMapLink] = useState('')
  const [isCreateAgencyModalOpen, setIsCreateAgencyModalOpen] = useState(false)
  const [createAgencyName, setCreateAgencyName] = useState('')
  const [createAgencyDescription, setCreateAgencyDescription] = useState('')
  const [createAgencyContactNumber, setCreateAgencyContactNumber] = useState('')
  const [createAgencyEmail, setCreateAgencyEmail] = useState('')
  const [createAgencyMapLink, setCreateAgencyMapLink] = useState('')
  const [createAgencyCreatedAt, setCreateAgencyCreatedAt] = useState('')
  const [createAgencyUpdatedAt, setCreateAgencyUpdatedAt] = useState('')
  const [isCreateUserWizardOpen, setIsCreateUserWizardOpen] = useState(false)
  const [createUserStep, setCreateUserStep] = useState<1 | 2 | 3>(1)
  const [selectedUserRole, setSelectedUserRole] = useState<MockUserRole | ''>('')
  const [selectedUserAgencyId, setSelectedUserAgencyId] = useState('')
  const [createUserFullName, setCreateUserFullName] = useState('')
  const [createUserEmail, setCreateUserEmail] = useState('')
  const [createUserContact, setCreateUserContact] = useState('')
  const [createUserTempPassword, setCreateUserTempPassword] = useState('')

  useEffect(() => {
    const nextRows = getSystemAdminRows(entity)
    setRows(nextRows)

    if (entity === 'agencies') {
      const rowByAgencyId = nextRows.reduce<Record<string, SystemAdminCrudRow>>((acc, row) => {
        if (row.id.startsWith('admin-agency-')) {
          acc[row.id.replace('admin-agency-', '')] = row
        }
        return acc
      }, {})

      const baseCreatedAt = new Date('2026-01-02T08:00:00').getTime()
      const mappedAttributes = AGENCIES_DATA.reduce<Record<string, AgencyAttributes>>((acc, agency, index) => {
        const createdAt = new Date(baseCreatedAt + index * 86_400_000).toISOString()
        const updatedAt = rowByAgencyId[agency.id]?.updatedAt ?? new Date(baseCreatedAt + index * 86_400_000 + 1_800_000).toISOString()

        acc[agency.id] = {
          description: agency.description,
          contactNumber: agency.contact,
          email: agency.email,
          mapLink: getGoogleMapsPlaceUrl(agency.locationQuery),
          createdAt,
          updatedAt,
        }

        return acc
      }, {})

      setAgencyAttributesById(mappedAttributes)
    } else {
      setAgencyAttributesById({})
    }

    setSearchValue('')
    setStatusFilter('ALL')
    setScopeFilter('ALL')
    setCurrentPage(1)
    setSelectedRow(null)
    setActionMessage('')
    setEditAgencyRow(null)
    setEditAgencyName('')
    setEditAgencyDescription('')
    setEditAgencyContactNumber('')
    setEditAgencyEmail('')
    setEditAgencyMapLink('')
    setIsCreateAgencyModalOpen(false)
    setCreateAgencyName('')
    setCreateAgencyDescription('')
    setCreateAgencyContactNumber('')
    setCreateAgencyEmail('')
    setCreateAgencyMapLink('')
    setCreateAgencyCreatedAt('')
    setCreateAgencyUpdatedAt('')
    setIsCreateUserWizardOpen(false)
    setCreateUserStep(1)
    setSelectedUserRole('')
    setSelectedUserAgencyId('')
    setCreateUserFullName('')
    setCreateUserEmail('')
    setCreateUserContact('')
    setCreateUserTempPassword('')
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

  const getAgencyIdFromRow = (row: SystemAdminCrudRow): string => row.id.replace('admin-agency-', '')

  const isProtectedDefaultAgency = (row: SystemAdminCrudRow): boolean => {
    return entity === 'agencies' && row.id.startsWith('admin-agency-') && getAgencyIdFromRow(row) === 'dmw'
  }

  const renderDefaultBadge = () => (
    <span className="inline-flex items-center rounded-[999px] border border-[#bfdbfe] bg-[#eff6ff] px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-[0.08em] text-[#1d4ed8]">
      Default
    </span>
  )

  const getAgencyAttributes = (agencyId: string): AgencyAttributes => {
    return (
      agencyAttributesById[agencyId] ?? {
        description: '',
        contactNumber: '',
        email: '',
        mapLink: '',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }
    )
  }

  const handleCreate = () => {
    if (entity === 'agencies') {
      const nowIso = new Date().toISOString()

      setCreateAgencyName('')
      setCreateAgencyDescription('')
      setCreateAgencyContactNumber('')
      setCreateAgencyEmail('')
      setCreateAgencyMapLink('')
      setCreateAgencyCreatedAt(nowIso)
      setCreateAgencyUpdatedAt(nowIso)
      setIsCreateAgencyModalOpen(true)
      return
    }

    if (entity === 'users') {
      setCreateUserStep(1)
      setSelectedUserRole('')
      setSelectedUserAgencyId('')
      setCreateUserFullName('')
      setCreateUserEmail('')
      setCreateUserContact('')
      setCreateUserTempPassword('')
      setIsCreateUserWizardOpen(true)
      return
    }

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

  const userRoleOptions: MockUserRole[] = ['System Admin', 'Case Manager', 'Agency']
  const selectedAgency = useMemo(() => AGENCIES_DATA.find((agency) => agency.id === selectedUserAgencyId), [selectedUserAgencyId])
  const isAgencyRole = selectedUserRole === 'Agency'
  const isUserStepOneValid = Boolean(selectedUserRole)
  const isUserStepTwoValid = isAgencyRole ? Boolean(selectedUserAgencyId) : true
  const isUserStepThreeValid = Boolean(
    createUserFullName.trim() &&
    createUserEmail.trim() &&
    isValidEmail(createUserEmail) &&
    createUserContact.trim() &&
    isValidTemporaryPassword(createUserTempPassword),
  )

  const closeCreateUserWizard = () => {
    setIsCreateUserWizardOpen(false)
    setCreateUserStep(1)
    setSelectedUserRole('')
    setSelectedUserAgencyId('')
    setCreateUserFullName('')
    setCreateUserEmail('')
    setCreateUserContact('')
    setCreateUserTempPassword('')
  }

  const goToNextUserStep = () => {
    if (createUserStep === 1 && isUserStepOneValid) {
      if (selectedUserRole === 'Agency') {
        setCreateUserStep(2)
      } else {
        setCreateUserStep(3)
      }
      return
    }

    if (createUserStep === 2 && isUserStepTwoValid) {
      setCreateUserStep(3)
    }
  }

  const goToPreviousUserStep = () => {
    if (createUserStep === 2) {
      setCreateUserStep(1)
      return
    }

    if (createUserStep === 3) {
      if (selectedUserRole === 'Agency') {
        setCreateUserStep(2)
      } else {
        setCreateUserStep(1)
      }
    }
  }

  const submitCreateUser = () => {
    if (!isUserStepThreeValid) {
      return
    }

    const nextName = createUserFullName.trim()
    const nextEmail = createUserEmail.trim()
    if (!isValidEmail(nextEmail)) {
      return
    }
    const agencyLabel = selectedAgency?.short || selectedAgency?.name
    const scope = selectedUserRole === 'Agency' && agencyLabel
      ? `Agency • ${agencyLabel}`
      : selectedUserRole || 'System Admin'

    const nextRow: SystemAdminCrudRow = {
      id: `admin-user-${nextEmail}`,
      entity: 'users',
      recordId: nextEmail,
      recordLabel: nextName,
      scope,
      status: 'ACTIVE',
      updatedAt: new Date().toISOString(),
    }

    setRows((prev) => [nextRow, ...prev])
    setCurrentPage(1)
    setActionMessage(`Created user record: ${nextName}.`)
    closeCreateUserWizard()
  }

  const closeAgencyCreateModal = () => {
    setIsCreateAgencyModalOpen(false)
    setCreateAgencyName('')
    setCreateAgencyDescription('')
    setCreateAgencyContactNumber('')
    setCreateAgencyEmail('')
    setCreateAgencyMapLink('')
    setCreateAgencyCreatedAt('')
    setCreateAgencyUpdatedAt('')
  }

  const saveAgencyCreate = () => {
    const nextName = createAgencyName.trim()
    if (!nextName) {
      window.alert('Agency name is required.')
      return
    }

    const mapLink = createAgencyMapLink.trim()
    if (mapLink && !isValidHttpUrl(mapLink)) {
      window.alert('Map Link must be a valid http:// or https:// URL.')
      return
    }

    const createdAt = createAgencyCreatedAt || new Date().toISOString()
    const updatedAt = createAgencyUpdatedAt || createdAt
    const agencyId = typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
      ? crypto.randomUUID()
      : `agency-${Date.now()}`

    const nextRow: SystemAdminCrudRow = {
      id: `admin-agency-${agencyId}`,
      entity: 'agencies',
      recordId: agencyId,
      recordLabel: nextName,
      scope: 'National',
      status: 'ACTIVE',
      updatedAt,
    }

    setRows((prev) => [nextRow, ...prev])
    setAgencyAttributesById((prev) => ({
      ...prev,
      [agencyId]: {
        description: createAgencyDescription.trim(),
        contactNumber: createAgencyContactNumber.trim(),
        email: createAgencyEmail.trim(),
        mapLink,
        createdAt,
        updatedAt,
      },
    }))
    setCurrentPage(1)
    setActionMessage(`Created agency record: ${nextName}.`)
    closeAgencyCreateModal()
  }

  const handleView = (row: SystemAdminCrudRow) => {
    if (entity === 'agencies' && row.id.startsWith('admin-agency-')) {
      const agencyId = row.id.replace('admin-agency-', '')
      navigate(`/system-admin/agencies/${agencyId}`)
      return
    }

    setSelectedRow(row)
    setActionMessage(`Viewing ${row.recordId}.`)
  }

  const handleEdit = (row: SystemAdminCrudRow) => {
    if (entity === 'agencies') {
      const agencyId = getAgencyIdFromRow(row)
      const attrs = getAgencyAttributes(agencyId)

      setEditAgencyRow(row)
      setEditAgencyName(row.recordLabel)
      setEditAgencyDescription(attrs.description)
      setEditAgencyContactNumber(attrs.contactNumber)
      setEditAgencyEmail(attrs.email)
      setEditAgencyMapLink(attrs.mapLink)
      return
    }

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

  const closeAgencyEditModal = () => {
    setEditAgencyRow(null)
    setEditAgencyName('')
    setEditAgencyDescription('')
    setEditAgencyContactNumber('')
    setEditAgencyEmail('')
    setEditAgencyMapLink('')
  }

  const saveAgencyEdit = () => {
    if (!editAgencyRow) {
      return
    }

    const nextLabel = editAgencyName.trim()
    if (!nextLabel) {
      window.alert('Agency name is required.')
      return
    }

    const mapLink = editAgencyMapLink.trim()
    if (mapLink && !isValidHttpUrl(mapLink)) {
      window.alert('Map Link must be a valid http:// or https:// URL.')
      return
    }

    const agencyId = getAgencyIdFromRow(editAgencyRow)
    const previousAttributes = getAgencyAttributes(agencyId)
    const nowIso = new Date().toISOString()

    const updatedRow = touchRow({
      ...editAgencyRow,
      recordLabel: nextLabel,
    })

    setAgencyAttributesById((prev) => ({
      ...prev,
      [agencyId]: {
        ...previousAttributes,
        description: editAgencyDescription.trim(),
        contactNumber: editAgencyContactNumber.trim(),
        email: editAgencyEmail.trim(),
        mapLink,
        updatedAt: nowIso,
      },
    }))

    setRows((prev) => prev.map((item) => (item.id === editAgencyRow.id ? updatedRow : item)))
    setSelectedRow((prev) => (prev?.id === editAgencyRow.id ? updatedRow : prev))
    setActionMessage(`Updated ${updatedRow.recordId}.`)
    closeAgencyEditModal()
  }

  const handleDelete = (row: SystemAdminCrudRow) => {
    if (isProtectedDefaultAgency(row)) {
      setActionMessage('Department of Migrant Workers is a default agency and cannot be deleted.')
      return
    }

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
      const agencyId = row.id.startsWith('admin-agency-') ? getAgencyIdFromRow(row) : ''
      const agencyAttributes = entity === 'agencies' ? getAgencyAttributes(agencyId) : null
      const matchesSearch =
        query.length === 0 ||
        (
          entity === 'agencies'
            ? [
                row.recordId,
                row.recordLabel,
                agencyAttributes?.description,
                agencyAttributes?.contactNumber,
                agencyAttributes?.email,
                agencyAttributes?.mapLink,
              ]
            : [row.recordId, row.recordLabel, row.scope]
        )
          .join(' ')
          .toLowerCase()
          .includes(query)

      const matchesStatus = statusFilter === 'ALL' || row.status === statusFilter
      const matchesScope = entity === 'agencies' ? true : scopeFilter === 'ALL' || row.scope === scopeFilter

      return matchesSearch && matchesStatus && matchesScope
    })
  }, [rows, searchValue, statusFilter, scopeFilter, entity, agencyAttributesById])

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

    if (entity !== 'agencies' && scopeFilter !== 'ALL') {
      filters.push({ key: 'scope', label: 'Scope', value: scopeFilter })
    }

    return filters
  }, [statusFilter, scopeFilter, entity])

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

  const columns: Column<SystemAdminCrudRow>[] = useMemo(() => {
    const baseColumns: Column<SystemAdminCrudRow>[] = []

    if (entity !== 'agencies') {
      baseColumns.push({
        key: 'recordId',
        title: 'RECORD ID',
        render: (row) => <span className="text-[13px] font-bold text-[#0b5384]">{row.recordId}</span>,
      })
    }

    baseColumns.push({
      key: 'recordLabel',
      title: entity === 'agencies' ? 'AGENCY FULL NAME' : recordLabel.toUpperCase(),
      render: (row) => (
        <div className="flex items-center gap-2">
          <span className="text-[13px] font-semibold text-slate-800">{row.recordLabel}</span>
          {isProtectedDefaultAgency(row) ? renderDefaultBadge() : null}
        </div>
      ),
    })

    if (entity === 'agencies') {
      baseColumns.push(
        {
          key: 'agencyContactInfo',
          title: 'CONTACT INFO',
          render: (row) => {
            const agencyId = getAgencyIdFromRow(row)
            const attrs = getAgencyAttributes(agencyId)
            const contactInfo = [attrs.contactNumber, attrs.email].filter((value) => value.trim().length > 0).join(' • ')

            return <span className="text-[12px] text-slate-600">{contactInfo || '-'}</span>
          },
        },
        {
          key: 'agencyUpdatedAt',
          title: 'LAST UPDATED',
          className: 'whitespace-nowrap',
          render: (row) => {
            const agencyId = getAgencyIdFromRow(row)
            return <span className="text-[12px] text-slate-500">{formatDisplayDateTime(getAgencyAttributes(agencyId).updatedAt)}</span>
          },
        },
      )
    } else {
      baseColumns.push(
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
      )
    }

    baseColumns.push({
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
            disabled={isProtectedDefaultAgency(row)}
            className={`px-3 min-h-[32px] text-[12px] font-bold rounded-[3px] transition-colors border ${
              isProtectedDefaultAgency(row)
                ? 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed'
                : 'bg-[#fee2e2] text-[#b91c1c] hover:bg-[#fecaca] border-[#fecaca]'
            }`}
          >
            Delete
          </button>
        </div>
      ),
    })

    return baseColumns
  }, [entity, recordLabel, agencyAttributesById])

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
            {entity === 'agencies' ? (
              <>
                <p className="flex flex-wrap items-center gap-2"><span className="font-bold text-slate-900">Agency Name:</span> <span>{selectedRow.recordLabel}</span>{isProtectedDefaultAgency(selectedRow) ? renderDefaultBadge() : null}</p>
                <p><span className="font-bold text-slate-900">Description:</span> {getAgencyAttributes(getAgencyIdFromRow(selectedRow)).description || '-'}</p>
                <p><span className="font-bold text-slate-900">Contact Number:</span> {getAgencyAttributes(getAgencyIdFromRow(selectedRow)).contactNumber || '-'}</p>
                <p><span className="font-bold text-slate-900">Agency Email:</span> {getAgencyAttributes(getAgencyIdFromRow(selectedRow)).email || '-'}</p>
                <p><span className="font-bold text-slate-900">Map Link:</span> {getAgencyAttributes(getAgencyIdFromRow(selectedRow)).mapLink || '-'}</p>
                <p><span className="font-bold text-slate-900">Created At:</span> {formatDisplayDateTime(getAgencyAttributes(getAgencyIdFromRow(selectedRow)).createdAt)}</p>
                <p><span className="font-bold text-slate-900">Updated At:</span> {formatDisplayDateTime(getAgencyAttributes(getAgencyIdFromRow(selectedRow)).updatedAt)}</p>
              </>
            ) : (
              <>
                <p><span className="font-bold text-slate-900">Record ID:</span> {selectedRow.recordId}</p>
                <p><span className="font-bold text-slate-900">{recordLabel}:</span> {selectedRow.recordLabel}</p>
                <p><span className="font-bold text-slate-900">Scope:</span> {selectedRow.scope}</p>
                <p><span className="font-bold text-slate-900">Status:</span> {selectedRow.status}</p>
                <p><span className="font-bold text-slate-900">Updated:</span> {formatDisplayDateTime(selectedRow.updatedAt)}</p>
              </>
            )}
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
        onNewRecord={allowCreate ? handleCreate : undefined}
        newRecordLabel={allowCreate ? newRecordLabel : undefined}
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

            {entity !== 'agencies' ? (
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
            ) : null}

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

      {entity === 'users' && isCreateUserWizardOpen ? (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/50 p-4">
          <div className="w-full max-w-2xl rounded-[3px] border border-[#cbd5e1] bg-white shadow-xl">
            <div className="border-b border-[#e2e8f0] px-5 py-4">
              <h2 className="text-[16px] font-extrabold text-slate-900">Create User</h2>
              <p className="mt-1 text-[12px] text-slate-500">Complete each step to add a new user.</p>

              <div className={`mt-4 grid gap-2 ${isAgencyRole ? 'grid-cols-3' : 'grid-cols-2'}`}>
                {(isAgencyRole
                  ? [
                      { index: 1, label: 'Select User Type' },
                      { index: 2, label: 'Assign Agency' },
                      { index: 3, label: 'User Details & Review' },
                    ]
                  : [
                      { index: 1, label: 'Select User Type' },
                      { index: 3, label: 'User Details & Review' },
                    ]
                ).map((step) => {
                  const isActive = createUserStep === step.index
                  const isDone = createUserStep > step.index

                  return (
                    <div
                      key={step.index}
                      className={`rounded-[3px] border px-3 py-2 text-center text-[11px] font-bold ${
                        isActive
                          ? 'border-[#0b5384] bg-[#0b5384]/10 text-[#0b5384]'
                          : isDone
                            ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                            : 'border-[#e2e8f0] bg-slate-50 text-slate-500'
                      }`}
                    >
                      {step.label}
                    </div>
                  )
                })}
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 px-5 py-4 md:grid-cols-2">
              {createUserStep === 1 ? (
                <>
                  <FieldLabel label="User Role" full>
                    <select
                      value={selectedUserRole}
                      onChange={(event) => {
                        const nextRole = event.target.value as MockUserRole | ''
                        setSelectedUserRole(nextRole)
                        if (nextRole !== 'Agency') {
                          setSelectedUserAgencyId('')
                        }
                      }}
                      className="h-10 w-full rounded-[3px] border border-[#cbd5e1] px-3 text-[13px] text-slate-700 outline-none"
                    >
                      <option value="">Select role</option>
                      {userRoleOptions.map((role) => (
                        <option key={role} value={role}>{role}</option>
                      ))}
                    </select>
                  </FieldLabel>

                  <div className="rounded-[3px] border border-[#e2e8f0] bg-slate-50 px-3 py-3 text-[12px] text-slate-600 md:col-span-2">
                    <p className="font-semibold text-slate-800">Role guidance</p>
                    <p className="mt-1">
                      {selectedUserRole === 'Agency'
                        ? 'Agency users must be assigned to an agency before entering details.'
                        : 'Continue to enter details for System Admin or Case Manager roles.'}
                    </p>
                  </div>
                </>
              ) : null}

              {createUserStep === 2 ? (
                AGENCIES_DATA.length ? (
                  <>
                    <FieldLabel label="Agency" full>
                      <select
                        value={selectedUserAgencyId}
                        onChange={(event) => setSelectedUserAgencyId(event.target.value)}
                        className="h-10 w-full rounded-[3px] border border-[#cbd5e1] px-3 text-[13px] text-slate-700 outline-none"
                      >
                        <option value="">Select agency</option>
                        {AGENCIES_DATA.map((agency) => (
                          <option key={agency.id} value={agency.id}>{agency.name}</option>
                        ))}
                      </select>
                    </FieldLabel>

                    <div className="rounded-[3px] border border-[#e2e8f0] bg-slate-50 px-3 py-2 text-[12px] text-slate-600 md:col-span-2">
                      Selected agency: <span className="font-semibold text-slate-800">{selectedAgency?.name ?? '-'}</span>
                    </div>
                  </>
                ) : (
                  <div className="rounded-[3px] border border-[#e2e8f0] bg-slate-50 px-3 py-3 text-[12px] text-slate-600 md:col-span-2">
                    <p className="font-semibold text-slate-800">No agencies available.</p>
                    <p className="mt-1">Create an agency first, then return to create an agency user.</p>
                    <button
                      type="button"
                      onClick={() => {
                        closeCreateUserWizard()
                        navigate('/system-admin/agencies')
                      }}
                      className="mt-3 h-8 rounded-[3px] border border-[#0b5384]/30 bg-[#0b5384]/10 px-3 text-[11px] font-bold text-[#0b5384] hover:bg-[#0b5384]/20"
                    >
                      + Create Agency
                    </button>
                  </div>
                )
              ) : null}

              {createUserStep === 3 ? (
                <>
                  <FieldLabel label="Full Name" full>
                    <input
                      type="text"
                      value={createUserFullName}
                      onChange={(event) => setCreateUserFullName(event.target.value)}
                      className="h-10 w-full rounded-[3px] border border-[#cbd5e1] px-3 text-[13px] text-slate-700 outline-none"
                      placeholder="Enter full name"
                    />
                  </FieldLabel>

                  <FieldLabel label="Email Address" full>
                    <input
                      type="email"
                      value={createUserEmail}
                      onChange={(event) => setCreateUserEmail(event.target.value)}
                      className="h-10 w-full rounded-[3px] border border-[#cbd5e1] px-3 text-[13px] text-slate-700 outline-none"
                      placeholder="name@example.com"
                    />
                    {createUserEmail.trim().length > 0 && !isValidEmail(createUserEmail) ? (
                      <p className="mt-1 text-[11px] font-semibold text-[#b91c1c]">Enter a valid email address.</p>
                    ) : null}
                  </FieldLabel>

                  <FieldLabel label="Contact Number" full>
                    <CountryCodePhoneInput
                      value={createUserContact}
                      onChange={setCreateUserContact}
                    />
                  </FieldLabel>

                  <FieldLabel label="Temporary Password" full>
                    <input
                      type="password"
                      value={createUserTempPassword}
                      onChange={(event) => setCreateUserTempPassword(event.target.value)}
                      className="h-10 w-full rounded-[3px] border border-[#cbd5e1] px-3 text-[13px] text-slate-700 outline-none"
                      placeholder="Set a temporary password"
                    />
                    <p className="mt-1 text-[11px] text-slate-500">Use 8+ characters with 1 uppercase, 1 number, and 1 symbol.</p>
                    {createUserTempPassword.trim().length > 0 && !isValidTemporaryPassword(createUserTempPassword) ? (
                      <p className="mt-1 text-[11px] font-semibold text-[#b91c1c]">Temporary password does not meet the requirements.</p>
                    ) : null}
                  </FieldLabel>

                  <div className="rounded-[3px] border border-[#e2e8f0] bg-slate-50 px-3 py-2 text-[12px] text-slate-600 md:col-span-2">
                    <p>
                      Role: <span className="font-semibold text-slate-800">{selectedUserRole || '-'}</span>
                    </p>
                    <p>
                      Agency: <span className="font-semibold text-slate-800">{selectedAgency?.name ?? (isAgencyRole ? '-' : 'Not required')}</span>
                    </p>
                  </div>
                </>
              ) : null}
            </div>

            <div className="flex justify-end gap-2 border-t border-[#e2e8f0] px-5 py-3">
              <button
                type="button"
                onClick={closeCreateUserWizard}
                className="h-9 rounded-[3px] border border-[#cbd5e1] px-3 text-[12px] font-bold text-slate-700"
              >
                Cancel
              </button>

              {createUserStep > 1 ? (
                <button
                  type="button"
                  onClick={goToPreviousUserStep}
                  className="h-9 rounded-[3px] border border-[#cbd5e1] px-3 text-[12px] font-bold text-slate-700"
                >
                  Back
                </button>
              ) : null}

              {createUserStep < 3 ? (
                <button
                  type="button"
                  onClick={goToNextUserStep}
                  disabled={(createUserStep === 1 && !isUserStepOneValid) || (createUserStep === 2 && !isUserStepTwoValid)}
                  className="h-9 rounded-[3px] bg-[#0b5384] px-3 text-[12px] font-bold text-white disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Next
                </button>
              ) : (
                <button
                  type="button"
                  onClick={submitCreateUser}
                  disabled={!isUserStepThreeValid}
                  className="h-9 rounded-[3px] bg-[#0b5384] px-3 text-[12px] font-bold text-white disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Create User
                </button>
              )}
            </div>
          </div>
        </div>
      ) : null}

      {entity === 'agencies' && editAgencyRow ? (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/50 px-4">
          <div className="w-full max-w-xl rounded-[4px] border border-[#cbd5e1] bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-[#e2e8f0] px-5 py-4">
              <div>
                <h3 className="text-[16px] font-bold text-slate-900">Edit Agency Details</h3>
                <p className="mt-1 text-[12px] text-slate-500">Agency: {editAgencyRow.recordLabel}</p>
              </div>
              <button
                type="button"
                onClick={closeAgencyEditModal}
                className="rounded-[3px] border border-slate-300 bg-slate-50 px-2 py-1 text-[11px] font-bold text-slate-600 hover:bg-slate-100"
              >
                Close
              </button>
            </div>

            <div className="space-y-4 px-5 py-5">
              <div>
                <label className="mb-1.5 block text-[12px] font-bold uppercase tracking-wider text-[#64748b]">Agency Name</label>
                <input
                  type="text"
                  value={editAgencyName}
                  onChange={(event) => setEditAgencyName(event.target.value)}
                  className="w-full rounded-[3px] border border-[#cbd5e1] bg-white px-3 py-2 text-[13px] font-semibold text-slate-700 outline-none focus:ring-1 focus:ring-[#0b5384]"
                  placeholder="Enter agency name"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-[12px] font-bold uppercase tracking-wider text-[#64748b]">Description</label>
                <textarea
                  value={editAgencyDescription}
                  onChange={(event) => setEditAgencyDescription(event.target.value)}
                  rows={4}
                  className="w-full rounded-[3px] border border-[#cbd5e1] bg-white px-3 py-2 text-[13px] font-medium text-slate-700 outline-none focus:ring-1 focus:ring-[#0b5384]"
                  placeholder="Enter agency description"
                />
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-[12px] font-bold uppercase tracking-wider text-[#64748b]">Contact Number</label>
                  <input
                    type="text"
                    value={editAgencyContactNumber}
                    onChange={(event) => setEditAgencyContactNumber(event.target.value)}
                    className="w-full rounded-[3px] border border-[#cbd5e1] bg-white px-3 py-2 text-[13px] font-semibold text-slate-700 outline-none focus:ring-1 focus:ring-[#0b5384]"
                    placeholder="Enter contact number"
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-[12px] font-bold uppercase tracking-wider text-[#64748b]">Agency Email</label>
                  <input
                    type="email"
                    value={editAgencyEmail}
                    onChange={(event) => setEditAgencyEmail(event.target.value)}
                    className="w-full rounded-[3px] border border-[#cbd5e1] bg-white px-3 py-2 text-[13px] font-semibold text-slate-700 outline-none focus:ring-1 focus:ring-[#0b5384]"
                    placeholder="Enter agency email"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-[12px] font-bold uppercase tracking-wider text-[#64748b]">Map Link</label>
                  <input
                    type="url"
                    value={editAgencyMapLink}
                    onChange={(event) => setEditAgencyMapLink(event.target.value)}
                    className="w-full rounded-[3px] border border-[#cbd5e1] bg-white px-3 py-2 text-[13px] font-semibold text-slate-700 outline-none focus:ring-1 focus:ring-[#0b5384]"
                    placeholder="https://..."
                  />
                </div>
                <div />
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-[12px] font-bold uppercase tracking-wider text-[#64748b]">Created At</label>
                  <input
                    type="text"
                    value={formatDisplayDateTime(getAgencyAttributes(getAgencyIdFromRow(editAgencyRow)).createdAt)}
                    readOnly
                    className="w-full rounded-[3px] border border-[#e2e8f0] bg-slate-100 px-3 py-2 text-[12px] font-semibold text-slate-600"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-[12px] font-bold uppercase tracking-wider text-[#64748b]">Updated At</label>
                  <input
                    type="text"
                    value={formatDisplayDateTime(getAgencyAttributes(getAgencyIdFromRow(editAgencyRow)).updatedAt)}
                    readOnly
                    className="w-full rounded-[3px] border border-[#e2e8f0] bg-slate-100 px-3 py-2 text-[12px] font-semibold text-slate-600"
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 border-t border-[#e2e8f0] px-5 py-4">
              <button
                type="button"
                onClick={closeAgencyEditModal}
                className="h-[34px] rounded-[3px] border border-slate-300 bg-slate-50 px-3 text-[12px] font-bold text-slate-700 hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={saveAgencyEdit}
                className="h-[34px] rounded-[3px] bg-[#0b5384] px-4 text-[12px] font-bold text-white hover:bg-[#09416a]"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {entity === 'agencies' && isCreateAgencyModalOpen ? (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/50 px-4">
          <div className="w-full max-w-xl rounded-[4px] border border-[#cbd5e1] bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-[#e2e8f0] px-5 py-4">
              <div>
                <h3 className="text-[16px] font-bold text-slate-900">Create New Agency</h3>
                <p className="mt-1 text-[12px] text-slate-500">Provide required agency attributes.</p>
              </div>
              <button
                type="button"
                onClick={closeAgencyCreateModal}
                className="rounded-[3px] border border-slate-300 bg-slate-50 px-2 py-1 text-[11px] font-bold text-slate-600 hover:bg-slate-100"
              >
                Close
              </button>
            </div>

            <div className="space-y-4 px-5 py-5">
              <div>
                <label className="mb-1.5 block text-[12px] font-bold uppercase tracking-wider text-[#64748b]">Agency Name</label>
                <input
                  type="text"
                  value={createAgencyName}
                  onChange={(event) => setCreateAgencyName(event.target.value)}
                  className="w-full rounded-[3px] border border-[#cbd5e1] bg-white px-3 py-2 text-[13px] font-semibold text-slate-700 outline-none focus:ring-1 focus:ring-[#0b5384]"
                  placeholder="Enter agency name"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-[12px] font-bold uppercase tracking-wider text-[#64748b]">Description</label>
                <textarea
                  value={createAgencyDescription}
                  onChange={(event) => setCreateAgencyDescription(event.target.value)}
                  rows={4}
                  className="w-full rounded-[3px] border border-[#cbd5e1] bg-white px-3 py-2 text-[13px] font-medium text-slate-700 outline-none focus:ring-1 focus:ring-[#0b5384]"
                  placeholder="Enter agency description"
                />
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-[12px] font-bold uppercase tracking-wider text-[#64748b]">Contact Number</label>
                  <input
                    type="text"
                    value={createAgencyContactNumber}
                    onChange={(event) => setCreateAgencyContactNumber(event.target.value)}
                    className="w-full rounded-[3px] border border-[#cbd5e1] bg-white px-3 py-2 text-[13px] font-semibold text-slate-700 outline-none focus:ring-1 focus:ring-[#0b5384]"
                    placeholder="Enter contact number"
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-[12px] font-bold uppercase tracking-wider text-[#64748b]">Agency Email</label>
                  <input
                    type="email"
                    value={createAgencyEmail}
                    onChange={(event) => setCreateAgencyEmail(event.target.value)}
                    className="w-full rounded-[3px] border border-[#cbd5e1] bg-white px-3 py-2 text-[13px] font-semibold text-slate-700 outline-none focus:ring-1 focus:ring-[#0b5384]"
                    placeholder="Enter agency email"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-[12px] font-bold uppercase tracking-wider text-[#64748b]">Map Link</label>
                  <input
                    type="url"
                    value={createAgencyMapLink}
                    onChange={(event) => setCreateAgencyMapLink(event.target.value)}
                    className="w-full rounded-[3px] border border-[#cbd5e1] bg-white px-3 py-2 text-[13px] font-semibold text-slate-700 outline-none focus:ring-1 focus:ring-[#0b5384]"
                    placeholder="https://..."
                  />
                </div>
                <div />
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-[12px] font-bold uppercase tracking-wider text-[#64748b]">Created At</label>
                  <input
                    type="text"
                    value={formatDisplayDateTime(createAgencyCreatedAt || new Date().toISOString())}
                    readOnly
                    className="w-full rounded-[3px] border border-[#e2e8f0] bg-slate-100 px-3 py-2 text-[12px] font-semibold text-slate-600"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-[12px] font-bold uppercase tracking-wider text-[#64748b]">Updated At</label>
                  <input
                    type="text"
                    value={formatDisplayDateTime(createAgencyUpdatedAt || new Date().toISOString())}
                    readOnly
                    className="w-full rounded-[3px] border border-[#e2e8f0] bg-slate-100 px-3 py-2 text-[12px] font-semibold text-slate-600"
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 border-t border-[#e2e8f0] px-5 py-4">
              <button
                type="button"
                onClick={closeAgencyCreateModal}
                className="h-[34px] rounded-[3px] border border-slate-300 bg-slate-50 px-3 text-[12px] font-bold text-slate-700 hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={saveAgencyCreate}
                className="h-[34px] rounded-[3px] bg-[#0b5384] px-4 text-[12px] font-bold text-white hover:bg-[#09416a]"
              >
                Create Agency
              </button>
            </div>
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

function FieldLabel({ label, children, full = false }: { label: string; children: ReactNode; full?: boolean }) {
  return (
    <div className={full ? 'md:col-span-2' : ''}>
      <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-[0.08em] text-slate-600">{label}</label>
      {children}
    </div>
  )
}
