import React, { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, UserCheck } from 'lucide-react';
import { format, parseISO } from 'date-fns';

const fmt = n => `$${Number(n || 0).toFixed(2)}`;

// Lists staff-submitted MasterCard receipts that have a file and aren't
// attached to a statement line yet — picking one attaches it as the receipt
// for the statement line the picker was opened on.
export default function CCStaffReceiptPickerDialog({ lineItem, onClose, onPick }) {
  const [search, setSearch] = useState('');

  const { data: entries = [] } = useQuery({
    queryKey: ['cc-receipt-entries'],
    queryFn: () => base44.entities.CCReceiptEntry.list('-created_date', 1000),
  });

  // Line items across all statements — receipts already attached are excluded
  const { data: allLines = [] } = useQuery({
    queryKey: ['cc-statement-lines-all'],
    queryFn: () => base44.entities.CCStatementLineItem.list('-created_date', 1000),
  });

  const receipts = useMemo(() => {
    const usedUrls = new Set(allLines.map(l => l.receipt_url).filter(Boolean));
    const q = search.trim().toLowerCase();
    return entries
      .filter(e => e.receipt_url && e.status !== 'unsubmitted' && !usedUrls.has(e.receipt_url))
      .filter(e => !q || [e.description, e.requester_name, e.supplier]
        .some(v => String(v || '').toLowerCase().includes(q)));
  }, [entries, allLines, search]);

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
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-muted-foreground absolute left-2.5 top-1/2 -translate-y-1/2" />
              <Input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search receipts…"
                className="pl-8 h-8 text-sm"
              />
            </div>
            {receipts.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4">
                No staff receipts available. Receipts appear here once staff submit them on the Candora CC Receipts page.
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