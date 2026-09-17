import React, { useState } from 'react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import ProgramsRegistrationView from '@/components/centralreg/ProgramsRegistrationView';
import ProgramsCalendarView from '@/components/centralreg/ProgramsCalendarView';

// Reception's Program Registration page mirrors the Central Registration
// portal's Programs & Registration tab (same view, same data — every save hits
// the shared database, so both portals always stay in sync), plus a program
// calendar.
export default function ReceptionProgramRegistration() {
  const [tab, setTab] = useState('registration');

  return (
    <div className="space-y-4">
      <p className="text-muted-foreground text-sm">
        Register participants into any Candora program and see the full program calendar — everything here stays in sync with the Central Registration portal.
      </p>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="registration">Programs &amp; Registration</TabsTrigger>
          <TabsTrigger value="calendar">Program Calendar</TabsTrigger>
        </TabsList>
        <TabsContent value="registration" className="mt-4">
          <ProgramsRegistrationView />
        </TabsContent>
        <TabsContent value="calendar" className="mt-4">
          <ProgramsCalendarView />
        </TabsContent>
      </Tabs>
    </div>
  );
}