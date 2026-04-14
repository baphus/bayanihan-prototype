export type AgencyStatus = 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'REJECTED'

export function getStatusBadgeClass(status: AgencyStatus): string {
  if (status === 'PROCESSING') {
    return 'border-[#bae6fd] bg-[#e0f2fe] text-[#0369a1]'
  }

  if (status === 'PENDING') {
    return 'border-[#fde68a] bg-[#fef3c7] text-[#b45309]'
  }

  if (status === 'COMPLETED') {
    return 'border-[#bbf7d0] bg-[#dcfce7] text-[#15803d]'
  }

  return 'border-[#fecaca] bg-[#fee2e2] text-[#b91c1c]'
}
