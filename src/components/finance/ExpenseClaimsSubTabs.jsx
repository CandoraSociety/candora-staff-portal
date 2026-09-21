import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';

// Sub-tabs under the Finance portal's "Expense Claims" tab — switches between
// the staff reimbursement review and the Candora MasterCard statements/receipts.
const SUB_TABS = [
  { path: '/finance/reimbursements', label: 'Staff Reimbursements' },
  { path: '/finance/mastercard', label: 'Candora MasterCard' },
];

export default function ExpenseClaimsSubTabs() {
  const { pathname } = useLocation();
  return (
    <div className="flex items-center gap-1 border-b border-border">
      {SUB_TABS.map((t) => {
        const active = pathname.startsWith(t.path);
        return (
          <Link
            key={t.path}
            to={t.path}
            className={cn(
              'px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors',
              active
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            )}
          >
            {t.label}
          </Link>
        );
      })}
    </div>
  );
}