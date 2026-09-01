import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, Save, Pencil } from 'lucide-react';
import { toast } from 'sonner';

// Mirrors the CRT columns shown in the Cross-Reference tab — the "actual CRT"
// form. participant_name + hsid are read-only (identity); 90 Day Outcome Date
// is intentionally excluded (it's auto-calculated by the CRT sync). Everything
// else is editable and pushed through syncCrossRefUpdatesToCrt, which writes
// the values back into the client file so the normal CRT sync + billing tally
// automations re-run exactly as if the field had been filled the usual way.
const EDIT_COLUMNS = [
  { key: 'participant_name', label: 'Participant Legal Name', readonly: true },
  { key: 'hsid', label: 'COMPASS HSID #', readonly: true },
  { key: 'ceis_dea', label: 'CEIS (DEA)' },
  { key: 'dea_start_date', label: 'DEA Start Date', date: true },
  { key: 'service_element', label: 'Service Element' },
  { key: 'service_start_date', label: 'Service Start Date', date: true },
  { key: 'service_outcome', label: 'Service Outcome' },
  { key: 'service_outcome_date', label: 'Service Outcome Date', date: true },
  { key: 'placement_outcome', label: 'Placement Outcome' },
  { key: 'placement_outcome_date', label: 'Placement Outcome Date', date: true },
  { key: 'day90_outcome', label: '90 Day Outcome' },
  { key: 'comments', label: 'CRT Comments', textarea: true },
  { key: 'eda_completion_date', label: 'EDA Completion Date', date: true },
  { key: 'work_exposure', label: 'Work Exposure Y/N' },
  { key: 'wage_subsidy', label: 'Wage Subsidy Y/N' },
  { key: 'employed_ftpt', label: 'Employed FT/PT' },
  { key: 'service_nav_support', label: 'Service Nav Support Y/N' },
  { key: 'service_nav_billing_month', label: 'Service Nav Billing Month' },
];

const DATE_KEYS = new Set(EDIT_COLUMNS.filter(c => c.date).map(c => c.key));

// Checklist field label → CRT column key (used to prefill when the live CRT row
// can't be located). Date fields in the checklist are already ISO YYYY-MM-DD.
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

const normHsid = (s) => String(s || '').replace(/[^0-9a-z]/gi, '').toLowerCase();
const normName = (s) => String(s || '').toLowerCase().replace(/[,.\s]+/g, ' ').trim();
const canonicalNameKey = (name) => {
  const n = normName(name);
  if (!n) return '';
  if (name.includes(',')) {
    const [last, ...rest] = name.split(',').map(x => x.trim());
    const firstTok = normName((rest.join(' ').split(/\s+/)[0]) || '');
    const lastTok = normName((last.split(/\s+/)[0]) || '');
    return firstTok && lastTok ? `${lastTok} ${firstTok}` : n;
  }
  const tokens = n.split(' ').filter(Boolean);
  if (tokens.length >= 2) return `${tokens[tokens.length - 1]} ${tokens[0]}`;
  return n;
};

// Convert MM/DD/YY (or any parseable date) to YYYY-MM-DD for <input type="date">.
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

export default function EditCrtDialog({ item, open, onOpenChange, onSaved }) {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [values, setValues] = useState({});

  useEffect(() => {
    if (!open || !item) return;
    let cancelled = false;
    setLoading(true);
    (async () => {
      let row = null;
      try {
        const res = await base44.functions.invoke('getCrtWorkbookRows', { file_name: item.workbook || '' });
        const rows = res.data?.rows || [];
        const rh = normHsid(item.hsid);
        const cKey = canonicalNameKey(item.client_name);
        if (rh) row = rows.find(r => normHsid(r.hsid) === rh);
        if (!row && cKey) row = rows.find(r => canonicalNameKey(r.participant_name) === cKey);
        if (!row && item.client_name) {
          const ln = normName(item.client_name);
          row = rows.find(r => normName(r.participant_name) === ln);
        }
      } catch { /* fall back to checklist fields below */ }
      if (cancelled) return;

      const v = {};
      for (const c of EDIT_COLUMNS) v[c.key] = '';
      if (row) {
        for (const c of EDIT_COLUMNS) {
          v[c.key] = c.date ? toDateInput(row[c.key] || '') : (row[c.key] || '');
        }
      } else {
        // Fallback: prefill from the checklist item's fields.
        for (const f of (item.fields || [])) {
          const key = CHECKLIST_LABEL_TO_KEY[f.label];
          if (key) v[key] = f.date !== undefined ? toDateInput(f.value) : f.value;
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
  }, [open, item]);

  const handleChange = (key, val) => setValues(prev => ({ ...prev, [key]: val }));

  const handleSave = async () => {
    setSaving(true);
    try {
      const crt_fields = {};
      for (const c of EDIT_COLUMNS) {
        if (c.readonly) continue;
        crt_fields[c.key] = values[c.key] || '';
      }
      crt_fields.participant_name = values.participant_name || item.client_name || '';
      crt_fields.hsid = values.hsid || item.hsid || '';
      const res = await base44.functions.invoke('syncCrossRefUpdatesToCrt', {
        updates: [{ hsid: item.hsid || '', client_name: item.client_name || '', crt_fields }],
      });
      if (res.data?.error) throw new Error(res.data.error);
      toast.success(`CRT entries saved for ${item.client_name || 'client'} — automations re-run.`);
      onOpenChange?.(false);
      onSaved?.();
    } catch (e) {
      toast.error('Failed to save CRT entries: ' + (e.message || 'Unknown error'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!saving) onOpenChange?.(o); }}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Pencil className="w-4 h-4 text-amber-600" />
            Edit CRT — {item?.client_name || 'Client'}
          </DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-xs text-slate-500">
              Edit any CRT field below. Saving writes the values back into the client file and re-runs the
              normal CRT sync (re-derives the row, calculates the 90-day date) and billing tallies — the same
              automations that fire when a field is filled the usual way.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-3">
              {EDIT_COLUMNS.map((c) => {
                const val = values[c.key] || '';
                const common = {
                  value: val,
                  onChange: (e) => handleChange(c.key, e.target.value),
                  disabled: c.readonly || saving,
                };
                return (
                  <div key={c.key} className={`space-y-1 ${c.textarea ? 'sm:col-span-2' : ''}`}>
                    <label className="text-xs font-semibold text-slate-600">{c.label}</label>
                    {c.textarea ? (
                      <Textarea
                        {...common}
                        rows={4}
                        placeholder="—"
                        className="text-sm resize-y"
                      />
                    ) : (
                      <Input
                        {...common}
                        type={c.date ? 'date' : 'text'}
                        placeholder={c.date ? '' : '—'}
                        className="h-8 text-sm"
                      />
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <DialogFooter className="gap-2">
          <Button variant="outline" size="sm" onClick={() => onOpenChange?.(false)} disabled={saving}>
            Cancel
          </Button>
          <Button size="sm" onClick={handleSave} disabled={loading || saving} className="gap-1.5">
            {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
            Save CRT entries
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}