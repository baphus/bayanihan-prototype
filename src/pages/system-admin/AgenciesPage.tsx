import SystemAdminCrudPage from './SystemAdminCrudPage'

export default function AgenciesPage() {
  return (
    <SystemAdminCrudPage
      entity="agencies"
      title="System Agencies"
      subtitle="Administer agency directories, ownership, and record lifecycle control."
      recordLabel="Agency Name"
      newRecordLabel="+ New Agency"
      searchPlaceholder="Search by agency code, name, owner, or scope..."
    />
  )
}
