import { Link, useNavigate, useParams } from 'react-router-dom'
import { pageHeadingStyles } from '../agency/pageHeadingStyles'
import {
  CASE_MANAGER_CASES,
  getCaseManagerAgencies,
  getGoogleMapsEmbedUrl,
  getStakeholderServiceDetails,
} from '../../data/unifiedData'

export default function StakeholderViewPage() {
  const navigate = useNavigate()
  const { stakeholderId = '' } = useParams()

  const stakeholder = getCaseManagerAgencies().find((agency) => agency.id === stakeholderId)

  if (!stakeholder) {
    return (
      <div className="mx-auto max-w-4xl space-y-4 pb-6">
        <button
          type="button"
          onClick={() => navigate('/case-manager/stakeholders')}
          className="inline-flex items-center gap-1 text-[12px] font-bold text-slate-600 hover:text-slate-800"
        >
          <span className="material-symbols-outlined text-[18px]">arrow_back</span>
          Back to Stakeholders
        </button>
        <div className="rounded-[4px] border border-[#e2e8f0] bg-white p-6 text-center">
          <p className="text-[14px] font-semibold text-slate-800">Stakeholder record not found.</p>
        </div>
      </div>
    )
  }

  const stakeholderCases = CASE_MANAGER_CASES.filter((item) => item.agencyId === stakeholder.id)
  const serviceDetails = getStakeholderServiceDetails(stakeholder.id)
  const serviceCount = serviceDetails.length
  const activeReferrals = stakeholderCases.filter((item) => item.status === 'PENDING' || item.status === 'PROCESSING').length
  const completedReferrals = stakeholderCases.filter((item) => item.status === 'COMPLETED').length
  const mapSrc = getGoogleMapsEmbedUrl(stakeholder.locationQuery)

  return (
    <div className="max-w-[1240px] mx-auto px-4 py-6 space-y-4">
      <div className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-500">
        <Link to="/case-manager/stakeholders" className="hover:text-[#0b5384] transition">Stakeholders</Link>
        <span className="mx-2">&gt;</span>
        <span>{stakeholder.short}</span>
      </div>

      <div className="flex items-start justify-between gap-4 flex-wrap">
        <h1 className={pageHeadingStyles.pageTitle}>Stakeholder Details</h1>
        <button
          type="button"
          onClick={() => navigate('/case-manager/stakeholders')}
          className="h-[34px] px-3 border border-[#cbd5e1] bg-white text-slate-700 text-[11px] font-bold rounded-[3px] hover:bg-slate-50"
        >
          Back
        </button>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-4">
        <main className="xl:col-span-7 space-y-4">
          <section className="rounded-[3px] border border-[#d8dee8] bg-white p-4 shadow-sm">
            <div className="flex items-start gap-3">
              <div className="h-12 w-12 overflow-hidden rounded-full border border-[#d8dee8] bg-white">
                <img src={stakeholder.logoUrl} alt={`${stakeholder.short} logo`} className="h-full w-full object-contain p-[2px]" />
              </div>
              <div>
                <p className="text-[16px] font-bold text-slate-800">{stakeholder.name}</p>
                <p className="text-[10px] font-extrabold uppercase tracking-[0.1em] text-slate-500">{stakeholder.short}</p>
              </div>
            </div>

            <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
              <InfoItem label="Contact" value={stakeholder.contact} />
              <InfoItem label="Email" value={stakeholder.email} />
              <InfoItem label="Number of Services" value={String(serviceCount)} />
              <InfoItem label="Total Referrals" value={String(stakeholderCases.length)} />
              <InfoItem label="Active Referrals" value={String(activeReferrals)} />
              <InfoItem label="Completed Referrals" value={String(completedReferrals)} />
            </div>
          </section>

          <section className="rounded-[3px] border border-[#d8dee8] bg-white p-4 shadow-sm">
            <h3 className={`${pageHeadingStyles.sectionTitle} mb-3 text-[#1f2937]`}>Services ({serviceCount})</h3>
            {serviceDetails.length ? (
              <div className="space-y-3">
                {serviceDetails.map((service) => (
                  <div key={service.id} className="rounded-[3px] border border-[#e2e8f0] bg-[#f8fafc] p-3">
                    <p className="text-[13px] font-bold text-slate-800">{service.title}</p>
                    <p className="mt-1 text-[12px] leading-5 text-slate-600">{service.description}</p>
                    <p className="mt-2 text-[11px] font-semibold text-[#0b5384]">Processing Time: {service.processingDays} day{service.processingDays > 1 ? 's' : ''}</p>
                    <div className="mt-2">
                      <p className="text-[9px] font-extrabold uppercase tracking-[0.1em] text-slate-500">Required Documents</p>
                      {service.requiredDocuments.length ? (
                        <ul className="mt-1 list-disc pl-5 text-[11px] leading-5 text-slate-600">
                          {service.requiredDocuments.map((document) => (
                            <li key={`${service.id}-${document}`}>{document}</li>
                          ))}
                        </ul>
                      ) : (
                        <p className="mt-1 text-[11px] text-slate-500">No required documents listed.</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-[3px] border border-dashed border-[#cbd5e1] p-4 text-[12px] text-slate-500">
                No configured services for this stakeholder.
              </div>
            )}
          </section>
        </main>

        <aside className="xl:col-span-5">
          <section className="rounded-[3px] border border-[#d8dee8] bg-white p-4 shadow-sm h-full">
            <h3 className={`${pageHeadingStyles.sectionTitle} mb-3 text-[#1f2937]`}>Google Maps Location</h3>
            <div className="overflow-hidden rounded-[3px] border border-[#d8dee8]">
              <iframe
                title={`${stakeholder.name} location`}
                src={mapSrc}
                className="h-[420px] w-full"
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              />
            </div>
          </section>
        </aside>
      </div>
    </div>
  )
}

function InfoItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[3px] border border-[#e2e8f0] bg-[#f8fafc] px-3 py-2">
      <p className="text-[9px] font-extrabold uppercase tracking-[0.1em] text-slate-500">{label}</p>
      <p className="mt-1 text-[12px] font-semibold text-slate-700">{value}</p>
    </div>
  )
}
