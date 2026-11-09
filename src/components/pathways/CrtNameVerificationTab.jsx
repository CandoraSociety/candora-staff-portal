import { useState, useEffect, useMemo, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { Check, Loader2, RotateCcw, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { CollapsibleSection } from './CrossRefTab';
import { parseCrtDate } from './crossRefFields';

// Master List → Name Verification.
//
// Every name on the CRT whose program starts in January 2026 or later, with the
// HSID that identifies it. Staff correct the name in place and press Done: the
// corrected name is written into every CRT workbook version (the server does
// that), and the row moves to Completed so only outstanding names stay on view.

const SNAPSHOT_KEY = 'crt_name_verification_state';
const START_CUTOFF = new Date(2026, 0, 1);

const normHsid = (s) => String(s || '').replace(/[^0-9a-z]/gi, '').toLowerCase();
const normName = (s) => String(s || '').toLowerCase().replace(/[,.\s]+/g, ' ').trim();

const rowKey = (r) => {
  const h = normHsid(r.hsid);
  return h ? `h:${h}` : `n:${normName(r.participant_name)}`;
};

// A row belongs on this tab when its service start or DEA start date is on or
// after January 1, 2026.
const startsSinceCutoff = (r) => [r.service_start_date, r.dea_start_date]
  .map(parseCrtDate)
  .filter(Boolean)
  .some((d) => d >= START_CUTOFF);

export default function CrtNameVerificationTab({ onCountsChange }) {
  const [rows, setRows] = useState([]);
  const [fileName, setFileName] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [done, setDone] = useState(new Set());
  const [names, setNames] = useState({});   // rowKey → corrected name
  const [edits, setEdits] = useState({});   // rowKey → in-progress name
  const [saving, setSaving] = useState(null);
  const [search, setSearch] = useState('');
  const [ready, setReady] = useState(false);

  // Hydrate the Done state from the user's profile snapshot.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const me = await base44.auth.me();
        const s = me?.[SNAPSHOT_KEY];
        if (s && !cancelled) {
          setDone(new Set(s.done || []));
          setNames(s.names || {});
        }
      } catch { /* no snapshot yet */ }
      finally { if (!cancelled) setReady(true); }
    })();
    return () => { cancelled = true; };
  }, []);

  const saveTimer = useRef(null);
  useEffect(() => {
    if (!ready) return;
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      base44.auth.updateMe({ [SNAPSHOT_KEY]: { done: [...done], names } }).catch(() => {});
    }, 800);
    return () => { if (saveTimer.current) clearTimeout(saveTimer.current); };
  }, [done, names, ready]);

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await base44.functions.invoke('getCrtWorkbookRows', {});
      const data = res.data || {};
      if (data.error) throw new Error(data.error);
      setRows(data.rows || []);
      setFileName(data.file_name || '');
    } catch {
      setError('Could not read the CRT right now. Try again in a moment.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const entries = useMemo(() => rows
    .filter(startsSinceCutoff)
    .map((row) => ({ row, key: rowKey(row), name: String(row.participant_name || '').trim(), hsid: String(row.hsid || '').trim() }))
    .sort((a, b) => a.name.localeCompare(b.name)), [rows]);

  const isDone = (e) => done.has(e.key);
  const valueOf = (e) => edits[e.key] ?? names[e.key] ?? e.name;
  const pendingAll = entries.filter((e) => !isDone(e));
  const completedAll = entries.filter(isDone);

  const q = search.trim().toLowerCase();
  const matches = (e) => !q || e.name.toLowerCase().includes(q) || e.hsid.toLowerCase().includes(q) || valueOf(e).toLowerCase().includes(q);
  const pending = pendingAll.filter(matches);
  const completed = completedAll.filter(matches);

  useEffect(() => {
    onCountsChange?.({ pending: pendingAll.length, total: entries.length });
  }, [entries.length, pendingAll.length]);

  const markDone = async (e) => {
    const corrected = String(valueOf(e) || '').replace(/\s+/g, ' ').trim();
    if (!corrected) { toast.error('Enter the verified name first'); return; }
    setSaving(e.key);
    try {
      if (corrected !== e.name) {
        const res = await base44.functions.invoke('updateCrtParticipantName', {
          hsid: e.hsid,
          current_name: e.name,
          corrected_name: corrected,
        });
        const d = res.data || {};
        if (d.status !== 'success') throw new Error(d.error || 'Update failed');
        setNames((prev) => ({ ...prev, [e.key]: corrected }));
        toast.success(`${corrected} — written to ${d.workbooks_patched} of ${d.workbooks_total} CRT workbook(s)`);
      } else {
        toast.success(`${e.name} verified`);
      }
      setDone((prev) => { const n = new Set(prev); n.add(e.key); return n; });
      setEdits((prev) => { const n = { ...prev }; delete n[e.key]; return n; });
    } catch (err) {
      toast.error('Could not update the CRT: ' + (err?.response?.data?.error || err?.message || 'please try again'));
    } finally {
      setSaving(null);
    }
  };

  const reopen = (e) => {
    setDone((prev) => { const n = new Set(prev); n.delete(e.key); return n; });
  };

  const nameInput = (e) => (
    <input
      type="text"
      value={valueOf(e)}
      onChange={(ev) => setEdits((prev) => ({ ...prev, [e.key]: ev.target.value }))}
      className="w-full max-w-[280px] h-8 text-sm rounded-md border border-slate-200 px-2 py-1 bg-white focus:outline-none focus:ring-1 focus:ring-blue-400"
    />
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="text-sm text-slate-600">
          Names on the CRT with a start date of January 2026 or later. Correct a name where needed, then press Done — the name is written into every CRT workbook version and the row moves to Completed.
          {fileName && <span className="text-slate-400"> Reading {fileName}.</span>}
        </div>
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={search}
            onChange={(ev) => setSearch(ev.target.value)}
            placeholder="Search by name or HSID..."
            className="h-8 text-sm rounded-md border border-slate-300 px-2 py-1 bg-white w-56 focus:outline-none focus:ring-1 focus:ring-blue-400"
          />
          <button
            onClick={load}
            disabled={loading}
            className="inline-flex items-center gap-1 h-8 px-2.5 text-xs font-medium rounded-md border border-slate-300 text-slate-600 hover:bg-slate-50 disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} /> Refresh
          </button>
        </div>
      </div>

      {loading && entries.length === 0 ? (
        <div className="py-16 flex justify-center"><Loader2 className="w-6 h-6 animate-spin text-slate-400" /></div>
      ) : error ? (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">{error}</div>
      ) : (
        <>
          <CollapsibleSection
            title="Awaiting Verification"
            count={pending.length}
            badgeClass="bg-amber-100 text-amber-700"
            subtitle="Correct the name, then press Done"
          >
            <div className="overflow-auto max-h-[60vh]">
              <table className="w-full text-sm border-separate border-spacing-0">
                <thead>
                  <tr>
                    <th className="text-left px-3 py-2.5 font-semibold text-slate-600 bg-slate-50 border-b border-slate-200 sticky top-0 z-30">Participant Name</th>
                    <th className="text-left px-3 py-2.5 font-semibold text-slate-600 bg-slate-50 border-b border-slate-200 sticky top-0 z-30">HSID #</th>
                    <th className="text-left px-3 py-2.5 font-semibold text-slate-600 bg-slate-50 border-b border-slate-200 sticky top-0 z-30 w-24">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {pending.map((e) => (
                    <tr key={e.key} className="hover:bg-slate-50">
                      <td className="px-3 py-2.5">{nameInput(e)}</td>
                      <td className="px-3 py-2.5 text-slate-600 font-mono text-xs select-all">{e.hsid || '—'}</td>
                      <td className="px-3 py-2.5">
                        <button
                          onClick={() => markDone(e)}
                          disabled={saving === e.key}
                          className="inline-flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-md border border-emerald-300 text-emerald-700 hover:bg-emerald-50 transition-colors whitespace-nowrap disabled:opacity-50"
                        >
                          {saving === e.key ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />} Done
                        </button>
                      </td>
                    </tr>
                  ))}
                  {pending.length === 0 && (
                    <tr><td colSpan={3} className="text-center py-10 text-slate-400">
                      {entries.length === 0 ? 'No CRT names with a start date of January 2026 or later.' : 'Every name has been verified.'}
                    </td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </CollapsibleSection>

          <CollapsibleSection
            title="Completed"
            count={completed.length}
            badgeClass="bg-emerald-100 text-emerald-700"
            subtitle="Names verified and written to the CRT"
            defaultOpen={false}
          >
            <div className="overflow-auto max-h-[60vh]">
              <table className="w-full text-sm border-separate border-spacing-0">
                <thead>
                  <tr>
                    <th className="text-left px-3 py-2.5 font-semibold text-slate-600 bg-slate-50 border-b border-slate-200 sticky top-0 z-30">Participant Name</th>
                    <th className="text-left px-3 py-2.5 font-semibold text-slate-600 bg-slate-50 border-b border-slate-200 sticky top-0 z-30">HSID #</th>
                    <th className="text-left px-3 py-2.5 font-semibold text-slate-600 bg-slate-50 border-b border-slate-200 sticky top-0 z-30 w-24">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {completed.map((e) => (
                    <tr key={e.key} className="hover:bg-slate-50">
                      <td className="px-3 py-2.5">
                        <div className="text-slate-800">{valueOf(e)}</div>
                        {names[e.key] && names[e.key] !== e.name && (
                          <div className="text-xs text-slate-400 line-through">{e.name}</div>
                        )}
                      </td>
                      <td className="px-3 py-2.5 text-slate-600 font-mono text-xs select-all">{e.hsid || '—'}</td>
                      <td className="px-3 py-2.5">
                        <button
                          onClick={() => reopen(e)}
                          className="inline-flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-md border border-slate-300 text-slate-600 hover:bg-slate-100 transition-colors whitespace-nowrap"
                        >
                          <RotateCcw className="w-3.5 h-3.5" /> Reopen
                        </button>
                      </td>
                    </tr>
                  ))}
                  {completed.length === 0 && (
                    <tr><td colSpan={3} className="text-center py-10 text-slate-400">No names verified yet.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </CollapsibleSection>
        </>
      )}
    </div>
  );
}