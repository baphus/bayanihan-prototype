import { useNavigate } from 'react-router-dom'
import AppFooter from '../components/layout/AppFooter'
import AppHeader from '../components/layout/AppHeader'
import { AppButton } from '../components/ui/AppButton'
import { AGENCIES_DATA } from '../data/agenciesData'
import { getGoogleMapsEmbedUrl } from '../data/unifiedData'

export default function AgenciesPage() {
  const navigate = useNavigate()

  return (
    <div className="flex min-h-screen flex-col bg-surface font-body text-on-surface">
      <AppHeader />

      <main className="flex-1">
        {/* Simplified Hero for Agencies */}
        <section className="relative flex min-h-[300px] w-full items-center justify-center overflow-hidden py-20 bg-primary">
          <div className="absolute inset-0 z-0">
            <div className="absolute inset-0 bg-gradient-to-br from-primary via-primary/90 to-primary-container/30"></div>
          </div>

          <div className="relative z-10 mx-auto w-full max-w-7xl px-4 text-center md:px-8">
            <div className="mx-auto max-w-3xl">
              <p className="mb-2 text-sm font-bold uppercase tracking-widest text-white/70">Coordinated Assistance</p>
              <h1 className="mb-4 font-headline text-4xl font-extrabold leading-tight tracking-tight text-white sm:text-5xl">
                Our Partner Agencies
              </h1>
              <p className="mx-auto max-w-2xl text-lg leading-relaxed text-white/80">
                Explore the network of government agencies and units in Region VII working together through the Bayanihan One Window system.
              </p>
            </div>
          </div>
        </section>

        <div className="mx-auto max-w-7xl px-8 pb-24">
          <div className="grid gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 -mt-10 relative z-20">
            {AGENCIES_DATA.map((agency) => (
              <div 
                key={agency.id} 
                className="group flex cursor-pointer flex-col rounded-none border border-outline-variant/30 bg-surface shadow-2xl transition-all duration-300 hover:-translate-y-1"
                onClick={() => navigate(`/agencies/${agency.id}`)}
              >
                <div className="flex flex-col items-center justify-center text-center p-6 border-b border-outline-variant/30">
                  <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-none bg-white shadow-sm mb-4 border border-outline-variant/30 transition-transform duration-300 group-hover:scale-105">
                    <img src={agency.logoUrl} alt={`${agency.short} Logo`} className="h-full w-full object-contain p-1" />
                  </div>
                  <h2 className="font-headline text-sm font-bold text-primary leading-tight h-10 flex items-center justify-center">
                    {agency.name}
                  </h2>
                </div>
                <div className="flex-1 flex flex-col p-6 bg-surface-container-lowest/50">
                  <p className="text-[11px] text-on-surface-variant flex-1 mb-4 line-clamp-3 text-center leading-relaxed">
                    {agency.description}
                  </p>
                  
                  <div className="mb-4 overflow-hidden rounded-none border border-outline-variant/30 bg-surface-container-lowest h-[80px] grayscale group-hover:grayscale-0 transition-all duration-300">
                    <iframe
                      title={`${agency.name} map preview`}
                      src={getGoogleMapsEmbedUrl(agency.locationQuery)}
                      className="h-full w-full"
                      loading="lazy"
                      referrerPolicy="no-referrer-when-downgrade"
                    />
                  </div>

                  <div className="space-y-2 mb-6 bg-surface-container-highest/20 p-3 rounded-none border border-outline-variant/20">
                    <div className="flex items-center gap-2 text-[10px] text-on-surface font-medium">
                      <span className="material-symbols-outlined text-[14px] text-primary">mail</span>
                      <span className="truncate">{agency.email}</span>
                    </div>
                    <div className="flex items-center gap-2 text-[10px] text-on-surface font-medium">
                      <span className="material-symbols-outlined text-[14px] text-primary">call</span>
                      <span className="truncate">{agency.contact}</span>
                    </div>
                  </div>
                  
                  <AppButton 
                    type="button" 
                    variant="primary" 
                    size="md"
                    className="w-full mt-auto rounded-none text-xs"
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(`/agencies/${agency.id}`)
                    }}
                  >
                    View Services
                  </AppButton>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>

      <AppFooter />
    </div>
  )
}
