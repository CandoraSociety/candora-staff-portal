import React, { useEffect, useMemo, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/use-toast';
import { cn } from '@/lib/utils';
import { ChevronDown, ChevronLeft, ChevronRight, Loader2, Paperclip } from 'lucide-react';

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

// The Scheduled messages tab: a month calendar showing which days have messages
// waiting, and a collapsible list of everything scheduled. A day in the calendar
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

  const counts = useMemo(() => items.reduce((acc, item) => {
    const key = dayKey(item.send_at);
    acc[key] = (acc[key] || 0) + 1;
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
      <div className="rounded-md border p-3">
        <div className="mb-2 flex items-center justify-between">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() - 1, 1))}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <p className="text-sm font-semibold">
            {cursor.toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}
          </p>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1))}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        <div className="mb-1 grid grid-cols-7 gap-1 text-center text-[11px] uppercase tracking-wide text-muted-foreground">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => <span key={day}>{day.slice(0, 1)}</span>)}
        </div>

        <div className="grid grid-cols-7 gap-1">
          {days.map(day => {
            const key = dayKey(day);
            const count = counts[key] || 0;
            const active = dayFilter === key;
            const inMonth = day.getMonth() === cursor.getMonth();
            return (
              <button
                key={key}
                type="button"
                onClick={() => setDayFilter(active ? null : key)}
                className={cn(
                  'relative flex h-9 flex-col items-center justify-center rounded-md border text-xs transition-colors',
                  inMonth ? 'text-foreground' : 'text-muted-foreground/50',
                  active ? 'border-primary bg-primary/10 font-semibold' : 'hover:bg-muted/50',
                  !active && key === today && 'border-muted-foreground/40',
                )}
              >
                <span>{day.getDate()}</span>
                {count > 0 && (
                  <span className="absolute bottom-1 h-1 w-1 rounded-full bg-primary" />
                )}
              </button>
            );
          })}
        </div>

        <p className="mt-2 text-xs text-muted-foreground">
          {dayFilter ? 'Showing one day — pick the day again to see them all.' : 'A dot marks a day with a message waiting.'}
        </p>
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