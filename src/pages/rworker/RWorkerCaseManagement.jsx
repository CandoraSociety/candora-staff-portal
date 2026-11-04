import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Search, ChevronRight } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import StatusBadge from '@/components/rc/StatusBadge';
import { CASE_STATUS_OPTIONS } from '@/lib/rcConstants';
import { useAuth } from '@/lib/AuthContext';

const CATEGORIES = [
  { value: 'intensive_services', label: 'Intensive Services' },
  { value: 'general', label: 'General Clients' },
  { value: 'caregiver_capacity_0_5', label: 'Caregiver Capacity 0-6y' },
];

// Case Management — the client files a resource worker works from, split the
// same way as the central database but kept to a single readable list.
export default function RWorkerCaseManagement() {
  const { user } = useAuth();
  const [category, setCategory] = useState('general');
  const [search, setSearch] = useState('');
  const [mineOnly, setMineOnly] = useState(false);

  const myName = (user?.full_name || '').toLowerCase();
  const myEmail = (user?.email || '').toLowerCase();
  const isMine = (worker) => {
    const w = (worker || '').trim().toLowerCase();
    return !!w && (w === myName || w === myEmail);
  };

  const { data: clients = [], isLoading } = useQuery({
    queryKey: ['rw-clients'],
    queryFn: () => base44.entities.RCClient.filter({ case_status: { $ne: 'closed' } }, { limit: 300 }),
    select: (page) => page.items || [],
  });

  const byCategory = useMemo(
    () => CATEGORIES.reduce((acc, c) => {
      acc[c.value] = clients.filter((client) => (client.service_category || 'general') === c.value);
      return acc;
    }, {}),
    [clients]
  );

  const filtered = (byCategory[category] || [])
    .filter((c) => !mineOnly || isMine(c.assigned_worker))
    .filter((c) => {
      if (!search) return true;
      const q = search.toLowerCase();
      return `${c.first_name} ${c.last_name}`.toLowerCase().includes(q)
        || (c.email || '').toLowerCase().includes(q)
        || (c.phone || '').includes(search);
    })
    .sort((a, b) => `${a.last_name}`.localeCompare(`${b.last_name}`));

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-heading font-bold text-foreground">Case Management</h1>
        <p className="text-muted-foreground text-sm mt-1">Open a client file to log services, schedule appointments, or make a referral.</p>
      </div>

      <Tabs value={category} onValueChange={setCategory}>
        <TabsList className="flex-wrap h-auto">
          {CATEGORIES.map((c) => (
            <TabsTrigger key={c.value} value={c.value}>
              {c.label} ({byCategory[c.value]?.length || 0})
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      <div className="flex flex-col sm:flex-row gap-3 sm:items-center">
        <div className="relative w-full sm:max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search clients..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>
        <label className="flex items-center gap-2 text-sm text-muted-foreground">
          <input type="checkbox" checked={mineOnly} onChange={(e) => setMineOnly(e.target.checked)} />
          Only clients assigned to me
        </label>
      </div>

      <Card>
        <CardContent className="p-0 divide-y divide-border/60">
          {isLoading && <p className="text-sm text-muted-foreground text-center py-8">Loading...</p>}
          {!isLoading && filtered.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-8">No clients in this category</p>
          )}
          {filtered.map((client) => (
            <Link key={client.id} to={`/rworker/clients/${client.id}`} className="flex items-center gap-3 px-4 py-3 hover:bg-muted/50">
              <div className="h-9 w-9 rounded-full bg-primary/15 flex items-center justify-center shrink-0">
                <span className="text-primary text-xs font-bold">{client.first_name?.[0]}{client.last_name?.[0]}</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">{client.first_name} {client.last_name}</p>
                <p className="text-xs text-muted-foreground truncate">
                  {client.assigned_worker || 'Unassigned'} · {client.visit_count || 0} visits
                  {client.intake_date ? ` · intake ${new Date(client.intake_date).toLocaleDateString()}` : ''}
                </p>
              </div>
              <StatusBadge status={client.case_status} options={CASE_STATUS_OPTIONS} />
              <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
            </Link>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}