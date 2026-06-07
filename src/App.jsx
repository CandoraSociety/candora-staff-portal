import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';
import ProtectedRoute from '@/components/ProtectedRoute';

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

// Admin pages
import ManageCards from '@/pages/admin/ManageCards';
import ManageWidgets from '@/pages/admin/ManageWidgets';
import UsersAccess from '@/pages/admin/UsersAccess';
import Announcements from '@/pages/admin/Announcements';
import OrgSettingsPage from '@/pages/admin/OrgSettingsPage';

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