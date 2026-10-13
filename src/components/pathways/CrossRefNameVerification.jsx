import { useState, useEffect, useMemo, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { Check, RotateCcw, BadgeCheck } from 'lucide-react';
import { toast } from 'sonner';
import { CollapsibleSection, rowIdentityKeys, rowStorageKey } from './CrossRefTab';

// Server-side snapshot key on the logged-in user's profile — same durability
// approach as the review sub-tab's cross_ref_state, kept in a separate key so
// the two features save without clobbering each other.
const SNAPSHOT_KEY = 'cross_ref_name_verification';
const VERIFIED_LOCAL = 'crossRefNameVerified';
const NOTES_LOCAL = 'crossRefNameNotes';

// Sub-tab of the Cross-Reference tab: a name-verification checklist covering
// every client in the cross-reference list. Staff record the client's correct
// name as it appears in Compass in the note field, then mark the client
// verified — at which point the row moves to the Verified section.
export default function CrossRefNameVerification({ rows }) {
  const [verified, setVerified] = useState(() => {
    try { return new Set(JSON.parse(localStorage.getItem(VERIFIED_LOCAL) || '[]')); } catch { return new Set(); }
  });
  const [notes, setNotes] = useState(() => {
    try { return JSON.parse(localStorage.getItem(NOTES_LOCAL) || '{}'); } catch { return {}; }
  });
  const [search, setSearch] = useState('');
  const [ready, setReady] = useState(false);

  // Hydrate from the server snapshot — it is the source of truth, saved on
  // every change, so it REPLACES the local copy (mirrors cross_ref_state).
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const me = await base44.auth.me();
        const s = me?.[SNAPSHOT_KEY];
        if (s && !cancelled) {
          setVerified(new Set(s.verified || []));
          setNotes(s.notes || {});
        }
      } catch { /* not logged in or no snapshot — fall back to localStorage */ }
      finally { if (!cancelled) setReady(true); }
    })();
    return () => { cancelled = true; };
  }, []);

  // Debounced save: localStorage right away, server snapshot after the typing
  // settles so note fields don't fire a request per keystroke.
  const saveTimer = useRef(null);
  useEffect(() => {
    if (!ready) return; // don't overwrite the server before we've read it
    localStorage.setItem(VERIFIED_LOCAL, JSON.stringify([...verified]));
    localStorage.setItem(NOTES_LOCAL, JSON.stringify(notes));
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      base44.auth.updateMe({ [SNAPSHOT_KEY]: { verified: [...verified], notes } }).catch(() => {});
    }, 800);
    return () => { if (saveTimer.current) clearTimeout(saveTimer.current); };
  }, [verified, notes, ready]);

  const entries = useMemo(() => rows
    .map(r => ({ row: r, keys: rowIdentityKeys(r), sk: rowStorageKey(r), name: (r.client_name || '').trim() }))
    .sort((a, b) => a.name.localeCompare(b.name)), [rows]);

  const isVerified = (e) => e.keys.some(k => verified.has(k));
  const verifiedCount = entries.filter(isVerified).length;

  const markVerified = (e) => {
    setVerified(prev => { const n = new Set(prev); e.keys.forEach(k => n.add(k)); return n; });
    toast.success(`${e.name || 'Client'} marked as verified`);
  };
  const undoVerified = (e) => {
    setVerified(prev => { const n = new Set(prev); e.keys.forEach(k => n.delete(k)); return n; });
    toast.message(`${e.name || 'Client'} moved back to Awaiting Verification`);
  };
  const setNote = (e, v) => setNotes(prev => ({ ...prev, [e.sk]: v }));

  const q = search.trim().toLowerCase();
  const matchesSearch = (e) => !q
    || e.name.toLowerCase().includes(q)
    || (e.row.hsid || '').toLowerCase().includes(q)
    || (notes[e.sk] || '').toLowerCase().includes(q);
  const pending = entries.filter(e => !isVerified(e) && matchesSearch(e));
  const verifiedEntries = entries.filter(e => isVerified(e) && matchesSearch(e));

  const noteField = (e, placeholder) => (
    <input
      type="text"
      value={notes[e.sk] || ''}
      onChange={(ev) => setNote(e, ev.target.value)}
      placeholder={placeholder}
      className="w-full max-w-[260px] h-8 text-xs rounded-md border border-slate-200 px-2 py-1 bg-white focus:outline-none focus:ring-1 focus:ring-blue-400"
    />
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="text-sm text-slate-600">
          Check every client's name against Compass — record the correct Compass name in the note field, then mark the client verified.
        </div>
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by client name or HSID..."
          className="h-8 text-sm rounded-md border border-slate-300 px-2 py-1 bg-white w-56 focus:outline-none focus:ring-1 focus:ring-blue-400"
        />
      </div>

      <CollapsibleSection
        title="Awaiting Verification"
        count={pending.length}
        badgeClass="bg-amber-100 text-amber-700"
        subtitle={`${entries.length - verifiedCount} not yet verified`}
      >
        <div className="overflow-auto max-h-[60vh]">
          <table className="w-full text-sm border-separate border-spacing-0">
            <thead>
              <tr>
                <th className="text-left px-3 py-2.5 font-semibold text-slate-600 bg-slate-50 border-b border-slate-200 sticky top-0 z-30">Client Name</th>
                <th className="text-left px-3 py-2.5 font-semibold text-slate-600 bg-slate-50 border-b border-slate-200 sticky top-0 z-30">HSID#</th>
                <th className="text-left px-3 py-2.5 font-semibold text-slate-600 bg-slate-50 border-b border-slate-200 sticky top-0 z-30">Correct Name per Compass</th>
                <th className="text-left px-3 py-2.5 font-semibold text-slate-600 bg-slate-50 border-b border-slate-200 sticky top-0 z-30">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {pending.map(e => (
                <tr key={e.row.id} className="hover:bg-slate-50">
                  <td className="px-3 py-2.5 font-medium text-slate-800">{e.name || '—'}</td>
                  <td className="px-3 py-2.5 text-slate-600">{e.row.hsid || '—'}</td>
                  <td className="px-3 py-2.5">{noteField(e, 'Correct name according to Compass...')}</td>
                  <td className="px-3 py-2.5">
                    <button
                      onClick={() => markVerified(e)}
                      className="inline-flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-md border border-emerald-300 text-emerald-700 hover:bg-emerald-50 transition-colors whitespace-nowrap"
                    >
                      <Check className="w-3.5 h-3.5" /> Mark Verified
                    </button>
                  </td>
                </tr>
              ))}
              {pending.length === 0 && (
                <tr><td colSpan={4} className="text-center py-10 text-slate-400">No clients awaiting verification.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </CollapsibleSection>

      <CollapsibleSection
        title="Verified"
        count={verifiedEntries.length}
        badgeClass="bg-emerald-100 text-emerald-700"
        subtitle="Names checked against Compass"
        defaultOpen={false}
      >
        <div className="overflow-auto max-h-[60vh]">
          <table className="w-full text-sm border-separate border-spacing-0">
            <thead>
              <tr>
                <th className="text-left px-3 py-2.5 font-semibold text-slate-600 bg-slate-50 border-b border-slate-200 sticky top-0 z-30">Client Name</th>
                <th className="text-left px-3 py-2.5 font-semibold text-slate-600 bg-slate-50 border-b border-slate-200 sticky top-0 z-30">HSID#</th>
                <th className="text-left px-3 py-2.5 font-semibold text-slate-600 bg-slate-50 border-b border-slate-200 sticky top-0 z-30">Correct Name per Compass</th>
                <th className="text-left px-3 py-2.5 font-semibold text-slate-600 bg-slate-50 border-b border-slate-200 sticky top-0 z-30">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {verifiedEntries.map(e => (
                <tr key={e.row.id} className="bg-emerald-50/50 hover:bg-emerald-50">
                  <td className="px-3 py-2.5 font-medium text-slate-800">
                    <div className="flex items-center gap-1.5">
                      <BadgeCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                      {e.name || '—'}
                    </div>
                  </td>
                  <td className="px-3 py-2.5 text-slate-600">{e.row.hsid || '—'}</td>
                  <td className="px-3 py-2.5">{noteField(e, 'Correct name according to Compass...')}</td>
                  <td className="px-3 py-2.5">
                    <button
                      onClick={() => undoVerified(e)}
                      className="inline-flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-md border border-slate-300 text-slate-600 hover:bg-slate-50 transition-colors whitespace-nowrap"
                    >
                      <RotateCcw className="w-3.5 h-3.5" /> Undo
                    </button>
                  </td>
                </tr>
              ))}
              {verifiedEntries.length === 0 && (
                <tr><td colSpan={4} className="text-center py-10 text-slate-400">No verified clients yet.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </CollapsibleSection>
    </div>
  );
}