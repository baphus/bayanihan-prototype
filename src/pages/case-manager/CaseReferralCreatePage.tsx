import { useEffect, useMemo, useState } from 'react'
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom'
import { pageHeadingStyles } from '../agency/pageHeadingStyles'
import {
  formatDisplayDateTime,
  getCaseManagerAgencies,
  getStakeholderServiceDetails,
  getStakeholderServices,
  resolveStakeholderService,
  toCaseHealthStatus,
  type CaseManagerReferral,
} from '../../data/unifiedData'
import { createManagedReferral, getManagedCaseById, getManagedReferralsByCaseId } from '../../data/caseLifecycleStore'

export default function CaseReferralCreatePage() {
  const navigate = useNavigate()
  const { caseId = '' } = useParams()
  const caseRecord = getManagedCaseById(caseId)

  const [referAgencyId, setReferAgencyId] = useState('')
  const [referServiceValues, setReferServiceValues] = useState<string[]>([])
  const [referRemarks, setReferRemarks] = useState('')
  const [referNotes, setReferNotes] = useState('')
  const [referRequirementUploads, setReferRequirementUploads] = useState<Record<string, File | null>>({})

  const allAgencies = useMemo(() => getCaseManagerAgencies(), [])
  const existingReferrals = useMemo(() => getManagedReferralsByCaseId(caseId), [caseId])
  const referredAgencyIds = useMemo(() => new Set(existingReferrals.map((item) => item.agencyId)), [existingReferrals])
  const referableAgencies = useMemo(
    () => allAgencies.filter((agency) => !referredAgencyIds.has(agency.id)),
    [allAgencies, referredAgencyIds],
  )

  const availableReferServices = useMemo(() => getStakeholderServices(referAgencyId), [referAgencyId])
  const selectedReferServiceDetails = useMemo(() => {
    if (!referAgencyId || !referServiceValues.length) {
      return []
    }

    const selectedSet = new Set(referServiceValues)
    return getStakeholderServiceDetails(referAgencyId).filter((service) => selectedSet.has(service.title))
  }, [referAgencyId, referServiceValues])

  const selectedReferServiceRequirements = useMemo(() => {
    return selectedReferServiceDetails.flatMap((service) =>
      service.requiredDocuments.map((requirement) => ({
        key: buildServiceRequirementKey(service.title, requirement),
        serviceTitle: service.title,
        requirement,
      })),
    )
  }, [selectedReferServiceDetails])

  const missingRequirementKeys = useMemo(() => {
    return selectedReferServiceRequirements.filter((item) => !referRequirementUploads[item.key]).map((item) => item.key)
  }, [selectedReferServiceRequirements, referRequirementUploads])

  const hasMissingRequirementUploads = missingRequirementKeys.length > 0

  useEffect(() => {
    const defaultAgency = referableAgencies[0]
    const defaultAgencyId = defaultAgency?.id ?? ''

    setReferAgencyId((current) => (current ? current : defaultAgencyId))
  }, [referableAgencies])

  useEffect(() => {
    if (!availableReferServices.length) {
      setReferServiceValues([])
      return
    }

    setReferServiceValues((current) => {
      const valid = current.filter((service) => availableReferServices.includes(service))
      if (valid.length) {
        return valid
      }

      const fallbackService = resolveStakeholderService(referAgencyId, caseRecord?.service)
      if (fallbackService && availableReferServices.includes(fallbackService)) {
        return [fallbackService]
      }

      return [availableReferServices[0]]
    })
  }, [availableReferServices, referAgencyId, caseRecord?.service])

  useEffect(() => {
    const activeRequirementKeys = new Set(selectedReferServiceRequirements.map((item) => item.key))

    setReferRequirementUploads((current) => {
      const next = Object.fromEntries(
        Object.entries(current).filter(([key]) => activeRequirementKeys.has(key)),
      ) as Record<string, File | null>

      return Object.keys(next).length === Object.keys(current).length ? current : next
    })
  }, [selectedReferServiceRequirements])

  if (!caseRecord || toCaseHealthStatus(caseRecord.status) === 'CLOSED') {
    return <Navigate to="/case-manager/cases" replace />
  }

  const toggleServiceSelection = (service: string) => {
    setReferServiceValues((current) => {
      if (current.includes(service)) {
        return current.filter((item) => item !== service)
      }

      return [...current, service]
    })
  }

  const submitReferToAgency = () => {
    if (!referAgencyId || !referServiceValues.length || hasMissingRequirementUploads) {
      return
    }

    const selectedReferAgency = allAgencies.find((agency) => agency.id === referAgencyId)

    if (!selectedReferAgency) {
      return
    }

    const nowIso = new Date().toISOString()
    const referralId = `ref-${caseRecord.id}-${referAgencyId}-${Date.now()}`
    const docs = selectedReferServiceRequirements.flatMap((item, index) => {
      const attachedFile = referRequirementUploads[item.key]

      if (!attachedFile) {
        return []
      }

      return {
        id: `doc-${caseRecord.id}-${Date.now()}-${index}`,
        name: `${item.serviceTitle} - ${item.requirement}: ${attachedFile.name}`,
        uploadedBy: 'Case Manager - Marychris M. Relon',
        uploadedAt: nowIso,
      }
    })

    const referralPayload: CaseManagerReferral = {
      id: referralId,
      caseId: caseRecord.id,
      caseNo: caseRecord.caseNo,
      clientName: caseRecord.clientName,
      service: referServiceValues.map((service) => resolveStakeholderService(referAgencyId, service)).join(', '),
      agencyId: selectedReferAgency.id,
      agencyName: selectedReferAgency.name,
      status: 'PENDING',
      createdAt: nowIso,
      updatedAt: nowIso,
      remarks: referRemarks.trim() || 'Referral created from Case View page.',
      notes: referNotes.trim() || 'No additional notes provided.',
      documents: docs,
    }

    try {
      createManagedReferral(referralPayload)
      navigate(`/case-manager/cases/${caseRecord.id}`, { state: { toastMessage: 'Referral submitted successfully.' } })
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to submit referral for this case.'
      window.alert(message)
    }
  }

  return (
    <div className="mx-auto max-w-4xl space-y-4 pb-6">
      <div className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-500">
        <Link to="/case-manager/cases" className="transition hover:text-[#0b5384]">Cases</Link>
        <span className="mx-2">&gt;</span>
        <Link to={`/case-manager/cases/${caseRecord.id}`} className="transition hover:text-[#0b5384]">{caseRecord.caseNo}</Link>
        <span className="mx-2">&gt;</span>
        <span>Refer to Agency</span>
      </div>

      <header>
        <h1 className={pageHeadingStyles.pageTitle}>Refer to Agency</h1>
        <p className={pageHeadingStyles.pageSubtitle}>Create a new agency referral for this case.</p>
      </header>

      <section className="rounded-[3px] border border-[#cbd5e1] bg-white shadow-sm">
        <div className="grid grid-cols-1 gap-4 px-5 py-4 md:grid-cols-2">
          <div className="md:col-span-2 rounded-[3px] border border-[#e2e8f0] bg-slate-50 px-3 py-2 text-[12px] text-slate-700">
            <p>
              Case: <span className="font-semibold">{caseRecord.caseNo}</span> ({caseRecord.clientName})
            </p>
            <p>
              Created: <span className="font-semibold">{formatDisplayDateTime(caseRecord.createdAt)}</span>
            </p>
          </div>

          <div>
            <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-[0.08em] text-slate-600">Agency</label>
            <select
              value={referAgencyId}
              onChange={(event) => setReferAgencyId(event.target.value)}
              className="h-10 w-full rounded-[3px] border border-[#cbd5e1] px-3 text-[13px] text-slate-700 outline-none"
            >
              {referableAgencies.map((agency) => (
                <option key={agency.id} value={agency.id}>{agency.name}</option>
              ))}
              {referableAgencies.length === 0 ? <option value="">No additional agencies available</option> : null}
            </select>
          </div>

          <div>
            <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-[0.08em] text-slate-600">Services</label>
            <div className="rounded-[3px] border border-[#cbd5e1] bg-white px-3 py-2">
              {availableReferServices.length ? (
                <div className="space-y-2">
                  {availableReferServices.map((service) => (
                    <label key={service} className="flex items-center gap-2 text-[13px] text-slate-700">
                      <input
                        type="checkbox"
                        checked={referServiceValues.includes(service)}
                        onChange={() => toggleServiceSelection(service)}
                        className="h-4 w-4 rounded border-[#cbd5e1]"
                      />
                      <span>{service}</span>
                    </label>
                  ))}
                </div>
              ) : (
                <p className="text-[12px] text-slate-500">No service available.</p>
              )}
            </div>
            <p className="mt-1 text-[11px] text-slate-500">Select one or more services.</p>
          </div>

          <div className="md:col-span-2">
            <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-[0.08em] text-slate-600">Remarks</label>
            <textarea
              rows={3}
              value={referRemarks}
              onChange={(event) => setReferRemarks(event.target.value)}
              className="w-full rounded-[3px] border border-[#cbd5e1] px-3 py-2 text-[13px] text-slate-700 outline-none"
              placeholder="Optional remarks for this referral"
            />
          </div>

          <div className="md:col-span-2">
            <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-[0.08em] text-slate-600">Notes</label>
            <textarea
              rows={3}
              value={referNotes}
              onChange={(event) => setReferNotes(event.target.value)}
              className="w-full rounded-[3px] border border-[#cbd5e1] px-3 py-2 text-[13px] text-slate-700 outline-none"
              placeholder="Optional internal notes"
            />
          </div>

          <div className="md:col-span-2">
            <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-[0.08em] text-slate-600">Service Requirements</label>
            <div className="rounded-[3px] border border-[#e2e8f0] bg-slate-50 px-3 py-2">
              {selectedReferServiceDetails.length ? (
                <div className="space-y-3">
                  {selectedReferServiceDetails.map((service) => (
                    <div key={service.title} className="rounded-[3px] border border-[#dbe5ef] bg-white px-3 py-3">
                      <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-slate-500">{service.title}</p>
                      <p className="mt-1 text-[12px] font-semibold text-slate-700">
                        Processing Time: <span className="text-[#0b5384]">{service.processingDays} business days</span>
                      </p>

                      {service.requiredDocuments.length ? (
                        <div className="mt-3 space-y-2">
                          {service.requiredDocuments.map((requirement) => {
                            const requirementKey = buildServiceRequirementKey(service.title, requirement)
                            const hasFile = Boolean(referRequirementUploads[requirementKey])
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
                                    setReferRequirementUploads((current) => ({
                                      ...current,
                                      [requirementKey]: selectedFile,
                                    }))
                                  }}
                                  className="mt-2 block w-full rounded-[3px] border border-[#cbd5e1] bg-white px-3 py-2 text-[12px] text-slate-700"
                                />
                                {hasFile ? (
                                  <p className="mt-1 text-[11px] text-slate-500">Attached: {referRequirementUploads[requirementKey]?.name}</p>
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
          </div>
        </div>

        <div className="flex justify-end gap-2 border-t border-[#e2e8f0] px-5 py-3">
          <button
            type="button"
            onClick={() => navigate(`/case-manager/cases/${caseRecord.id}`)}
            className="h-9 rounded-[3px] border border-[#cbd5e1] px-3 text-[12px] font-bold text-slate-700"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={submitReferToAgency}
            disabled={!referAgencyId || !referServiceValues.length || hasMissingRequirementUploads}
            className="h-9 rounded-[3px] bg-[#0b5384] px-3 text-[12px] font-bold text-white disabled:opacity-60 disabled:cursor-not-allowed"
          >
            Submit Referral
          </button>
        </div>
      </section>
    </div>
  )
}

function buildServiceRequirementKey(serviceTitle: string, requirement: string): string {
  return `${serviceTitle}::${requirement}`
}
