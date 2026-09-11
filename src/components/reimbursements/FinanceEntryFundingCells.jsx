import React, { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Check, Save } from 'lucide-react';
import { REIMBURSEMENT_MODES } from '@/lib/reimbursementMode';

const fmt = n => `$${Number(n || 0).toFixed(2)}`;

/**
 * Renders the finance-fillable funding cells for one reimbursement entry:
 * "1/2 GST" (auto = half the entry's GST), Funder Cost, Account #, Funder #
 * plus a per-row save button. Returns <td> cells — place directly inside
 * the entries table row in the finance portal.
 */
export default function FinanceEntryFundingCells({ entry, mode = 'reimbursement' }) {
  const qc = useQueryClient();
  const cfg = REIMBURSEMENT_MODES[mode];
  const entryEntity = base44.entities[cfg.entryEntity];
  const [funderCost, setFunderCost] = useState(entry.funder_cost ?? '');
  const [accountNo, setAccountNo] = useState(entry.account_no || '');
  const [funderNo, setFunderNo] = useState(entry.funder_no || '');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const dirty =
    (Number(funderCost) || 0) !== (entry.funder_cost || 0) ||
    accountNo !== (entry.account_no || '') ||
    funderNo !== (entry.funder_no || '');

  const save = async () => {
    setSaving(true);
    try {
      await entryEntity.update(entry.id, {
        funder_cost: funderCost === '' ? null : Number(funderCost),
        account_no: accountNo,
        funder_no: funderNo,
      });
      await qc.invalidateQueries({ queryKey: [cfg.financeEntriesKey] });
      setSaved(true);
      setTimeout(() => setSaved(false), 1500);
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <td className="px-2 py-1.5 text-right whitespace-nowrap text-muted-foreground bg-muted">
        {entry.gst ? fmt(entry.gst / 2) : '$ -'}
      </td>
      <td className="px-2 py-1.5 bg-muted">
        <Input
          type="number" step="0.01" min="0"
          value={funderCost}
          onChange={e => { setFunderCost(e.target.value); setSaved(false); }}
          placeholder="$0.00" className="h-7 w-24 text-xs" />
      </td>
      <td className="px-2 py-1.5 bg-muted">
        <Input
          value={accountNo}
          onChange={e => { setAccountNo(e.target.value); setSaved(false); }}
          placeholder="—" className="h-7 w-24 text-xs" />
      </td>
      <td className="px-2 py-1.5 bg-muted">
        <Input
          value={funderNo}
          onChange={e => { setFunderNo(e.target.value); setSaved(false); }}
          placeholder="—" className="h-7 w-24 text-xs" />
      </td>
      <td className="px-2 py-1.5 text-center bg-muted">
        {dirty ? (
          <Button size="sm" variant="ghost" className="h-7 w-7 px-0 text-blue-600 hover:bg-blue-50" onClick={save} disabled={saving} title="Save funding details">
            <Save className="w-3.5 h-3.5" />
          </Button>
        ) : saved ? (
          <Check className="w-3.5 h-3.5 text-green-600 mx-auto" />
        ) : (
          <span className="text-muted-foreground">—</span>
        )}
      </td>
    </>
  );
}