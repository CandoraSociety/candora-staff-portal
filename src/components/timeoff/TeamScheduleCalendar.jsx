import React, { useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const DAY_MS = 24 * 60 * 60 * 1000;
const pad = n => String(n).padStart(2, '0');
const parseDay = s => s ? Date.UTC(Number(s.slice(0, 4)), Number(s.slice(5, 7)) - 1, Number(s.slice(8, 10))) : null;
const localKey = d => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

const TYPE_STYLES = {
  vacation: { label: 'Vacation', chip: 'bg-blue-100 text-blue-800 border-blue-300' },
  sick: { label: 'Sick Time', chip: 'bg-rose-100 text-rose-800 border-rose-300' },
  personal: { label: 'Personal Day', chip: 'bg-amber-100 text-amber-800 border-amber-300' },
  timesheet: { label: 'Timesheets', chip: 'bg-slate-200 text-slate-700 border-slate-400' },
};

// Month calendar of a supervisor's staff time-off and timesheet dates.
// Chips are coloured by type, labelled with the employee, and can be
// filtered by type and by employee.
export default function TeamScheduleCalendar({ timeOff = [], timesheets = [] }) {
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());
  const [types, setTypes] = useState(['vacation', 'sick', 'personal', 'timesheet']);
  const [employee, setEmployee] = useState('all');

  const employees = useMemo(() => {
    const map = new Map();
    for (const r of [...timeOff, ...timesheets]) {
      const email = (r.employee_email || '').toLowerCase();
      if (email) map.set(email, r.employee_name || r.employee_email);
    }
    return [...map.entries()]
      .map(([email, name]) => ({ email, name }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [timeOff, timesheets]);

  const eventsByDay = useMemo(() => {
    const map = {};
    const push = (day, ev) => {
      const k = localKey(new Date(day));
      (map[k] = map[k] || []).push(ev);
    };
    const matchEmp = r => employee === 'all' || (r.employee_email || '').toLowerCase() === employee;
    if (types.includes('vacation') || types.includes('sick') || types.includes('personal')) {
      for (const r of timeOff) {
        if (!types.includes(r.kind) || !matchEmp(r)) continue;
        let d = parseDay(r.start_date);
        const end = parseDay(r.end_date || r.start_date);
        if (d == null || end == null) continue;
        let i = 0;
        while (d <= end && i < 62) {
          push(d, { id: `${r.id}:${i}`, employee: r.employee_name || r.employee_email, type: r.kind, status: r.status, hours: r.hours_per_day });
          d += DAY_MS; i++;
        }
      }
    }
    if (types.includes('timesheet')) {
      for (const t of timesheets) {
        if (!matchEmp(t)) continue;
        let d = parseDay(t.pay_period_start);
        const end = parseDay(t.pay_period_end);
        if (d == null || end == null) continue;
        let i = 0;
        while (d <= end && i < 62) {
          push(d, { id: `${t.id}:${i}`, employee: t.employee_name || t.employee_email, type: 'timesheet', status: t.status, hours: null });
          d += DAY_MS; i++;
        }
      }
    }
    for (const k of Object.keys(map)) map[k].sort((a, b) => a.employee.localeCompare(b.employee));
    return map;
  }, [timeOff, timesheets, types, employee]);

  const monthStart = new Date(year, month, 1);
  const gridStart = new Date(year, month, 1 - monthStart.getDay());
  const cells = [];
  for (let i = 0; i < 42; i++) {
    cells.push(new Date(gridStart.getFullYear(), gridStart.getMonth(), gridStart.getDate() + i));
  }
  const monthTitle = monthStart.toLocaleString('en-CA', { month: 'long', year: 'numeric' });
  const todayKey = localKey(today);

  const prevMonth = () => { if (month === 0) { setYear(y => y - 1); setMonth(11); } else setMonth(m => m - 1); };
  const nextMonth = () => { if (month === 11) { setYear(y => y + 1); setMonth(0); } else setMonth(m => m + 1); };
  const toggleType = t => setTypes(prev => prev.includes(t) ? prev.filter(x => x !== t) : [...prev, t]);

  const chipTitle = ev =>
    `${ev.employee} — ${TYPE_STYLES[ev.type].label}${ev.status === 'pending' ? ' (pending approval)' : ''}${ev.hours ? ` · ${ev.hours} hrs/day` : ''}`;

  return (
    <div className="space-y-4">
      {/* Toolbar: month nav + type + employee filters */}
      <div className="flex flex-wrap items-center gap-3 justify-between">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" className="h-8 w-8" onClick={prevMonth}><ChevronLeft className="h-4 w-4" /></Button>
          <h2 className="text-lg font-semibold min-w-[170px] text-center">{monthTitle}</h2>
          <Button variant="outline" size="icon" className="h-8 w-8" onClick={nextMonth}><ChevronRight className="h-4 w-4" /></Button>
          <Button variant="outline" size="sm" className="h-8" onClick={() => { setYear(today.getFullYear()); setMonth(today.getMonth()); }}>Today</Button>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {Object.entries(TYPE_STYLES).map(([k, cfg]) => (
            <button
              key={k}
              onClick={() => toggleType(k)}
              className={`rounded-full border px-3 py-1 text-xs font-medium transition-opacity ${types.includes(k) ? cfg.chip : 'bg-muted text-muted-foreground border-border opacity-60'}`}
            >
              {cfg.label}
            </button>
          ))}
          <Select value={employee} onValueChange={setEmployee}>
            <SelectTrigger className="w-[220px] h-8"><SelectValue placeholder="Employee" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Employees</SelectItem>
              {employees.map(e => <SelectItem key={e.email} value={e.email}>{e.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Month grid */}
      <div className="rounded-2xl border bg-card overflow-hidden">
        <div className="grid grid-cols-7 border-b bg-muted/40">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(dn => (
            <div key={dn} className="px-2 py-1.5 text-xs font-semibold text-muted-foreground text-center">{dn}</div>
          ))}
        </div>
        <div className="grid grid-cols-7">
          {cells.map(d => {
            const k = localKey(d);
            const evs = eventsByDay[k] || [];
            const inMonth = d.getMonth() === month;
            return (
              <div key={k} className={`min-h-[104px] border-b border-r last:border-r-0 p-1.5 ${inMonth ? 'bg-card' : 'bg-muted/20 opacity-50'} ${k === todayKey ? 'ring-1 ring-primary ring-inset' : ''}`}>
                <div className="text-xs font-medium text-muted-foreground mb-1">{d.getDate()}</div>
                <div className="space-y-1">
                  {evs.slice(0, 4).map(ev => (
                    <div key={ev.id} title={chipTitle(ev)}
                      className={`truncate rounded border px-1 py-0.5 text-[10px] leading-tight ${TYPE_STYLES[ev.type].chip}`}>
                      {ev.type === 'timesheet' ? 'TS' : TYPE_STYLES[ev.type].label.split(' ')[0]} · {ev.employee}{ev.status === 'pending' ? ' · pending' : ''}
                    </div>
                  ))}
                  {evs.length > 4 && <div className="text-[10px] text-muted-foreground">+{evs.length - 4} more</div>}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
        {Object.entries(TYPE_STYLES).map(([k, cfg]) => (
          <span key={k} className="flex items-center gap-1.5">
            <span className={`inline-block w-3 h-3 rounded border ${cfg.chip}`} /> {cfg.label}
          </span>
        ))}
        <span>“pending” = awaiting supervisor approval</span>
      </div>
    </div>
  );
}