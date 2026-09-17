import React from 'react';
import CCStatementsPanel from '@/components/finance/CCStatementsPanel';
import CCStaffReceiptsReview from '@/components/finance/CCStaffReceiptsReview';
import { CCReceiptSelectionProvider } from '@/components/finance/CCReceiptSelectionContext';

// Candora MasterCard tab — monthly card statements at the top (attach receipts
// to their line items and mark the statement complete), plus the receipts
// staff have submitted for review against those statements.
export default function FinanceMasterCard() {
  return (
    <CCReceiptSelectionProvider>
      <div className="space-y-6">
        <CCStatementsPanel />
        <CCStaffReceiptsReview />
      </div>
    </CCReceiptSelectionProvider>
  );
}