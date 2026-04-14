import { useMemo, useState } from 'react'
import { AGENCIES_DATA } from '../../data/agenciesData'
import { AppButton } from '../../components/ui/AppButton'
import { UnifiedTable, type Column, type FilterChip } from '../../components/ui/UnifiedTable'
import { pageHeadingStyles } from './pageHeadingStyles'

type ServiceRow = {
  id: string
  title: string
  description: string
  requiredDocuments: string[]
  status: 'Active' | 'Inactive'
  updatedAt: string
}

const serviceUpdatedAt: Record<string, string> = {
  edsp: 'Apr 08, 2026',
  calamity: 'Apr 07, 2026',
}

export default function ServicesPage() {
  const [searchValue, setSearchValue] = useState('')
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list')
  const [isFiltersOpen, setIsFiltersOpen] = useState(false)
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all')
  const [selectedServiceId, setSelectedServiceId] = useState<string | null>(null)
  const [draftTitle, setDraftTitle] = useState('')
  const [draftDescription, setDraftDescription] = useState('')
  const [draftStatus, setDraftStatus] = useState<'Active' | 'Inactive'>('Active')
  const [draftRequirements, setDraftRequirements] = useState<string[]>([])
  const [newRequirement, setNewRequirement] = useState('')
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [serviceIdToDelete, setServiceIdToDelete] = useState<string | null>(null)
  const [newServiceTitle, setNewServiceTitle] = useState('')
  const [newServiceDescription, setNewServiceDescription] = useState('')
  const [newServiceStatus, setNewServiceStatus] = useState<'Active' | 'Inactive'>('Active')
  const [newServiceRequirements, setNewServiceRequirements] = useState<string[]>([])
  const [newServiceRequirementInput, setNewServiceRequirementInput] = useState('')

  const owwaAgency = AGENCIES_DATA.find((agency) => agency.id === 'owwa')

  const initialServices = useMemo<ServiceRow[]>(() => {
    if (!owwaAgency) {
      return []
    }

    return owwaAgency.services.map((service) => ({
      id: service.id,
      title: service.title,
      description: service.description,
      requiredDocuments: service.requiredDocuments,
      status: 'Active',
      updatedAt: serviceUpdatedAt[service.id] ?? 'Apr 01, 2026',
    }))
  }, [owwaAgency])

  const [servicesData, setServicesData] = useState<ServiceRow[]>(initialServices)

  const selectedService = useMemo(
    () => servicesData.find((service) => service.id === selectedServiceId) ?? null,
    [selectedServiceId, servicesData],
  )

  const serviceToDelete = useMemo(
    () => servicesData.find((service) => service.id === serviceIdToDelete) ?? null,
    [serviceIdToDelete, servicesData],
  )

  const filteredServices = useMemo(() => {
    const query = searchValue.trim().toLowerCase()

    return servicesData.filter((service) => {
      if (statusFilter === 'active' && service.status !== 'Active') {
        return false
      }

      if (statusFilter === 'inactive' && service.status !== 'Inactive') {
        return false
      }

      if (!query) {
        return true
      }

      const searchableText = [
        service.title,
        service.description,
        service.requiredDocuments.join(' '),
      ]
        .join(' ')
        .toLowerCase()

      return searchableText.includes(query)
    })
  }, [searchValue, servicesData, statusFilter])

  const activeFilters = useMemo<FilterChip[]>(() => {
    const filters: FilterChip[] = []

    if (statusFilter === 'active') {
      filters.push({ key: 'status', label: 'Status', value: 'Active' })
    }

    if (statusFilter === 'inactive') {
      filters.push({ key: 'status', label: 'Status', value: 'Inactive' })
    }

    return filters
  }, [statusFilter])

  const totalRequirements = servicesData.reduce(
    (sum, service) => sum + service.requiredDocuments.length,
    0,
  )

  const getTodayLabel = () =>
    new Date().toLocaleDateString('en-US', {
      month: 'short',
      day: '2-digit',
      year: 'numeric',
    })

  const openServiceDetails = (service: ServiceRow) => {
    setSelectedServiceId(service.id)
    setDraftTitle(service.title)
    setDraftDescription(service.description)
    setDraftStatus(service.status)
    setDraftRequirements(service.requiredDocuments)
    setNewRequirement('')
  }

  const closeServiceDetails = () => {
    setSelectedServiceId(null)
    setDraftTitle('')
    setDraftDescription('')
    setDraftStatus('Active')
    setDraftRequirements([])
    setNewRequirement('')
  }

  const saveServiceDetails = () => {
    if (!selectedServiceId) {
      return
    }

    setServicesData((prev) =>
      prev.map((service) =>
        service.id === selectedServiceId
          ? {
              ...service,
              title: draftTitle.trim() || service.title,
              description: draftDescription.trim() || service.description,
              status: draftStatus,
              requiredDocuments: draftRequirements,
              updatedAt: getTodayLabel(),
            }
          : service,
      ),
    )

    closeServiceDetails()
  }

  const addRequirement = () => {
    const trimmedRequirement = newRequirement.trim()

    if (!trimmedRequirement) {
      return
    }

    if (draftRequirements.some((requirement) => requirement.toLowerCase() === trimmedRequirement.toLowerCase())) {
      return
    }

    setDraftRequirements((prev) => [...prev, trimmedRequirement])
    setNewRequirement('')
  }

  const removeRequirement = (requirementToRemove: string) => {
    setDraftRequirements((prev) => prev.filter((requirement) => requirement !== requirementToRemove))
  }

  const removeFilter = (filter: FilterChip) => {
    if (filter.key === 'status') {
      setStatusFilter('all')
    }
  }

  const confirmDeleteService = () => {
    if (!serviceIdToDelete) {
      return
    }

    setServicesData((prev) => prev.filter((service) => service.id !== serviceIdToDelete))

    if (selectedServiceId === serviceIdToDelete) {
      closeServiceDetails()
    }

    setServiceIdToDelete(null)
  }

  const addNewServiceRequirement = () => {
    const trimmedRequirement = newServiceRequirementInput.trim()

    if (!trimmedRequirement) {
      return
    }

    if (
      newServiceRequirements.some(
        (requirement) => requirement.toLowerCase() === trimmedRequirement.toLowerCase(),
      )
    ) {
      return
    }

    setNewServiceRequirements((prev) => [...prev, trimmedRequirement])
    setNewServiceRequirementInput('')
  }

  const removeNewServiceRequirement = (requirementToRemove: string) => {
    setNewServiceRequirements((prev) =>
      prev.filter((requirement) => requirement !== requirementToRemove),
    )
  }

  const closeCreateModal = () => {
    setIsCreateModalOpen(false)
    setNewServiceTitle('')
    setNewServiceDescription('')
    setNewServiceStatus('Active')
    setNewServiceRequirements([])
    setNewServiceRequirementInput('')
  }

  const createService = () => {
    const title = newServiceTitle.trim()
    const description = newServiceDescription.trim()

    if (!title || !description || newServiceRequirements.length === 0) {
      return
    }

    const generatedId = `${title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '')}-${Date.now()}`

    const createdService: ServiceRow = {
      id: generatedId,
      title,
      description,
      requiredDocuments: newServiceRequirements,
      status: newServiceStatus,
      updatedAt: getTodayLabel(),
    }

    setServicesData((prev) => [createdService, ...prev])
    closeCreateModal()
  }

  const columns: Column<ServiceRow>[] = [
    {
      key: 'title',
      title: 'SERVICE PROGRAM',
      render: (row) => <p className="text-[13px] font-bold text-slate-800 leading-snug">{row.title}</p>,
    },
    {
      key: 'description',
      title: 'DESCRIPTION',
      render: (row) => <p className="text-[13px] text-slate-600 leading-relaxed">{row.description}</p>,
    },
    {
      key: 'requiredDocuments',
      title: 'REQUIRED DOCUMENTS',
      render: (row) => (
        <div className="flex flex-wrap gap-1.5">
          {row.requiredDocuments.slice(0, 3).map((document) => (
            <span
              key={document}
              className="inline-flex items-center rounded-[2px] bg-[#eff6ff] px-2 py-1 text-[11px] font-bold text-[#0b5384]"
            >
              {document}
            </span>
          ))}
          {row.requiredDocuments.length > 3 ? (
            <span className="inline-flex items-center rounded-[2px] bg-slate-100 px-2 py-1 text-[11px] font-bold text-slate-600">
              +{row.requiredDocuments.length - 3} more
            </span>
          ) : null}
        </div>
      ),
    },
    {
      key: 'status',
      title: 'STATUS',
      className: 'whitespace-nowrap',
      render: (row) => (
        <span className={`inline-flex items-center rounded-[2px] border px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide ${row.status === 'Active' ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-slate-300 bg-slate-100 text-slate-700'}`}>
          {row.status}
        </span>
      ),
    },
    {
      key: 'updatedAt',
      title: 'LAST UPDATED',
      className: 'whitespace-nowrap',
      render: (row) => <span className="text-[13px] text-slate-500">{row.updatedAt}</span>,
    },
    {
      key: 'action',
      title: 'ACTIONS',
      className: 'text-right whitespace-nowrap',
      render: (row) => (
        <div className="flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={() => openServiceDetails(row)}
            className="h-[32px] rounded-[3px] border border-[#cbd5e1] bg-white px-3 text-[12px] font-bold text-slate-700 transition-colors hover:bg-slate-50"
          >
            Edit
          </button>
          <button
            type="button"
            onClick={() => setServiceIdToDelete(row.id)}
            className="h-[32px] rounded-[3px] border border-red-200 bg-red-50 px-3 text-[12px] font-bold text-red-700 transition-colors hover:bg-red-100"
          >
            Delete
          </button>
        </div>
      ),
    },
  ]

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-4">
      <header className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className={`${pageHeadingStyles.pageTitle} mb-1`}>
            Agency Services
          </h1>
          <p className={pageHeadingStyles.pageSubtitle}>
            Current OWWA services published on the public portal are listed here for internal reference. Case Managers should use this list as the standard reference when requesting services from any agency.
          </p>
        </div>
      </header>

      <section className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className={`${pageHeadingStyles.metricLabel} mb-2`}>Total Services</p>
          <p className="text-3xl font-black text-slate-800">{servicesData.length}</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className={`${pageHeadingStyles.metricLabel} mb-2`}>Active Services</p>
          <p className="text-3xl font-black text-emerald-700">{servicesData.filter((service) => service.status === 'Active').length}</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className={`${pageHeadingStyles.metricLabel} mb-2`}>Total Requirements</p>
          <p className="text-3xl font-black text-slate-800">{totalRequirements}</p>
        </div>
      </section>

      <UnifiedTable
        variant="default"
        data={filteredServices}
        columns={columns}
        keyExtractor={(row) => row.id}
        searchPlaceholder="Search services, descriptions, or requirements..."
        searchValue={searchValue}
        onSearchChange={setSearchValue}
        onAdvancedFilters={() => setIsFiltersOpen((prev) => !prev)}
        isAdvancedFiltersOpen={isFiltersOpen}
        advancedFiltersContent={(
          <>
            <div className="mb-4 flex items-center justify-between">
              <h3 className="flex items-center gap-2 text-[14px] font-bold text-slate-800">
                <span className="material-symbols-outlined text-[18px]">filter_alt</span>
                Apply Filters
              </h3>
              <button
                type="button"
                onClick={() => setIsFiltersOpen(false)}
                className="text-slate-400 transition-colors hover:text-slate-600"
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="mb-1.5 block text-[12px] font-bold uppercase tracking-wider text-[#64748b]">Status</label>
                <select
                  value={statusFilter}
                  onChange={(event) => {
                    const value = event.target.value as 'all' | 'active' | 'inactive'
                    setStatusFilter(value)
                  }}
                  className="w-full rounded-[3px] border border-[#cbd5e1] bg-slate-50 px-3 py-2 text-[13px] font-bold text-slate-700 outline-none transition focus:border-[#0b5384] focus:ring-1 focus:ring-[#0b5384]"
                >
                  <option value="all">All Statuses</option>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>

              <button
                type="button"
                className="mt-2 flex h-[38px] w-full items-center justify-center rounded-[3px] border border-[#cbd5e1] text-[13px] font-bold text-[#0b5384] transition hover:bg-slate-50"
                onClick={() => {
                  setStatusFilter('all')
                }}
              >
                Clear Attributes
              </button>
            </div>
          </>
        )}
        onNewRecord={() => setIsCreateModalOpen(true)}
        newRecordLabel="+ New Service"
        activeFilters={activeFilters}
        onRemoveFilter={removeFilter}
        onClearFilters={() => {
          setStatusFilter('all')
        }}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        hidePagination
        totalRecords={filteredServices.length}
        startIndex={filteredServices.length > 0 ? 1 : 0}
        endIndex={filteredServices.length}
      />

      {selectedService ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4">
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-xl border border-slate-200 bg-white shadow-xl">
            <div className="border-b border-slate-200 px-6 py-5">
              <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.14em] text-slate-500">Edit Service</p>
              <h2 className="text-xl font-extrabold text-slate-900">{selectedService.title}</h2>
            </div>

            <div className="space-y-6 px-6 py-5">
              <div>
                <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.14em] text-slate-500">Service Title</p>
                <input
                  type="text"
                  value={draftTitle}
                  onChange={(event) => setDraftTitle(event.target.value)}
                  placeholder="Enter service title"
                  className="h-[40px] w-full rounded-[3px] border border-slate-300 px-3 text-[13px] text-slate-700 outline-none focus:ring-1 focus:ring-[#0b5384]"
                />
              </div>

              <div>
                <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.14em] text-slate-500">Description</p>
                <textarea
                  value={draftDescription}
                  onChange={(event) => setDraftDescription(event.target.value)}
                  placeholder="Enter service description"
                  rows={3}
                  className="w-full rounded-[3px] border border-slate-300 px-3 py-2 text-[13px] text-slate-700 outline-none focus:ring-1 focus:ring-[#0b5384]"
                />
              </div>

              <div>
                <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.14em] text-slate-500">Status</p>
                <select
                  value={draftStatus}
                  onChange={(event) => setDraftStatus(event.target.value as 'Active' | 'Inactive')}
                  className="h-[40px] w-full rounded-[3px] border border-slate-300 px-3 text-[13px] text-slate-700 outline-none focus:ring-1 focus:ring-[#0b5384]"
                >
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                </select>
              </div>

              <div>
                <p className="mb-3 text-[11px] font-bold uppercase tracking-[0.14em] text-slate-500">Requirements</p>
                <div className="space-y-2">
                  {draftRequirements.map((requirement) => (
                    <div
                      key={requirement}
                      className="flex items-center justify-between rounded-[3px] border border-slate-200 bg-slate-50 px-3 py-2"
                    >
                      <p className="pr-4 text-sm text-slate-700">{requirement}</p>
                      <button
                        type="button"
                        className="text-[12px] font-bold text-red-600 hover:text-red-700"
                        onClick={() => removeRequirement(requirement)}
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.14em] text-slate-500">Add Requirement</p>
                <div className="flex flex-col gap-2 sm:flex-row">
                  <input
                    type="text"
                    value={newRequirement}
                    onChange={(event) => setNewRequirement(event.target.value)}
                    placeholder="Enter a new required document"
                    className="h-[40px] flex-1 rounded-[3px] border border-slate-300 px-3 text-[13px] text-slate-700 outline-none focus:ring-1 focus:ring-[#0b5384]"
                  />
                  <AppButton type="button" className="h-[40px] px-4" onClick={addRequirement}>
                    Add
                  </AppButton>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 border-t border-slate-200 px-6 py-4">
              <AppButton type="button" variant="outline" className="h-[36px] px-4" onClick={closeServiceDetails}>
                Cancel
              </AppButton>
              <AppButton type="button" className="h-[36px] px-4" onClick={saveServiceDetails}>
                Save Changes
              </AppButton>
            </div>
          </div>
        </div>
      ) : null}

      {isCreateModalOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4">
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-xl border border-slate-200 bg-white shadow-xl">
            <div className="border-b border-slate-200 px-6 py-5">
              <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.14em] text-slate-500">Create Service</p>
              <h2 className="text-xl font-extrabold text-slate-900">Add New OWWA Service</h2>
            </div>

            <div className="space-y-6 px-6 py-5">
              <div>
                <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.14em] text-slate-500">Service Title</p>
                <input
                  type="text"
                  value={newServiceTitle}
                  onChange={(event) => setNewServiceTitle(event.target.value)}
                  placeholder="Enter service title"
                  className="h-[40px] w-full rounded-[3px] border border-slate-300 px-3 text-[13px] text-slate-700 outline-none focus:ring-1 focus:ring-[#0b5384]"
                />
              </div>

              <div>
                <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.14em] text-slate-500">Description</p>
                <textarea
                  value={newServiceDescription}
                  onChange={(event) => setNewServiceDescription(event.target.value)}
                  placeholder="Enter service description"
                  rows={3}
                  className="w-full rounded-[3px] border border-slate-300 px-3 py-2 text-[13px] text-slate-700 outline-none focus:ring-1 focus:ring-[#0b5384]"
                />
              </div>

              <div>
                <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.14em] text-slate-500">Status</p>
                <select
                  value={newServiceStatus}
                  onChange={(event) => setNewServiceStatus(event.target.value as 'Active' | 'Inactive')}
                  className="h-[40px] w-full rounded-[3px] border border-slate-300 px-3 text-[13px] text-slate-700 outline-none focus:ring-1 focus:ring-[#0b5384]"
                >
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                </select>
              </div>

              <div>
                <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.14em] text-slate-500">Required Documents</p>
                <div className="mb-3 flex flex-col gap-2 sm:flex-row">
                  <input
                    type="text"
                    value={newServiceRequirementInput}
                    onChange={(event) => setNewServiceRequirementInput(event.target.value)}
                    placeholder="Enter a required document"
                    className="h-[40px] flex-1 rounded-[3px] border border-slate-300 px-3 text-[13px] text-slate-700 outline-none focus:ring-1 focus:ring-[#0b5384]"
                  />
                  <AppButton type="button" className="h-[40px] px-4" onClick={addNewServiceRequirement}>
                    Add Requirement
                  </AppButton>
                </div>

                <div className="space-y-2">
                  {newServiceRequirements.map((requirement) => (
                    <div
                      key={requirement}
                      className="flex items-center justify-between rounded-[3px] border border-slate-200 bg-slate-50 px-3 py-2"
                    >
                      <p className="pr-4 text-sm text-slate-700">{requirement}</p>
                      <button
                        type="button"
                        className="text-[12px] font-bold text-red-600 hover:text-red-700"
                        onClick={() => removeNewServiceRequirement(requirement)}
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                  {newServiceRequirements.length === 0 ? (
                    <p className="text-[12px] text-slate-500">Add at least one required document to create a service.</p>
                  ) : null}
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 border-t border-slate-200 px-6 py-4">
              <AppButton type="button" variant="outline" className="h-[36px] px-4" onClick={closeCreateModal}>
                Cancel
              </AppButton>
              <AppButton type="button" className="h-[36px] px-4" onClick={createService}>
                Create Service
              </AppButton>
            </div>
          </div>
        </div>
      ) : null}

      {serviceToDelete ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4">
          <div className="w-full max-w-md rounded-xl border border-slate-200 bg-white shadow-xl">
            <div className="border-b border-slate-200 px-6 py-5">
              <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.14em] text-red-600">Delete Service</p>
              <h2 className="text-xl font-extrabold text-slate-900">Confirm Service Deletion</h2>
            </div>

            <div className="px-6 py-5">
              <p className="text-sm leading-relaxed text-slate-600">
                You are about to delete <span className="font-bold text-slate-900">{serviceToDelete.title}</span>. This action cannot be undone.
              </p>
            </div>

            <div className="flex justify-end gap-2 border-t border-slate-200 px-6 py-4">
              <AppButton
                type="button"
                variant="outline"
                className="h-[36px] px-4"
                onClick={() => setServiceIdToDelete(null)}
              >
                Cancel
              </AppButton>
              <AppButton
                type="button"
                className="h-[36px] bg-red-600 px-4 hover:bg-red-700"
                onClick={confirmDeleteService}
              >
                Delete Service
              </AppButton>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}