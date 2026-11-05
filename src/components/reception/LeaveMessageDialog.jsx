import { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { CheckCircle2, Loader2, Search, Send, UserRound } from 'lucide-react';

// Pick a staff member, write the note, send it. Sent notifications appear on
// that person's main Dashboard, stamped with the date and time.
export default function LeaveMessageDialog({ open, onOpenChange, fromName }) {
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [selectedId, setSelectedId] = useState('');
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const [sentTo, setSentTo] = useState('');

  useEffect(() => {
    if (!open) {
      setSearch(''); setSelectedId(''); setMessage(''); setError(''); setSentTo(''); setSending(false);
      return;
    }
    setLoading(true);
    setError('');
    base44.functions.invoke('receptionMessages', { action: 'staff' })
      .then((res) => setStaff(res.data?.staff || []))
      .catch(() => setError('Could not load the staff list. Close and try again.'))
      .finally(() => setLoading(false));
  }, [open]);

  const term = search.trim().toLowerCase();
  const filtered = term
    ? staff.filter((s) => `${s.name} ${s.position} ${s.department}`.toLowerCase().includes(term))
    : staff;

  const selected = staff.find((s) => s.id === selectedId);

  const handleSend = async () => {
    if (!selectedId) { setError('Choose who the message is for.'); return; }
    if (!message.trim()) { setError('Write a message before sending.'); return; }
    setSending(true);
    setError('');
    try {
      const res = await base44.functions.invoke('receptionMessages', {
        action: 'send',
        employee_id: selectedId,
        message: message.trim(),
        from_name: fromName || '',
      });
      if (res.data?.error) { setError(res.data.error); return; }
      setSentTo(res.data?.recipient || selected?.name || 'them');
      setSelectedId('');
      setMessage('');
    } catch (e) {
      setError(e?.response?.data?.error || 'The message could not be sent. Try again.');
    } finally {
      setSending(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Leave a message</DialogTitle>
          <DialogDescription>
            Pick the staff member it is for. It lands in their dashboard notifications, stamped with today's date and time.
          </DialogDescription>
        </DialogHeader>

        {sentTo ? (
          <div className="space-y-4">
            <div className="flex items-start gap-3 rounded-xl border border-accent/40 bg-accent/5 p-4">
              <CheckCircle2 className="h-5 w-5 text-accent mt-0.5" />
              <div>
                <p className="font-semibold text-foreground">Message sent to {sentTo}</p>
                <p className="text-sm text-muted-foreground">It shows on their dashboard the next time they sign in.</p>
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setSentTo('')}>Leave another</Button>
              <Button onClick={() => onOpenChange(false)}>Done</Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="space-y-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search staff by name, position or department..."
                  className="pl-9"
                />
              </div>
              <div className="max-h-56 overflow-y-auto rounded-lg border divide-y">
                {loading ? (
                  <div className="flex items-center justify-center gap-2 p-6 text-sm text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin" /> Loading staff...
                  </div>
                ) : filtered.length === 0 ? (
                  <p className="p-6 text-center text-sm text-muted-foreground">No staff match that search.</p>
                ) : (
                  filtered.map((s) => (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => { setSelectedId(s.id); setError(''); }}
                      className={cn(
                        'flex w-full items-center gap-3 px-3 py-2.5 text-left transition-colors hover:bg-muted',
                        selectedId === s.id && 'bg-accent/10'
                      )}
                    >
                      <UserRound className={cn('h-4 w-4 shrink-0', selectedId === s.id ? 'text-accent' : 'text-muted-foreground')} />
                      <span className="min-w-0">
                        <span className="block text-sm font-medium text-foreground truncate">{s.name}</span>
                        <span className="block text-xs text-muted-foreground truncate">
                          {[s.position, s.department].filter(Boolean).join(' · ')}
                        </span>
                      </span>
                    </button>
                  ))
                )}
              </div>
              {selected && (
                <p className="text-xs text-muted-foreground">Message for <span className="font-medium text-foreground">{selected.name}</span></p>
              )}
            </div>

            <div className="space-y-1.5">
              <Textarea
                value={message}
                onChange={(e) => { setMessage(e.target.value); setError(''); }}
                placeholder="Someone stopped by to see you this morning — they'll come back after lunch.&#10;&#10;Or: a visitor asked about their appointment and it needs a follow-up call."
                rows={5}
                maxLength={2000}
              />
              <p className="text-right text-xs text-muted-foreground">{message.length}/2000</p>
            </div>

            {error && <p className="text-sm text-destructive">{error}</p>}

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
              <Button onClick={handleSend} disabled={sending}>
                {sending ? <Loader2 className="h-4 w-4 mr-1.5 animate-spin" /> : <Send className="h-4 w-4 mr-1.5" />}
                Send message
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}