import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { UserCheck } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { useCCReceiptSelection } from '@/components/finance/CCReceiptSelectionContext';

const fmt = n => `$${Number(n || 0).toFixed(2)}`;

// Lists the staff MasterCard receipts the finance user checked in the Staff
// MasterCard Receipts section — picking one attaches it to the statement
// line item the picker was opened on.
export default function CCStaffReceiptPickerDialog({ lineItem, onClose, onPick }) {
  const { selected } = useCCReceiptSelection();
  const receipts = Object.values(selected);

  return (
    <Dialog open={!!lineItem} onOpenChange={o => { if (!o) onClose(); }}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserCheck className="w-4 h-4 text-primary" /> Add Staff Receipt to Line Item
          </DialogTitle>
        </DialogHeader>
        {lineItem && (
          <>
            <p className="text-xs text-muted-foreground">
              Line “{lineItem.description}”{lineItem.amount != null ? ` (${fmt(lineItem.amount)})` : ''} — picking a receipt attaches it as this line's receipt.
            </p>
            {receipts.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4">
                No receipts checked yet. Check the boxes beside the receipts in the Staff MasterCard Receipts section below, then press “Add from Staff Receipts” on this line again.
              </p>
            ) : (
              <div className="max-h-[45vh] overflow-y-auto rounded-md border">
                {receipts.map(r => (
                  <button
                    key={r.id}
                    type="button"
                    className="w-full text-left flex items-center gap-3 px-3 py-2 border-b last:border-b-0 hover:bg-muted/40"
                    onClick={() => onPick(r)}
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{r.description || 'Receipt'}</p>
                      <p className="text-xs text-muted-foreground">
                        {r.date_incurred ? format(parseISO(r.date_incurred), 'MMM d, yyyy') : 'No date'}
                        {r.requester_name ? ` · ${r.requester_name}` : ''}
                      </p>
                    </div>
                    <span className="text-sm font-semibold whitespace-nowrap">{fmt(r.total_cost)}</span>
                    <Button size="sm" className="h-7">Use</Button>
                  </button>
                ))}
              </div>
            )}
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}