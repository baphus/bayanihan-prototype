import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Check, ChevronRight, ChevronLeft } from 'lucide-react'
import { pageHeadingStyles } from '../agency/pageHeadingStyles'
import { AppButton } from '../../components/ui/AppButton'
import AddressFieldGroup from '../../components/ui/AddressFieldGroup'
import {
  CASE_MANAGER_CASES,
  createEmptyAddressParts,
  formatPersonName,
  getExistingClientProfile,
  toCaseHealthStatus,
} from '../../data/unifiedData'
import { createManagedCase, getManagedCases } from '../../data/caseLifecycleStore'

type ClientType = 'Overseas Filipino Worker' | 'Next of Kin'
type ClientSource = 'existing' | 'new'
type NameParts = {
  firstName: string
  middleInitial: string
  lastName: string
  suffix: string
}

const NAME_SUFFIX_OPTIONS = ['', 'Jr', 'Sr', 'II', 'III', 'IV', 'V']

function splitNameParts(rawName: string): NameParts {
  const normalized = rawName.trim().replace(/\s+/g, ' ')

  if (!normalized) {
    return { firstName: '', middleInitial: '', lastName: '', suffix: '' }
  }

  const tokens = normalized.split(' ')
  const suffixCandidate = tokens[tokens.length - 1]?.replace(/\./g, '')
  const hasSuffix = NAME_SUFFIX_OPTIONS.some(
    (option) => option.length > 0 && option.toUpperCase() === suffixCandidate?.toUpperCase(),
  )

  const suffix = hasSuffix ? tokens.pop() ?? '' : ''

  if (tokens.length === 1) {
    return { firstName: tokens[0], middleInitial: '', lastName: '', suffix }
  }

  if (tokens.length === 2) {
    return { firstName: tokens[0], middleInitial: '', lastName: tokens[1], suffix }
  }

  const firstName = tokens[0]
  const middleInitial = tokens[tokens.length - 2].replace(/\./g, '').charAt(0).toUpperCase()
  const lastName = tokens[tokens.length - 1]

  return { firstName, middleInitial, lastName, suffix }
}

function composeNameParts(parts: NameParts): string {
  return formatPersonName(
    [parts.firstName.trim(), parts.middleInitial.trim(), parts.lastName.trim(), parts.suffix.trim()]
      .filter(Boolean)
      .join(' '),
  )
}

function generateTrackingId(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  const usedTrackingIds = new Set(getManagedCases().map((item) => item.caseNo.toUpperCase()))

  while (true) {
    let token = ''

    for (let i = 0; i < 7; i += 1) {
      token += chars[Math.floor(Math.random() * chars.length)]
    }

    const trackingId = `OW-${token}`
    if (!usedTrackingIds.has(trackingId)) {
      return trackingId
    }
  }
}

function generateCaseId(): string {
  const now = new Date()
  const y = now.getFullYear()
  const m = `${now.getMonth() + 1}`.padStart(2, '0')
  const d = `${now.getDate()}`.padStart(2, '0')
  const suffix = `${Math.floor(Math.random() * 9000) + 1000}`
  return `CM-${y}${m}${d}-${suffix}`
}

export default function NewCasePage() {
  const navigate = useNavigate()
  
  const steps = [
    { id: 1, title: 'Case Setup', description: 'Define case parameters and tracking' },
    { id: 2, title: 'Client Profile', description: 'Select or create a client record' },
    { id: 3, title: 'Case Narrative', description: 'Document client situation' },
  ]
  const [currentStep, setCurrentStep] = useState(1)
  const stepProgress = Math.round((currentStep / steps.length) * 100)
  const stepMeta: Record<number, { helperTitle: string; helperItems: string[]; note: string }> = {
    1: {
      helperTitle: 'Get oriented',
      helperItems: ['We generate the case number and tracking ID for you.', 'Choose the right client type.'],
      note: 'You can edit these details later from the case view.',
    },
    2: {
      helperTitle: 'Pick the right client',
      helperItems: ['Search for an existing record first.', 'Add missing contact details if needed.'],
      note: 'New client profiles take about 2 minutes to complete.',
    },
    3: {
      helperTitle: 'Tell the story',
      helperItems: ['Capture the key events and timeline.', 'Add just enough context for referrals.'],
      note: 'Keep it concise; follow-ups can be added later.',
    },
  }

  const existingClients = useMemo(
    () => {
      const clients = CASE_MANAGER_CASES.reduce<
        Record<string, { id: string; clientName: string; activeCaseCount: number }>
      >((acc, item) => {
        const key = item.clientName

        if (!acc[key]) {
          acc[key] = {
            id: key,
            clientName: item.clientName,
            activeCaseCount: 0,
          }
        }

        if (toCaseHealthStatus(item.status) === 'OPEN') {
          acc[key].activeCaseCount += 1
        }

        return acc
      }, {})

      return Object.values(clients).sort((a, b) => a.clientName.localeCompare(b.clientName))
    },
    [],
  )

  const [trackingId] = useState(() => generateTrackingId())
  const [caseId] = useState(() => generateCaseId())
  const [clientSource, setClientSource] = useState<ClientSource>('existing')
  const [selectedExistingClientId, setSelectedExistingClientId] = useState(() => existingClients[0]?.id ?? '')
  const [clientType, setClientType] = useState<ClientType>('Overseas Filipino Worker')
  const [ofwNameParts, setOfwNameParts] = useState<NameParts>({
    firstName: '',
    middleInitial: '',
    lastName: '',
    suffix: '',
  })
  const [ofwBirthDate, setOfwBirthDate] = useState('')
  const [ofwGender, setOfwGender] = useState('Male')
  const [ofwEmail, setOfwEmail] = useState('')
  const [ofwContact, setOfwContact] = useState('')
  const [ofwAddress, setOfwAddress] = useState(createEmptyAddressParts)
  const [specialSenior, setSpecialSenior] = useState(false)
  const [specialPwd, setSpecialPwd] = useState(false)
  const [specialSoloParent, setSpecialSoloParent] = useState(false)
  const [hasNextOfKin, setHasNextOfKin] = useState<boolean>(true)
  const [kinNameParts, setKinNameParts] = useState<NameParts>({
    firstName: '',
    middleInitial: '',
    lastName: '',
    suffix: '',
  })
  const [kinContact, setKinContact] = useState('')
  const [kinEmail, setKinEmail] = useState('')
  const [kinAddress, setKinAddress] = useState(createEmptyAddressParts)
  const [lastCountry, setLastCountry] = useState('')
  const [lastJobPosition, setLastJobPosition] = useState('')
  const [arrivalDate, setArrivalDate] = useState('')
  const [caseNarrative, setCaseNarrative] = useState('')

  const selectedExistingClient = existingClients.find((item) => item.id === selectedExistingClientId)
  const selectedExistingClientProfile = useMemo(
    () => (selectedExistingClient ? getExistingClientProfile(selectedExistingClient.clientName) : null),
    [selectedExistingClient],
  )

  useEffect(() => {
    if (clientSource !== 'existing' || !selectedExistingClientProfile) {
      return
    }

    setOfwNameParts(splitNameParts(selectedExistingClientProfile.fullName))
    setOfwBirthDate(selectedExistingClientProfile.birthDate)
    setOfwGender(selectedExistingClientProfile.gender)
    setOfwEmail(selectedExistingClientProfile.email)
    setOfwContact(selectedExistingClientProfile.contact)
    setOfwAddress({ ...selectedExistingClientProfile.address })
    setLastCountry(selectedExistingClientProfile.lastCountry)
    setLastJobPosition(selectedExistingClientProfile.lastJob)
    setArrivalDate(selectedExistingClientProfile.arrivalDate)
    setHasNextOfKin(selectedExistingClientProfile.hasNextOfKin)
    setKinNameParts(splitNameParts(selectedExistingClientProfile.kinName))
    setKinContact(selectedExistingClientProfile.kinContact)
    setKinEmail(selectedExistingClientProfile.kinEmail)
    setKinAddress({ ...selectedExistingClientProfile.kinAddress })
  }, [clientSource, selectedExistingClientProfile])

  const canProceedToNextStep = () => {
    if (currentStep === 1) return true
    if (currentStep === 2) {
      return clientSource === 'existing'
        ? selectedExistingClientId.trim().length > 0
        : ofwNameParts.firstName.trim().length > 0 && ofwNameParts.lastName.trim().length > 0
    }
    return true
  }

  const canSubmit = currentStep === 3 && (clientSource === 'existing'
    ? selectedExistingClientId.trim().length > 0
    : ofwNameParts.firstName.trim().length > 0 && ofwNameParts.lastName.trim().length > 0)

  const handleNext = () => {
    if (canProceedToNextStep() && currentStep < 3) {
      setCurrentStep((prev) => prev + 1)
    }
  }

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep((prev) => prev - 1)
    }
  }

  const handleCreateCase = () => {
    if (!canSubmit) {
      return
    }

    const nowIso = new Date().toISOString()
    const clientName =
      clientSource === 'existing'
        ? formatPersonName(composeNameParts(ofwNameParts).trim() || selectedExistingClient?.clientName || 'Unnamed Client')
        : formatPersonName(composeNameParts(ofwNameParts).trim() || 'Unnamed Client')

    const createdCasePayload = {
      id: caseId,
      caseNo: trackingId,
      clientName,
      clientType,
      service: 'To be assigned',
      milestone: 'Case Created',
      status: 'PENDING' as const,
      createdAt: nowIso,
      updatedAt: nowIso,
      agencyId: 'unassigned',
      agencyShort: 'N/A',
      agencyName: 'Not yet referred',
      caseNarrative: caseNarrative.trim(),
      ofwProfile: {
        fullName: clientName,
        birthDate: ofwBirthDate,
        gender: ofwGender,
        email: ofwEmail,
        contact: ofwContact,
        address: { ...ofwAddress },
        specialCategories: [
          specialSenior ? 'Senior Citizen' : '',
          specialPwd ? 'PWD' : '',
          specialSoloParent ? 'Solo Parent' : '',
        ].filter(Boolean) as string[],
      },
      nextOfKinProfile: hasNextOfKin
        ? {
            fullName: composeNameParts(kinNameParts),
            contact: kinContact,
            email: kinEmail,
            address: { ...kinAddress },
          }
        : undefined,
      workHistory: {
        lastCountry,
        lastJob: lastJobPosition,
        arrivalDate,
      },
    }

    createManagedCase(createdCasePayload)

    navigate(`/case-manager/cases/${caseId}`, {
      state: {
        createdCase: createdCasePayload,
      },
    })
  }

  return (
    <div className="w-full pb-8 space-y-6">
      <div className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-500">
        <Link to="/case-manager/cases" className="transition hover:text-[#0b5384]">Cases</Link>
        <span className="mx-2">&gt;</span>
        <span>New Case</span>
      </div>

      <header className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className={pageHeadingStyles.pageTitle}>Create New Case</h1>
          <p className={pageHeadingStyles.pageSubtitle}>A guided onboarding flow to register the case with confidence.</p>
        </div>
      </header>

      <section className="mx-auto flex max-w-6xl overflow-hidden rounded-2xl border border-[#cbd5e1] bg-white shadow-sm">
        {/* Left Sidebar */}
        <div className="w-1/3 min-w-[280px] max-w-[320px] shrink-0 border-r border-[#cbd5e1] bg-slate-50/60 p-8">
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <h3 className="text-[11px] font-extrabold uppercase tracking-[0.14em] text-slate-500">Step Guide</h3>
            <p className="mt-2 text-[14px] font-bold text-slate-800">Step {currentStep} of {steps.length}</p>
            <p className="mt-1 text-[12px] text-slate-500">Estimated time: 3-5 minutes</p>
            <div className="mt-4 h-2 w-full rounded-full bg-slate-100">
              <div
                className="h-2 rounded-full bg-[#0b5384] transition-all"
                style={{ width: `${stepProgress}%` }}
              />
            </div>
          </div>

          <div className="mt-6 space-y-6">
            <div>
              <h4 className="text-[11px] font-extrabold uppercase tracking-[0.14em] text-slate-500">Progress</h4>
              <div className="mt-4 space-y-6">
                {steps.map((step) => {
                  const isCompleted = currentStep > step.id
                  const isCurrent = currentStep === step.id

                  return (
                    <div key={step.id} className="flex gap-4 group">
                      <div
                        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-[2px] text-[12px] font-bold transition-colors bg-white ${
                          isCompleted
                            ? 'border-[#0b5384] bg-[#0b5384] text-white'
                            : isCurrent
                              ? 'border-[#0b5384] text-[#0b5384]'
                              : 'border-[#cbd5e1] text-slate-400 group-hover:border-slate-400'
                        }`}
                      >
                        {isCompleted ? <Check size={14} strokeWidth={3} /> : step.id}
                      </div>
                      <div className="pt-1">
                        <p className={`text-[14px] font-bold ${isCurrent || isCompleted ? 'text-[#0b5384]' : 'text-slate-500'}`}>
                          {step.title}
                        </p>
                        <p className="text-[12px] text-slate-400 mt-1 leading-snug">
                          {step.description}
                        </p>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-5">
              <h4 className="text-[11px] font-extrabold uppercase tracking-[0.14em] text-slate-500">{stepMeta[currentStep].helperTitle}</h4>
              <ul className="mt-3 space-y-2 text-[13px] text-slate-600">
                {stepMeta[currentStep].helperItems.map((item) => (
                  <li key={item} className="flex gap-2">
                    <span className="mt-1 h-1.5 w-1.5 rounded-full bg-[#0b5384]" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
              <p className="mt-4 text-[12px] text-slate-500">{stepMeta[currentStep].note}</p>
            </div>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col p-8">
          <div className="flex-1">
            <div className="mb-6 rounded-xl border border-slate-200 bg-gradient-to-br from-[#f7fbff] via-white to-white p-6">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <p className="text-[11px] font-extrabold uppercase tracking-[0.14em] text-[#0b5384]">Step {currentStep}</p>
                  <h2 className="text-xl font-bold text-slate-800 mt-2">{steps[currentStep - 1].title}</h2>
                  <p className="text-[13px] text-slate-500 mt-1">{steps[currentStep - 1].description}</p>
                </div>
                <div className="rounded-lg border border-slate-200 bg-white px-4 py-3">
                  <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-slate-500">Progress</p>
                  <p className="text-[14px] font-bold text-slate-800 mt-1">{stepProgress}% complete</p>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              {currentStep === 1 && (
                <div className="space-y-5">
                  <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                    <h3 className="text-[12px] font-bold uppercase tracking-wider text-slate-500">Auto-generated identifiers</h3>
                    <p className="mt-2 text-[13px] text-slate-500">We create a unique case number and tracking ID for secure handoffs.</p>
                    <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-5">
                      <Field label="Case No." required>
              <input
                value={caseId}
                readOnly
                className="h-10 w-full rounded-[3px] border border-[#cbd5e1] bg-slate-50 px-3 text-[13px] text-slate-700"
              />
            </Field>

            <Field label="Tracking ID" required>
              <input
                value={trackingId}
                readOnly
                className="h-10 w-full rounded-[3px] border border-[#cbd5e1] bg-slate-50 px-3 text-[13px] text-slate-700"
              />
            </Field>
                    </div>
                  </div>

                  <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                    <h3 className="text-[12px] font-bold uppercase tracking-wider text-slate-500">Who is this case for?</h3>
                    <p className="mt-2 text-[13px] text-slate-500">Pick the client category to tailor the next steps.</p>
                    <div className="mt-4">
                      <Field label="Client Type" required>
                        <select
                          value={clientType}
                          onChange={(event) => setClientType(event.target.value as ClientType)}
                          className="h-10 w-full rounded-[3px] border border-[#cbd5e1] px-3 text-[13px] text-slate-700 outline-none focus:border-[#0b5384] focus:ring-1 focus:ring-[#0b5384]"
                        >
                          <option value="Overseas Filipino Worker">Overseas Filipino Worker</option>
                          <option value="Next of Kin">Next of Kin</option>
                        </select>
                      </Field>
                    </div>
                  </div>
                </div>
          )}

          {currentStep === 2 && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <label 
                  className={`relative flex cursor-pointer rounded-lg border p-4 shadow-sm transition-all hover:border-[#0b5384] ${
                    clientSource === 'existing' ? 'border-[#0b5384] bg-[#f0f7ff] ring-1 ring-[#0b5384]' : 'border-slate-200 bg-white'
                  }`}
                >
                  <input
                    type="radio"
                    name="client-source"
                    className="sr-only"
                    checked={clientSource === 'existing'}
                    onChange={() => setClientSource('existing')}
                  />
                  <div className="flex w-full items-center justify-between">
                    <div className="flex flex-col">
                      <span className={`block text-sm font-bold ${clientSource === 'existing' ? 'text-[#0b5384]' : 'text-slate-900'}`}>
                        Existing Client
                      </span>
                      <span className="mt-1 flex items-center text-[13px] text-slate-500">
                        Select from existing client records
                      </span>
                    </div>
                    {clientSource === 'existing' && (
                      <Check className="h-5 w-5 text-[#0b5384]" />
                    )}
                  </div>
                </label>

                <label 
                  className={`relative flex cursor-pointer rounded-lg border p-4 shadow-sm transition-all hover:border-[#0b5384] ${
                    clientSource === 'new' ? 'border-[#0b5384] bg-[#f0f7ff] ring-1 ring-[#0b5384]' : 'border-slate-200 bg-white'
                  }`}
                >
                  <input
                    type="radio"
                    name="client-source"
                    className="sr-only"
                    checked={clientSource === 'new'}
                    onChange={() => setClientSource('new')}
                  />
                  <div className="flex w-full items-center justify-between">
                    <div className="flex flex-col">
                      <span className={`block text-sm font-bold ${clientSource === 'new' ? 'text-[#0b5384]' : 'text-slate-900'}`}>
                        New Client
                      </span>
                      <span className="mt-1 flex items-center text-[13px] text-slate-500">
                        Create a brand new client record
                      </span>
                    </div>
                    {clientSource === 'new' && (
                      <Check className="h-5 w-5 text-[#0b5384]" />
                    )}
                  </div>
                </label>
              </div>

              {clientSource === 'existing' ? (
              <>
                <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                  <h3 className="text-[12px] font-bold uppercase tracking-wider text-slate-500">Select client</h3>
                  <p className="mt-2 text-[13px] text-slate-500">We will preload their profile and you can still edit all fields below.</p>
                  <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Field label="Client" required>
                      <select
                        value={selectedExistingClientId}
                        onChange={(event) => setSelectedExistingClientId(event.target.value)}
                        className="h-10 w-full rounded-[3px] border border-[#cbd5e1] px-3 text-[13px] text-slate-700 outline-none focus:border-[#0b5384] focus:ring-1 focus:ring-[#0b5384]"
                      >
                        {existingClients.map((item) => (
                          <option key={item.id} value={item.id}>
                            {item.clientName}
                          </option>
                        ))}
                      </select>
                    </Field>

                    <Field label="Active Cases">
                      <input
                        value={selectedExistingClient ? `${selectedExistingClient.activeCaseCount} case(s)` : '-'}
                        readOnly
                        className="h-10 w-full rounded-[3px] border border-[#cbd5e1] bg-slate-50 px-3 text-[13px] text-slate-700"
                      />
                    </Field>
                  </div>
                </div>

                {selectedExistingClientProfile ? (
                  <div className="mt-2 space-y-5 rounded-xl border border-slate-200 bg-[#fcfdff] p-6 shadow-sm">
                    <Subsection title="OFW Information">
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <Field label="First Name">
                          <input value={ofwNameParts.firstName} onChange={(event) => setOfwNameParts((prev) => ({ ...prev, firstName: event.target.value }))} className="h-10 w-full rounded-[3px] border border-[#cbd5e1] px-3 text-[13px] text-slate-700 outline-none focus:border-[#0b5384] focus:ring-1 focus:ring-[#0b5384]" />
                        </Field>
                        <Field label="Middle Initial">
                          <input value={ofwNameParts.middleInitial} maxLength={1} onChange={(event) => setOfwNameParts((prev) => ({ ...prev, middleInitial: event.target.value.replace(/[^a-zA-Z]/g, '').toUpperCase() }))} className="h-10 w-full rounded-[3px] border border-[#cbd5e1] px-3 text-[13px] text-slate-700 outline-none focus:border-[#0b5384] focus:ring-1 focus:ring-[#0b5384]" />
                        </Field>
                        <Field label="Last Name">
                          <input value={ofwNameParts.lastName} onChange={(event) => setOfwNameParts((prev) => ({ ...prev, lastName: event.target.value }))} className="h-10 w-full rounded-[3px] border border-[#cbd5e1] px-3 text-[13px] text-slate-700 outline-none focus:border-[#0b5384] focus:ring-1 focus:ring-[#0b5384]" />
                        </Field>
                        <Field label="Suffix">
                          <select value={ofwNameParts.suffix} onChange={(event) => setOfwNameParts((prev) => ({ ...prev, suffix: event.target.value }))} className="h-10 w-full rounded-[3px] border border-[#cbd5e1] px-3 text-[13px] text-slate-700 outline-none focus:border-[#0b5384] focus:ring-1 focus:ring-[#0b5384]">
                            <option value="">None</option>
                            {NAME_SUFFIX_OPTIONS.filter((item) => item).map((item) => (
                              <option key={item} value={item}>{item}</option>
                            ))}
                          </select>
                        </Field>
                        <Field label="Date of Birth">
                          <input value={ofwBirthDate} onChange={(event) => setOfwBirthDate(event.target.value)} className="h-10 w-full rounded-[3px] border border-[#cbd5e1] px-3 text-[13px] text-slate-700 outline-none focus:border-[#0b5384] focus:ring-1 focus:ring-[#0b5384]" />
                        </Field>
                        <Field label="Gender">
                          <select value={ofwGender} onChange={(event) => setOfwGender(event.target.value)} className="h-10 w-full rounded-[3px] border border-[#cbd5e1] px-3 text-[13px] text-slate-700 outline-none focus:border-[#0b5384] focus:ring-1 focus:ring-[#0b5384]">
                            <option value="Male">Male</option>
                            <option value="Female">Female</option>
                          </select>
                        </Field>
                        <Field label="Email Address">
                          <input value={ofwEmail} onChange={(event) => setOfwEmail(event.target.value)} className="h-10 w-full rounded-[3px] border border-[#cbd5e1] px-3 text-[13px] text-slate-700 outline-none focus:border-[#0b5384] focus:ring-1 focus:ring-[#0b5384]" />
                        </Field>
                        <Field label="Contact Number">
                          <input value={ofwContact} onChange={(event) => setOfwContact(event.target.value)} className="h-10 w-full rounded-[3px] border border-[#cbd5e1] px-3 text-[13px] text-slate-700 outline-none focus:border-[#0b5384] focus:ring-1 focus:ring-[#0b5384]" />
                        </Field>
                        <AddressFieldGroup
                          className="md:col-span-3"
                          value={ofwAddress}
                          onChange={setOfwAddress}
                        />
                      </div>
                    </Subsection>

                    <Subsection title="Work History">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <Field label="Last Country">
                          <input value={lastCountry} onChange={(event) => setLastCountry(event.target.value)} className="h-10 w-full rounded-[3px] border border-[#cbd5e1] px-3 text-[13px] text-slate-700 outline-none focus:border-[#0b5384] focus:ring-1 focus:ring-[#0b5384]" />
                        </Field>
                        <Field label="Last Job Position">
                          <input value={lastJobPosition} onChange={(event) => setLastJobPosition(event.target.value)} className="h-10 w-full rounded-[3px] border border-[#cbd5e1] px-3 text-[13px] text-slate-700 outline-none focus:border-[#0b5384] focus:ring-1 focus:ring-[#0b5384]" />
                        </Field>
                        <Field label="Arrival Date in Philippines">
                          <input value={arrivalDate} onChange={(event) => setArrivalDate(event.target.value)} className="h-10 w-full rounded-[3px] border border-[#cbd5e1] px-3 text-[13px] text-slate-700 outline-none focus:border-[#0b5384] focus:ring-1 focus:ring-[#0b5384]" />
                        </Field>
                      </div>
                    </Subsection>

                    <Subsection title="Next of Kin Information">
                      <Field label="Does the client have a next of kin?">
                        <div className="inline-flex rounded-lg border border-slate-200 bg-slate-50 p-1">
                          <label
                            className={`flex cursor-pointer items-center justify-center rounded-md px-6 py-1.5 text-[13px] font-bold transition-all ${
                              hasNextOfKin ? 'bg-white text-[#0b5384] shadow-sm ring-1 ring-slate-200' : 'text-slate-500 hover:text-slate-700'
                            }`}
                          >
                            <input
                              type="radio"
                              name="existing-has-next-of-kin"
                              className="sr-only"
                              checked={hasNextOfKin}
                              onChange={() => setHasNextOfKin(true)}
                            />
                            Yes
                          </label>
                          <label
                            className={`flex cursor-pointer items-center justify-center rounded-md px-6 py-1.5 text-[13px] font-bold transition-all ${
                              !hasNextOfKin ? 'bg-white text-[#0b5384] shadow-sm ring-1 ring-slate-200' : 'text-slate-500 hover:text-slate-700'
                            }`}
                          >
                            <input
                              type="radio"
                              name="existing-has-next-of-kin"
                              className="sr-only"
                              checked={!hasNextOfKin}
                              onChange={() => setHasNextOfKin(false)}
                            />
                            No
                          </label>
                        </div>
                      </Field>
                      {hasNextOfKin ? (
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-4">
                          <Field label="First Name">
                            <input value={kinNameParts.firstName} onChange={(event) => setKinNameParts((prev) => ({ ...prev, firstName: event.target.value }))} className="h-10 w-full rounded-[3px] border border-[#cbd5e1] px-3 text-[13px] text-slate-700 outline-none focus:border-[#0b5384] focus:ring-1 focus:ring-[#0b5384]" />
                          </Field>
                          <Field label="Middle Initial">
                            <input value={kinNameParts.middleInitial} maxLength={1} onChange={(event) => setKinNameParts((prev) => ({ ...prev, middleInitial: event.target.value.replace(/[^a-zA-Z]/g, '').toUpperCase() }))} className="h-10 w-full rounded-[3px] border border-[#cbd5e1] px-3 text-[13px] text-slate-700 outline-none focus:border-[#0b5384] focus:ring-1 focus:ring-[#0b5384]" />
                          </Field>
                          <Field label="Last Name">
                            <input value={kinNameParts.lastName} onChange={(event) => setKinNameParts((prev) => ({ ...prev, lastName: event.target.value }))} className="h-10 w-full rounded-[3px] border border-[#cbd5e1] px-3 text-[13px] text-slate-700 outline-none focus:border-[#0b5384] focus:ring-1 focus:ring-[#0b5384]" />
                          </Field>
                          <Field label="Suffix">
                            <select value={kinNameParts.suffix} onChange={(event) => setKinNameParts((prev) => ({ ...prev, suffix: event.target.value }))} className="h-10 w-full rounded-[3px] border border-[#cbd5e1] px-3 text-[13px] text-slate-700 outline-none focus:border-[#0b5384] focus:ring-1 focus:ring-[#0b5384]">
                              <option value="">None</option>
                              {NAME_SUFFIX_OPTIONS.filter((item) => item).map((item) => (
                                <option key={item} value={item}>{item}</option>
                              ))}
                            </select>
                          </Field>
                          <Field label="Contact Number">
                            <input value={kinContact} onChange={(event) => setKinContact(event.target.value)} className="h-10 w-full rounded-[3px] border border-[#cbd5e1] px-3 text-[13px] text-slate-700 outline-none focus:border-[#0b5384] focus:ring-1 focus:ring-[#0b5384]" />
                          </Field>
                          <Field label="Email Address">
                            <input value={kinEmail} onChange={(event) => setKinEmail(event.target.value)} className="h-10 w-full rounded-[3px] border border-[#cbd5e1] px-3 text-[13px] text-slate-700 outline-none focus:border-[#0b5384] focus:ring-1 focus:ring-[#0b5384]" />
                          </Field>
                          <AddressFieldGroup
                            className="md:col-span-3"
                            value={kinAddress}
                            onChange={setKinAddress}
                          />
                        </div>
                      ) : null}
                    </Subsection>
                  </div>
                ) : null}
              </>
            ) : null}

        {clientSource === 'new' ? (
          <div className="space-y-6 mt-6 pt-6 border-t border-slate-100">
              <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                <Subsection title="OFW Information">
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <Field label="First Name" required>
                    <input
                      value={ofwNameParts.firstName}
                      onChange={(event) => setOfwNameParts((prev) => ({ ...prev, firstName: event.target.value }))}
                      className="h-10 w-full rounded-[3px] border border-[#cbd5e1] px-3 text-[13px] text-slate-700 outline-none focus:border-[#0b5384] focus:ring-1 focus:ring-[#0b5384]"
                    />
                  </Field>

                  <Field label="Middle Initial">
                    <input
                      value={ofwNameParts.middleInitial}
                      maxLength={1}
                      onChange={(event) => setOfwNameParts((prev) => ({ ...prev, middleInitial: event.target.value.replace(/[^a-zA-Z]/g, '').toUpperCase() }))}
                      className="h-10 w-full rounded-[3px] border border-[#cbd5e1] px-3 text-[13px] text-slate-700 outline-none focus:border-[#0b5384] focus:ring-1 focus:ring-[#0b5384]"
                    />
                  </Field>

                  <Field label="Last Name" required>
                    <input
                      value={ofwNameParts.lastName}
                      onChange={(event) => setOfwNameParts((prev) => ({ ...prev, lastName: event.target.value }))}
                      className="h-10 w-full rounded-[3px] border border-[#cbd5e1] px-3 text-[13px] text-slate-700 outline-none focus:border-[#0b5384] focus:ring-1 focus:ring-[#0b5384]"
                    />
                  </Field>

                  <Field label="Suffix">
                    <select
                      value={ofwNameParts.suffix}
                      onChange={(event) => setOfwNameParts((prev) => ({ ...prev, suffix: event.target.value }))}
                      className="h-10 w-full rounded-[3px] border border-[#cbd5e1] px-3 text-[13px] text-slate-700 outline-none focus:border-[#0b5384] focus:ring-1 focus:ring-[#0b5384]"
                    >
                      <option value="">None</option>
                      {NAME_SUFFIX_OPTIONS.filter((item) => item).map((item) => (
                        <option key={item} value={item}>{item}</option>
                      ))}
                    </select>
                  </Field>

                <Field label="Date of Birth">
                  <input
                    type="date"
                    value={ofwBirthDate}
                    onChange={(event) => setOfwBirthDate(event.target.value)}
                    className="h-10 w-full rounded-[3px] border border-[#cbd5e1] px-3 text-[13px] text-slate-700 outline-none focus:border-[#0b5384] focus:ring-1 focus:ring-[#0b5384]"
                  />
                </Field>

                <Field label="Gender">
                  <select
                    value={ofwGender}
                    onChange={(event) => setOfwGender(event.target.value)}
                    className="h-10 w-full rounded-[3px] border border-[#cbd5e1] px-3 text-[13px] text-slate-700 outline-none focus:border-[#0b5384] focus:ring-1 focus:ring-[#0b5384]"
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                  </select>
                </Field>

                <Field label="Email Address">
                  <input
                    type="email"
                    value={ofwEmail}
                    onChange={(event) => setOfwEmail(event.target.value)}
                    className="h-10 w-full rounded-[3px] border border-[#cbd5e1] px-3 text-[13px] text-slate-700 outline-none focus:border-[#0b5384] focus:ring-1 focus:ring-[#0b5384]"
                  />
                </Field>

                <Field label="Contact Number">
                  <input
                    value={ofwContact}
                    onChange={(event) => setOfwContact(event.target.value)}
                    className="h-10 w-full rounded-[3px] border border-[#cbd5e1] px-3 text-[13px] text-slate-700 outline-none focus:border-[#0b5384] focus:ring-1 focus:ring-[#0b5384]"
                  />
                </Field>

                <AddressFieldGroup
                  className="md:col-span-3"
                  required
                  value={ofwAddress}
                  onChange={setOfwAddress}
                />

                  <Field label="Special Categories" className="md:col-span-3">
                    <div className="flex flex-wrap items-center gap-4 rounded-[3px] border border-[#cbd5e1] bg-slate-50 px-3 py-2">
                      <label className="inline-flex items-center gap-2 text-[12px] text-slate-700">
                        <input type="checkbox" checked={specialSenior} onChange={(event) => setSpecialSenior(event.target.checked)} />
                        Senior Citizen
                      </label>
                      <label className="inline-flex items-center gap-2 text-[12px] text-slate-700">
                        <input type="checkbox" checked={specialPwd} onChange={(event) => setSpecialPwd(event.target.checked)} />
                        PWD
                      </label>
                      <label className="inline-flex items-center gap-2 text-[12px] text-slate-700">
                        <input type="checkbox" checked={specialSoloParent} onChange={(event) => setSpecialSoloParent(event.target.checked)} />
                        Solo Parent
                      </label>
                    </div>
                  </Field>
                </div>
              </Subsection>
            </div>

              <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                <Subsection title="Work History">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Field label="Last Country">
                    <input
                      value={lastCountry}
                      onChange={(event) => setLastCountry(event.target.value)}
                      className="h-10 w-full rounded-[3px] border border-[#cbd5e1] px-3 text-[13px] text-slate-700 outline-none focus:border-[#0b5384] focus:ring-1 focus:ring-[#0b5384]"
                    />
                  </Field>

                  <Field label="Last Job Position">
                    <input
                      value={lastJobPosition}
                      onChange={(event) => setLastJobPosition(event.target.value)}
                      className="h-10 w-full rounded-[3px] border border-[#cbd5e1] px-3 text-[13px] text-slate-700 outline-none focus:border-[#0b5384] focus:ring-1 focus:ring-[#0b5384]"
                    />
                  </Field>

                  <Field label="Arrival Date in Philippines">
                    <input
                      type="date"
                      value={arrivalDate}
                      onChange={(event) => setArrivalDate(event.target.value)}
                      className="h-10 w-full rounded-[3px] border border-[#cbd5e1] px-3 text-[13px] text-slate-700 outline-none focus:border-[#0b5384] focus:ring-1 focus:ring-[#0b5384]"
                    />
                  </Field>
                </div>
              </Subsection>
            </div>

              <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                <Subsection title="Next of Kin Information">
                  <Field label="Does the client have a next of kin?" required>
                    <div className="inline-flex rounded-lg border border-slate-200 bg-slate-50 p-1">
                      <label 
                        className={`flex cursor-pointer items-center justify-center rounded-md px-6 py-1.5 text-[13px] font-bold transition-all ${
                          hasNextOfKin ? 'bg-white text-[#0b5384] shadow-sm ring-1 ring-slate-200' : 'text-slate-500 hover:text-slate-700'
                        }`}
                      >
                        <input
                          type="radio"
                          name="has-next-of-kin"
                          className="sr-only"
                          checked={hasNextOfKin}
                          onChange={() => setHasNextOfKin(true)}
                        />
                        Yes
                      </label>
                      <label 
                        className={`flex cursor-pointer items-center justify-center rounded-md px-6 py-1.5 text-[13px] font-bold transition-all ${
                          !hasNextOfKin ? 'bg-white text-[#0b5384] shadow-sm ring-1 ring-slate-200' : 'text-slate-500 hover:text-slate-700'
                        }`}
                      >
                        <input
                          type="radio"
                          name="has-next-of-kin"
                          className="sr-only"
                          checked={!hasNextOfKin}
                          onChange={() => setHasNextOfKin(false)}
                        />
                        No
                      </label>
                    </div>
                  </Field>

                  {hasNextOfKin ? (
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-4">
                      <Field label="First Name">
                        <input
                          value={kinNameParts.firstName}
                          onChange={(event) => setKinNameParts((prev) => ({ ...prev, firstName: event.target.value }))}
                          className="h-10 w-full rounded-[3px] border border-[#cbd5e1] px-3 text-[13px] text-slate-700 outline-none focus:border-[#0b5384] focus:ring-1 focus:ring-[#0b5384]"
                        />
                      </Field>

                      <Field label="Middle Initial">
                        <input
                          value={kinNameParts.middleInitial}
                          maxLength={1}
                          onChange={(event) => setKinNameParts((prev) => ({ ...prev, middleInitial: event.target.value.replace(/[^a-zA-Z]/g, '').toUpperCase() }))}
                          className="h-10 w-full rounded-[3px] border border-[#cbd5e1] px-3 text-[13px] text-slate-700 outline-none focus:border-[#0b5384] focus:ring-1 focus:ring-[#0b5384]"
                        />
                      </Field>

                      <Field label="Last Name">
                        <input
                          value={kinNameParts.lastName}
                          onChange={(event) => setKinNameParts((prev) => ({ ...prev, lastName: event.target.value }))}
                          className="h-10 w-full rounded-[3px] border border-[#cbd5e1] px-3 text-[13px] text-slate-700 outline-none focus:border-[#0b5384] focus:ring-1 focus:ring-[#0b5384]"
                        />
                      </Field>

                      <Field label="Suffix">
                        <select
                          value={kinNameParts.suffix}
                          onChange={(event) => setKinNameParts((prev) => ({ ...prev, suffix: event.target.value }))}
                          className="h-10 w-full rounded-[3px] border border-[#cbd5e1] px-3 text-[13px] text-slate-700 outline-none focus:border-[#0b5384] focus:ring-1 focus:ring-[#0b5384]"
                        >
                          <option value="">None</option>
                          {NAME_SUFFIX_OPTIONS.filter((item) => item).map((item) => (
                            <option key={item} value={item}>{item}</option>
                          ))}
                        </select>
                      </Field>

                      <Field label="Contact Number">
                        <input
                          value={kinContact}
                          onChange={(event) => setKinContact(event.target.value)}
                          className="h-10 w-full rounded-[3px] border border-[#cbd5e1] px-3 text-[13px] text-slate-700 outline-none focus:border-[#0b5384] focus:ring-1 focus:ring-[#0b5384]"
                        />
                      </Field>

                      <Field label="Email Address">
                        <input
                          type="email"
                          value={kinEmail}
                          onChange={(event) => setKinEmail(event.target.value)}
                          className="h-10 w-full rounded-[3px] border border-[#cbd5e1] px-3 text-[13px] text-slate-700 outline-none focus:border-[#0b5384] focus:ring-1 focus:ring-[#0b5384]"
                        />
                      </Field>

                      <AddressFieldGroup
                        className="md:col-span-3"
                        value={kinAddress}
                        onChange={setKinAddress}
                      />
                    </div>
                  ) : null}
                </Subsection>
              </div>
            </div>
          ) : null}
        </div>
      )}

          {currentStep === 3 && (
            <div className="space-y-4">
              <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                <h3 className="text-[12px] font-bold uppercase tracking-wider text-slate-500">Case narrative</h3>
                <p className="mt-2 text-[13px] text-slate-500">Use bullet-like sentences to summarize the case background.</p>
                <div className="mt-4">
                  <Field label="Narrative">
                    <textarea
                      rows={8}
                      value={caseNarrative}
                      onChange={(event) => setCaseNarrative(event.target.value)}
                      placeholder="Describe the client trauma/experience and reason for opening the case..."
                      className="w-full rounded-[3px] border border-[#cbd5e1] px-3 py-3 text-[13px] text-slate-700 outline-none focus:border-[#0b5384] focus:ring-1 focus:ring-[#0b5384]"
                    />
                  </Field>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Action Footer */}
        <div className="mt-8 flex items-center justify-between border-t border-[#e2e8f0] pt-6">
          <AppButton
            variant="outline"
            onClick={currentStep === 1 ? () => navigate('/case-manager/cases') : handleBack}
            className="min-w-[100px]"
          >
            {currentStep === 1 ? 'Cancel' : <><ChevronLeft size={16} /> Back</>}
          </AppButton>
          
          {currentStep < 3 ? (
            <AppButton
              disabled={!canProceedToNextStep()}
              onClick={handleNext}
              className="min-w-[120px]"
            >
              Next <ChevronRight size={16} />
            </AppButton>
          ) : (
            <AppButton
              disabled={!canSubmit}
              onClick={handleCreateCase}
              className="min-w-[140px] bg-green-600 hover:bg-green-700 border-none text-white"
            >
              <Check size={16} /> Create Case
            </AppButton>
          )}
        </div>
      </div>
    </div>
    </section>
  </div>
  )
}

function Field({
  label,
  children,
  required = false,
  className,
}: {
  label: string
  children: ReactNode
  required?: boolean
  className?: string
}) {
  return (
    <div className={className}>
      <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-[0.08em] text-slate-600">
        {label}{required ? ' *' : ''}
      </label>
      {children}
    </div>
  )
}

function Subsection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="space-y-4">
      <h3 className="text-[12px] font-bold uppercase tracking-wider text-slate-500 pb-1 border-b border-slate-100">{title}</h3>
      {children}
    </div>
  )
}