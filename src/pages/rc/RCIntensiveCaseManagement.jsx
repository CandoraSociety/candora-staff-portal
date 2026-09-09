import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/lib/AuthContext';
import { useIntensiveAccess } from '@/lib/rcCaseAccess';
import CaseCategoryTabs from '@/components/rc/CaseCategoryTabs';
import MyCaseManagement from '@/components/rc/MyCaseManagement';
import ManagePortalUsersButton from '@/components/rc/ManagePortalUsersButton';

// Case Management — two scopes. "Master List" shows every client under case
// management; "My Case Management" shows only participants the signed-in
// caseworker has worked with (their assigned visits plus clients whose record
// or case has their name on it). Each scope breaks clients down by service
// category: Intensive Services (full workflow requires intensive casework
// permission — without it, the master list still shows client names and that
// they're receiving intensive services), General Clients, and Caregiver
// Capacity 0-6y.
export default function RCIntensiveCaseManagement() {
  const [scope, setScope] = useState('master');
  const { user } = useAuth();
  const { hasAccess } = useIntensiveAccess(user);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-heading font-bold text-foreground">Case Management</h1>
          <p className="text-muted-foreground text-sm mt-1">
            All clients under case management, split by service category — Intensive Services, General Clients, and 0-6 Caregiver Capacity.
          </p>
        </div>
        <ManagePortalUsersButton />
      </div>

      <Tabs value={scope} onValueChange={setScope}>
        <TabsList>
          <TabsTrigger value="master">Master List</TabsTrigger>
          <TabsTrigger value="my">My Case Management</TabsTrigger>
        </TabsList>
        <TabsContent value="master" className="mt-4">
          <CaseCategoryTabs scope="master" intensiveAccess={hasAccess} />
        </TabsContent>
        <TabsContent value="my" className="mt-4">
          <div className="space-y-4">
            <MyCaseManagement />
            <CaseCategoryTabs scope="my" intensiveAccess={hasAccess} />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}