import React from 'react';
import { Receipt } from 'lucide-react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import UnsubmittedEntries from '@/components/reimbursements/UnsubmittedEntries';
import ReimbursementFormsList from '@/components/reimbursements/ReimbursementFormsList';
import EtransferEmailBar from '@/components/reimbursements/EtransferEmailBar';
import TestEmployeeBanner from '@/components/shared/TestEmployeeBanner';
import { ActingUserProvider } from '@/lib/ActingUserContext';
import { useExecutiveDirector, TEST_EMPLOYEE } from '@/lib/testEmployee';

function MyReimbursements() {
  return (
    <div className="space-y-8">
      <EtransferEmailBar />

      <UnsubmittedEntries />

      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-foreground uppercase tracking-wide">Submitted Reimbursements</h2>
        <ReimbursementFormsList
          statuses={['pending', 'processing', 'approved', 'rejected']}
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

// Duplicate of the full reimbursement flow, filed under the Test Employee.
// Submissions route to the Executive Director as supervisor for approval.
function TestEmployeeReimbursements({ supervisor }) {
  return (
    <ActingUserProvider user={TEST_EMPLOYEE}>
      <div className="space-y-8">
        <TestEmployeeBanner supervisor={supervisor} />

        <UnsubmittedEntries supervisorOverride={supervisor} />

        <section className="space-y-3">
          <h2 className="text-sm font-semibold text-foreground uppercase tracking-wide">Submitted Reimbursements</h2>
          <ReimbursementFormsList
            statuses={['pending', 'processing', 'approved', 'rejected']}
            emptyText="Nothing submitted yet for the Test Employee."
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
    </ActingUserProvider>
  );
}

export default function ReimbursementRequests() {
  const { isExecutiveDirector, supervisor } = useExecutiveDirector();

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div>
        <h1 className="text-2xl font-heading font-bold tracking-tight text-accent flex items-center gap-2">
          <Receipt className="w-6 h-6" />Reimbursement Requests
        </h1>
        <p className="text-muted-foreground text-sm mt-1">
          Enter each out-of-pocket purchase as it happens. When you're ready, submit your unsubmitted entries as one reimbursement form — Finance reviews it and marks it paid.
        </p>
      </div>

      {isExecutiveDirector ? (
        <Tabs defaultValue="mine">
          <TabsList>
            <TabsTrigger value="mine">My Requests</TabsTrigger>
            <TabsTrigger value="test">Test — Test Employee</TabsTrigger>
          </TabsList>
          <TabsContent value="mine" className="mt-6"><MyReimbursements /></TabsContent>
          <TabsContent value="test" className="mt-6"><TestEmployeeReimbursements supervisor={supervisor} /></TabsContent>
        </Tabs>
      ) : (
        <MyReimbursements />
      )}
    </div>
  );
}