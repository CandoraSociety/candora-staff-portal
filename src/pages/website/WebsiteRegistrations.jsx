import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import PageHeader from '@/components/shared/PageHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Download, Search } from 'lucide-react';
import { toast } from 'sonner';
import RegistrationRow from '@/components/website/programs/RegistrationRow';
import { REGISTRATION_STATUSES, registrationMeta } from '@/lib/websitePrograms';
import { cn } from '@/lib/utils';

export default function WebsiteRegistrations() {
  const [searchParams, setSearchParams] = useSearchParams();
  const programId = searchParams.get('program') || 'all';
  const [programs, setPrograms] = useState([]);
  const [registrations, setRegistrations] = useState([]);
  const [status, setStatus] = useState('all');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [decline, setDecline] = useState({ open: false, id: null, reason: '' });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [programPage, regPage] = await Promise.all([
        base44.entities.WebsiteProgram.filter({}, { sort: 'name', limit: 200 }),
        base44.entities.WebsiteProgramRegistration.filter(
          programId === 'all' ? {} : { program: programId },
          { sort: 'created_date', limit: 300 }
        ),
      ]);
      setPrograms(programPage.items || []);
      setRegistrations(regPage.items || []);
    } catch (error) {
      toast.error(error?.message || 'The registrations could not be loaded.');
    } finally {
      setLoading(false);
    }
  }, [programId]);

  useEffect(() => { load(); }, [load]);

  const programById = useMemo(() => {
    const map = {};
    programs.forEach((program) => { map[program.id] = program; });
    return map;
  }, [programs]);

  const visible = registrations
    .filter((item) => status === 'all' || item.status === status)
    .filter((item) => {
      const term = search.trim().toLowerCase();
      if (!term) return true;
      return `${item.full_name} ${item.email} ${item.program_name}`.toLowerCase().includes(term);
    })
    .sort((a, b) => {
      const aWait = a.status === 'waitlisted' ? Number(a.waitlist_position) || 999 : 0;
      const bWait = b.status === 'waitlisted' ? Number(b.waitlist_position) || 999 : 0;
      if (aWait !== bWait) return aWait - bWait;
      return String(b.created_date || '').localeCompare(String(a.created_date || ''));
    });

  const counts = useMemo(() => {
    const map = {};
    registrations.forEach((item) => { map[item.status] = (map[item.status] || 0) + 1; });
    return map;
  }, [registrations]);

  const decide = async (registration, decision, reason) => {
    setBusy(true);
    try {
      const response = decision === 'promote'
        ? await base44.functions.invoke('programAdmin', { action: 'promote_waitlist', id: registration.id })
        : await base44.functions.invoke('programAdmin', {
            action: 'decide_registration',
            id: registration.id,
            decision,
            reason: reason || '',
          });
      if (response.data?.error) throw new Error(response.data.error);
      toast.success('Saved. The person has been emailed.');
      await load();
    } catch (error) {
      toast.error(error?.message || 'That decision could not be saved.');
    } finally {
      setBusy(false);
    }
  };

  const onDecide = (registration, decision) => {
    if (decision === 'decline') {
      setDecline({ open: true, id: registration.id, reason: '' });
      return;
    }
    decide(registration, decision);
  };

  const move = async (registration, direction) => {
    const line = visible.filter((item) => item.status === 'waitlisted' && item.program === registration.program);
    const index = line.findIndex((item) => item.id === registration.id);
    const target = index + direction;
    if (index < 0 || target < 0 || target >= line.length) return;
    const reordered = [...line];
    [reordered[index], reordered[target]] = [reordered[target], reordered[index]];
    setBusy(true);
    try {
      const response = await base44.functions.invoke('programAdmin', {
        action: 'reorder_waitlist',
        ordered_ids: reordered.map((item) => item.id),
      });
      if (response.data?.error) throw new Error(response.data.error);
      await load();
    } catch (error) {
      toast.error(error?.message || 'The waitlist could not be reordered.');
    } finally {
      setBusy(false);
    }
  };

  const exportCsv = () => {
    const header = ['Name', 'Email', 'Phone', 'Program', 'Status', 'Waitlist position', 'Asked', 'Notes'];
    const lines = visible.map((item) => [
      item.full_name,
      item.email,
      item.phone || '',
      item.program_name || '',
      registrationMeta(item.status).label,
      item.waitlist_position || '',
      item.created_date || '',
      String(item.notes || '').replace(/\n/g, ' '),
    ]);
    const csv = [header, ...lines]
      .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(','))
      .join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'program-registrations.csv';
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <PageHeader
        title="Registrations"
        description="Every request for a seat, and every decision on it."
        actions={<Button variant="outline" onClick={exportCsv} disabled={!visible.length}><Download className="w-4 h-4 mr-1.5" /> Export</Button>}
      />

      <div className="flex flex-wrap gap-3 mb-4">
        <Select
          value={programId}
          onValueChange={(value) => {
            const next = new URLSearchParams(searchParams);
            if (value === 'all') next.delete('program');
            else next.set('program', value);
            setSearchParams(next, { replace: true });
          }}
        >
          <SelectTrigger className="w-[280px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All programs</SelectItem>
            {programs.map((program) => (
              <SelectItem key={program.id} value={program.id}>{program.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <div className="relative flex-1 min-w-[200px]">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input className="pl-9" placeholder="Search by name, email or program" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
      </div>

      <div className="flex flex-wrap gap-2 mb-5">
        <button
          type="button"
          onClick={() => setStatus('all')}
          className={cn(
            'rounded-full border px-3 py-1 text-xs font-semibold',
            status === 'all' ? 'bg-foreground text-background border-foreground' : 'bg-card text-muted-foreground'
          )}
        >
          All ({registrations.length})
        </button>
        {REGISTRATION_STATUSES.map((item) => (
          <button
            key={item.value}
            type="button"
            onClick={() => setStatus(item.value)}
            className={cn(
              'rounded-full border px-3 py-1 text-xs font-semibold',
              status === item.value ? item.tone : 'bg-card text-muted-foreground'
            )}
          >
            {item.label} ({counts[item.value] || 0})
          </button>
        ))}
      </div>

      {loading ? (
        <p className="text-sm text-muted-foreground">Loading registrations…</p>
      ) : visible.length === 0 ? (
        <div className="rounded-xl border border-dashed p-10 text-center">
          <p className="font-medium">Nothing here yet</p>
          <p className="text-sm text-muted-foreground mt-1">
            Registrations arrive from the website and appear here the moment someone sends one.
          </p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {visible.map((registration) => (
            <RegistrationRow
              key={registration.id}
              registration={registration}
              program={programById[registration.program]}
              busy={busy}
              onDecide={(decision) => onDecide(registration, decision)}
              onMove={(direction) => move(registration, direction)}
            />
          ))}
        </div>
      )}

      <Dialog open={decline.open} onOpenChange={(open) => setDecline((prev) => ({ ...prev, open }))}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Decline this registration</DialogTitle>
          </DialogHeader>
          <div className="space-y-1.5">
            <Label className="text-xs">Reason (optional, sent to the person)</Label>
            <Textarea
              rows={4}
              value={decline.reason}
              onChange={(e) => setDecline((prev) => ({ ...prev, reason: e.target.value }))}
              placeholder="The group is full for this intake."
            />
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setDecline({ open: false, id: null, reason: '' })}>Cancel</Button>
            <Button
              variant="destructive"
              onClick={async () => {
                const registration = registrations.find((item) => item.id === decline.id);
                const reason = decline.reason;
                setDecline({ open: false, id: null, reason: '' });
                if (registration) await decide(registration, 'decline', reason);
              }}
            >
              Decline and email
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}