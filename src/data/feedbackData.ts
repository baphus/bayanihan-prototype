import { AGENCIES_DATA } from './agenciesData'
import { REFERRAL_CASES } from './unifiedData'

export type ServqualDimension = 'Tangibles' | 'Reliability' | 'Responsiveness' | 'Assurance' | 'Empathy'

export const SERVQUAL_DIMENSIONS: ServqualDimension[] = [
  'Tangibles',
  'Reliability',
  'Responsiveness',
  'Assurance',
  'Empathy',
]

export type ServqualQuestion = {
  id: string
  text: string
  dimension: ServqualDimension
}

export type ServqualQuestionResponse = {
  questionId: string
  questionText: string
  dimension: ServqualDimension
  expectation: number
  perception: number
  gap: number
}

export type FeedbackEntry = {
  id: string
  caseId: string
  caseNo?: string
  agencyId: string
  serviceName: string
  userName?: string
  overallRating: number
  rating: number
  gapScore: number
  comments?: string
  createdAt: string
  responses: ServqualQuestionResponse[]
}

export type ServqualConfig = {
  agencyId: string
  serviceName: string
  questions: ServqualQuestion[]
}

const STORAGE_KEY = 'bayanihan_feedback_v1'

function loadState() {
  try {
    if (typeof window === 'undefined') {
      return { feedback: [] as FeedbackEntry[], configs: [] as ServqualConfig[] }
    }

    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return { feedback: [] as FeedbackEntry[], configs: [] as ServqualConfig[] }
    return JSON.parse(raw)
  } catch (e) {
    return { feedback: [] as FeedbackEntry[], configs: [] as ServqualConfig[] }
  }
}

function saveState(state: { feedback: FeedbackEntry[]; configs: ServqualConfig[] }) {
  try {
    if (typeof window === 'undefined') {
      return
    }

    localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  } catch (e) {
    // ignore
  }
}

const initial = loadState()

let FEEDBACK: FeedbackEntry[] = initial.feedback
let CONFIGS: ServqualConfig[] = initial.configs

function stableSeed(value: string): number {
  return Array.from(value).reduce((acc, char, index) => acc + char.charCodeAt(0) * (index + 1), 0)
}

function toScore(value: number): number {
  return Math.max(1, Math.min(5, Number(value.toFixed(2))))
}

function normalizeServiceName(serviceName?: string): string {
  return (serviceName ?? 'General Service').trim() || 'General Service'
}

function toServiceSlug(serviceName: string): string {
  return normalizeServiceName(serviceName)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
}

function createPhilippineDefaultQuestions(serviceName: string): ServqualQuestion[] {
  const normalizedServiceName = normalizeServiceName(serviceName)
  const slug = toServiceSlug(normalizedServiceName)

  // Standardized Philippine public service format aligned with Citizen's Charter and SERVQUAL dimensions.
  return [
    {
      id: `q-${slug}-t-1`,
      dimension: 'Tangibles',
      text: `The frontline area for ${normalizedServiceName} is clean, organized, and has visible service signages.`,
    },
    {
      id: `q-${slug}-t-2`,
      dimension: 'Tangibles',
      text: 'Forms, requirements, and process steps are clearly displayed in line with the Citizen\'s Charter.',
    },
    {
      id: `q-${slug}-r-1`,
      dimension: 'Reliability',
      text: `The agency processed my ${normalizedServiceName} request within the committed timeline.`,
    },
    {
      id: `q-${slug}-r-2`,
      dimension: 'Reliability',
      text: 'The documents and outputs released were complete and accurate on first release.',
    },
    {
      id: `q-${slug}-rs-1`,
      dimension: 'Responsiveness',
      text: 'Personnel responded promptly to my concerns and explained the next steps clearly.',
    },
    {
      id: `q-${slug}-rs-2`,
      dimension: 'Responsiveness',
      text: 'Queueing and follow-up channels (in-person/phone/email) were efficient and accessible.',
    },
    {
      id: `q-${slug}-a-1`,
      dimension: 'Assurance',
      text: 'Personnel demonstrated competence, professionalism, and integrity in handling my transaction.',
    },
    {
      id: `q-${slug}-a-2`,
      dimension: 'Assurance',
      text: 'The process gave me confidence that data privacy and service standards were observed.',
    },
    {
      id: `q-${slug}-e-1`,
      dimension: 'Empathy',
      text: 'Personnel treated me with courtesy, respect, and fairness throughout the transaction.',
    },
    {
      id: `q-${slug}-e-2`,
      dimension: 'Empathy',
      text: 'The agency considered my specific needs and provided appropriate assistance when needed.',
    },
  ]
}

function normalizeConfig(
  agencyId: string,
  serviceName: string,
  questions: ServqualQuestion[] | string[] | undefined,
): ServqualConfig {
  const normalizedServiceName = normalizeServiceName(serviceName)

  if (!questions || questions.length === 0) {
    return { agencyId, serviceName: normalizedServiceName, questions: createPhilippineDefaultQuestions(normalizedServiceName) }
  }

  if (typeof questions[0] === 'string') {
    const textQuestions = questions as string[]
    const serviceSlug = toServiceSlug(normalizedServiceName)
    const mapped: ServqualQuestion[] = textQuestions.map((text, index) => ({
      id: `q-${serviceSlug}-${index + 1}`,
      text,
      dimension: SERVQUAL_DIMENSIONS[index % SERVQUAL_DIMENSIONS.length],
    }))

    return { agencyId, serviceName: normalizedServiceName, questions: mapped }
  }

  const serviceSlug = toServiceSlug(normalizedServiceName)

  return {
    agencyId,
    serviceName: normalizedServiceName,
    questions: (questions as ServqualQuestion[]).map((question, index) => ({
      id: question.id || `q-${serviceSlug}-${index + 1}`,
      text: question.text,
      dimension: question.dimension,
    })),
  }
}

function computeResponses(seedKey: string, questions: ServqualQuestion[], baselineRating: number): ServqualQuestionResponse[] {
  return questions.map((question, index) => {
    const seed = stableSeed(`${seedKey}-${question.id}-${index}`)
    const expectation = toScore(4.2 + ((seed % 11) - 5) * 0.08)
    const perception = toScore(baselineRating + ((seed % 9) - 4) * 0.12)
    const gap = Number((perception - expectation).toFixed(2))

    return {
      questionId: question.id,
      questionText: question.text,
      dimension: question.dimension,
      expectation,
      perception,
      gap,
    }
  })
}

function computeOverallRating(responses: ServqualQuestionResponse[]): number {
  if (responses.length === 0) {
    return 0
  }

  const total = responses.reduce((sum, item) => sum + item.perception, 0)
  return Number((total / responses.length).toFixed(2))
}

function computeGapScore(responses: ServqualQuestionResponse[]): number {
  if (responses.length === 0) {
    return 0
  }

  const total = responses.reduce((sum, item) => sum + item.gap, 0)
  return Number((total / responses.length).toFixed(2))
}

function createMockFeedback(): FeedbackEntry[] {
  const entries: FeedbackEntry[] = []

  REFERRAL_CASES.forEach((item, index) => {
    const agencyId = computeAgencyIdForCase(item.id)
    const config = getAgencyServqualConfig(agencyId, item.service)
    const baseRating = toScore(3.4 + ((stableSeed(item.id) % 13) - 6) * 0.09)
    const responses = computeResponses(item.id, config.questions, baseRating)
    const overallRating = computeOverallRating(responses)
    const gapScore = computeGapScore(responses)

    entries.push({
      id: `mock-fb-${index + 1}`,
      caseId: item.id,
      caseNo: item.caseNo,
      agencyId,
      serviceName: item.service,
      userName: item.clientName,
      overallRating,
      rating: overallRating,
      gapScore,
      comments: gapScore < 0 ? 'Service expectations were not fully met.' : 'Client reported satisfactory service delivery.',
      createdAt: item.updatedAt,
      responses,
    })
  })

  return entries
}

const MOCK_FEEDBACK: FeedbackEntry[] = createMockFeedback()

function computeAgencyIdForCase(caseId: string): string {
  // Stable mapping of a case id to an agency using simple index
  const idx = Array.from(caseId).reduce((acc, ch) => acc + ch.charCodeAt(0), 0) % AGENCIES_DATA.length
  return AGENCIES_DATA[idx].id
}

export function submitFeedback(caseId: string, rating: number, comments?: string, serviceName?: string): FeedbackEntry {
  const agencyId = computeAgencyIdForCase(caseId)
  const caseObj = REFERRAL_CASES.find((c) => c.id === caseId)
  const finalServiceName = serviceName ?? caseObj?.service ?? 'General Service'
  const config = getAgencyServqualConfig(agencyId, finalServiceName)
  const responses = computeResponses(`${caseId}-${Date.now()}`, config.questions, rating)
  const overallRating = computeOverallRating(responses)
  const gapScore = computeGapScore(responses)

  const entry: FeedbackEntry = {
    id: `fb-${Date.now()}-${Math.floor(Math.random() * 9000) + 1000}`,
    caseId,
    caseNo: caseObj?.caseNo,
    agencyId,
    serviceName: finalServiceName,
    userName: caseObj?.clientName,
    overallRating,
    rating: overallRating,
    gapScore,
    comments: comments ?? '',
    createdAt: new Date().toISOString(),
    responses,
  }

  FEEDBACK = [entry, ...FEEDBACK]
  saveState({ feedback: FEEDBACK, configs: CONFIGS })
  return entry
}

export function getFeedbackByAgency(agencyId: string): FeedbackEntry[] {
  const persisted = FEEDBACK.filter((f) => f.agencyId === agencyId)
  const mock = MOCK_FEEDBACK.filter((f) => f.agencyId === agencyId)
  return [...persisted, ...mock]
}

export function getFeedbackByCase(caseId: string): FeedbackEntry[] {
  return [...FEEDBACK, ...MOCK_FEEDBACK].filter((f) => f.caseId === caseId)
}

export function getAgencyServqualConfig(agencyId: string, serviceName: string = 'General Service'): ServqualConfig {
  const normalizedServiceName = normalizeServiceName(serviceName)
  const existing = CONFIGS.find((c) => c.agencyId === agencyId && normalizeServiceName(c.serviceName) === normalizedServiceName)

  if (existing) {
    const normalized = normalizeConfig(agencyId, normalizedServiceName, existing.questions)
    if (JSON.stringify(existing) !== JSON.stringify(normalized)) {
      CONFIGS = CONFIGS.map((item) => (
        item.agencyId === agencyId && normalizeServiceName(item.serviceName) === normalizedServiceName
          ? normalized
          : item
      ))
      saveState({ feedback: FEEDBACK, configs: CONFIGS })
    }

    return normalized
  }

  const defaultConfig = normalizeConfig(agencyId, normalizedServiceName, undefined)
  CONFIGS = [...CONFIGS, defaultConfig]
  saveState({ feedback: FEEDBACK, configs: CONFIGS })
  return defaultConfig
}

export function updateAgencyServqualConfig(
  agencyId: string,
  serviceName: string,
  questions: ServqualQuestion[] | string[],
) {
  const normalizedServiceName = normalizeServiceName(serviceName)
  const idx = CONFIGS.findIndex((c) => c.agencyId === agencyId && normalizeServiceName(c.serviceName) === normalizedServiceName)
  const updated = normalizeConfig(agencyId, normalizedServiceName, questions)

  if (idx === -1) {
    CONFIGS = [...CONFIGS, updated]
  } else {
    CONFIGS = CONFIGS.map((c) => (
      c.agencyId === agencyId && normalizeServiceName(c.serviceName) === normalizedServiceName
        ? updated
        : c
    ))
  }

  saveState({ feedback: FEEDBACK, configs: CONFIGS })
}

export function clearAllFeedbackForTests() {
  FEEDBACK = []
  CONFIGS = []
  saveState({ feedback: FEEDBACK, configs: CONFIGS })
}

export { computeAgencyIdForCase }
