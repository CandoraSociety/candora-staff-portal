import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { CalendarDays, DoorOpen, ClipboardList, Siren, ArrowRight } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import UrgentAlertDialog from '@/components/reception/UrgentAlertDialog';
import { useAuth } from '@/lib/AuthContext';

// Simple mode front desk — nothing but the three moves a receptionist needs,
// each one a big tappable card. No lists, counts or calendars on this page.
const CARDS = [
  {
    path: '/reception/appointments',
    label: 'Appointments',
    help: 'Find, book and check in a visitor',
    icon: CalendarDays,
    tone: 'bg-blue-50 text-blue-600',
  },
  {
    path: '/reception/dropins',
    label: 'Drop-Ins',
    help: 'Sign in someone who walked in',
    icon: DoorOpen,
    tone: 'bg-green-50 text-green-600',
  },
  {
    path: '/reception/registration',
    label: 'Program Registration',
    help: 'Register someone for a program',
    icon: ClipboardList,
    tone: 'bg-purple-50 text-purple-600',
  },
];

export default function SimpleReceptionHome() {
  const [urgentOpen, setUrgentOpen] = useState(false);
  const { user } = useAuth();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-heading font-bold text-foreground">Reception</h1>
          <p className="text-muted-foreground text-sm mt-1">
            {new Date().toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>
        <Button variant="destructive" onClick={() => setUrgentOpen(true)}>
          <Siren className="h-4 w-4" /> Urgent Alert
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {CARDS.map((card) => {
          const Icon = card.icon;
          return (
            <Link key={card.path} to={card.path}>
              <Card className="h-full hover:shadow-lg hover:border-primary/40 transition-all cursor-pointer">
                <CardContent className="p-6 flex flex-col items-start gap-4">
                  <div className={`h-16 w-16 rounded-2xl flex items-center justify-center ${card.tone}`}>
                    <Icon className="h-8 w-8" />
                  </div>
                  <div>
                    <p className="text-xl font-display font-bold text-foreground">{card.label}</p>
                    <p className="text-sm text-muted-foreground mt-1">{card.help}</p>
                  </div>
                  <span className="mt-auto inline-flex items-center gap-1 text-sm font-semibold text-primary">
                    Open <ArrowRight className="h-4 w-4" />
                  </span>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>

      <UrgentAlertDialog
        open={urgentOpen}
        onOpenChange={setUrgentOpen}
        currentUser={user}
        onSaved={() => setUrgentOpen(false)}
      />
    </div>
  );
}