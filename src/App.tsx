import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import ContactPage from './pages/ContactPage'
import LandingPage from './pages/LandingPage'
import AgenciesPage from './pages/AgenciesPage'
import AgencyDetailsPage from './pages/AgencyDetailsPage'
import MilestonesPage from './pages/MilestonesPage'
import DmwMilestonesPage from './pages/DmwMilestonesPage'
import TesdaMilestonesPage from './pages/TesdaMilestonesPage'
import TrackCasePage from './pages/TrackCasePage'
import TrackYourCasePage from './pages/TrackYourCasePage'
import LoginPage from './pages/LoginPage'
import CaseManagerLayout from './components/layout/CaseManagerLayout'
import DashboardPage from './pages/case-manager/DashboardPage'
import CasesPage from './pages/case-manager/CasesPage'
import NewCasePage from './pages/case-manager/NewCasePage'
import CaseViewPage from './pages/case-manager/CaseViewPage.tsx'
import ClientsPage from './pages/case-manager/ClientsPage'
import ClientDetailsPage from './pages/case-manager/ClientDetailsPage'
import ReferralsPage from './pages/case-manager/ReferralsPage'
import ReferralViewPage from './pages/case-manager/ReferralViewPage'
import ReferralCreatePage from './pages/case-manager/ReferralCreatePage'
import CaseReferralCreatePage from './pages/case-manager/CaseReferralCreatePage'
import StakeholdersPage from './pages/case-manager/StakeholdersPage'
import StakeholderViewPage from './pages/case-manager/StakeholderViewPage'
import CaseManagerReportsPage from './pages/case-manager/ReportsPage'
import AuditLogsPage from './pages/case-manager/AuditLogsPage'
import AgencyLayout from './components/layout/AgencyLayout'
import AgencyDashboardPage from './pages/agency/DashboardPage'
import AgencyServicesPage from './pages/agency/ServicesPage'
import AgencyReferredCasesPage from './pages/agency/ReferredCasesPage'
import AgencyReferredCaseViewPage from './pages/agency/ReferredCaseViewPage'
import AgencyFeedbacksPage from './pages/agency/FeedbacksPage'
import AgencyReportsPage from './pages/agency/ReportsPage'
import AgencyActivityLogsPage from './pages/agency/ActivityLogsPage'
import SystemAdminLayout from './components/layout/SystemAdminLayout'
import SystemAdminDashboardPage from './pages/system-admin/DashboardPage'
import SystemAdminCasesPage from './pages/system-admin/CasesPage'
import SystemAdminClientsPage from './pages/system-admin/ClientsPage'
import SystemAdminAgenciesPage from './pages/system-admin/AgenciesPage'
import SystemAdminServicesPage from './pages/system-admin/ServicesPage'
import SystemAdminReferralsPage from './pages/system-admin/ReferralsPage'
import SystemAdminUsersPage from './pages/system-admin/UsersPage'
import SystemAdminAgencyViewPage from './pages/system-admin/AgencyViewPage'
import SystemAdminActivityLogsPage from './pages/system-admin/ActivityLogsPage'
import SystemAdminAuditLoggingPage from './pages/system-admin/AuditLoggingPage'
import SystemAdminIntegrationsPage from './pages/system-admin/IntegrationsPage'
import SystemAdminNotificationsPage from './pages/system-admin/NotificationsPage'
import SystemAdminSecurityPoliciesPage from './pages/system-admin/SecurityPoliciesPage'
import SystemAdminSystemSettingsPage from './pages/system-admin/SystemSettingsPage'
import RequireRole from './components/auth/RequireRole'
import RequireTrackingOtp from './components/auth/RequireTrackingOtp'
import TrackingOtpVerificationPage from './pages/TrackingOtpVerificationPage'
import EditProfilePage from './pages/shared/EditProfilePage'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/contact" element={<ContactPage />} />
        <Route path="/agencies" element={<AgenciesPage />} />
        <Route path="/agencies/:id" element={<AgencyDetailsPage />} />
        
        {/* Case Manager Routes */}
        <Route
          path="/case-manager"
          element={(
            <RequireRole role="Case Manager">
              <CaseManagerLayout />
            </RequireRole>
          )}
        >
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard" element={<DashboardPage />} />
          <Route path="cases" element={<CasesPage />} />
          <Route path="cases/new" element={<NewCasePage />} />
          <Route path="cases/:caseId" element={<CaseViewPage />} />
          <Route path="cases/:caseId/refer" element={<CaseReferralCreatePage />} />
          <Route path="clients" element={<ClientsPage />} />
          <Route path="clients/:clientId" element={<ClientDetailsPage />} />
          <Route path="referrals" element={<ReferralsPage />} />
          <Route path="referrals/new" element={<ReferralCreatePage />} />
          <Route path="referrals/:referralId" element={<ReferralViewPage />} />
          <Route path="stakeholders" element={<StakeholdersPage />} />
          <Route path="stakeholders/:stakeholderId" element={<StakeholderViewPage />} />
          <Route path="reports" element={<CaseManagerReportsPage />} />
          <Route path="audit-logs" element={<AuditLogsPage />} />
          <Route path="profile" element={<EditProfilePage />} />
        </Route>

        {/* Agency Routes */}
        <Route
          path="/agency"
          element={(
            <RequireRole role="Agency">
              <AgencyLayout />
            </RequireRole>
          )}
        >
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard" element={<AgencyDashboardPage />} />
          <Route path="referred-cases" element={<AgencyReferredCasesPage />} />
          <Route path="referred-cases/:caseId" element={<AgencyReferredCaseViewPage />} />
          <Route path="feedbacks" element={<AgencyFeedbacksPage />} />
          <Route path="referrals/:referralId" element={<ReferralViewPage />} />
          <Route path="services" element={<AgencyServicesPage />} />
          <Route path="reports" element={<AgencyReportsPage />} />
          <Route path="activity" element={<AgencyActivityLogsPage />} />
          <Route path="profile" element={<EditProfilePage />} />
        </Route>

        {/* System Admin Routes */}
        <Route
          path="/system-admin"
          element={(
            <RequireRole role="System Admin">
              <SystemAdminLayout />
            </RequireRole>
          )}
        >
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard" element={<SystemAdminDashboardPage />} />
          <Route path="cases" element={<SystemAdminCasesPage />} />
          <Route path="cases/new" element={<NewCasePage />} />
          <Route path="cases/:caseId" element={<CaseViewPage />} />
          <Route path="clients" element={<SystemAdminClientsPage />} />
          <Route path="clients/:clientId" element={<ClientDetailsPage />} />
          <Route path="agencies" element={<SystemAdminAgenciesPage />} />
          <Route path="agencies/:agencyId" element={<SystemAdminAgencyViewPage />} />
          <Route path="services" element={<SystemAdminServicesPage />} />
          <Route path="referrals" element={<SystemAdminReferralsPage />} />
          <Route path="referrals/:referralId" element={<ReferralViewPage />} />
          <Route path="users" element={<SystemAdminUsersPage />} />
          <Route path="activity-logs" element={<SystemAdminActivityLogsPage />} />
          <Route path="audit-logging" element={<SystemAdminAuditLoggingPage />} />
          <Route path="integrations" element={<SystemAdminIntegrationsPage />} />
          <Route path="emails" element={<SystemAdminNotificationsPage />} />
          <Route path="notifications" element={<SystemAdminNotificationsPage />} />
          <Route path="security-policies" element={<SystemAdminSecurityPoliciesPage />} />
          <Route path="system-settings" element={<SystemAdminSystemSettingsPage />} />
          <Route path="profile" element={<EditProfilePage />} />
        </Route>

        <Route path="/track/:trackerNumber/verify" element={<TrackingOtpVerificationPage />} />
        <Route
          path="/track/:trackerNumber/milestones"
          element={(
            <RequireTrackingOtp>
              <MilestonesPage />
            </RequireTrackingOtp>
          )}
        />
        <Route
          path="/track/:trackerNumber/dmw-milestones"
          element={(
            <RequireTrackingOtp>
              <DmwMilestonesPage />
            </RequireTrackingOtp>
          )}
        />
        <Route
          path="/track/:trackerNumber/tesda-milestones"
          element={(
            <RequireTrackingOtp>
              <TesdaMilestonesPage />
            </RequireTrackingOtp>
          )}
        />
        <Route
          path="/track/:trackerNumber"
          element={(
            <RequireTrackingOtp>
              <TrackCasePage />
            </RequireTrackingOtp>
          )}
        />
        <Route path="/track" element={<TrackYourCasePage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}