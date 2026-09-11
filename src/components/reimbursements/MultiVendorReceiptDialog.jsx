import React, { useEffect, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { X } from 'lucide-react';
import { format } from 'date-fns';
import { useCurrentUser } from '@/lib/useAuth';
import { displayName } from '@/lib/userDisplayName';
import { PROGRAM_OPTIONS } from '@/lib/reimbursementConstants';
import { REIMBURSEMENT_MODES } from '@/lib/reimbursementMode';

// Alberta GST is 5% — the GST portion of an all-inclusive total is total × (5/105) = total / 21
const calcGst = (total) => (parseFloat(total) / 21).toFixed(2);

// Shown when an uploaded receipt contains purchases from multiple vendors —
// creates a separate entry per vendor (all sharing the same uploaded receipt).
export default function MultiVendorReceiptDialog({ open, onOpenChange, vendors, receiptUrl, mode = 'reimbursement' }) {
  const qc = useQueryClient();
  const { user } = useCurrentUser();
  const cfg = REIMBURSEMENT_MODES[mode];
  const entryEntity = base44.entities[cfg.entryEntity];
  const [rows, setRows] = useState([]);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (open) {
      setError('');
      setRows((vendors || []).map(v => ({
        date_incurred: v.date || format(new Date(), 'yyyy-MM-dd'),
        description: v.description || '',
        supplier: v.supplier || '',
        total_cost: v.total != null ? String(v.total) : '',
        gst: v.gst != null ? String(v.gst) : '',
        program: '', program_other: '', food_included: null,
      })));
    }
  }, [open, vendors]);

  const setRow = (i, k, v) => setRows(prev => prev.map((r, idx) => idx === i ? { ...r, [k]: v } : r));

  const toggleFood = (i, checked) => {
    setRows(prev => prev.map((r, idx) => {
      if (idx !== i) return r;
      const next = { ...r, food_included: checked };
      if (!checked) {
        const amt = parseFloat(r.total_cost);
        if (!isNaN(amt) && amt > 0) next.gst = calcGst(r.total_cost);
      }
      return next;
    }));
  };

  const createAll = async () => {
    setError('');
    for (let i = 0; i < rows.length; i++) {
      const r = rows[i];
      const label = r.supplier || `entry ${i + 1}`;
      if (!r.description.trim()) { setError(`Describe what was purchased from ${label}.`); return; }
      if (!r.program) { setError(`Select the program for ${label}.`); return; }
      if (r.program === 'other' && !r.program_other.trim()) { setError(`Specify the program for ${label}.`); return; }
      if (r.food_included === null || r.food_included === undefined) { setError(`Indicate whether the ${label} purchase includes food items.`); return; }
      const amt = parseFloat(r.total_cost);
      if (isNaN(amt) || amt <= 0) { setError(`Enter the total cost for ${label}.`); return; }
      if (r.food_included === true && (r.gst === '' || r.gst === null)) { setError(`Enter the GST for ${label} (enter 0 if none was charged).`); return; }
    }
    setSubmitting(true);
    try {
      await entryEntity.bulkCreate(rows.map(r => {
        const amt = parseFloat(r.total_cost);
        const gstVal = r.gst !== '' && r.gst !== null ? parseFloat(r.gst) : 0;
        return {
          requester_name: displayName(user),
          requester_email: user?.email || '',
          program: r.program,
          program_other: r.program === 'other' ? r.program_other : '',
          date_incurred: r.date_incurred || null,
          description: r.description,
          supplier: r.supplier,
          total_cost: amt,
          gst: gstVal,
          food_included: r.food_included === true,
          funder_cost: 0,
          account_no: '',
          funder_no: '',
          receipt_url: receiptUrl,
          notes: '',
          status: 'unsubmitted',
        };
      }));
      qc.invalidateQueries({ queryKey: [cfg.myEntriesKey] });
      onOpenChange(false);
    } catch (err) {
      setError(err?.message || 'Failed to save entries.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>{rows.length} vendors on this receipt</DialogTitle>
        </DialogHeader>
        <p className="text-xs text-muted-foreground -mt-2">
          A separate entry will be created for each vendor. Review the details, pick the program for each, then add them — the same receipt file is attached to all.
        </p>
        <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-1">
          {rows.map((r, i) => (
            <div key={i} className="rounded-xl border bg-muted/30 p-3 space-y-2 relative">
              <button
                type="button"
                onClick={() => setRows(prev => prev.filter((_, idx) => idx !== i))}
                className="absolute right-2 top-2 text-muted-foreground hover:text-destructive transition-colors disabled:opacity-30"
                disabled={rows.length <= 1}
                title="Remove this entry"
              ><X className="w-4 h-4" /></button>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label className="text-xs">Date</Label>
                  <Input type="date" className="h-8" value={r.date_incurred} onChange={e => setRow(i, 'date_incurred', e.target.value)} />
                </div>
                <div>
                  <Label className="text-xs">Supplier</Label>
                  <Input className="h-8" value={r.supplier} onChange={e => setRow(i, 'supplier', e.target.value)} />
                </div>
              </div>
              <div>
                <Label className="text-xs">Description (items purchased) *</Label>
                <Input className="h-8" value={r.description} onChange={e => setRow(i, 'description', e.target.value)} />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label className="text-xs">Total Cost (with GST) *</Label>
                  <Input type="number" step="0.01" min="0" className="h-8" value={r.total_cost} onChange={e => setRow(i, 'total_cost', e.target.value)} placeholder="0.00" />
                </div>
                <div>
                  <Label className="text-xs">GST</Label>
                  <Input
                    type="number" step="0.01" min="0" className="h-8" value={r.gst}
                    onChange={e => setRow(i, 'gst', e.target.value)}
                    placeholder={r.food_included === false ? 'auto' : '0.00'}
                    disabled={r.food_included === false}
                    title={r.food_included === false ? 'Auto-calculated at 5% Alberta GST' : 'Enter the GST amount from the receipt'}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2 items-end">
                <div>
                  <Label className="text-xs">Program *</Label>
                  <Select value={r.program} onValueChange={v => setRow(i, 'program', v)}>
                    <SelectTrigger className="h-8"><SelectValue placeholder="Select program" /></SelectTrigger>
                    <SelectContent>
                      {PROGRAM_OPTIONS.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  {r.program === 'other' && (
                    <Input value={r.program_other} onChange={e => setRow(i, 'program_other', e.target.value)} placeholder="Specify program" className="h-8 mt-1" />
                  )}
                </div>
                <div>
                  <Label className="text-xs">Food items? *</Label>
                  <div className="flex items-center gap-2">
                    <button
                      type="button" onClick={() => toggleFood(i, true)}
                      className={`h-8 px-3 rounded-md text-xs font-medium border transition-colors ${r.food_included === true ? 'bg-primary text-primary-foreground border-primary' : 'border-border text-muted-foreground hover:bg-muted'}`}
                    >Yes</button>
                    <button
                      type="button" onClick={() => toggleFood(i, false)}
                      className={`h-8 px-3 rounded-md text-xs font-medium border transition-colors ${r.food_included === false ? 'bg-primary text-primary-foreground border-primary' : 'border-border text-muted-foreground hover:bg-muted'}`}
                    >No</button>
                  </div>
                </div>
              </div>
            </div>
          ))}
          {error && <div className="text-xs text-red-600">{error}</div>}
        </div>
        <DialogFooter>
          <DialogClose asChild><Button variant="outline" disabled={submitting}>Cancel</Button></DialogClose>
          <Button onClick={createAll} disabled={submitting || rows.length === 0}>
            {submitting ? 'Adding…' : `Add ${rows.length} Entr${rows.length === 1 ? 'y' : 'ies'}`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}