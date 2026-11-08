import React, { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { programLabel } from '@/lib/kioskPrograms';

const defaultMessage = (label) =>
  `Fill in your details so we can register you for ${label}. A staff member will go over them with you.`;

// Sends the sign-in / self-registration form to a classroom tablet. The tablet
// shows it the moment this is sent, and the answers come back here.
export default function ProgramSignInDialog({ open, onOpenChange, station, sentByName, onSent, options = [], defaultCourse = '' }) {
  const program = station?.program || 'ell';
  const label = programLabel(program);
  const [course, setCourse] = useState('');
  const [title, setTitle] = useState(`${label} sign-in`);
  const [message, setMessage] = useState(defaultMessage(label));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!open) return;
    setCourse(defaultCourse || '');
    setTitle(`${label} sign-in`);
    setMessage(defaultMessage(label));
    setError('');
  }, [open, station?.id, defaultCourse]);

  const save = async () => {
    if (saving) return;
    setSaving(true);
    setError('');
    try {
      await base44.entities.KioskPrompt.create({
        station_id: station.id,
        station_name: station.name,
        program,
        course_name: course.trim(),
        kind: 'self_registration',
        title: title.trim() || `${label} sign-in`,
        message: message.trim(),
        status: 'sent',
        sent_by_name: sentByName || '',
      });
      onSent();
      onOpenChange(false);
    } catch (e) {
      setError(e.message || 'Could not send the form to this tablet.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Send sign-in to {station?.name || 'the tablet'}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label>Program or class (optional)</Label>
            {options.length > 0 ? (
              <Select value={course} onValueChange={setCourse}>
                <SelectTrigger>
                  <SelectValue placeholder={`Choose a ${label} program`} />
                </SelectTrigger>
                <SelectContent>
                  {options.map((option) => (
                    <SelectItem key={option} value={option}>{option}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <Input value={course} onChange={(e) => setCourse(e.target.value)} placeholder="e.g. ELL Level 2 — Tuesday morning" />
            )}
            <p className="text-xs text-muted-foreground">Shown with the sign-in on the tablet and kept with the registration.</p>
          </div>

          <div className="space-y-1.5">
            <Label>Headline on the tablet</Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} />
          </div>

          <div className="space-y-1.5">
            <Label>Supporting line</Label>
            <Textarea value={message} onChange={(e) => setMessage(e.target.value)} rows={3} />
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <Button onClick={save} disabled={saving} className="w-full">
            {saving ? 'Sending…' : 'Show on tablet'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}