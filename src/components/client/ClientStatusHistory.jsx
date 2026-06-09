import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { ArrowRight, Clock } from 'lucide-react';

const CHANGE_TYPE_CONFIG = {
  stream_switch:          { label: 'Program Stream Switch',   dot: 'bg-purple-500', badge: 'bg-purple-100 text-purple-700 border-purple-200' },
  program_status_change:  { label: 'Program Status Change',   dot: 'bg-blue-500',   badge: 'bg-blue-100 text-blue-700 border-blue-200' },
  employment_outcome:     { label: 'Employment Outcome',      dot: 'bg-green-500',  badge: 'bg-green-100 text-green-700 border-green-200' },
  post_completion_status: { label: 'Post-Completion Status',  dot: 'bg-teal-500',   badge: 'bg-teal-100 text-teal-700 border-teal-200' },
  followup_90day:         { label: '90-Day Follow-Up',        dot: 'bg-cyan-500',   badge: 'bg-cyan-100 text-cyan-700 border-cyan-200' },
  file_closed:            { label: 'File Closed',             dot: 'bg-red-500',    badge: 'bg-red-100 text-red-700 border-red-200' },
  file_opened:            { label: 'File Reopened',           dot: 'bg-slate-400',  badge: 'bg-slate-100 text-slate-600 border-slate-200' },
  other:                  { label: 'Other',                   dot: 'bg-slate-400',  badge: 'bg-slate-100 text-slate-600 border-slate-200' },
};

export default function ClientStatusHistory({ clientId }) {
  const [changes, setChanges] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!clientId) return;
    base44.entities.StatusChange.filter({ client_id: clientId }, 'change_date', 100)
      .then(data => setChanges([...data].reverse()))
      .finally(() => setLoading(false));
  }, [clientId]);

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="w-7 h-7 border-[3px] border-primary/20 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  if (changes.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-slate-400 gap-3">
        <Clock className="w-10 h-10" />
        <p className="text-sm font-medium">No status changes recorded yet.</p>
      </div>
    );
  }

  return (
    <div className="relative pl-6">
      {/* vertical spine */}
      <div className="absolute left-[11px] top-3 bottom-3 w-0.5 bg-slate-200" />

      <div className="space-y-0">
        {changes.map((change, i) => {
          const cfg = CHANGE_TYPE_CONFIG[change.change_type] || CHANGE_TYPE_CONFIG.other;
          return (
            <div key={change.id || i} className="relative pb-6">
              {/* dot */}
              <div className={`absolute -left-6 mt-1 w-4 h-4 rounded-full border-2 border-white shadow z-10 ${cfg.dot}`} />

              {/* card */}
              <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow">
                {/* header row */}
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full border ${cfg.badge}`}>
                      {cfg.label}
                    </span>
                    {change.billing_relevant && (
                      <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-700 border border-amber-200">
                        ⚠ Billing
                      </span>
                    )}
                  </div>
                  <span className="text-xs text-slate-400 font-medium">{change.change_date}</span>
                </div>

                {/* from → to */}
                {(change.from_value || change.to_value) && (
                  <div className="flex items-center gap-2 mt-2 flex-wrap">
                    {change.from_value && (
                      <span className="bg-red-50 text-red-700 border border-red-200 text-xs px-2.5 py-0.5 rounded-lg font-medium">
                        {change.from_value.replace(/_/g, ' ')}
                      </span>
                    )}
                    {change.from_value && change.to_value && (
                      <ArrowRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    )}
                    {change.to_value && (
                      <span className="bg-green-50 text-green-700 border border-green-200 text-xs px-2.5 py-0.5 rounded-lg font-medium">
                        {change.to_value.replace(/_/g, ' ')}
                      </span>
                    )}
                  </div>
                )}

                {/* notes */}
                {change.notes && (
                  <div className="mt-2 bg-slate-50 rounded-lg px-3 py-2 border border-slate-100 text-sm text-slate-700">
                    {change.notes}
                  </div>
                )}

                {/* footer */}
                <p className="text-xs text-slate-400 mt-2">
                  Logged by {change.logged_by_name || change.logged_by || 'unknown'}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}