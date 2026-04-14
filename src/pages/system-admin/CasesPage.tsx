import SystemAdminCrudPage from './SystemAdminCrudPage'

export default function CasesPage() {
  return (
    <SystemAdminCrudPage
      entity="cases"
      title="System Cases"
      subtitle="Create, review, update, and archive case records across all agencies."
      recordLabel="Client"
      newRecordLabel="+ New Case"
      searchPlaceholder="Search by case ID, client name, owner, or scope..."
    />
  )
}
