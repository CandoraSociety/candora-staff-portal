import { useMemo } from 'react';
import { Users, MapPin, User, Calendar, Clock, Repeat, Mail, Tag, CheckCircle2 } from 'lucide-react';
import { formatDateLong } from '@/lib/workshopSchedule';

const RECURRENCE_LABEL = { none: 'One-off', weekly: 'Weekly', biweekly: 'Biweekly', monthly: 'Monthly' };
const CATEGORY_LABEL = {
  none: '—', job_search_workshop: 'Job Search', resume_writing_workshop: 'Resume Writing',
  interview_skills_workshop: 'Interview Skills', workplace_readiness_workshop: 'Workplace Readiness',
  financial_literacy_workshop: 'Financial Literacy', digital_literacy_workshop: 'Digital Literacy',
};
const STATUS_CLS = {
  attended: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  no_show: 'bg-amber-50 text-amber-700 border-amber-200',
  cancelled: 'bg-slate-100 text-slate-500 border-slate-200',
  registered: 'bg-blue-50 text-blue-700 border-blue-200',
};

const isJobClub = (w) => (w.title || '').trim().toLowerCase().startsWith('job club');

function CompletedCard({ w, signups, clientsById }) {
  const ws = (signups || []).filter(s => s.workshop_id === w.id);
  const bySession = {};
  ws.forEach(s => { (bySession[s.session_date] = bySession[s.session_date] || []).push(s); });
  const sessionDates = Object.keys(bySession).sort();
  const attendedTotal = ws.filter(s => s.status === 'attended').length;

  return (
    <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
      <div className="h-1.5" style={{ background: w.color || '#2563eb' }} />
      <div className="p-4">
        <div className="flex items-start justify-between gap-2">
          <div>
            <h3 className="font-semibold text-slate-800 leading-tight">{w.title}</h3>
            {w.category && w.category !== 'none' && (
              <span className="inline-block mt-1 text-[10px] font-semibold bg-slate-100 text-slate-600 border border-slate-200 rounded px-1.5 py-0.5">
                {CATEGORY_LABEL[w.category] || w.category}
              </span>
            )}
          </div>
          <span className="text-[10px] font-semibold border rounded px-1.5 py-0.5 bg-emerald-50 text-emerald-700 border-emerald-200">completed</span>
        </div>
        {w.description && <p className="text-sm text-slate-600 mt-2">{w.description}</p>}

        <div className="mt-3 grid gap-x-6 gap-y-1.5 text-xs text-slate-600 sm:grid-cols-2">
          <p className="flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5 text-slate-400" /> Base date: <span className="font-medium">{formatDateLong(w.date)}</span></p>
          <p className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5 text-slate-400" /> {w.start_time}{w.end_time ? `–${w.end_time}` : ''}</p>
          {w.location && <p className="flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5 text-slate-400" /> {w.location}</p>}
          {w.facilitator_name && <p className="flex items-center gap-1.5"><User className="w-3.5 h-3.5 text-slate-400" /> {w.facilitator_name}</p>}
          {w.facilitator_email && <p className="flex items-center gap-1.5"><Mail className="w-3.5 h-3.5 text-slate-400" /> {w.facilitator_email}</p>}
          <p className="flex items-center gap-1.5"><Repeat className="w-3.5 h-3.5 text-slate-400" /> {RECURRENCE_LABEL[w.recurrence_pattern] || 'One-off'}{w.recurrence_end_date ? ` (until ${formatDateLong(w.recurrence_end_date)})` : ''}</p>
          {w.capacity ? <p className="flex items-center gap-1.5"><Users className="w-3.5 h-3.5 text-slate-400" /> Capacity {w.capacity}</p> : null}
          {w.created_by_name && <p className="flex items-center gap-1.5"><Tag className="w-3.5 h-3.5 text-slate-400" /> Created by {w.created_by_name}</p>}
        </div>

        <div className="mt-3 pt-3 border-t border-slate-100">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-semibold text-slate-700 flex items-center gap-1.5"><Users className="w-4 h-4" /> Attendance Roster</p>
            <span className="text-xs text-slate-500">{attendedTotal} attended · {ws.length} total sign-ups</span>
          </div>
          {ws.length === 0 ? (
            <p className="text-xs text-slate-400">No sign-ups recorded.</p>
          ) : (
            <div className="space-y-3">
              {sessionDates.map(d => (
                <div key={d}>
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500 mb-1">{formatDateLong(d)}</p>
                  <div className="space-y-1">
                    {bySession[d].map(s => {
                      const c = s.client_id ? clientsById[s.client_id] : null;
                      const cls = STATUS_CLS[s.status] || STATUS_CLS.registered;
                      return (
                        <div key={s.id} className="flex items-center gap-2 rounded-md border border-slate-200 px-2.5 py-1.5 bg-slate-50/50">
                          <span className="text-sm font-medium flex-1 truncate">
                            {s.attendee_name}
                            {c?.service_type === 'pathways' && <span className="ml-1.5 text-[9px] font-bold bg-purple-100 text-purple-700 px-1 py-px rounded">WD</span>}
                            {c?.service_type === 'direct_to_employment' && <span className="ml-1.5 text-[9px] font-bold bg-blue-100 text-blue-700 px-1 py-px rounded">DEA</span>}
                          </span>
                          {s.attendee_email && <span className="text-xs text-slate-400 truncate hidden sm:block">{s.attendee_email}</span>}
                          <span className={`text-[10px] font-semibold border rounded px-1.5 py-0.5 ${cls}`}>{s.status.replace('_', ' ')}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function SectionHeader({ label, count }) {
  return (
    <div className="flex items-center gap-2 mb-2">
      <h2 className="text-sm font-semibold text-slate-700 uppercase tracking-wide">{label}</h2>
      <span className="text-xs text-slate-400">({count})</span>
    </div>
  );
}

// Completed workshops filed with all their details + per-session attendance roster.
// Job Club sessions are segregated into their own section beneath the completed workshops.
export default function CompletedWorkshopsTab({ workshops, signups, clients }) {
  const completed = useMemo(() => workshops.filter(w => w.status === 'completed'), [workshops]);
  const clientsById = useMemo(() => {
    const m = {};
    (clients || []).forEach(c => { if (c.id) m[c.id] = c; });
    return m;
  }, [clients]);

  const jobClubSessions = useMemo(() => completed.filter(isJobClub), [completed]);
  const completedWorkshops = useMemo(() => completed.filter(w => !isJobClub(w)), [completed]);

  if (completed.length === 0) {
    return (
      <div className="text-center py-16">
        <CheckCircle2 className="w-10 h-10 mx-auto text-slate-300 mb-3" />
        <p className="text-sm text-slate-500">No completed workshops yet.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <SectionHeader label="Completed Workshops" count={completedWorkshops.length} />
        {completedWorkshops.length === 0 ? (
          <p className="text-sm text-slate-400">None.</p>
        ) : (
          <div className="space-y-4">
            {completedWorkshops.map(w => (
              <CompletedCard key={w.id} w={w} signups={signups} clientsById={clientsById} />
            ))}
          </div>
        )}
      </div>

      {jobClubSessions.length > 0 && (
        <div className="pt-4 border-t border-slate-200">
          <SectionHeader label="Job Club Sessions" count={jobClubSessions.length} />
          <div className="space-y-4">
            {jobClubSessions.map(w => (
              <CompletedCard key={w.id} w={w} signups={signups} clientsById={clientsById} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}