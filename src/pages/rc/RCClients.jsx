import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Link } from 'react-router-dom';
import { Search, UserPlus, Phone, Mail, Baby } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import StatusBadge from '@/components/rc/StatusBadge';
import { CASE_STATUS_OPTIONS, FUNDER_CATEGORIES, IS_PHAC } from '@/lib/rcConstants';

export default function RCClients() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [funderFilter, setFunderFilter] = useState('all');

  const { data: clients = [], isLoading } = useQuery({ queryKey: ['rc-clients'], queryFn: () => base44.entities.RCClient.list() });

  const filtered = clients.filter(c => {
    const name = `${c.first_name} ${c.last_name}`.toLowerCase();
    const matchSearch = name.includes(search.toLowerCase()) || (c.email || '').toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === 'all' || c.case_status === statusFilter;
    const matchFunder = funderFilter === 'all' || (c.funder_categories || []).includes(funderFilter);
    return matchSearch && matchStatus && matchFunder;
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-heading font-bold text-foreground">Client Database</h1><p className="text-muted-foreground text-sm mt-1">Full CRM — search, filter, and manage client records</p></div>
        <Link to="/rc/intake"><Button><UserPlus className="h-4 w-4" /> New Intake</Button></Link>
      </div>

      <div className="flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1"><Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" /><Input placeholder="Search by name or email..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" /></div>
        <Select value={funderFilter} onValueChange={setFunderFilter}><SelectTrigger className="w-full sm:w-52"><SelectValue placeholder="All funders" /></SelectTrigger><SelectContent><SelectItem value="all">All funders</SelectItem>{FUNDER_CATEGORIES.map(f => <SelectItem key={f.value} value={f.value}>{f.label}</SelectItem>)}</SelectContent></Select>
        <Select value={statusFilter} onValueChange={setStatusFilter}><SelectTrigger className="w-full sm:w-40"><SelectValue placeholder="All statuses" /></SelectTrigger><SelectContent><SelectItem value="all">All statuses</SelectItem>{CASE_STATUS_OPTIONS.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}</SelectContent></Select>
      </div>

      {isLoading ? <div className="text-center py-8 text-muted-foreground">Loading...</div> :
       filtered.length === 0 ? <Card><CardContent className="p-8 text-center text-muted-foreground">{clients.length === 0 ? 'No clients yet. Start with a new intake.' : 'No clients match your filters.'}</CardContent></Card> :
      (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {filtered.map(c => {
            const phac = IS_PHAC(c);
            return (
              <Link key={c.id} to={`/rc/clients/${c.id}`}>
                <Card className="hover:shadow-md transition-shadow h-full">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-primary/15 flex items-center justify-center"><span className="text-primary font-semibold text-sm">{c.first_name?.[0]}{c.last_name?.[0]}</span></div>
                        <div><p className="font-medium text-sm text-foreground">{c.first_name} {c.last_name}</p>{c.assigned_worker && <p className="text-xs text-muted-foreground">{c.assigned_worker}</p>}</div>
                      </div>
                      <StatusBadge status={c.case_status} options={CASE_STATUS_OPTIONS} />
                    </div>
                    <div className="space-y-1 mb-2">
                      {c.phone && <p className="text-xs text-muted-foreground flex items-center gap-1.5"><Phone className="h-3 w-3" /> {c.phone}</p>}
                      {c.email && <p className="text-xs text-muted-foreground flex items-center gap-1.5"><Mail className="h-3 w-3" /> {c.email}</p>}
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {(c.funder_categories || []).map(f => {
                        const fc = FUNDER_CATEGORIES.find(x => x.value === f);
                        return fc ? <span key={f} className="text-[10px] px-2 py-0.5 rounded-full" style={{ backgroundColor: fc.color + '20', color: fc.color }}>{fc.label}</span> : null;
                      })}
                      {phac && c.has_children_0_6 && <span className="text-[10px] px-2 py-0.5 rounded-full bg-sky-100 text-sky-700 flex items-center gap-0.5"><Baby className="h-2.5 w-2.5" /> Children 0-6</span>}
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}