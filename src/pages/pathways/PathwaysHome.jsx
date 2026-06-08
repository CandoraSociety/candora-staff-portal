import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/lib/AuthContext';

const WORKERS = [
  { email: 'priscilla@candorasociety.com', name: 'Priscilla' },
  { email: 'lola@candorasociety.com', name: 'Lola' },
  { email: 'john@candorasociety.com', name: 'John' },
  { email: 'Dawn.williston@candorasociety.com', name: 'Dawn' },
  { email: 'olena@candorasociety.com', name: 'Olena' },
];

export default function PathwaysHome() {
  const navigate = useNavigate();
  const { user } = useAuth();
  
  useEffect(() => {
    if (!user) return;
    
    // Admin/Intake roles go to intake
    if (user.role === 'admin' || user.role === 'intake') {
      navigate('/pathways/intake', { replace: true });
      return;
    }
    
    // Workers go to dashboard
    if (WORKERS.some(w => w.email === user.email)) {
      navigate('/pathways/dashboard', { replace: true });
      return;
    }
    
    // Default to dashboard
    navigate('/pathways/dashboard', { replace: true });
  }, [user, navigate]);
  
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="text-center">
        <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-slate-600">Redirecting...</p>
      </div>
    </div>
  );
}