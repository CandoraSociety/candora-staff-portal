import React, { useState } from 'react';
import { ChevronDown, UserSearch } from 'lucide-react';
import { cn } from '@/lib/utils';
import ClientPicker from '@/components/centralreg/ClientPicker';

// Toggle-down "Find an existing client" section. Collapsed by default; expands
// to reveal a type-to-search client picker. Selecting a client calls onSelect.
export default function ExistingClientToggle({ onSelect }) {
  const [open, setOpen] = useState(false);

  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
      >
        <UserSearch className="h-4 w-4" />
        Find an existing client (optional)
        <ChevronDown className={cn('h-4 w-4 transition-transform', open && 'rotate-180')} />
      </button>
      {open && (
        <div className="mt-2">
          <ClientPicker onSelect={onSelect} />
        </div>
      )}
    </div>
  );
}