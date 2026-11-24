import React from 'react';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';

// Who a message goes to: every family, one group (an invitation status), or
// chosen individuals.
export function recipientsFor(families, group, selectedIds) {
  const reachable = families.filter(f => f.guardian_email || f.guardian_phone);
  if (group === 'all') return reachable;
  if (group === 'choose') return reachable.filter(f => selectedIds.has(f.family_key));
  return reachable.filter(f => f.group === group);
}

export default function GiftShopMessageRecipients({ families, groups = [], group, onGroupChange, selectedIds, onToggle }) {
  const reachable = families.filter(f => f.guardian_email || f.guardian_phone);
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
            <label key={family.family_key} className="flex items-center gap-2 px-3 py-2 cursor-pointer hover:bg-muted/50">
              <Checkbox checked={selectedIds.has(family.family_key)} onCheckedChange={() => onToggle(family.family_key)} />
              <span className="min-w-0">
                <span className="block text-sm truncate">{family.guardian_name}</span>
                <span className="block text-xs text-muted-foreground truncate">
                  {[family.guardian_email, family.guardian_phone].filter(Boolean).join(' · ')}
                </span>
              </span>
            </label>
          ))}
        </div>
      )}
    </div>
  );
}