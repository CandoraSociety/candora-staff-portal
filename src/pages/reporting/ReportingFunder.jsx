import React from 'react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import FunderReportingTab from '@/components/reporting/funder/FunderReportingTab';
import { FUNDERS } from '@/lib/funderReportingConstants';

export default function ReportingFunder() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-heading font-bold tracking-tight text-accent">Funder Reports</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Documents, templates and reporting periods for each funder — organized by funder below
        </p>
      </div>

      <Tabs defaultValue="phac" className="space-y-6">
        <TabsList className="flex flex-wrap h-auto gap-1">
          {FUNDERS.map(f => (
            <TabsTrigger key={f.key} value={f.key}>{f.label}</TabsTrigger>
          ))}
        </TabsList>
        {FUNDERS.map(f => (
          <TabsContent key={f.key} value={f.key} className="mt-6">
            <FunderReportingTab funderKey={f.key} funderLabel={f.label} />
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}