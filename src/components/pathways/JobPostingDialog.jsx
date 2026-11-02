import { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { EMPLOYMENT_TYPES } from '@/lib/joblab/constants';

const today = () => new Date().toISOString().slice(0, 10);

const emptyForm = () => ({
  title: '',
  employer_name: '',
  location: '',
  employment_type: 'full_time',
  wage: '',
  hours: '',
  description: '',
  requirementsText: '',
  how_to_apply: '',
  apply_url: '',
  contact_email: '',
  contact_phone: '',
  posted_date: today(),
  closing_date: '',
  notes: '',
  is_active: true,
});

export default function JobPostingDialog({ open, onClose, job, authorName, onSaved }) {
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    if (job) {
      setForm({
        ...emptyForm(),
        ...job,
        requirementsText: (job.requirements || []).join('\n'),
        is_active: job.is_active !== false,
      });
    } else {
      setForm(emptyForm());
    }
  }, [open, job]);

  const set = (field, value) => setForm((prev) => ({ ...prev, [field]: value }));

  const handleSave = async () => {
    if (!form.title.trim() || !form.employer_name.trim()) {
      toast.error('Job title and employer are required.');
      return;
    }
    setSaving(true);
    try {
      const payload = {
        title: form.title.trim(),
        employer_name: form.employer_name.trim(),
        location: form.location.trim(),
        employment_type: form.employment_type,
        wage: form.wage.trim(),
        hours: form.hours.trim(),
        description: form.description.trim(),
        requirements: form.requirementsText
          .split('\n')
          .map((line) => line.trim())
          .filter(Boolean),
        how_to_apply: form.how_to_apply.trim(),
        apply_url: form.apply_url.trim(),
        contact_email: form.contact_email.trim(),
        contact_phone: form.contact_phone.trim(),
        posted_date: form.posted_date || today(),
        closing_date: form.closing_date || '',
        notes: form.notes,
        is_active: form.is_active,
      };

      if (job) {
        await base44.entities.JobLabJob.update(job.id, payload);
        toast.success('Posting updated');
      } else {
        await base44.entities.JobLabJob.create({ ...payload, created_by_name: authorName || '' });
        toast.success('Posting added to the board');
      }
      onSaved();
      onClose();
    } catch (error) {
      toast.error('Could not save: ' + (error.message || ''));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(next) => !next && onClose()}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{job ? 'Edit job posting' : 'New job posting'}</DialogTitle>
        </DialogHeader>

        <div className="max-h-[65vh] space-y-3 overflow-y-auto pr-1">
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <Label className="mb-1 block text-xs font-medium text-slate-600">Job title *</Label>
              <Input value={form.title} onChange={(e) => set('title', e.target.value)} placeholder="Front desk attendant" />
            </div>
            <div>
              <Label className="mb-1 block text-xs font-medium text-slate-600">Employer *</Label>
              <Input value={form.employer_name} onChange={(e) => set('employer_name', e.target.value)} placeholder="Company name" />
            </div>
            <div>
              <Label className="mb-1 block text-xs font-medium text-slate-600">Location</Label>
              <Input value={form.location} onChange={(e) => set('location', e.target.value)} placeholder="Edmonton, AB" />
            </div>
            <div>
              <Label className="mb-1 block text-xs font-medium text-slate-600">Employment type</Label>
              <Select value={form.employment_type} onValueChange={(value) => set('employment_type', value)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {EMPLOYMENT_TYPES.map((option) => (
                    <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="mb-1 block text-xs font-medium text-slate-600">Wage</Label>
              <Input value={form.wage} onChange={(e) => set('wage', e.target.value)} placeholder="$19.50/hour" />
            </div>
            <div>
              <Label className="mb-1 block text-xs font-medium text-slate-600">Hours / schedule</Label>
              <Input value={form.hours} onChange={(e) => set('hours', e.target.value)} placeholder="Mon–Fri, 8am–4pm" />
            </div>
          </div>

          <div>
            <Label className="mb-1 block text-xs font-medium text-slate-600">What the job involves</Label>
            <Textarea rows={3} value={form.description} onChange={(e) => set('description', e.target.value)} />
          </div>

          <div>
            <Label className="mb-1 block text-xs font-medium text-slate-600">What they're looking for (one per line)</Label>
            <Textarea rows={3} value={form.requirementsText} onChange={(e) => set('requirementsText', e.target.value)} placeholder={'Reliable and on time\nComfortable talking with the public'} />
          </div>

          <div>
            <Label className="mb-1 block text-xs font-medium text-slate-600">How to apply</Label>
            <Textarea rows={2} value={form.how_to_apply} onChange={(e) => set('how_to_apply', e.target.value)} placeholder="Bring a resume to the front desk, or email the manager." />
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <div>
              <Label className="mb-1 block text-xs font-medium text-slate-600">Application link</Label>
              <Input value={form.apply_url} onChange={(e) => set('apply_url', e.target.value)} placeholder="https://…" />
            </div>
            <div>
              <Label className="mb-1 block text-xs font-medium text-slate-600">Contact email</Label>
              <Input value={form.contact_email} onChange={(e) => set('contact_email', e.target.value)} placeholder="manager@company.ca" />
            </div>
            <div>
              <Label className="mb-1 block text-xs font-medium text-slate-600">Contact phone</Label>
              <Input value={form.contact_phone} onChange={(e) => set('contact_phone', e.target.value)} placeholder="780-555-1234" />
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <Label className="mb-1 block text-xs font-medium text-slate-600">Posted date</Label>
              <Input type="date" value={form.posted_date || ''} onChange={(e) => set('posted_date', e.target.value)} />
            </div>
            <div>
              <Label className="mb-1 block text-xs font-medium text-slate-600">Closes</Label>
              <Input type="date" value={form.closing_date || ''} onChange={(e) => set('closing_date', e.target.value)} />
            </div>
          </div>

          <div>
            <Label className="mb-1 block text-xs font-medium text-slate-600">Internal notes (not shown to participants)</Label>
            <Textarea rows={2} value={form.notes || ''} onChange={(e) => set('notes', e.target.value)} />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" size="sm" onClick={onClose}>Cancel</Button>
          <Button size="sm" onClick={handleSave} disabled={saving}>{saving ? 'Saving…' : 'Save posting'}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}