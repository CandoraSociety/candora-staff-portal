import { useState, useEffect, useCallback } from 'react';
import { base44 } from '@/api/base44Client';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Plus, Pencil, Trash2, RefreshCw, Users, MapPin, User, Calendar, Clock, Repeat, CheckCircle2 } from 'lucide-react';
import WorkshopDialog from '@/components/pathways/workshops/WorkshopDialog';
import WorkshopSchedule from '@/components/pathways/workshops/WorkshopSchedule';
import SessionRosterDialog from '@/components/pathways/workshops/SessionRosterDialog';
import CompletedWorkshopsTab from '@/components/pathways/workshops/CompletedWorkshopsTab';
import { generateOccurrences, nextOccurrence, formatDateLong, formatDateShort } from '@/lib/workshopSchedule';
import { syncWorkshopCompletionToRoadmap } from '@/lib/workshopCompletion';

const RECURRENCE_LABEL = { none: 'One-off', weekly: 'Weekly', biweekly: 'Biweekly', monthly: 'Monthly' };
const STATUS_CLS = {
  scheduled: 'bg-blue-50 text-blue-700 border-blue-200',
  completed: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  cancelled: 'bg-red-50 text-red-600 border-red-200',
};

export default function PathwaysWorkshops() {
  const [tab, setTab] = useState('workshops');
  const [workshops, setWorkshops] = useState([]);
  const [signups, setSignups] = useState([]);
  const [clients, setClients] = useState([]);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [roster, setRoster] = useState(null); // { workshop, date }

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [ws, su, cl, u] = await Promise.all([
        base44.entities.Workshop.list('-created_date'),
        base44.entities.WorkshopSignup.list('-created_date'),
        base44.entities.Client.list().catch(() => []),
        base44.auth.me().catch(() => null),
      ]);
      setWorkshops(ws);
      setSignups(su);
      setClients(cl);
      setUser(u);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const reloadSignups = async () => {
    setSignups(await base44.entities.WorkshopSignup.list('-created_date'));
  };

  const openNew = () => { setEditing(null); setDialogOpen(true); };
  const openEdit = (w) => { setEditing(w); setDialogOpen(true); };

  const handleDelete = async (w) => {
    if (!confirm(`Delete "${w.title}" and all its sign-ups?`)) return;
    try {
      const related = signups.filter(s => s.workshop_id === w.id);
      if (related.length) await base44.entities.WorkshopSignup.deleteMany({ workshop_id: w.id });
      await base44.entities.Workshop.delete(w.id);
      load();
    } catch (e) {
      alert('Could not delete: ' + (e.message || 'Unknown error'));
    }
  };

  const handleComplete = async (w) => {
    if (!confirm(`Mark "${w.title}" as completed? Attended clients will have the matching action-plan item marked complete.`)) return;
    try {
      await base44.entities.Workshop.update(w.id, { status: 'completed' });
      try { await syncWorkshopCompletionToRoadmap(w.id); } catch (_) {}
      load();
    } catch (e) {
      alert('Could not complete: ' + (e.message || 'Unknown error'));
    }
  };

  const upcomingCount = (w) => {
    const next = nextOccurrence(w);
    return next ? formatDateShort(next) : '—';
  };

  const rosterCount = (w, date) => signups.filter(s => s.workshop_id === w.id && s.session_date === date && (s.status === 'registered' || s.status === 'attended')).length;

  const activeWorkshops = workshops.filter(w => w.status !== 'completed');
  const completedWorkshops = workshops.filter(w => w.status === 'completed');

  return (
    <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 py-6">
      <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Workshops</h1>
          <p className="text-sm text-slate-500">Create workshops and schedule recurring sessions with rosters.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={load} disabled={loading}><RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /></Button>
          <Button onClick={openNew} size="sm"><Plus className="w-4 h-4" /> New Workshop</Button>
        </div>
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="w-full justify-start">
          <TabsTrigger value="workshops">All Workshops</TabsTrigger>
          <TabsTrigger value="schedule">Schedule</TabsTrigger>
          <TabsTrigger value="completed" className="ml-auto">Completed{completedWorkshops.length > 0 ? ` (${completedWorkshops.length})` : ''}</TabsTrigger>
        </TabsList>

        <TabsContent value="workshops" className="mt-4">
          {loading ? (
            <p className="text-center text-sm text-slate-400 py-10">Loading…</p>
          ) : activeWorkshops.length === 0 ? (
            <div className="text-center py-16">
              <Users className="w-10 h-10 mx-auto text-slate-300 mb-3" />
              <p className="text-sm text-slate-500 mb-3">No workshops yet.</p>
              <Button onClick={openNew} size="sm"><Plus className="w-4 h-4" /> Create your first workshop</Button>
            </div>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {activeWorkshops.map(w => {
                const next = nextOccurrence(w);
                const count = next ? rosterCount(w, next) : 0;
                return (
                  <div key={w.id} className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
                    <div className="h-1.5" style={{ background: w.color || '#2563eb' }} />
                    <div className="p-4">
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="font-semibold text-slate-800 leading-tight">{w.title}</h3>
                        <span className={`text-[10px] font-semibold border rounded px-1.5 py-0.5 shrink-0 ${STATUS_CLS[w.status] || ''}`}>{w.status}</span>
                      </div>
                      {w.description && <p className="text-xs text-slate-500 mt-1 line-clamp-2">{w.description}</p>}

                      <div className="mt-3 space-y-1 text-xs text-slate-600">
                        {next && <p className="flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5 text-slate-400" /> Next: <span className="font-medium">{formatDateLong(next)}</span></p>}
                        <p className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5 text-slate-400" /> {w.start_time}{w.end_time ? `–${w.end_time}` : ''}</p>
                        {w.location && <p className="flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5 text-slate-400" /> {w.location}</p>}
                        {w.facilitator_name && <p className="flex items-center gap-1.5"><User className="w-3.5 h-3.5 text-slate-400" /> {w.facilitator_name}</p>}
                        <p className="flex items-center gap-1.5"><Repeat className="w-3.5 h-3.5 text-slate-400" /> {RECURRENCE_LABEL[w.recurrence_pattern] || 'One-off'}</p>
                        {next && <p className="flex items-center gap-1.5"><Users className="w-3.5 h-3.5 text-slate-400" /> {count}{w.capacity ? `/${w.capacity}` : ''} signed up</p>}
                      </div>

                      <div className="flex items-center gap-1 mt-3 pt-3 border-t border-slate-100">
                        <Button variant="outline" size="sm" className="h-8" onClick={() => setRoster({ workshop: w, date: next || w.date })}>
                          <Users className="w-3.5 h-3.5" /> Roster
                        </Button>
                        {w.status === 'scheduled' && (
                          <Button variant="outline" size="sm" className="h-8 text-emerald-700 border-emerald-200 hover:bg-emerald-50" onClick={() => handleComplete(w)}>
                            <CheckCircle2 className="w-3.5 h-3.5" /> Complete
                          </Button>
                        )}
                        <Button variant="ghost" size="sm" className="h-8" onClick={() => openEdit(w)}><Pencil className="w-3.5 h-3.5" /></Button>
                        <Button variant="ghost" size="sm" className="h-8 text-red-500 hover:text-red-600" onClick={() => handleDelete(w)}><Trash2 className="w-3.5 h-3.5" /></Button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </TabsContent>

        <TabsContent value="completed" className="mt-4">
          <CompletedWorkshopsTab workshops={completedWorkshops} signups={signups} clients={clients} />
        </TabsContent>

        <TabsContent value="schedule" className="mt-4">
          {loading ? (
            <p className="text-center text-sm text-slate-400 py-10">Loading…</p>
          ) : (
            <WorkshopSchedule
              workshops={workshops}
              signups={signups}
              onOpenRoster={(w, date) => setRoster({ workshop: w, date })}
            />
          )}
        </TabsContent>
      </Tabs>

      <WorkshopDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        onSaved={load}
        workshop={editing}
        user={user}
      />

      {roster && (
        <SessionRosterDialog
          open={!!roster}
          onClose={() => setRoster(null)}
          workshop={roster.workshop}
          sessionDate={roster.date}
          signups={signups}
          clients={clients}
          onChanged={reloadSignups}
        />
      )}
    </div>
  );
}