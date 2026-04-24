import { useEffect, useMemo, useState } from 'react'
import { formatDisplayDateTime, type CaseManagerReferralNote } from '../../data/unifiedData'

type ReferralNotesCarouselProps = {
  notes: CaseManagerReferralNote[]
  mostRecentCaseManagerNoteId?: string
}

function pinMostRecentCaseManagerNote(notes: CaseManagerReferralNote[], mostRecentCaseManagerNoteId?: string): CaseManagerReferralNote[] {
  if (!mostRecentCaseManagerNoteId) {
    return notes
  }

  const index = notes.findIndex((note) => note.id === mostRecentCaseManagerNoteId)
  if (index <= 0) {
    return notes
  }

  const copy = [...notes]
  const [mostRecent] = copy.splice(index, 1)
  copy.unshift(mostRecent)
  return copy
}

export default function ReferralNotesCarousel({ notes, mostRecentCaseManagerNoteId }: ReferralNotesCarouselProps) {
  const [activeIndex, setActiveIndex] = useState(0)

  const orderedNotes = useMemo(
    () => pinMostRecentCaseManagerNote(notes, mostRecentCaseManagerNoteId),
    [mostRecentCaseManagerNoteId, notes],
  )

  useEffect(() => {
    setActiveIndex(0)
  }, [orderedNotes.length, mostRecentCaseManagerNoteId])

  if (!orderedNotes.length) {
    return (
      <div className="rounded-[3px] border border-dashed border-[#cbd5e1] bg-[#f8fafc] px-4 py-6 text-center">
        <p className="text-[12px] font-semibold text-slate-600">No notes available yet.</p>
        <p className="mt-1 text-[11px] text-slate-500">Case managers can save referral notes at any stage of the timeline.</p>
      </div>
    )
  }

  const current = orderedNotes[activeIndex]
  const isMostRecentCaseManagerNote = current.id === mostRecentCaseManagerNoteId
  const canGoPrev = activeIndex > 0
  const canGoNext = activeIndex < orderedNotes.length - 1

  return (
    <div className="space-y-3">
      <div
        className={`rounded-[3px] border px-4 py-3 ${
          isMostRecentCaseManagerNote ? 'border-[#0b5384] bg-[#eef7ff]' : 'border-[#d8dee8] bg-[#f8fafc]'
        }`}
      >
        <div className="flex items-center justify-between gap-3">
          <p className="text-[10px] font-extrabold uppercase tracking-[0.1em] text-slate-500">{formatDisplayDateTime(current.createdAt)}</p>
          {isMostRecentCaseManagerNote ? (
            <span className="inline-flex rounded-[2px] border border-[#0b5384] bg-white px-2 py-0.5 text-[9px] font-extrabold uppercase tracking-[0.08em] text-[#0b5384]">
              Most Recent
            </span>
          ) : null}
        </div>
        <p className="mt-2 text-[12px] leading-6 text-slate-700">{current.content}</p>
        <p className="mt-2 text-[10px] font-semibold text-slate-500">{current.createdBy}</p>
      </div>

      <div className="flex items-center justify-between gap-2">
        <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-slate-500">
          Note {activeIndex + 1} of {orderedNotes.length}
        </p>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setActiveIndex((value) => Math.max(0, value - 1))}
            disabled={!canGoPrev}
            className="h-7 rounded-[3px] border border-[#cbd5e1] bg-white px-2 text-[10px] font-bold text-slate-600 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Previous
          </button>
          <button
            type="button"
            onClick={() => setActiveIndex((value) => Math.min(orderedNotes.length - 1, value + 1))}
            disabled={!canGoNext}
            className="h-7 rounded-[3px] border border-[#cbd5e1] bg-white px-2 text-[10px] font-bold text-slate-600 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  )
}
