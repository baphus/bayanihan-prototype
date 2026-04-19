const heroImage = 'https://staging.pssc.org.ph/wp-content/uploads/2024/11/ofw-and-migration-pssc-policy-brief-1024x791.jpg'

type HeroSectionProps = {
  title: string
  description: string
  onTrackAction: () => void
}

export default function HeroSection({ title, description, onTrackAction }: HeroSectionProps) {
  return (
    <section className="relative flex min-h-[600px] w-full items-center justify-center overflow-hidden py-24 md:min-h-[85vh] md:py-32">
      {/* Background Image & Overlay */}
      <div className="absolute inset-0 z-0">
        <img
          src={heroImage}
          alt="Bayanihan One Window System in action"
          className="h-full w-full object-cover object-center"
        />
        {/* Modern dark gradient overlay to ensure text legibility */}
        <div className="absolute inset-0 bg-gradient-to-b from-slate-900/80 via-slate-900/60 to-[#003a63]/90"></div>
      </div>

      {/* Hero Content */}
      <div className="relative z-10 mx-auto w-full max-w-7xl px-4 md:px-8">
        <div className="mx-auto max-w-4xl text-center">
          <h1 className="mb-6 font-headline text-4xl font-extrabold leading-tight tracking-tight text-white drop-shadow-xl sm:text-5xl md:text-6xl lg:text-7xl">
            {title}
          </h1>
          <p className="mx-auto mb-10 max-w-2xl text-lg leading-relaxed text-slate-200 drop-shadow-md md:text-xl">
            {description}
          </p>

          <div className="flex flex-wrap items-center justify-center gap-4">
            {/* Primary Action */}
            <button 
              type="button" 
              onClick={onTrackAction}
              className="inline-flex items-center justify-center gap-2 bg-white px-8 py-4 text-base font-bold text-[#005288] shadow-xl transition-all hover:-translate-y-0.5 hover:bg-slate-100 active:scale-95"
            >
              <span className="material-symbols-outlined">travel_explore</span>
              Track Your Case
            </button>
            {/* Secondary Action */}
            <a 
              href="#features"
              className="inline-flex items-center justify-center gap-2 border border-white/40 bg-white/10 px-8 py-4 text-base font-bold text-white backdrop-blur-md transition-all hover:-translate-y-0.5 hover:bg-white/20 active:scale-95"
            >
              Learn More
            </a>
          </div>
        </div>
      </div>
    </section>
  )
}