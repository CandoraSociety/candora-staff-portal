import { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { X, Calendar, Clock, MapPin, User, Repeat, CheckCircle2, UserX, CalendarClock } from 'lucide-react';
import { generateOccurrences, formatDateLong, toISODate, WORKSHOP_CATEGORIES } from '@/lib/workshopSchedule';
import { syncWorkshopCompletionToRoadmap } from '@/lib/workshopCompletion';

const CATEGORY_LABELS = Object.fromEntries(WORKSHOP_CATEGORIES.map(c => [c.value, c.label]));

const STATUS_LABELS = { registered: 'Registered', attended: 'Attended', no_show: 'No-show', cancelled: 'Cancelled' };
const STATUS_BADGE = {
  registered: 'bg-blue-100 text-blue-700',
  attended: 'bg-emerald-100 text-emerald-700',
  no_show: 'bg-amber-100 text-amber-700',
  cancelled: 'bg-slate-100 text-slate-500',
};

export default function WorkshopRoadmapPanel({ client, item, workshops, signups, onReload, onClientUpdate, onClose }) {
  const [busy, setBusy] = useState(false);

  const relevantWorkshops = item.fixedWorkshop
    ? [item.fixedWorkshop]
    : (workshops || []).filter(w => w.category === item.workshopCategoryKey && w.status !== 'cancelled');

  const relevantIds = new Set(relevantWorkshops.map(w => w.id));
  const mySignups = (signups || []).filter(s => relevantIds.has(s.workshop_id) && s.status !== 'cancelled');

  const upcomingDates = (w) => {
    const today = toISODate(new Date());
    return generateOccurrences(w).filter(d => d >= today).slice(0, 12);
  };

  const refreshClient = async () => {
    try {
      const fresh = await base44.entities.Client.get(client.id);
      onClientUpdate?.(fresh);
    } catch {}
  };

  const changeSession = async (signup, newDate) => {
    if (!newDate || newDate === signup.session_date) return;
    setBusy(true);
    try {
      await base44.entities.WorkshopSignup.update(signup.id, { session_date: newDate });
      await onReload?.();
    } catch (e) {
      alert('Could not change session: ' + (e.message || 'Unknown error'));
    } finally { setBusy(false); }
  };

  const register = async (workshop, date) => {
    if (!date) return;
    setBusy(true);
    try {
      await base44.entities.WorkshopSignup.create({
        workshop_id: workshop.id,
        session_date: date,
        client_id: client.id,
        attendee_name: `${client.first_name} ${client.last_name}`.trim(),
        attendee_email: client.email || '',
        signup_date: toISODate(new Date()),
        status: 'registered',
      });
      await onReload?.();
    } catch (e) {
      alert('Could not register: ' + (e.message || 'Unknown error'));
    } finally { setBusy(false); }
  };

  const setAttendance = async (signup, status) => {
    setBusy(true);
    try {
      await base44.entities.WorkshopSignup.update(signup.id, { status });
      if (status === 'attended') {
        try { await syncWorkshopCompletionToRoadmap(signup.workshop_id); } catch {}
        await refreshClient();
      }
      await onReload?.();
    } catch (e) {
      alert('Could not update attendance: ' + (e.message || 'Unknown error'));
    } finally { setBusy(false); }
  };

  const cancelSignup = async (signup) => {
    if (!confirm('Cancel this registration?')) return;
    setBusy(true);
    try {
      await base44.entities.WorkshopSignup.update(signup.id, { status: 'cancelled' });
      await onReload?.();
    } catch (e) {
      alert('Could not cancel: ' + (e.message || 'Unknown error'));
    } finally { setBusy(false); }
  };

  return (
    <div className="rounded-xl border-2 border-violet-300 bg-white shadow-lg p-4 space-y-3 max-w-xl">
      <div className="flex items-start justify-between gap-2">
        <div>
          <h4 className="font-semibold text-sm flex items-center gap-1.5">
            <CalendarClock className="w-4 h-4 text-violet-600" />
            Workshop Session
          </h4>
          {item.workshopCategoryKey && (
            <p className="text-[11px] text-slate-500">{CATEGORY_LABELS[item.workshopCategoryKey]}</p>
          )}
        </div>
        <button onClick={onClose} className="text-slate-400 hover:text-slate-600"><X className="w-4 h-4" /></button>
      </div>

      {relevantWorkshops.length === 0 ? (
        <p className="text-xs text-slate-500">No matching workshop is currently scheduled.</p>
      ) : (
        <div className="space-y-3">
          {relevantWorkshops.map(w => {
            const wSignups = mySignups.filter(s => s.workshop_id === w.id);
            const dates = upcomingDates(w);
            return (
              <div key={w.id} className="rounded-lg border border-slate-200 p-3 space-y-2">
                <div>
                  <p className="text-sm font-medium text-slate-800 flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ background: w.color || '#2563eb' }} />
                    {w.title}
                    {w.status === 'completed' && <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-100 px-1.5 py-0.5 rounded">Completed</span>}
                  </p>
                  <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-slate-500 mt-1 ml-4">
                    {w.start_time && <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {w.start_time}{w.end_time ? `–${w.end_time}` : ''}</span>}
                    {w.location && <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {w.location}</span>}
                    {w.facilitator_name && <span className="flex items-center gap-1"><User className="w-3 h-3" /> {w.facilitator_name}</span>}
                    <span className="flex items-center gap-1"><Repeat className="w-3 h-3" /> {w.recurrence_pattern === 'none' ? 'One-off' : w.recurrence_pattern}</span>
                  </div>
                </div>

                {wSignups.length === 0 ? (
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs text-slate-500">Not registered yet.</span>
                    {dates.length > 0 ? (
                      <select disabled={busy} value="" onChange={e => register(w, e.target.value)} className="h-8 rounded-md border border-slate-300 bg-white px-2 text-xs">
                        <option value="">Register for a session…</option>
                        {dates.map(d => <option key={d} value={d}>{formatDateLong(d)}{w.start_time ? ` · ${w.start_time}` : ''}</option>)}
                      </select>
                    ) : <span className="text-xs text-slate-400">No upcoming sessions.</span>}
                  </div>
                ) : (
                  wSignups.map(s => (
                    <div key={s.id} className="rounded-md bg-slate-50 border border-slate-200 p-2 space-y-2">
                      <div className="flex items-center justify-between gap-2 flex-wrap">
                        <span className="flex items-center gap-1.5 text-xs text-slate-700">
                          <Calendar className="w-3.5 h-3.5 text-slate-400" />
                          {formatDateLong(s.session_date)}{w.start_time ? ` · ${w.start_time}` : ''}
                        </span>
                        <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${STATUS_BADGE[s.status] || ''}`}>{STATUS_LABELS[s.status] || s.status}</span>
                      </div>

                      {w.status !== 'completed' && dates.length > 0 && (
                        <div className="flex items-center gap-2 text-xs">
                          <span className="text-slate-500 shrink-0">Session:</span>
                          <select disabled={busy} value={s.session_date} onChange={e => changeSession(s, e.target.value)} className="h-7 rounded-md border border-slate-300 bg-white px-2 text-xs flex-1 min-w-0">
                            {dates.map(d => <option key={d} value={d}>{formatDateLong(d)}{w.start_time ? ` · ${w.start_time}` : ''}</option>)}
                          </select>
                        </div>
                      )}

                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-xs text-slate-500">Attendance:</span>
                        <Button size="sm" variant={s.status === 'attended' ? 'default' : 'outline'} className="h-7 text-xs" disabled={busy} onClick={() => setAttendance(s, 'attended')}>
                          <CheckCircle2 className="w-3 h-3" /> Attended
                        </Button>
                        <Button size="sm" variant={s.status === 'no_show' ? 'default' : 'outline'} className="h-7 text-xs" disabled={busy} onClick={() => setAttendance(s, 'no_show')}>
                          <UserX className="w-3 h-3" /> No-show
                        </Button>
                        <Button size="sm" variant={s.status === 'registered' ? 'default' : 'outline'} className="h-7 text-xs" disabled={busy} onClick={() => setAttendance(s, 'registered')}>
                          Registered
                        </Button>
                        <Button size="sm" variant="ghost" className="h-7 text-xs text-red-500 hover:text-red-600" disabled={busy} onClick={() => cancelSignup(s)}>
                          Cancel reg.
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            );
          })}
        </div>
      )}

      <p className="text-[11px] text-slate-400">Changing the session or attendance here updates the workshop's roster automatically. Marking "Attended" on a completed workshop completes the matching action-plan item.</p>
    </div>
  );
}