import { useMemo, type ReactNode } from 'react'
import { formatDisplayDateTime, type CaseManagerReferralNote } from '../../data/unifiedData'

type CaseCommentsThreadProps = {
  notes: CaseManagerReferralNote[]
  mostRecentCaseManagerNoteId?: string
  onReply?: (note: CaseManagerReferralNote) => void
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

function getActorType(actor: string): 'Case Manager' | 'Agency Focal' | 'System' | 'Handler' {
  if (actor.includes('Case Manager')) {
    return 'Case Manager'
  }

  if (actor.includes('Agency Focal')) {
    return 'Agency Focal'
  }

  if (actor.toLowerCase().includes('system')) {
    return 'System'
  }

  return 'Handler'
}

function getAuthorInitials(author: string): string {
  const cleaned = author
    .replace('Case Manager -', '')
    .replace('Agency Focal -', '')
    .trim()

  const tokens = cleaned.split(/\s+/).filter(Boolean)
  if (!tokens.length) {
    return 'NA'
  }

  const first = tokens[0]?.charAt(0) ?? ''
  const second = tokens[1]?.charAt(0) ?? ''
  return `${first}${second}`.toUpperCase()
}

export default function CaseCommentsThread({ notes, mostRecentCaseManagerNoteId, onReply }: CaseCommentsThreadProps) {
  const orderedNotes = useMemo(
    () => pinMostRecentCaseManagerNote(notes, mostRecentCaseManagerNoteId),
    [mostRecentCaseManagerNoteId, notes],
  )

  const threadNotes = useMemo(
    () => [...orderedNotes].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()),
    [orderedNotes],
  )

  const notesById = useMemo(() => {
    return new Map(threadNotes.map((note) => [note.id, note]))
  }, [threadNotes])

  const repliesByParentId = useMemo(() => {
    const buckets = new Map<string, CaseManagerReferralNote[]>()

    threadNotes.forEach((note) => {
      if (!note.parentNoteId) {
        return
      }

      const parentReplies = buckets.get(note.parentNoteId) ?? []
      parentReplies.push(note)
      buckets.set(note.parentNoteId, parentReplies)
    })

    return buckets
  }, [threadNotes])

  const rootNotes = useMemo(() => {
    return threadNotes.filter((note) => !note.parentNoteId || !notesById.has(note.parentNoteId))
  }, [threadNotes, notesById])

  if (!threadNotes.length) {
    return (
      <div className="rounded-[3px] border border-dashed border-[#cbd5e1] bg-[#f8fafc] px-3 py-4 text-center">
        <p className="text-[11px] font-semibold text-slate-600">No comments yet.</p>
      </div>
    )
  }

  const renderComment = (note: CaseManagerReferralNote, depth: number, ancestry: Set<string>): ReactNode => {
    if (ancestry.has(note.id)) {
      return null
    }

    const nextAncestry = new Set(ancestry)
    nextAncestry.add(note.id)

    const replies = repliesByParentId.get(note.id) ?? []
    const actorType = getActorType(note.createdBy)
    const isReply = depth > 0
    const wrapperClass = isReply
      ? 'rounded-[3px] border border-[#e2e8f0] bg-[#f8fafc] px-2.5 py-2'
      : `rounded-[3px] border px-3 py-3 ${
          note.id === mostRecentCaseManagerNoteId ? 'border-[#0b5384] bg-[#eef7ff]' : 'border-[#d8dee8] bg-white'
        }`

    return (
      <div key={note.id} className="space-y-1.5">
        <article className={wrapperClass}>
          <div className="flex items-start gap-2.5">
            <div className="mt-0.5 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-slate-100 text-[9px] font-extrabold text-slate-600">
              {getAuthorInitials(note.createdBy)}
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-1.5">
                <p className="text-[11px] font-semibold text-slate-700">{note.createdBy}</p>
                <span className="text-[9px] text-slate-400">• {actorType}</span>
              </div>
              <p className="mt-0.5 text-[9px] text-slate-400">{formatDisplayDateTime(note.createdAt)}</p>
              <p className="mt-1.5 text-[11px] leading-5 text-slate-700 whitespace-pre-wrap">{note.content}</p>
              {onReply ? (
                <div className="mt-1.5">
                  <button
                    type="button"
                    onClick={() => onReply(note)}
                    className="text-[10px] font-semibold text-[#0b5384] hover:underline"
                  >
                    Reply
                  </button>
                </div>
              ) : null}
            </div>
          </div>
        </article>

        {replies.length ? (
          <div className="ml-4 space-y-1.5 border-l border-[#d8dee8] pl-2.5">
            {replies.map((reply) => renderComment(reply, depth + 1, nextAncestry))}
          </div>
        ) : null}
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {rootNotes.map((note) => renderComment(note, 0, new Set()))}

      <div className="border-t border-[#e2e8f0] pt-1.5">
        <p className="text-[10px] text-slate-500">
          {threadNotes.length} {threadNotes.length === 1 ? 'Comment' : 'Comments'}
        </p>
      </div>
    </div>
  )
}