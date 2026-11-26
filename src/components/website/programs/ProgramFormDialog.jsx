import React, { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { PROGRAM_CATEGORIES, PROGRAM_STATUSES, slugify } from '@/lib/websitePrograms';
import { toast } from 'sonner';

const EMPTY = {
  name: '', slug: '', category: 'adult_learning', summary: '', description: '',
  image_url: '', poster_url: '', image_alt: '', location_name: '', address: '', room: '',
  eligibility: '', cost: '', contact_name: '', contact_email: '', contact_phone: '',
  status: 'registration_open', status_locked: false, registration_required: true,
  registration_mode: 'register', intake_opens: '', intake_closes: '', capacity: '',
  waitlist_enabled: true, approval_required: false, auto_promote_from_waitlist: true,
  schedule_summary: '', start_date: '', end_date: '',
  recurrence: '', session_start_time: '', session_end_time: '',
  featured: false, home_order: 0, is_published: false, tags: '',
};

const Field = ({ label, hint, children }) => (
  <div className="space-y-1.5">
    <Label className="text-xs">{label}</Label>
    {children}
    {hint && <p className="text-[11px] text-muted-foreground">{hint}</p>}
  </div>
);

export default function ProgramFormDialog({ open, onOpenChange, program, onSaved }) {
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setForm({
      ...EMPTY,
      ...(program || {}),
      capacity: program?.capacity ?? '',
      home_order: program?.home_order ?? 0,
      tags: Array.isArray(program?.tags) ? program.tags.join(', ') : '',
    });
  }, [open, program]);

  const set = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));

  const save = async () => {
    if (!form.name.trim()) {
      toast.error('Give the program a name first.');
      return;
    }
    setSaving(true);
    try {
      const slug = slugify(form.slug || form.name);
      const payload = {
        ...form,
        slug,
        public_path: `/programs/${slug}`,
        capacity: form.capacity === '' ? null : Number(form.capacity),
        home_order: Number(form.home_order) || 0,
        tags: String(form.tags || '').split(',').map((tag) => tag.trim()).filter(Boolean),
      };
      delete payload.id;
      delete payload.created_date;
      delete payload.updated_date;
      delete payload.created_by_id;
      if (program?.id) {
        await base44.entities.WebsiteProgram.update(program.id, payload);
      } else {
        await base44.entities.WebsiteProgram.create(payload);
      }
      toast.success(program?.id ? 'Program updated.' : 'Program created.');
      onSaved?.();
      onOpenChange(false);
    } catch (error) {
      toast.error(error?.message || 'The program could not be saved.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{program?.id ? 'Edit program' : 'New program'}</DialogTitle>
          <DialogDescription>
            Everything the public program page shows, and how someone joins it. The status is worked out from the
            intake dates and the seats unless you lock it.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-2">
          <div className="grid sm:grid-cols-2 gap-4">
            <Field label="Program name">
              <Input value={form.name} onChange={(e) => set('name', e.target.value)} placeholder="English Language Learning" />
            </Field>
            <Field label="Web address" hint="Set once. The website links to /programs/<slug>.">
              <Input value={form.slug} onChange={(e) => set('slug', e.target.value)} placeholder="english-language-learning" />
            </Field>
            <Field label="Category">
              <Select value={form.category} onValueChange={(value) => set('category', value)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {PROGRAM_CATEGORIES.map((item) => (
                    <SelectItem key={item.value} value={item.value}>{item.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field label="Cost">
              <Input value={form.cost} onChange={(e) => set('cost', e.target.value)} placeholder="Free" />
            </Field>
          </div>

          <Field label="Card summary">
            <Textarea rows={2} value={form.summary} onChange={(e) => set('summary', e.target.value)} />
          </Field>
          <Field label="Page copy">
            <Textarea rows={6} value={form.description} onChange={(e) => set('description', e.target.value)} />
          </Field>

          <div className="grid sm:grid-cols-2 gap-4">
            <Field label="Photo address" hint="A publicly stored file address.">
              <Input value={form.image_url} onChange={(e) => set('image_url', e.target.value)} />
            </Field>
            <Field label="Photo description" hint="Read out by screen readers.">
              <Input value={form.image_alt} onChange={(e) => set('image_alt', e.target.value)} />
            </Field>
            <Field label="Poster or brochure address">
              <Input value={form.poster_url} onChange={(e) => set('poster_url', e.target.value)} />
            </Field>
            <Field label="Eligibility">
              <Input value={form.eligibility} onChange={(e) => set('eligibility', e.target.value)} placeholder="Adults 18+" />
            </Field>
          </div>

          <div className="grid sm:grid-cols-3 gap-4">
            <Field label="Location"><Input value={form.location_name} onChange={(e) => set('location_name', e.target.value)} /></Field>
            <Field label="Address"><Input value={form.address} onChange={(e) => set('address', e.target.value)} /></Field>
            <Field label="Room"><Input value={form.room} onChange={(e) => set('room', e.target.value)} /></Field>
          </div>

          <div className="rounded-xl border p-4 space-y-4">
            <p className="text-sm font-semibold">How people join</p>
            <div className="grid sm:grid-cols-2 gap-4">
              <Field label="Registration">
                <Select value={form.registration_mode} onValueChange={(value) => set('registration_mode', value)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Drop-in, no registration</SelectItem>
                    <SelectItem value="register">Register, seats confirmed instantly</SelectItem>
                    <SelectItem value="waitlist">Waitlist only</SelectItem>
                    <SelectItem value="approval">Approval required</SelectItem>
                  </SelectContent>
                </Select>
              </Field>
              <Field label="Capacity" hint="Leave empty for no limit.">
                <Input type="number" value={form.capacity} onChange={(e) => set('capacity', e.target.value)} />
              </Field>
              <Field label="Registration opens"><Input type="date" value={form.intake_opens} onChange={(e) => set('intake_opens', e.target.value)} /></Field>
              <Field label="Registration closes"><Input type="date" value={form.intake_closes} onChange={(e) => set('intake_closes', e.target.value)} /></Field>
              <Field label="Status shown" hint="Locked only when you need to override the computed status.">
                <div className="flex gap-2">
                  <Select value={form.status} onValueChange={(value) => set('status', value)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {PROGRAM_STATUSES.map((item) => (
                        <SelectItem key={item.value} value={item.value}>{item.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <div className="flex items-center gap-2 px-2">
                    <Switch checked={!!form.status_locked} onCheckedChange={(value) => set('status_locked', value)} />
                    <span className="text-xs">Lock</span>
                  </div>
                </div>
              </Field>
            </div>
            <div className="flex flex-wrap gap-x-6 gap-y-3">
              {[
                ['waitlist_enabled', 'Waitlist when full'],
                ['approval_required', 'Every registration needs approval'],
                ['auto_promote_from_waitlist', 'Offer a freed seat to the next in line'],
                ['featured', 'Feature on the home page'],
                ['is_published', 'Published on the website'],
              ].map(([key, label]) => (
                <label key={key} className="flex items-center gap-2 text-sm">
                  <Switch checked={!!form[key]} onCheckedChange={(value) => set(key, value)} />
                  {label}
                </label>
              ))}
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <Field label="Schedule in words">
              <Input value={form.schedule_summary} onChange={(e) => set('schedule_summary', e.target.value)} placeholder="Tuesdays, 1:00–3:30 PM" />
            </Field>
            <Field label="Recurrence" hint="e.g. weekly:tuesday,thursday — used to generate the calendar.">
              <Input value={form.recurrence} onChange={(e) => set('recurrence', e.target.value)} />
            </Field>
            <Field label="Starts"><Input type="date" value={form.start_date} onChange={(e) => set('start_date', e.target.value)} /></Field>
            <Field label="Ends"><Input type="date" value={form.end_date} onChange={(e) => set('end_date', e.target.value)} /></Field>
            <Field label="Session start time"><Input type="time" value={form.session_start_time} onChange={(e) => set('session_start_time', e.target.value)} /></Field>
            <Field label="Session end time"><Input type="time" value={form.session_end_time} onChange={(e) => set('session_end_time', e.target.value)} /></Field>
            <Field label="Contact name"><Input value={form.contact_name} onChange={(e) => set('contact_name', e.target.value)} /></Field>
            <Field label="Contact email"><Input value={form.contact_email} onChange={(e) => set('contact_email', e.target.value)} /></Field>
            <Field label="Contact phone"><Input value={form.contact_phone} onChange={(e) => set('contact_phone', e.target.value)} /></Field>
            <Field label="Home rail position"><Input type="number" value={form.home_order} onChange={(e) => set('home_order', e.target.value)} /></Field>
          </div>

          <Field label="Tags" hint="Separate with commas — the words this program should be found for.">
            <Input value={form.tags} onChange={(e) => set('tags', e.target.value)} />
          </Field>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={save} disabled={saving}>{saving ? 'Saving…' : 'Save program'}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}