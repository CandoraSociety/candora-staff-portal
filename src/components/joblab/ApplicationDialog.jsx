import { useEffect, useState } from 'react';
import { JLButton, JLDialog, JLInput, JLLabel, JLSelect, JLTextarea } from '@/components/joblab/ui';
import { HOW_TO_APPLY_OPTIONS, STATUS_OPTIONS } from '@/lib/joblab/constants';

const blank = (status) => ({
  company: '', position: '', location: '', job_url: '', status,
  date_applied: '', deadline: '', salary_range: '', how_to_apply: '',
  application_instructions: '', job_description: '', notes: '', follow_up_date: '',
});

export default function ApplicationDialog({ open, onClose, onSave, application, defaultStatus = 'saved' }) {
  const [form, setForm] = useState(blank(defaultStatus));
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setForm({ ...blank(defaultStatus), ...(application || {}) });
  }, [open, application, defaultStatus]);

  const set = (key) => (event) => setForm((prev) => ({ ...prev, [key]: event.target.value }));

  const submit = async (event) => {
    event.preventDefault();
    if (!form.company.trim() || !form.position.trim()) return;
    setSaving(true);
    try {
      await onSave(form);
      onClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <JLDialog
      open={open}
      onClose={onClose}
      title={application ? 'Edit job' : 'Add a job'}
      description="Keep the details you need to follow up."
    >
      <form onSubmit={submit} className="space-y-3">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <JLLabel>Company *</JLLabel>
            <JLInput value={form.company} onChange={set('company')} placeholder="Company name" required />
          </div>
          <div>
            <JLLabel>Position *</JLLabel>
            <JLInput value={form.position} onChange={set('position')} placeholder="Job title" required />
          </div>
          <div>
            <JLLabel>Location</JLLabel>
            <JLInput value={form.location} onChange={set('location')} placeholder="City" />
          </div>
          <div>
            <JLLabel>Status</JLLabel>
            <JLSelect value={form.status} onChange={set('status')}>
              {STATUS_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </JLSelect>
          </div>
          <div>
            <JLLabel>Application Deadline</JLLabel>
            <JLInput type="date" value={form.deadline || ''} onChange={set('deadline')} />
          </div>
          <div>
            <JLLabel>Salary Range</JLLabel>
            <JLInput value={form.salary_range} onChange={set('salary_range')} placeholder="e.g. $50,000–$65,000" />
          </div>
          <div>
            <JLLabel>Date Applied</JLLabel>
            <JLInput type="date" value={form.date_applied || ''} onChange={set('date_applied')} />
          </div>
          <div>
            <JLLabel>Follow-up Date</JLLabel>
            <JLInput type="date" value={form.follow_up_date || ''} onChange={set('follow_up_date')} />
          </div>
        </div>

        <div>
          <JLLabel>Job URL</JLLabel>
          <JLInput value={form.job_url} onChange={set('job_url')} placeholder="https://…" />
        </div>

        <div>
          <JLLabel>How to Apply</JLLabel>
          <JLSelect value={form.how_to_apply} onChange={set('how_to_apply')}>
            <option value="">Select…</option>
            {HOW_TO_APPLY_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </JLSelect>
        </div>

        <div>
          <JLLabel>Application Instructions</JLLabel>
          <JLTextarea
            rows={3}
            value={form.application_instructions}
            onChange={set('application_instructions')}
            placeholder="Cover letter requirements, reference number, who to address, references needed…"
          />
        </div>

        <div>
          <JLLabel>Job Description</JLLabel>
          <JLTextarea rows={4} value={form.job_description} onChange={set('job_description')} placeholder="Paste the posting here" />
        </div>

        <div>
          <JLLabel>Notes</JLLabel>
          <JLTextarea rows={3} value={form.notes} onChange={set('notes')} placeholder="Anything you want to remember" />
        </div>

        <JLButton type="submit" className="w-full" disabled={saving}>
          {saving ? 'Saving…' : application ? 'Update' : 'Add to Tracker'}
        </JLButton>
      </form>
    </JLDialog>
  );
}