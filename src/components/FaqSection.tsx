import { useState } from 'react'
import { FAQ_ITEMS } from '../data/faqData'

const FAQ_CATEGORIES = [
  'About the System',
  'Getting Assistance',
  'Tracking Your Case',
  'Referrals and Process',
  'Privacy and Support',
] as const

export default function FaqSection({ categories = FAQ_CATEGORIES }: { categories?: readonly string[] }) {
  const [openItemId, setOpenItemId] = useState<string | null>(FAQ_ITEMS[0]?.id ?? null)

  const handleToggle = (itemId: string) => {
    setOpenItemId((current) => (current === itemId ? null : itemId))
  }

  return (
    <section id="faq" className="bg-surface px-8 py-24">
      <div className="mx-auto max-w-5xl">
        <div className="mb-12 text-center">
          <h2 className="font-headline text-3xl font-extrabold text-primary">Frequently Asked Questions</h2>
          <p className="mx-auto mt-4 max-w-2xl text-sm leading-relaxed text-on-surface-variant md:text-base">
            Get fast answers about tracking, agency coordination, and privacy.
          </p>
        </div>

        <div className="space-y-8">
          {categories.map((category) => {
            const itemsInCategory = FAQ_ITEMS.filter((item) => item.category === category)

            if (!itemsInCategory.length) {
              return null
            }

            return (
              <section key={category}>
                <h3 className="mb-3 text-sm font-extrabold uppercase tracking-[0.08em] text-secondary md:text-[13px]">
                  {category}
                </h3>

                <div className="space-y-4">
                  {itemsInCategory.map((item) => {
                    const isOpen = item.id === openItemId

                    return (
                      <article
                        key={item.id}
                        className="border border-outline-variant/40 bg-surface-container-lowest shadow-sm"
                      >
                        <button
                          type="button"
                          onClick={() => handleToggle(item.id)}
                          aria-expanded={isOpen}
                          className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left transition-colors hover:bg-surface-container"
                        >
                          <span className="text-sm font-bold text-primary md:text-base">{item.question}</span>
                          <span className="material-symbols-outlined text-primary" aria-hidden="true">
                            {isOpen ? 'remove' : 'add'}
                          </span>
                        </button>

                        {isOpen ? (
                          <div className="border-t border-outline-variant/30 px-5 py-4">
                            <p className="text-sm leading-relaxed text-on-surface-variant md:text-[15px]">{item.answer}</p>
                          </div>
                        ) : null}
                      </article>
                    )
                  })}
                </div>
              </section>
            )
          })}
        </div>
      </div>
    </section>
  )
}
