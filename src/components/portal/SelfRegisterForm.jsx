import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { AlertCircle, Loader2 } from 'lucide-react';

// Public self-registration form for one program. Submits a REQUEST (the
// registrar approves it unless the program is set to auto-approve).
export default function SelfRegisterForm({ program, onDone }) {
  const isPhac = program.area === 'phac';
  const restricted = !!program.active_learners_only;
  const sessions = program.sessions || [];

  const [form, setForm] = useState({
    first_name: '', last_name: '', phone: '', email: '',
    parent_guardian_name: '', parent_guardian_phone: '', parent_guardian_email: '',
    learner_id: '', session_id: 'any', notes: '',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const update = (f, v) => setForm(p => ({ ...p, [f]: v }));
  const learner = (program.active_learners || []).find(l => l.id === form.learner_id) || null;
  const canSubmit = restricted ? !!learner : (!!form.first_name && !!form.last_name);

  const handleSubmit = async () => {
    if (!canSubmit || saving) return;
    setSaving(true);
    setError('');
    const session = sessions.find(s => s.id === form.session_id) || null;
    try {
      const res = await base44.functions.invoke('submitSelfRegRequest', {
        area: program.area,
        program_id: program.program_id,
        program_name: program.program_name,
        session_id: session?.id || null,
        session_name: session?.name || null,
        session_date: session?.date || null,
        first_name: restricted ? learner.first_name : form.first_name,
        last_name: restricted ? learner.last_name : form.last_name,
        phone: form.phone,
        email: form.email,
        parent_guardian_name: form.parent_guardian_name,
        parent_guardian_phone: form.parent_guardian_phone,
        parent_guardian_email: form.parent_guardian_email,
        learner_id: restricted ? form.learner_id : null,
        notes: form.notes,
      });
      onDone(res.data?.status === 'approved' ? 'approved' : 'pending');
    } catch (e) {
      setError(e.response?.data?.error || e.message || 'Something went wrong — please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-5">
      {error && (
        <div className="flex items-start gap-2 text-sm text-destructive bg-destructive/10 rounded-lg p-3">
          <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {restricted && (
        <div className="space-y-1.5">
          <Label>Select your name to continue *</Label>
          <Select value={form.learner_id} onValueChange={(v) => update('learner_id', v)}>
            <SelectTrigger><SelectValue placeholder="Find your name…" /></SelectTrigger>
            <SelectContent>
              {(program.active_learners || []).map(l => (
                <SelectItem key={l.id} value={l.id}>{l.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">
            Registration for this course is currently limited to current learners. If your name is not on this list, you cannot register online at this time — please contact the office.
          </p>
        </div>
      )}

      {!restricted && (
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label>{isPhac ? "Child's First Name *" : 'First Name *'}</Label>
            <Input value={form.first_name} onChange={(e) => update('first_name', e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>{isPhac ? "Child's Last Name *" : 'Last Name *'}</Label>
            <Input value={form.last_name} onChange={(e) => update('last_name', e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>Phone</Label>
            <Input value={form.phone} onChange={(e) => update('phone', e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>Email</Label>
            <Input type="email" value={form.email} onChange={(e) => update('email', e.target.value)} />
          </div>
        </div>
      )}

      {isPhac && (
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5 col-span-2"><Label>Parent / Guardian Name</Label><Input value={form.parent_guardian_name} onChange={(e) => update('parent_guardian_name', e.target.value)} /></div>
          <div className="space-y-1.5"><Label>Parent / Guardian Phone</Label><Input value={form.parent_guardian_phone} onChange={(e) => update('parent_guardian_phone', e.target.value)} /></div>
          <div className="space-y-1.5"><Label>Parent / Guardian Email</Label><Input type="email" value={form.parent_guardian_email} onChange={(e) => update('parent_guardian_email', e.target.value)} /></div>
        </div>
      )}

      {sessions.length > 0 && (
        <div className="space-y-1.5">
          <Label>Select a session (optional)</Label>
          <Select value={form.session_id} onValueChange={(v) => update('session_id', v)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="any">No preference</SelectItem>
              {sessions.map(s => (
                <SelectItem key={s.id} value={s.id}>
                  {s.name} — {s.date}{s.time ? ` ${s.time}` : ''}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      <div className="space-y-1.5">
        <Label>Notes (optional)</Label>
        <Textarea value={form.notes} onChange={(e) => update('notes', e.target.value)} rows={2} placeholder="Anything you'd like us to know" />
      </div>

      <p className="text-xs text-muted-foreground">
        {program.require_approval
          ? 'Submitting this form sends a registration request — our team will review it and follow up with you.'
          : 'Submitting this form registers you for this program right away.'}
      </p>

      <Button className="w-full" size="lg" onClick={handleSubmit} disabled={!canSubmit || saving}>
        {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
        {saving ? 'Submitting…' : program.require_approval ? 'Submit Registration Request' : 'Register'}
      </Button>
    </div>
  );
}