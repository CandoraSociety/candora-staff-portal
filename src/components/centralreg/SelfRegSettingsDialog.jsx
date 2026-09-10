import React, { useEffect, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/components/ui/use-toast';
import { Copy } from 'lucide-react';

// Per-program public self-registration settings + QR code. Opened from a
// program card in Central Registration → Programs & Registration.
export default function SelfRegSettingsDialog({ open, onOpenChange, area, program }) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const isEll = area === 'ell';

  const settingsQ = useQuery({
    queryKey: ['selfreg-settings'],
    queryFn: () => base44.entities.SelfRegProgram.list(),
    enabled: open,
  });

  const findRecord = (records) => (records || []).find(s =>
    s.area === area && (program?.id ? s.program_id === program.id : s.program_name === program?.name)
  );

  const [form, setForm] = useState(null);
  useEffect(() => {
    if (!open || !settingsQ.data) return;
    const rec = findRecord(settingsQ.data);
    setForm({
      enabled: !!rec?.enabled,
      require_approval: rec ? rec.require_approval !== false : true,
      active_learners_only: !!rec?.active_learners_only,
      active_learners_expiry: rec?.active_learners_expiry || '',
    });
  }, [open, settingsQ.data, area, program]);

  const selfRegUrl = `${window.location.origin}/self-register?area=${encodeURIComponent(area || '')}&program=${encodeURIComponent(program?.id || program?.name || '')}`;
  const qrSrc = `https://api.qrserver.com/v1/create-qr-code/?size=240x240&margin=8&data=${encodeURIComponent(selfRegUrl)}`;

  const handleSave = async () => {
    const existing = findRecord(settingsQ.data);
    const payload = {
      area,
      program_id: program?.id || null,
      program_name: program?.name || '',
      enabled: !!form.enabled,
      require_approval: !!form.require_approval,
      active_learners_only: isEll && !!form.active_learners_only && !!form.enabled,
      active_learners_expiry: isEll && form.active_learners_only && form.active_learners_expiry ? form.active_learners_expiry : null,
    };
    try {
      if (existing) await base44.entities.SelfRegProgram.update(existing.id, payload);
      else await base44.entities.SelfRegProgram.create(payload);
      queryClient.invalidateQueries({ queryKey: ['selfreg-settings'] });
      toast({ title: 'Self-registration settings saved' });
    } catch (e) {
      toast({ title: e.message, variant: 'destructive' });
    }
  };

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(selfRegUrl);
      toast({ title: 'Link copied' });
    } catch {
      toast({ title: 'Could not copy — select the link text manually', variant: 'destructive' });
    }
  };

  const programLabel = program?.name || 'Program';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader><DialogTitle>Self-Registration — {programLabel}</DialogTitle></DialogHeader>
        {!form ? (
          <p className="text-sm text-muted-foreground py-6 text-center">Loading settings…</p>
        ) : (
          <div className="grid gap-5 py-2">
            <div className="flex flex-col items-center gap-2 border rounded-lg p-4">
              <img src={qrSrc} alt={`QR code for ${programLabel}`} className="w-40 h-40" />
              <p className="text-[11px] text-muted-foreground text-center break-all select-all">{selfRegUrl}</p>
              <Button size="sm" variant="outline" onClick={copyLink}><Copy className="h-3.5 w-3.5" /> Copy link</Button>
              <p className="text-[11px] text-muted-foreground/70 text-center">
                Scanning this QR opens a standalone public page for this program — it gives access to nothing else in the app.
                {!form.enabled && ' Enable self-registration below to put it to use.'}
              </p>
            </div>

            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <Checkbox id="sr-enabled" checked={form.enabled} onCheckedChange={(v) => setForm(f => ({ ...f, enabled: v === true }))} />
                <Label htmlFor="sr-enabled" className="cursor-pointer">Allow public self-registration (QR page)</Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox id="sr-noapproval" checked={!form.require_approval} disabled={!form.enabled} onCheckedChange={(v) => setForm(f => ({ ...f, require_approval: v !== true }))} />
                <Label htmlFor="sr-noapproval" className="cursor-pointer">Do not require registrar approval to register</Label>
              </div>
              {form.enabled && !form.require_approval && (
                <p className="text-xs text-muted-foreground pl-6">Public registrations for this program are confirmed immediately — no request queue.</p>
              )}

              {isEll && (
                <div className="border rounded-lg p-3 space-y-3">
                  <div className="flex items-center space-x-2">
                    <Checkbox id="sr-activeonly" checked={form.active_learners_only} disabled={!form.enabled} onCheckedChange={(v) => setForm(f => ({ ...f, active_learners_only: v === true }))} />
                    <Label htmlFor="sr-activeonly" className="cursor-pointer">Only allow Active learners to register</Label>
                  </div>
                  <p className="text-xs text-muted-foreground pl-6">Registrants must select their name from the Active Learners roster — anyone not on the list cannot proceed.</p>
                  <div className="pl-6 space-y-1.5">
                    <Label className="text-xs">Restriction expiry (optional)</Label>
                    <Input type="date" value={form.active_learners_expiry} disabled={!form.enabled || !form.active_learners_only} onChange={(e) => setForm(f => ({ ...f, active_learners_expiry: e.target.value }))} />
                    <p className="text-[11px] text-muted-foreground/70">After this date anyone can register for this course again.</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Close</Button>
          <Button onClick={handleSave} disabled={!form}>Save Settings</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}