import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, Save, X } from 'lucide-react';
import { toast } from 'sonner';

// All 25 CRT Client Data sheet columns in actual sheet order (A–Y). This is
// the "actual CRT" form. Name + HSID are read-only identity; the 90 Day Outcome
// DATE is auto-calculated by the CRT sync (read-only here). Everything else is
// editable. On save, entity-managed columns go through syncCrossRefUpdatesToCrt
// (updates the client file → re-runs the CRT sync + billing tally automations);
// the 30/60/180-day outcome columns (no entity field, so no automation) are
// written directly to the CRT via patchCrtClientCells.
const SHEET_COLUMNS = [
  { key: 'participant_name', label: 'Client Legal Name', readonly: true },
  { key: 'hsid', label: 'COMPASS HSID #', readonly: true },
  { key: 'ceis_dea', label: 'CEIS (DEA)' },
  { key: 'dea_start_date', label: 'DEA Start Date', date: true },
  { key: 'service_element', label: 'Service Element' },
  { key: 'service_start_date', label: 'Service Start Date', date: true },
  { key: 'service_outcome', label: 'Service Outcome' },
  { key: 'service_outcome_date', label: 'Service Outcome Date', date: true },
  { key: 'placement_outcome', label: 'Placement Outcome' },
  { key: 'placement_outcome_date', label: 'Placement Outcome Date', date: true },
  { key: 'day30_outcome', label: '30 Day Outcome' },
  { key: 'day30_outcome_date', label: '30 Day Outcome Date', date: true },
  { key: 'day60_outcome', label: '60 Day Outcome' },
  { key: 'day60_outcome_date', label: '60 Day Outcome Date', date: true },
  { key: 'day90_outcome', label: '90 Day Outcome' },
  { key: 'day90_outcome_date', label: '90 Day Outcome Date', readonly: true, derived: true },
  { key: 'day180_outcome', label: '180 Day Outcome' },
  { key: 'day180_outcome_date', label: '180 Day Outcome Date', date: true },
  { key: 'comments', label: 'Comments', textarea: true },
  { key: 'eda_completion_date', label: 'EDA Completion Date', date: true },
  { key: 'work_exposure', label: 'Work Exposure Y/N' },
  { key: 'wage_subsidy', label: 'Wage Subsidy Y/N' },
  { key: 'employed_ftpt', label: 'Employed FT/PT' },
  { key: 'service_nav_support', label: 'Service Nav Support Y/N' },
  { key: 'service_nav_billing_month', label: 'Service Nav Billing Month' },
];

// Columns pushed through the entity flow (syncCrossRefUpdatesToCrt) — these
// re-run the CRT sync + billing tally automations when changed.
const ENTITY_KEYS = [
  'ceis_dea', 'dea_start_date', 'service_element', 'service_start_date',
  'service_outcome', 'service_outcome_date', 'placement_outcome', 'placement_outcome_date',
  'day90_outcome', 'comments', 'eda_completion_date', 'work_exposure', 'wage_subsidy',
  'employed_ftpt', 'service_nav_support', 'service_nav_billing_month',
];
// Columns written directly to the CRT (no entity field, no automation).
const DIRECT_KEYS = [
  'day30_outcome', 'day30_outcome_date', 'day60_outcome', 'day60_outcome_date',
  'day180_outcome', 'day180_outcome_date',
];

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
      } catch { /* fall back to checklist fields */ }
      if (cancelled) return;

      const v = {};
      for (const c of SHEET_COLUMNS) v[c.key] = '';
      if (row) {
        for (const c of SHEET_COLUMNS) {
          v[c.key] = c.date ? toDateInput(row[c.key] || '') : (row[c.key] || '');
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

  const handleChange = (key, val) => setValues((prev) => ({ ...prev, [key]: val }));

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

      // Only patch when there are direct (non-entity) values to write.
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
        Edit any field. Saving writes entity-managed columns back into the client file (re-runs the CRT sync + billing
        tallies) and writes the 30/60/180-day follow-up columns directly to the CRT.
      </p>

      {loading ? (
        <div className="flex justify-center py-8">
          <Loader2 className="w-5 h-5 animate-spin text-amber-500" />
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-3 gap-y-2.5">
            {SHEET_COLUMNS.map((c) => {
              const val = values[c.key] || '';
              const isDate = c.date;
              const displayVal = c.readonly && c.derived && val && !isDate ? val : val;
              return (
                <div key={c.key} className={`space-y-1 ${c.textarea ? 'sm:col-span-2 lg:col-span-3' : ''}`}>
                  <label className="text-[11px] font-semibold text-slate-600 flex items-center gap-1">
                    {c.label}
                    {c.derived && <span className="text-slate-400 font-normal">(calculated)</span>}
                  </label>
                  {c.textarea ? (
                    <Textarea
                      value={displayVal}
                      onChange={(e) => handleChange(c.key, e.target.value)}
                      disabled={saving}
                      rows={4}
                      placeholder="—"
                      className="text-sm resize-y bg-white"
                    />
                  ) : c.readonly ? (
                    <Input
                      value={displayVal}
                      disabled
                      placeholder="—"
                      className="h-8 text-sm bg-slate-100 text-slate-500"
                    />
                  ) : (
                    <Input
                      type={isDate ? 'date' : 'text'}
                      value={displayVal}
                      onChange={(e) => handleChange(c.key, e.target.value)}
                      disabled={saving}
                      placeholder={isDate ? '' : '—'}
                      className="h-8 text-sm bg-white"
                    />
                  )}
                </div>
              );
            })}
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