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

// Main Pages
import Home from '@/pages/Home';
import IntakePage from '@/pages/IntakePage';
import WorkerDashboard from '@/pages/WorkerDashboard';
import ClientProfile from '@/pages/ClientProfile';
import MasterList from '@/pages/MasterList';
import Reports from '@/pages/Reports';
import SupervisorPortal from '@/pages/SupervisorPortal';
import Resources from '@/pages/Resources';
import Compass from '@/pages/Compass';
import MonthlyBillingSubmissions from '@/pages/MonthlyBillingSubmissions';

const AuthenticatedApp = () => {
  const { isLoadingAuth, isLoadingPublicSettings, authError, navigateToLogin } = useAuth();

  if (isLoadingPublicSettings || isLoadingAuth) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-primary flex items-center justify-center">
            <span className="text-primary-foreground font-display font-bold text-lg">P</span>
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
        <Route path="/" element={<Home />} />
        <Route path="/intake" element={<IntakePage />} />
        <Route path="/dashboard" element={<WorkerDashboard />} />
        <Route path="/client/:id" element={<ClientProfile />} />
        <Route path="/master" element={<MasterList />} />
        <Route path="/reports" element={<Reports />} />
        <Route path="/supervisor" element={<SupervisorPortal />} />
        <Route path="/resources" element={<Resources />} />
        <Route path="/compass" element={<Compass />} />
        <Route path="/billing" element={<MonthlyBillingSubmissions />} />
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