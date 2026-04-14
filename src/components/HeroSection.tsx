import heroImage from '../assets/hero.png'
import { AppAnchorButton, AppButton } from './ui/AppButton'

type HeroSectionProps = {
  title: string
  description: string
  onTrackAction: () => void
}

export default function HeroSection({ title, description, onTrackAction }: HeroSectionProps) {
  return (
    <section className="relative overflow-hidden bg-surface px-8 pb-24 pt-16 md:pb-32 md:pt-24">
      <div className="mx-auto grid max-w-7xl grid-cols-1 items-center gap-12 md:grid-cols-12">
        <div className="z-10 md:col-span-7">
          <span className="editorial-label mb-4 block text-[10px] font-bold uppercase tracking-widest text-[#005288]">Region VII DMW Official Portal</span>
          <h1 className="mb-6 font-headline text-4xl font-extrabold leading-tight tracking-tight text-[#005288] md:text-6xl">
            {title}
          </h1>
          <p className="mb-10 max-w-2xl text-lg leading-relaxed text-[#41474f] md:text-xl">{description}</p>

          <div className="flex flex-wrap gap-4">
            <AppButton type="button" onClick={onTrackAction} size="lg" icon="travel_explore" className="shadow-sm">
              Track Your Case
            </AppButton>
            <AppAnchorButton href="#tracker" variant="outline" size="lg">
              Learn More
            </AppAnchorButton>
          </div>
        </div>

        <div className="relative md:col-span-5">
          <div className="absolute -right-12 -top-12 h-64 w-64 rounded-full bg-secondary/10 blur-3xl"></div>
          <div className="relative border-l-4 border-primary bg-surface-container-lowest p-4 shadow-lg">
            <img
              src={heroImage}
              alt="Professional Government Worker"
              className="h-[400px] w-full object-cover"
            />
            <div className="absolute -left-8 bottom-8 max-w-[240px] border-l-4 border-secondary bg-white p-6 shadow-xl">
              <p className="editorial-label mb-1 text-[10px] font-bold uppercase tracking-widest text-[#006b5e]">Status Update</p>
              <p className="text-sm font-bold text-on-surface">Case #PH-2026-8812 processed successfully.</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}