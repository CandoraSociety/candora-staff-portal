import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Search, FileDown, DollarSign, Clock, Baby } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import StatusBadge from '@/components/rc/StatusBadge';
import { calculateBilling, BILLING_STATUS_OPTIONS, MONTH_NAMES } from '@/lib/childmindingConstants';
import { useToast } from '@/components/ui/use-toast';

export default function PathwaysChildminding() {
  const [search, setSearch] = useState('');
  const [monthFilter, setMonthFilter] = useState('all');
  const [yearFilter, setYearFilter] = useState('all');
  const { toast } = useToast();

  // Only fetch Pathways childminding records
  const { data: records = [], isLoading } = useQuery({ queryKey: ['childminding-records-pathways'], queryFn: () => base44.entities.ChildmindingRecord.filter({ program: 'pathways' }, '-date', 1000) });

  const years = useMemo(() => {
    const ys = [...new Set(records.map(r => r.date ? new Date(r.date).getFullYear() : null).filter(Boolean))];
    return ys.sort((a, b) => b - a);
  }, [records]);

  const filtered = useMemo(() => {
    return records.filter(r => {
      const matchSearch = !search ||
        (r.child_first_name || '').toLowerCase().includes(search.toLowerCase()) ||
        (r.parent_name || '').toLowerCase().includes(search.toLowerCase());
      let matchMonth = true, matchYear = true;
      if (r.date) {
        const d = new Date(r.date);
        matchMonth = monthFilter === 'all' || d.getMonth() === parseInt(monthFilter);
        matchYear = yearFilter === 'all' || d.getFullYear() === parseInt(yearFilter);
      } else if (monthFilter !== 'all' || yearFilter !== 'all') {
        matchMonth = false;
      }
      return matchSearch && matchMonth && matchYear;
    });
  }, [records, search, monthFilter, yearFilter]);

  const totalBilling = filtered.reduce((sum, r) => sum + (r.billing_amount || calculateBilling(r.program, r.hours)), 0);
  const totalHours = filtered.reduce((sum, r) => sum + (r.hours || 0), 0);
  const uniqueChildren = new Set(filtered.map(r => `${r.child_first_name?.toLowerCase()}_${r.parent_name?.toLowerCase()}`)).size;

  const handleExportPDF = () => {
    if (filtered.length === 0) { toast({ title: 'No records to export', variant: 'destructive' }); return; }

    const filterDesc = [];
    if (monthFilter !== 'all') filterDesc.push(MONTH_NAMES[parseInt(monthFilter)]);
    if (yearFilter !== 'all') filterDesc.push(yearFilter);
    const filterText = filterDesc.length > 0 ? `Pathways — ${filterDesc.join(' ')}` : 'Pathways — All Records';

    const win = window.open('', '_blank');
    if (!win) { toast({ title: 'Please allow popups to export PDF', variant: 'destructive' }); return; }

    const rows = filtered.map((r, i) => `
      <tr>
        <td>${i + 1}</td>
        <td>${r.child_first_name || ''}</td>
        <td>${r.parent_name || `${r.parent_first_name || ''} ${r.parent_last_name || ''}`.trim()}</td>
        <td>${r.date ? new Date(r.date).toLocaleDateString() : ''}</td>
        <td style="text-align:center">${r.hours || 0}</td>
        <td style="text-align:right">$${(r.billing_amount || calculateBilling(r.program, r.hours)).toFixed(2)}</td>
        <td>${r.billing_status || ''}</td>
      </tr>
    `).join('');

    win.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Pathways Childminding — ${filterText}</title>
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
        </style>
      </head>
      <body>
        <h1>Candora Pathways — Childminding Billing</h1>
        <h2>${filterText} · Generated ${new Date().toLocaleString()}</h2>
        <div class="summary">
          <div class="summary-item"><strong>${filtered.length}</strong> Sessions</div>
          <div class="summary-item"><strong>${uniqueChildren}</strong> Unique Children</div>
          <div class="summary-item"><strong>${totalHours.toFixed(1)}</strong> Total Hours</div>
          <div class="summary-item"><strong>$${totalBilling.toFixed(2)}</strong> Total Billing</div>
        </div>
        <table>
          <thead><tr>
            <th>#</th><th>Child</th><th>Parent/Guardian</th><th>Date</th>
            <th style="text-align:center">Hours</th><th style="text-align:right">Billing</th><th>Status</th>
          </tr></thead>
          <tbody>${rows}</tbody>
        </table>
        <div class="footer">Candora Pathways Childminding · $20/child/hour billing rate</div>
      </body>
      </html>
    `);
    win.document.close();
    setTimeout(() => { win.focus(); win.print(); }, 500);
  };

  return (
    <div className="p-4 lg:p-6 max-w-7xl mx-auto space-y-4">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-heading font-bold text-slate-800">Pathways Childminding</h1><p className="text-slate-500 text-sm mt-1">Childminding records for Pathways participants · $20/child/hour billing</p></div>
        <Button variant="outline" onClick={handleExportPDF} disabled={filtered.length === 0}><FileDown className="h-4 w-4" /> Export PDF</Button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Card><CardContent className="p-3 flex items-center gap-2"><Baby className="h-4 w-4 text-blue-500" /><div><p className="text-lg font-bold">{filtered.length}</p><p className="text-xs text-slate-500">Sessions</p></div></CardContent></Card>
        <Card><CardContent className="p-3 flex items-center gap-2"><Baby className="h-4 w-4 text-purple-500" /><div><p className="text-lg font-bold">{uniqueChildren}</p><p className="text-xs text-slate-500">Unique Children</p></div></CardContent></Card>
        <Card><CardContent className="p-3 flex items-center gap-2"><Clock className="h-4 w-4 text-blue-600" /><div><p className="text-lg font-bold">{totalHours.toFixed(1)}</p><p className="text-xs text-slate-500">Total Hours</p></div></CardContent></Card>
        <Card><CardContent className="p-3 flex items-center gap-2"><DollarSign className="h-4 w-4 text-green-600" /><div><p className="text-lg font-bold">${totalBilling.toFixed(2)}</p><p className="text-xs text-slate-500">Total Billing</p></div></CardContent></Card>
      </div>

      <div className="flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1"><Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" /><Input placeholder="Search by child or parent name..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" /></div>
        <Select value={monthFilter} onValueChange={setMonthFilter}><SelectTrigger className="w-full sm:w-36"><SelectValue placeholder="All months" /></SelectTrigger><SelectContent><SelectItem value="all">All months</SelectItem>{MONTH_NAMES.map((m, i) => <SelectItem key={i} value={String(i)}>{m}</SelectItem>)}</SelectContent></Select>
        <Select value={yearFilter} onValueChange={setYearFilter}><SelectTrigger className="w-full sm:w-28"><SelectValue placeholder="All years" /></SelectTrigger><SelectContent><SelectItem value="all">All years</SelectItem>{years.map(y => <SelectItem key={y} value={String(y)}>{y}</SelectItem>)}</SelectContent></Select>
      </div>

      {isLoading ? <div className="text-center py-8 text-slate-400">Loading...</div> :
       filtered.length === 0 ? <Card><CardContent className="p-8 text-center text-slate-400">{records.length === 0 ? 'No Pathways childminding records.' : 'No records match your filters.'}</CardContent></Card> :
      (
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="border-b bg-slate-50">
                <th className="text-left p-3 font-medium text-slate-500">Child</th>
                <th className="text-left p-3 font-medium text-slate-500">Parent/Guardian</th>
                <th className="text-left p-3 font-medium text-slate-500">Date</th>
                <th className="text-center p-3 font-medium text-slate-500">Hours</th>
                <th className="text-right p-3 font-medium text-slate-500">Billing</th>
                <th className="text-left p-3 font-medium text-slate-500">Status</th>
              </tr></thead>
              <tbody>
                {filtered.map(r => (
                  <tr key={r.id} className="border-b hover:bg-slate-50">
                    <td className="p-3 font-medium">{r.child_first_name}</td>
                    <td className="p-3 text-slate-600">{r.parent_name || `${r.parent_first_name} ${r.parent_last_name}`.trim()}</td>
                    <td className="p-3 text-slate-600">{r.date ? new Date(r.date).toLocaleDateString() : '—'}</td>
                    <td className="p-3 text-center">{r.hours || 0}</td>
                    <td className="p-3 text-right font-medium">${(r.billing_amount || calculateBilling(r.program, r.hours)).toFixed(2)}</td>
                    <td className="p-3"><StatusBadge status={r.billing_status || 'unbilled'} options={BILLING_STATUS_OPTIONS} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}