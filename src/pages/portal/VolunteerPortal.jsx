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
    <div className="min-h-screen bg-gradient-to-br from-slate-900/5 via-yellow-50 to-slate-900/10 flex flex-col">
      {/* Header with Logo and Branded Styling */}
      <header className="px-6 py-8">
        <div className="max-w-2xl mx-auto text-center space-y-4">
          <div className="bg-white rounded-2xl p-8 border-2 border-slate-900 shadow-xl">
            <div className="mx-auto mb-6 flex justify-center">
              <img 
                src="https://media.base44.com/images/public/6a249282cb496579542673b7/60b9d3b2a_Candoracirclelogo_noanniversary.png"
                alt="Candora Society Logo"
                className="h-40 w-auto object-contain"
              />
            </div>
            <h1 className="text-4xl font-display font-bold text-slate-900 mb-1">Volunteer Portal</h1>
            <p className="text-base text-slate-700 font-semibold">Candora Society</p>
          </div>
          <p className="text-sm text-slate-800 max-w-md mx-auto font-medium">
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
              className="cursor-pointer hover:shadow-xl transition-all duration-300 border-2 border-slate-900 hover:border-slate-800 hover:shadow-slate-200 group bg-white"
              onClick={() => setView('signin')}
            >
              <CardContent className="p-8 flex items-center gap-4">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-slate-900 to-slate-800 flex items-center justify-center group-hover:from-slate-800 group-hover:to-slate-700 transition-all shadow-md">
                  <Clock className="w-8 h-8 text-yellow-400" />
                </div>
                <div className="flex-1">
                  <h2 className="text-xl font-bold font-display text-slate-900">Sign In / Sign Out</h2>
                  <p className="text-sm text-slate-600 mt-1">
                    Track your volunteer hours
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Register Card */}
            <Card
              className="cursor-pointer hover:shadow-xl transition-all duration-300 border-2 border-yellow-400 hover:border-yellow-500 hover:shadow-yellow-200 group bg-white"
              onClick={() => setView('register')}
            >
              <CardContent className="p-8 flex items-center gap-4">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-yellow-400 to-yellow-300 flex items-center justify-center group-hover:from-yellow-500 group-hover:to-yellow-400 transition-all shadow-md">
                  <UserPlus className="w-8 h-8 text-slate-900" />
                </div>
                <div className="flex-1">
                  <h2 className="text-xl font-bold font-display text-slate-900">Become a Volunteer</h2>
                  <p className="text-sm text-slate-600 mt-1">
                    Register to start your journey
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Cohort Register Card */}
            <Card
              className="cursor-pointer hover:shadow-xl transition-all duration-300 border-2 border-slate-900 hover:border-slate-800 hover:shadow-slate-200 group bg-white"
              onClick={() => setView('cohort-register')}
            >
              <CardContent className="p-8 flex items-center gap-4">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-slate-900 to-slate-800 flex items-center justify-center group-hover:from-slate-800 group-hover:to-slate-700 transition-all shadow-md">
                  <Building2 className="w-8 h-8 text-yellow-400" />
                </div>
                <div className="flex-1">
                  <h2 className="text-xl font-bold font-display text-slate-900">Group / Cohort Registration</h2>
                  <p className="text-sm text-slate-600 mt-1">
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
      <footer className="text-center py-6 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 border-t border-yellow-400">
        <p className="text-xs text-slate-300 font-medium">
          © {new Date().getFullYear()} The Candora Society — VolunteerTrack
        </p>
      </footer>
    </div>
  );
}