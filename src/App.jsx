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