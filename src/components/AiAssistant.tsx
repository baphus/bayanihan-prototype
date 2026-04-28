import { useState, useRef, useEffect, useMemo } from 'react'
import { REFERRAL_CASES, getReferralCaseByCaseNo } from '../data/unifiedData'
import type { ReferralStatus } from '../data/unifiedData'
import { buildFaqList, findFaqByInput } from '../data/faqData'

type ChatSender = 'ai' | 'user'
type ChatMode = 'idle' | 'awaitingTrackingId'

type ChatMessage = {
  sender: ChatSender
  text: string
  links?: Array<{ label: string; href: string }>
}

const TRACKING_ID_REGEX = /^OW-[A-Z0-9]{7}$/

const QUICK_PROMPTS = [
  'Track case',
  'Check status',
  'View milestones',
  'Talk to agency',
  'Inform of agency services',
  'FAQ',
] as const

const EXAMPLE_TRACKING_IDS = REFERRAL_CASES.slice(0, 2).map((item) => item.caseNo)
const KNOWN_SERVICES = Array.from(new Set(REFERRAL_CASES.map((item) => item.service))).slice(0, 5)

function normalizeTrackingId(value: string): string {
  return value.trim().toUpperCase()
}

function isTrackingId(value: string): boolean {
  return TRACKING_ID_REGEX.test(normalizeTrackingId(value))
}

function getMilestonesPath(caseNo: string): string {
  return `/track/${encodeURIComponent(caseNo)}/milestones`
}

function getTrackCasePath(caseNo: string): string {
  return `/track/${encodeURIComponent(caseNo)}`
}

function getAgencyProgressSummary(status: ReferralStatus): string {
  if (status === 'PENDING') {
    return 'OWWA intake is queued, while DMW and TESDA updates are waiting for the next action.'
  }

  if (status === 'PROCESSING') {
    return 'OWWA is actively coordinating and cross-agency updates are in progress with DMW/TESDA.'
  }

  if (status === 'FOR_COMPLIANCE') {
    return 'OWWA requested compliance documents and is waiting for required submissions before continuing processing.'
  }

  if (status === 'COMPLETED') {
    return 'Required agency milestones are marked complete based on the latest records.'
  }

  return 'Agency activity is paused while the case is tagged as rejected in current records.'
}

function buildCaseSummaryMessage(targetCase: ReturnType<typeof getReferralCaseByCaseNo>): ChatMessage {
  if (!targetCase) {
    return {
      sender: 'ai',
      text: `I could not find that Tracking ID. Use format OW-XXXXXXX. Try ${EXAMPLE_TRACKING_IDS.join(' or ')}.`,
    }
  }

  return {
    sender: 'ai',
    text: [
      `Here are the details for ${targetCase.caseNo}:`,
      `Client: ${targetCase.clientName}`,
      `Service type: ${targetCase.service}`,
      `Current milestone: ${targetCase.milestone}`,
      `Current status: ${formatStatusLabel(targetCase.status)}`,
      `Last updated: ${formatDateTime(targetCase.updatedAt)}`,
      `Agency progress summary: ${getAgencyProgressSummary(targetCase.status)}`,
    ].join('\n'),
    links: [
      {
        label: 'Open track case page',
        href: getTrackCasePath(targetCase.caseNo),
      },
      {
        label: 'Open milestones page',
        href: getMilestonesPath(targetCase.caseNo),
      },
    ],
  }
}

function formatStatusLabel(status: ReferralStatus): string {
  if (status === 'PENDING') {
    return 'Pending'
  }

  if (status === 'PROCESSING') {
    return 'Processing'
  }

  if (status === 'FOR_COMPLIANCE') {
    return 'For Compliance'
  }

  if (status === 'COMPLETED') {
    return 'Completed'
  }

  return 'Rejected'
}

function formatDateTime(iso: string): string {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  }).format(new Date(iso))
}

export default function AiAssistant({ trackingId }: { trackingId?: string }) {
  const [isChatOpen, setIsChatOpen] = useState(false)
  const [inputValue, setInputValue] = useState('')
  const [chatMode, setChatMode] = useState<ChatMode>('idle')
  const trackedCase = useMemo(() => (trackingId ? getReferralCaseByCaseNo(trackingId) : undefined), [trackingId])
  const initialMessage = trackedCase
    ? `Hi, I am Benny, your AI assistant! I can help with Tracking ID ${trackedCase.caseNo}. Current status is ${formatStatusLabel(trackedCase.status)}.`
    : `Hi, I am Benny, your AI assistant! I can help explain tracking statuses or guide you to relevant services. How can I assist you${trackingId ? ` with Tracking ID ${trackingId}` : ''} today?`

  const [messages, setMessages] = useState<ChatMessage[]>([
    { sender: 'ai', text: initialMessage }
  ])
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    if (isChatOpen) {
      scrollToBottom()
    }
  }, [messages, isChatOpen])

  const respondToGuidedPrompt = (prompt: (typeof QUICK_PROMPTS)[number]): ChatMessage => {
    if (prompt === 'Track case') {
      setChatMode('awaitingTrackingId')
      return {
        sender: 'ai',
        text: `Please enter your Tracking ID in the chat box (format: OW-XXXXXXX). For example: ${EXAMPLE_TRACKING_IDS[0]}.`,
      }
    }

    setChatMode('idle')

    if (prompt === 'Check status') {
      if (trackedCase) {
        return {
          sender: 'ai',
          text: `Tracking ID ${trackedCase.caseNo} is currently ${formatStatusLabel(trackedCase.status)}. Current milestone is ${trackedCase.milestone}. Last update: ${formatDateTime(trackedCase.updatedAt)}.`,
          links: [
            {
              label: 'View milestones',
              href: getMilestonesPath(trackedCase.caseNo),
            },
          ],
        }
      }

      return {
        sender: 'ai',
        text: 'Share a Tracking ID first using "Track case" so I can check the current status for you.',
      }
    }

    if (prompt === 'View milestones') {
      if (trackedCase) {
        return {
          sender: 'ai',
          text: `You can open milestone progress for ${trackedCase.caseNo} from the link below.`,
          links: [
            {
              label: 'Open milestones page',
              href: getMilestonesPath(trackedCase.caseNo),
            },
          ],
        }
      }

      return {
        sender: 'ai',
        text: 'Use "Track case" first and send your Tracking ID, then I can give you the exact milestones link.',
      }
    }

    if (prompt === 'Talk to agency') {
      return {
        sender: 'ai',
        text: 'For case creation, please approach DMW only. If your case already exists, prepare your Tracking ID and I can guide referrals to the right partner agency based on your case stage.',
      }
    }

    if (prompt === 'FAQ') {
      return {
        sender: 'ai',
        text: `Here are common questions I can answer:\n${buildFaqList(4)}\n\nYou can also open the FAQ section below.`,
        links: [
          {
            label: 'Open FAQ section',
            href: '/#faq',
          },
        ],
      }
    }

    return {
      sender: 'ai',
      text: `Available agency services include: ${KNOWN_SERVICES.join(', ')}. If you share your Tracking ID, I can point you to the service currently tied to your case.`,
    }
  }

  const handleQuickPrompt = (prompt: (typeof QUICK_PROMPTS)[number]) => {
    const userMessage: ChatMessage = { sender: 'user', text: prompt }
    setMessages((prev) => [...prev, userMessage])

    setTimeout(() => {
      const aiResponse = respondToGuidedPrompt(prompt)
      setMessages((prev) => [...prev, aiResponse])
    }, 300)
  }

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault()
    if (!inputValue.trim()) return

    const userMessage: ChatMessage = { sender: 'user', text: inputValue }
    setMessages((prev) => [...prev, userMessage])
    setInputValue('')

    // Data-aware response logic using shared referral case data
    setTimeout(() => {
      let aiResponse: ChatMessage = {
        sender: 'ai',
        text: 'I am not sure how to respond to that. You can ask me about "DMW status", "TESDA referral", or general case assistance.',
      }

      if (chatMode === 'awaitingTrackingId') {
        const normalizedTrackingId = normalizeTrackingId(userMessage.text)

        if (!isTrackingId(normalizedTrackingId)) {
          aiResponse = {
            sender: 'ai',
            text: `Tracking ID must be in the format OW-XXXXXXX. Try ${EXAMPLE_TRACKING_IDS.join(' or ')}.`,
          }
          setMessages((prev) => [...prev, aiResponse])
          return
        }

        const matchedCase = getReferralCaseByCaseNo(normalizedTrackingId)
        aiResponse = buildCaseSummaryMessage(matchedCase)
        setChatMode(matchedCase ? 'idle' : 'awaitingTrackingId')
        setMessages((prev) => [...prev, aiResponse])
        return
      }

      const lowerInput = userMessage.text.toLowerCase()
      const inputCaseNoMatch = userMessage.text.match(/ow-[a-z0-9]{7}/i)
      const targetCaseNo = inputCaseNoMatch?.[0] ?? trackingId
      const targetCase = targetCaseNo ? getReferralCaseByCaseNo(targetCaseNo) : undefined
      const matchedFaq = findFaqByInput(userMessage.text)

      if (isTrackingId(userMessage.text)) {
        aiResponse = buildCaseSummaryMessage(getReferralCaseByCaseNo(normalizeTrackingId(userMessage.text)))
        setMessages((prev) => [...prev, aiResponse])
        return
      }

      const asksForStatus =
        lowerInput.includes('status') ||
        lowerInput.includes('progress') ||
        lowerInput.includes('update')

      const asksForMilestone =
        lowerInput.includes('milestone') ||
        lowerInput.includes('stage')

      const asksForTimeline =
        lowerInput.includes('timeline') ||
        lowerInput.includes('history')

      const asksForService =
        lowerInput.includes('service') ||
        lowerInput.includes('assistance')

      const asksForCaseCreationAgency =
        (lowerInput.includes('create') || lowerInput.includes('creation') || lowerInput.includes('new case')) &&
        (lowerInput.includes('agency') || lowerInput.includes('where') || lowerInput.includes('who'))

      if (asksForCaseCreationAgency) {
        aiResponse = {
          sender: 'ai',
          text: 'For new case creation, DMW is the only agency you should approach. Once created, the case may be referred to other partner agencies as needed.',
        }
      } else if (targetCase && (asksForStatus || asksForMilestone || asksForTimeline || asksForService)) {
        const milestoneText =
          targetCase.status === 'PENDING' ? 'No milestone has been added yet for this pending case.' : `Current milestone: ${targetCase.milestone}.`

        if (asksForStatus) {
          aiResponse = {
            sender: 'ai',
            text: `Tracking ID ${targetCase.caseNo} is ${formatStatusLabel(targetCase.status)} under ${targetCase.service}. ${milestoneText}`,
          }
        } else if (asksForMilestone) {
          aiResponse = {
            sender: 'ai',
            text: targetCase.status === 'PENDING'
              ? `Tracking ID ${targetCase.caseNo} is still pending. No milestone has been added yet.`
              : `For Tracking ID ${targetCase.caseNo}, milestone is "${targetCase.milestone}" and status is ${formatStatusLabel(targetCase.status)}.`,
            links: [
              {
                label: 'Open milestones page',
                href: getMilestonesPath(targetCase.caseNo),
              },
            ],
          }
        } else if (asksForTimeline) {
          aiResponse = {
            sender: 'ai',
            text: `Tracking ID ${targetCase.caseNo} was created on ${formatDateTime(targetCase.createdAt)} and last updated on ${formatDateTime(targetCase.updatedAt)}.`,
          }
        } else {
          aiResponse = {
            sender: 'ai',
            text: `Tracking ID ${targetCase.caseNo} is linked to ${targetCase.service} for a ${targetCase.clientType} client.`,
          }
        }
      } else if ((asksForStatus || asksForMilestone || asksForTimeline || asksForService) && !targetCase) {
        aiResponse = {
          sender: 'ai',
          text: `I could not find that Tracking ID in the shared records. Please provide a valid Tracking ID like ${EXAMPLE_TRACKING_IDS[0]}.`,
        }
      }

      if (matchedFaq) {
        aiResponse = {
          sender: 'ai',
          text: matchedFaq.answer,
          links: [
            {
              label: 'View full FAQs',
              href: '/#faq',
            },
          ],
        }
      } else if (lowerInput.includes('dmw') || lowerInput.includes('contract')) {
        aiResponse = {
          sender: 'ai',
          text: "DMW has completed your contract verification. You can view the full DMW timeline by clicking 'View Milestones' on the DMW card above.",
        }
      } else if (lowerInput.includes('tesda') || lowerInput.includes('training')) {
        aiResponse = {
          sender: 'ai',
          text: 'Your case has been forwarded to TESDA and is currently pending acknowledgment. We will notify you once they begin processing.',
        }
      } else if (!targetCase && (lowerInput.includes('owwa') || lowerInput.includes('status'))) {
        aiResponse = {
          sender: 'ai',
          text: 'OWWA is currently processing your initial assessment. This is the active stage of your overall case.',
        }
      } else if (lowerInput.includes('hello') || lowerInput.includes('hi')) {
        aiResponse = {
          sender: 'ai',
          text: 'Hello! I am Benny. How can I assist with your OFW reintegration case today?',
        }
      } else if (!targetCase && (lowerInput.includes('timeline') || lowerInput.includes('history'))) {
        aiResponse = {
          sender: 'ai',
          text: 'You can view your complete aggregated timeline on the right side of this page. The last update was DMW changing status to completed.',
        }
      }

      setMessages((prev) => [...prev, aiResponse])
    }, 800)
  }

  return (
    <>
      {/* AI Assistant Bubble & Chat Modal */}
      {isChatOpen && (
        <div className="fixed bottom-[110px] right-[30px] z-50 w-[380px] overflow-hidden rounded-[24px] bg-[#fdfdfd] shadow-[0_20px_40px_-12px_rgba(0,0,0,0.25)] ring-1 ring-slate-900/5 flex flex-col h-[580px] animate-in slide-in-from-bottom-6 zoom-in-95 duration-300">
          {/* Chat Header */}
          <div className="relative flex items-center justify-between bg-white px-[20px] py-[18px] border-b border-slate-100 shrink-0">
            <div className="flex items-center gap-3.5">
              <div className="relative flex h-[42px] w-[42px] items-center justify-center rounded-full bg-gradient-to-b from-blue-50 to-blue-100 border border-blue-200 shadow-sm">
                <span className="material-symbols-outlined text-[22px] text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>auto_awesome</span>
                <div className="absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full bg-[#10b981] border-2 border-white" />
              </div>
              <div className="flex flex-col">
                <h3 className="text-[15px] font-[800] text-slate-800 tracking-tight leading-none">Benny</h3>
                <div className="flex items-center gap-1.5 mt-[5px]">
                  <span className="text-[10px] font-[600] uppercase tracking-[0.05em] text-slate-400">AI Support Agent</span>
                </div>
              </div>
            </div>
            <button 
              onClick={() => setIsChatOpen(false)}
              className="flex h-[32px] w-[32px] items-center justify-center rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors"
            >
              <span className="material-symbols-outlined text-[20px]">close</span>
            </button>
          </div>

          <div className="bg-white px-4 py-3 border-b border-slate-100">
            <div className="flex flex-wrap gap-2">
              {QUICK_PROMPTS.map((prompt) => (
                <button
                  key={prompt}
                  type="button"
                  onClick={() => handleQuickPrompt(prompt)}
                  className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-[11px] font-semibold text-slate-600 transition-colors hover:border-primary/30 hover:text-primary"
                >
                  {prompt}
                </button>
              ))}
            </div>
          </div>

          {/* Chat Messages */}
          <div className="flex-1 overflow-y-auto p-5 space-y-5 bg-[#f8fafc] text-[12.5px] font-body relative hide-scrollbar">
            <div className="text-center mb-6">
              <span className="text-[9.5px] font-bold text-slate-400 uppercase tracking-widest bg-white px-3 py-1.5 rounded-full shadow-sm ring-1 ring-slate-900/5">
                Today, 09:41 AM
              </span>
            </div>

            {messages.map((msg, idx) => (
              <div key={idx} className={`flex w-full ${msg.sender === 'user' ? 'justify-end' : 'justify-start gap-2.5'}`}>
                {msg.sender === 'ai' && (
                  <div className="mt-auto flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gradient-to-b from-blue-50 to-blue-100 border border-blue-200 shadow-sm">
                    <span className="material-symbols-outlined text-[14px] text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>auto_awesome</span>
                  </div>
                )}
                
                <div 
                  className={`max-w-[78%] px-4 py-3 ${
                    msg.sender === 'user' 
                      ? 'bg-[#005288] text-white rounded-[18px] rounded-br-[6px] shadow-sm' 
                      : 'bg-white text-slate-700 shadow-sm border border-slate-100/50 rounded-[18px] rounded-bl-[6px] leading-relaxed'
                  }`}
                >
                  <p className={`whitespace-pre-wrap font-medium ${msg.sender === 'user' ? 'text-white' : 'text-slate-700'}`}>{msg.text}</p>
                  {msg.sender === 'ai' && msg.links?.length ? (
                    <div className="mt-2 space-y-1">
                      {msg.links.map((link) => (
                        <a
                          key={`${link.href}-${link.label}`}
                          href={link.href}
                          className="inline-flex text-[11px] font-semibold text-primary underline underline-offset-2 hover:opacity-80"
                        >
                          {link.label}
                        </a>
                      ))}
                    </div>
                  ) : null}
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          {/* Chat Input */}
          <div className="bg-white p-4 pt-3 border-t border-slate-100 rounded-b-[24px]">
            <form onSubmit={handleSendMessage} className="relative flex items-center pr-1.5 bg-[#f1f5f9] border border-[#e2e8f0] rounded-[24px] focus-within:ring-2 focus-within:ring-primary/20 focus-within:bg-white focus-within:border-primary/30 transition-all shadow-inner">
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder={chatMode === 'awaitingTrackingId' ? 'Enter Tracking ID (OW-XXXXXXX)...' : 'Message Benny...'}
                className="flex-1 bg-transparent px-[18px] py-3.5 text-[13px] font-medium text-slate-700 outline-none placeholder:text-slate-400 placeholder:font-normal"
              />
              <button 
                type="submit"
                disabled={!inputValue.trim()}
                className="flex h-[34px] w-[34px] shrink-0 items-center justify-center rounded-full bg-gradient-to-b from-primary to-[#00497b] text-white transition-all hover:opacity-90 hover:shadow-md hover:-translate-y-0.5 disabled:opacity-40 disabled:hover:shadow-none disabled:hover:translate-y-0"
              >
                <span className="material-symbols-outlined text-[16px]" style={{ fontVariationSettings: "'FILL' 1", transform: 'translateX(1px)' }}>arrow_upward</span>
              </button>
            </form>
            <div className="mt-3 flex justify-center items-center gap-1.5 opacity-60">
               <span className="material-symbols-outlined text-[10px] text-slate-500" style={{ fontVariationSettings: "'FILL' 1" }}>verified_user</span>
               <span className="text-[9.5px] font-medium text-slate-500">AI responses are for guidance only.</span>
            </div>
          </div>
        </div>
      )}

      {/* Floating Toggle Button */}
      <button 
        onClick={() => setIsChatOpen(prev => !prev)}
        className="group fixed bottom-[30px] right-[30px] z-[51] flex h-[64px] w-[64px] items-center justify-center rounded-full bg-gradient-to-b from-[#005288] to-[#003d66] shadow-[0_8px_30px_rgba(0,82,136,0.4)] ring-4 ring-white/20 transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_12px_40px_rgba(0,82,136,0.5)] active:scale-95"
        aria-label={isChatOpen ? "Close AI Assistant" : "Open AI Assistant"}
      >
        {!isChatOpen && (
          <>
            <div className="absolute inset-0 rounded-full bg-[#005288] animate-ping opacity-20" style={{ animationDuration: '3s' }} />
            <div className="absolute -right-1 -top-1 h-4 w-4 rounded-full bg-[#10b981] border-[2.5px] border-white" />
          </>
        )}
        <span className={`material-symbols-outlined text-[30px] text-white transition-transform duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)] absolute`} style={{ fontVariationSettings: "'FILL' 1", transform: isChatOpen ? 'rotate(90deg) scale(0)' : 'rotate(0) scale(1)', opacity: isChatOpen ? 0 : 1 }}>
          auto_awesome
        </span>
        <span className={`material-symbols-outlined text-[30px] text-white transition-transform duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)] absolute`} style={{ transform: isChatOpen ? 'rotate(0) scale(1)' : 'rotate(-90deg) scale(0)', opacity: isChatOpen ? 1 : 0 }}>
          close
        </span>
        
        {/* Tooltip */}
        {!isChatOpen && (
          <div className="absolute right-[calc(100%+20px)] top-1/2 -translate-y-1/2 whitespace-nowrap rounded-[10px] bg-slate-800 px-3.5 py-2 text-[10.5px] font-[800] uppercase tracking-[0.06em] text-white opacity-0 shadow-lg transition-opacity duration-300 group-hover:opacity-100 pointer-events-none">
            Ask Benny
            <div className="absolute right-[-5px] top-1/2 -translate-y-1/2 border-y-[6px] border-l-[6px] border-y-transparent border-l-slate-800" />
            <div className="absolute top-[2px] right-[2px] h-1.5 w-1.5 rounded-full bg-[#10b981] animate-pulse" />
          </div>
        )}
      </button>
    </>
  )
}