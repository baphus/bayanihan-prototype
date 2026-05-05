import AppFooter from '../components/layout/AppFooter'
import AppHeader from '../components/layout/AppHeader'
import { AppButton } from '../components/ui/AppButton'

export default function ContactPage() {
  return (
    <div className="flex min-h-screen flex-col bg-surface font-body text-on-surface">
      <AppHeader />

      <main className="flex-1">
        {/* Simplified Hero for Contact */}
        <section className="relative flex min-h-[300px] w-full items-center justify-center overflow-hidden py-20 bg-primary">
          <div className="absolute inset-0 z-0">
            <div className="absolute inset-0 bg-gradient-to-br from-primary via-primary/90 to-primary-container/30"></div>
          </div>

          <div className="relative z-10 mx-auto w-full max-w-7xl px-4 text-center md:px-8">
            <div className="mx-auto max-w-3xl">
              <p className="mb-2 text-sm font-bold uppercase tracking-widest text-white/70">Support & Feedback</p>
              <h1 className="mb-4 font-headline text-4xl font-extrabold leading-tight tracking-tight text-white sm:text-5xl">
                Contact Us (Region VII)
              </h1>
              <p className="mx-auto max-w-2xl text-lg leading-relaxed text-white/80">
                Reach out to the DMW Region VII Bayanihan One Window support team for case concerns, technical issues, or agency coordination.
              </p>
            </div>
          </div>
        </section>

        <div className="mx-auto w-full max-w-5xl px-4 pb-24 md:px-8">
          <section className="relative -mt-10 grid grid-cols-1 gap-6 md:grid-cols-3">
            <article className="bg-surface p-8 shadow-2xl border border-outline-variant/30">
              <div className="flex items-center gap-3 mb-4 text-primary">
                <span className="material-symbols-outlined">mail</span>
                <h2 className="text-sm font-bold uppercase tracking-wider">Support Email</h2>
              </div>
              <p className="text-sm text-on-surface-variant break-all">support.region7@dmw.gov.ph</p>
            </article>

            <article className="bg-surface p-8 shadow-2xl border border-outline-variant/30">
              <div className="flex items-center gap-3 mb-4 text-primary">
                <span className="material-symbols-outlined">call</span>
                <h2 className="text-sm font-bold uppercase tracking-wider">Region 7 Hotline</h2>
              </div>
              <p className="text-sm text-on-surface-variant">(+63) 32 123 4567</p>
            </article>

            <article className="bg-surface p-8 shadow-2xl border border-outline-variant/30">
              <div className="flex items-center gap-3 mb-4 text-primary">
                <span className="material-symbols-outlined">schedule</span>
                <h2 className="text-sm font-bold uppercase tracking-wider">Office Hours</h2>
              </div>
              <p className="text-sm text-on-surface-variant">Mon-Fri, 8:00 AM to 5:00 PM</p>
            </article>
          </section>

          <section className="mt-12 bg-surface p-8 shadow-2xl border border-outline-variant/30">
            <div className="mb-8 flex items-center gap-3 border-b border-outline-variant pb-4">
              <span className="material-symbols-outlined text-primary text-2xl">send</span>
              <h2 className="font-headline text-lg font-bold text-on-surface">Send a Message</h2>
            </div>

            <form className="space-y-6">
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                <div>
                  <label htmlFor="fullName" className="mb-2 block text-xs font-bold uppercase tracking-wider text-on-surface-variant">
                    Full Name
                  </label>
                  <input
                    id="fullName"
                    type="text"
                    placeholder="Enter your full name"
                    className="w-full border border-outline bg-surface-container px-4 py-3 text-sm focus:border-primary focus:outline-none"
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
                    className="w-full border border-outline bg-surface-container px-4 py-3 text-sm focus:border-primary focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="subject" className="mb-2 block text-xs font-bold uppercase tracking-wider text-on-surface-variant">
                  Subject
                </label>
                <input
                  id="subject"
                  type="text"
                  placeholder="Message subject"
                  className="w-full border border-outline bg-surface-container px-4 py-3 text-sm focus:border-primary focus:outline-none"
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
                  className="w-full border border-outline bg-surface-container px-4 py-3 text-sm focus:border-primary focus:outline-none"
                />
              </div>

              <div className="flex justify-end">
                <AppButton type="submit" variant="primary" size="lg" className="px-12">
                  Submit Inquiry
                </AppButton>
              </div>
            </form>
          </section>
        </div>
      </main>

      <AppFooter />
    </div>
  )
}
