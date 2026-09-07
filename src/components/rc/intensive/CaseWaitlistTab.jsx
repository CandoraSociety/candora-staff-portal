import React, { useState } from 'react';
import { CalendarClock, Hourglass, PlayCircle, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { today } from './caseConstants';

const PRIORITY_OPTIONS = [
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
];

const daysWaiting = (d) => {
  if (!d) return null;
  const diff = Math.floor((new Date(today()) - new Date(d)) / 86400000);
  return isNaN(diff) ? null : Math.max(0, diff);
};

// Intensive Services waitlist — clients waiting for capacity to begin service.
// Waitlist data (date added, time waiting, priority) is reportable for FRN.
export default function CaseWaitlistTab({ cases = [], clients = [], selectedClientId, canAddToWaitlist, onAddToWaitlist, onUpdate, onOpenClient }) {
  const [noteDrafts, setNoteDrafts] = useState({});

  const waitlisted = cases
    .filter(c => c.case_status === 'waitlisted')
    .sort((a, b) => (a.waitlist_date || '').localeCompare(b.waitlist_date || '9999'));

  const nameOf = (c) => {
    if (c.client_name) return c.client_name;
    const cl = clients.find(x => x.id === c.client_id);
    return cl ? `${cl.first_name} ${cl.last_name}` : 'Unknown client';
  };

  const noteValue = (c) => (c.id in noteDrafts ? noteDrafts[c.id] : c.waitlist_notes || '');
  const saveNote = (c) => {
    if (c.id in noteDrafts) {
      onUpdate(c.id, { waitlist_notes: noteDrafts[c.id] });
      setNoteDrafts(prev => { const n = { ...prev }; delete n[c.id]; return n; });
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="text-base">Intensive Services Waitlist ({waitlisted.length})</CardTitle>
          <CardDescription className="text-xs">Clients waiting for capacity to begin intensive family support — sorted by date added.</CardDescription>
        </div>
        {canAddToWaitlist && (
          <Button size="sm" onClick={onAddToWaitlist}><Hourglass className="h-4 w-4" /> Add Selected Client to Waitlist</Button>
        )}
      </CardHeader>
      <CardContent>
        {waitlisted.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">No clients on the waitlist.</p>
        ) : (
          <div className="space-y-2">
            {waitlisted.map(c => {
              const days = daysWaiting(c.waitlist_date);
              const isCurrent = c.client_id === selectedClientId;
              return (
                <div key={c.id} className={`p-3 rounded-md border ${isCurrent ? 'border-primary/50 bg-primary/5' : 'border-border/50'}`}>
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex flex-wrap items-center gap-2 min-w-0">
                      <button className="text-sm font-medium text-foreground hover:text-primary hover:underline truncate" onClick={() => onOpenClient(c.client_id)}>
                        {nameOf(c)}
                      </button>
                      {isCurrent && <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-primary/10 text-primary">Selected</span>}
                      {c.waitlist_date && (
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          <CalendarClock className="h-3 w-3" /> Added {c.waitlist_date}
                        </span>
                      )}
                      {days !== null && (
                        <span className={`text-[11px] font-medium px-1.5 py-0.5 rounded ${days > 60 ? 'bg-red-100 text-red-700' : days > 30 ? 'bg-amber-100 text-amber-700' : 'bg-muted text-muted-foreground'}`}>
                          {days} day{days === 1 ? '' : 's'} waiting
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Select value={c.waitlist_priority || 'medium'} onValueChange={(v) => onUpdate(c.id, { waitlist_priority: v })}>
                        <SelectTrigger className="h-7 w-28 text-xs"><SelectValue /></SelectTrigger>
                        <SelectContent>{PRIORITY_OPTIONS.map(p => <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>)}</SelectContent>
                      </Select>
                      <Button size="sm" onClick={() => onUpdate(c.id, { case_status: 'active', service_start_date: today(), waitlist_removed_date: today() })}>
                        <PlayCircle className="h-4 w-4" /> Start Service
                      </Button>
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive" title="Remove from waitlist (not starting service)"
                        onClick={() => onUpdate(c.id, { case_status: 'closed', waitlist_removed_date: today() })}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                  <Textarea rows={2} className="mt-2" value={noteValue(c)}
                    onChange={(e) => setNoteDrafts(prev => ({ ...prev, [c.id]: e.target.value }))}
                    onBlur={() => saveNote(c)}
                    placeholder="Waitlist reason / context..." />
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}