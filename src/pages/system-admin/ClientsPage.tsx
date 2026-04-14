import SystemAdminCrudPage from './SystemAdminCrudPage'

export default function ClientsPage() {
  return (
    <SystemAdminCrudPage
      entity="clients"
      title="System Clients"
      subtitle="Maintain complete client records and manage updates from one admin console."
      recordLabel="Client Name"
      newRecordLabel="+ New Client"
      searchPlaceholder="Search by client ID, name, owner, or scope..."
    />
  )
}
