import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import IntensiveCaseWorkspace from '@/components/rc/intensive/IntensiveCaseWorkspace';
import GeneralClientsWorkspace from '@/components/rc/GeneralClientsWorkspace';
import MyCaseManagement from '@/components/rc/MyCaseManagement';
import ManagePortalUsersButton from '@/components/rc/ManagePortalUsersButton';

// Case Management — split by service category. Intensive Services clients get the
// full FRN workflow wizard; General clients get a lightweight interaction history
// (no monitored workflow — they typically reach out on their own). "My Case
// Management" holds the signed-in caseworker's pending client visits.
export default function RCIntensiveCaseManagement() {
  const [mode, setMode] = useState('intensive');

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-heading font-bold text-foreground">Case Management</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Intensive Services (FRN — Building Resilient Caregivers) workflow, General Clients interaction history, and 0-6 Caregiver Capacity clients.
          </p>
        </div>
        <ManagePortalUsersButton />
      </div>

      <Tabs value={mode} onValueChange={setMode}>
        <TabsList>
          <TabsTrigger value="intensive">Intensive Services</TabsTrigger>
          <TabsTrigger value="general">General Clients</TabsTrigger>
          <TabsTrigger value="caregiver">Caregiver Capacity 0-6y</TabsTrigger>
          <TabsTrigger value="my">My Case Management</TabsTrigger>
        </TabsList>
        <TabsContent value="intensive" className="mt-4">
          <IntensiveCaseWorkspace />
        </TabsContent>
        <TabsContent value="general" className="mt-4">
          <GeneralClientsWorkspace />
        </TabsContent>
        <TabsContent value="caregiver" className="mt-4">
          <GeneralClientsWorkspace category="caregiver" />
        </TabsContent>
        <TabsContent value="my" className="mt-4">
          <MyCaseManagement />
        </TabsContent>
      </Tabs>
    </div>
  );
}