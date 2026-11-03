import React, { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { AlertCircle, Database, Loader2, Unlink } from 'lucide-react';
import ClientPicker from '@/components/centralreg/ClientPicker';
import { matchReasons, fullName } from '@/lib/clientMatch';
import { cn } from '@/lib/utils';

const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// Central Database duplicate guard for registration and waitlist forms.
// Staff can search every client file, and simply typing a name surfaces the
// Central Database records that look like the same person, so the existing
// file gets linked instead of a duplicate being created. Linking sets
// linked_rc_client_id on the participant, which the central sync workflows
// update by id instead of auto-matching.
export default function CentralClientMatch({
  form = {},
  linkedId,
  linkedClient,
  onPick,
  onUnlink,
  firstKey = 'first_name',
  lastKey = 'last_name',
  className,
}) {
  const [suggestions, setSuggestions] = useState([]);
  const [searching, setSearching] = useState(false);
  const [showSearch, setShowSearch] = useState(false);

  const first = (form?.[firstKey] || '').trim();
  const last = (form?.[lastKey] || '').trim();
  const dob = form?.date_of_birth || form?.child_date_of_birth || '';

  useEffect(() => {
    if (linkedId) { setSuggestions([]); return; }
    if (first.length < 2 && last.length < 2) { setSuggestions([]); return; }
    let cancelled = false;
    const t = setTimeout(async () => {
      setSearching(true);
      try {
        const queries = [];
        if (first.length >= 2) queries.push(base44.entities.RCClient.filter({ first_name: { $regex: esc(first), $options: 'i' } }).catch(() => []));
        if (last.length >= 2) queries.push(base44.entities.RCClient.filter({ last_name: { $regex: esc(last), $options: 'i' } }).catch(() => []));
        const results = await Promise.all(queries);
        const map = new Map();
        results.forEach((res) => {
          const arr = Array.isArray(res) ? res : (res?.items || []);
          arr.forEach((c) => { if (c?.id) map.set(c.id, c); });
        });
        const typed = { first_name: first, last_name: last, email: form?.email, phone: form?.phone, date_of_birth: dob };
        const scored = Array.from(map.values())
          .map((c) => ({ c, ...matchReasons(c, typed) }))
          .filter((s) => s.reasons.length > 0 && s.sim >= 0.5)
          .sort((a, b) => (b.strength - a.strength) || (b.sim - a.sim))
          .slice(0, 4);
        if (!cancelled) setSuggestions(scored);
      } catch {
        if (!cancelled) setSuggestions([]);
      } finally {
        if (!cancelled) setSearching(false);
      }
    }, 450);
    return () => { cancelled = true; clearTimeout(t); };
  }, [first, last, form?.email, form?.phone, dob, linkedId]);

  return (
    <div className={cn('rounded-lg border border-border bg-muted/40 p-3 space-y-2', className)}>
      <p className="text-sm font-semibold text-foreground flex items-center gap-1.5">
        <Database className="h-4 w-4 text-violet-600" /> Candora Central Database
      </p>

      {linkedId ? (
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="text-sm text-foreground">
              Using existing client file: <span className="font-medium">{linkedClient ? fullName(linkedClient) : 'Loading…'}</span>
            </p>
            {linkedClient && (linkedClient.email || linkedClient.phone) && (
              <p className="text-xs text-muted-foreground truncate">{[linkedClient.email, linkedClient.phone].filter(Boolean).join(' · ')}</p>
            )}
          </div>
          <Button type="button" size="sm" variant="outline" onClick={onUnlink} className="shrink-0">
            <Unlink className="h-3.5 w-3.5" /> Unlink
          </Button>
        </div>
      ) : (
        <>
          <p className="text-xs text-muted-foreground">
            Type the name below and any matching client files appear here. Link the existing person so their Central Database file is updated instead of a duplicate being created.
          </p>

          {searching && (
            <p className="text-xs text-muted-foreground flex items-center gap-1.5">
              <Loader2 className="h-3 w-3 animate-spin" /> Checking the Central Database…
            </p>
          )}

          {!searching && suggestions.length > 0 && (
            <div className="rounded-md border border-warning/60 bg-warning/10 p-2 space-y-1.5">
              <p className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                <AlertCircle className="h-3.5 w-3.5 text-warning" />
                Possible existing records — check before creating a new profile
              </p>
              {suggestions.map(({ c, reasons }) => (
                <div key={c.id} className="flex items-center justify-between gap-3 text-sm">
                  <div className="min-w-0">
                    <p className="font-medium truncate">
                      {fullName(c)}
                      {reasons.some((r) => r.strong) && <span className="text-xs text-success font-normal"> (strong match)</span>}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">
                      {[c.email, c.phone, c.date_of_birth ? `DOB ${c.date_of_birth}` : ''].filter(Boolean).join(' · ')}
                    </p>
                  </div>
                  <Button type="button" size="sm" variant="outline" className="shrink-0" onClick={() => onPick?.(c)}>
                    Use this file
                  </Button>
                </div>
              ))}
            </div>
          )}

          <button
            type="button"
            onClick={() => setShowSearch((s) => !s)}
            className="text-xs font-medium text-violet-700 hover:underline"
          >
            {showSearch ? 'Hide client search' : 'Search all client files'}
          </button>
          {showSearch && <ClientPicker onSelect={(c) => onPick?.(c)} placeholder="Search existing clients by name..." />}
        </>
      )}
    </div>
  );
}