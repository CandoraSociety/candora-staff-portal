import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Sparkles, X, ListChecks, Scale, Wand2, Check } from 'lucide-react';

// Gold banner on the main Dashboard showing the Executive Director's scheduled
// briefings. Each briefing carries interactive items built from real records:
// a tappable checklist, decision cards with action buttons, and assistant
// offers — actions are executed by the handleEdBriefingAction function.

function BriefingSection({ icon: Icon, label, children }) {
  return (
    <div className="pt-2 border-t border-border/60">
      <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2 mt-2">
        <Icon className="h-3.5 w-3.5" /> {label}
      </div>
      {children}
    </div>
  );
}

export default function EdBriefingAlerts({ user }) {
  const qc = useQueryClient();
  const [busy, setBusy] = useState('');
  const [notes, setNotes] = useState({});
  const [error, setError] = useState('');

  const { data: notifications = [] } = useQuery({
    queryKey: ['edBriefingNotifications', user?.email],
    queryFn: () => base44.entities.DashboardNotification.filter({ recipient_email: user?.email }, '-created_date', 20),
    enabled: !!user?.email,
  });

  const mine = notifications.filter(n =>
    !n.is_read &&
    n.kind === 'ed_briefing' &&
    (n.recipient_email || '').toLowerCase() === (user?.email || '').toLowerCase()
  ).slice(0, 3);

  if (!mine.length) return null;

  const dismiss = async (n) => {
    await base44.entities.DashboardNotification.update(n.id, { is_read: true });
    qc.invalidateQueries({ queryKey: ['edBriefingNotifications'] });
  };

  const act = async (notif, item, action) => {
    const key = `${notif.id}:${item.id}`;
    setBusy(key);
    setError('');
    try {
      const res = await base44.functions.invoke('handleEdBriefingAction', {
        notification_id: notif.id,
        item_id: item.id,
        action,
        note: notes[item.id] || '',
      });
      const data = res?.data || res;
      if (data?.error) setError(data.error);
      qc.invalidateQueries({ queryKey: ['edBriefingNotifications'] });
    } catch {
      setError('That action failed — try again.');
    } finally {
      setBusy('');
    }
  };

  const renderItems = (notif) => {
    const items = notif.items || [];
    const checklist = items.filter(i => i.kind === 'checklist');
    const decisions = items.filter(i => i.kind === 'decision');
    const offers = items.filter(i => i.kind === 'offer');
    if (!checklist.length && !decisions.length && !offers.length) return null;

    return (
      <div className="mt-3 space-y-1">
        {checklist.length > 0 && (
          <BriefingSection icon={ListChecks} label="Checklist — checking an item completes it">
            {checklist.map(item => (
              <div key={item.id} className="flex items-start gap-2 py-1">
                <button
                  disabled={item.status === 'done' || busy === `${notif.id}:${item.id}`}
                  onClick={() => act(notif, item, item.action)}
                  className="mt-0.5 h-5 w-5 shrink-0 rounded-md border-2 flex items-center justify-center transition-colors disabled:cursor-default"
                  style={item.status === 'done'
                    ? { background: 'hsl(var(--success))', borderColor: 'hsl(var(--success))' }
                    : { borderColor: 'hsl(var(--border))' }}
                  aria-label="Mark complete"
                >
                  {item.status === 'done' && <Check className="h-3.5 w-3.5 text-white" />}
                </button>
                <span className={`text-sm ${item.status === 'done' ? 'line-through text-muted-foreground' : ''}`}>{item.text}</span>
              </div>
            ))}
          </BriefingSection>
        )}

        {decisions.length > 0 && (
          <BriefingSection icon={Scale} label="Needs your decision">
            {decisions.map(item => (
              <div key={item.id} className="rounded-lg border bg-secondary/40 p-3 mb-2">
                <p className="text-sm font-medium">{item.text}</p>
                {item.context && <p className="text-xs text-muted-foreground mt-0.5">{item.context}</p>}
                {item.status === 'done' ? (
                  <p className="text-xs font-semibold mt-2" style={{ color: 'hsl(var(--success))' }}>
                    {item.action_taken === 'reject_purchase' ? 'Rejected' : 'Done'} — {item.result || 'record updated'}
                  </p>
                ) : (
                  <>
                    <input
                      value={notes[item.id] || ''}
                      onChange={e => setNotes(prev => ({ ...prev, [item.id]: e.target.value }))}
                      placeholder="Optional note (used as rejection reason)"
                      className="mt-2 w-full rounded-md border border-input bg-card px-2 py-1.5 text-xs"
                    />
                    <div className="flex flex-wrap items-center gap-2 mt-2">
                      {(item.actions || []).map(a => (
                        <Button
                          key={a.key}
                          size="sm"
                          variant={a.label.toLowerCase().includes('reject') ? 'destructive' : 'default'}
                          disabled={busy === `${notif.id}:${item.id}`}
                          onClick={() => act(notif, item, a.key)}
                        >
                          {busy === `${notif.id}:${item.id}` ? 'Saving...' : a.label}
                        </Button>
                      ))}
                      {item.link && (
                        <Button size="sm" variant="outline" asChild>
                          <Link to={item.link}>Open in portal</Link>
                        </Button>
                      )}
                    </div>
                  </>
                )}
              </div>
            ))}
          </BriefingSection>
        )}

        {offers.length > 0 && (
          <BriefingSection icon={Wand2} label="I can do this for you">
            {offers.map(item => (
              <div key={item.id} className="rounded-lg border bg-card p-3 mb-2">
                <p className="text-sm font-medium">{item.text}</p>
                {item.status === 'done' ? (
                  <p className="text-xs whitespace-pre-line mt-2" style={{ color: 'hsl(var(--success))' }}>
                    {item.result || 'Completed.'}
                  </p>
                ) : (
                  <Button
                    size="sm"
                    className="mt-2"
                    disabled={busy === `${notif.id}:${item.id}`}
                    onClick={() => act(notif, item, 'run_offer')}
                  >
                    {busy === `${notif.id}:${item.id}` ? 'Working on it...' : 'Do it'}
                  </Button>
                )}
              </div>
            ))}
          </BriefingSection>
        )}
      </div>
    );
  };

  return (
    <div className="rounded-2xl border-2 border-primary bg-primary/10 p-4 space-y-3">
      <div className="flex items-center gap-2">
        <Sparkles className="h-5 w-5 text-primary" />
        <h2 className="font-bold text-primary">
          {mine.length > 1 ? `${mine.length} briefings from your assistant` : 'Briefing from your assistant'}
        </h2>
      </div>
      {error && <p className="text-xs text-destructive">{error}</p>}

      {mine.map(n => (
        <div key={n.id} className="rounded-xl border bg-card p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="font-semibold">{n.title}</p>
              <p className="text-sm text-muted-foreground whitespace-pre-line mt-1">{n.message}</p>
            </div>
            <Button size="sm" variant="ghost" className="text-muted-foreground shrink-0" onClick={() => dismiss(n)}>
              <X className="h-4 w-4" />
            </Button>
          </div>
          {renderItems(n)}
          {n.link && (
            <Button size="sm" variant="outline" asChild className="mt-3">
              <Link to={n.link}>Open ED Portal</Link>
            </Button>
          )}
        </div>
      ))}
    </div>
  );
}