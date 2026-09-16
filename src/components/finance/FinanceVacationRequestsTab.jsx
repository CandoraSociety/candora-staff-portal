import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { CalendarOff, Search } from 'lucide-react';
import StatusBadge from '@/components/shared/StatusBadge';

export default function FinanceVacationRequestsTab() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const { data: requests = [], isLoading } = useQuery({
    queryKey: ['finance-vacation-requests'],
    queryFn: () => base44.entities.TimeOffRecord.filter({ kind: 'vacation' }, '-start_date', 500),
  });

  const filtered = requests.filter(r => {
    const matchesSearch =
      !search ||
      r.employee_name?.toLowerCase().includes(search.toLowerCase()) ||
      r.supervisor_name?.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'all' || r.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const formatDate = (d) => (d ? new Date(d).toLocaleDateString('en-CA') : '—');
  const totalHours = (r) => {
    if (!r.start_date || !r.end_date) return r.hours_per_day || 0;
    const start = new Date(r.start_date);
    const end = new Date(r.end_date);
    const days = Math.round((end - start) / (1000 * 60 * 60 * 24)) + 1;
    return (r.hours_per_day || 8) * Math.max(days, 1);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-2 sm:items-center sm:justify-between">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search employee or supervisor..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-40">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="approved">Approved</SelectItem>
            <SelectItem value="rejected">Rejected</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="py-12 text-center text-sm text-muted-foreground">Loading vacation requests…</div>
          ) : filtered.length === 0 ? (
            <div className="py-12 text-center">
              <CalendarOff className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
              <h3 className="font-semibold text-foreground">No vacation requests</h3>
              <p className="text-sm text-muted-foreground mt-1">Approved and pending vacation requests will appear here.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Employee</TableHead>
                  <TableHead>Dates</TableHead>
                  <TableHead className="text-center">Total Hours</TableHead>
                  <TableHead>Supervisor</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Approved By</TableHead>
                  <TableHead>Decision Date</TableHead>
                  <TableHead>Notes</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map(r => (
                  <TableRow key={r.id}>
                    <TableCell className="font-medium">{r.employee_name || '—'}</TableCell>
                    <TableCell className="whitespace-nowrap">
                      {formatDate(r.start_date)}{r.end_date && r.end_date !== r.start_date ? ` – ${formatDate(r.end_date)}` : ''}
                    </TableCell>
                    <TableCell className="text-center">{totalHours(r)}</TableCell>
                    <TableCell>{r.supervisor_name || '—'}</TableCell>
                    <TableCell><StatusBadge status={r.status} /></TableCell>
                    <TableCell>{r.approved_by_name || '—'}</TableCell>
                    <TableCell className="whitespace-nowrap">{formatDate(r.approved_date)}</TableCell>
                    <TableCell className="max-w-48 truncate" title={r.notes || ''}>
                      {r.status === 'rejected' && r.rejection_reason ? r.rejection_reason : (r.notes || '—')}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}