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
    <div className="min-h-screen bg-gradient-to-b from-primary/10 via-primary/5 to-background flex flex-col">
      {/* Header with Logo */}
      <header className="px-6 py-8">
        <div className="max-w-2xl mx-auto text-center space-y-4">
          <div className="flex justify-center mb-4">
            <img 
              src="https://images.unsplash.com/photo-1490730141103-6cac27aaab94?w=400&h=400&fit=crop" 
              alt="Candora Society Logo"
              className="h-32 w-auto object-contain"
            />
          </div>
          <div>
            <h1 className="text-3xl font-display font-bold text-foreground mb-2">Candora Society</h1>
            <p className="text-lg text-muted-foreground font-medium">Volunteer Portal</p>
          </div>
          <div className="bg-white/60 backdrop-blur-sm rounded-lg p-4 max-w-lg mx-auto border border-primary/20">
            <p className="text-sm text-foreground leading-relaxed">
              Welcome! Thank you for your interest in volunteering with Candora Society. 
              Your time and talent make a meaningful difference in our community. 
              Please sign in to track your hours or register to begin your volunteer journey with us.
            </p>
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

            {/* Cohort Register Card */}
            <Card
              className="cursor-pointer hover:shadow-xl transition-all duration-300 border-2 hover:border-primary/30 group"
              onClick={() => setView('cohort-register')}
            >
              <CardContent className="p-8 flex items-center gap-4">
                <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                  <Building2 className="w-7 h-7 text-primary" />
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
      <footer className="text-center py-6 text-muted-foreground text-xs">
        © {new Date().getFullYear()} The Candora Society — VolunteerTrack
      </footer>
    </div>
  );
}