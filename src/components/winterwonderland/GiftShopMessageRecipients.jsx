import React from 'react';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { inviteDisplayStatus, INVITE_STATUS_META } from '@/lib/giftShopInvites';

// Who a message goes to: every family, one status, or chosen individuals.
export const MESSAGE_GROUPS = [
  { value: 'all', label: 'All families' },
  { value: 'invited', label: INVITE_STATUS_META.invited.label },
  { value: 'registered', label: INVITE_STATUS_META.registered.label },
  { value: 'expired', label: INVITE_STATUS_META.expired.label },
  { value: 'revoked', label: INVITE_STATUS_META.revoked.label },
  { value: 'choose', label: 'Choose families' },
];

export function recipientsFor(invites, group, selectedIds) {
  const reachable = invites.filter(i => i.guardian_email || i.guardian_phone);
  if (group === 'all') return reachable;
  if (group === 'choose') return reachable.filter(i => selectedIds.has(i.id));
  return reachable.filter(i => inviteDisplayStatus(i) === group);
}

export default function GiftShopMessageRecipients({ invites, group, onGroupChange, selectedIds, onToggle }) {
  const reachable = invites.filter(i => i.guardian_email || i.guardian_phone);

  return (
    <div className="space-y-2">
      <div className="space-y-1.5">
        <Label>Send to</Label>
        <Select value={group} onValueChange={onGroupChange}>
          <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
          <SelectContent>
            {MESSAGE_GROUPS.map(option => {
              const count = recipientsFor(invites, option.value, selectedIds).length;
              const showCount = option.value !== 'choose';
              return (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}{showCount ? ` (${count})` : ''}
                </SelectItem>
              );
            })}
          </SelectContent>
        </Select>
      </div>

      {group === 'choose' && (
        <div className="max-h-52 overflow-y-auto rounded-md border divide-y">
          {reachable.length === 0 ? (
            <p className="p-3 text-sm text-muted-foreground">No family has an email or phone number yet.</p>
          ) : reachable.map(invite => (
            <label key={invite.id} className="flex items-center gap-2 px-3 py-2 cursor-pointer hover:bg-muted/50">
              <Checkbox checked={selectedIds.has(invite.id)} onCheckedChange={() => onToggle(invite.id)} />
              <span className="min-w-0">
                <span className="block text-sm truncate">{invite.guardian_name}</span>
                <span className="block text-xs text-muted-foreground truncate">
                  {[invite.guardian_email, invite.guardian_phone].filter(Boolean).join(' · ')}
                </span>
              </span>
            </label>
          ))}
        </div>
      )}
    </div>
  );
}