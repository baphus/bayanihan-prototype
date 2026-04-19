import SystemAdminCrudPage from './SystemAdminCrudPage'

export default function UsersPage() {
  return (
    <SystemAdminCrudPage
      entity="users"
      title="System Users"
      subtitle="View, update, and deactivate user accounts and role access profiles."
      recordLabel="User"
      newRecordLabel="+ New User"
      searchPlaceholder="Search by user ID, name, role scope, or owner..."
      allowCreate={false}
    />
  )
}
