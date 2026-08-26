import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, X } from 'lucide-react';
import { monthLabelFromBillingMonth } from './packageContentsHelpers';

// Lets a staff member include an additional month's data on an auto-gathered
// document. Selecting a month calls onAdd(month), which regenerates the
// document with the combined months. Added months show as removable badges.
export default function AddMonthButton({ months, onAdd, onRemove, disabled }) {
  const [picking, setPicking] = useState(false);
  return (
    <div className="flex flex-wrap items-center justify-end gap-1.5">
      {months.map((m) => (
        <Badge key={m} variant="secondary" className="text-[10px] gap-1 pl-1.5 pr-1 py-0 font-medium">
          {monthLabelFromBillingMonth(m)}
          <button
            type="button"
            onClick={() => onRemove(m)}
            disabled={disabled}
            className="text-muted-foreground hover:text-destructive disabled:opacity-50"
            title={`Remove ${monthLabelFromBillingMonth(m)}`}
          >
            <X className="h-3 w-3" />
          </button>
        </Badge>
      ))}
      {!picking ? (
        <Button variant="outline" size="sm" onClick={() => setPicking(true)} disabled={disabled}>
          <Plus className="h-3.5 w-3.5 mr-1" /> Add a month
        </Button>
      ) : (
        <input
          type="month"
          autoFocus
          onBlur={() => setPicking(false)}
          onChange={(e) => {
            const v = e.target.value;
            setPicking(false);
            if (v && !months.includes(v)) onAdd(v);
          }}
          className="h-8 rounded-md border border-input bg-transparent px-2 text-xs"
        />
      )}
    </div>
  );
}