import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Clock, Upload, X, FileText, Briefcase } from 'lucide-react';
import { toast } from 'sonner';
import { syncSubmissionCreate } from '@/lib/workExposureSync';

// Reusable timesheet submission form used by both:
//   • employers (in the Employer Portal) — pass `placements` to pick a participant
//   • career counsellors (in the Work Exposure tab) — pass a fixed `placement`
export default function TimesheetSubmissionForm({ placement, placements, user, isStaff, employer, onDone, onCancel }) {
  const list = placements && placements.length ? placements : placement ? [placement] : [];
  const [placementId, setPlacementId] = useState(placement?.id || (list.length === 1 ? list[0].id : ''));
  const [hours, setHours] = useState('');
  const [periodStart, setPeriodStart] = useState('');
  const [periodEnd, setPeriodEnd] = useState('');
  const [timesheetUrl, setTimesheetUrl] = useState('');
  const [comments, setComments] = useState('');
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);

  const active = list.find(p => p.id === placementId) || placement;

  const handleUpload = async (file) => {
    if (!file) return;
    setUploading(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setTimesheetUrl(file_url);
      toast.success('Timesheet uploaded');
    } catch {
      toast.error('Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async () => {
    if (!active) { toast.error('Select a participant'); return; }
    const h = parseFloat(hours);
    if (!h || h <= 0) { toast.error('Enter total hours worked'); return; }
    if (!periodEnd) { toast.error('Enter the period end date'); return; }
    if (periodStart && periodEnd < periodStart) { toast.error('End date is before start date'); return; }
    setSaving(true);
    try {
      const billingMonth = periodEnd.slice(0, 7);
      const submission = await base44.entities.WorkExposureHoursSubmission.create({
        employer_id: active.employer_id || employer?.id || '',
        employer_name: active.business_name || employer?.name || '',
        placement_id: active.id,
        client_id: active.client_id,
        client_name: active.client_name,
        hours_worked: h,
        period_start_date: periodStart || periodEnd,
        period_end_date: periodEnd,
        billing_month: billingMonth,
        timesheet_url: timesheetUrl,
        comments,
        submitted_date: new Date().toISOString().slice(0, 10),
        submitted_by_name: isStaff
          ? (user?.full_name || user?.email || 'Staff')
          : (employer?.contact_name || user?.full_name || user?.email || ''),
        submitted_by_email: isStaff ? (user?.email || '') : (employer?.contact_email || user?.email || ''),
        submitted_by_staff: !!isStaff,
        status: 'submitted',
      });
      await syncSubmissionCreate(submission, active);
      toast.success('Timesheet submitted');
      onDone?.();
    } catch (e) {
      toast.error('Failed to submit: ' + (e.message || ''));
    } finally {
      setSaving(false);
    }
  };

  const rate = Number(active?.hourly_rate) || 15;
  const calcTotal = ((parseFloat(hours) || 0) * rate).toFixed(2);

  return (
    <Dialog open onOpenChange={(o) => !o && onCancel?.()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2"><Clock className="w-4 h-4" /> Submit Work Exposure Hours</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          {list.length >= 1 && (
            <div>
              <Label className="text-xs">Employee (Participant) *</Label>
              <Select value={placementId} onValueChange={setPlacementId}>
                <SelectTrigger className="mt-1"><SelectValue placeholder="Select an employee..." /></SelectTrigger>
                <SelectContent>
                  {list.map(p => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.client_name}{p.position_type ? ` — ${p.position_type}` : ''}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          {active && (
            <div className="text-xs text-muted-foreground flex flex-wrap gap-x-3">
              <span className="flex items-center gap-1"><Briefcase className="w-3 h-3" />{active.business_name}</span>
              <span>Rate: ${rate}/hr</span>
            </div>
          )}
          <div>
            <Label className="text-xs">Total Hours Worked *</Label>
            <Input type="number" step="0.25" min="0" value={hours} onChange={e => setHours(e.target.value)} className="mt-1" placeholder="e.g. 40" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">Period Start Date</Label>
              <Input type="date" value={periodStart} onChange={e => setPeriodStart(e.target.value)} className="mt-1" />
            </div>
            <div>
              <Label className="text-xs">Period End Date *</Label>
              <Input type="date" value={periodEnd} onChange={e => setPeriodEnd(e.target.value)} className="mt-1" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3 items-end">
            <div>
              <Label className="text-xs">Calculated Total</Label>
              <div className="mt-1 h-9 flex items-center px-3 rounded-md bg-slate-100 text-sm font-semibold text-slate-700">
                ${calcTotal}
              </div>
            </div>
            <div>
              <Label className="text-xs">Billing Month</Label>
              <div className="mt-1 h-9 flex items-center px-3 rounded-md bg-slate-50 text-sm text-slate-600">
                {periodEnd ? periodEnd.slice(0, 7) : '—'}
              </div>
            </div>
          </div>
          <div>
            <Label className="text-xs">Timesheet (supporting document)</Label>
            <div className="mt-1 flex items-center gap-2">
              <Input type="file" accept="image/*,.pdf" disabled={uploading} onChange={e => handleUpload(e.target.files?.[0])} className="text-xs" />
              {timesheetUrl && (
                <Badge variant="outline" className="text-xs flex gap-1 items-center">
                  <FileText className="w-3 h-3" />{timesheetUrl.split('/').pop().slice(0, 16)}
                  <button onClick={() => setTimesheetUrl('')}><X className="w-3 h-3" /></button>
                </Badge>
              )}
            </div>
            {uploading && <div className="text-xs text-muted-foreground mt-1">Uploading...</div>}
          </div>
          <div>
            <Label className="text-xs">Comments (progress notes, challenges, etc.)</Label>
            <Textarea value={comments} onChange={e => setComments(e.target.value)} rows={3} className="mt-1 text-xs" placeholder="Optional notes for the career counsellor..." />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" size="sm" onClick={() => onCancel?.()}>Cancel</Button>
          <Button size="sm" onClick={handleSubmit} disabled={saving}>{saving ? 'Submitting...' : 'Submit Hours'}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}