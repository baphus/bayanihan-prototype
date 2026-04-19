import AppFooter from '../components/layout/AppFooter'
import AppHeader from '../components/layout/AppHeader'
import { AppButton } from '../components/ui/AppButton'

export default function ContactPage() {
  return (
    <div className="bg-surface font-body text-on-surface">
      <AppHeader />

      <main className="mx-auto w-full max-w-4xl px-4 py-14 md:px-8">
        <section className="mb-10 border-l-4 border-primary bg-white p-8 shadow-sm">
          <p className="editorial-label mb-2 text-primary">DMW Region VII Assistance</p>
          <h1 className="font-headline text-4xl font-extrabold text-primary">Contact Us (Region VII)</h1>
          <p className="mt-4 max-w-2xl text-sm leading-relaxed text-on-surface-variant md:text-base">
            Reach out to the DMW Region VII Bayanihan One Window support team for case concerns, technical issues, or agency coordination questions specific to Region VII (Central Visayas).
          </p>
        </section>

        <section className="grid grid-cols-1 gap-6 md:grid-cols-3">
          <article className="bg-white p-6 shadow-sm">
            <h2 className="text-sm font-bold uppercase tracking-wider text-primary">Support Email</h2>
            <p className="mt-3 text-sm text-on-surface-variant">support.region7@dmw.gov.ph</p>
          </article>
          <article className="bg-white p-6 shadow-sm">
            <h2 className="text-sm font-bold uppercase tracking-wider text-primary">Region 7 Hotline</h2>
            <p className="mt-3 text-sm text-on-surface-variant">(+63) 32 123 4567</p>
          </article>
          <article className="bg-white p-6 shadow-sm">
            <h2 className="text-sm font-bold uppercase tracking-wider text-primary">Office Hours</h2>
            <p className="mt-3 text-sm text-on-surface-variant">Mon-Fri, 8:00 AM to 5:00 PM</p>
          </article>
        </section>

        <section className="mt-10 bg-white p-8 shadow-sm">
          <h2 className="text-lg font-bold text-primary">Send a Message</h2>
          <form className="mt-6 space-y-4">
            <div>
              <label htmlFor="fullName" className="mb-2 block text-xs font-bold uppercase tracking-wider text-on-surface-variant">
                Full Name
              </label>
              <input
                id="fullName"
                type="text"
                placeholder="Enter your full name"
                className="w-full border border-slate-300 px-4 py-3 text-sm focus:border-primary focus:outline-none"
              />
            </div>

            <div>
              <label htmlFor="email" className="mb-2 block text-xs font-bold uppercase tracking-wider text-on-surface-variant">
                Email Address
              </label>
              <input
                id="email"
                type="email"
                placeholder="Enter your email"
                className="w-full border border-slate-300 px-4 py-3 text-sm focus:border-primary focus:outline-none"
              />
            </div>

            <div>
              <label htmlFor="subject" className="mb-2 block text-xs font-bold uppercase tracking-wider text-on-surface-variant">
                Subject
              </label>
              <input
                id="subject"
                type="text"
                placeholder="Message subject"
                className="w-full border border-slate-300 px-4 py-3 text-sm focus:border-primary focus:outline-none"
              />
            </div>

            <div>
              <label htmlFor="message" className="mb-2 block text-xs font-bold uppercase tracking-wider text-on-surface-variant">
                Message
              </label>
              <textarea
                id="message"
                rows={5}
                placeholder="How can we assist you?"
                className="w-full border border-slate-300 px-4 py-3 text-sm focus:border-primary focus:outline-none"
              />
            </div>

            <AppButton type="submit" variant="primary">
              Submit Inquiry
            </AppButton>
          </form>
        </section>
      </main>

      <AppFooter />
    </div>
  )
}
