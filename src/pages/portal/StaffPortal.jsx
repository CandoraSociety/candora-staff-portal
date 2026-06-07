import { useState } from 'react';
import StaffVolunteerRequestForm from '@/components/portal/StaffVolunteerRequestForm';
import StaffReportingForm from '@/components/portal/StaffReportingForm';
import { Button } from '@/components/ui/button';
import { ClipboardList, FileText, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function StaffPortal() {
  const [view, setView] = useState('request'); // 'request' | 'report'

  return (
    <div className="min-h-screen bg-[hsl(230,60%,12%)] flex flex-col">
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-4 border-b border-[hsl(230,50%,18%)]">
        <div className="flex items-center gap-3">
          <img
            src="https://media.base44.com/images/public/6a15e361478575d63a95c265/ded6d4d7a_Candoralogo_noanniversary.png"
            alt="The Candora Society"
            className="h-12 object-contain"
          />
          <div className="border-l border-[hsl(230,50%,25%)] pl-3">
            <p className="text-[hsl(45,92%,53%)] font-bold text-sm">Staff Portal</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Link to="/">
            <Button variant="ghost" size="sm" className="text-[hsl(45,60%,80%)] hover:text-white hover:bg-[hsl(230,55%,20%)] mr-2">
              <ArrowLeft className="w-4 h-4 mr-1" />
              Main Portal
            </Button>
          </Link>
          <Button
            variant={view === 'request' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setView('request')}
            className={view === 'request' ? 'bg-[hsl(45,92%,53%)] text-[hsl(230,60%,12%)] hover:bg-[hsl(45,92%,45%)]' : 'text-[hsl(45,60%,80%)] hover:text-white hover:bg-[hsl(230,55%,20%)]'}
          >
            <ClipboardList className="w-4 h-4 mr-1" />
            Request Volunteers
          </Button>
          <Button
            variant={view === 'report' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setView('report')}
            className={view === 'report' ? 'bg-[hsl(45,92%,53%)] text-[hsl(230,60%,12%)] hover:bg-[hsl(45,92%,45%)]' : 'text-[hsl(45,60%,80%)] hover:text-white hover:bg-[hsl(230,55%,20%)]'}
          >
            <FileText className="w-4 h-4 mr-1" />
            Submit Report
          </Button>
        </div>
      </header>

      <main className="flex-1 flex items-start justify-center pt-12 px-4 pb-12">
        {view === 'request' ? <StaffVolunteerRequestForm /> : <StaffReportingForm />}
      </main>

      <footer className="text-center py-4 text-[hsl(45,40%,55%)] text-xs">
        © {new Date().getFullYear()} The Candora Society — VolunteerTrack
      </footer>
    </div>
  );
}