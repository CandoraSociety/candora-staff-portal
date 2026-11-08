import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { base44 } from '@/api/base44Client';
import { CLASSROOM_PROGRAM, KIOSK_ROOMS, roomLabel } from '@/lib/kioskPrograms';

const newCode = () => String(Math.floor(1000 + Math.random() * 9000));

// Classroom tablets belong to a room, so the room picker is what decides which
// schedule the tablet follows.
export default function KioskStationDialog({ open, onOpenChange, station, program = 'reception', room = '', onSaved }) {
  const [form, setForm] = useState({ name: '', location: '', access_code: newCode(), room: '' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const isClassroom = (station?.program || program) === CLASSROOM_PROGRAM;

  useEffect(() => {
    if (!open) return;
    setError('');
    setForm({
      name: station?.name || '',
      location: station?.location || '',
      access_code: station?.access_code || newCode(),
      room: station?.room || room || '',
    });
  }, [open, station, room]);

  const pickRoom = (value) => {
    setForm((prev) => ({
      ...prev,
      room: value,
      name: prev.name && prev.name !== `${roomLabel(prev.room)} Tablet` ? prev.name : `${roomLabel(value)} Tablet`,
      location: prev.location || roomLabel(value),
    }));
  };

  const save = async () => {
    if (!form.name.trim() || saving) return;
    setSaving(true);
    setError('');
    try {
      const payload = {
        name: form.name.trim(),
        location: form.location,
        access_code: form.access_code,
        ...(isClassroom ? { room: form.room, program: CLASSROOM_PROGRAM } : {}),
      };
      if (station?.id) {
        await base44.entities.KioskStation.update(station.id, payload);
      } else {
        await base44.entities.KioskStation.create({
          ...payload,
          program: isClassroom ? CLASSROOM_PROGRAM : program,
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
            {station ? 'Edit tablet' : isClassroom ? 'Add a classroom tablet' : 'Add a customer tablet'}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          {isClassroom && (
            <div className="space-y-1.5">
              <Label>Room</Label>
              <Select value={form.room} onValueChange={pickRoom}>
                <SelectTrigger><SelectValue placeholder="Which room is it in?" /></SelectTrigger>
                <SelectContent>
                  {KIOSK_ROOMS.map((item) => (
                    <SelectItem key={item.id} value={item.id}>{item.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                The tablet follows whatever is scheduled in this room, whichever program it is.
              </p>
            </div>
          )}

          <div className="space-y-1.5">
            <Label>Name</Label>
            <Input value={form.name} onChange={(e) => setForm(p => ({ ...p, name: e.target.value }))} placeholder="Front Desk Tablet" />
          </div>

          <div className="space-y-1.5">
            <Label>Access code</Label>
            <Input value={form.access_code} onChange={(e) => setForm(p => ({ ...p, access_code: e.target.value }))} />
            <p className="text-xs text-muted-foreground">
              Open <span className="font-mono">/kiosk</span> on the tablet once and type this code to pair it. After that it waits on the welcome screen by itself.
            </p>
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}
          <div className="flex items-center gap-2">
            {station && (
              <Button variant="outline" onClick={toggleActive}>
                {station.is_active === false ? 'Turn on' : 'Disconnect'}
              </Button>
            )}
            <Button onClick={save} disabled={saving || !form.name.trim() || (isClassroom && !form.room)} className="ml-auto">
              {saving ? 'Saving…' : 'Save'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}