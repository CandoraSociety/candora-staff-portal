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
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex flex-col">
      {/* Header with Logo - NO BOX */}
      <header className="px-6 py-8">
        <div className="max-w-2xl mx-auto text-center">
          <img 
            src="https://media.base44.com/images/public/6a249282cb496579542673b7/60b9d3b2a_Candoracirclelogo_noanniversary.png"
            alt="Candora Society Logo"
            className="h-48 w-auto object-contain mx-auto mb-4"
          />
          <h1 className="text-4xl font-display font-bold text-yellow-400 mb-1">Volunteer Portal</h1>
          <p className="text-base text-yellow-300 font-semibold mb-2">Candora Society</p>
          <p className="text-sm text-yellow-100/90 max-w-md mx-auto">
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
              className="cursor-pointer hover:shadow-2xl hover:shadow-yellow-400/30 transition-all duration-300 border border-slate-700 group bg-slate-800/80 backdrop-blur"
              onClick={() => setView('signin')}
            >
              <CardContent className="p-8 flex items-center gap-4">
                <div className="w-16 h-16 rounded-full bg-yellow-400 flex items-center justify-center group-hover:bg-yellow-300 transition-all shadow-lg">
                  <Clock className="w-8 h-8 text-slate-900" />
                </div>
                <div className="flex-1">
                  <h2 className="text-xl font-bold font-display text-yellow-400">Sign In / Sign Out</h2>
                  <p className="text-sm text-yellow-200/70 mt-1">
                    Track your volunteer hours
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Register Card */}
            <Card
              className="cursor-pointer hover:shadow-2xl hover:shadow-yellow-400/30 transition-all duration-300 border border-slate-700 group bg-slate-800/80 backdrop-blur"
              onClick={() => setView('register')}
            >
              <CardContent className="p-8 flex items-center gap-4">
                <div className="w-16 h-16 rounded-full bg-yellow-400 flex items-center justify-center group-hover:bg-yellow-300 transition-all shadow-lg">
                  <UserPlus className="w-8 h-8 text-slate-900" />
                </div>
                <div className="flex-1">
                  <h2 className="text-xl font-bold font-display text-yellow-400">Become a Volunteer</h2>
                  <p className="text-sm text-yellow-200/70 mt-1">
                    Register to start your journey
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Cohort Register Card */}
            <Card
              className="cursor-pointer hover:shadow-2xl hover:shadow-yellow-400/30 transition-all duration-300 border border-slate-700 group bg-slate-800/80 backdrop-blur"
              onClick={() => setView('cohort-register')}
            >
              <CardContent className="p-8 flex items-center gap-4">
                <div className="w-16 h-16 rounded-full bg-yellow-400 flex items-center justify-center group-hover:bg-yellow-300 transition-all shadow-lg">
                  <Building2 className="w-8 h-8 text-slate-900" />
                </div>
                <div className="flex-1">
                  <h2 className="text-xl font-bold font-display text-yellow-400">Group / Cohort Registration</h2>
                  <p className="text-sm text-yellow-200/70 mt-1">
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
      <footer className="text-center py-6 bg-slate-950 border-t border-yellow-400/30">
        <p className="text-xs text-yellow-400 font-medium">
          © {new Date().getFullYear()} The Candora Society — VolunteerTrack
        </p>
      </footer>
    </div>
  );
}