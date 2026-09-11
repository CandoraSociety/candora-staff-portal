import React from 'react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Scissors } from 'lucide-react';

const fmt = n => `$${Number(n || 0).toFixed(2)}`;

/**
 * Compact scissors control for excluding personal item(s) from a receipt.
 * The item price is entered before GST; 5% GST is added automatically
 * when the amount is deducted from the receipt total.
 */
export default function ExcludedItemsControl({ amount, description, onAmount, onDescription }) {
  const amt = parseFloat(amount);
  const active = !isNaN(amt) && amt > 0;
  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          title={active
            ? `Personal item excluded${description ? `: ${description}` : ''}`
            : 'Exclude personal item(s) from this receipt'}
          className={`inline-flex items-center gap-1 h-7 px-2 rounded-md border text-xs transition-colors ${active
            ? 'border-amber-400 bg-amber-50 text-amber-700'
            : 'border-border text-muted-foreground hover:bg-muted'}`}
        >
          <Scissors className="w-3.5 h-3.5" />
          {active ? `−${fmt(amt * 1.05)}` : ''}
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-72" align="end">
        <div className="space-y-3">
          <p className="text-xs text-muted-foreground">
            Personal item(s) on this receipt that should have been a separate transaction — deducted from the claim. GST is added automatically.
          </p>
          <div>
            <Label className="text-xs">Item price (before GST)</Label>
            <Input type="number" step="0.01" min="0" value={amount || ''} onChange={e => onAmount(e.target.value)} placeholder="0.00" className="h-8" />
          </div>
          <div>
            <Label className="text-xs">Item description</Label>
            <Input value={description || ''} onChange={e => onDescription(e.target.value)} placeholder="e.g. personal snacks" className="h-8" />
          </div>
          {active && (
            <p className="text-xs text-amber-700">Deducting {fmt(amt * 1.05)} (incl. GST) from this receipt.</p>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}