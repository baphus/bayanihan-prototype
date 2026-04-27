import SystemAdminCrudPage from './SystemAdminCrudPage'

export default function UsersPage() {
  return (
    <SystemAdminCrudPage
      entity="users"
      title="User Management"
      subtitle="Manage system users"
      recordLabel="User"
      newRecordLabel="Add User"   // 👈 THIS controls button text
      searchPlaceholder="Search users..."
      allowCreate={true}         // 👈 make sure this is true
    />
  )
}
