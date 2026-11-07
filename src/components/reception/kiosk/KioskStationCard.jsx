import React from 'react';
import { Button } from '@/components/ui/button';
import { Heart, ShoppingBag, ClipboardCheck, Pencil, Wifi, WifiOff, X, Gift } from 'lucide-react';

const KIND_LABEL = {
  donation: 'Donation',
  purchase: 'Order',
  self_registration: 'Client info',
};

const statusLabel = (prompt) => {
  if (!prompt) return 'Nothing on screen';
  if (prompt.status === 'sent') return 'Sent — tablet has not shown it yet';
  if (prompt.status === 'opened') return 'Showing on the tablet now';
  if (prompt.status === 'submitted') return 'Customer finished';
  return 'Cleared';
};

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

function ResponseSummary({ prompt }) {
  if (prompt.kind === 'donation' && prompt.response_amount) {
    return (
      <div className="space-y-1">
        <p className="text-2xl font-bold">${Number(prompt.response_amount).toFixed(2)}</p>
        <p className="text-sm text-muted-foreground">
          {prompt.response_name || 'Anonymous donor'}
          {prompt.response_email ? ` · ${prompt.response_email}` : ''}
        </p>
      </div>
    );
  }
  if (prompt.kind === 'purchase') {
    return (
      <div className="space-y-1">
        <p className="text-2xl font-bold">${Number(prompt.response_total || 0).toFixed(2)}</p>
        <ul className="text-sm text-muted-foreground space-y-0.5">
          {(prompt.response_items || []).map((line) => (
            <li key={line.name}>{line.quantity} × {line.name}</li>
          ))}
        </ul>
        {prompt.response_name && <p className="text-sm text-muted-foreground">For {prompt.response_name}</p>}
      </div>
    );
  }
  if (prompt.kind === 'self_registration') {
    return (
      <div className="space-y-2">
        <p className="text-sm">
          <span className="font-medium">{prompt.response_name || 'Someone'}</span> submitted their details
          {prompt.response_phone ? ` · ${prompt.response_phone}` : ''}
          {prompt.response_email && !prompt.response_phone ? ` · ${prompt.response_email}` : ''}
        </p>
        {prompt.rc_client_id ? (
          <a href={`/rc/clients/${prompt.rc_client_id}`} className="text-sm underline font-medium">
            Open client file
          </a>
        ) : (
          <p className="text-sm text-muted-foreground">Waiting for reception to verify and add them to the Central Database.</p>
        )}
      </div>
    );
  }
  return <p className="text-sm text-muted-foreground">Message acknowledged.</p>;
}

export default function KioskStationCard({ station, prompt, onSend, onEdit, onClear, onRecordGift, onVerifyClient }) {
  const online = isOnline(station);
  const active = prompt && ['sent', 'opened'].includes(prompt.status);

  return (
    <div className="rounded-xl border bg-card p-5 space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold truncate">{station.name}</h3>
            {online ? (
              <span className="flex items-center gap-1 text-xs font-medium text-success"><Wifi className="h-3.5 w-3.5" /> Connected</span>
            ) : (
              <span className="flex items-center gap-1 text-xs font-medium text-muted-foreground"><WifiOff className="h-3.5 w-3.5" /> Not connected</span>
            )}
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            {station.location || 'No location set'} · checked in {timeAgo(station.last_seen)}
          </p>
        </div>
        <Button variant="ghost" size="icon" onClick={() => onEdit(station)} aria-label="Edit station">
          <Pencil className="h-4 w-4" />
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <Button variant="outline" className="justify-start" onClick={() => onSend(station, 'donation')}>
          <Heart className="h-4 w-4" /> Donation
        </Button>
        <Button variant="outline" className="justify-start" onClick={() => onSend(station, 'purchase')}>
          <ShoppingBag className="h-4 w-4" /> Order
        </Button>
        <Button variant="outline" className="justify-start col-span-2" onClick={() => onSend(station, 'self_registration')}>
          <ClipboardCheck className="h-4 w-4" /> Client Info
        </Button>
      </div>

      <div className="rounded-lg border border-border/70 p-3 space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            {KIND_LABEL[prompt?.kind] || 'Tablet'}
          </span>
          <span className="text-xs text-muted-foreground">{statusLabel(prompt)}</span>
        </div>

        {!prompt && <p className="text-sm text-muted-foreground">The tablet is showing the welcome screen.</p>}

        {prompt && active && (
          <div className="space-y-2">
            <p className="font-medium">{prompt.title}</p>
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-warning animate-pulse" />
              <span className="text-sm text-muted-foreground">Waiting for the customer</span>
              <Button variant="ghost" size="sm" className="ml-auto text-muted-foreground" onClick={() => onClear(prompt)}>
                <X className="h-3.5 w-3.5 mr-1" /> Cancel
              </Button>
            </div>
          </div>
        )}

        {prompt && prompt.status === 'submitted' && (
          <div className="space-y-3">
            <ResponseSummary prompt={prompt} />
            <div className="flex items-center gap-2">
              {prompt.kind === 'donation' && (
                <Button size="sm" onClick={() => onRecordGift(prompt)}>
                  <Gift className="h-3.5 w-3.5 mr-1" /> Record gift
                </Button>
              )}
              {prompt.kind === 'self_registration' && !prompt.rc_client_id && (
                <Button size="sm" onClick={() => onVerifyClient(prompt)}>
                  <ClipboardCheck className="h-3.5 w-3.5 mr-1" /> Verify & add client
                </Button>
              )}
              <Button variant="ghost" size="sm" className="ml-auto text-muted-foreground" onClick={() => onClear(prompt)}>
                Done
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}