import React from 'react';
import FinanceReimbursements from './FinanceReimbursements';

// Candora MasterCard tab — the same review/approval workflow as Staff Reimbursements,
// but listing Candora CC receipt submissions instead.
export default function FinanceMasterCard() {
  return <FinanceReimbursements mode="cc" />;
}