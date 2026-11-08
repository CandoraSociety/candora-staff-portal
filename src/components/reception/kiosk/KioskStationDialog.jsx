import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { base44 } from '@/api/base44Client';

const newCode = () => String(Math.floor(1000 + Math.random() * 9000));

export default function KioskStationDialog({ open, onOpenChange, station, program = 'reception', onSaved }) {
  const [form, setForm] = useState({ name: '', location: '', access_code: newCode() });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!open) return;
    setError('');
    setForm({
      name: station?.name || '',
      location: station?.location || '',
      access_code: station?.access_code || newCode(),
    });
  }, [open, station]);

  const save = async () => {
    if (!form.name.trim() || saving) return;
    setSaving(true);
    setError('');
    try {
      if (station?.id) {
        await base44.entities.KioskStation.update(station.id, {
          ...form,
          name: form.name.trim(),
          program: station.program || program,
        });
      } else {
        await base44.entities.KioskStation.create({
          ...form,
          name: form.name.trim(),
          program,
          is_active: true,
        });
      }
      onSaved();
      onOpenChange(false);
    } catch (e) {
      setError(e.message || 'Could not save this tablet.');
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async () => {
    if (!station?.id) return;
    await base44.entities.KioskStation.update(station.id, { is_active: !station.is_active });
    onSaved();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            {station ? 'Edit tablet' : program === 'reception' ? 'Add a customer tablet' : 'Add a classroom tablet'}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label>Name</Label>
            <Input value={form.name} onChange={(e) => setForm(p => ({ ...p, name: e.target.value }))} placeholder="Front Desk Tablet" />
          </div>
          <div className="space-y-1.5">
            <Label>Where it sits</Label>
            <Input value={form.location} onChange={(e) => setForm(p => ({ ...p, location: e.target.value }))} placeholder="Main lobby" />
          </div>
          <p className="text-xs text-muted-foreground">
            Open <span className="font-mono">/kiosk</span> on the tablet once and type the code above to pair it. After that it waits on the welcome screen by itself.
          </p>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <div className="flex items-center gap-2">
            {station && (
              <Button variant="outline" onClick={toggleActive}>
                {station.is_active === false ? 'Turn on' : 'Disconnect'}
              </Button>
            )}
            <Button onClick={save} disabled={saving || !form.name.trim()} className="ml-auto">
              {saving ? 'Saving…' : 'Save'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}