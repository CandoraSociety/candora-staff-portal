import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import IntensiveCaseWorkspace from '@/components/rc/intensive/IntensiveCaseWorkspace';
import IntensiveClientsReadOnly from '@/components/rc/intensive/IntensiveClientsReadOnly';
import GeneralClientsWorkspace from '@/components/rc/GeneralClientsWorkspace';

// Sub-tabs shared by the Master List and My Case Management scopes:
// Intensive Services (full workflow only with intensive casework permission),
// General Clients, and Caregiver Capacity 0-6y.
export default function CaseCategoryTabs({ scope = 'master', intensiveAccess = false }) {
  const [category, setCategory] = useState('intensive');
  const onlyMine = scope === 'my';

  return (
    <Tabs value={category} onValueChange={setCategory}>
      <TabsList>
        <TabsTrigger value="intensive">Intensive Services</TabsTrigger>
        <TabsTrigger value="general">General Clients</TabsTrigger>
        <TabsTrigger value="caregiver">Caregiver Capacity 0-6y</TabsTrigger>
      </TabsList>
      <TabsContent value="intensive" className="mt-4">
        {intensiveAccess
          ? <IntensiveCaseWorkspace onlyMine={onlyMine} />
          : <IntensiveClientsReadOnly onlyMine={onlyMine} />}
      </TabsContent>
      <TabsContent value="general" className="mt-4">
        <GeneralClientsWorkspace onlyMine={onlyMine} />
      </TabsContent>
      <TabsContent value="caregiver" className="mt-4">
        <GeneralClientsWorkspace category="caregiver" onlyMine={onlyMine} />
      </TabsContent>
    </Tabs>
  );
}