import React, { useEffect, useMemo, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/use-toast';
import { cn } from '@/lib/utils';
import { ChevronDown, ChevronLeft, ChevronRight, Loader2, Paperclip } from 'lucide-react';

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const STATUS_META = {
  pending: { label: 'Scheduled', className: 'bg-amber-100 text-amber-800' },
  sending: { label: 'Sending', className: 'bg-blue-100 text-blue-800' },
  sent: { label: 'Sent', className: 'bg-green-100 text-green-800' },
  failed: { label: 'Failed', className: 'bg-red-100 text-red-800' },
  cancelled: { label: 'Cancelled', className: 'bg-muted text-muted-foreground' },
};

const dayKey = (value) => {
  const date = new Date(value);
  return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
};

const whenLabel = (value) => new Date(value).toLocaleString(undefined, {
  month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit',
});

const timeLabel = (value) => new Date(value).toLocaleTimeString(undefined, {
  hour: 'numeric', minute: '2-digit',
});

// Six weeks of days around the month being shown, so the calendar always keeps
// the same shape while the month changes.
function monthDays(cursor) {
  const first = new Date(cursor.getFullYear(), cursor.getMonth(), 1);
  const start = new Date(first);
  start.setDate(first.getDate() - first.getDay());
  return Array.from({ length: 42 }, (_, index) => {
    const day = new Date(start);
    day.setDate(start.getDate() + index);
    return day;
  });
}

// The Scheduled messages tab: a month calendar with each message sitting in its
// day, and a collapsible list of everything scheduled underneath. Picking a day
// narrows the list to that day.
export default function GiftShopScheduledMessagesTab({ reloadKey = 0 }) {
  const { toast } = useToast();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cursor, setCursor] = useState(() => new Date());
  const [dayFilter, setDayFilter] = useState(null);
  const [listOpen, setListOpen] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const page = await base44.entities.GiftShopScheduledMessage.list({ sort: 'send_at', limit: 200 });
      setItems(page.items || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [reloadKey]);

  const byDay = useMemo(() => items.reduce((acc, item) => {
    const key = dayKey(item.send_at);
    (acc[key] = acc[key] || []).push(item);
    return acc;
  }, {}), [items]);

  const visible = useMemo(
    () => (dayFilter ? items.filter(item => dayKey(item.send_at) === dayFilter) : items),
    [items, dayFilter],
  );

  const cancel = async (item) => {
    try {
      await base44.entities.GiftShopScheduledMessage.update(item.id, { status: 'cancelled' });
      toast({ title: 'Message cancelled' });
      load();
    } catch (err) {
      toast({ title: 'That message could not be cancelled', description: err.message, variant: 'destructive' });
    }
  };

  const today = dayKey(new Date());
  const days = useMemo(() => monthDays(cursor), [cursor]);

  return (
    <div className="space-y-3">
      <div className="overflow-hidden rounded-lg border">
        <div className="flex items-center justify-between border-b bg-muted/40 px-2 py-1.5">
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() - 1, 1))}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <div className="flex items-center gap-2">
            <p className="text-sm font-semibold">
              {cursor.toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}
            </p>
            <Button
              variant="outline"
              size="sm"
              className="h-7 px-2 text-xs"
              onClick={() => { setCursor(new Date()); setDayFilter(null); }}
            >
              Today
            </Button>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1))}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        <div className="grid grid-cols-7 border-b bg-muted/20 text-center text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
          {WEEKDAYS.map(day => <div key={day} className="py-1.5">{day}</div>)}
        </div>

        <div className="grid grid-cols-7 gap-px bg-border">
          {days.map(day => {
            const key = dayKey(day);
            const dayItems = byDay[key] || [];
            const inMonth = day.getMonth() === cursor.getMonth();
            const active = dayFilter === key;
            return (
              <div
                key={key}
                className={cn(
                  'min-h-[92px] p-1',
                  inMonth ? 'bg-background' : 'bg-muted/30',
                  active && 'bg-primary/5 ring-1 ring-inset ring-primary',
                )}
              >
                <button
                  type="button"
                  onClick={() => setDayFilter(active ? null : key)}
                  className="mb-0.5 flex w-full items-center justify-between rounded px-0.5 hover:bg-muted/60"
                >
                  <span
                    className={cn(
                      'flex h-5 w-5 items-center justify-center rounded-full text-xs',
                      key === today && 'bg-primary font-semibold text-primary-foreground',
                      key !== today && !inMonth && 'text-muted-foreground/60',
                    )}
                  >
                    {day.getDate()}
                  </span>
                  {dayItems.length > 0 && (
                    <span className="pr-0.5 text-[10px] text-muted-foreground">{dayItems.length}</span>
                  )}
                </button>

                <div className="space-y-0.5">
                  {dayItems.slice(0, 2).map(item => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setDayFilter(key)}
                      className={cn(
                        'block w-full truncate rounded px-1 py-0.5 text-left text-[10px] leading-tight',
                        item.status === 'pending' ? 'bg-amber-100 text-amber-900'
                          : item.status === 'sent' ? 'bg-green-100 text-green-900'
                            : item.status === 'failed' ? 'bg-red-100 text-red-900'
                              : 'bg-muted text-muted-foreground',
                      )}
                      title={`${timeLabel(item.send_at)} · ${item.subject}`}
                    >
                      {timeLabel(item.send_at)} · {item.subject}
                    </button>
                  ))}
                  {dayItems.length > 2 && (
                    <p className="px-1 text-[10px] text-muted-foreground">+{dayItems.length - 2} more</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <button
        type="button"
        onClick={() => setListOpen(open => !open)}
        className="flex w-full items-center justify-between rounded-md border px-3 py-2 text-sm font-medium hover:bg-muted/50"
      >
        <span>All scheduled messages ({visible.length})</span>
        <ChevronDown className={cn('h-4 w-4 transition-transform', listOpen && 'rotate-180')} />
      </button>

      {listOpen && (
        <div className="max-h-72 overflow-y-auto rounded-md border divide-y">
          {loading ? (
            <p className="flex items-center gap-2 p-3 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" /> Loading…
            </p>
          ) : visible.length === 0 ? (
            <p className="p-3 text-sm text-muted-foreground">
              {dayFilter ? 'Nothing scheduled for that day.' : 'Nothing scheduled yet — write a message and choose a later time.'}
            </p>
          ) : visible.map(item => {
            const meta = STATUS_META[item.status] || STATUS_META.pending;
            const names = (item.recipients || [])
              .map(row => row.guardian_name || row.family_key)
              .filter(Boolean)
              .join(', ');
            return (
              <div key={item.id} className="px-3 py-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{item.subject}</p>
                    <p className="text-xs text-muted-foreground">
                      {whenLabel(item.send_at)} · {item.recipient_count || (item.recipients || []).length} families
                    </p>
                    {names && <p className="truncate text-xs text-muted-foreground">{names}</p>}
                    {item.include_checkin_code && (
                      <p className="text-xs text-muted-foreground">Includes each family’s check-in code</p>
                    )}
                    {item.attachment_name && (
                      <p className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
                        <Paperclip className="h-3 w-3" /> {item.attachment_name}
                      </p>
                    )}
                    {item.result_summary && (
                      <p className="mt-0.5 text-xs text-muted-foreground">{item.result_summary}</p>
                    )}
                  </div>
                  <div className="flex flex-shrink-0 flex-col items-end gap-1">
                    <Badge className={meta.className}>{meta.label}</Badge>
                    {item.status === 'pending' && (
                      <Button size="sm" variant="ghost" onClick={() => cancel(item)}>Cancel</Button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}