import AgencyFeedbacksPanel from '../../components/AgencyFeedbacksPanel'
import { pageHeadingStyles } from './pageHeadingStyles'

export default function FeedbacksPage() {
  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-4">
      <header>
        <h1 className={`${pageHeadingStyles.pageTitle} font-headline`}>Feedbacks</h1>
        <p className={pageHeadingStyles.pageSubtitle}>View feedbacks submitted by clients and edit the SERVQUAL form for your agency.</p>
      </header>

      <section>
        <AgencyFeedbacksPanel />
      </section>
    </div>
  )
}
