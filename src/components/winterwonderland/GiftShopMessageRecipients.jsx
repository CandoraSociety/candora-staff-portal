import React from 'react';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { cn } from '@/lib/utils';

// Each row on the tab is its own family — a guardian can hold more than one card
// — so rows are told apart by id, and a family without an email or phone cannot
// be reached at all.
export const familyRowId = (family) => family?.id || family?.family_key;

export function uniqueFamilies(families = []) {
  const seen = new Set();
  return families.filter(family => {
    const id = familyRowId(family);
    if (!id || seen.has(id)) return false;
    if (!family.guardian_email && !family.guardian_phone) return false;
    seen.add(id);
    return true;
  });
}

// Who a message goes to: every family, any number of status groups from the same
// tab, chosen individuals — or a mix of groups and individuals.
export function recipientsFor(families, selectedGroups = new Set(), selectedIds = new Set()) {
  const reachable = uniqueFamilies(families);
  // A cancelled family stays out of "All families" — it can still be reached by
  // picking its own category or choosing it by hand.
  if (selectedGroups.has('all')) return reachable.filter(f => !f.excluded_from_all);
  const chosen = selectedGroups.has('choose')
    ? reachable.filter(f => selectedIds.has(familyRowId(f)))
    : [];
  const inGroups = reachable.filter(f => selectedGroups.has(f.group));
  const merged = new Map([...inGroups, ...chosen].map(f => [familyRowId(f), f]));
  return Array.from(merged.values());
}

export default function GiftShopMessageRecipients({ families, groups = [], selectedGroups, onToggleGroup, selectedIds, onToggle }) {
  const reachable = uniqueFamilies(families);
  // When a tab holds families that "All families" skips, the chip says so.
  const hasExcluded = reachable.some(f => f.excluded_from_all);
  const options = [
    { value: 'all', label: hasExcluded ? 'All families (excluding cancelled)' : 'All families' },
    ...groups,
    { value: 'choose', label: 'Choose families' },
  ];

  return (
    <div className="space-y-2">
      <div className="space-y-1.5">
        <Label>Send to</Label>
        <div className="flex flex-wrap gap-1.5">
          {options.map(option => {
            const on = selectedGroups.has(option.value);
            const count = recipientsFor(families, new Set([option.value]), selectedIds).length;
            return (
              <button
                key={option.value}
                type="button"
                onClick={() => onToggleGroup(option.value)}
                className={cn(
                  'rounded-full border px-2.5 py-1 text-xs font-medium transition-colors',
                  on
                    ? 'border-primary bg-primary/15 text-accent'
                    : 'border-input text-muted-foreground hover:border-primary/50',
                )}
              >
                {option.label}
                {option.value === 'choose' ? '' : option.value === 'all' && hasExcluded ? ` · ${count}` : ` (${count})`}
              </button>
            );
          })}
        </div>
      </div>

      {selectedGroups.has('choose') && (
        <div className="max-h-52 overflow-y-auto rounded-md border divide-y">
          {reachable.length === 0 ? (
            <p className="p-3 text-sm text-muted-foreground">No family has an email or phone number yet.</p>
          ) : reachable.map(family => (
            <div
              key={familyRowId(family)}
              onClick={() => onToggle(familyRowId(family))}
              className="flex items-center gap-2 px-3 py-2 cursor-pointer hover:bg-muted/50"
            >
              <Checkbox checked={selectedIds.has(familyRowId(family))} />
              <span className="min-w-0">
                <span className="block text-sm truncate">{family.guardian_name}</span>
                <span className="block text-xs text-muted-foreground truncate">
                  {[family.guardian_email, family.guardian_phone].filter(Boolean).join(' · ')}
                </span>
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}