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
  return (
    <Routes>
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