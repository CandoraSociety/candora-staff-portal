import { Outlet } from 'react-router-dom';
import { ParticipantProvider } from '@/lib/joblab/ParticipantContext';

// Wraps every Job Lab route in its own participant session — entirely separate
// from the staff app's authentication.
export default function JobLabProvider() {
  return (
    <ParticipantProvider>
      <Outlet />
    </ParticipantProvider>
  );
}