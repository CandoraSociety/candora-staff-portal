import { format, addDays } from 'date-fns';
import { UserCheck } from 'lucide-react';
import SwitchDogEar from './SwitchDogEar';
import { clientRowColor } from '@/lib/clientRowColor';

const SERVICE_LABELS = {
  direct_to_employment: 'DEA',
  pathways: 'WD',
  casual: 'Casual',
  external_referral: 'Ext. Referral',
  internal_referral: 'Int. Referral',
  not_eligible: 'Not Eligible',
};

const SERVICE_BADGE_STYLES = {
  direct_to_employment: 'bg-indigo-100 text-indigo-700',
  pathways: 'bg-amber-100 text-amber-700',
  casual: 'bg-slate-100 text-slate-600',
  external_referral: 'bg-purple-100 text-purple-700',
  internal_referral: 'bg-cyan-100 text-cyan-700',
  not_eligible: 'bg-red-100 text-red-700',
};

const fmtDate = (d) => {
  if (!d) return '—';
  try { return format(new Date(d), 'MMM d, yy'); } catch { return '—'; }
};

export default function MasterListFlatTable({ rows, onRowClick, onSwitchClient, onReassign }) {
  return (
    <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="border-b border-slate-200" style={{ background: 'hsl(231,64%,20%)' }}>
            <tr>
              <th className="text-left px-3 py-3 font-semibold text-white whitespace-nowrap">Name</th>
              <th className="text-left px-3 py-3 font-semibold text-white whitespace-nowrap">Stream</th>
              <th className="text-left px-3 py-3 font-semibold text-white whitespace-nowrap">HSID#</th>
              <th className="text-left px-3 py-3 font-semibold text-white whitespace-nowrap">Intake Date</th>
              <th className="text-left px-3 py-3 font-semibold text-white whitespace-nowrap">Program Start</th>
              <th className="text-left px-3 py-3 font-semibold text-white whitespace-nowrap">Completion</th>
              <th className="text-left px-3 py-3 font-semibold text-white whitespace-nowrap">90-Day Follow-up</th>
              <th className="text-left px-3 py-3 font-semibold text-white whitespace-nowrap">Career Counsellor</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {rows.map(c => {
              const anticipatedCompletion = c.completion_date
                ? null
                : c.service_start_date ? addDays(new Date(c.service_start_date), 14) : null;
              const anticipatedFollowup = c.followup_90day_date
                ? null
                : c.completion_date ? addDays(new Date(c.completion_date), 90) : null;
              return (
                <tr
                  key={c.id}
                  onClick={() => onRowClick(c)}
                  className={`group transition-colors cursor-pointer hover:brightness-95 ${clientRowColor(c)}`}
                >
                  <td className="px-3 py-2.5 whitespace-nowrap font-semibold relative" style={{ color: 'hsl(231,64%,28%)' }}>
                    <SwitchDogEar switches={c.program_stream_switches} />
                    {c.first_name} {c.last_name}
                    {c.service_type === 'direct_to_employment' && !c.file_closed && (
                      <button
                        onClick={(e) => { e.stopPropagation(); onSwitchClient(c); }}
                        className="ml-2 text-[10px] px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-700 hover:bg-amber-200 font-medium transition-colors"
                        title="Switch to WD"
                      >
                        ⇄ WD
                      </button>
                    )}
                  </td>
                  <td className="px-3 py-2.5 whitespace-nowrap">
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${SERVICE_BADGE_STYLES[c.service_type] || 'bg-slate-100 text-slate-600'}`}>
                      {SERVICE_LABELS[c.service_type] || c.service_type || '—'}
                    </span>
                  </td>
                  <td className="px-3 py-2.5 text-slate-600 whitespace-nowrap">{c.compass_hsid || '—'}</td>
                  <td className="px-3 py-2.5 text-slate-600 whitespace-nowrap">{fmtDate(c.intake_date)}</td>
                  <td className="px-3 py-2.5 text-slate-600 whitespace-nowrap">{fmtDate(c.service_start_date)}</td>
                  <td className="px-3 py-2.5 whitespace-nowrap">
                    {c.completion_date ? (
                      <span className="text-slate-600">{fmtDate(c.completion_date)}</span>
                    ) : anticipatedCompletion ? (
                      <span className="text-slate-400">{format(anticipatedCompletion, 'MMM d, yy')}<span className="block text-[10px] italic">(anticipated)</span></span>
                    ) : '—'}
                  </td>
                  <td className="px-3 py-2.5 whitespace-nowrap">
                    {c.followup_90day_date ? (
                      <span className="text-slate-600">{fmtDate(c.followup_90day_date)}</span>
                    ) : anticipatedFollowup ? (
                      <span className="text-slate-400">{format(anticipatedFollowup, 'MMM d, yy')}<span className="block text-[10px] italic">(anticipated)</span></span>
                    ) : '—'}
                  </td>
                  <td className="px-3 py-2.5 text-slate-600 whitespace-nowrap">
                    <div className="flex items-center gap-1.5">
                      <span>{c.assigned_worker_name || '—'}</span>
                      {onReassign && (
                        <button
                          onClick={(e) => { e.stopPropagation(); onReassign(c); }}
                          className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-blue-100 transition-all"
                          title="Edit assigned career counsellor"
                        >
                          <UserCheck className="w-3.5 h-3.5 text-blue-600" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
            {rows.length === 0 && (
              <tr>
                <td colSpan={8} className="text-center py-6 text-slate-400 text-sm">
                  No clients match the current filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}