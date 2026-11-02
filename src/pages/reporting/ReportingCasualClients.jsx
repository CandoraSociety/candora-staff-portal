import React from 'react';
import CasualClientStats from '@/components/reports/CasualClientStats';

export default function ReportingCasualClients() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-heading font-bold tracking-tight text-accent">Casual Client Stats</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Job Lab registrations and guest visits, tracked as casual clients in the Pathways CM portal
        </p>
      </div>
      <CasualClientStats />
    </div>
  );
}