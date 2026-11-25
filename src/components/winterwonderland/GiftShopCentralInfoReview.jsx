import React from 'react';
import { Database, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { detailLabels } from '@/lib/giftShopCentralInfo';

// Shown when a list is missing details the Central Database already holds —
// typically a family listed with only a phone number or email and no name. Each
// family is decided on its own, and nothing is copied in without being confirmed.
export default function GiftShopCentralInfoReview({
  rows = [],
  matches = [],
  included = {},
  onToggle,
  onConfirm,
  onSkip,
  working = false,
}) {
  const chosen = matches.filter(match => included[String(match.index)]).length;

  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-blue-300 bg-blue-50/70 p-4 space-y-1">
        <p className="flex items-center gap-2 text-sm font-semibold text-blue-900">
          <Database className="h-4 w-4" />
          {matches.length === 1
            ? 'One family was found in the Central Database'
            : `${matches.length} families were found in the Central Database`}
        </p>
        <p className="text-xs text-blue-900/80">
          The list is missing some details these families already have on file. Tick the ones to add — anything
          already on the list is left exactly as it is.
        </p>
      </div>

      <div className="rounded-lg border divide-y max-h-[45vh] overflow-y-auto">
        {matches.map((match) => {
          const row = rows[match.index] || {};
          const known = [match.email, match.phone].filter(Boolean).join(' · ');
          const ticked = Boolean(included[String(match.index)]);
          return (
            <label
              key={match.index}
              className="flex items-start gap-3 p-3 cursor-pointer hover:bg-muted/30"
            >
              <Checkbox
                checked={ticked}
                onCheckedChange={() => onToggle(String(match.index))}
                className="mt-0.5"
              />
              <div className="min-w-0 flex-1 space-y-1">
                <p className="text-sm font-semibold truncate">
                  {row.guardian_name || 'No name on the list'}
                  {match.name && !row.guardian_name && (
                    <span className="font-normal text-muted-foreground"> → {match.name}</span>
                  )}
                </p>
                <p className="text-xs text-muted-foreground truncate">
                  {[row.guardian_email, row.guardian_phone].filter(Boolean).join(' · ') || 'No contact details'}
                  {known && <span className="text-muted-foreground"> · on file: {known}</span>}
                </p>
                <p className="flex flex-wrap items-center gap-1 text-xs text-blue-900">
                  <span>Matched on {match.matched_on.join(', ')}</span>
                  <ArrowRight className="h-3 w-3" />
                  <span className="font-medium">add {detailLabels(match.fill).join(', ')}</span>
                </p>
              </div>
            </label>
          );
        })}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs text-muted-foreground">
          {chosen} of {matches.length} selected
        </p>
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" size="sm" onClick={onSkip} disabled={working}>
            Leave the list as it is
          </Button>
          <Button onClick={onConfirm} disabled={working}>
            {working ? 'Working…' : 'Use these details'}
          </Button>
        </div>
      </div>
    </div>
  );
}