import React, { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { UserSearch } from 'lucide-react';

// Fillable search box with a dropdown of every client in the Candora Central
// Database. Selecting a client calls onSelect with the full record.
export default function ClientPicker({ onSelect, placeholder }) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const { data: clients = [] } = useQuery({ queryKey: ['cr-rc-clients'], queryFn: () => base44.entities.RCClient.list('last_name', 500) });

  const matches = useMemo(() => {
    const q = search.trim().toLowerCase();
    return clients
      .filter(c => `${c.first_name || ''} ${c.last_name || ''}`.toLowerCase().includes(q))
      .slice(0, 50);
  }, [clients, search]);

  return (
    <Popover open={open && matches.length > 0} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <div className="relative">
          <UserSearch className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={search}
            placeholder={placeholder || 'Search clients...'}
            className="pl-9"
            onFocus={() => setOpen(true)}
            onChange={(e) => { setSearch(e.target.value); setOpen(true); }}
          />
        </div>
      </PopoverTrigger>
      <PopoverContent className="p-1 max-h-64 overflow-y-auto w-[var(--radix-popover-trigger-width)]" align="start">
        {matches.map(c => (
          <button
            key={c.id}
            type="button"
            className="w-full text-left px-2 py-1.5 text-sm rounded-sm hover:bg-accent truncate"
            onClick={() => { onSelect?.(c); setSearch(''); setOpen(false); }}
          >
            {c.first_name} {c.last_name}
            <span className="text-xs text-muted-foreground ml-1">{[c.phone, c.email].filter(Boolean).map(s => `· ${s}`).join(' ')}</span>
          </button>
        ))}
        {matches.length === 0 && <p className="px-2 py-1.5 text-sm text-muted-foreground">No matching clients.</p>}
      </PopoverContent>
    </Popover>
  );
}