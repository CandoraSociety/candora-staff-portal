import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Loader2, Save, X } from 'lucide-react';
import { toast } from 'sonner';
import {
  PLACEMENT_OUTCOME_CODES, FOLLOWUP_90DAY_CODES, outcomeLabel,
} from '@/lib/crtCodes';

// All 25 CRT Client Data sheet columns in actual sheet order (A–Y), mirroring
// the real workbook grid. Each column carries its input type and (where
// applicable) the dropdown option set the real CRT enforces, so the inline
// editor looks and behaves like editing the sheet directly. The form renders
// as one horizontally-scrollable row so all columns stay on a single line.

const YES_NO = ['Yes', 'No'];
const SERVICE_ELEMENT_OPTIONS = ['CEIS', 'WD'];
const SERVICE_OUTCOME_OPTIONS = ['In Progress', 'Complete', 'Cancelled', 'Incomplete'];
const FTPT_OPTIONS = ['FT', 'PT'];

const SHEET_COLUMNS = [
  { key: 'participant_name', label: 'Client Legal Name', type: 'text', readonly: true, sticky: true, width: 'w-44' },
  { key: 'hsid', label: 'COMPASS HSID #', type: 'text', readonly: true, sticky: true, width: 'w-28' },
  { key: 'ceis_dea', label: 'CEIS (DEA)', type: 'select', options: YES_NO, width: 'w-24' },
  { key: 'dea_start_date', label: 'DEA Start Date', type: 'date', width: 'w-36' },
  { key: 'service_element', label: 'Service Element', type: 'select', options: SERVICE_ELEMENT_OPTIONS, width: 'w-32' },
  { key: 'service_start_date', label: 'Service Start Date', type: 'date', width: 'w-36' },
  { key: 'service_outcome', label: 'Service Outcome', type: 'select', options: SERVICE_OUTCOME_OPTIONS, width: 'w-36' },
  { key: 'service_outcome_date', label: 'Service Outcome Date', type: 'date', width: 'w-36' },
  { key: 'placement_outcome', label: 'Placement Outcome', type: 'select', options: PLACEMENT_OUTCOME_CODES, optionLabel: outcomeLabel, width: 'w-44' },
  { key: 'placement_outcome_date', label: 'Placement Outcome Date', type: 'date', width: 'w-36' },
  { key: 'day90_outcome', label: '90 Day Outcome', type: 'select', options: FOLLOWUP_90DAY_CODES, optionLabel: outcomeLabel, width: 'w-44' },
  { key: 'day90_outcome_date', label: '90 Day Outcome Date', type: 'date', width: 'w-36' },
  { key: 'comments', label: 'Comments', type: 'textarea', width: 'w-72' },
  { key: 'eda_completion_date', label: 'EDA Completion Date', type: 'date', width: 'w-36' },
  { key: 'work_exposure', label: 'Work Exposure Y/N', type: 'select', options: YES_NO, width: 'w-32' },
  { key: 'wage_subsidy', label: 'Wage Subsidy Y/N', type: 'select', options: YES_NO, width: 'w-32' },
  { key: 'employed_ftpt', label: 'Employed FT/PT', type: 'select', options: FTPT_OPTIONS, width: 'w-28' },
  { key: 'service_nav_support', label: 'Service Nav Support Y/N', type: 'select', options: YES_NO, width: 'w-36' },
  { key: 'service_nav_billing_month', label: 'Service Nav Billing Month', type: 'month', width: 'w-36' },
];

// Columns pushed through the entity flow (syncCrossRefUpdatesToCrt) — these
// re-run the CRT sync + billing tally automations when changed.
const ENTITY_KEYS = [
  'ceis_dea', 'dea_start_date', 'service_element', 'service_start_date',
  'service_outcome', 'service_outcome_date', 'placement_outcome', 'placement_outcome_date',
  'day90_outcome', 'day90_outcome_date', 'comments', 'eda_completion_date', 'work_exposure', 'wage_subsidy',
  'employed_ftpt',
];
// Columns with no corresponding Client entity field — they're auto-derived by
// the CRT sync, so the entity-flow reverse-map (applyCrossRefToClient) drops
// them. Write them DIRECTLY to the CRT cell so a manual edit populates
// immediately. Column X persists when the client's 90-day-derived value is
// blank; column Y is force-written by the next portal sync, so edit-then-close
// the month to freeze a manual Y.
const DIRECT_KEYS = ['service_nav_support', 'service_nav_billing_month'];

const normHsid = (s) => String(s || '').replace(/[^0-9a-z]/gi, '').toLowerCase();
const normName = (s) => String(s || '').toLowerCase().replace(/[,.\s]+/g, ' ').trim();
const canonicalNameKey = (name) => {
  const n = normName(name);
  if (!n) return '';
  if (name.includes(',')) {
    const [last, ...rest] = name.split(',').map((x) => x.trim());
    const firstTok = normName((rest.join(' ').split(/\s+/)[0]) || '');
    const lastTok = normName((last.split(/\s+/)[0]) || '');
    return firstTok && lastTok ? `${lastTok} ${firstTok}` : n;
  }
  const tokens = n.split(' ').filter(Boolean);
  if (tokens.length >= 2) return `${tokens[tokens.length - 1]} ${tokens[0]}`;
  return n;
};

const toDateInput = (s) => {
  if (!s) return '';
  const m = String(s).match(/^(\d{1,2})\/(\d{1,2})\/(\d{2,4})$/);
  if (m) {
    let y = +m[3]; if (y < 100) y += 2000;
    return `${y}-${String(+m[1]).padStart(2, '0')}-${String(+m[2]).padStart(2, '0')}`;
  }
  const iso = String(s).match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (iso) return iso[0];
  const d = new Date(s);
  if (!isNaN(d.getTime())) return d.toISOString().slice(0, 10);
  return '';
};

const CHECKLIST_LABEL_TO_KEY = {
  'Client Legal Name': 'participant_name',
  'COMPASS HSID #': 'hsid',
  'CEIS (DEA)': 'ceis_dea',
  'DEA Start Date': 'dea_start_date',
  'Service Element': 'service_element',
  'Service Start Date': 'service_start_date',
  'Service Outcome': 'service_outcome',
  'Service Outcome Date': 'service_outcome_date',
  'Placement Outcome': 'placement_outcome',
  'Placement Outcome Date': 'placement_outcome_date',
  '90 Day Outcome': 'day90_outcome',
  'Comments': 'comments',
};

export default function EditCrtInline({ item, onSaved, onClose }) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [values, setValues] = useState({});

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    (async () => {
      let row = null;
      try {
        const res = await base44.functions.invoke('getCrtWorkbookRows', { file_name: item.workbook || '' });
        const rows = res.data?.rows || [];
        const rh = normHsid(item.hsid);
        const cKey = canonicalNameKey(item.client_name);
        if (rh) row = rows.find((r) => normHsid(r.hsid) === rh);
        if (!row && cKey) row = rows.find((r) => canonicalNameKey(r.participant_name) === cKey);
        if (!row && item.client_name) {
          const ln = normName(item.client_name);
          row = rows.find((r) => normName(r.participant_name) === ln);
        }
      } catch { /* fall back below */ }
      if (cancelled) return;

      // Always fetch the entity-derived row — it carries the correct
      // eda_completion_date (an entity field, NOT CRT column T, which is the
      // WD placement outcome date) so the auto-populate (service_outcome =
      // Complete → service_outcome_date mirrors EDA completion) works.
      let entityRow = null;
      if (item.client_id) {
        try {
          const er = await base44.functions.invoke('getClientCrtRow', { client_id: item.client_id });
          if (er.data?.row) entityRow = er.data.row;
        } catch { /* ignore */ }
        if (cancelled) return;
      }
      if (!row && entityRow) row = entityRow;

      const v = {};
      for (const c of SHEET_COLUMNS) v[c.key] = '';
      if (row) {
        for (const c of SHEET_COLUMNS) {
          const src = (c.key === 'eda_completion_date' && entityRow) ? entityRow : row;
          v[c.key] = c.type === 'date' ? toDateInput(src[c.key] || '') : (src[c.key] || '');
        }
      } else {
        for (const f of (item.fields || [])) {
          const key = CHECKLIST_LABEL_TO_KEY[f.label];
          if (key) v[key] = f.label.toLowerCase().includes('date') ? toDateInput(f.value) : f.value;
        }
        if (item.client_name) v.participant_name = item.client_name;
        if (item.hsid) v.hsid = item.hsid;
      }
      if (!cancelled) {
        setValues(v);
        setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [item]);

  const handleChange = (key, val) => setValues((prev) => {
    const next = { ...prev, [key]: val };
    // Auto-populate derived fields, mirroring the actual CRT derivation
    // (mapClientToCrtRow) so the saved row is correct without manual entry.
    // When Service Outcome is marked Complete, the Service Outcome Date mirrors
    // the EDA Completion Date. When marked Cancelled/Incomplete, both the date
    // and EDA Completion clear (no completion to record).
    if (key === 'service_outcome') {
      if (val === 'Complete') {
        if (next.eda_completion_date) next.service_outcome_date = next.eda_completion_date;
      } else if (val === 'Cancelled' || val === 'Incomplete') {
        next.service_outcome_date = '';
        next.eda_completion_date = '';
      }
    }
    if (key === 'eda_completion_date' && next.service_outcome === 'Complete') {
      next.service_outcome_date = val;
    }
    return next;
  });

  const handleSave = async () => {
    setSaving(true);
    try {
      const crt_fields = { participant_name: values.participant_name || item.client_name || '', hsid: values.hsid || item.hsid || '' };
      for (const k of ENTITY_KEYS) crt_fields[k] = values[k] || '';

      const cells = {};
      for (const k of DIRECT_KEYS) cells[k] = values[k] || '';

      const syncRes = await base44.functions.invoke('syncCrossRefUpdatesToCrt', {
        updates: [{ hsid: item.hsid || '', client_name: item.client_name || '', crt_fields }],
      });
      if (syncRes.data?.error) throw new Error(syncRes.data.error);

      const hasDirect = Object.values(cells).some((v) => v !== '');
      if (hasDirect) {
        const patchRes = await base44.functions.invoke('patchCrtClientCells', {
          hsid: item.hsid || '',
          client_name: item.client_name || '',
          cells,
        });
        if (patchRes.data?.error) throw new Error(patchRes.data.error);
      }

      toast.success(`CRT entries saved for ${item.client_name || 'client'} — automations re-run.`);
      onSaved?.();
      onClose?.();
    } catch (e) {
      toast.error('Failed to save CRT entries: ' + (e.message || 'Unknown error'));
    } finally {
      setSaving(false);
    }
  };

  const renderCell = (col) => {
    const val = values[col.key] || '';
    const disabled = saving || col.readonly;
    const base = 'w-full bg-transparent text-xs px-1.5 py-1 outline-none border-0 focus:ring-1 focus:ring-blue-400 rounded-sm';

    if (col.readonly) {
      return (
        <input
          type="text"
          value={val}
          disabled
          placeholder="—"
          className="w-full bg-slate-100 text-slate-500 text-xs px-1.5 py-1 border-0 rounded-sm cursor-default"
        />
      );
    }
    if (col.type === 'select') {
      return (
        <select
          value={val}
          onChange={(e) => handleChange(col.key, e.target.value)}
          disabled={disabled}
          className={`${base} ${col.readonly ? 'bg-slate-100 text-slate-500' : 'bg-white'} cursor-pointer`}
        >
          <option value="">—</option>
          {col.options.map((opt) => (
            <option key={opt} value={opt}>
              {col.optionLabel ? col.optionLabel(opt) : opt}
            </option>
          ))}
        </select>
      );
    }
    if (col.type === 'textarea') {
      return (
        <textarea
          value={val}
          onChange={(e) => handleChange(col.key, e.target.value)}
          disabled={disabled}
          rows={2}
          placeholder="—"
          className="w-full bg-white text-xs px-1.5 py-1 border-0 outline-none focus:ring-1 focus:ring-blue-400 rounded-sm resize-y min-w-[16rem]"
        />
      );
    }
    return (
      <input
        type={col.type === 'date' ? 'date' : col.type === 'month' ? 'month' : 'text'}
        value={val}
        onChange={(e) => handleChange(col.key, e.target.value)}
        disabled={disabled}
        placeholder="—"
        className={`${base} bg-white`}
      />
    );
  };

  return (
    <div className="border border-amber-300 bg-amber-50/60 rounded-lg p-3 space-y-3 mt-1">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <h4 className="text-xs font-semibold text-amber-800 uppercase tracking-wide flex items-center gap-1.5">
          Edit CRT entries
        </h4>
        <Button variant="ghost" size="sm" onClick={onClose} disabled={saving} className="h-7 text-xs text-slate-500 hover:bg-amber-100">
          <X className="w-3.5 h-3.5" /> Collapse
        </Button>
      </div>
      <p className="text-xs text-amber-700">
        Edit any field — this row mirrors the actual CRT Client Data sheet. Entity-managed columns save back into the
        client file (re-running the CRT sync + billing tallies); the 30/60/180-day follow-up columns write directly to
        the CRT. Scroll horizontally to reach all 25 columns.
      </p>

      {loading ? (
        <div className="flex justify-center py-8">
          <Loader2 className="w-5 h-5 animate-spin text-amber-500" />
        </div>
      ) : (
        <>
          <div className="border border-slate-200 rounded-md overflow-hidden bg-white">
            <div className="overflow-x-auto">
              <table className="border-collapse">
                <thead>
                  <tr className="bg-slate-800 text-white">
                    {SHEET_COLUMNS.map((c) => (
                      <th
                        key={c.key}
                        className={`text-left py-1.5 px-2 font-semibold whitespace-nowrap text-[11px] uppercase tracking-wide border-r border-slate-700 ${c.width || ''} ${c.sticky ? 'sticky left-0 z-20 bg-slate-800' : ''}`}
                      >
                        {c.label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  <tr className="bg-white">
                    {SHEET_COLUMNS.map((c) => (
                      <td
                        key={c.key}
                        className={`border-r border-slate-200 align-top px-0 py-0 ${c.width || ''} ${c.sticky ? 'sticky left-0 z-10 bg-white' : ''}`}
                      >
                        {renderCell(c)}
                      </td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-1">
            <Button variant="outline" size="sm" onClick={onClose} disabled={saving}>
              Cancel
            </Button>
            <Button size="sm" onClick={handleSave} disabled={saving} className="gap-1.5">
              {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
              Save CRT entries
            </Button>
          </div>
        </>
      )}
    </div>
  );
}