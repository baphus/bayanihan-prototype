export type FaqItem = {
  id: string
  category: string
  question: string
  answer: string
  keywords: string[]
}

export const FAQ_ITEMS: FaqItem[] = [
  {
    id: 'what-is-bayanihan',
    category: 'About the System',
    question: 'What is Bayanihan One Window?',
    answer:
      'Bayanihan One Window is an online platform that helps Overseas Filipino Workers (OFWs) receive coordinated assistance from different government agencies in one place.',
    keywords: ['what is bayanihan', 'bayanihan one window', 'platform', 'about'],
  },
  {
    id: 'who-can-use-service',
    category: 'About the System',
    question: 'Who can use this service?',
    answer:
      'This service is for OFWs who need assistance, especially those who have returned to the Philippines or are experiencing difficulties.',
    keywords: ['who can use', 'eligible', 'ofw', 'who is this for', 'service for'],
  },
  {
    id: 'assistance-types',
    category: 'About the System',
    question: 'What kind of assistance can I receive?',
    answer:
      'You may receive support such as legal, medical, financial, livelihood, or reintegration services, depending on your needs.',
    keywords: ['what kind of assistance', 'services', 'legal', 'medical', 'financial', 'livelihood', 'reintegration'],
  },
  {
    id: 'request-assistance',
    category: 'Getting Assistance',
    question: 'How do I request assistance?',
    answer:
      'You can visit the nearest DMW office or coordinate with authorized personnel who will register your case in the system.',
    keywords: ['request assistance', 'how to request', 'register case', 'case creation', 'new case', 'dmw office'],
  },
  {
    id: 'multiple-offices',
    category: 'Getting Assistance',
    question: 'Do I need to go to multiple offices?',
    answer:
      'No. The system connects you to the appropriate agencies, reducing the need to visit multiple offices.',
    keywords: ['multiple offices', 'go to many offices', 'different offices', 'visit offices'],
  },
  {
    id: 'documents-once',
    category: 'Getting Assistance',
    question: 'Do I need to submit my documents more than once?',
    answer:
      'No. Your documents are stored securely and shared only with authorized agencies handling your case.',
    keywords: ['submit documents', 'documents more than once', 'resubmit', 'upload again'],
  },
  {
    id: 'track-case',
    category: 'Tracking Your Case',
    question: 'How can I check the status of my case?',
    answer:
      'You can track your case anytime using your tracking number on the tracking page.',
    keywords: ['check status', 'track case', 'tracking page', 'status of my case'],
  },
  {
    id: 'find-tracking-number',
    category: 'Tracking Your Case',
    question: 'Where can I find my tracking number?',
    answer:
      'Your tracking number will be sent to the email address you provided during registration. Please check your inbox or spam folder.',
    keywords: ['find tracking number', 'where is tracking number', 'tracking number email', 'inbox', 'spam folder'],
  },
  {
    id: 'need-account-tracking',
    category: 'Tracking Your Case',
    question: 'Do I need an account to track my case?',
    answer:
      'No. You only need your tracking number.',
    keywords: ['need account', 'account to track', 'login required'],
  },
  {
    id: 'tracking-information',
    category: 'Tracking Your Case',
    question: 'What information will I see when tracking my case?',
    answer:
      'You can view your case status, progress of assistance, and the agencies handling your case.',
    keywords: ['what information', 'what can i see', 'tracking details', 'status and progress'],
  },
  {
    id: 'processing-time',
    category: 'Tracking Your Case',
    question: 'How long will my case take to process?',
    answer:
      'Processing time depends on the type of assistance needed and the agencies involved.',
    keywords: ['how long', 'processing time', 'how many days', 'when completed'],
  },
  {
    id: 'different-agencies',
    category: 'Referrals and Process',
    question: 'Why is my case handled by different agencies?',
    answer:
      'Each agency provides specific services. The system ensures you are referred to the right agencies based on your needs.',
    keywords: ['different agencies', 'referred', 'why many agencies', 'agency referral'],
  },
  {
    id: 'receive-updates',
    category: 'Referrals and Process',
    question: 'Will I receive updates about my case?',
    answer:
      'Yes. You can check updates anytime through the tracking page using your tracking number.',
    keywords: ['receive updates', 'case updates', 'notifications', 'status updates'],
  },
  {
    id: 'personal-information-secure',
    category: 'Privacy and Support',
    question: 'Is my personal information secure?',
    answer:
      'Yes. Your information is protected and only accessible to authorized personnel.',
    keywords: ['personal information secure', 'privacy', 'security', 'data privacy', 'safe'],
  },
  {
    id: 'cannot-find-tracking-number',
    category: 'Privacy and Support',
    question: 'What should I do if I cannot find my tracking number?',
    answer:
      'Please check your email (including spam folder). If you still cannot find it, contact the nearest DMW office or the agency assisting you.',
    keywords: ['cannot find tracking number', 'missing tracking number', 'lost tracking number', 'no tracking number email'],
  },
  {
    id: 'provide-feedback',
    category: 'Privacy and Support',
    question: 'Can I provide feedback about the service?',
    answer:
      'Yes. You may submit feedback after your case has been completed.',
    keywords: ['provide feedback', 'feedback', 'rate service', 'compliment'],
  },
  {
    id: 'contact-for-help',
    category: 'Privacy and Support',
    question: 'Who can I contact for help?',
    answer:
      'You may contact your nearest DMW office or partner agency for further assistance.',
    keywords: ['contact for help', 'who to contact', 'help desk', 'support contact', 'dmw office'],
  },
]

export function findFaqByInput(input: string): FaqItem | undefined {
  const lowerInput = input.toLowerCase()

  return FAQ_ITEMS.find((item) => item.keywords.some((keyword) => lowerInput.includes(keyword)))
}

export function buildFaqList(limit = 3): string {
  return FAQ_ITEMS.slice(0, limit)
    .map((item, index) => `${index + 1}. ${item.question}`)
    .join('\n')
}
