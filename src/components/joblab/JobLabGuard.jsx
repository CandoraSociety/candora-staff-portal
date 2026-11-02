import { Navigate, Outlet } from 'react-router-dom';
import { useParticipant } from '@/lib/joblab/ParticipantContext';

export default function JobLabGuard() {
  const { loading, participant } = useParticipant();

  if (loading) {
    return (
      <div className="joblab fixed inset-0 flex items-center justify-center">
        <div className="w-10 h-10 rounded-full border-[3px] border-jl-primary/20 border-t-jl-primary animate-spin" />
      </div>
    );
  }

  if (!participant) return <Navigate to="/joblab" replace />;

  return <Outlet />;
}