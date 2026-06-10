import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';
import ProtectedRoute from '@/components/ProtectedRoute';

// Public portal pages
import VolunteerPortal from '@/pages/portal/VolunteerPortal';
import StaffPortal from '@/pages/portal/StaffPortal';

// Auth pages
import Login from '@/pages/Login';
import Register from '@/pages/Register';
import ForgotPassword from '@/pages/ForgotPassword';
import ResetPassword from '@/pages/ResetPassword';

// Layout
import AppLayout from '@/components/layout/AppLayout';

// Pages
import Dashboard from '@/pages/Dashboard';
import Portal from '@/pages/Portal';

// NexusHR
import NexusLayout from '@/components/nexushr/NexusLayout';
import NexusDashboard from '@/pages/nexushr/NexusDashboard';
import NexusEmployees from '@/pages/nexushr/NexusEmployees';
import NexusPerformanceReviews from '@/pages/nexushr/NexusPerformanceReviews';
import NexusIncidents from '@/pages/nexushr/NexusIncidents';
import NexusTraining from '@/pages/nexushr/NexusTraining';
import NexusDocuments from '@/pages/nexushr/NexusDocuments';
import NexusContracts from '@/pages/nexushr/NexusContracts';
import NexusCorrectiveActions from '@/pages/nexushr/NexusCorrectiveActions';
import NexusLegalCases from '@/pages/nexushr/NexusLegalCases';
import NexusCareerPlans from '@/pages/nexushr/NexusCareerPlans';
import NexusPayGrid from '@/pages/nexushr/NexusPayGrid';
import NexusServiceAwards from '@/pages/nexushr/NexusServiceAwards';
import NexusTimeLogs from '@/pages/nexushr/NexusTimeLogs';
import NexusRecognition from '@/pages/nexushr/NexusRecognition';
import NexusOnboarding from '@/pages/nexushr/NexusOnboarding';
import NexusEmailEmployees from '@/pages/nexushr/NexusEmailEmployees';

// Volunteer Manager
import VolunteerMgrLayout from '@/components/volunteermgr/VolunteerMgrLayout';
import VolunteerMgrDashboard from '@/pages/volunteermgr/VolunteerMgrDashboard';
import VolunteerMgrVolunteers from '@/pages/volunteermgr/VolunteerMgrVolunteers';
import VolunteerMgrEvents from '@/pages/volunteermgr/VolunteerMgrEvents';
import VolunteerMgrEventDetail from '@/pages/volunteermgr/VolunteerMgrEventDetail';
import VolunteerMgrImport from '@/pages/volunteermgr/VolunteerMgrImport';
import VolunteerMgrEmail from '@/pages/volunteermgr/VolunteerMgrEmail';
import VolunteerMgrPositions from '@/pages/volunteermgr/VolunteerMgrPositions';
import VolunteerMgrTimeLogs from '@/pages/volunteermgr/VolunteerMgrTimeLogs';
import VolunteerMgrTraining from '@/pages/volunteermgr/VolunteerMgrTraining';
import VolunteerMgrRecognition from '@/pages/volunteermgr/VolunteerMgrRecognition';
import VolunteerMgrDocuments from '@/pages/volunteermgr/VolunteerMgrDocuments';
import VolunteerMgrApprovals from '@/pages/volunteermgr/VolunteerMgrApprovals';
import VolunteerMgrProfile from '@/pages/volunteermgr/VolunteerMgrProfile';
import VolunteerMgrBirthdays from '@/pages/volunteermgr/VolunteerMgrBirthdays';
import VolunteerMgrMilestones from '@/pages/volunteermgr/VolunteerMgrMilestones';
import VolunteerMgrSchedule from '@/pages/volunteermgr/VolunteerMgrSchedule';
import VolunteerMgrStaffRequests from '@/pages/volunteermgr/VolunteerMgrStaffRequests';

// Admin pages
import ManageCards from '@/pages/admin/ManageCards';
import ManageWidgets from '@/pages/admin/ManageWidgets';
import UsersAccess from '@/pages/admin/UsersAccess';
import Announcements from '@/pages/admin/Announcements';
import OrgSettingsPage from '@/pages/admin/OrgSettingsPage';

// Pathways CM - Case Management
import PathwaysLayout from '@/components/pathways/PathwaysLayout';
import PathwaysHome from '@/pages/pathways/PathwaysHome';
import PathwaysIntake from '@/pages/pathways/PathwaysIntake';
import PathwaysWorkerDashboard from '@/pages/pathways/PathwaysWorkerDashboard';
import PathwaysMasterList from '@/pages/pathways/PathwaysMasterList';
import PathwaysClientProfile from '@/pages/pathways/PathwaysClientProfile';
import PathwaysReports from '@/pages/pathways/PathwaysReports';
import PathwaysSupervisor from '@/pages/pathways/PathwaysSupervisor';
import PathwaysResources from '@/pages/pathways/PathwaysResources';
import PathwaysCompass from '@/pages/pathways/PathwaysCompass';
import PathwaysBilling from '@/pages/pathways/PathwaysBilling';
import PathwaysEmployers from '@/pages/pathways/PathwaysEmployers';
import PathwaysInternalTraining from '@/pages/pathways/PathwaysInternalTraining';

// Candora File Manager
import FileManagerLayout from '@/components/filemanager/FileManagerLayout';
import FileManagerHome from '@/pages/filemanager/FileManagerHome';
import FileBrowser from '@/pages/filemanager/FileBrowser';
import FileUploadPage from '@/pages/filemanager/FileUpload';
import FileViewer from '@/pages/filemanager/FileViewer';

// Marketing & Fundraising Manager
import MarketingLayout from '@/components/marketing/MarketingLayout';
import MarketingHome from '@/pages/marketing/MarketingHome';
import MarketingAssets from '@/pages/marketing/MarketingAssets';
import MarketingEmail from '@/pages/marketing/MarketingEmail';
import MarketingSocial from '@/pages/marketing/MarketingSocial';
import MarketingCampaigns from '@/pages/marketing/MarketingCampaigns';
import MarketingCalendar from '@/pages/marketing/MarketingCalendar';
import MarketingSEO from '@/pages/marketing/MarketingSEO';
import MarketingWebsite from '@/pages/marketing/MarketingWebsite';
import MarketingResources from '@/pages/marketing/MarketingResources';
import MarketingRequests from '@/pages/marketing/MarketingRequests';
import MarketingDonors from '@/pages/marketing/MarketingDonors';
import MarketingMedia from '@/pages/marketing/MarketingMedia';
import MarketingContent from '@/pages/marketing/MarketingContent';
import MarketingDonationPages from '@/pages/marketing/MarketingDonationPages';
import MarketingAnnualReport from '@/pages/marketing/MarketingAnnualReport';

const AuthenticatedApp = () => {
  const { isLoadingAuth, isLoadingPublicSettings, authError, navigateToLogin } = useAuth();

  if (isLoadingPublicSettings || isLoadingAuth) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-primary flex items-center justify-center">
            <span className="text-primary-foreground font-display font-bold text-lg">C</span>
          </div>
          <div className="w-8 h-8 border-[3px] border-primary/20 border-t-primary rounded-full animate-spin"></div>
        </div>
      </div>
    );
  }

  if (authError) {
    if (authError.type === 'user_not_registered') {
      return <UserNotRegisteredError />;
    } else if (authError.type === 'auth_required') {
      navigateToLogin();
      return null;
    }
  }

  return (
    <Routes>
      {/* Public portal routes — no auth required */}
      <Route path="/volunteer-portal" element={<VolunteerPortal />} />
      <Route path="/staff-portal" element={<StaffPortal />} />

      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      
      <Route element={<ProtectedRoute unauthenticatedElement={<Navigate to="/login" replace />} />}>
        <Route element={<AppLayout />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/portal" element={<Portal />} />
          <Route path="/admin/cards" element={<ManageCards />} />
          <Route path="/admin/widgets" element={<ManageWidgets />} />
          <Route path="/admin/users" element={<UsersAccess />} />
          <Route path="/admin/announcements" element={<Announcements />} />
          <Route path="/admin/settings" element={<OrgSettingsPage />} />
        </Route>

        {/* Volunteer Manager - standalone layout */}
        <Route element={<VolunteerMgrLayout />}>
          <Route path="/volunteermgr" element={<VolunteerMgrDashboard />} />
          <Route path="/volunteermgr/volunteers" element={<VolunteerMgrVolunteers />} />
          <Route path="/volunteermgr/events" element={<VolunteerMgrEvents />} />
          <Route path="/volunteermgr/positions" element={<VolunteerMgrPositions />} />
          <Route path="/volunteermgr/timelogs" element={<VolunteerMgrTimeLogs />} />
          <Route path="/volunteermgr/training" element={<VolunteerMgrTraining />} />
          <Route path="/volunteermgr/recognition" element={<VolunteerMgrRecognition />} />
          <Route path="/volunteermgr/documents" element={<VolunteerMgrDocuments />} />
          <Route path="/volunteermgr/approvals" element={<VolunteerMgrApprovals />} />
          <Route path="/volunteermgr/volunteers/:id" element={<VolunteerMgrProfile />} />
          <Route path="/volunteermgr/events/:id" element={<VolunteerMgrEventDetail />} />
          <Route path="/volunteermgr/import" element={<VolunteerMgrImport />} />
          <Route path="/volunteermgr/email" element={<VolunteerMgrEmail />} />
          <Route path="/volunteermgr/birthdays" element={<VolunteerMgrBirthdays />} />
          <Route path="/volunteermgr/milestones" element={<VolunteerMgrMilestones />} />
          <Route path="/volunteermgr/schedule" element={<VolunteerMgrSchedule />} />
          <Route path="/volunteermgr/staff-requests" element={<VolunteerMgrStaffRequests />} />
        </Route>

        {/* NexusHR - standalone layout */}
        <Route element={<NexusLayout />}>
          <Route path="/nexushr" element={<NexusDashboard />} />
          <Route path="/nexushr/employees" element={<NexusEmployees />} />
          <Route path="/nexushr/reviews" element={<NexusPerformanceReviews />} />
          <Route path="/nexushr/incidents" element={<NexusIncidents />} />
          <Route path="/nexushr/training" element={<NexusTraining />} />
          <Route path="/nexushr/documents" element={<NexusDocuments />} />
          <Route path="/nexushr/contracts" element={<NexusContracts />} />
          <Route path="/nexushr/corrective-actions" element={<NexusCorrectiveActions />} />
          <Route path="/nexushr/legal" element={<NexusLegalCases />} />
          <Route path="/nexushr/career-plans" element={<NexusCareerPlans />} />
          <Route path="/nexushr/pay-grid" element={<NexusPayGrid />} />
          <Route path="/nexushr/service-awards" element={<NexusServiceAwards />} />
          <Route path="/nexushr/time-logs" element={<NexusTimeLogs />} />
          <Route path="/nexushr/recognition" element={<NexusRecognition />} />
          <Route path="/nexushr/onboarding" element={<NexusOnboarding />} />
          <Route path="/nexushr/email-employees" element={<NexusEmailEmployees />} />
        </Route>

        {/* Marketing & Fundraising Manager - standalone layout */}
        <Route element={<MarketingLayout />}>
          <Route path="/marketing" element={<MarketingHome />} />
          <Route path="/marketing/assets" element={<MarketingAssets />} />
          <Route path="/marketing/email" element={<MarketingEmail />} />
          <Route path="/marketing/social" element={<MarketingSocial />} />
          <Route path="/marketing/campaigns" element={<MarketingCampaigns />} />
          <Route path="/marketing/calendar" element={<MarketingCalendar />} />
          <Route path="/marketing/seo" element={<MarketingSEO />} />
          <Route path="/marketing/website" element={<MarketingWebsite />} />
          <Route path="/marketing/resources" element={<MarketingResources />} />
          <Route path="/marketing/requests" element={<MarketingRequests />} />
          <Route path="/marketing/donors" element={<MarketingDonors />} />
          <Route path="/marketing/media" element={<MarketingMedia />} />
          <Route path="/marketing/content" element={<MarketingContent />} />
          <Route path="/marketing/donation-pages" element={<MarketingDonationPages />} />
          <Route path="/marketing/annual-report" element={<MarketingAnnualReport />} />
        </Route>

        {/* Candora File Manager - standalone layout */}
        <Route element={<FileManagerLayout />}>
          <Route path="/filemanager" element={<FileManagerHome />} />
          <Route path="/filemanager/files" element={<FileBrowser />} />
          <Route path="/filemanager/upload" element={<FileUploadPage />} />
          <Route path="/filemanager/view" element={<FileViewer />} />
        </Route>

        {/* Pathways CM - standalone layout */}
        <Route element={<PathwaysLayout />}>
          <Route path="/pathways" element={<PathwaysHome />} />
          <Route path="/pathways/intake" element={<PathwaysIntake />} />
          <Route path="/pathways/dashboard" element={<PathwaysWorkerDashboard />} />
          <Route path="/pathways/master" element={<PathwaysMasterList />} />
          <Route path="/pathways/client/:id" element={<PathwaysClientProfile />} />
          <Route path="/pathways/reports" element={<PathwaysReports />} />
          <Route path="/pathways/supervisor" element={<PathwaysSupervisor />} />
          <Route path="/pathways/resources" element={<PathwaysResources />} />
          <Route path="/pathways/compass" element={<PathwaysCompass />} />
          <Route path="/pathways/billing" element={<PathwaysBilling />} />
          <Route path="/pathways/employers" element={<PathwaysEmployers />} />
          <Route path="/pathways/training" element={<PathwaysInternalTraining />} />
        </Route>
      </Route>

      <Route path="*" element={<PageNotFound />} />
    </Routes>
  );
};

function App() {
  return (
    <AuthProvider>
      <QueryClientProvider client={queryClientInstance}>
        <Router>
          <AuthenticatedApp />
        </Router>
        <Toaster />
      </QueryClientProvider>
    </AuthProvider>
  )
}

export default App