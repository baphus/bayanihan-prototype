import { useParams, useNavigate, Link } from 'react-router-dom'
import AppFooter from '../components/layout/AppFooter'
import AppHeader from '../components/layout/AppHeader'
import { AppButton } from '../components/ui/AppButton'
import { AGENCIES_DATA } from '../data/agenciesData'
import { getGoogleMapsEmbedUrl } from '../data/unifiedData'

export default function AgencyDetailsPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

  const agency = AGENCIES_DATA.find((a) => a.id === id)

  if (!agency) {
    return (
      <div className="flex min-h-screen flex-col bg-surface font-body text-on-surface">
        <AppHeader navLinks={[]} />
        <main className="flex flex-1 items-center justify-center">
          <div className="text-center text-on-surface-variant">
            <h1 className="mb-4 text-3xl font-headline font-bold text-error">Agency Not Found</h1>
            <p>The agency you are looking for does not exist.</p>
            <AppButton type="button" variant="outline" className="mt-8" onClick={() => navigate('/agencies')}>
              Back to Partner Agencies
            </AppButton>
          </div>
        </main>
        <AppFooter />
      </div>
    )
  }

  const mapSrc = getGoogleMapsEmbedUrl(agency.locationQuery)

  return (
    <div className="flex min-h-screen flex-col bg-surface font-body text-on-surface">
      <AppHeader />

      <main className="flex-1 py-12 px-6">
        <div className="mx-auto max-w-7xl">
          {/* Breadcrumbs */}
          <nav className="mb-8 flex text-sm text-on-surface-variant font-medium">
            <Link to="/agencies" className="hover:text-primary hover:underline transition-colors">Partner Agencies (Region VII)</Link>
            <span className="mx-2 text-outline-variant">&gt;</span>
            <span className="font-bold text-primary">{agency.name}</span>
          </nav>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
            {/* Left Column: Details & Map */}
            <div className="lg:col-span-1 space-y-8">
              <div className="rounded-none bg-white p-6 border border-outline-variant/30 text-center shadow-sm">
                <div className="mx-auto mb-6 flex h-32 w-32 items-center justify-center overflow-hidden rounded-full bg-surface-container-lowest shadow-sm border border-outline-variant/30">
                  <img src={agency.logoUrl} alt={`${agency.short} Logo`} className="h-full w-full object-contain p-3" />
                </div>
                <h1 className="mb-4 text-2xl font-headline font-extrabold text-primary leading-tight">
                  {agency.name}
                </h1>
                <p className="mb-6 text-on-surface-variant text-sm text-center leading-relaxed">
                  {agency.description}
                </p>
                
                <div className="space-y-4 text-left bg-surface-container-lowest p-4 rounded-none border border-outline-variant/30">
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-none bg-primary/10 text-primary">
                      <span className="material-symbols-outlined text-[16px]">email</span>
                    </div>
                    <span className="text-sm font-medium text-on-surface break-all">{agency.email}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-none bg-primary/10 text-primary">
                      <span className="material-symbols-outlined text-[16px]">phone</span>
                    </div>
                    <span className="text-sm font-medium text-on-surface">{agency.contact}</span>
                  </div>
                </div>
              </div>

              <div className="overflow-hidden rounded-none border border-outline-variant/30 bg-surface-container-lowest shadow-sm">
                <div className="border-b border-outline-variant/30 p-4 bg-white flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary text-xl">location_on</span>
                  <h3 className="font-headline font-bold text-primary">Location</h3>
                </div>
                <iframe
                  title={`${agency.name} location`}
                  src={mapSrc}
                  className="h-[250px] w-full"
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                />
              </div>
            </div>

            {/* Right Column: Services Grid */}
            <div className="lg:col-span-2">
              <div className="mb-8 flex items-center justify-between">
                <h2 className="text-3xl font-headline font-extrabold text-primary">Services Offered</h2>
                <span className="px-3 py-1 rounded-none bg-primary/10 text-primary text-[10px] font-bold uppercase tracking-widest">{agency.services.length} Total Services</span>
              </div>

              {agency.services.length > 0 ? (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {agency.services.map((service) => (
                    <div 
                      key={service.id} 
                      className="group flex flex-col rounded-none border border-outline-variant/30 bg-white p-5 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-md h-full"
                    >
                      <h3 className="mb-2 text-base font-headline font-bold text-primary group-hover:text-[#005288] transition-colors leading-tight">
                        {service.title}
                      </h3>
                      <p className="mb-4 text-xs text-on-surface-variant leading-relaxed">
                        {service.description}
                      </p>
                      
                      <div className="mt-auto pt-3 border-t border-outline-variant/30">
                        <div className="flex items-center gap-2 mb-2 text-[11px] font-bold text-primary uppercase tracking-wider">
                          <span className="material-symbols-outlined text-[14px]">description</span>
                          Requirements
                        </div>
                        <ul className="space-y-1.5 mb-4">
                          {service.requiredDocuments.slice(0, 3).map((doc, idx) => (
                            <li key={idx} className="flex items-start gap-2 text-[11px] text-on-surface-variant">
                              <span className="material-symbols-outlined text-green-600/80 text-[12px] mt-0.5 font-bold">check</span>
                              <span className="flex-1 leading-snug">{doc}</span>
                            </li>
                          ))}
                          {service.requiredDocuments.length > 3 && (
                            <li className="text-[10px] text-secondary font-medium pl-5">+{service.requiredDocuments.length - 3} more</li>
                          )}
                        </ul>
                        
                        <button className="w-full py-2 px-3 bg-surface hover:bg-primary/5 text-primary text-[10px] font-bold border border-primary/20 transition-colors uppercase tracking-widest rounded-none">
                          Inquire Now
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="rounded-none border-2 border-dashed border-outline-variant p-12 text-center text-on-surface-variant bg-surface/30">
                  <span className="material-symbols-outlined text-4xl mb-4 text-outline">design_services</span>
                  <p className="text-sm font-bold uppercase tracking-widest">No Services Listed</p>
                  <p className="text-xs mt-2">Check back later for updates to Region VII programs.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      <AppFooter />
    </div>
  )
}
