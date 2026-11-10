import React from 'react';
import { Button } from '@/components/ui/button';
import { ClipboardCheck, Palette, Pencil, UserPlus, Wifi, WifiOff, X } from 'lucide-react';
import { programLabel } from '@/lib/kioskPrograms';

const isOnline = (station) => {
  if (!station.last_seen) return false;
  return Date.now() - new Date(station.last_seen).getTime() < 120000;
};

const timeAgo = (value) => {
  if (!value) return 'never';
  const seconds = Math.round((Date.now() - new Date(value).getTime()) / 1000);
  if (seconds < 60) return 'just now';
  if (seconds < 3600) return `${Math.round(seconds / 60)} min ago`;
  return `${Math.round(seconds / 3600)} h ago`;
};

const clock = (value) => {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
};

const statusLabel = (prompt) => {
  if (!prompt) return 'Nothing on screen';
  if (prompt.status === 'sent') return 'Sent — tablet has not shown it yet';
  if (prompt.status === 'opened') return 'Open on the tablet';
  if (prompt.status === 'submitted') return 'Someone signed in';
  return 'Cleared';
};

// One wall-mounted classroom tablet: it opens its own check-in from the room's
// schedule, and staff can also send a form by hand.
export default function RoomTabletCard({ station, prompt, onSend, onEdit, onClear, onVerify, onScreen }) {
  const active = prompt && ['sent', 'opened'].includes(prompt.status);
  const checkins = prompt?.checkins || [];

  return (
    <div className="rounded-xl border bg-card p-5 space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold truncate">{station.name}</h3>
            {isOnline(station) ? (
              <span className="flex items-center gap-1 text-xs font-medium text-success"><Wifi className="h-3.5 w-3.5" /> Connected</span>
            ) : (
              <span className="flex items-center gap-1 text-xs font-medium text-muted-foreground"><WifiOff className="h-3.5 w-3.5" /> Not connected</span>
            )}
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            {station.location || 'No location set'} · checked in {timeAgo(station.last_seen)}
          </p>
        </div>
        <Button variant="ghost" size="icon" onClick={() => onEdit(station)} aria-label="Edit tablet">
          <Pencil className="h-4 w-4" />
        </Button>
      </div>

      {!active && (
        <Button variant="outline" className="w-full justify-start" onClick={() => onSend(station)}>
          <ClipboardCheck className="h-4 w-4" /> Send a sign-in form
        </Button>
      )}

      <Button variant="outline" className="w-full justify-start" onClick={() => onScreen(station)}>
        <Palette className="h-4 w-4" /> Welcome screen
      </Button>

      <div className="rounded-lg border border-border/70 p-3 space-y-2">
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Check-in</span>
          <span className="text-xs text-muted-foreground">{statusLabel(prompt)}</span>
        </div>

        {!prompt && <p className="text-sm text-muted-foreground">The tablet is showing the welcome screen.</p>}

        {active && (
          <div className="space-y-2">
            <p className="font-medium">{prompt.course_name || prompt.title}</p>
            <p className="text-sm text-muted-foreground">
              {programLabel(prompt.program)}
              {prompt.session_id ? ' · opened from this room’s schedule' : ''}
            </p>

            {checkins.length > 0 ? (
              <div className="rounded-md bg-muted/60 p-2 space-y-1">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  {checkins.length} checked in
                </p>
                {checkins.map((row, index) => (
                  <p key={`${row.name}-${index}`} className="text-sm flex items-center gap-1">
                    <span className="font-medium">{row.name}</span>
                    {row.walk_in && <span className="text-xs text-warning">not on the list</span>}
                    {row.at && <span className="ml-auto text-xs text-muted-foreground">{clock(row.at)}</span>}
                  </p>
                ))}
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-warning animate-pulse" />
                <span className="text-sm text-muted-foreground">Waiting for people to check in</span>
              </div>
            )}

            <Button variant="ghost" size="sm" className="text-muted-foreground" onClick={() => onClear(prompt)}>
              <X className="h-3.5 w-3.5 mr-1" /> Stop
            </Button>
          </div>
        )}

        {prompt && prompt.status === 'submitted' && (
          <div className="space-y-2">
            <div>
              <p className="font-semibold">{prompt.response_name || 'Someone'}</p>
              <p className="text-sm text-muted-foreground">
                {[prompt.course_name, prompt.response_phone, prompt.response_email].filter(Boolean).join(' · ')}
              </p>
              {prompt.response_notes && <p className="text-sm text-muted-foreground mt-1">{prompt.response_notes}</p>}
            </div>
            {prompt.rc_client_id ? (
              <div className="flex items-center gap-2">
                <a href={`/rc/clients/${prompt.rc_client_id}`} className="text-sm underline font-medium">Open client file</a>
                <Button variant="ghost" size="sm" className="ml-auto text-muted-foreground" onClick={() => onClear(prompt)}>Done</Button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Button size="sm" onClick={() => onVerify(prompt)}>
                  <UserPlus className="h-3.5 w-3.5 mr-1" /> Review & add client
                </Button>
                <Button variant="ghost" size="sm" className="ml-auto text-muted-foreground" onClick={() => onClear(prompt)}>Discard</Button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}