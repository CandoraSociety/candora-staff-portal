import React from 'react';
import { Users } from 'lucide-react';
import { Button } from '@/components/ui/button';

// Shown before a new family card is opened, when the name or contact details
// already belong to a family in the Kids Gift Shop. Each match is decided on its
// own: the same household (link to the card already on file) or a new one.
export default function GiftShopFamilyMatchReview({
  reviews = [],
  decisions = {},
  onDecide,
  onConfirm,
  onCancel,
  working = false,
  confirmLabel = 'Continue',
}) {
  const decided = reviews.filter(review => decisions[review.key]).length;
  const ready = reviews.length > 0 && decided === reviews.length;

  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-amber-300 bg-amber-50/70 p-4 space-y-1">
        <p className="flex items-center gap-2 text-sm font-semibold text-amber-900">
          <Users className="h-4 w-4" />
          {reviews.length === 1
            ? 'This family already appears in the Kids Gift Shop'
            : `${reviews.length} families already appear in the Kids Gift Shop`}
        </p>
        <p className="text-xs text-amber-900/80">
          Check each one before new family cards are created. Choose <span className="font-semibold">Same family</span> to
          link to the family already on file, or <span className="font-semibold">New family</span> if it is a different
          household.
        </p>
      </div>

      <div className="rounded-lg border divide-y max-h-[45vh] overflow-y-auto">
        {reviews.map(review => {
          const decision = decisions[review.key];
          const contact = [review.family.guardian_email, review.family.guardian_phone].filter(Boolean).join(' · ');
          return (
            <div key={review.key} className="p-3 space-y-2">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-sm font-semibold truncate">{review.family.guardian_name}</p>
                  <p className="text-xs text-muted-foreground truncate">{contact || 'No contact details'}</p>
                </div>
                <div className="flex gap-2 flex-shrink-0">
                  <Button
                    size="sm"
                    variant={decision === 'existing' ? 'default' : 'outline'}
                    onClick={() => onDecide(review.key, 'existing')}
                  >
                    Same family
                  </Button>
                  <Button
                    size="sm"
                    variant={decision === 'new' ? 'default' : 'outline'}
                    onClick={() => onDecide(review.key, 'new')}
                  >
                    New family
                  </Button>
                </div>
              </div>

              <div className="space-y-1">
                {review.matches.map(match => (
                  <div key={match.id} className="rounded-md border bg-muted/30 px-2.5 py-2">
                    <p className="text-xs font-medium">
                      {match.guardian_name}
                      <span className="font-normal text-muted-foreground">
                        {' · '}{match.source}{match.detail ? ` · ${match.detail}` : ''}
                      </span>
                    </p>
                    <p className="text-xs text-muted-foreground truncate">
                      {[match.guardian_email, match.guardian_phone].filter(Boolean).join(' · ')}
                    </p>
                    <p className="text-[11px] text-amber-800">Matches on {match.reasons.join(', ')}</p>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs text-muted-foreground">{decided} of {reviews.length} reviewed</p>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => reviews.forEach(review => !decisions[review.key] && onDecide(review.key, 'new'))}
            disabled={working || ready}
          >
            Mark the rest as new
          </Button>
          <Button variant="outline" onClick={onCancel} disabled={working}>Back</Button>
          <Button onClick={onConfirm} disabled={working || !ready}>
            {working ? 'Working…' : confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}