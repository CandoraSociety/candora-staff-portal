import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Users, MapPin, User, Clock, Repeat, Calendar, CheckCircle2, Sparkles } from 'lucide-react';
import {
  generateOccurrences, todayISO, formatDateLong, toISODate,
  WORKSHOP_CATEGORIES, WORKSHOP_CATEGORY_KEYS,
} from '@/lib/workshopSchedule';

const CATEGORY_LABELS = Object.fromEntries(WORKSHOP_CATEGORIES.map(c => [c.value, c.label]));

const STATUS_BADGE = {
  registered: 'bg-blue-100 text-blue-700',
  attended: 'bg-emerald-100 text-emerald-700',
  cancelled: 'bg-slate-100 text-slate-500',
  no_show: 'bg-amber-100 text-amber-700',
};

export default function WorkshopsClientTab({ client }) {
  const [workshops, setWorkshops] = useState([]);
  const [signups, setSignups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [registering, setRegistering] = useState(null);

  const load = async () => {
    setLoading(true);
    try {
      const [ws, su] = await Promise.all([
        base44.entities.Workshop.list('-created_date'),
        base44.entities.WorkshopSignup.filter({ client_id: client.id }),
      ]);
      setWorkshops(ws);
      setSignups(su);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [client.id]);

  const roadmap = client?.roadmap_item_status || {};
  const sdpItems = client?.sdp_items || [];

  const matchesActionPlan = (w) => {
    const cat = w.category;
    if (!cat || cat === 'none' || !WORKSHOP_CATEGORY_KEYS.includes(cat)) return false;
    if (!sdpItems.includes(cat)) return false;
    return roadmap[cat]?.status !== 'completed';
  };

  const alreadyCompletedInPlan = (w) => {
    const cat = w.category;
    return !!cat && cat !== 'none' && roadmap[cat]?.status === 'completed';
  };

  const upcomingDates = (w) => {
    const today = toISODate(new Date());
    return generateOccurrences(w).filter(d => d >= today).slice(0, 6);
  };

  const handleRegister = async (workshop, date) => {
    const existing = signups.find(s => s.workshop_id === workshop.id && s.session_date === date && s.status !== 'cancelled');
    if (existing) { alert('This client is already registered for that session.'); return; }
    try {
      await base44.entities.WorkshopSignup.create({
        workshop_id: workshop.id,
        session_date: date,
        client_id: client.id,
        attendee_name: `${client.first_name} ${client.last_name}`.trim(),
        attendee_email: client.email || '',
        signup_date: todayISO(),
        status: 'registered',
      });
      setRegistering(null);
      load();
    } catch (e) {
      alert('Could not register: ' + (e.message || 'Unknown error'));
    }
  };

  const handleCancelSignup = async (s) => {
    if (!confirm('Cancel this registration?')) return;
    try {
      await base44.entities.WorkshopSignup.update(s.id, { status: 'cancelled' });
      load();
    } catch (e) {
      alert('Could not cancel: ' + (e.message || 'Unknown error'));
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <h3 className="font-semibold text-sm flex items-center gap-2">
          <Users className="w-4 h-4 text-violet-600" />
          Workshops
        </h3>
        <p className="text-xs text-muted-foreground mt-0.5">
          Register {client.first_name} for upcoming workshops. Workshops matching {client.first_name}'s action plan are highlighted.
        </p>
      </div>

      {loading ? (
        <div className="text-center py-6 text-muted-foreground text-sm">Loading workshops…</div>
      ) : workshops.length === 0 ? (
        <Card><CardContent className="py-8 text-center text-muted-foreground text-sm">No workshops have been created yet.</CardContent></Card>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {workshops.map(w => {
            const matched = matchesActionPlan(w);
            const done = alreadyCompletedInPlan(w);
            const mySups = signups.filter(s => s.workshop_id === w.id && s.status !== 'cancelled');
            const dates = upcomingDates(w);
            return (
              <Card key={w.id} className={matched ? 'border-violet-300 ring-2 ring-violet-200' : ''}>
                <CardContent className="p-3">
                  <div className="flex items-start justify-between gap-2">
                    <h4 className="font-semibold text-sm flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: w.color || '#2563eb' }} />
                      {w.title}
                    </h4>
                    {matched && <Badge className="text-[10px] bg-violet-100 text-violet-700 border border-violet-200 shrink-0"><Sparkles className="w-2.5 h-2.5 mr-0.5" />Action plan</Badge>}
                    {done && <Badge className="text-[10px] bg-emerald-100 text-emerald-700 shrink-0"><CheckCircle2 className="w-2.5 h-2.5 mr-0.5" />Completed</Badge>}
                  </div>
                  {w.category && w.category !== 'none' && (
                    <p className="text-[11px] text-slate-500 mt-0.5">{CATEGORY_LABELS[w.category]}</p>
                  )}
                  <div className="mt-2 space-y-0.5 text-xs text-slate-600">
                    {w.start_time && <p className="flex items-center gap-1.5"><Clock className="w-3 h-3 text-slate-400" /> {w.start_time}{w.end_time ? `–${w.end_time}` : ''}</p>}
                    {w.location && <p className="flex items-center gap-1.5"><MapPin className="w-3 h-3 text-slate-400" /> {w.location}</p>}
                    {w.facilitator_name && <p className="flex items-center gap-1.5"><User className="w-3 h-3 text-slate-400" /> {w.facilitator_name}</p>}
                    <p className="flex items-center gap-1.5"><Repeat className="w-3 h-3 text-slate-400" /> {w.recurrence_pattern === 'none' ? 'One-off' : w.recurrence_pattern}</p>
                  </div>

                  {mySups.length > 0 && (
                    <div className="mt-2 space-y-1">
                      {mySups.map(s => (
                        <div key={s.id} className="flex items-center justify-between text-xs rounded bg-slate-50 border border-slate-200 px-2 py-1">
                          <span className="flex items-center gap-1.5">
                            <Calendar className="w-3 h-3 text-slate-400" />
                            {formatDateLong(s.session_date)}
                          </span>
                          <span className="flex items-center gap-1.5">
                            <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${STATUS_BADGE[s.status] || ''}`}>{s.status.replace('_', ' ')}</span>
                            {s.status === 'registered' && (
                              <button onClick={() => handleCancelSignup(s)} className="text-red-500 hover:text-red-700 text-[10px] font-medium">Cancel</button>
                            )}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}

                  {w.status === 'cancelled' ? (
                    <p className="text-xs text-red-500 mt-2">This workshop is cancelled.</p>
                  ) : dates.length === 0 ? (
                    <p className="text-xs text-slate-400 mt-2">No upcoming sessions scheduled.</p>
                  ) : (
                    <Button size="sm" className="w-full mt-3 h-8" onClick={() => setRegistering(w)}>
                      <Calendar className="w-3.5 h-3.5" /> Register for a session
                    </Button>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {registering && (
        <Dialog open onOpenChange={o => !o && setRegistering(null)}>
          <DialogContent className="max-w-sm">
            <DialogHeader>
              <DialogTitle>Register {client.first_name} for {registering.title}</DialogTitle>
            </DialogHeader>
            <p className="text-xs text-muted-foreground">Choose an upcoming session. {client.first_name} will be added to the workshop roster automatically.</p>
            <div className="space-y-1.5 max-h-64 overflow-y-auto">
              {upcomingDates(registering).map(d => {
                const taken = signups.filter(s => s.workshop_id === registering.id && s.session_date === d && (s.status === 'registered' || s.status === 'attended')).length;
                return (
                  <button
                    key={d}
                    onClick={() => handleRegister(registering, d)}
                    className="w-full text-left rounded-md border border-slate-200 px-3 py-2 text-sm hover:border-violet-300 hover:bg-violet-50 transition flex items-center justify-between"
                  >
                    <span>{formatDateLong(d)}</span>
                    <span className="text-xs text-slate-400">{registering.start_time}{registering.capacity ? ` · ${taken}/${registering.capacity}` : ''}</span>
                  </button>
                );
              })}
            </div>
            <DialogFooter>
              <Button variant="outline" size="sm" onClick={() => setRegistering(null)}>Close</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}