import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { CheckCircle, FileText } from 'lucide-react';
import moment from 'moment';

export default function StaffReportingForm() {
  const [form, setForm] = useState({
    report_type: 'hours',
    reporter_name: '',
    volunteer_name: '',
    date: moment().format('YYYY-MM-DD'),
    hours: '',
    position: '',
    notes: '',
    evaluation_notes: '',
  });
  const [submitted, setSubmitted] = useState(false);
  const update = (f, v) => setForm(p => ({ ...p, [f]: v }));

  const submitMutation = useMutation({
    mutationFn: async () => {
      if (form.report_type === 'hours' || form.report_type === 'both') {
        await base44.entities.VolunteerTimeLog.create({
          volunteer_id: 'staff_submission',
          volunteer_name: form.volunteer_name,
          position_id: 'staff_submission',
          position_title: form.position || 'Reported by Staff',
          date: form.date,
          total_hours: Number(form.hours) || 0,
          status: 'adjusted',
          notes: `Reported by ${form.reporter_name}. ${form.notes}`,
        });
      }
      if (form.report_type === 'evaluation' || form.report_type === 'both') {
        await base44.entities.VolunteerApproval.create({
          volunteer_name: form.volunteer_name,
          request_type: 'profile_change',
          description: `Staff evaluation by ${form.reporter_name}: ${form.evaluation_notes}`,
          status: 'pending',
        });
      }
    },
    onSuccess: () => setSubmitted(true),
  });

  if (submitted) {
    return (
      <Card className="w-full max-w-lg shadow-2xl border-0">
        <CardContent className="p-8 text-center space-y-4">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
          <h2 className="text-xl font-bold font-display">Report Submitted!</h2>
          <p className="text-muted-foreground text-sm">Your report has been received and will be reviewed by the Volunteer Coordinator.</p>
          <Button
            className="bg-[hsl(45,92%,53%)] text-[hsl(230,60%,12%)] hover:bg-[hsl(45,92%,45%)] font-semibold"
            onClick={() => setSubmitted(false)}
          >
            Submit Another Report
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-lg shadow-2xl border-0">
      <CardHeader className="bg-[hsl(45,92%,53%)] rounded-t-lg py-4">
        <CardTitle className="text-[hsl(230,60%,12%)] text-xl font-display font-black flex items-center gap-2">
          <FileText className="w-5 h-5" />
          Staff Reporting Form
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6 space-y-4">
        <div>
          <Label>Report Type</Label>
          <Select value={form.report_type} onValueChange={v => update('report_type', v)}>
            <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="hours">Submit Volunteer Hours</SelectItem>
              <SelectItem value="evaluation">Performance Evaluation</SelectItem>
              <SelectItem value="both">Both</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div><Label>Your Name *</Label><Input value={form.reporter_name} onChange={e => update('reporter_name', e.target.value)} className="mt-1" required /></div>
        <div><Label>Volunteer Name *</Label><Input value={form.volunteer_name} onChange={e => update('volunteer_name', e.target.value)} className="mt-1" required /></div>
        {(form.report_type === 'hours' || form.report_type === 'both') && (
          <>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Date</Label><Input type="date" value={form.date} onChange={e => update('date', e.target.value)} className="mt-1" /></div>
              <div><Label>Hours</Label><Input type="number" min={0} step={0.5} value={form.hours} onChange={e => update('hours', e.target.value)} className="mt-1" /></div>
            </div>
            <div><Label>Position / Role</Label><Input value={form.position} onChange={e => update('position', e.target.value)} className="mt-1" /></div>
          </>
        )}
        <div><Label>Notes</Label><Textarea value={form.notes} onChange={e => update('notes', e.target.value)} rows={2} className="mt-1" /></div>
        {(form.report_type === 'evaluation' || form.report_type === 'both') && (
          <div><Label>Evaluation Notes</Label><Textarea value={form.evaluation_notes} onChange={e => update('evaluation_notes', e.target.value)} rows={3} className="mt-1" placeholder="Describe volunteer's performance, strengths, areas for improvement..." /></div>
        )}
        <Button
          className="w-full bg-[hsl(45,92%,53%)] text-[hsl(230,60%,12%)] hover:bg-[hsl(45,92%,45%)] font-semibold"
          onClick={() => submitMutation.mutate()}
          disabled={submitMutation.isPending || !form.reporter_name || !form.volunteer_name}
        >
          {submitMutation.isPending ? 'Submitting...' : 'Submit Report'}
        </Button>
      </CardContent>
    </Card>
  );
}