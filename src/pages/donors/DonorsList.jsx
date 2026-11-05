import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import moment from 'moment';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Search } from 'lucide-react';
import DonorDialog from '@/components/donors/DonorDialog';
import { GIVING_LEVELS, DONOR_TYPES, formatMoney, labelFor } from '@/lib/donorConstants';

export default function DonorsList() {
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const [level, setLevel] = useState('all');
  const [type, setType] = useState('all');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState(null);

  const { data: donors = [], isLoading } = useQuery({
    queryKey: ['donors'],
    queryFn: () => base44.entities.Donor.list('-created_date', 500),
  });

  const filtered = donors.filter((d) => {
    const haystack = [d.first_name, d.last_name, d.organization, d.email].filter(Boolean).join(' ').toLowerCase();
    const matchesSearch = !search || haystack.includes(search.toLowerCase());
    const matchesLevel = level === 'all' || d.giving_level === level;
    const matchesType = type === 'all' || d.donor_type === type;
    return matchesSearch && matchesLevel && matchesType;
  });

  const total = filtered.reduce((sum, d) => sum + (Number(d.total_donated) || 0), 0);

  return (
    <div className="p-6 space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold font-display">Donors</h1>
          <p className="text-sm text-muted-foreground">
            {filtered.length} donor{filtered.length === 1 ? '' : 's'} · {formatMoney(total)} lifetime giving
          </p>
        </div>
        <Button onClick={() => { setEditing(null); setDialogOpen(true); }}>
          <Plus className="w-4 h-4 mr-2" /> Add donor
        </Button>
      </div>

      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[220px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input className="pl-9" placeholder="Search name, organization or email" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <Select value={level} onValueChange={setLevel}>
          <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All levels</SelectItem>
            {Object.entries(GIVING_LEVELS).map(([value, meta]) => (
              <SelectItem key={value} value={value}>{meta.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={type} onValueChange={setType}>
          <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All types</SelectItem>
            {DONOR_TYPES.map((t) => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex justify-center py-16">
              <div className="w-8 h-8 border-4 border-border border-t-primary rounded-full animate-spin" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground text-sm">No donors match this view.</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Donor</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Level</TableHead>
                  <TableHead className="text-right">Lifetime</TableHead>
                  <TableHead>Last gift</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((donor) => (
                  <TableRow key={donor.id} className="cursor-pointer" onClick={() => { setEditing(donor); setDialogOpen(true); }}>
                    <TableCell>
                      <Link to={`/donors/${donor.id}`} onClick={(e) => e.stopPropagation()} className="font-medium hover:underline">
                        {[donor.first_name, donor.last_name].filter(Boolean).join(' ') || donor.organization}
                      </Link>
                      <div className="text-xs text-muted-foreground">
                        {donor.organization && donor.first_name ? `${donor.organization} · ` : ''}{donor.email || '—'}
                      </div>
                    </TableCell>
                    <TableCell className="text-sm capitalize">{labelFor(DONOR_TYPES, donor.donor_type)}</TableCell>
                    <TableCell>
                      <Badge className={(GIVING_LEVELS[donor.giving_level] || GIVING_LEVELS.prospect).className}>
                        {(GIVING_LEVELS[donor.giving_level] || GIVING_LEVELS.prospect).label}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right font-medium">{formatMoney(donor.total_donated)}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {donor.last_donation_date ? moment(donor.last_donation_date).format('MMM D, YYYY') : '—'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <DonorDialog open={dialogOpen} onOpenChange={setDialogOpen} donor={editing} />
    </div>
  );
}