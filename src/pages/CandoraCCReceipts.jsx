import React from 'react';
import { CreditCard } from 'lucide-react';
import UnsubmittedEntries from '@/components/reimbursements/UnsubmittedEntries';
import ReimbursementFormsList from '@/components/reimbursements/ReimbursementFormsList';
import EtransferEmailBar from '@/components/reimbursements/EtransferEmailBar';

export default function CandoraCCReceipts() {
  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      <div>
        <h1 className="text-2xl font-heading font-bold tracking-tight text-accent flex items-center gap-2">
          <CreditCard className="w-6 h-6" />Candora CC Receipts
        </h1>
        <p className="text-muted-foreground text-sm mt-1">
          Enter each Candora MasterCard purchase as it happens. When you're ready, submit your unsubmitted receipts — they go to the Candora MasterCard tab in the Finance portal.
        </p>
      </div>

      <EtransferEmailBar />

      <UnsubmittedEntries mode="cc" />

      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-foreground uppercase tracking-wide">Submitted</h2>
        <ReimbursementFormsList
          mode="cc"
          statuses={['pending', 'approved', 'rejected']}
          emptyText="Nothing submitted yet. Use “Submit Receipts” to send your MasterCard receipts to Finance."
        />
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-foreground uppercase tracking-wide">Paid</h2>
        <ReimbursementFormsList
          mode="cc"
          statuses={['paid']}
          emptyText="Submissions processed by Finance will appear here."
        />
      </section>
    </div>
  );
}