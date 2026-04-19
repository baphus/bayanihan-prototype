import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { UnifiedTable, type Column } from '../../components/ui/UnifiedTable'
import CountryCodePhoneInput from '../../components/ui/CountryCodePhoneInput'
import { pageHeadingStyles } from '../agency/pageHeadingStyles'
import { AGENCIES_DATA, type AgencyData } from '../../data/agenciesData'
import {
  formatDisplayDateTime,
  getAgencyFocalAccountsByAgencyId,
  getCaseManagerAgencies,
  getGoogleMapsEmbedUrl,
  getGoogleMapsPlaceUrl,
  type AgencyFocalAccount,
} from '../../data/unifiedData'

type AssociatedAccountRow = Omit<AgencyFocalAccount, 'role'> & {
  role: 'Agency Focal' | 'Case Manager'
}

export default function AgencyViewPage() {
  const navigate = useNavigate()
  const { agencyId = '' } = useParams()

  const agency = AGENCIES_DATA.find((item) => item.id === agencyId)
  const compactAgency = getCaseManagerAgencies().find((item) => item.id === agencyId)
  const [agencyState, setAgencyState] = useState<AgencyData | null>(null)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [editAgencyName, setEditAgencyName] = useState('')
  const [editAgencyDescription, setEditAgencyDescription] = useState('')
  const [editContactNumber, setEditContactNumber] = useState('')
  const [editAgencyEmail, setEditAgencyEmail] = useState('')
  const [editLocationQuery, setEditLocationQuery] = useState('')
  const [associatedAccounts, setAssociatedAccounts] = useState<AssociatedAccountRow[]>([])
  const [isCreateUserModalOpen, setIsCreateUserModalOpen] = useState(false)
  const [newUserName, setNewUserName] = useState('')
  const [newUserEmail, setNewUserEmail] = useState('')
  const [newUserContact, setNewUserContact] = useState('')
  const [newUserRole, setNewUserRole] = useState<'Agency Focal' | 'Case Manager'>('Agency Focal')
  const [searchValue, setSearchValue] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [rowsPerPage, setRowsPerPage] = useState(10)
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list')

  useEffect(() => {
    setAgencyState(agency ?? null)
    setIsEditModalOpen(false)
    if (agency) {
      setAssociatedAccounts(getAgencyFocalAccountsByAgencyId(agency.id))
    } else {
      setAssociatedAccounts([])
    }
    setIsCreateUserModalOpen(false)
    setNewUserName('')
    setNewUserEmail('')
    setNewUserContact('')
    setNewUserRole('Agency Focal')
  }, [agency])

  const filteredRows = useMemo(() => {
    const query = searchValue.trim().toLowerCase()

    if (!query) {
      return associatedAccounts
    }

    return associatedAccounts.filter((row) => {
      return [row.name, row.email, row.role, row.status, row.contactNumber].join(' ').toLowerCase().includes(query)
    })
  }, [associatedAccounts, searchValue])

  const totalRecords = filteredRows.length
  const totalPages = Math.max(1, Math.ceil(totalRecords / rowsPerPage))
  const safePage = Math.min(currentPage, totalPages)
  const startIndex = totalRecords === 0 ? 0 : (safePage - 1) * rowsPerPage + 1
  const endIndex = totalRecords === 0 ? 0 : Math.min(safePage * rowsPerPage, totalRecords)

  const paginatedRows = useMemo(() => {
    const start = (safePage - 1) * rowsPerPage
    return filteredRows.slice(start, start + rowsPerPage)
  }, [filteredRows, safePage, rowsPerPage])

  const columns: Column<AssociatedAccountRow>[] = [
    {
      key: 'name',
      title: 'NAME',
      render: (row) => <span className="text-[13px] font-semibold text-slate-800">{row.name}</span>,
    },
    {
      key: 'email',
      title: 'ACCOUNT EMAIL',
      render: (row) => <span className="text-[12px] font-medium text-[#0b5384]">{row.email}</span>,
    },
    {
      key: 'role',
      title: 'ROLE',
      render: (row) => <span className="text-[12px] text-slate-700">{row.role}</span>,
    },
    {
      key: 'contactNumber',
      title: 'CONTACT',
      render: (row) => <span className="text-[12px] text-slate-600">{row.contactNumber}</span>,
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
      key: 'lastLoginAt',
      title: 'LAST LOGIN',
      className: 'whitespace-nowrap',
      render: (row) => <span className="text-[12px] text-slate-500">{formatDisplayDateTime(row.lastLoginAt)}</span>,
    },
  ]

  if (!agencyState) {
    return (
      <div className="mx-auto max-w-4xl space-y-4 pb-6">
        <button
          type="button"
          onClick={() => navigate('/system-admin/agencies')}
          className="inline-flex items-center gap-1 text-[12px] font-bold text-slate-600 hover:text-slate-800"
        >
          <span className="material-symbols-outlined text-[18px]">arrow_back</span>
          Back to Agencies
        </button>
        <div className="rounded-[4px] border border-[#e2e8f0] bg-white p-6 text-center">
          <p className="text-[14px] font-semibold text-slate-800">Agency record not found.</p>
        </div>
      </div>
    )
  }

  const mapEmbedSrc = getGoogleMapsEmbedUrl(agencyState.locationQuery)
  const mapLink = getGoogleMapsPlaceUrl(agencyState.locationQuery)

  const openEditModal = () => {
    setEditAgencyName(agencyState.name)
    setEditAgencyDescription(agencyState.description)
    setEditContactNumber(agencyState.contact)
    setEditAgencyEmail(agencyState.email)
    setEditLocationQuery(agencyState.locationQuery)
    setIsEditModalOpen(true)
  }

  const closeEditModal = () => {
    setIsEditModalOpen(false)
  }

  const saveAgencyDetails = () => {
    const nextName = editAgencyName.trim()

    if (!nextName) {
      window.alert('Agency name is required.')
      return
    }

    setAgencyState((prev) => {
      if (!prev) {
        return prev
      }

      return {
        ...prev,
        name: nextName,
        description: editAgencyDescription.trim(),
        contact: editContactNumber.trim(),
        email: editAgencyEmail.trim(),
        locationQuery: editLocationQuery.trim() || prev.locationQuery,
      }
    })

    closeEditModal()
  }

  const openCreateUserModal = () => {
    setNewUserName('')
    setNewUserEmail('')
    setNewUserContact('')
    setNewUserRole('Agency Focal')
    setIsCreateUserModalOpen(true)
  }

  const closeCreateUserModal = () => {
    setIsCreateUserModalOpen(false)
  }

  const saveNewUser = () => {
    const name = newUserName.trim()
    const email = newUserEmail.trim()

    if (!name) {
      window.alert('Full name is required.')
      return
    }

    if (!email) {
      window.alert('Email is required.')
      return
    }

    const nowIso = new Date().toISOString()
    const nextUser: AssociatedAccountRow = {
      id: `agency-focal-${agencyState.id}-${Date.now()}`,
      agencyId: agencyState.id,
      agencyName: agencyState.name,
      agencyShort: agencyState.short,
      name,
      email,
      role: agencyState.id === 'dmw' ? newUserRole : 'Agency Focal',
      status: 'ACTIVE',
      contactNumber: newUserContact.trim(),
      lastLoginAt: nowIso,
    }

    setAssociatedAccounts((prev) => [nextUser, ...prev])
    setCurrentPage(1)
    closeCreateUserModal()
  }

  return (
    <div className="w-full pb-8 space-y-5">
      <div className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-500">
        <Link to="/system-admin/agencies" className="hover:text-[#0b5384] transition">Agencies</Link>
        <span className="mx-2">&gt;</span>
        <span>{agency.short}</span>
      </div>

      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className={pageHeadingStyles.pageTitle}>{agencyState.name}</h1>
          <p className={pageHeadingStyles.pageSubtitle}>Full agency profile, services, location, and associated accounts.</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={openEditModal}
            className="h-[34px] px-3 border border-[#0b5384] bg-[#0b5384] text-white text-[11px] font-bold rounded-[3px] hover:bg-[#09416a]"
          >
            Edit Agency
          </button>
          <button
            type="button"
            onClick={() => navigate('/system-admin/agencies')}
            className="h-[34px] px-3 border border-[#cbd5e1] bg-white text-slate-700 text-[11px] font-bold rounded-[3px] hover:bg-slate-50"
          >
            Back
          </button>
        </div>
      </header>

      <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <SummaryCard title="Agency Code" value={agencyState.short} />
        <SummaryCard title="Contact Number" value={agencyState.contact} />
        <SummaryCard title="Agency Email" value={agencyState.email} />
        <SummaryCard title="Total Services" value={String(agencyState.services.length)} />
        <SummaryCard title="Associated Accounts" value={String(associatedAccounts.length)} />
      </section>

      <section className="rounded-[4px] border border-[#d8dee8] bg-white p-5 shadow-sm space-y-4">
        <h2 className="text-[13px] font-extrabold uppercase tracking-[0.12em] text-[#0b5a8c]">Agency Information</h2>

        <div className="grid grid-cols-1 gap-4 xl:grid-cols-12">
          <div className="xl:col-span-7 space-y-4">
            <div className="rounded-[3px] border border-[#e2e8f0] bg-[#f8fafc] p-4">
              <div className="flex items-start gap-3">
                <div className="h-14 w-14 overflow-hidden rounded-full border border-[#d8dee8] bg-white">
                  <img src={agencyState.logoUrl} alt={`${agencyState.short} logo`} className="h-full w-full object-contain p-[2px]" />
                </div>
                <div>
                  <p className="text-[15px] font-bold text-slate-900">{agencyState.name}</p>
                  <p className="mt-0.5 text-[11px] font-extrabold uppercase tracking-[0.1em] text-slate-500">{agencyState.short}</p>
                </div>
              </div>
              <p className="mt-3 text-[13px] leading-6 text-slate-700">{agencyState.description || '-'}</p>
            </div>

            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <InfoItem label="Email" value={agencyState.email || '-'} />
              <InfoItem label="Contact Number" value={agencyState.contact || '-'} />
              <InfoItem label="Location Query" value={agencyState.locationQuery || '-'} />
              <InfoItem label="Compact Registry Name" value={compactAgency?.name || agencyState.name} />
            </div>
          </div>

          <aside className="xl:col-span-5">
            <div className="rounded-[3px] border border-[#e2e8f0] bg-white p-3">
              <div className="mb-2 flex items-center justify-between gap-2">
                <p className="text-[11px] font-extrabold uppercase tracking-[0.1em] text-slate-500">Map Preview</p>
                <a
                  href={mapLink}
                  target="_blank"
                  rel="noreferrer"
                  className="text-[11px] font-bold text-[#0b5384] hover:underline"
                >
                  Open in Google Maps
                </a>
              </div>
              <div className="overflow-hidden rounded-[3px] border border-[#d8dee8]">
                <iframe
                  title={`${agencyState.name} location`}
                  src={mapEmbedSrc}
                  className="h-[260px] w-full"
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                />
              </div>
            </div>
          </aside>
        </div>
      </section>

      <section className="rounded-[4px] border border-[#d8dee8] bg-white p-5 shadow-sm space-y-3">
        <h2 className="text-[13px] font-extrabold uppercase tracking-[0.12em] text-[#0b5a8c]">Services Offered</h2>
        <p className="text-[13px] text-slate-600">All services currently registered under this agency.</p>

        {agencyState.services.length > 0 ? (
          <div className="space-y-3">
            {agencyState.services.map((service) => (
              <article key={service.id} className="rounded-[3px] border border-[#e2e8f0] bg-[#f8fafc] p-4">
                <p className="text-[14px] font-bold text-slate-900">{service.title}</p>
                <p className="mt-1 text-[13px] leading-6 text-slate-700">{service.description}</p>
                <p className="mt-3 text-[10px] font-extrabold uppercase tracking-[0.1em] text-slate-500">Required Documents</p>
                {service.requiredDocuments.length > 0 ? (
                  <ul className="mt-2 list-disc pl-5 text-[12px] leading-6 text-slate-700">
                    {service.requiredDocuments.map((document) => (
                      <li key={`${service.id}-${document}`}>{document}</li>
                    ))}
                  </ul>
                ) : (
                  <p className="mt-1 text-[12px] text-slate-500">No required documents listed.</p>
                )}
              </article>
            ))}
          </div>
        ) : (
          <div className="rounded-[3px] border border-dashed border-[#cbd5e1] p-4 text-[12px] text-slate-500">
            No services are currently listed for this agency.
          </div>
        )}
      </section>

      <section className="rounded-[4px] border border-[#d8dee8] bg-white p-4 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-[13px] font-extrabold uppercase tracking-[0.12em] text-[#0b5a8c]">Associated Accounts</h2>
            <p className="mt-1 text-[13px] text-slate-600">These are user accounts linked to this agency.</p>
          </div>
          <button
            type="button"
            onClick={openCreateUserModal}
            className="h-[34px] px-3 border border-[#0b5384] bg-[#0b5384] text-white text-[11px] font-bold rounded-[3px] hover:bg-[#09416a]"
          >
            + New User
          </button>
        </div>
      </section>

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
        rowsPerPageOptions={[5, 10, 25]}
        onPageChange={(page) => setCurrentPage(Math.min(Math.max(page, 1), totalPages))}
        onRowsPerPageChange={(rowsCount) => {
          setRowsPerPage(rowsCount)
          setCurrentPage(1)
        }}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        searchPlaceholder="Search by name, email, role, status, or contact..."
        searchValue={searchValue}
        onSearchChange={(value) => {
          setSearchValue(value)
          setCurrentPage(1)
        }}
        onAdvancedFilters={undefined}
        onNewRecord={undefined}
      />

      {isCreateUserModalOpen ? (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/50 px-4">
          <div className="w-full max-w-xl rounded-[4px] border border-[#cbd5e1] bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-[#e2e8f0] px-5 py-4">
              <div>
                <h3 className="text-[16px] font-bold text-slate-900">Create Associated Account</h3>
                <p className="mt-1 text-[12px] text-slate-500">Agency: {agencyState.name}</p>
              </div>
              <button
                type="button"
                onClick={closeCreateUserModal}
                className="rounded-[3px] border border-slate-300 bg-slate-50 px-2 py-1 text-[11px] font-bold text-slate-600 hover:bg-slate-100"
              >
                Close
              </button>
            </div>

            <div className="space-y-4 px-5 py-5">
              <div>
                <label className="mb-1.5 block text-[12px] font-bold uppercase tracking-wider text-[#64748b]">Full Name</label>
                <input
                  type="text"
                  value={newUserName}
                  onChange={(event) => setNewUserName(event.target.value)}
                  className="w-full rounded-[3px] border border-[#cbd5e1] bg-white px-3 py-2 text-[13px] font-semibold text-slate-700 outline-none focus:ring-1 focus:ring-[#0b5384]"
                  placeholder="Enter full name"
                />
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-[12px] font-bold uppercase tracking-wider text-[#64748b]">Email</label>
                  <input
                    type="email"
                    value={newUserEmail}
                    onChange={(event) => setNewUserEmail(event.target.value)}
                    className="w-full rounded-[3px] border border-[#cbd5e1] bg-white px-3 py-2 text-[13px] font-semibold text-slate-700 outline-none focus:ring-1 focus:ring-[#0b5384]"
                    placeholder="Enter user email"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-[12px] font-bold uppercase tracking-wider text-[#64748b]">Contact Number</label>
                  <CountryCodePhoneInput value={newUserContact} onChange={setNewUserContact} />
                </div>
              </div>

              {agencyState.id === 'dmw' ? (
                <div>
                  <label className="mb-1.5 block text-[12px] font-bold uppercase tracking-wider text-[#64748b]">Role</label>
                  <select
                    value={newUserRole}
                    onChange={(event) => setNewUserRole(event.target.value as 'Agency Focal' | 'Case Manager')}
                    className="w-full rounded-[3px] border border-[#cbd5e1] bg-white px-3 py-2 text-[13px] font-semibold text-slate-700 outline-none focus:ring-1 focus:ring-[#0b5384]"
                  >
                    <option value="Agency Focal">Focal Person</option>
                    <option value="Case Manager">Case Manager</option>
                  </select>
                </div>
              ) : null}
            </div>

            <div className="flex items-center justify-end gap-2 border-t border-[#e2e8f0] px-5 py-4">
              <button
                type="button"
                onClick={closeCreateUserModal}
                className="h-[34px] rounded-[3px] border border-slate-300 bg-slate-50 px-3 text-[12px] font-bold text-slate-700 hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={saveNewUser}
                className="h-[34px] rounded-[3px] bg-[#0b5384] px-4 text-[12px] font-bold text-white hover:bg-[#09416a]"
              >
                Create User
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {isEditModalOpen ? (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/50 px-4">
          <div className="w-full max-w-2xl rounded-[4px] border border-[#cbd5e1] bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-[#e2e8f0] px-5 py-4">
              <div>
                <h3 className="text-[16px] font-bold text-slate-900">Edit Agency Details</h3>
                <p className="mt-1 text-[12px] text-slate-500">Agency: {agencyState.name}</p>
              </div>
              <button
                type="button"
                onClick={closeEditModal}
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
                  <CountryCodePhoneInput value={editContactNumber} onChange={setEditContactNumber} />
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

              <div>
                <label className="mb-1.5 block text-[12px] font-bold uppercase tracking-wider text-[#64748b]">Map Location Query</label>
                <input
                  type="text"
                  value={editLocationQuery}
                  onChange={(event) => setEditLocationQuery(event.target.value)}
                  className="w-full rounded-[3px] border border-[#cbd5e1] bg-white px-3 py-2 text-[13px] font-semibold text-slate-700 outline-none focus:ring-1 focus:ring-[#0b5384]"
                  placeholder="Enter map location query"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 border-t border-[#e2e8f0] px-5 py-4">
              <button
                type="button"
                onClick={closeEditModal}
                className="h-[34px] rounded-[3px] border border-slate-300 bg-slate-50 px-3 text-[12px] font-bold text-slate-700 hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={saveAgencyDetails}
                className="h-[34px] rounded-[3px] bg-[#0b5384] px-4 text-[12px] font-bold text-white hover:bg-[#09416a]"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}

function SummaryCard({ title, value }: { title: string; value: string }) {
  return (
    <div className="rounded-[4px] border border-[#cbd5e1] bg-white px-4 py-4 shadow-sm">
      <p className={pageHeadingStyles.metricLabel}>{title}</p>
      <p className="mt-2 text-[14px] leading-5 font-black text-[#0f172a] break-words">{value}</p>
    </div>
  )
}

function InfoItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[3px] border border-[#e2e8f0] bg-white px-3 py-2">
      <p className="text-[10px] font-extrabold uppercase tracking-[0.1em] text-slate-500">{label}</p>
      <p className="mt-1 text-[12px] font-semibold text-slate-700 break-words">{value}</p>
    </div>
  )
}
