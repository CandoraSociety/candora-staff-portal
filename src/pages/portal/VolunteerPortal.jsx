import { useState } from 'react';
import PortalSignIn from '@/components/portal/PortalSignIn';
import PortalRegistration from '@/components/portal/PortalRegistration';
import PortalProfile from '@/components/portal/PortalProfile';
import PortalShiftSignup from '@/components/portal/PortalShiftSignup';
import { Heart, Clock, UserPlus, User, Calendar } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

export default function VolunteerPortal() {
  const [view, setView] = useState('home');
  const [selectedVolunteerId, setSelectedVolunteerId] = useState(null);
  const [authenticatedVolunteer, setAuthenticatedVolunteer] = useState(null);

  const handleAuthenticated = (volunteerId, volunteer) => {
    setSelectedVolunteerId(volunteerId);
    setAuthenticatedVolunteer(volunteer);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-primary/5 to-background flex flex-col">
      {/* Header */}
      <header className="px-6 py-4">
        <div className="max-w-lg mx-auto flex items-center justify-center gap-3">
          <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center">
            <Heart className="w-6 h-6 text-primary fill-primary" />
          </div>
          <div className="text-center">
            <h1 className="text-xl font-display font-bold text-foreground">Candora Society</h1>
            <p className="text-xs text-muted-foreground">Volunteer Portal</p>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 flex items-center justify-center px-4 py-8">
        {view === 'home' && (
          <div className="max-w-lg w-full space-y-4">
            {/* Sign In Card */}
            <Card
              className="cursor-pointer hover:shadow-xl transition-all duration-300 border-2 hover:border-primary/30 group"
              onClick={() => setView('signin')}
            >
              <CardContent className="p-8 flex items-center gap-4">
                <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                  <Clock className="w-7 h-7 text-primary" />
                </div>
                <div className="flex-1">
                  <h2 className="text-xl font-bold font-display">Sign In / Sign Out</h2>
                  <p className="text-sm text-muted-foreground mt-1">
                    Track your volunteer hours
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Register Card */}
            <Card
              className="cursor-pointer hover:shadow-xl transition-all duration-300 border-2 hover:border-accent/30 group"
              onClick={() => setView('register')}
            >
              <CardContent className="p-8 flex items-center gap-4">
                <div className="w-14 h-14 rounded-full bg-accent/10 flex items-center justify-center group-hover:bg-accent/20 transition-colors">
                  <UserPlus className="w-7 h-7 text-accent" />
                </div>
                <div className="flex-1">
                  <h2 className="text-xl font-bold font-display">Become a Volunteer</h2>
                  <p className="text-sm text-muted-foreground mt-1">
                    Register to start your journey
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {view === 'signin' && (
          <PortalSignIn 
            onBack={() => setView('home')} 
            onAuthenticated={handleAuthenticated}
            onViewProfile={() => setView('profile')}
            onViewShifts={() => setView('shifts')}
          />
        )}

        {view === 'register' && (
          <PortalRegistration onComplete={() => setView('home')} />
        )}

        {view === 'profile' && selectedVolunteerId && (
          <PortalProfile 
            volunteerId={selectedVolunteerId}
            onBack={() => {
              setView('home');
              setSelectedVolunteerId(null);
              setAuthenticatedVolunteer(null);
            }}
          />
        )}

        {view === 'shifts' && selectedVolunteerId && (
          <PortalShiftSignup
            volunteerId={selectedVolunteerId}
            onBack={() => {
              setView('home');
              setSelectedVolunteerId(null);
              setAuthenticatedVolunteer(null);
            }}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="text-center py-6 text-muted-foreground text-xs">
        © {new Date().getFullYear()} The Candora Society — VolunteerTrack
      </footer>
    </div>
  );
}