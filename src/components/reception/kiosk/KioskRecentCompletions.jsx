import React from 'react';
import { Button } from '@/components/ui/button';
import { CreditCard, Heart, Receipt } from 'lucide-react';

const money = (value) => `$${Number(value || 0).toFixed(2)}`;

const when = (value) => {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleString('en-CA', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
};

// Gifts and orders that already finished on the tablet — a receipt stays
// available here after the tablet has moved on.
export default function KioskRecentCompletions({ prompts = [], onReceipt }) {
  const rows = prompts
    .filter((prompt) => prompt.status === 'submitted' && ['donation', 'purchase'].includes(prompt.kind))
    .slice(0, 10);

  if (!rows.length) return null;

  return (
    <div className="rounded-xl border bg-card">
      <div className="px-5 py-4 border-b">
        <h2 className="font-semibold">Recent donations and orders</h2>
        <p className="text-xs text-muted-foreground mt-0.5">Open a receipt to print it or email it to the customer.</p>
      </div>
      <div className="divide-y">
        {rows.map((prompt) => {
          const isDonation = prompt.kind === 'donation';
          const Icon = isDonation ? Heart : CreditCard;
          const amount = isDonation ? prompt.response_amount : prompt.response_total;
          return (
            <div key={prompt.id} className="flex items-center gap-3 px-5 py-3">
              <div className="h-9 w-9 rounded-lg bg-muted flex items-center justify-center shrink-0">
                <Icon className="h-4 w-4 text-muted-foreground" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm truncate">
                  <span className="font-medium">{prompt.response_name || (isDonation ? 'Anonymous donor' : 'Walk-in customer')}</span>
                  <span className="text-muted-foreground">
                    {' · '}{isDonation ? 'Donation' : 'Purchase'}
                    {isDonation && prompt.response_recurring ? ' (monthly)' : ''}
                  </span>
                </p>
                <p className="text-xs text-muted-foreground">
                  {when(prompt.responded_at || prompt.updated_date)}
                  {prompt.station_name ? ` · ${prompt.station_name}` : ''}
                </p>
              </div>
              <span className="text-sm font-semibold shrink-0">{money(amount)}</span>
              <Button size="sm" variant="outline" className="gap-1.5 shrink-0" onClick={() => onReceipt(prompt)}>
                <Receipt className="h-3.5 w-3.5" /> Receipt
              </Button>
            </div>
          );
        })}
      </div>
    </div>
  );
}