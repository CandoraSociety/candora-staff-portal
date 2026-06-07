import { useState } from 'react';
import PortalSignIn from '@/components/portal/PortalSignIn';
import PortalRegistration from '@/components/portal/PortalRegistration';
import { Button } from '@/components/ui/button';

export default function VolunteerPortal() {
  const [view, setView] = useState('signin'); // 'signin' | 'register'

  return (
    <div className="min-h-screen bg-[hsl(230,60%,12%)] flex flex-col">
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-4 border-b border-[hsl(230,50%,18%)]">
        <img
          src="https://media.base44.com/images/public/6a15e361478575d63a95c265/ded6d4d7a_Candoralogo_noanniversary.png"
          alt="The Candora Society"
          className="h-16 object-contain"
        />
        <div className="flex items-center gap-2">
          <Button
            variant={view === 'signin' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setView('signin')}
            className={view === 'signin' ? 'bg-[hsl(45,92%,53%)] text-[hsl(230,60%,12%)] hover:bg-[hsl(45,92%,45%)]' : 'text-[hsl(45,60%,80%)] hover:text-white hover:bg-[hsl(230,55%,20%)]'}
          >
            Sign In / Out
          </Button>
          <Button
            variant={view === 'register' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setView('register')}
            className={view === 'register' ? 'bg-[hsl(45,92%,53%)] text-[hsl(230,60%,12%)] hover:bg-[hsl(45,92%,45%)]' : 'text-[hsl(45,60%,80%)] hover:text-white hover:bg-[hsl(230,55%,20%)]'}
          >
            Register
          </Button>
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 flex items-start justify-center pt-12 px-4">
        {view === 'signin' ? (
          <PortalSignIn />
        ) : (
          <PortalRegistration onComplete={() => setView('signin')} />
        )}
      </main>

      <footer className="text-center py-4 text-[hsl(45,40%,55%)] text-xs">
        © {new Date().getFullYear()} The Candora Society — VolunteerTrack
      </footer>
    </div>
  );
}