import React from 'react';
import { Button } from '@/components/ui/button';

export default function ProgramReferralRow({ referral, busy, onUpdate }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 p-2 rounded-md hover:bg-muted/50">
      <div className="min-w-0">
        <p className="text-sm font-medium text-foreground truncate">{referral.client_name}</p>
        <p className="text-xs text-muted-foreground">
          {referral.referred_by_name || 'Pathways'}
          {referral.referral_date ? ` · ${new Date(referral.referral_date + 'T00:00:00').toLocaleDateString()}` : ''}
          {referral.status === 'contacted' ? ' · Contacted' : ''}
        </p>
        {referral.notes && <p className="text-xs text-muted-foreground mt-1">{referral.notes}</p>}
      </div>
      <div className="flex items-center gap-2 shrink-0">
        {referral.status === 'new' && (
          <Button variant="outline" size="sm" disabled={busy} onClick={() => onUpdate(referral, 'contacted')}>
            Contacted
          </Button>
        )}
        <Button size="sm" disabled={busy} onClick={() => onUpdate(referral, 'completed')}>
          Complete
        </Button>
      </div>
    </div>
  );
}