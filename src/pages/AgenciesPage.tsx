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

      <main className="flex-1 px-8 py-16">
        <div className="mx-auto max-w-5xl">
          <div className="mb-12 text-center">
            <h1 className="font-headline text-4xl font-extrabold text-primary">Our Partner Agencies (Region VII)</h1>
            <p className="mx-auto mt-4 max-w-2xl text-on-surface-variant text-lg">
              Explore the services provided by our network of partner agencies in Region VII, dedicated to serving and protecting our citizens at home and abroad.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {AGENCIES_DATA.map((agency) => (
              <div 
                key={agency.id} 
                className="group flex cursor-pointer flex-col rounded-none border border-outline-variant/30 bg-white p-4 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-md"
                onClick={() => navigate(`/agencies/${agency.id}`)}
              >
                <div className="flex flex-col items-center justify-center text-center mb-3">
                  <div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-none bg-surface-container-lowest shadow-sm mb-3 border border-outline-variant/30 transition-transform duration-300 group-hover:scale-105">
                    <img src={agency.logoUrl} alt={`${agency.short} Logo`} className="h-full w-full object-cover p-1" />
                  </div>
                  <h2 className="font-headline text-sm font-bold text-primary leading-tight h-10 flex items-center justify-center">
                    {agency.name}
                  </h2>
                </div>
                <div className="flex-1 flex flex-col">
                  <p className="text-[10px] text-on-surface-variant flex-1 mb-3 line-clamp-3 text-center">
                    {agency.description}
                  </p>
                  
                  <div className="mb-3 overflow-hidden rounded-none border border-outline-variant/30 bg-surface-container-lowest h-[60px] transition-colors duration-300 group-hover:bg-primary/5">
                    <iframe
                      title={`${agency.name} map preview`}
                      src={getGoogleMapsEmbedUrl(agency.locationQuery)}
                      className="h-full w-full"
                      loading="lazy"
                      referrerPolicy="no-referrer-when-downgrade"
                    />
                  </div>

                  <div className="space-y-1.5 mb-4 bg-surface-container-lowest p-2 rounded-none border border-outline-variant/20">
                    <div className="flex items-center gap-2 text-[10px] text-on-surface">
                      <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-none bg-primary/10 text-primary">
                        <span className="material-symbols-outlined text-[10px]">mail</span>
                      </div>
                      <span className="truncate">{agency.email}</span>
                    </div>
                    <div className="flex items-center gap-2 text-[10px] text-on-surface">
                      <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-none bg-primary/10 text-primary">
                        <span className="material-symbols-outlined text-[10px]">call</span>
                      </div>
                      <span className="truncate">{agency.contact}</span>
                    </div>
                  </div>
                  <AppButton 
                    type="button" 
                    variant="outline" 
                    size="md"
                    className="w-full mt-auto rounded-none border-primary text-primary hover:bg-primary hover:text-white transition-colors text-[10px] py-2"
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
