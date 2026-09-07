import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Link } from 'react-router-dom';
import { Search, UserPlus, Phone, Mail, Baby, FlaskConical } from 'lucide-react';
import TestClientsDialog from '@/components/rc/TestClientsDialog';
import { isTestClient, TEST_CLIENT_BG, TEST_CLIENT_TEXT, TEST_CLIENT_MUTED } from '@/lib/rcTestClients';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import StatusBadge from '@/components/rc/StatusBadge';
import { CASE_STATUS_OPTIONS, FUNDER_CATEGORIES, IS_PHAC } from '@/lib/rcConstants';

const SORT_OPTIONS = [
  { value: 'last_name_asc', label: 'Last Name (A → Z)' },
  { value: 'last_name_desc', label: 'Last Name (Z → A)' },
  { value: 'first_name_asc', label: 'First Name (A → Z)' },
  { value: 'first_name_desc', label: 'First Name (Z → A)' },
  { value: 'intake_date_desc', label: 'Intake Date (newest)' },
  { value: 'intake_date_asc', label: 'Intake Date (oldest)' },
  { value: 'updated_date_desc', label: 'Recent Activity (newest)' },
  { value: 'updated_date_asc', label: 'Recent Activity (oldest)' },
];

const PROGRAM_AREA_OPTIONS = [
  { value: 'pathways', label: 'Pathways' },
  { value: 'empoweru', label: 'EmpowerU' },
  { value: 'frn', label: 'FRN' },
  { value: 'phac', label: 'PHAC' },
  { value: 'community', label: 'Community' },
  { value: 'ell', label: 'ELL' },
  { value: 'digilit', label: 'Digital Literacy' },
];

const DEMOGRAPHIC_OPTIONS = [
  { value: 'indigenous_first_nations', label: 'Indigenous / First Nations' },
  { value: 'newcomer', label: 'Newcomer' },
  { value: 'senior', label: 'Senior' },
  { value: 'youth_under_25', label: 'Youth under 25' },
];

function compareClients(a, b, key) {
  const dir = key.endsWith('_desc') ? -1 : 1;
  if (key.startsWith('last_name')) {
    const cmp = `${a.last_name || ''}, ${a.first_name || ''}`.localeCompare(`${b.last_name || ''}, ${b.first_name || ''}`);
    return cmp * dir;
  }
  if (key.startsWith('first_name')) {
    const cmp = `${a.first_name || ''} ${a.last_name || ''}`.localeCompare(`${b.first_name || ''} ${b.last_name || ''}`);
    return cmp * dir;
  }
  const field = key.startsWith('intake_date') ? 'intake_date' : 'updated_date';
  const ad = a[field] ? new Date(a[field]).getTime() : 0;
  const bd = b[field] ? new Date(b[field]).getTime() : 0;
  return (ad - bd) * dir;
}

export default function RCClients() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [funderFilter, setFunderFilter] = useState('all');
  const [programFilter, setProgramFilter] = useState('all');
  const [demoFilter, setDemoFilter] = useState('all');
  const [sortBy, setSortBy] = useState('last_name_asc');
  const [showTestClients, setShowTestClients] = useState(false);

  const { data: clients = [], isLoading } = useQuery({ queryKey: ['rc-clients'], queryFn: () => base44.entities.RCClient.list() });

  const filtered = clients.filter(c => {
    const name = `${c.first_name} ${c.last_name}`.toLowerCase();
    const matchSearch = name.includes(search.toLowerCase()) || (c.email || '').toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === 'all' || c.case_status === statusFilter;
    const matchFunder = funderFilter === 'all' || (c.funder_categories || []).includes(funderFilter);
    const matchProgram = programFilter === 'all' || (c.program_participations || []).some(p => p.program === programFilter);
    const matchDemo = demoFilter === 'all' || c[demoFilter] === true;
    return matchSearch && matchStatus && matchFunder && matchProgram && matchDemo;
  }).sort((a, b) => compareClients(a, b, sortBy));

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-heading font-bold text-foreground">Client Database</h1><p className="text-muted-foreground text-sm mt-1">Full CRM — search, filter, and manage client records</p></div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => setShowTestClients(true)}><FlaskConical className="h-4 w-4" /> Test Clients</Button>
          <Link to="/rc/intake"><Button><UserPlus className="h-4 w-4" /> New Intake</Button></Link>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-2 flex-wrap">
        <div className="relative flex-1 min-w-48"><Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" /><Input placeholder="Search by name or email..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" /></div>
        <Select value={sortBy} onValueChange={setSortBy}><SelectTrigger className="w-full sm:w-48"><SelectValue /></SelectTrigger><SelectContent>{SORT_OPTIONS.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}</SelectContent></Select>
        <Select value={programFilter} onValueChange={setProgramFilter}><SelectTrigger className="w-full sm:w-48"><SelectValue placeholder="All program areas" /></SelectTrigger><SelectContent><SelectItem value="all">All program areas</SelectItem>{PROGRAM_AREA_OPTIONS.map(p => <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>)}</SelectContent></Select>
        <Select value={statusFilter} onValueChange={setStatusFilter}><SelectTrigger className="w-full sm:w-40"><SelectValue placeholder="All statuses" /></SelectTrigger><SelectContent><SelectItem value="all">All statuses</SelectItem>{CASE_STATUS_OPTIONS.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}</SelectContent></Select>
        <Select value={funderFilter} onValueChange={setFunderFilter}><SelectTrigger className="w-full sm:w-52"><SelectValue placeholder="All funders" /></SelectTrigger><SelectContent><SelectItem value="all">All funders</SelectItem>{FUNDER_CATEGORIES.map(f => <SelectItem key={f.value} value={f.value}>{f.label}</SelectItem>)}</SelectContent></Select>
        <Select value={demoFilter} onValueChange={setDemoFilter}><SelectTrigger className="w-full sm:w-52"><SelectValue placeholder="All demographics" /></SelectTrigger><SelectContent><SelectItem value="all">All demographics</SelectItem>{DEMOGRAPHIC_OPTIONS.map(d => <SelectItem key={d.value} value={d.value}>{d.label}</SelectItem>)}</SelectContent></Select>
      </div>

      {isLoading ? <div className="text-center py-8 text-muted-foreground">Loading...</div> :
       filtered.length === 0 ? <Card><CardContent className="p-8 text-center text-muted-foreground">{clients.length === 0 ? 'No clients yet. Start with a new intake.' : 'No clients match your filters.'}</CardContent></Card> :
      (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {filtered.map(c => {
            const phac = IS_PHAC(c);
            const isTest = isTestClient(c);
            const testSub = isTest ? { color: TEST_CLIENT_MUTED } : undefined;
            return (
              <Link key={c.id} to={`/rc/clients/${c.id}`}>
                <Card className="hover:shadow-md transition-shadow h-full" style={isTest ? { backgroundColor: TEST_CLIENT_BG, borderColor: TEST_CLIENT_BG } : undefined}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-primary/15 flex items-center justify-center"><span className="text-primary font-semibold text-sm">{c.first_name?.[0]}{c.last_name?.[0]}</span></div>
                        <div><p className="font-medium text-sm text-foreground" style={isTest ? { color: TEST_CLIENT_TEXT, fontWeight: 800 } : undefined}>{c.first_name} {c.last_name}</p>{c.assigned_worker && <p className="text-xs text-muted-foreground" style={testSub}>{c.assigned_worker}</p>}</div>
                      </div>
                      <StatusBadge status={c.case_status} options={CASE_STATUS_OPTIONS} />
                    </div>
                    <div className="space-y-1 mb-2">
                      {c.phone && <p className="text-xs text-muted-foreground flex items-center gap-1.5" style={testSub}><Phone className="h-3 w-3" /> {c.phone}</p>}
                      {c.email && <p className="text-xs text-muted-foreground flex items-center gap-1.5" style={testSub}><Mail className="h-3 w-3" /> {c.email}</p>}
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

      <TestClientsDialog open={showTestClients} onOpenChange={setShowTestClients} testClients={clients.filter(isTestClient)} />
    </div>
  );
}