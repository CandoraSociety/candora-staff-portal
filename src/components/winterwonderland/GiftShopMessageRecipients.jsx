import React from 'react';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';

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

// Who a message goes to: every family, one group (a status from the same tab),
// or chosen individuals.
export function recipientsFor(families, group, selectedIds) {
  const reachable = uniqueFamilies(families);
  if (group === 'all') return reachable;
  if (group === 'choose') return reachable.filter(f => selectedIds.has(familyRowId(f)));
  return reachable.filter(f => f.group === group);
}

export default function GiftShopMessageRecipients({ families, groups = [], group, onGroupChange, selectedIds, onToggle }) {
  const reachable = uniqueFamilies(families);
  const options = [
    { value: 'all', label: 'All families' },
    ...groups,
    { value: 'choose', label: 'Choose families' },
  ];

  return (
    <div className="space-y-2">
      <div className="space-y-1.5">
        <Label>Send to</Label>
        <Select value={group} onValueChange={onGroupChange}>
          <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
          <SelectContent>
            {options.map(option => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}{option.value === 'choose' ? '' : ` (${recipientsFor(families, option.value, selectedIds).length})`}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {group === 'choose' && (
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