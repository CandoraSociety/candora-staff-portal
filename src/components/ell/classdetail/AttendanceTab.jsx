import React, { useEffect, useMemo, useState } from 'react';
import { eachDayOfInterval, format } from 'date-fns';
import { CalendarDays, Save } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';

const parseLocalDate = (str) => {
  if (!str) return null;
  const [y, m, d] = str.split('-').map(Number);
  return new Date(y, m - 1, d);
};

const STATUS_OPTIONS = [
  { value: 'present', label: 'Present', active: 'bg-success text-white' },
  { value: 'late', label: 'Late', active: 'bg-warning text-white' },
  { value: 'absent', label: 'Absent', active: 'bg-destructive text-white' },
];

export default function AttendanceTab({ cls, participants, userName, saveClass }) {
  const { toast } = useToast();
  const attendance = cls.attendance || [];

  // All class dates generated from schedule days between start/end dates
  const classDates = useMemo(() => {
    const start = cls.start_date ? parseLocalDate(cls.start_date) : null;
    const end = cls.end_date ? parseLocalDate(cls.end_date) : null;
    if (!start || !end || !(cls.schedule_days || []).length || end < start) return [];
    return eachDayOfInterval({ start, end })
      .filter(d => cls.schedule_days.includes(format(d, 'eeee').toLowerCase()))
      .map(d => format(d, 'yyyy-MM-dd'));
  }, [cls.start_date, cls.end_date, cls.schedule_days]);

  const [selectedDate, setSelectedDate] = useState(() => {
    const today = format(new Date(), 'yyyy-MM-dd');
    const past = classDates.filter(d => d <= today);
    return past.length ? past[past.length - 1] : (classDates[0] || '');
  });
  const [statuses, setStatuses] = useState({});
  const [saving, setSaving] = useState(false);

  // Load saved statuses for the selected date (or default everyone to present)
  useEffect(() => {
    if (!selectedDate) return;
    const entry = attendance.find(a => a.date === selectedDate);
    if (entry) {
      setStatuses(entry.statuses || {});
    } else {
      const init = {};
      participants.forEach(p => { init[p.id] = 'present'; });
      setStatuses(init);
    }
  }, [selectedDate, participants, attendance]);

  const existing = attendance.find(a => a.date === selectedDate);

  const handleSave = async () => {
    if (!selectedDate) return;
    setSaving(true);
    try {
      const entry = {
        id: existing?.id || crypto.randomUUID(),
        date: selectedDate,
        statuses,
        recorded_by_name: userName,
        recorded_date: new Date().toISOString(),
      };
      const others = attendance.filter(a => a.date !== selectedDate);
      await saveClass({ attendance: [...others, entry] });
      toast({ title: 'Attendance saved', description: format(parseLocalDate(selectedDate), 'MMM d, yyyy') });
    } catch (e) {
      toast({ title: e.message, variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const history = [...attendance].sort((a, b) => (b.date || '').localeCompare(a.date || ''));

  return (
    <div className="grid gap-4 lg:grid-cols-2 items-start">
      <Card>
        <CardContent className="p-4 space-y-4">
          <h3 className="font-semibold text-sm flex items-center gap-2"><CalendarDays className="h-4 w-4" />Mark Attendance</h3>
          {classDates.length === 0 ? (
            <p className="text-sm text-muted-foreground">Add schedule days and start/end dates to this class to take attendance.</p>
          ) : (
            <>
              <div>
                <Label>Class date</Label>
                <select
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
                >
                  {classDates.map(d => (
                    <option key={d} value={d}>{format(parseLocalDate(d), 'EEE, MMM d, yyyy')}</option>
                  ))}
                </select>
              </div>
              {participants.length === 0 ? (
                <p className="text-sm text-muted-foreground">No learners assigned to this class yet.</p>
              ) : (
                <div>
                  {participants.map(p => (
                    <div key={p.id} className="flex items-center justify-between gap-3 py-2 border-b last:border-0">
                      <p className="text-sm font-medium">{p.first_name} {p.last_name}</p>
                      <div className="flex gap-1">
                        {STATUS_OPTIONS.map(o => (
                          <button
                            key={o.value}
                            type="button"
                            onClick={() => setStatuses(s => ({ ...s, [p.id]: o.value }))}
                            className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${statuses[p.id] === o.value ? o.active : 'bg-muted text-muted-foreground hover:bg-muted/80'}`}
                          >
                            {o.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                  <Button className="mt-4 w-full" onClick={handleSave} disabled={saving}>
                    <Save className="h-4 w-4 mr-2" />{existing ? 'Update' : 'Save'} Attendance
                  </Button>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4">
          <h3 className="font-semibold text-sm mb-3">Attendance History</h3>
          {history.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">No attendance recorded yet.</p>
          ) : (
            history.map(a => {
              const vals = Object.values(a.statuses || {});
              const present = vals.filter(v => v === 'present').length;
              const late = vals.filter(v => v === 'late').length;
              const absent = vals.filter(v => v === 'absent').length;
              return (
                <div key={a.id} className="flex items-center justify-between gap-2 py-2 border-b last:border-0 text-sm">
                  <button className="font-medium hover:underline text-left" onClick={() => setSelectedDate(a.date)}>
                    {format(parseLocalDate(a.date), 'EEE, MMM d, yyyy')}
                  </button>
                  <span className="text-xs text-muted-foreground shrink-0">{present} present · {late} late · {absent} absent</span>
                </div>
              );
            })
          )}
        </CardContent>
      </Card>
    </div>
  );
}