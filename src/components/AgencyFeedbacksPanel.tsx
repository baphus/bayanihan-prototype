import { useMemo, useState } from 'react'
import { UnifiedTable, type Column } from './ui/UnifiedTable'
import { useNavigate } from 'react-router-dom'
import {
  getAgencyServqualConfig,
  getFeedbackByAgency,
  SERVQUAL_DIMENSIONS,
  type FeedbackEntry,
  type ServqualDimension,
  type ServqualQuestion,
  updateAgencyServqualConfig,
} from '../data/feedbackData'
import { AGENCIES_DATA } from '../data/agenciesData'

type Props = {
  agencyId?: string
  isConcise?: boolean
}

type DimensionMetric = {
  dimension: ServqualDimension
  averageExpectation: number
  averagePerception: number
  gapScore: number
}

export default function AgencyFeedbacksPanel({ agencyId, isConcise = false }: Props) {
  const effectiveAgencyId = agencyId ?? AGENCIES_DATA[0].id
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const [selectedService, setSelectedService] = useState('all')
  const [sortKey, setSortKey] = useState<'date' | 'score'>('date')
  const [selectedFeedback, setSelectedFeedback] = useState<FeedbackEntry | null>(null)
  const [isQuestionModalOpen, setIsQuestionModalOpen] = useState(false)
  const [questionDrafts, setQuestionDrafts] = useState<ServqualQuestion[]>([])

  const allFeedback = useMemo(() => getFeedbackByAgency(effectiveAgencyId), [effectiveAgencyId])

  const serviceOptions = useMemo(() => {
    return Array.from(new Set(allFeedback.map((item) => item.serviceName).filter(Boolean)))
  }, [allFeedback])

  const questionnaireService = selectedService === 'all'
    ? serviceOptions[0] ?? 'General Service'
    : selectedService

  const config = useMemo(
    () => getAgencyServqualConfig(effectiveAgencyId, questionnaireService),
    [effectiveAgencyId, questionnaireService],
  )

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase()

    const next = allFeedback.filter((feedback) => {
      const matchesSearch = !query || [
        feedback.caseNo,
        feedback.serviceName,
        feedback.userName,
        feedback.comments,
      ].some((value) => (value ?? '').toLowerCase().includes(query))

      const matchesService = selectedService === 'all' || feedback.serviceName === selectedService
      return matchesSearch && matchesService
    })

    return [...next].sort((a, b) => {
      if (sortKey === 'score') {
        return b.gapScore - a.gapScore
      }

      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    })
  }, [allFeedback, search, selectedService, sortKey])

  const overview = useMemo(() => {
    const total = filtered.length
    if (total === 0) {
      return {
        totalFeedbacks: 0,
        avgPerception: 0,
        avgExpectation: 0,
        avgGap: 0,
      }
    }

    const responses = filtered.flatMap((feedback) => feedback.responses)
    const avgPerception = responses.reduce((sum, item) => sum + item.perception, 0) / Math.max(1, responses.length)
    const avgExpectation = responses.reduce((sum, item) => sum + item.expectation, 0) / Math.max(1, responses.length)
    const avgGap = responses.reduce((sum, item) => sum + item.gap, 0) / Math.max(1, responses.length)

    return {
      totalFeedbacks: total,
      avgPerception,
      avgExpectation,
      avgGap,
    }
  }, [filtered])

  const dimensionMetrics = useMemo<DimensionMetric[]>(() => {
    return SERVQUAL_DIMENSIONS.map((dimension) => {
      const scoped = filtered.flatMap((feedback) => feedback.responses).filter((response) => response.dimension === dimension)
      const averageExpectation = scoped.length > 0
        ? scoped.reduce((sum, item) => sum + item.expectation, 0) / scoped.length
        : 0
      const averagePerception = scoped.length > 0
        ? scoped.reduce((sum, item) => sum + item.perception, 0) / scoped.length
        : 0
      const gapScore = scoped.length > 0
        ? scoped.reduce((sum, item) => sum + item.gap, 0) / scoped.length
        : 0

      return {
        dimension,
        averageExpectation,
        averagePerception,
        gapScore,
      }
    })
  }, [filtered])

  const trendSeries = useMemo(() => {
    const monthMap = new Map<string, { label: string; total: number; count: number }>()

    filtered.forEach((item) => {
      const date = new Date(item.createdAt)
      const key = `${date.getFullYear()}-${date.getMonth()}`
      const existing = monthMap.get(key)
      if (!existing) {
        monthMap.set(key, {
          label: date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' }),
          total: item.gapScore,
          count: 1,
        })
        return
      }

      existing.total += item.gapScore
      existing.count += 1
    })

    return Array.from(monthMap.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .slice(-6)
      .map(([, value]) => ({
        label: value.label,
        score: value.total / Math.max(1, value.count),
      }))
  }, [filtered])

  const insightMessage = useMemo(() => {
    const sorted = [...dimensionMetrics].sort((a, b) => a.gapScore - b.gapScore)
    const lowest = sorted[0]
    const highest = sorted[sorted.length - 1]

    if (!lowest || !highest) {
      return 'No SERVQUAL insight yet. Submit feedback data to generate recommendations.'
    }

    if (lowest.gapScore >= 0) {
      return `${highest.dimension} is performing well, and all dimensions are meeting expectations.`
    }

    return `${lowest.dimension} has the lowest score and needs improvement. ${highest.dimension} currently performs best.`
  }, [dimensionMetrics])

  const dimensionColumns: Column<DimensionMetric>[] = [
    {
      key: 'dimension',
      title: 'Dimension',
      sortable: true,
      render: (row) => <span className="font-semibold text-on-surface">{row.dimension}</span>,
    },
    {
      key: 'averageExpectation',
      title: 'Avg Expectation',
      sortable: true,
      render: (row) => row.averageExpectation.toFixed(2),
    },
    {
      key: 'averagePerception',
      title: 'Avg Perception',
      sortable: true,
      render: (row) => row.averagePerception.toFixed(2),
    },
    {
      key: 'gapScore',
      title: 'Gap (P-E)',
      sortable: true,
      render: (row) => (
        <span className={`font-bold ${row.gapScore >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
          {row.gapScore >= 0 ? '+' : ''}{row.gapScore.toFixed(2)}
        </span>
      ),
    },
  ]

  const feedbackColumns: Column<FeedbackEntry>[] = [
    {
      key: 'createdAt',
      title: 'Date',
      sortable: true,
      sortAccessor: (row) => new Date(row.createdAt).toISOString(),
      render: (row) => new Date(row.createdAt).toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' }),
    },
    { key: 'serviceName', title: 'Service Name', sortable: true },
    {
      key: 'userName',
      title: 'User',
      sortable: true,
      render: (row) => <span>{row.userName ?? 'Anonymous'}</span>,
    },
    {
      key: 'overallRating',
      title: 'Overall Rating',
      sortable: true,
      render: (row) => <span className="font-semibold">{row.overallRating.toFixed(2)}/5</span>,
    },
    {
      key: 'gapScore',
      title: 'Gap Score',
      sortable: true,
      render: (row) => (
        <span className={`font-semibold ${row.gapScore >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
          {row.gapScore >= 0 ? '+' : ''}{row.gapScore.toFixed(2)}
        </span>
      ),
    },
    {
      key: 'actions',
      title: 'Actions',
      sortable: false,
      render: (row) => (
        <button
          type="button"
          onClick={() => setSelectedFeedback(row)}
          className="rounded-[4px] border border-surface-container-high bg-surface px-3 py-1 text-xs font-bold text-primary hover:bg-primary hover:text-white transition-colors"
        >
          View Details
        </button>
      ),
    },
  ]

  function formatGap(value: number) {
    return `${value >= 0 ? '+' : ''}${value.toFixed(2)}`
  }

  function handleExportData() {
    const payload = {
      agencyId: effectiveAgencyId,
      exportedAt: new Date().toISOString(),
      overview,
      feedback: filtered,
      dimensionMetrics,
      config,
    }

    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = `feedback-${effectiveAgencyId}-${new Date().toISOString().slice(0, 10)}.json`
    anchor.click()
    URL.revokeObjectURL(url)
  }

  function openQuestionModal() {
    setQuestionDrafts(config.questions.map((question) => ({ ...question })))
    setIsQuestionModalOpen(true)
  }

  function closeQuestionModal() {
    setIsQuestionModalOpen(false)
    setQuestionDrafts([])
  }

  function updateQuestion(index: number, next: Partial<ServqualQuestion>) {
    setQuestionDrafts((prev) => prev.map((item, i) => (i === index ? { ...item, ...next } : item)))
  }

  function moveQuestion(index: number, direction: 'up' | 'down') {
    setQuestionDrafts((prev) => {
      const target = direction === 'up' ? index - 1 : index + 1
      if (target < 0 || target >= prev.length) {
        return prev
      }

      const next = [...prev]
      const current = next[index]
      next[index] = next[target]
      next[target] = current
      return next
    })
  }

  function removeQuestion(index: number) {
    setQuestionDrafts((prev) => prev.filter((_, i) => i !== index))
  }

  function addQuestion() {
    setQuestionDrafts((prev) => [
      ...prev,
      {
        id: `q-${effectiveAgencyId}-${Date.now()}-${prev.length + 1}`,
        text: '',
        dimension: 'Tangibles',
      },
    ])
  }

  function saveQuestions() {
    const cleaned = questionDrafts
      .map((question, index) => ({
        ...question,
        id: question.id || `q-${effectiveAgencyId}-${questionnaireService}-${index + 1}`,
        text: question.text.trim(),
      }))
      .filter((question) => question.text.length > 0)

    if (cleaned.length === 0) {
      return
    }

    updateAgencyServqualConfig(effectiveAgencyId, questionnaireService, cleaned)
    setIsQuestionModalOpen(false)
  }

  if (isConcise) {
    return (
      <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="text-[14px] font-bold text-slate-900 uppercase tracking-wider">Feedbacks Overview</h3>
              <p className="mt-1 text-[12px] text-slate-500">Quick glimpse of agency feedback scores.</p>
            </div>
            <div className="h-8 w-8 rounded bg-primary/10 flex items-center justify-center text-primary">
              <span className="material-symbols-outlined text-[18px]">forum</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 mt-2">
            <div className="rounded-lg bg-slate-50 p-4 border border-slate-100 flex flex-col items-center justify-center">
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Total Received</p>
              <h4 className="text-2xl font-black text-slate-800">{overview.totalFeedbacks}</h4>
            </div>
            <div className="rounded-lg bg-slate-50 p-4 border border-slate-100 flex flex-col items-center justify-center">
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Avg Rating</p>
              <h4 className="text-2xl font-black text-slate-800">{overview.avgPerception.toFixed(2)}</h4>
            </div>
          </div>

          <button
            type="button"
            onClick={() => navigate('/agency/feedbacks')}
            className="mt-2 w-full flex items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-[12px] font-bold text-slate-600 hover:bg-slate-50 hover:border-slate-300 hover:text-primary transition-all active:scale-[0.98]"
          >
            <span>VIEW FULL FEEDBACKS</span>
            <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
          </button>
        </div>
      </section>
    )
  }

  return (
    <section className="space-y-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-on-surface">Agency Feedbacks</h2>
          <p className="text-sm text-on-surface-variant">Monitor and improve service quality using SERVQUAL</p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={openQuestionModal}
            className="rounded-[4px] bg-primary px-4 py-2 text-xs font-bold uppercase tracking-[0.08em] text-white shadow-sm hover:brightness-110"
          >
            Edit SERVQUAL Questions
          </button>
          <button
            type="button"
            onClick={handleExportData}
            className="rounded-[4px] border border-surface-container-high bg-white px-4 py-2 text-xs font-bold uppercase tracking-[0.08em] text-on-surface hover:bg-surface-container-low"
          >
            Export Data
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Total Feedbacks" value={String(overview.totalFeedbacks)} />
        <MetricCard label="Average Perception Score" value={overview.avgPerception.toFixed(2)} />
        <MetricCard label="Average Expectation Score" value={overview.avgExpectation.toFixed(2)} />
        <MetricCard
          label="Overall SERVQUAL Gap"
          value={formatGap(overview.avgGap)}
          valueClassName={overview.avgGap >= 0 ? 'text-emerald-600' : 'text-rose-600'}
        />
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-12">
        <div className="xl:col-span-8 space-y-6">
          <div className="rounded-[6px] border border-surface-container-high bg-white p-4 shadow-sm">
            <UnifiedTable
              data={dimensionMetrics}
              columns={dimensionColumns}
              keyExtractor={(row) => row.dimension}
              title="SERVQUAL Dimension Breakdown"
              hideControlBar
              hidePagination
            />
          </div>

          <div className="rounded-[6px] border border-surface-container-high bg-white p-4 shadow-sm space-y-3">
            <h3 className="text-sm font-black uppercase tracking-[0.08em] text-on-surface">Gap per Dimension</h3>
            {dimensionMetrics.map((item) => {
              const width = Math.min(100, Math.abs(item.gapScore) * 50)
              return (
                <div key={`bar-${item.dimension}`} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-on-surface">{item.dimension}</span>
                    <span className={`font-bold ${item.gapScore >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                      {formatGap(item.gapScore)}
                    </span>
                  </div>
                  <div className="h-2 overflow-hidden rounded bg-surface-container-high">
                    <div
                      className={`h-full ${item.gapScore >= 0 ? 'bg-emerald-500' : 'bg-rose-500'}`}
                      style={{ width: `${Math.max(6, width)}%` }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        <div className="xl:col-span-4 space-y-6">
          <div className="rounded-[6px] border border-surface-container-high bg-white p-4 shadow-sm">
            <h3 className="text-sm font-black uppercase tracking-[0.08em] text-on-surface">Insights</h3>
            <p className="mt-3 text-sm leading-6 text-on-surface-variant">{insightMessage}</p>
          </div>

          <div className="rounded-[6px] border border-surface-container-high bg-white p-4 shadow-sm space-y-3">
            <h3 className="text-sm font-black uppercase tracking-[0.08em] text-on-surface">SERVQUAL Trend</h3>
            <div className="flex items-end gap-2 h-28">
              {trendSeries.length === 0 ? (
                <p className="text-xs text-on-surface-variant">Not enough trend data.</p>
              ) : (
                trendSeries.map((point) => {
                  const normalized = Math.max(4, Math.min(100, (point.score + 2) * 22))
                  return (
                    <div key={point.label} className="flex-1 flex flex-col items-center gap-1">
                      <div className={`w-full rounded-t ${point.score >= 0 ? 'bg-emerald-500' : 'bg-rose-500'}`} style={{ height: `${normalized}%` }} />
                      <span className="text-[10px] text-on-surface-variant">{point.label}</span>
                    </div>
                  )
                })
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-[6px] border border-surface-container-high bg-white p-4 shadow-sm space-y-4">
        <div className="flex flex-wrap items-end gap-3">
          <label className="flex flex-col gap-1 text-xs font-bold uppercase tracking-[0.06em] text-on-surface-variant">
            Service Filter
            <select
              value={selectedService}
              onChange={(event) => setSelectedService(event.target.value)}
              className="h-10 min-w-[220px] rounded-[4px] border border-surface-container-high bg-white px-3 text-sm text-on-surface"
            >
              <option value="all">All Services</option>
              {serviceOptions.map((service) => (
                <option key={service} value={service}>{service}</option>
              ))}
            </select>
          </label>

          <label className="flex flex-col gap-1 text-xs font-bold uppercase tracking-[0.06em] text-on-surface-variant">
            Sort By
            <select
              value={sortKey}
              onChange={(event) => setSortKey(event.target.value as 'date' | 'score')}
              className="h-10 min-w-[220px] rounded-[4px] border border-surface-container-high bg-white px-3 text-sm text-on-surface"
            >
              <option value="date">Date (latest first)</option>
              <option value="score">Gap Score (high to low)</option>
            </select>
          </label>
        </div>

        <UnifiedTable
          data={filtered}
          columns={feedbackColumns}
          keyExtractor={(row) => row.id}
          title="Feedback List"
          description="Search, filter, and inspect feedback for completed cases."
          searchValue={search}
          onSearchChange={setSearch}
          hidePagination
        />
      </div>

      {selectedFeedback ? (
        <div className="fixed inset-0 z-[70] bg-black/40 p-4 flex items-center justify-center">
          <div className="w-full max-w-4xl rounded-[8px] bg-white shadow-xl max-h-[85vh] overflow-hidden">
            <div className="flex items-center justify-between border-b border-surface-container-high px-5 py-4">
              <div>
                <h3 className="text-base font-black text-on-surface">Feedback Detail</h3>
                <p className="text-xs text-on-surface-variant">
                  {selectedFeedback.caseNo ?? selectedFeedback.caseId} • {selectedFeedback.serviceName}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedFeedback(null)}
                className="text-sm font-bold text-on-surface-variant hover:text-on-surface"
              >
                Close
              </button>
            </div>

            <div className="p-5 overflow-y-auto max-h-[70vh] space-y-3">
              {selectedFeedback.responses.map((response) => (
                <div key={`${selectedFeedback.id}-${response.questionId}`} className="rounded-[6px] border border-surface-container-high bg-surface-container-low p-4 space-y-2">
                  <p className="text-xs font-black uppercase tracking-[0.06em] text-primary">{response.dimension}</p>
                  <p className="text-sm font-semibold text-on-surface">{response.questionText}</p>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-sm">
                    <div className="rounded bg-white border border-surface-container-high px-3 py-2">
                      <p className="text-[10px] uppercase font-bold text-on-surface-variant">Expectation</p>
                      <p className="font-semibold">{response.expectation.toFixed(2)}</p>
                    </div>
                    <div className="rounded bg-white border border-surface-container-high px-3 py-2">
                      <p className="text-[10px] uppercase font-bold text-on-surface-variant">Perception</p>
                      <p className="font-semibold">{response.perception.toFixed(2)}</p>
                    </div>
                    <div className="rounded bg-white border border-surface-container-high px-3 py-2">
                      <p className="text-[10px] uppercase font-bold text-on-surface-variant">Gap (P-E)</p>
                      <p className={`font-semibold ${response.gap >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>{formatGap(response.gap)}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : null}

      {isQuestionModalOpen ? (
        <div className="fixed inset-0 z-[80] bg-black/45 p-4 flex items-center justify-center">
          <div className="w-full max-w-4xl rounded-[8px] bg-white shadow-xl max-h-[90vh] overflow-hidden">
            <div className="flex items-center justify-between border-b border-surface-container-high px-5 py-4">
              <div>
                <h3 className="text-base font-black text-on-surface">Edit SERVQUAL Questions</h3>
                <p className="text-xs text-on-surface-variant">
                  Service: <span className="font-bold text-on-surface">{questionnaireService}</span>
                </p>
              </div>
              <button type="button" onClick={closeQuestionModal} className="text-sm font-bold text-on-surface-variant hover:text-on-surface">Close</button>
            </div>

            <div className="p-5 overflow-y-auto max-h-[70vh] space-y-3">
              {questionDrafts.map((question, index) => (
                <div key={question.id} className="rounded-[6px] border border-surface-container-high bg-surface-container-low p-4 grid grid-cols-1 lg:grid-cols-12 gap-3 items-end">
                  <div className="lg:col-span-6">
                    <label className="text-[11px] font-bold uppercase tracking-[0.06em] text-on-surface-variant">Question</label>
                    <input
                      value={question.text}
                      onChange={(event) => updateQuestion(index, { text: event.target.value })}
                      className="mt-1 h-10 w-full rounded-[4px] border border-surface-container-high bg-white px-3 text-sm"
                      placeholder="Enter SERVQUAL question"
                    />
                  </div>

                  <div className="lg:col-span-3">
                    <label className="text-[11px] font-bold uppercase tracking-[0.06em] text-on-surface-variant">Dimension</label>
                    <select
                      value={question.dimension}
                      onChange={(event) => updateQuestion(index, { dimension: event.target.value as ServqualDimension })}
                      className="mt-1 h-10 w-full rounded-[4px] border border-surface-container-high bg-white px-3 text-sm"
                    >
                      {SERVQUAL_DIMENSIONS.map((dimension) => (
                        <option key={`${question.id}-${dimension}`} value={dimension}>{dimension}</option>
                      ))}
                    </select>
                  </div>

                  <div className="lg:col-span-3 flex gap-2 justify-end">
                    <button type="button" onClick={() => moveQuestion(index, 'up')} className="h-10 px-3 rounded border border-surface-container-high bg-white text-xs font-bold">Up</button>
                    <button type="button" onClick={() => moveQuestion(index, 'down')} className="h-10 px-3 rounded border border-surface-container-high bg-white text-xs font-bold">Down</button>
                    <button type="button" onClick={() => removeQuestion(index)} className="h-10 px-3 rounded border border-rose-200 bg-rose-50 text-xs font-bold text-rose-700">Delete</button>
                  </div>
                </div>
              ))}

              <button type="button" onClick={addQuestion} className="rounded-[4px] border border-dashed border-primary px-4 py-2 text-xs font-bold uppercase tracking-[0.08em] text-primary">
                Add Question
              </button>
            </div>

            <div className="border-t border-surface-container-high px-5 py-4 flex justify-end gap-2">
              <button type="button" onClick={closeQuestionModal} className="rounded-[4px] border border-surface-container-high bg-white px-4 py-2 text-xs font-bold uppercase">Cancel</button>
              <button type="button" onClick={saveQuestions} className="rounded-[4px] bg-primary px-4 py-2 text-xs font-bold uppercase text-white">Save Questions</button>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  )
}

function MetricCard({ label, value, valueClassName = 'text-on-surface' }: { label: string; value: string; valueClassName?: string }) {
  return (
    <article className="rounded-[6px] border border-surface-container-high bg-white p-4 shadow-sm">
      <p className="text-[11px] font-black uppercase tracking-[0.08em] text-on-surface-variant">{label}</p>
      <p className={`mt-2 text-2xl font-black ${valueClassName}`}>{value}</p>
    </article>
  )
}
