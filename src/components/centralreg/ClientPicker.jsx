import React, { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Input } from '@/components/ui/input';
import { UserSearch } from 'lucide-react';

// Type-to-search box over the Candora Central Database. Matching clients are
// shown in an inline list below the input; selecting one calls onSelect.
export default function ClientPicker({ onSelect, placeholder }) {
  const [search, setSearch] = useState('');
  const { data: clients = [] } = useQuery({ queryKey: ['cr-rc-clients'], queryFn: () => base44.entities.RCClient.list('last_name', 500) });

  const q = search.trim().toLowerCase();
  const matches = useMemo(() => {
    if (!q) return clients;
    return clients
      .filter(c => `${c.first_name || ''} ${c.last_name || ''}`.toLowerCase().includes(q));
  }, [clients, q]);

  return (
    <div className="relative">
      <UserSearch className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
      <Input
        value={search}
        placeholder={placeholder || 'Type a client name...'}
        className="pl-9"
        onChange={(e) => setSearch(e.target.value)}
      />
      <div className="mt-1.5 rounded-md border border-border bg-popover max-h-56 overflow-y-auto">
        {matches.length === 0 ? (
          <p className="px-3 py-2 text-sm text-muted-foreground">No matching clients.</p>
        ) : matches.map(c => (
          <button
            key={c.id}
            type="button"
            className="w-full text-left px-3 py-1.5 text-sm hover:bg-accent truncate"
            onClick={() => { onSelect?.(c); setSearch(''); }}
          >
            {c.first_name} {c.last_name}
            <span className="text-xs text-muted-foreground ml-1">{[c.phone, c.email].filter(Boolean).map(s => `· ${s}`).join(' ')}</span>
          </button>
        ))}
      </div>
    </div>
  );
}