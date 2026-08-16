import { useState, useEffect, useRef, useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Upload, Loader2, CheckCircle2, Sparkles, ChevronDown, Check, RotateCcw, Flag } from 'lucide-react';
import { toast } from 'sonner';

const DEFAULT_FILE_URL = 'https://media.base44.com/files/public/6a249282cb496579542673b7/e1cca0072_EmploymentprogramClientStatusV3.xlsx';
const DEFAULT_FILE_NAME = 'EmploymentprogramClientStatusV3.xlsx';
const DEFAULT_CRT_URL = 'https://media.base44.com/files/public/6a249282cb496579542673b7/c0d0b1064_UPDATEDCommonReportingToolCRT-CareerCounsellors.xlsx';
const DEFAULT_CRT_NAME = 'UPDATEDCommonReportingToolCRT-CareerCounsellors.xlsx';

const normName = (s) => (s || '').toLowerCase().replace(/[,.\s]+/g, ' ').trim();
const normHsid = (s) => (s || '').replace(/[^0-9a-z]/gi, '').toLowerCase();

const rowNameKeys = (name) => {
  const n = normName(name);
  if (!n) return [];
  if (name.includes(',')) {
    const [last, ...rest] = name.split(',').map(s => s.trim());
    const first = rest.join(' ');
    return [n, normName(`${last} ${first}`), normName(`${first} ${last}`)].filter(Boolean);
  }
  return [n];
};

const buildClientNameKeys = (c) => {
  const first = (c.first_name || '').toLowerCase().trim();
  const last = (c.last_name || '').toLowerCase().trim();
  return [
    normName(`${last}, ${first}`),
    normName(`${first} ${last}`),
    normName(`${last} ${first}`),
  ].filter(Boolean);
};

const CRT_COLUMNS = [
  { key: 'source_sheet', label: 'CRT Source Sheet' },
  { key: 'participant_name', label: 'Participant Legal Name' },
  { key: 'hsid', label: 'COMPASS HSID #' },
  { key: 'email', label: 'Participant Email' },
  { key: 'phone', label: 'Participant Telephone' },
  { key: 'ceis_dea', label: 'CEIS (DEA)' },
  { key: 'dea_start_date', label: 'DEA Start Date' },
  { key: 'service_element', label: 'Service Element' },
  { key: 'service_start_date', label: 'Service Start Date' },
  { key: 'service_outcome', label: 'Service Outcome' },
  { key: 'service_outcome_date', label: 'Service Outcome Date' },
  { key: 'placement_outcome', label: 'Placement Outcome' },
  { key: 'placement_outcome_date', label: 'Placement Outcome Date' },
  { key: 'day90_outcome', label: '90 Day Outcome' },
  { key: 'day90_outcome_date', label: '90 Day Outcome Date' },
  { key: 'comments', label: 'CRT Comments' },
  { key: 'eda_completion_date', label: 'EDA Completion Date' },
  { key: 'work_exposure', label: 'Work Exposure Y/N' },
  { key: 'wage_subsidy', label: 'Wage Subsidy Y/N' },
  { key: 'employed_ftpt', label: 'Employed FT/PT' },
  { key: 'service_nav_support', label: 'Service Nav Support Y/N' },
];

const DATE_COLUMNS = [
  { key: 'dea_start_date', label: 'DEA Start Date' },
  { key: 'service_start_date', label: 'Service Start Date' },
  { key: 'service_outcome_date', label: 'Service Outcome Date' },
  { key: 'placement_outcome_date', label: 'Placement Outcome Date' },
  { key: 'day90_outcome_date', label: '90 Day Outcome Date' },
  { key: 'eda_completion_date', label: 'EDA Completion Date' },
];

// Parse CRT date strings (typically MM/DD/YY) into a Date for sorting/filtering.
const parseCrtDate = (s) => {
  if (!s) return null;
  const m = String(s).match(/(\d{1,2})\/(\d{1,2})\/(\d{2,4})/);
  if (m) {
    let y = +m[3]; if (y < 100) y += 2000;
    const d = new Date(y, +m[1] - 1, +m[2]);
    return isNaN(d) ? null : d;
  }
  const d = new Date(s);
  return isNaN(d) ? null : d;
};

const COMPLETED_KEY = 'crossRefCompleted';

function CollapsibleSection({ title, count, badgeClass, subtitle, defaultOpen = true, children }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="rounded-lg border border-slate-200 bg-white overflow-hidden">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-4 py-2.5 hover:bg-slate-50 transition-colors"
      >
        <div className="flex items-center gap-2">
          <ChevronDown className={`w-4 h-4 text-slate-500 transition-transform ${open ? '' : '-rotate-90'}`} />
          <span className="font-semibold text-slate-800">{title}</span>
          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${badgeClass}`}>{count}</span>
        </div>
        {subtitle && <span className="text-xs text-slate-400">{subtitle}</span>}
      </button>
      {open && <div className="border-t border-slate-200">{children}</div>}
    </div>
  );
}

export default function CrossRefTab({ activeClients, onCountsChange }) {
  const [rows, setRows] = useState([]);
  const [crtRows, setCrtRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [crtLoading, setCrtLoading] = useState(false);
  const [marchCrt, setMarchCrt] = useState([]);
  const [marchLoading, setMarchLoading] = useState(false);
  const [fileName, setFileName] = useState(DEFAULT_FILE_NAME);
  const [crtFileName, setCrtFileName] = useState(DEFAULT_CRT_NAME);
  const [comments, setComments] = useState({});
  const [filter, setFilter] = useState('all');
  const [dateColumn, setDateColumn] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [dateSort, setDateSort] = useState('none');
  const [completed, setCompleted] = useState(() => {
    try { return new Set(JSON.parse(localStorage.getItem(COMPLETED_KEY) || '[]')); } catch { return new Set(); }
  });
  const fileInput = useRef(null);
  const crtFileInput = useRef(null);

  useEffect(() => {
    localStorage.setItem(COMPLETED_KEY, JSON.stringify([...completed]));
  }, [completed]);

  const loadStatus = async (file_url, label) => {
    setLoading(true);
    try {
      const res = await base44.functions.invoke('parseClientStatusWorkbook', { file_url });
      setRows(res.data?.rows || []);
      if (label) setFileName(label);
      toast.success(`${res.data?.count || 0} clients loaded from workbook`);
    } catch (e) {
      toast.error('Failed to parse workbook');
    } finally {
      setLoading(false);
    }
  };

  const loadCrt = async (file_url, label) => {
    setCrtLoading(true);
    try {
      const res = await base44.functions.invoke('parseCrtWorkbook', { file_url });
      setCrtRows(res.data?.rows || []);
      if (label) setCrtFileName(label);
      toast.success(`${res.data?.count || 0} CRT rows loaded`);
    } catch (e) {
      toast.error('Failed to parse CRT workbook');
    } finally {
      setCrtLoading(false);
    }
  };

  const loadMarchCrt = async () => {
    setMarchLoading(true);
    try {
      const res = await base44.functions.invoke('getCrtWorkbookRows', { file_name: 'CRT_March_2026.xlsx' });
      setMarchCrt(res.data?.rows || []);
    } catch {
      // flags just won't show if the March workbook can't be read
    } finally {
      setMarchLoading(false);
    }
  };

  useEffect(() => {
    loadStatus(DEFAULT_FILE_URL, DEFAULT_FILE_NAME);
    loadCrt(DEFAULT_CRT_URL, DEFAULT_CRT_NAME);
    loadMarchCrt();
  }, []);

  const handleUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setLoading(true);
    try {
      const up = await base44.integrations.Core.UploadFile({ file });
      await loadStatus(up.file_url, file.name);
    } catch (err) {
      toast.error('Upload failed');
      setLoading(false);
    }
    e.target.value = '';
  };

  const handleCrtUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setCrtLoading(true);
    try {
      const up = await base44.integrations.Core.UploadFile({ file });
      await loadCrt(up.file_url, file.name);
    } catch (err) {
      toast.error('Upload failed');
      setCrtLoading(false);
    }
    e.target.value = '';
  };

  const hsidSet = new Set((activeClients || []).map(c => (c.compass_hsid || '').trim()).filter(Boolean));
  const nameKeys = new Set();
  (activeClients || []).forEach(c => buildClientNameKeys(c).forEach(k => nameKeys.add(k)));

  const isMatch = (row) => {
    const hsid = (row.hsid || '').trim();
    if (hsid && hsidSet.has(hsid)) return true;
    return rowNameKeys(row.client_name).some(k => nameKeys.has(k));
  };

  const stableKey = (r) => {
    const h = normHsid(r.hsid);
    return h ? `h:${h}` : `n:${normName(r.client_name)}`;
  };

  const toggleCompleted = (r) => {
    const k = stableKey(r);
    setCompleted(prev => {
      const n = new Set(prev);
      if (n.has(k)) n.delete(k); else n.add(k);
      return n;
    });
  };

  const merged = useMemo(() => {
    const used = new Set();
    const findCrtMatch = (row) => {
      const rh = normHsid(row.hsid);
      if (rh) {
        const byHsid = crtRows.findIndex(c => normHsid(c.hsid) === rh);
        if (byHsid >= 0) return byHsid;
      }
      const rKeys = rowNameKeys(row.client_name);
      return crtRows.findIndex(c => {
        if (!c.participant_name) return false;
        return rowNameKeys(c.participant_name).some(k => rKeys.includes(k));
      });
    };

    const out = rows.map((r, i) => {
      const ci = findCrtMatch(r);
      let crt = null;
      if (ci >= 0 && !used.has(ci)) { crt = crtRows[ci]; used.add(ci); }
      return { id: `e${i}`, ...r, crt, is_new: false };
    });
    crtRows.forEach((c, i) => {
      if (used.has(i)) return;
      out.push({
        id: `n${i}`,
        client_name: c.participant_name,
        hsid: c.hsid,
        status: '', edas_completed: '', extra_notes: '',
        source_sheet: '',
        crt: c, is_new: true,
      });
    });
    return out;
  }, [rows, crtRows]);

  const marchMap = useMemo(() => {
    const m = new Map();
    marchCrt.forEach(r => {
      const h = normHsid(r.hsid);
      if (h) m.set(`h:${h}`, r);
      rowNameKeys(r.participant_name).forEach(k => { if (!m.has(`n:${k}`)) m.set(`n:${k}`, r); });
    });
    return m;
  }, [marchCrt]);

  // Green flag = completed full program flow (90 Day Outcome filled with a real
  // outcome, not the projected 'P'). Red flag = cancelled from the program
  // (Service Outcome = "Cancelled"). Both read from the March 2026 CRT.
  const flagFor = (row) => {
    const mr = marchMap.get(`h:${normHsid(row.hsid)}`) || marchMap.get(`n:${normName(row.client_name)}`);
    if (!mr) return null;
    const so = (mr.service_outcome || '').trim().toLowerCase();
    if (so === 'cancelled') return 'cancelled';
    const d90 = (mr.day90_outcome || '').trim();
    if (d90 && d90 !== 'P') return 'completed';
    return null;
  };

  const activeRows = merged.filter(r => !completed.has(stableKey(r)));
  const completedRows = merged.filter(r => completed.has(stableKey(r)));

  const matchedCount = activeRows.filter(isMatch).length;
  const unmatchedCount = activeRows.length - matchedCount;
  const newCount = activeRows.filter(r => r.is_new).length;
  const masterFiltered = filter === 'all' ? activeRows : activeRows.filter(r => filter === 'matched' ? isMatch(r) : !isMatch(r));
  const filteredActive = useMemo(() => {
    let list = masterFiltered;
    if (dateColumn) {
      const from = dateFrom ? new Date(dateFrom + 'T00:00:00') : null;
      const to = dateTo ? new Date(dateTo + 'T23:59:59') : null;
      list = list.filter(r => {
        const d = parseCrtDate(r.crt?.[dateColumn]);
        if (!d) return false;
        if (from && d < from) return false;
        if (to && d > to) return false;
        return true;
      });
    }
    if (dateSort !== 'none' && dateColumn) {
      list = [...list].sort((a, b) => {
        const da = parseCrtDate(a.crt?.[dateColumn]);
        const db = parseCrtDate(b.crt?.[dateColumn]);
        if (!da && !db) return 0;
        if (!da) return 1;
        if (!db) return -1;
        return dateSort === 'asc' ? da - db : db - da;
      });
    }
    return list;
  }, [masterFiltered, dateColumn, dateFrom, dateTo, dateSort]);

  useEffect(() => {
    if (onCountsChange) onCountsChange({ all: activeRows.length, matched: matchedCount, unmatched: unmatchedCount });
  }, [activeRows, matchedCount, unmatchedCount, onCountsChange]);

  const renderTable = (list, { actionable, restorable }) => (
    <div className="overflow-x-auto overflow-y-clip">
      <table className="w-full text-sm border-collapse">
        <thead className="bg-slate-50 border-b border-slate-200 sticky top-[92px] z-30 shadow-sm">
          <tr>
            <th className="text-left px-3 py-3 font-semibold text-slate-600">Source Sheet</th>
            <th className="text-left px-3 py-3 font-semibold text-slate-600">Client Name</th>
            <th className="text-left px-3 py-3 font-semibold text-slate-600">HSID#</th>
            <th className="text-left px-3 py-3 font-semibold text-slate-600">Status</th>
            <th className="text-left px-3 py-3 font-semibold text-slate-600">EDAS Completed</th>
            <th className="text-left px-3 py-3 font-semibold text-slate-600">Extra Notes</th>
            <th className="text-left px-3 py-3 font-semibold text-slate-600">Comments</th>
            <th className="px-3 py-3" />
            <th className="text-left px-3 py-3 font-semibold text-slate-600">Action</th>
            {CRT_COLUMNS.map((c, i) => (
              <th
                key={c.key}
                className={`text-left px-3 py-3 font-semibold text-slate-600 whitespace-nowrap ${i === 0 ? 'border-l-[3px] border-black' : ''}`}
              >
                {c.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {list.map((r) => {
            const matched = isMatch(r);
            const flag = flagFor(r);
            const rowBg = r.is_new ? 'bg-amber-50' : (matched ? 'bg-green-50' : 'hover:bg-slate-50');
            return (
              <tr key={r.id} className={rowBg}>
                <td className="px-3 py-2.5">
                  {r.source_sheet
                    ? <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">{r.source_sheet}</span>
                    : <span className="text-slate-300">—</span>}
                </td>
                <td className="px-3 py-2.5 font-medium text-slate-800">
                  <div className="flex items-center gap-2">
                    {r.client_name || '—'}
                    {r.is_new && (
                      <span className="inline-flex items-center gap-0.5 text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-amber-200 text-amber-800">
                        <Sparkles className="w-2.5 h-2.5" /> Newly Added
                      </span>
                    )}
                  </div>
                </td>
                <td className="px-3 py-2.5 text-slate-600">{r.hsid || '—'}</td>
                <td className="px-3 py-2.5 text-slate-600">{r.status || '—'}</td>
                <td className="px-3 py-2.5 text-slate-600">{r.edas_completed || '—'}</td>
                <td className="px-3 py-2.5 text-slate-500 max-w-xs truncate">{r.extra_notes || '—'}</td>
                <td className="px-3 py-2.5">
                  <input
                    type="text"
                    value={comments[r.id] || ''}
                    onChange={(e) => setComments(c => ({ ...c, [r.id]: e.target.value }))}
                    placeholder="Add comment..."
                    className="w-full max-w-[200px] h-8 text-xs rounded-md border border-slate-200 px-2 py-1 focus:outline-none focus:ring-1 focus:ring-blue-400"
                  />
                </td>
                <td className="px-3 py-2.5">
                  {matched && <CheckCircle2 className="w-4 h-4 text-green-600" />}
                </td>
                <td className="px-3 py-2.5">
                  <div className="flex items-center gap-1.5">
                    {flag === 'completed' && (
                      <Flag className="w-4 h-4 text-green-600 fill-green-200 shrink-0" title="Completed full program flow (March 2026 CRT)" />
                    )}
                    {flag === 'cancelled' && (
                      <Flag className="w-4 h-4 text-red-600 fill-red-200 shrink-0" title="Cancelled from program (March 2026 CRT)" />
                    )}
                    {actionable && (
                      <button
                        onClick={() => toggleCompleted(r)}
                        title="Move to Completed - No action needed"
                        className="inline-flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-md border border-emerald-300 text-emerald-700 hover:bg-emerald-50 transition-colors"
                      >
                        <Check className="w-3.5 h-3.5" /> Done
                      </button>
                    )}
                    {restorable && (
                      <button
                        onClick={() => toggleCompleted(r)}
                        title="Undo - move back to the active list"
                        className="inline-flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-md border border-slate-300 text-slate-600 hover:bg-slate-50 transition-colors"
                      >
                        <RotateCcw className="w-3.5 h-3.5" /> Undo
                      </button>
                    )}
                  </div>
                </td>
                {CRT_COLUMNS.map((c, i) => {
                  const val = r.crt ? (r.crt[c.key] || '') : '';
                  return (
                    <td
                      key={c.key}
                      className={`px-3 py-2.5 text-slate-600 whitespace-nowrap ${i === 0 ? 'border-l-[3px] border-black' : ''} ${c.key === 'comments' ? 'max-w-[260px] truncate' : ''}`}
                      title={c.key === 'comments' ? val : undefined}
                    >
                      {val || <span className="text-slate-300">—</span>}
                    </td>
                  );
                })}
              </tr>
            );
          })}
          {list.length === 0 && (
            <tr><td colSpan={9 + CRT_COLUMNS.length} className="text-center py-10 text-slate-400">No clients in this section.</td></tr>
          )}
        </tbody>
      </table>
    </div>
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="text-sm text-slate-600">
          Status source: <span className="font-medium text-slate-800">{fileName}</span> · {rows.length} rows ·{' '}
          <span className="text-green-700 font-medium">{matchedCount} matched in master list</span>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 bg-slate-100 rounded-lg p-0.5">
            {[
              { id: 'all', label: 'All', count: activeRows.length },
              { id: 'matched', label: 'In Master List', count: matchedCount },
              { id: 'unmatched', label: 'Not in Master List', count: unmatchedCount },
            ].map(f => (
              <button
                key={f.id}
                onClick={() => setFilter(f.id)}
                className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors ${
                  filter === f.id ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                {f.label}
                <span className="ml-1.5 text-slate-400">({f.count})</span>
              </button>
            ))}
          </div>
          <input ref={fileInput} type="file" accept=".xlsx,.xls" className="hidden" onChange={handleUpload} />
          <Button variant="outline" size="sm" onClick={() => fileInput.current?.click()} className="gap-1">
            <Upload className="w-4 h-4" /> Upload Status
          </Button>
        </div>
      </div>

      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="text-sm text-slate-600">
          CRT source: <span className="font-medium text-slate-800">{crtFileName}</span> · {crtRows.length} CRT rows ·{' '}
          <span className="text-amber-700 font-medium">{newCount} newly added</span>
        </div>
        <input ref={crtFileInput} type="file" accept=".xlsx,.xls" className="hidden" onChange={handleCrtUpload} />
        <Button variant="outline" size="sm" onClick={() => crtFileInput.current?.click()} className="gap-1">
          <Upload className="w-4 h-4" /> Upload CRT Workbook
        </Button>
      </div>

      <div className="flex items-center gap-3 flex-wrap bg-slate-50 border border-slate-200 rounded-lg px-3 py-2">
        <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Date</span>
        <select
          value={dateColumn}
          onChange={e => setDateColumn(e.target.value)}
          className="h-8 text-sm rounded-md border border-slate-300 px-2 bg-white"
        >
          <option value="">No date column</option>
          {DATE_COLUMNS.map(c => <option key={c.key} value={c.key}>{c.label}</option>)}
        </select>
        <label className="flex items-center gap-1 text-xs text-slate-600">
          From
          <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} className="h-8 text-sm rounded-md border border-slate-300 px-2 bg-white" />
        </label>
        <label className="flex items-center gap-1 text-xs text-slate-600">
          To
          <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} className="h-8 text-sm rounded-md border border-slate-300 px-2 bg-white" />
        </label>
        <span className="text-xs text-slate-500">Sort</span>
        <select
          value={dateSort}
          onChange={e => setDateSort(e.target.value)}
          className="h-8 text-sm rounded-md border border-slate-300 px-2 bg-white"
        >
          <option value="none">None</option>
          <option value="asc">Oldest first</option>
          <option value="desc">Newest first</option>
        </select>
        {(dateColumn || dateFrom || dateTo || dateSort !== 'none') && (
          <button
            onClick={() => { setDateColumn(''); setDateFrom(''); setDateTo(''); setDateSort('none'); }}
            className="text-xs text-slate-500 hover:text-slate-700 underline"
          >
            Clear
          </button>
        )}
      </div>

      <div className="text-xs text-slate-600 bg-green-50 border border-green-200 rounded-md px-3 py-2">
        Rows highlighted in green are already in the All Active master list (matched by HSID# or name).
        Rows marked <span className="font-semibold text-amber-700">Newly Added</span> appear in the CRT workbook but not in the uploaded status workbook.
        Use <span className="font-semibold">Done</span> to move a client to the Completed section at the bottom.
        A <span className="font-semibold text-green-700">green flag</span> marks clients who completed the full program flow (90 Day Outcome filled with a real outcome) and a <span className="font-semibold text-red-700">red flag</span> marks clients cancelled from the program — both as of the March 2026 CRT.
      </div>

      {loading || crtLoading || marchLoading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
        </div>
      ) : (
        <div className="space-y-4">
          <CollapsibleSection
            title="Cross-Reference Clients"
            count={activeRows.length}
            badgeClass="bg-blue-100 text-blue-700"
            subtitle={`${filteredActive.length} shown`}
          >
            {renderTable(filteredActive, { actionable: true })}
          </CollapsibleSection>

          <CollapsibleSection
            title="Completed - No action needed"
            count={completedRows.length}
            badgeClass="bg-emerald-100 text-emerald-700"
            subtitle="Moved from the active list"
            defaultOpen={false}
          >
            {renderTable(completedRows, { restorable: true })}
          </CollapsibleSection>
        </div>
      )}
    </div>
  );
}