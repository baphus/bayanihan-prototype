import { useMemo, useState } from 'react'

type ServqualFeedbackPanelProps = {
  trackingId: string
}

export default function ServqualFeedbackPanel({ trackingId }: ServqualFeedbackPanelProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [rating, setRating] = useState(4)
  const [comments, setComments] = useState('')

  const ratingLabel = useMemo(() => {
    if (rating === 5) {
      return 'Excellent'
    }
    if (rating === 4) {
      return 'Good'
    }
    if (rating === 3) {
      return 'Fair'
    }
    if (rating === 2) {
      return 'Needs improvement'
    }
    return 'Poor'
  }, [rating])

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setIsSubmitted(true)
  }

  const handleOpen = () => {
    setIsOpen(true)
    setIsSubmitted(false)
  }

  return (
    <section className="mt-6 border border-surface-container-high bg-white p-4 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-[11px] font-black uppercase tracking-[0.13em] text-primary">SERVQUAL Feedback</h2>
          <p className="mt-1 text-[10px] leading-4 text-on-surface-variant">
            Help us evaluate quality for tracking ID <span className="font-bold text-on-surface">{trackingId}</span>.
          </p>
        </div>

        <button
          type="button"
          onClick={handleOpen}
          aria-expanded={isOpen}
          aria-controls="servqual-feedback-form"
          className="inline-flex h-9 items-center gap-1.5 bg-primary px-3 text-[10px] font-bold uppercase tracking-[0.1em] text-white hover:brightness-110"
        >
          <span className="material-symbols-outlined text-[14px]">rate_review</span>
          Give Feedback
        </button>
      </div>

      {isOpen ? (
        <div id="servqual-feedback-form" className="mt-4 border-t border-surface-container-high pt-4">
          {isSubmitted ? (
            <div className="border-l-[3px] border-secondary bg-secondary-container/30 px-4 py-3">
              <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-secondary">Feedback submitted</p>
              <p className="mt-1 text-[11px] text-on-surface-variant">
                Thank you. Your SERVQUAL rating has been recorded as{' '}
                <span className="font-bold text-on-surface">{rating}/5</span> ({ratingLabel}).
              </p>
            </div>
          ) : null}

          <form className="mt-4 space-y-5" onSubmit={handleSubmit}>
            <div className="rounded-[3px] border border-surface-container-high bg-surface-container-lowest p-3">
              <label className="flex flex-col gap-2">
                <span className="text-[10px] font-extrabold uppercase tracking-[0.08em] text-primary">
                  Overall SERVQUAL Rating (1-5)
                </span>
                <select
                  value={rating}
                  onChange={(event) => setRating(Number(event.target.value))}
                  className="h-9 w-full border border-surface-container-high bg-white px-2 text-[11px] text-on-surface focus:border-primary focus:outline-none sm:w-[220px]"
                >
                  {[1, 2, 3, 4, 5].map((score) => (
                    <option key={`rating-${score}`} value={score}>
                      {score}
                    </option>
                  ))}
                </select>
                <p className="text-[10px] text-on-surface-variant">Current selection: {rating}/5 ({ratingLabel})</p>
              </label>
            </div>

            <div className="rounded-[3px] border border-surface-container-high bg-surface-container-lowest px-3 py-2">
              <p className="text-[9px] font-bold uppercase tracking-[0.08em] text-on-surface-variant">SERVQUAL scale guide</p>
              <p className="mt-1 text-[10px] leading-4 text-on-surface-variant">1 = poor service quality, 5 = excellent service quality.</p>
            </div>

            <label className="flex flex-col gap-1">
              <span className="text-[9px] font-bold uppercase tracking-[0.08em] text-on-surface-variant">Additional comments</span>
              <textarea
                value={comments}
                onChange={(event) => setComments(event.target.value)}
                rows={4}
                placeholder="Share what worked well and what should improve."
                className="resize-y border border-surface-container-high bg-surface-container-lowest px-3 py-2 text-[11px] text-on-surface placeholder:text-on-surface-variant/70 focus:border-primary focus:outline-none"
              />
            </label>

            <div className="flex flex-wrap items-center justify-between gap-2 border-t border-surface-container-high pt-3">
              <p className="text-[10px] font-semibold text-on-surface-variant">
                Selected rating: <span className="font-black text-on-surface">{rating}/5</span> ({ratingLabel})
              </p>
              <button
                type="submit"
                className="inline-flex h-9 items-center gap-1.5 bg-primary px-3 text-[10px] font-bold uppercase tracking-[0.1em] text-white hover:brightness-110"
              >
                <span className="material-symbols-outlined text-[14px]">send</span>
                Submit Rating
              </button>
            </div>
          </form>
        </div>
      ) : null}
    </section>
  )
}