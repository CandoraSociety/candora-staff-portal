import { base44 } from '@/api/base44Client';

// Shared helpers for keeping a submitted reimbursement / MasterCard form's
// totals in sync when its entries are edited, added or removed while the
// form is still editable (status 'pending').

export async function getFormItems({ cfg, userEmail, formId }) {
  const fresh = await base44.entities[cfg.entryEntity].filter({ requester_email: userEmail });
  return fresh.filter(e => e.form_id === formId && e.status !== 'unsubmitted');
}

export async function syncFormTotals({ cfg, form, items }) {
  const amount = items.reduce((s, e) => s + (e.total_cost || 0), 0);
  const tax = items.reduce((s, e) => s + (e.gst || 0), 0);
  await base44.entities[cfg.formEntity].update(form.id, {
    amount: +amount.toFixed(2),
    tax: +tax.toFixed(2),
    entry_count: items.length,
    entry_ids: items.map(e => e.id),
  });
}

export function invalidateFormQueries(qc, cfg) {
  qc.invalidateQueries({ queryKey: [cfg.myFormsKey] });
  qc.invalidateQueries({ queryKey: [cfg.myEntriesKey] });
  qc.invalidateQueries({ queryKey: [cfg.financeFormsKey] });
}