import SystemAdminCrudPage from './SystemAdminCrudPage'

export default function ReferralsPage() {
  return (
    <SystemAdminCrudPage
      entity="referrals"
      title="System Referrals"
      subtitle="Maintain referral records and lifecycle updates across agencies."
      recordLabel="Referral"
      newRecordLabel="+ New Referral"
      searchPlaceholder="Search by referral ID, client, service, or agency..."
    />
  )
}
