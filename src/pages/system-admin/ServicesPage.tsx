import SystemAdminCrudPage from './SystemAdminCrudPage'

export default function ServicesPage() {
  return (
    <SystemAdminCrudPage
      entity="services"
      title="System Services"
      subtitle="Manage service catalogs, labels, and lifecycle status for every agency."
      recordLabel="Service Title"
      newRecordLabel="+ New Service"
      searchPlaceholder="Search by service ID, title, owner, or scope..."
    />
  )
}
