import React, { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';
import { getPayPeriod, getPeriodDays, periodLabel, ymd } from '@/lib/payPeriods';

// Auto-calculate a day's paid hours from start/end times minus break.
// Returns null when times aren't both present (total can then be typed manually).
function calcRowHours(start, end, breakH) {
  if (!start || !end) return null;
  const [sh, sm] = start.split(':').map(Number);
  const [eh, em] = end.split(':').map(Number);
  let hrs = (eh * 60 + em - (sh * 60 + sm)) / 60;
  if (hrs < 0) hrs += 24; // overnight shift
  const b = Number(breakH) || 0;
  return Math.round((hrs - b) * 100) / 100;
}

const toNum = v => { const n = Number(v); return Number.isFinite(n) ? n : 0; };
const blankAdditionalRow = () => ({ date: '', start_time: '', end_time: '', break_hours: '', paid_hours: '' });

export default function TimesheetForm({ user, onSubmitted }) {
  const { toast } = useToast();
  const period = useMemo(() => getPayPeriod(new Date()), []);
  const periodDays = useMemo(() => getPeriodDays(period), [period]);

  const blankRegular = () => periodDays.map(d => ({
    day: d.dayLabel, date: d.date, start_time: '', end_time: '', break_hours: '', total_hours: '', paid_leave_hours: '', banked_hours: '',
  }));

  const [regularRows, setRegularRows] = useState(blankRegular);
  const [additionalRows, setAdditionalRows] = useState([blankAdditionalRow()]);
  const [supervisorEmail, setSupervisorEmail] = useState('');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const { data: employees = [] } = useQuery({
    queryKey: ['timesheet-supervisors'],
    queryFn: () => base44.entities.Employee.list(),
  });
  const supervisors = employees
    .filter(e => !e.access_disabled && e.status !== 'terminated')
    .map(e => ({ email: e.email, name: `${e.first_name || ''} ${e.last_name || ''}`.trim() }))
    .sort((a, b) => a.name.localeCompare(b.name));

  const updateRegular = (idx, field, value) => {
    setRegularRows(prev => prev.map((r, i) => {
      if (i !== idx) return r;
      const next = { ...r, [field]: value };
      const auto = calcRowHours(next.start_time, next.end_time, next.break_hours);
      if (auto !== null) next.total_hours = String(auto);
      return next;
    }));
  };

  const updateAdditional = (idx, field, value) => {
    setAdditionalRows(prev => prev.map((r, i) => {
      if (i !== idx) return r;
      const next = { ...r, [field]: value };
      const auto = calcRowHours(next.start_time, next.end_time, next.break_hours);
      if (auto !== null) next.paid_hours = String(auto);
      return next;
    }));
  };

  const totals = useMemo(() => {
    const total_regular = regularRows.reduce((s, r) => s + toNum(r.total_hours), 0);
    const paid_leave = regularRows.reduce((s, r) => s + toNum(r.paid_leave_hours), 0);
    const banked = regularRows.reduce((s, r) => s + toNum(r.banked_hours), 0);
    const additional = additionalRows.reduce((s, r) => s + toNum(r.paid_hours), 0);
    return { total_regular, paid_leave, banked, additional, total_paid: total_regular + paid_leave + additional };
  }, [regularRows, additionalRows]);

  const submit = async () => {
    if (!supervisorEmail) {
      toast({ title: 'Select your supervisor', description: 'Choose who should review this timesheet.', variant: 'destructive' });
      return;
    }
    if (totals.total_paid + totals.banked <= 0) {
      toast({ title: 'No hours entered', description: 'Enter hours on at least one day before submitting.', variant: 'destructive' });
      return;
    }
    const supervisor = supervisors.find(s => s.email === supervisorEmail);
    setSubmitting(true);
    try {
      await base44.entities.Timesheet.create({
        employee_name: user?.full_name || user?.email,
        employee_email: user?.email,
        supervisor_name: supervisor?.name || '',
        supervisor_email: supervisorEmail,
        pay_period_start: ymd(period.start),
        pay_period_end: ymd(period.end),
        regular_entries: regularRows.map(r => ({
          ...r,
          break_hours: toNum(r.break_hours),
          total_hours: toNum(r.total_hours),
          paid_leave_hours: toNum(r.paid_leave_hours),
          banked_hours: toNum(r.banked_hours),
        })),
        additional_entries: additionalRows
          .filter(r => r.date || r.start_time || r.end_time || r.paid_hours)
          .map(r => ({ ...r, break_hours: toNum(r.break_hours), paid_hours: toNum(r.paid_hours) })),
        total_regular_hours: totals.total_regular,
        total_paid_leave_hours: totals.paid_leave,
        total_banked_hours: totals.banked,
        total_additional_hours: totals.additional,
        total_paid_hours: totals.total_paid,
        employee_notes: notes,
        status: 'pending',
        submitted_date: ymd(Date.now()),
      });
      toast({ title: 'Timesheet submitted', description: `Sent to ${supervisor?.name} for approval.` });
      onSubmitted?.();
      setSupervisorEmail('');
      setNotes('');
      setRegularRows(blankRegular());
      setAdditionalRows([blankAdditionalRow()]);
    } finally {
      setSubmitting(false);
    }
  };

  const cellInput = 'h-8 px-2';

  return (
    <div className="space-y-6">
      {/* Pay period + supervisor */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="rounded-xl border bg-muted/30 p-4">
          <Label className="text-xs text-muted-foreground">Pay Period (auto-filled)</Label>
          <p className="font-bold text-lg mt-1">{periodLabel(period)}</p>
          <p className="text-xs text-muted-foreground mt-1">
            Submissions through the Wednesday after a period ends count for that period.
          </p>
        </div>
        <div>
          <Label>Supervisor (for approval)</Label>
          <Select value={supervisorEmail} onValueChange={setSupervisorEmail}>
            <SelectTrigger className="w-full mt-1.5">
              <SelectValue placeholder="Select your supervisor" />
            </SelectTrigger>
            <SelectContent>
              {supervisors.map(s => (
                <SelectItem key={s.email} value={s.email}>{s.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Regular Scheduled Hours */}
      <div>
        <h2 className="font-semibold mb-2">Regular Scheduled Hours</h2>
        <div className="overflow-x-auto rounded-xl border">
          <table className="w-full text-sm min-w-[760px]">
            <thead className="bg-muted/50 text-left text-xs">
              <tr>
                <th className="px-2 py-2 font-medium">Day</th>
                <th className="px-2 py-2 font-medium">Date</th>
                <th className="px-2 py-2 font-medium">Start Time</th>
                <th className="px-2 py-2 font-medium">Break (hrs)</th>
                <th className="px-2 py-2 font-medium">End Time</th>
                <th className="px-2 py-2 font-medium">Total Paid Hrs</th>
                <th className="px-2 py-2 font-medium">Paid Leave (sick etc)</th>
                <th className="px-2 py-2 font-medium">Banked (+/- hrs)</th>
              </tr>
            </thead>
            <tbody>
              {regularRows.map((r, i) => (
                <tr key={r.date} className="border-t">
                  <td className="px-2 py-1.5 font-medium whitespace-nowrap">{r.day}</td>
                  <td className="px-2 py-1.5 whitespace-nowrap text-muted-foreground">{r.date}</td>
                  <td className="px-1 py-1"><Input type="time" className={cellInput} value={r.start_time} onChange={e => updateRegular(i, 'start_time', e.target.value)} /></td>
                  <td className="px-1 py-1"><Input type="number" step="0.25" min="0" className={cellInput} placeholder="0" value={r.break_hours} onChange={e => updateRegular(i, 'break_hours', e.target.value)} /></td>
                  <td className="px-1 py-1"><Input type="time" className={cellInput} value={r.end_time} onChange={e => updateRegular(i, 'end_time', e.target.value)} /></td>
                  <td className="px-1 py-1"><Input type="number" step="0.25" min="0" className={cellInput} placeholder="0" value={r.total_hours} onChange={e => updateRegular(i, 'total_hours', e.target.value)} /></td>
                  <td className="px-1 py-1"><Input type="number" step="0.25" min="0" className={cellInput} placeholder="0" value={r.paid_leave_hours} onChange={e => updateRegular(i, 'paid_leave_hours', e.target.value)} /></td>
                  <td className="px-1 py-1"><Input type="number" step="0.25" className={cellInput} placeholder="0" value={r.banked_hours} onChange={e => updateRegular(i, 'banked_hours', e.target.value)} /></td>
                </tr>
              ))}
              <tr className="border-t bg-muted/40 font-semibold">
                <td colSpan={5} className="px-2 py-2 text-right">Totals</td>
                <td className="px-2 py-2">{Math.round(totals.total_regular * 100) / 100}</td>
                <td className="px-2 py-2">{Math.round(totals.paid_leave * 100) / 100}</td>
                <td className="px-2 py-2">{Math.round(totals.banked * 100) / 100}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Additional Hours */}
      <div>
        <h2 className="font-semibold mb-2">Additional Hours <span className="text-xs font-normal text-muted-foreground">(in addition to regular scheduled hours)</span></h2>
        <div className="overflow-x-auto rounded-xl border">
          <table className="w-full text-sm min-w-[560px]">
            <thead className="bg-muted/50 text-left text-xs">
              <tr>
                <th className="px-2 py-2 font-medium">Date</th>
                <th className="px-2 py-2 font-medium">Start Time</th>
                <th className="px-2 py-2 font-medium">Break (hrs)</th>
                <th className="px-2 py-2 font-medium">End Time</th>
                <th className="px-2 py-2 font-medium">Paid (hrs)</th>
                <th className="w-8"></th>
              </tr>
            </thead>
            <tbody>
              {additionalRows.map((r, i) => (
                <tr key={i} className="border-t">
                  <td className="px-1 py-1"><Input type="date" className={cellInput} min={ymd(period.start)} max={ymd(period.end)} value={r.date} onChange={e => updateAdditional(i, 'date', e.target.value)} /></td>
                  <td className="px-1 py-1"><Input type="time" className={cellInput} value={r.start_time} onChange={e => updateAdditional(i, 'start_time', e.target.value)} /></td>
                  <td className="px-1 py-1"><Input type="number" step="0.25" min="0" className={cellInput} placeholder="0" value={r.break_hours} onChange={e => updateAdditional(i, 'break_hours', e.target.value)} /></td>
                  <td className="px-1 py-1"><Input type="time" className={cellInput} value={r.end_time} onChange={e => updateAdditional(i, 'end_time', e.target.value)} /></td>
                  <td className="px-1 py-1"><Input type="number" step="0.25" min="0" className={cellInput} placeholder="0" value={r.paid_hours} onChange={e => updateAdditional(i, 'paid_hours', e.target.value)} /></td>
                  <td className="px-1 py-1">
                    {additionalRows.length > 1 && (
                      <button type="button" className="text-muted-foreground hover:text-destructive text-sm px-1" onClick={() => setAdditionalRows(prev => prev.filter((_, x) => x !== i))}>✕</button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <Button type="button" variant="outline" size="sm" className="mt-2" onClick={() => setAdditionalRows(prev => [...prev, blankAdditionalRow()])}>
          + Add Row
        </Button>
      </div>

      {/* Notes + submit */}
      <div className="flex flex-col md:flex-row md:items-end gap-4">
        <div className="flex-1">
          <Label>Notes (optional)</Label>
          <Input className="mt-1.5" value={notes} onChange={e => setNotes(e.target.value)} placeholder="Anything your supervisor should know about this timesheet" />
        </div>
        <div className="text-right">
          <p className="text-xs text-muted-foreground mb-1">TOTAL HOURS PAID</p>
          <p className="text-2xl font-bold">{Math.round(totals.total_paid * 100) / 100}</p>
        </div>
        <Button onClick={submit} disabled={submitting} size="lg">
          {submitting ? 'Submitting…' : 'Submit Timesheet'}
        </Button>
      </div>
    </div>
  );
}