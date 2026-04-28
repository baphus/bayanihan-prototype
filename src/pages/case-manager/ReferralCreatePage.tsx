import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { pageHeadingStyles } from '../agency/pageHeadingStyles'
import {
  formatDisplayDateTime,
  getCaseManagerAgencies,
  getCaseNarrativeBySeed,
  getStakeholderServiceDetails,
  getStakeholderServices,
  resolveStakeholderService,
  toCaseHealthStatus,
  type CaseManagerReferral,
} from '../../data/unifiedData'
import { createManagedReferral, getManagedCases } from '../../data/caseLifecycleStore'

export default function ReferralCreatePage() {
  const navigate = useNavigate()
  const agencies = useMemo(() => getCaseManagerAgencies(), [])
  const openCases = useMemo(() => getManagedCases().filter((item) => toCaseHealthStatus(item.status) === 'OPEN'), [])
  const initialCase = openCases[0]
  const initialAgencyId = initialCase?.agencyId ?? agencies[0]?.id ?? ''

  const [createStep, setCreateStep] = useState<1 | 2 | 3>(1)
  const [selectedCaseId, setSelectedCaseId] = useState(initialCase?.id ?? '')
  const [selectedAgencyId, setSelectedAgencyId] = useState(initialAgencyId)
  const [selectedServiceValues, setSelectedServiceValues] = useState<string[]>([])
  const [remarksValue, setRemarksValue] = useState('')
  const [notesValue, setNotesValue] = useState('')
  
  const [requirementUploads, setRequirementUploads] = useState<Record<string, File | null>>({})

  const selectedCase = openCases.find((item) => item.id === selectedCaseId)
  const selectedAgency = agencies.find((item) => item.id === selectedAgencyId)
  const availableServices = useMemo(() => getStakeholderServices(selectedAgencyId), [selectedAgencyId])
  const selectedServiceDetails = useMemo(() => {
    if (!selectedAgencyId || !selectedServiceValues.length) {
      return []
    }

    const selectedSet = new Set(selectedServiceValues)
    return getStakeholderServiceDetails(selectedAgencyId).filter((service) => selectedSet.has(service.title))
  }, [selectedAgencyId, selectedServiceValues])

  const selectedServiceRequirements = useMemo(() => {
    return selectedServiceDetails.flatMap((service) =>
      service.requiredDocuments.map((requirement) => ({
        key: buildServiceRequirementKey(service.title, requirement),
        serviceTitle: service.title,
        requirement,
      })),
    )
  }, [selectedServiceDetails])

  const missingRequirementKeys = useMemo(() => {
    return selectedServiceRequirements.filter((item) => !requirementUploads[item.key]).map((item) => item.key)
  }, [selectedServiceRequirements, requirementUploads])

  const hasMissingRequirementUploads = missingRequirementKeys.length > 0

  useEffect(() => {
    if (!availableServices.length) {
      setSelectedServiceValues([])
      return
    }

    setSelectedServiceValues((current) => {
      const valid = current.filter((service) => availableServices.includes(service))
      if (valid.length) {
        return valid
      }

      const defaultService = resolveStakeholderService(selectedAgencyId, selectedCase?.service)
      if (defaultService && availableServices.includes(defaultService)) {
        return [defaultService]
      }

      return [availableServices[0]]
    })
  }, [availableServices, selectedAgencyId, selectedCase?.service])

  useEffect(() => {
    const activeRequirementKeys = new Set(selectedServiceRequirements.map((item) => item.key))

    setRequirementUploads((current) => {
      const next = Object.fromEntries(
        Object.entries(current).filter(([key]) => activeRequirementKeys.has(key)),
      ) as Record<string, File | null>

      return Object.keys(next).length === Object.keys(current).length ? current : next
    })
  }, [selectedServiceRequirements])

  const canCreate = Boolean(
    selectedCaseId &&
    selectedAgencyId &&
    selectedServiceValues.length > 0 &&
    selectedServiceValues.every((service) => availableServices.includes(service)),
  )

  const isStepOneValid = Boolean(selectedCase)
  const isStepTwoValid = Boolean(selectedAgencyId)
  const isStepThreeValid = canCreate && !hasMissingRequirementUploads

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

  const toggleServiceSelection = (service: string) => {
    setSelectedServiceValues((current) => {
      if (current.includes(service)) {
        return current.filter((item) => item !== service)
      }

      return [...current, service]
    })
  }

  const submitReferral = () => {
    if (!canCreate || !selectedCase || !selectedAgency || hasMissingRequirementUploads) {
      return
    }

    const nowIso = new Date().toISOString()
    const docs = selectedServiceRequirements.flatMap((item, index) => {
      const attachedFile = requirementUploads[item.key]

      if (!attachedFile) {
        return []
      }

      return {
        id: `doc-${selectedCase.id}-${Date.now()}-${index}`,
        name: `${item.serviceTitle} - ${item.requirement}: ${attachedFile.name}`,
        uploadedBy: 'Case Manager - Marychris M. Relon',
        uploadedAt: nowIso,
      }
    })

    const newRow: CaseManagerReferral = {
      id: `ref-${selectedCase.id}-${Date.now()}`,
      caseId: selectedCase.id,
      caseNo: selectedCase.caseNo,
      clientName: selectedCase.clientName,
      service: selectedServiceValues.map((service) => resolveStakeholderService(selectedAgency.id, service)).join(', '),
      agencyId: selectedAgency.id,
      agencyName: selectedAgency.name,
      status: 'PENDING',
      createdAt: nowIso,
      updatedAt: nowIso,
      remarks: remarksValue.trim() || 'Referral created by Case Manager.',
      noteHistory: [],
      documents: docs,
    }

    try {
      createManagedReferral(newRow)
      navigate('/case-manager/referrals', { state: { toastMessage: 'Referral submitted successfully.' } })
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to submit referral for this case.'
      window.alert(message)
    }
  }

  return (
    <div className="mx-auto max-w-4xl space-y-4 pb-6">
      <div className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-500">
        <Link to="/case-manager/referrals" className="transition hover:text-[#0b5384]">Referrals</Link>
        <span className="mx-2">&gt;</span>
        <span>New Referral</span>
      </div>

      <header>
        <h1 className={pageHeadingStyles.pageTitle}>New Referral</h1>
        <p className={pageHeadingStyles.pageSubtitle}>Complete each step to create a referral.</p>
      </header>

      <section className="rounded-[3px] border border-[#cbd5e1] bg-white shadow-sm">
        <div className="border-b border-[#e2e8f0] px-5 py-4">
          <div className="grid grid-cols-3 gap-2">
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
                      const nextService = resolveStakeholderService(nextCase.agencyId, nextCase.service)
                      setSelectedServiceValues(nextService ? [nextService] : [])
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
                    setSelectedServiceValues((current) => {
                      const nextAvailableServices = getStakeholderServices(nextAgencyId)
                      const valid = current.filter((service) => nextAvailableServices.includes(service))
                      if (valid.length) {
                        return valid
                      }

                      const fallbackService = resolveStakeholderService(nextAgencyId, selectedCase?.service)
                      if (fallbackService && nextAvailableServices.includes(fallbackService)) {
                        return [fallbackService]
                      }

                      return nextAvailableServices.length ? [nextAvailableServices[0]] : []
                    })
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
              <FieldLabel label="Services" full>
                <div className="rounded-[3px] border border-[#cbd5e1] bg-white px-3 py-2">
                  {availableServices.length ? (
                    <div className="space-y-2">
                      {availableServices.map((service) => (
                        <label key={service} className="flex items-center gap-2 text-[13px] text-slate-700">
                          <input
                            type="checkbox"
                            checked={selectedServiceValues.includes(service)}
                            onChange={() => toggleServiceSelection(service)}
                            className="h-4 w-4 rounded border-[#cbd5e1]"
                          />
                          <span>{service}</span>
                        </label>
                      ))}
                    </div>
                  ) : (
                    <p className="text-[12px] text-slate-500">No available services for this stakeholder.</p>
                  )}
                </div>
                <p className="mt-1 text-[11px] text-slate-500">Select one or more services.</p>
              </FieldLabel>

              <FieldLabel label="Service Requirements" full>
                <div className="rounded-[3px] border border-[#e2e8f0] bg-slate-50 px-3 py-2">
                  {selectedServiceDetails.length ? (
                    <div className="space-y-3">
                      {selectedServiceDetails.map((service) => (
                        <div key={service.title} className="rounded-[3px] border border-[#dbe5ef] bg-white px-3 py-3">
                          <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-slate-500">{service.title}</p>
                          <p className="mt-1 text-[12px] font-semibold text-slate-700">
                            Processing Time: <span className="text-[#0b5384]">{service.processingDays} business days</span>
                          </p>

                          {service.requiredDocuments.length ? (
                            <div className="mt-3 space-y-2">
                              {service.requiredDocuments.map((requirement) => {
                                const requirementKey = buildServiceRequirementKey(service.title, requirement)
                                const hasFile = Boolean(requirementUploads[requirementKey])
                                const isMissing = !hasFile

                                return (
                                  <div
                                    key={requirementKey}
                                    className={`rounded-[3px] border px-3 py-2 ${isMissing ? 'border-rose-300 bg-rose-50/40' : 'border-[#dbe5ef] bg-white'}`}
                                  >
                                    <p className="text-[12px] font-semibold text-slate-700">{requirement}</p>
                                    <input
                                      type="file"
                                      onChange={(event) => {
                                        const selectedFile = event.target.files?.[0] ?? null
                                        setRequirementUploads((current) => ({
                                          ...current,
                                          [requirementKey]: selectedFile,
                                        }))
                                      }}
                                      className="mt-2 block w-full rounded-[3px] border border-[#cbd5e1] bg-white px-3 py-2 text-[12px] text-slate-700"
                                    />
                                    {hasFile ? (
                                      <p className="mt-1 text-[11px] text-slate-500">Attached: {requirementUploads[requirementKey]?.name}</p>
                                    ) : (
                                      <p className="mt-1 text-[11px] text-rose-700">Upload is required for this document.</p>
                                    )}
                                  </div>
                                )
                              })}
                            </div>
                          ) : (
                            <p className="mt-2 text-[12px] text-slate-500">No listed requirements for this service.</p>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-[12px] text-slate-500">No listed requirements for this service.</p>
                  )}

                  {hasMissingRequirementUploads ? (
                    <div className="mt-3 rounded-[3px] border border-rose-200 bg-rose-50 px-3 py-2 text-[12px] text-rose-800">
                      Missing uploads: {missingRequirementKeys.length}. Attach one file for each required service document to continue.
                    </div>
                  ) : null}
                </div>
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
            </>
          ) : null}
        </div>

        <div className="flex justify-end gap-2 border-t border-[#e2e8f0] px-5 py-3">
          <button
            type="button"
            onClick={() => navigate('/case-manager/referrals')}
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
      </section>
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

function buildServiceRequirementKey(serviceTitle: string, requirement: string): string {
  return `${serviceTitle}::${requirement}`
}
