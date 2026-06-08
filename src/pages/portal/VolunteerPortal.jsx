import { useState } from 'react';
import PortalSignIn from '@/components/portal/PortalSignIn';
import PortalRegistration from '@/components/portal/PortalRegistration';
import PortalCohortRegistration from '@/components/portal/PortalCohortRegistration';
import PortalProfile from '@/components/portal/PortalProfile';
import PortalShiftSignup from '@/components/portal/PortalShiftSignup';
import { Heart, Clock, UserPlus, Users, User, Calendar, Building2 } from 'lucide-react';
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
    <div className="min-h-screen bg-gradient-to-br from-accent/10 via-primary/5 to-accent/5 flex flex-col">
      {/* Header with Logo and Branded Styling */}
      <header className="px-6 py-8">
        <div className="max-w-2xl mx-auto text-center space-y-4">
          <div className="bg-gradient-to-br from-accent/20 via-primary/10 to-accent/10 rounded-2xl p-6 border-2 border-accent/30 shadow-xl">
            <div className="w-20 h-20 rounded-xl bg-accent flex items-center justify-center mx-auto mb-3 shadow-lg">
              <span className="text-white font-display font-bold text-4xl">C</span>
            </div>
            <h1 className="text-4xl font-display font-bold text-foreground mb-1">Candora Society</h1>
            <p className="text-base text-muted-foreground font-semibold">Volunteer Portal</p>
          </div>
          <p className="text-sm text-foreground max-w-md mx-auto">
            Welcome! Sign in to track your hours or register to join our volunteer community.
          </p>
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 flex items-center justify-center px-4 py-8">
        {view === 'home' && (
          <div className="max-w-lg w-full space-y-4">
            {/* Sign In Card */}
            <Card
              className="cursor-pointer hover:shadow-xl transition-all duration-300 border-2 border-accent/30 hover:border-accent/50 hover:shadow-accent/20 group bg-gradient-to-br from-accent/5 to-transparent"
              onClick={() => setView('signin')}
            >
              <CardContent className="p-8 flex items-center gap-4">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-accent/30 to-accent/20 flex items-center justify-center group-hover:from-accent/40 group-hover:to-accent/30 transition-all shadow-md">
                  <Clock className="w-8 h-8 text-accent" />
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
              className="cursor-pointer hover:shadow-xl transition-all duration-300 border-2 border-primary/30 hover:border-primary/50 hover:shadow-primary/20 group bg-gradient-to-br from-primary/5 to-transparent"
              onClick={() => setView('register')}
            >
              <CardContent className="p-8 flex items-center gap-4">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary/30 to-primary/20 flex items-center justify-center group-hover:from-primary/40 group-hover:to-primary/30 transition-all shadow-md">
                  <UserPlus className="w-8 h-8 text-primary" />
                </div>
                <div className="flex-1">
                  <h2 className="text-xl font-bold font-display">Become a Volunteer</h2>
                  <p className="text-sm text-muted-foreground mt-1">
                    Register to start your journey
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Cohort Register Card */}
            <Card
              className="cursor-pointer hover:shadow-xl transition-all duration-300 border-2 border-accent/30 hover:border-accent/50 hover:shadow-accent/20 group bg-gradient-to-br from-accent/5 to-transparent"
              onClick={() => setView('cohort-register')}
            >
              <CardContent className="p-8 flex items-center gap-4">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-accent/30 to-accent/20 flex items-center justify-center group-hover:from-accent/40 group-hover:to-accent/30 transition-all shadow-md">
                  <Building2 className="w-8 h-8 text-accent" />
                </div>
                <div className="flex-1">
                  <h2 className="text-xl font-bold font-display">Group / Cohort Registration</h2>
                  <p className="text-sm text-muted-foreground mt-1">
                    Register your organization, church, or school group
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
          />
        )}

        {view === 'register' && (
          <PortalRegistration onComplete={() => setView('home')} />
        )}

        {view === 'cohort-register' && (
          <PortalCohortRegistration onComplete={() => setView('home')} />
        )}
      </main>

      {/* Footer */}
      <footer className="text-center py-6 bg-gradient-to-r from-accent/20 via-primary/10 to-accent/20 border-t border-accent/30">
        <p className="text-xs text-muted-foreground font-medium">
          © {new Date().getFullYear()} The Candora Society — VolunteerTrack
        </p>
      </footer>
    </div>
  );
}