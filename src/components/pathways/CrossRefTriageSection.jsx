import { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { ChevronDown } from 'lucide-react';
import { toast } from 'sonner';

const STREAM_OPTIONS = [
  { value: 'direct_to_employment', label: 'DEA' },
  { value: 'pathways', label: 'WD' },
  { value: 'casual', label: 'Casual' },
  { value: 'external_referral', label: 'Ext. Referral' },
  { value: 'internal_referral', label: 'Int. Referral' },
  { value: 'not_eligible', label: 'Not Eligible' },
];

const PROGRAM_STATUS_OPTIONS = [
  { value: '', label: '—' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'complete', label: 'Complete' },
  { value: 'incomplete', label: 'Incomplete' },
  { value: 'cancelled', label: 'Cancelled' },
];

// Holding section for clients auto-created by a Cross-Reference push that have
// not yet been triaged. Each row has three dropdowns: Career Counsellor,
// Program Stream, and Program Status. The moment all three are set, the
// pending-triage flag is cleared and the client's status is set to 'active',
// which moves them into the normal Master List sections and the assigned
// counsellor's My Dashboard.
export default function CrossRefTriageSection({ clients, staff, onUpdated }) {
  const [open, setOpen] = useState(true);
  const [savingId, setSavingId] = useState(null);

  const counsellors = staff
    .filter(s => s.role === 'career_counsellor' || s.secondary_role === 'career_counsellor' || s.tertiary_role === 'career_counsellor')
    .sort((a, b) => (a.name || '').localeCompare(b.name || ''));

  if (!clients.length) return null;

  const save = async (client, patch) => {
    setSavingId(client.id);
    try {
      const merged = { ...client, ...patch };
      const willComplete = !!(merged.assigned_worker && merged.service_type && merged.program_status);
      const finalPatch = willComplete
        ? { ...patch, crossref_pending_triage: false, status: 'active' }
        : patch;
      const updated = await base44.entities.Client.update(client.id, finalPatch);
      onUpdated(updated);
      if (willComplete) {
        toast.success(`${client.first_name} ${client.last_name} moved to the active list`);
      }
    } catch (e) {
      toast.error('Failed to save');
    } finally {
      setSavingId(null);
    }
  };

  return (
    <div className="mb-6 rounded-lg border border-amber-300 bg-amber-50 overflow-hidden">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-4 py-3 bg-amber-100 hover:bg-amber-200 transition-colors"
      >
        <div className="flex items-center gap-2">
          <ChevronDown className={`w-4 h-4 text-amber-700 transition-transform ${open ? '' : '-rotate-90'}`} />
          <span className="font-semibold text-amber-900">New clients from Cross-Reference List</span>
          <span className="text-xs px-2 py-0.5 rounded-full bg-amber-200 text-amber-800 font-medium">{clients.length}</span>
        </div>
        <span className="text-xs text-amber-700 hidden sm:block">
          Assign a counsellor, program stream, and status to move each client into the active list
        </span>
      </button>
      {open && (
        <div className="overflow-auto">
          <table className="w-full text-sm">
            <thead className="bg-amber-100/60 border-b border-amber-200">
              <tr>
                <th className="text-left px-3 py-2 font-semibold text-amber-900">Client Name</th>
                <th className="text-left px-3 py-2 font-semibold text-amber-900">HSID#</th>
                <th className="text-left px-3 py-2 font-semibold text-amber-900">Career Counsellor</th>
                <th className="text-left px-3 py-2 font-semibold text-amber-900">Program Stream</th>
                <th className="text-left px-3 py-2 font-semibold text-amber-900">Program Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-amber-200">
              {clients.map(c => (
                <tr key={c.id} className={savingId === c.id ? 'opacity-60' : ''}>
                  <td className="px-3 py-2 font-medium text-slate-800">{c.first_name} {c.last_name}</td>
                  <td className="px-3 py-2 text-slate-600">{c.compass_hsid || '—'}</td>
                  <td className="px-3 py-2">
                    <select
                      value={c.assigned_worker || ''}
                      onChange={e => {
                        const email = e.target.value;
                        const s = counsellors.find(x => x.email === email);
                        save(c, { assigned_worker: email, assigned_worker_name: s?.name || email });
                      }}
                      className="h-8 text-sm rounded-md border border-amber-300 px-2 bg-white min-w-[160px]"
                    >
                      <option value="">Select...</option>
                      {counsellors.map(s => (
                        <option key={s.id} value={s.email}>{s.name || s.email}</option>
                      ))}
                    </select>
                  </td>
                  <td className="px-3 py-2">
                    <select
                      value={c.service_type || ''}
                      onChange={e => save(c, { service_type: e.target.value })}
                      className="h-8 text-sm rounded-md border border-amber-300 px-2 bg-white min-w-[140px]"
                    >
                      <option value="">Select...</option>
                      {STREAM_OPTIONS.map(o => (
                        <option key={o.value} value={o.value}>{o.label}</option>
                      ))}
                    </select>
                  </td>
                  <td className="px-3 py-2">
                    <select
                      value={c.program_status || ''}
                      onChange={e => save(c, { program_status: e.target.value })}
                      className="h-8 text-sm rounded-md border border-amber-300 px-2 bg-white min-w-[140px]"
                    >
                      {PROGRAM_STATUS_OPTIONS.map(o => (
                        <option key={o.value} value={o.value}>{o.label}</option>
                      ))}
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}