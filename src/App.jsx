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

// Portal Selection
import PortalSelection from '@/pages/PortalSelection';

// Volunteer Manager Pages
import VolunteerMgrDashboard from '@/pages/volunteermgr/VolunteerMgrDashboard';
import VolunteerMgrVolunteers from '@/pages/volunteermgr/VolunteerMgrVolunteers';
import VolunteerMgrEvents from '@/pages/volunteermgr/VolunteerMgrEvents';
import VolunteerMgrEventDetail from '@/pages/volunteermgr/VolunteerMgrEventDetail';
import VolunteerMgrPositions from '@/pages/volunteermgr/VolunteerMgrPositions';
import VolunteerMgrSchedule from '@/pages/volunteermgr/VolunteerMgrSchedule';
import VolunteerMgrTimeLogs from '@/pages/volunteermgr/VolunteerMgrTimeLogs';
import VolunteerMgrApprovals from '@/pages/volunteermgr/VolunteerMgrApprovals';
import VolunteerMgrProfile from '@/pages/volunteermgr/VolunteerMgrProfile';
import VolunteerMgrDocuments from '@/pages/volunteermgr/VolunteerMgrDocuments';
import VolunteerMgrRecognition from '@/pages/volunteermgr/VolunteerMgrRecognition';
import VolunteerMgrMilestones from '@/pages/volunteermgr/VolunteerMgrMilestones';
import VolunteerMgrBirthdays from '@/pages/volunteermgr/VolunteerMgrBirthdays';
import VolunteerMgrTraining from '@/pages/volunteermgr/VolunteerMgrTraining';
import VolunteerMgrStaffRequests from '@/pages/volunteermgr/VolunteerMgrStaffRequests';
import VolunteerMgrEmail from '@/pages/volunteermgr/VolunteerMgrEmail';
import VolunteerMgrImport from '@/pages/volunteermgr/VolunteerMgrImport';
import VolunteerMgrLayout from '@/components/volunteermgr/VolunteerMgrLayout';

// Pathways CM Pages
import PathwaysHome from '@/pages/pathways/PathwaysHome';
import PathwaysIntake from '@/pages/pathways/PathwaysIntake';
import PathwaysDashboard from '@/pages/pathways/PathwaysDashboard';
import PathwaysClientProfile from '@/pages/pathways/PathwaysClientProfile';
import PathwaysMasterList from '@/pages/pathways/PathwaysMasterList';
import PathwaysReports from '@/pages/pathways/PathwaysReports';
import PathwaysSupervisor from '@/pages/pathways/PathwaysSupervisor';
import PathwaysResources from '@/pages/pathways/PathwaysResources';
import PathwaysCompass from '@/pages/pathways/PathwaysCompass';
import PathwaysBilling from '@/pages/pathways/PathwaysBilling';



const AuthenticatedApp = () => {
  return (
    <Routes>
      {/* Portal Selection */}
      <Route path="/" element={<PortalSelection />} />
      
      {/* Volunteer Manager Routes */}
      <Route path="/volunteer" element={<VolunteerMgrDashboard />} />
      <Route path="/volunteer/volunteers" element={<VolunteerMgrVolunteers />} />
      <Route path="/volunteer/events" element={<VolunteerMgrEvents />} />
      <Route path="/volunteer/events/:id" element={<VolunteerMgrEventDetail />} />
      <Route path="/volunteer/positions" element={<VolunteerMgrPositions />} />
      <Route path="/volunteer/schedule" element={<VolunteerMgrSchedule />} />
      <Route path="/volunteer/timelogs" element={<VolunteerMgrTimeLogs />} />
      <Route path="/volunteer/approvals" element={<VolunteerMgrApprovals />} />
      <Route path="/volunteer/profile/:id" element={<VolunteerMgrProfile />} />
      <Route path="/volunteer/documents" element={<VolunteerMgrDocuments />} />
      <Route path="/volunteer/recognition" element={<VolunteerMgrRecognition />} />
      <Route path="/volunteer/milestones" element={<VolunteerMgrMilestones />} />
      <Route path="/volunteer/birthdays" element={<VolunteerMgrBirthdays />} />
      <Route path="/volunteer/training" element={<VolunteerMgrTraining />} />
      <Route path="/volunteer/staff-requests" element={<VolunteerMgrStaffRequests />} />
      <Route path="/volunteer/email" element={<VolunteerMgrEmail />} />
      <Route path="/volunteer/import" element={<VolunteerMgrImport />} />
      
      {/* Pathways CM Routes */}
      <Route path="/pathways" element={<PathwaysHome />} />
      <Route path="/pathways/intake" element={<PathwaysIntake />} />
      <Route path="/pathways/dashboard" element={<PathwaysDashboard />} />
      <Route path="/pathways/client/:id" element={<PathwaysClientProfile />} />
      <Route path="/pathways/master" element={<PathwaysMasterList />} />
      <Route path="/pathways/reports" element={<PathwaysReports />} />
      <Route path="/pathways/supervisor" element={<PathwaysSupervisor />} />
      <Route path="/pathways/resources" element={<PathwaysResources />} />
      <Route path="/pathways/compass" element={<PathwaysCompass />} />
      <Route path="/pathways/billing" element={<PathwaysBilling />} />
      
      {/* Auth Routes */}
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />

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