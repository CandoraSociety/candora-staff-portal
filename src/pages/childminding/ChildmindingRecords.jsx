import React, { useState, useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Plus, Search, Pencil, FileDown, DollarSign, Clock, Baby } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import StatusBadge from '@/components/rc/StatusBadge';
import ChildmindingDialog from '@/components/childminding/ChildmindingDialog';
import { PROGRAM_OPTIONS, PROGRAM_LABELS, PROGRAM_COLORS, calculateBilling, BILLING_STATUS_OPTIONS, getProgramLabel, MONTH_NAMES } from '@/lib/childmindingConstants';
import { useToast } from '@/components/ui/use-toast';

export default function ChildmindingRecords() {
  const [search, setSearch] = useState('');
  const [monthFilter, setMonthFilter] = useState('all');
  const [yearFilter, setYearFilter] = useState('all');
  const [programFilter, setProgramFilter] = useState('all');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: records = [], isLoading } = useQuery({ queryKey: ['childminding-records'], queryFn: () => base44.entities.ChildmindingRecord.list('-date', 1000) });

  const years = useMemo(() => {
    const ys = [...new Set(records.map(r => r.date ? new Date(r.date).getFullYear() : null).filter(Boolean))];
    return ys.sort((a, b) => b - a);
  }, [records]);

  const filtered = useMemo(() => {
    return records.filter(r => {
      const matchSearch = !search ||
        (r.child_first_name || '').toLowerCase().includes(search.toLowerCase()) ||
        (r.parent_name || '').toLowerCase().includes(search.toLowerCase());
      const matchProgram = programFilter === 'all' || r.program === programFilter;
      let matchMonth = true, matchYear = true;
      if (r.date) {
        const d = new Date(r.date);
        matchMonth = monthFilter === 'all' || d.getMonth() === parseInt(monthFilter);
        matchYear = yearFilter === 'all' || d.getFullYear() === parseInt(yearFilter);
      } else if (monthFilter !== 'all' || yearFilter !== 'all') {
        matchMonth = false;
      }
      return matchSearch && matchProgram && matchMonth && matchYear;
    });
  }, [records, search, programFilter, monthFilter, yearFilter]);

  // Billing summary for filtered Pathways records
  const pathwaysFiltered = filtered.filter(r => r.program === 'pathways');
  const totalBilling = pathwaysFiltered.reduce((sum, r) => sum + (r.billing_amount || calculateBilling(r.program, r.hours)), 0);
  const totalHours = filtered.reduce((sum, r) => sum + (r.hours || 0), 0);
  const totalPathwaysHours = pathwaysFiltered.reduce((sum, r) => sum + (r.hours || 0), 0);

  const openNew = () => { setEditing(null); setDialogOpen(true); };
  const openEdit = (r) => { setEditing(r); setDialogOpen(true); };
  const onSaved = () => { setDialogOpen(false); queryClient.invalidateQueries({ queryKey: ['childminding-records'] }); };

  const handleExportPDF = () => {
    if (filtered.length === 0) { toast({ title: 'No records to export', variant: 'destructive' }); return; }

    const filterDesc = [];
    if (monthFilter !== 'all') filterDesc.push(MONTH_NAMES[parseInt(monthFilter)]);
    if (yearFilter !== 'all') filterDesc.push(yearFilter);
    if (programFilter !== 'all') filterDesc.push(PROGRAM_LABELS[programFilter]);
    const filterText = filterDesc.length > 0 ? filterDesc.join(' ') : 'All Records';

    const win = window.open('', '_blank');
    if (!win) { toast({ title: 'Please allow popups to export PDF', variant: 'destructive' }); return; }

    const rows = filtered.map((r, i) => `
      <tr>
        <td>${i + 1}</td>
        <td>${r.child_first_name || ''}</td>
        <td>${r.parent_name || `${r.parent_first_name || ''} ${r.parent_last_name || ''}`.trim()}</td>
        <td>${r.date ? new Date(r.date).toLocaleDateString() : ''}</td>
        <td style="text-align:center">${r.hours || 0}</td>
        <td>${getProgramLabel(r)}</td>
        <td style="text-align:right">${r.program === 'pathways' ? '$' + (r.billing_amount || calculateBilling(r.program, r.hours)).toFixed(2) : '—'}</td>
        <td>${r.billing_status || ''}</td>
        ${r.notes ? `<td>${r.notes}</td>` : ''}
      </tr>
    `).join('');

    const hasNotes = filtered.some(r => r.notes);

    win.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Childminding Records — ${filterText}</title>
        <style>
          body { font-family: 'Inter', Arial, sans-serif; margin: 40px; color: #1a1a2e; }
          h1 { font-size: 20px; margin-bottom: 4px; }
          h2 { font-size: 14px; font-weight: 400; color: #666; margin-top: 0; margin-bottom: 24px; }
          .summary { display: flex; gap: 24px; margin-bottom: 24px; padding: 12px 16px; background: #f8f9fa; border-radius: 8px; }
          .summary-item { font-size: 13px; }
          .summary-item strong { font-size: 18px; display: block; }
          table { width: 100%; border-collapse: collapse; font-size: 12px; }
          th { background: #172554; color: #f5c116; padding: 8px 10px; text-align: left; font-weight: 600; }
          td { padding: 6px 10px; border-bottom: 1px solid #e0e0e0; }
          tr:nth-child(even) { background: #fafafa; }
          .footer { margin-top: 24px; font-size: 11px; color: #999; text-align: center; }
          @media print { body { margin: 20px; } }
        </style>
      </head>
      <body>
        <h1>Candora — Childminding Records</h1>
        <h2>${filterText} · Generated ${new Date().toLocaleString()}</h2>
        <div class="summary">
          <div class="summary-item"><strong>${filtered.length}</strong> Total Sessions</div>
          <div class="summary-item"><strong>${totalHours.toFixed(1)}</strong> Total Hours</div>
          <div class="summary-item"><strong>${pathwaysFiltered.length}</strong> Pathways Sessions</div>
          <div class="summary-item"><strong>${totalPathwaysHours.toFixed(1)}</strong> Pathways Hours</div>
          <div class="summary-item"><strong>$${totalBilling.toFixed(2)}</strong> Pathways Billing</div>
        </div>
        <table>
          <thead>
            <tr>
              <th>#</th>
              <th>Child</th>
              <th>Parent/Guardian</th>
              <th>Date</th>
              <th style="text-align:center">Hours</th>
              <th>Program</th>
              <th style="text-align:right">Billing</th>
              <th>Status</th>
              ${hasNotes ? '<th>Notes</th>' : ''}
            </tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>
        <div class="footer">Candora Childminding Services · $20/child/hour billing rate for Pathways participants</div>
      </body>
      </html>
    `);
    win.document.close();
    setTimeout(() => { win.focus(); win.print(); }, 500);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-heading font-bold text-foreground">Childminding Records</h1><p className="text-muted-foreground text-sm mt-1">Filter by month and program · export to PDF</p></div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleExportPDF} disabled={filtered.length === 0}><FileDown className="h-4 w-4" /> Export PDF</Button>
          <Button onClick={openNew}><Plus className="h-4 w-4" /> New Record</Button>
        </div>
      </div>

      {/* Summary bar */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Card><CardContent className="p-3 flex items-center gap-2"><Baby className="h-4 w-4 text-blue-500" /><div><p className="text-lg font-bold">{filtered.length}</p><p className="text-xs text-muted-foreground">Sessions</p></div></CardContent></Card>
        <Card><CardContent className="p-3 flex items-center gap-2"><Clock className="h-4 w-4 text-purple-500" /><div><p className="text-lg font-bold">{totalHours.toFixed(1)}</p><p className="text-xs text-muted-foreground">Total Hours</p></div></CardContent></Card>
        <Card><CardContent className="p-3 flex items-center gap-2"><Clock className="h-4 w-4 text-blue-600" /><div><p className="text-lg font-bold">{totalPathwaysHours.toFixed(1)}</p><p className="text-xs text-muted-foreground">Pathways Hours</p></div></CardContent></Card>
        <Card><CardContent className="p-3 flex items-center gap-2"><DollarSign className="h-4 w-4 text-green-600" /><div><p className="text-lg font-bold">${totalBilling.toFixed(2)}</p><p className="text-xs text-muted-foreground">Pathways Billing</p></div></CardContent></Card>
      </div>

      <div className="flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1"><Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" /><Input placeholder="Search by child or parent name..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" /></div>
        <Select value={monthFilter} onValueChange={setMonthFilter}><SelectTrigger className="w-full sm:w-36"><SelectValue placeholder="All months" /></SelectTrigger><SelectContent><SelectItem value="all">All months</SelectItem>{MONTH_NAMES.map((m, i) => <SelectItem key={i} value={String(i)}>{m}</SelectItem>)}</SelectContent></Select>
        <Select value={yearFilter} onValueChange={setYearFilter}><SelectTrigger className="w-full sm:w-28"><SelectValue placeholder="All years" /></SelectTrigger><SelectContent><SelectItem value="all">All years</SelectItem>{years.map(y => <SelectItem key={y} value={String(y)}>{y}</SelectItem>)}</SelectContent></Select>
        <Select value={programFilter} onValueChange={setProgramFilter}><SelectTrigger className="w-full sm:w-40"><SelectValue placeholder="All programs" /></SelectTrigger><SelectContent><SelectItem value="all">All programs</SelectItem>{PROGRAM_OPTIONS.map(p => <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>)}</SelectContent></Select>
      </div>

      {isLoading ? <div className="text-center py-8 text-muted-foreground">Loading...</div> :
       filtered.length === 0 ? <Card><CardContent className="p-8 text-center text-muted-foreground">{records.length === 0 ? 'No childminding records yet.' : 'No records match your filters.'}</CardContent></Card> :
      (
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="border-b bg-muted/50">
                <th className="text-left p-3 font-medium text-muted-foreground">Child</th>
                <th className="text-left p-3 font-medium text-muted-foreground">Parent/Guardian</th>
                <th className="text-left p-3 font-medium text-muted-foreground">Date</th>
                <th className="text-center p-3 font-medium text-muted-foreground">Hours</th>
                <th className="text-left p-3 font-medium text-muted-foreground">Program</th>
                <th className="text-right p-3 font-medium text-muted-foreground">Billing</th>
                <th className="text-left p-3 font-medium text-muted-foreground">Status</th>
                <th className="p-3"></th>
              </tr></thead>
              <tbody>
                {filtered.map(r => (
                  <tr key={r.id} className="border-b hover:bg-muted/30">
                    <td className="p-3 font-medium">{r.child_first_name}</td>
                    <td className="p-3 text-muted-foreground">{r.parent_name || `${r.parent_first_name} ${r.parent_last_name}`.trim()}</td>
                    <td className="p-3 text-muted-foreground">{r.date ? new Date(r.date).toLocaleDateString() : '—'}</td>
                    <td className="p-3 text-center">{r.hours || 0}</td>
                    <td className="p-3"><span className="text-xs px-2 py-0.5 rounded-full" style={{ backgroundColor: (PROGRAM_COLORS[r.program] || '#64748b') + '20', color: PROGRAM_COLORS[r.program] || '#64748b' }}>{getProgramLabel(r)}</span></td>
                    <td className="p-3 text-right">{r.program === 'pathways' ? `$${(r.billing_amount || calculateBilling(r.program, r.hours)).toFixed(2)}` : '—'}</td>
                    <td className="p-3">{r.program === 'pathways' ? <StatusBadge status={r.billing_status || 'unbilled'} options={BILLING_STATUS_OPTIONS} /> : <span className="text-xs text-muted-foreground">—</span>}</td>
                    <td className="p-3"><Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => openEdit(r)}><Pencil className="h-3.5 w-3.5" /></Button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
      <ChildmindingDialog open={dialogOpen} onOpenChange={setDialogOpen} record={editing} onSaved={onSaved} />
    </div>
  );
}