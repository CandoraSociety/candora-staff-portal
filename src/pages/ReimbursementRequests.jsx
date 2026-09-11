import React from 'react';
import { Receipt } from 'lucide-react';
import UnsubmittedEntries from '@/components/reimbursements/UnsubmittedEntries';
import ReimbursementFormsList from '@/components/reimbursements/ReimbursementFormsList';
import EtransferEmailBar from '@/components/reimbursements/EtransferEmailBar';

export default function ReimbursementRequests() {
  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      <div>
        <h1 className="text-2xl font-heading font-bold tracking-tight text-accent flex items-center gap-2">
          <Receipt className="w-6 h-6" />Reimbursement Requests
        </h1>
        <p className="text-muted-foreground text-sm mt-1">
          Enter each out-of-pocket purchase as it happens. When you're ready, submit your unsubmitted entries as one reimbursement form — Finance reviews it and marks it paid.
        </p>
      </div>

      <EtransferEmailBar />

      <UnsubmittedEntries />

      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-foreground uppercase tracking-wide">Submitted Reimbursements</h2>
        <ReimbursementFormsList
          statuses={['pending', 'approved', 'rejected']}
          emptyText="Nothing submitted yet. Use “Submit for Reimbursement” to send your entries to Finance."
        />
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-foreground uppercase tracking-wide">Paid</h2>
        <ReimbursementFormsList
          statuses={['paid']}
          emptyText="Reimbursements marked paid by Finance will appear here."
        />
      </section>
    </div>
  );
}