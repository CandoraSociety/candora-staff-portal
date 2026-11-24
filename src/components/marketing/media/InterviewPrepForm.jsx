import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const EMPTY = {
  title: '',
  press_release_id: '',
  press_release_title: '',
  outlet: '',
  interviewer: '',
  spokesperson: '',
  interview_date: '',
  format: 'phone',
  status: 'planned',
  notes: '',
};

const FORMATS = ['in_person', 'phone', 'radio', 'tv', 'podcast', 'video_call', 'written'];
const STATUSES = ['planned', 'preparing', 'ready', 'completed'];

const label = (value) => value.replace('_', ' ').replace(/^\w/, (c) => c.toUpperCase());

// Just the booking details. The briefing itself lives in Notes until a fuller
// guide template is added.
export default function InterviewPrepForm({ item, releases = [], onClose, onSave }) {
  const [form, setForm] = useState(item ? { ...EMPTY, ...item } : { ...EMPTY });
  const set = (key, value) => setForm((f) => ({ ...f, [key]: value }));

  const linkRelease = (value) => {
    if (value === 'none') {
      setForm((f) => ({ ...f, press_release_id: '', press_release_title: '' }));
      return;
    }
    const release = releases.find((r) => r.id === value);
    setForm((f) => ({ ...f, press_release_id: value, press_release_title: release?.title || '' }));
  };

  return (
    <div className="space-y-3">
      <div>
        <Label>Title *</Label>
        <Input
          value={form.title}
          onChange={(e) => set('title', e.target.value)}
          placeholder="e.g. CBC Morning - Winter Wonderland launch"
        />
      </div>

      <div>
        <Label>Linked press release</Label>
        <Select value={form.press_release_id || 'none'} onValueChange={linkRelease}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="none">Not linked to a release</SelectItem>
            {releases.map((r) => (
              <SelectItem key={r.id} value={r.id}>{r.title}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div><Label>Outlet</Label><Input value={form.outlet || ''} onChange={(e) => set('outlet', e.target.value)} /></div>
        <div><Label>Interviewer</Label><Input value={form.interviewer || ''} onChange={(e) => set('interviewer', e.target.value)} /></div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div><Label>Spokesperson</Label><Input value={form.spokesperson || ''} onChange={(e) => set('spokesperson', e.target.value)} /></div>
        <div>
          <Label>Interview date</Label>
          <Input
            type="datetime-local"
            value={form.interview_date ? form.interview_date.slice(0, 16) : ''}
            onChange={(e) => set('interview_date', e.target.value)}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label>Format</Label>
          <Select value={form.format} onValueChange={(v) => set('format', v)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {FORMATS.map((f) => <SelectItem key={f} value={f}>{label(f)}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>Status</Label>
          <Select value={form.status} onValueChange={(v) => set('status', v)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {STATUSES.map((s) => <SelectItem key={s} value={s}>{label(s)}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div>
        <Label>Notes</Label>
        <Textarea
          value={form.notes || ''}
          onChange={(e) => set('notes', e.target.value)}
          rows={4}
          placeholder="Talking points, questions to expect, anything the spokesperson needs"
        />
      </div>

      <div className="flex justify-end gap-2">
        <Button variant="outline" onClick={onClose}>Cancel</Button>
        <Button onClick={() => onSave(form)}>Save</Button>
      </div>
    </div>
  );
}