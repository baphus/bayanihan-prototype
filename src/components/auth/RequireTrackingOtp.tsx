import type { ReactNode } from 'react'
import { Navigate, useParams } from 'react-router-dom'
import { isTrackingOtpVerified } from '../../utils/authSession'

type RequireTrackingOtpProps = {
  children: ReactNode
}

export default function RequireTrackingOtp({ children }: RequireTrackingOtpProps) {
  const { trackerNumber } = useParams<{ trackerNumber: string }>()
  const decodedTrackingId = trackerNumber ? decodeURIComponent(trackerNumber).trim().toUpperCase() : ''

  if (!decodedTrackingId || !isTrackingOtpVerified(decodedTrackingId)) {
    return <Navigate to={decodedTrackingId ? `/track/${encodeURIComponent(decodedTrackingId)}/verify` : '/track'} replace />
  }

  return <>{children}</>
}