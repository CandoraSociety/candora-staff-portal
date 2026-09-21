import React from 'react';
import CCStatementsPanel from '@/components/finance/CCStatementsPanel';
import ExpenseClaimsSubTabs from '@/components/finance/ExpenseClaimsSubTabs';
import FinanceReimbursements from './FinanceReimbursements';

// Candora MasterCard tab — monthly card statements at the top (attach receipts
// to their line items and mark the statement complete), plus the full finance
// review of staff receipt submissions (same columns, editability and
// automation as the Reimbursements tab, in MasterCard mode).
export default function FinanceMasterCard() {
  return (
    <div className="space-y-6">
      <ExpenseClaimsSubTabs />
      <CCStatementsPanel />
      <FinanceReimbursements mode="cc" hideSummary />
    </div>
  );
}