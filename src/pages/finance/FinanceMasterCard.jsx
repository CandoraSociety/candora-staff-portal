import React from 'react';
import FinanceReimbursements from './FinanceReimbursements';
import CCStatementsPanel from '@/components/finance/CCStatementsPanel';

// Candora MasterCard tab — the same review/approval workflow as Staff Reimbursements,
// but listing Candora CC receipt submissions instead, with monthly card
// statements uploaded and viewable at the top of the tab.
export default function FinanceMasterCard() {
  return (
    <div className="space-y-6">
      <CCStatementsPanel />
      <FinanceReimbursements mode="cc" />
    </div>
  );
}