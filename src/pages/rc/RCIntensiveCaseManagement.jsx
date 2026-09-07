import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import IntensiveCaseWorkspace from '@/components/rc/intensive/IntensiveCaseWorkspace';
import GeneralClientsWorkspace from '@/components/rc/GeneralClientsWorkspace';

// Case Management — split by service category. Intensive Services clients get the
// full FRN workflow wizard; General clients get a lightweight interaction history
// (no monitored workflow — they typically reach out on their own).
export default function RCIntensiveCaseManagement() {
  const [mode, setMode] = useState('intensive');

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-heading font-bold text-foreground">Case Management</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Intensive Services (FRN — Building Resilient Caregivers) workflow, General Clients interaction history, and 0-6 Caregiver Capacity clients.
        </p>
      </div>

      <Tabs value={mode} onValueChange={setMode}>
        <TabsList>
          <TabsTrigger value="intensive">Intensive Services</TabsTrigger>
          <TabsTrigger value="general">General Clients</TabsTrigger>
          <TabsTrigger value="caregiver">Caregiver Capacity 0-6y</TabsTrigger>
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
      </Tabs>
    </div>
  );
}