import { useMemo, useState, type ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { UnifiedTable, type Column, type FilterChip } from '../../components/ui/UnifiedTable'
import { pageHeadingStyles } from '../agency/pageHeadingStyles'
import { getStatusBadgeClass } from '../agency/statusBadgeStyles'
import {
  formatDisplayDateTime,
  getCaseManagerAgencies,
  getCaseNarrativeBySeed,
  getStakeholderServices,
  resolveStakeholderService,
  toCaseHealthStatus,
  type CaseManagerReferral,
} from '../../data/unifiedData'
import { createManagedReferral, getManagedCases, getManagedLatestMilestone, getManagedReferrals } from '../../data/caseLifecycleStore'

type StatusFilter = 'ALL' | 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'REJECTED'

export default function ReferralsPage() {
  const navigate = useNavigate()
  const [refreshKey, setRefreshKey] = useState(0)
  const agencies = useMemo(() => getCaseManagerAgencies(), [])
  const openCases = useMemo(
    () => getManagedCases().filter((item) => toCaseHealthStatus(item.status) === 'OPEN'),
    [refreshKey],
  )
  const initialCase = openCases[0]
  const initialAgencyId = initialCase?.agencyId ?? agencies[0]?.id ?? ''
  const rows = useMemo<CaseManagerReferral[]>(() => getManagedReferrals(), [refreshKey])
  const [searchValue, setSearchValue] = useState('')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('ALL')
  const [isFilterOpen, setIsFilterOpen] = useState(false)
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [createStep, setCreateStep] = useState<1 | 2 | 3>(1)

  const [selectedCaseId, setSelectedCaseId] = useState(initialCase?.id ?? '')
  const [selectedAgencyId, setSelectedAgencyId] = useState(initialAgencyId)
  const [serviceValue, setServiceValue] = useState(resolveStakeholderService(initialAgencyId, initialCase?.service))
  const [remarksValue, setRemarksValue] = useState('')
  const [notesValue, setNotesValue] = useState('')
  const [uploadedDocuments, setUploadedDocuments] = useState<File[]>([])

  const availableServices = useMemo(() => getStakeholderServices(selectedAgencyId), [selectedAgencyId])

  const filteredRows = useMemo(() => {
    const query = searchValue.trim().toLowerCase()

    return rows.filter((item) => {
      const matchesSearch =
        query.length === 0 ||
        [item.caseNo, item.clientName, item.service, item.agencyName, item.remarks, item.notes].join(' ').toLowerCase().includes(query)
      const matchesStatus = statusFilter === 'ALL' || item.status === statusFilter
      return matchesSearch && matchesStatus
    })
  }, [rows, searchValue, statusFilter])

  const activeFilters: FilterChip[] = useMemo(() => {
    return statusFilter === 'ALL' ? [] : [{ key: 'status', label: 'Status', value: statusFilter }]
  }, [statusFilter])

  const kpis = useMemo(() => {
    return {
      total: rows.length,
      pending: rows.filter((item) => item.status === 'PENDING').length,
      processing: rows.filter((item) => item.status === 'PROCESSING').length,
      completed: rows.filter((item) => item.status === 'COMPLETED').length,
    }
  }, [rows])

  const latestUpdateByReferralId = useMemo(() => {
    return rows.reduce<Record<string, string>>((acc, row) => {
      const milestone = getManagedLatestMilestone(row.id, '')
      acc[row.id] =
        milestone ||
        (row.status === 'PENDING'
          ? 'Awaiting agency acceptance'
          : row.status === 'PROCESSING'
            ? 'Referral is being processed'
            : row.status === 'COMPLETED'
              ? 'Referral completed by agency'
              : 'Referral returned by agency')
      return acc
    }, {})
  }, [rows])

  const columns: Column<CaseManagerReferral>[] = [
    {
      key: 'caseNo',
      title: 'TRACKING ID',
      render: (row) => <span className="text-[13px] font-extrabold text-[#0b5384]">{row.caseNo}</span>,
    },
    {
      key: 'clientName',
      title: 'CLIENT NAME',
      render: (row) => <span className="text-[13px] font-semibold text-slate-700">{row.clientName}</span>,
    },
    {
      key: 'agencyName',
      title: 'AGENCY',
      render: (row) => <span className="text-[13px] text-slate-700">{row.agencyName}</span>,
    },
    {
      key: 'service',
      title: 'SERVICE',
      render: (row) => <span className="text-[13px] text-slate-600">{row.service}</span>,
    },
    {
      key: 'latestUpdate',
      title: 'LATEST UPDATE',
      render: (row) => <span className="text-[12px] text-slate-700">{latestUpdateByReferralId[row.id]}</span>,
    },
    {
      key: 'status',
      title: 'STATUS',
      className: 'whitespace-nowrap',
      render: (row) => (
        <span className={`inline-flex rounded-[2px] border px-2 py-0.5 text-[10px] font-extrabold tracking-wide ${getStatusBadgeClass(row.status)}`}>
          {row.status}
        </span>
      ),
    },
    {
      key: 'updatedAt',
      title: 'LAST UPDATED',
      render: (row) => <span className="text-[12px] text-slate-500">{formatDisplayDateTime(row.updatedAt)}</span>,
    },
    {
      key: 'actions',
      title: 'ACTIONS',
      className: 'whitespace-nowrap text-right',
      render: (row) => (
        <div className="flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={() => navigate(`/case-manager/referrals/${row.id}`, { state: { referral: row } })}
            className="h-8 rounded-[3px] border border-slate-300 bg-slate-100 px-3 text-[11px] font-bold text-slate-700 hover:bg-slate-200"
          >
            View
          </button>
        </div>
      ),
    },
  ]

  const selectedCase = openCases.find((item) => item.id === selectedCaseId)
  const selectedAgency = agencies.find((item) => item.id === selectedAgencyId)
  const canCreate = Boolean(
    selectedCaseId &&
    selectedAgencyId &&
    serviceValue.trim().length > 0 &&
    availableServices.includes(serviceValue),
  )

  const isStepOneValid = Boolean(selectedCase)
  const isStepTwoValid = Boolean(selectedAgencyId)
  const isStepThreeValid = canCreate

  const openCreateWizard = () => {
    setCreateStep(1)
    setIsCreateOpen(true)
  }

  const closeCreateWizard = () => {
    setIsCreateOpen(false)
    setCreateStep(1)
    setNotesValue('')
    setUploadedDocuments([])
  }

  const goToNextStep = () => {
    if (createStep === 1 && isStepOneValid) {
      setCreateStep(2)
      return
    }

    if (createStep === 2 && isStepTwoValid) {
      setCreateStep(3)
    }
  }

  const goToPreviousStep = () => {
    if (createStep === 2) {
      setCreateStep(1)
      return
    }

    if (createStep === 3) {
      setCreateStep(2)
    }
  }

  const submitReferral = () => {
    if (!canCreate || !selectedCase) {
      return
    }

    if (!selectedAgency) {
      return
    }

    const nowIso = new Date().toISOString()
    const docs = uploadedDocuments.map((file, index) => ({
      id: `doc-${selectedCase.id}-${Date.now()}-${index}`,
      name: file.name,
      uploadedBy: 'Case Manager - Marychris M. Relon',
      uploadedAt: nowIso,
    }))

    const newRow: CaseManagerReferral = {
      id: `ref-${selectedCase.id}-${Date.now()}`,
      caseId: selectedCase.id,
      caseNo: selectedCase.caseNo,
      clientName: selectedCase.clientName,
      service: resolveStakeholderService(selectedAgency.id, serviceValue.trim()),
      agencyId: selectedAgency.id,
      agencyName: selectedAgency.name,
      status: 'PENDING',
      createdAt: nowIso,
      updatedAt: nowIso,
      remarks: remarksValue.trim() || 'Referral created by Case Manager.',
      notes: notesValue.trim() || 'No additional notes provided.',
      documents: docs,
    }

    createManagedReferral(newRow)
    closeCreateWizard()
    setRemarksValue('')
    setNotesValue('')
    setUploadedDocuments([])
    setRefreshKey((prev) => prev + 1)
  }

  return (
    <div className="mx-auto max-w-7xl space-y-5 pb-4">
      <header>
        <h1 className={pageHeadingStyles.pageTitle}>Referrals</h1>
        <p className={pageHeadingStyles.pageSubtitle}>Refer cases to partner agencies and monitor status updates from intake to closure.</p>
      </header>

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard title="TOTAL REFERRALS" value={kpis.total} accent="border-[#0b5384]" />
        <KpiCard title="PENDING" value={kpis.pending} accent="border-[#f59e0b]" />
        <KpiCard title="PROCESSING" value={kpis.processing} accent="border-[#0284c7]" />
        <KpiCard title="COMPLETED" value={kpis.completed} accent="border-[#16a34a]" />
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
        searchPlaceholder="Search tracking ID, client, service, or agency..."
        searchValue={searchValue}
        onSearchChange={setSearchValue}
        onAdvancedFilters={() => setIsFilterOpen((prev) => !prev)}
        isAdvancedFiltersOpen={isFilterOpen}
        activeFilters={activeFilters}
        onRemoveFilter={() => setStatusFilter('ALL')}
        onClearFilters={() => setStatusFilter('ALL')}
        onNewRecord={openCreateWizard}
        newRecordLabel="+ New Referral"
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
                onChange={(event) => setStatusFilter(event.target.value as StatusFilter)}
                className="w-full rounded-[3px] border border-[#cbd5e1] bg-slate-50 px-3 py-2 text-[13px] font-bold text-slate-700 outline-none"
              >
                <option value="ALL">All</option>
                <option value="PENDING">Pending</option>
                <option value="PROCESSING">Processing</option>
                <option value="COMPLETED">Completed</option>
                <option value="REJECTED">Rejected</option>
              </select>
            </div>
          </div>
        )}
      />

      {isCreateOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4">
          <div className="w-full max-w-2xl rounded-[3px] border border-[#cbd5e1] bg-white shadow-xl">
            <div className="border-b border-[#e2e8f0] px-5 py-4">
              <h2 className="text-[16px] font-extrabold text-slate-900">Create Referral</h2>
              <p className="mt-1 text-[12px] text-slate-500">Complete each step to create a referral.</p>

              <div className="mt-4 grid grid-cols-3 gap-2">
                {[
                  { index: 1, label: 'Select Case' },
                  { index: 2, label: 'Select Agency' },
                  { index: 3, label: 'Select Service' },
                ].map((step) => {
                  const isActive = createStep === step.index
                  const isDone = createStep > step.index

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
              {createStep === 1 ? (
                <>
                  <FieldLabel label="Case" full>
                    <select
                      value={selectedCaseId}
                      disabled={openCases.length === 0}
                      onChange={(event) => {
                        const nextCase = openCases.find((item) => item.id === event.target.value)
                        setSelectedCaseId(event.target.value)
                        if (nextCase) {
                          setSelectedAgencyId(nextCase.agencyId)
                          setServiceValue(resolveStakeholderService(nextCase.agencyId, nextCase.service))
                        }
                      }}
                      className="h-10 w-full rounded-[3px] border border-[#cbd5e1] px-3 text-[13px] text-slate-700 outline-none"
                    >
                      {openCases.map((item) => (
                        <option key={item.id} value={item.id}>
                          {item.caseNo} - {item.clientName}
                        </option>
                      ))}
                      {openCases.length === 0 ? <option value="">No open cases available</option> : null}
                    </select>
                  </FieldLabel>

                  {selectedCase ? (
                    <div className="rounded-[3px] border border-[#e2e8f0] bg-slate-50 px-3 py-3 md:col-span-2">
                      <p className="mb-3 text-[11px] font-bold uppercase tracking-[0.08em] text-slate-600">Selected Case Details</p>
                      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                        <InfoRow label="Tracking ID" value={selectedCase.caseNo} />
                        <InfoRow label="Client Name" value={selectedCase.clientName} />
                        <InfoRow label="Client Type" value={selectedCase.clientType} />
                        <InfoRow label="Status" value={toCaseHealthStatus(selectedCase.status)} />
                        <InfoRow label="Date Created" value={formatDisplayDateTime(selectedCase.createdAt)} />
                        <div className="md:col-span-2">
                          <InfoRow label="Case Narrative" value={getCaseNarrativeBySeed(selectedCase.caseNo)} />
                        </div>
                      </div>
                    </div>
                  ) : null}

                  <div className="rounded-[3px] border border-[#e2e8f0] bg-slate-50 px-3 py-3 text-[12px] text-slate-600 md:col-span-2">
                    <p className="font-semibold text-slate-800">
                      {openCases.length === 0 ? 'No open cases available.' : 'No case yet?'}
                    </p>
                    <p className="mt-1">
                      {openCases.length === 0
                        ? 'Create a new case first, then continue referral creation.'
                        : 'Create a case first, then return here to continue the referral.'}
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        closeCreateWizard()
                        navigate('/case-manager/cases/new')
                      }}
                      className="mt-3 h-8 rounded-[3px] border border-[#0b5384]/30 bg-[#0b5384]/10 px-3 text-[11px] font-bold text-[#0b5384] hover:bg-[#0b5384]/20"
                    >
                      + Create Case
                    </button>
                  </div>
                </>
              ) : null}

              {createStep === 2 ? (
                <>
                  <FieldLabel label="Agency" full>
                    <select
                      value={selectedAgencyId}
                      onChange={(event) => {
                        const nextAgencyId = event.target.value
                        setSelectedAgencyId(nextAgencyId)
                        setServiceValue(resolveStakeholderService(nextAgencyId, serviceValue))
                      }}
                      className="h-10 w-full rounded-[3px] border border-[#cbd5e1] px-3 text-[13px] text-slate-700 outline-none"
                    >
                      {agencies.map((agency) => (
                        <option key={agency.id} value={agency.id}>
                          {agency.name}
                        </option>
                      ))}
                    </select>
                  </FieldLabel>

                  {selectedCase ? (
                    <div className="rounded-[3px] border border-[#e2e8f0] bg-slate-50 px-3 py-2 text-[12px] text-slate-600 md:col-span-2">
                      Selected case: <span className="font-semibold text-slate-800">{selectedCase.clientName}</span> ({selectedCase.caseNo})
                    </div>
                  ) : null}
                </>
              ) : null}

              {createStep === 3 ? (
                <>
                  <FieldLabel label="Service" full>
                    <select
                      value={serviceValue}
                      onChange={(event) => setServiceValue(event.target.value)}
                      disabled={!availableServices.length}
                      className="h-10 w-full rounded-[3px] border border-[#cbd5e1] px-3 text-[13px] text-slate-700 outline-none"
                    >
                      {availableServices.length ? (
                        availableServices.map((service) => (
                          <option key={service} value={service}>
                            {service}
                          </option>
                        ))
                      ) : (
                        <option value="">No available services for this stakeholder</option>
                      )}
                    </select>
                  </FieldLabel>

                  <FieldLabel label="Remarks" full>
                    <textarea
                      rows={4}
                      value={remarksValue}
                      onChange={(event) => setRemarksValue(event.target.value)}
                      placeholder="Optional context for the receiving agency"
                      className="w-full rounded-[3px] border border-[#cbd5e1] px-3 py-2 text-[13px] text-slate-700 outline-none"
                    />
                  </FieldLabel>

                  <FieldLabel label="Notes" full>
                    <textarea
                      rows={4}
                      value={notesValue}
                      onChange={(event) => setNotesValue(event.target.value)}
                      placeholder="Add referral notes for receiving agency context"
                      className="w-full rounded-[3px] border border-[#cbd5e1] px-3 py-2 text-[13px] text-slate-700 outline-none"
                    />
                  </FieldLabel>

                  <FieldLabel label="Referral Documents" full>
                    <input
                      type="file"
                      multiple
                      onChange={(event) => setUploadedDocuments(Array.from(event.target.files ?? []))}
                      className="block w-full rounded-[3px] border border-[#cbd5e1] bg-white px-3 py-2 text-[12px] text-slate-700"
                    />
                    {uploadedDocuments.length > 0 ? (
                      <div className="mt-2 space-y-1 rounded-[3px] border border-[#e2e8f0] bg-slate-50 px-3 py-2">
                        {uploadedDocuments.map((file) => (
                          <p key={file.name} className="text-[11px] text-slate-600">• {file.name}</p>
                        ))}
                      </div>
                    ) : null}
                  </FieldLabel>

                  <div className="rounded-[3px] border border-[#e2e8f0] bg-slate-50 px-3 py-2 text-[12px] text-slate-600 md:col-span-2">
                    <p>
                      Case: <span className="font-semibold text-slate-800">{selectedCase?.caseNo ?? '-'}</span>
                    </p>
                    <p>
                      Agency: <span className="font-semibold text-slate-800">{selectedAgency?.name ?? '-'}</span>
                    </p>
                  </div>
                </>
              ) : null}
            </div>

            <div className="flex justify-end gap-2 border-t border-[#e2e8f0] px-5 py-3">
              <button
                type="button"
                onClick={closeCreateWizard}
                className="h-9 rounded-[3px] border border-[#cbd5e1] px-3 text-[12px] font-bold text-slate-700"
              >
                Cancel
              </button>

              {createStep > 1 ? (
                <button
                  type="button"
                  onClick={goToPreviousStep}
                  className="h-9 rounded-[3px] border border-[#cbd5e1] px-3 text-[12px] font-bold text-slate-700"
                >
                  Back
                </button>
              ) : null}

              {createStep < 3 ? (
                <button
                  type="button"
                  onClick={goToNextStep}
                  disabled={(createStep === 1 && !isStepOneValid) || (createStep === 2 && !isStepTwoValid)}
                  className="h-9 rounded-[3px] bg-[#0b5384] px-3 text-[12px] font-bold text-white disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Next
                </button>
              ) : (
                <button
                  type="button"
                  onClick={submitReferral}
                  disabled={!isStepThreeValid}
                  className="h-9 rounded-[3px] bg-[#0b5384] px-3 text-[12px] font-bold text-white disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Submit Referral
                </button>
              )}
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

function FieldLabel({
  label,
  children,
  full = false,
}: {
  label: string
  children: ReactNode
  full?: boolean
}) {
  return (
    <div className={full ? 'md:col-span-2' : ''}>
      <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-[0.08em] text-slate-600">{label}</label>
      {children}
    </div>
  )
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[10px] font-bold uppercase tracking-[0.08em] text-slate-500">{label}</p>
      <p className="mt-1 text-[13px] font-semibold text-slate-700">{value}</p>
    </div>
  )
}
