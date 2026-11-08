import React from 'react';
import { Button } from '@/components/ui/button';
import { ClipboardCheck, Pencil, UserPlus, Wifi, WifiOff, X } from 'lucide-react';

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

const statusLabel = (prompt) => {
  if (!prompt) return 'Nothing on screen';
  if (prompt.status === 'sent') return 'Sent — tablet has not shown it yet';
  if (prompt.status === 'opened') return 'Sign-in open on the tablet';
  if (prompt.status === 'submitted') return 'Someone signed in';
  return 'Cleared';
};

// One wall-mounted classroom tablet: send the sign-in form to it, and check
// what people typed before it becomes a client file.
export default function ProgramTabletCard({ station, prompt, onSend, onEdit, onClear, onVerify }) {
  const active = prompt && ['sent', 'opened'].includes(prompt.status);

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
          <ClipboardCheck className="h-4 w-4" /> Send sign-in form
        </Button>
      )}

      <div className="rounded-lg border border-border/70 p-3 space-y-2">
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Sign-in</span>
          <span className="text-xs text-muted-foreground">{statusLabel(prompt)}</span>
        </div>

        {!prompt && <p className="text-sm text-muted-foreground">The tablet is showing the welcome screen.</p>}

        {active && (
          <div className="space-y-2">
            <p className="font-medium">{prompt.title}</p>
            {prompt.course_name && <p className="text-sm text-muted-foreground">{prompt.course_name}</p>}
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-warning animate-pulse" />
              <span className="text-sm text-muted-foreground">Waiting for someone to sign in</span>
              <Button variant="ghost" size="sm" className="ml-auto text-muted-foreground" onClick={() => onClear(prompt)}>
                <X className="h-3.5 w-3.5 mr-1" /> Stop
              </Button>
            </div>
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