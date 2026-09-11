import React from 'react';
import { Receipt } from 'lucide-react';
import ReimbursementRequestForm from '@/components/reimbursements/ReimbursementRequestForm';
import ReimbursementRequestsTable from '@/components/reimbursements/ReimbursementRequestsTable';

export default function ReimbursementRequests() {
  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div>
        <h1 className="text-2xl font-heading font-bold tracking-tight text-accent flex items-center gap-2">
          <Receipt className="w-6 h-6" />Reimbursement Requests
        </h1>
        <p className="text-muted-foreground text-sm mt-1">
          Submit out-of-pocket expenses for reimbursement and track the status of your requests. Requests are reviewed by Finance.
        </p>
      </div>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-foreground uppercase tracking-wide">New Request</h2>
        <ReimbursementRequestForm />
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-foreground uppercase tracking-wide">My Requests</h2>
        <ReimbursementRequestsTable />
      </section>
    </div>
  );
}