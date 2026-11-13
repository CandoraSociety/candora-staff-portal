import React, { useEffect, useMemo, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/use-toast';
import { Loader2, Plus, X } from 'lucide-react';

const toNum = v => { const n = Number(v); return Number.isFinite(n) ? n : 0; };
const round = n => Math.round(n * 100) / 100;
const str = v => (v === 0 || v == null ? '' : String(v));

// Same auto-calculation the employee form uses: start/end less break.
function calcRowHours(start, end, breakH) {
  if (!start || !end) return null;
  const [sh, sm] = start.split(':').map(Number);
  const [eh, em] = end.split(':').map(Number);
  let hrs = (eh * 60 + em - (sh * 60 + sm)) / 60;
  if (hrs < 0) hrs += 24;
  return Math.round((hrs - (Number(breakH) || 0)) * 100) / 100;
}

const blankAdditional = () => ({ date: '', start_time: '', end_time: '', break_hours: '', paid_hours: '' });

// A supervisor correcting a staff member's submitted hours before approving:
// the days, paid leave, banked and additional hours are all editable, and the
// totals are recalculated from what the supervisor enters.
export default function TimesheetEditDialog({ open, onOpenChange, timesheet, onSaved }) {
  const { toast } = useToast();
  const [regular, setRegular] = useState([]);
  const [additional, setAdditional] = useState([]);
  const [splitLeave, setSplitLeave] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!open || !timesheet) return;
    const regs = timesheet.regular_entries || [];
    setSplitLeave(regs.some(r => r.vacation_hours != null || r.sick_hours != null || r.personal_hours != null));
    setRegular(regs.map(r => ({
      day: r.day || '',
      date: r.date || '',
      start_time: r.start_time || '',
      end_time: r.end_time || '',
      break_hours: str(r.break_hours),
      total_hours: str(r.total_hours),
      vacation_hours: str(r.vacation_hours),
      sick_hours: str(r.sick_hours),
      personal_hours: str(r.personal_hours),
      paid_leave_hours: str(r.paid_leave_hours),
      banked_hours: str(r.banked_hours),
    })));
    setAdditional((timesheet.additional_entries || []).map(r => ({
      date: r.date || '',
      start_time: r.start_time || '',
      end_time: r.end_time || '',
      break_hours: str(r.break_hours),
      paid_hours: str(r.paid_hours),
    })));
    setError('');
  }, [open, timesheet]);

  const updateRegular = (idx, field, value) => {
    setRegular(prev => prev.map((r, i) => {
      if (i !== idx) return r;
      const next = { ...r, [field]: value };
      const auto = calcRowHours(next.start_time, next.end_time, next.break_hours);
      if (auto !== null) next.total_hours = String(auto);
      return next;
    }));
  };

  const updateAdditional = (idx, field, value) => {
    setAdditional(prev => prev.map((r, i) => {
      if (i !== idx) return r;
      const next = { ...r, [field]: value };
      const auto = calcRowHours(next.start_time, next.end_time, next.break_hours);
      if (auto !== null) next.paid_hours = String(auto);
      return next;
    }));
  };

  const totals = useMemo(() => {
    const reg = regular.reduce((s, r) => s + toNum(r.total_hours), 0);
    const vacation = regular.reduce((s, r) => s + toNum(r.vacation_hours), 0);
    const sick = regular.reduce((s, r) => s + toNum(r.sick_hours), 0);
    const personal = regular.reduce((s, r) => s + toNum(r.personal_hours), 0);
    const paidLeave = splitLeave
      ? vacation + sick + personal
      : regular.reduce((s, r) => s + toNum(r.paid_leave_hours), 0);
    const banked = regular.reduce((s, r) => s + toNum(r.banked_hours), 0);
    const extra = additional.reduce((s, r) => s + toNum(r.paid_hours), 0);
    return { reg, vacation, sick, personal, paidLeave, banked, extra, paid: reg + paidLeave + extra };
  }, [regular, additional, splitLeave]);

  const save = async () => {
    if (!timesheet) return;
    setSaving(true);
    setError('');
    try {
      const regularEntries = regular.map(r => {
        const row = {
          day: r.day,
          date: r.date,
          start_time: r.start_time,
          end_time: r.end_time,
          break_hours: toNum(r.break_hours),
          total_hours: toNum(r.total_hours),
          banked_hours: toNum(r.banked_hours),
        };
        if (splitLeave) {
          row.vacation_hours = toNum(r.vacation_hours);
          row.sick_hours = toNum(r.sick_hours);
          row.personal_hours = toNum(r.personal_hours);
          row.paid_leave_hours = round(row.vacation_hours + row.sick_hours + row.personal_hours);
        } else {
          row.paid_leave_hours = toNum(r.paid_leave_hours);
        }
        return row;
      });

      const additionalEntries = additional
        .filter(r => r.date || r.start_time || r.end_time || r.paid_hours)
        .map(r => ({
          date: r.date,
          start_time: r.start_time,
          end_time: r.end_time,
          break_hours: toNum(r.break_hours),
          paid_hours: toNum(r.paid_hours),
        }));

      const patch = {
        regular_entries: regularEntries,
        additional_entries: additionalEntries,
        total_regular_hours: round(totals.reg),
        total_paid_leave_hours: round(totals.paidLeave),
        total_banked_hours: round(totals.banked),
        total_additional_hours: round(totals.extra),
        total_paid_hours: round(totals.paid),
      };
      if (splitLeave) {
        patch.total_vacation_hours = round(totals.vacation);
        patch.total_sick_hours = round(totals.sick);
        patch.total_personal_hours = round(totals.personal);
      }

      await base44.entities.Timesheet.update(timesheet.id, patch);
      toast({ title: 'Timesheet updated', description: 'Your changes were saved. Approve it when you are satisfied.' });
      onSaved?.();
      onOpenChange(false);
    } catch (err) {
      setError(err.message || 'That could not be saved.');
    } finally {
      setSaving(false);
    }
  };

  if (!timesheet) return null;

  const cellInput = 'h-8 px-2 min-w-[72px]';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit timesheet — {timesheet.employee_name}</DialogTitle>
          <DialogDescription>
            {timesheet.pay_period_start} → {timesheet.pay_period_end}. Correct any hours before approving; totals
            update automatically.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5">
          <div>
            <h3 className="font-semibold text-sm mb-2">Regular Scheduled Hours</h3>
            <div className="overflow-x-auto rounded-xl border">
              <table className="w-full text-sm min-w-[860px]">
                <thead className="bg-muted/50 text-left text-xs">
                  <tr>
                    <th className="px-2 py-2 font-medium">Day</th>
                    <th className="px-2 py-2 font-medium">Date</th>
                    <th className="px-2 py-2 font-medium">Start</th>
                    <th className="px-2 py-2 font-medium">Break</th>
                    <th className="px-2 py-2 font-medium">End</th>
                    <th className="px-2 py-2 font-medium">Total Paid</th>
                    {splitLeave ? (
                      <>
                        <th className="px-2 py-2 font-medium">Vacation</th>
                        <th className="px-2 py-2 font-medium">Sick</th>
                        <th className="px-2 py-2 font-medium">Personal</th>
                      </>
                    ) : (
                      <th className="px-2 py-2 font-medium">Paid Leave</th>
                    )}
                    <th className="px-2 py-2 font-medium">Banked</th>
                  </tr>
                </thead>
                <tbody>
                  {regular.map((r, i) => (
                    <tr key={`${r.date}-${i}`} className="border-t">
                      <td className="px-2 py-1.5 font-medium whitespace-nowrap">{r.day}</td>
                      <td className="px-2 py-1.5 whitespace-nowrap text-muted-foreground text-xs">{r.date}</td>
                      <td className="px-1 py-1">
                        <Input type="time" className={cellInput} value={r.start_time} onChange={e => updateRegular(i, 'start_time', e.target.value)} />
                      </td>
                      <td className="px-1 py-1">
                        <Input type="number" step="0.25" min="0" className={cellInput} value={r.break_hours} placeholder="0" onChange={e => updateRegular(i, 'break_hours', e.target.value)} />
                      </td>
                      <td className="px-1 py-1">
                        <Input type="time" className={cellInput} value={r.end_time} onChange={e => updateRegular(i, 'end_time', e.target.value)} />
                      </td>
                      <td className="px-1 py-1">
                        <Input type="number" step="0.25" min="0" className={cellInput} value={r.total_hours} placeholder="0" onChange={e => updateRegular(i, 'total_hours', e.target.value)} />
                      </td>
                      {splitLeave ? (
                        <>
                          {['vacation_hours', 'sick_hours', 'personal_hours'].map(field => (
                            <td key={field} className="px-1 py-1">
                              <Input type="number" step="0.25" min="0" className={cellInput} value={r[field]} placeholder="0" onChange={e => updateRegular(i, field, e.target.value)} />
                            </td>
                          ))}
                        </>
                      ) : (
                        <td className="px-1 py-1">
                          <Input type="number" step="0.25" min="0" className={cellInput} value={r.paid_leave_hours} placeholder="0" onChange={e => updateRegular(i, 'paid_leave_hours', e.target.value)} />
                        </td>
                      )}
                      <td className="px-1 py-1">
                        <Input type="number" step="0.25" className={cellInput} value={r.banked_hours} placeholder="0" onChange={e => updateRegular(i, 'banked_hours', e.target.value)} />
                      </td>
                    </tr>
                  ))}
                  <tr className="border-t bg-muted/40 font-semibold">
                    <td colSpan={5} className="px-2 py-2 text-right">Totals</td>
                    <td className="px-2 py-2">{round(totals.reg)}</td>
                    {splitLeave ? (
                      <>
                        <td className="px-2 py-2">{round(totals.vacation)}</td>
                        <td className="px-2 py-2">{round(totals.sick)}</td>
                        <td className="px-2 py-2">{round(totals.personal)}</td>
                      </>
                    ) : (
                      <td className="px-2 py-2">{round(totals.paidLeave)}</td>
                    )}
                    <td className="px-2 py-2">{round(totals.banked)}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <div>
            <h3 className="font-semibold text-sm mb-2">Additional Hours</h3>
            {additional.length === 0 ? (
              <p className="text-xs text-muted-foreground">None on this timesheet.</p>
            ) : (
              <div className="overflow-x-auto rounded-xl border">
                <table className="w-full text-sm min-w-[520px]">
                  <thead className="bg-muted/50 text-left text-xs">
                    <tr>
                      <th className="px-2 py-2 font-medium">Date</th>
                      <th className="px-2 py-2 font-medium">Start</th>
                      <th className="px-2 py-2 font-medium">Break</th>
                      <th className="px-2 py-2 font-medium">End</th>
                      <th className="px-2 py-2 font-medium">Paid</th>
                      <th className="w-8"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {additional.map((r, i) => (
                      <tr key={i} className="border-t">
                        <td className="px-1 py-1">
                          <Input type="date" className={cellInput} value={r.date} onChange={e => updateAdditional(i, 'date', e.target.value)} />
                        </td>
                        <td className="px-1 py-1">
                          <Input type="time" className={cellInput} value={r.start_time} onChange={e => updateAdditional(i, 'start_time', e.target.value)} />
                        </td>
                        <td className="px-1 py-1">
                          <Input type="number" step="0.25" min="0" className={cellInput} value={r.break_hours} placeholder="0" onChange={e => updateAdditional(i, 'break_hours', e.target.value)} />
                        </td>
                        <td className="px-1 py-1">
                          <Input type="time" className={cellInput} value={r.end_time} onChange={e => updateAdditional(i, 'end_time', e.target.value)} />
                        </td>
                        <td className="px-1 py-1">
                          <Input type="number" step="0.25" min="0" className={cellInput} value={r.paid_hours} placeholder="0" onChange={e => updateAdditional(i, 'paid_hours', e.target.value)} />
                        </td>
                        <td className="px-1 py-1">
                          <button
                            type="button"
                            className="text-muted-foreground hover:text-destructive px-1"
                            onClick={() => setAdditional(prev => prev.filter((_, x) => x !== i))}
                            aria-label="Remove row"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            <Button type="button" variant="outline" size="sm" className="mt-2" onClick={() => setAdditional(prev => [...prev, blankAdditional()])}>
              <Plus className="h-4 w-4" /> Add row
            </Button>
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <div className="flex flex-wrap items-center justify-between gap-3 border-t pt-4">
            <p className="text-sm">
              Total hours paid: <span className="text-lg font-bold">{round(totals.paid)}</span>
              <span className="text-xs text-muted-foreground"> (banked {round(totals.banked)})</span>
            </p>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>Cancel</Button>
              <Button onClick={save} disabled={saving}>
                {saving && <Loader2 className="h-4 w-4 animate-spin" />} Save changes
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}