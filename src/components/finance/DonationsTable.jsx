import React, { useEffect, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Gift, ChevronDown } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

export const donationMoney = (value) =>
  new Intl.NumberFormat('en-CA', { style: 'currency', currency: 'CAD' }).format(Number(value) || 0);

const DONATION_TYPE = {
  one_time: 'One-time gift',
  recurring_monthly: 'Monthly gift',
  recurring_annual: 'Annual gift',
  in_kind: 'In-kind gift',
  pledge: 'Pledge',
};

const PAYMENT_METHOD = {
  cash: 'Cash',
  cheque: 'Cheque',
  credit_card: 'Credit card',
  e_transfer: 'E-transfer',
  online: 'Online',
  other: 'Other',
};

const SOURCE = {
  manual: 'Recorded by staff',
  online_campaign: 'Online campaign',
};

// Date-only values are read as calendar dates, never shifted by the timezone.
const giftDate = (gift) => {
  const value = gift.donation_date || gift.created_date;
  if (!value) return null;
  const parts = String(value).slice(0, 10).split('-');
  if (parts.length === 3) {
    return new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
  }
  return new Date(value);
};

const giftDateLabel = (gift) => {
  const d = giftDate(gift);
  return d && !Number.isNaN(d.getTime()) ? format(d, 'MMM d, yyyy') : '—';
};

function Detail({ label, children }) {
  if (children === null || children === undefined || children === '') return null;
  return (
    <div>
      <p className="text-[11px] uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="text-sm text-foreground break-words">{children}</p>
    </div>
  );
}

function GiftDetails({ gift }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 bg-muted/40 rounded-lg p-4">
      <div className="space-y-3">
        <Detail label="Donor">{gift.is_anonymous ? 'Anonymous supporter' : gift.donor_name || 'Supporter'}</Detail>
        <Detail label="Email">{gift.donor_email}</Detail>
        <Detail label="Donor record">{gift.donor_id ? 'Linked to donor profile' : null}</Detail>
      </div>

      <div className="space-y-3">
        <Detail label="Gift">{donationMoney(gift.amount)}</Detail>
        <Detail label="Type">{DONATION_TYPE[gift.donation_type] || gift.donation_type}</Detail>
        <Detail label="Campaign">{gift.campaign_name || 'General Fund'}</Detail>
        <Detail label="Pillar">{gift.pillar_name}</Detail>
        <Detail label="Giving option">{gift.product_name}</Detail>
        <Detail label="Gift message">{gift.gift_message}</Detail>
      </div>

      <div className="space-y-3">
        <Detail label="Payment method">{PAYMENT_METHOD[gift.payment_method] || gift.payment_method}</Detail>
        <Detail label="Source">{SOURCE[gift.source] || gift.source}</Detail>
        <Detail label="Payment reference">{gift.payment_reference}</Detail>
        <Detail label="In-kind">{gift.in_kind_description}</Detail>
        <Detail label="In-kind value">{gift.in_kind_value ? donationMoney(gift.in_kind_value) : null}</Detail>
      </div>

      <div className="space-y-3">
        <Detail label="Receipt">
          {gift.receipt_issued
            ? [gift.receipt_number, gift.receipt_date ? giftDateLabel({ donation_date: gift.receipt_date }) : null]
                .filter(Boolean)
                .join(' · ') || 'Issued'
            : 'Not issued'}
        </Detail>
        <Detail label="Recorded by">{gift.recorded_by_name}</Detail>
        <Detail label="Notes">{gift.notes}</Detail>
      </div>
    </div>
  );
}

// Every gift as it is recorded, newest first — each row opens to the full donor and gift detail.
export default function DonationsTable() {
  const qc = useQueryClient();
  const [expanded, setExpanded] = useState({});

  const { data: gifts, isLoading } = useQuery({
    queryKey: ['finance-donation-feed'],
    queryFn: () => base44.entities.Donation.list({ sort: '-created_date', limit: 50 }),
  });

  useEffect(() => {
    const unsubscribe = base44.entities.Donation.subscribe(() => {
      qc.invalidateQueries({ queryKey: ['finance-donation-feed'] });
      qc.invalidateQueries({ queryKey: ['finance-donation-totals'] });
    });
    return unsubscribe;
  }, [qc]);

  const rows = gifts?.items || [];
  const toggle = (id) => setExpanded((prev) => ({ ...prev, [id]: !prev[id] }));

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-3">
        <CardTitle className="text-base">Donations received</CardTitle>
        <span className="flex items-center gap-1.5 text-xs font-medium text-emerald-600">
          <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" /> Live
        </span>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <p className="text-sm text-muted-foreground text-center py-6">Loading donations…</p>
        ) : rows.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">No donations recorded yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs uppercase tracking-wide text-muted-foreground border-b">
                  <th className="py-2 pr-3 font-medium whitespace-nowrap">Date</th>
                  <th className="py-2 pr-3 font-medium">Donor</th>
                  <th className="py-2 pr-3 font-medium hidden sm:table-cell">Campaign</th>
                  <th className="py-2 pr-3 font-medium text-right whitespace-nowrap">Amount</th>
                  <th className="py-2 w-8" />
                </tr>
              </thead>
              <tbody>
                {rows.map((gift) => {
                  const open = !!expanded[gift.id];
                  return (
                    <React.Fragment key={gift.id}>
                      <tr
                        className="border-b last:border-0 cursor-pointer hover:bg-muted/40 transition-colors"
                        onClick={() => toggle(gift.id)}
                      >
                        <td className="py-3 pr-3 whitespace-nowrap text-muted-foreground">{giftDateLabel(gift)}</td>
                        <td className="py-3 pr-3">
                          <span className="font-medium">
                            {gift.is_anonymous ? 'Anonymous supporter' : gift.donor_name || 'Supporter'}
                          </span>
                          <span className="block text-xs text-muted-foreground truncate max-w-[220px]">
                            {gift.donor_email || DONATION_TYPE[gift.donation_type] || ''}
                          </span>
                        </td>
                        <td className="py-3 pr-3 hidden sm:table-cell text-muted-foreground">
                          <span className="block truncate max-w-[220px]">{gift.campaign_name || 'General Fund'}</span>
                          {gift.pillar_name && (
                            <span className="block text-xs text-muted-foreground/80 truncate max-w-[220px]">
                              {gift.pillar_name}
                            </span>
                          )}
                        </td>
                        <td className="py-3 pr-3 text-right font-semibold whitespace-nowrap">
                          {donationMoney(gift.amount)}
                        </td>
                        <td className="py-3">
                          <ChevronDown
                            className={cn(
                              'h-4 w-4 text-muted-foreground transition-transform',
                              open && 'rotate-180',
                            )}
                          />
                        </td>
                      </tr>
                      {open && (
                        <tr className="border-b last:border-0">
                          <td colSpan={5} className="p-2">
                            <GiftDetails gift={gift} />
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}