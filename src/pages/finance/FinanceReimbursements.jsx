import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Receipt, ExternalLink, Search, DollarSign } from 'lucide-react';
import { format } from 'date-fns';

const SUPPORT_TYPE_SHORT = {
  'PPE (Personal Protective Equipment)': 'PPE',
  'Bus Pass / Transit': 'Bus Pass',
  'Work Clothes': 'Work Clothes',
  'Safety Boots': 'Safety Boots',
  'Tools / Equipment': 'Tools',
  'Training Certificates': 'Training Cert',
  'First Aid Certification': 'First Aid',
  'Police Information Check': 'Police Check',
  "Driver's License": "Driver's License",
  'Childcare': 'Childcare',
  'Internet / Phone': 'Internet/Phone',
  'Other': 'Other',
};

export default function FinanceReimbursements() {
  const [search, setSearch] = useState('');
  const [filterMonth, setFilterMonth] = useState('all');

  const { data: requests = [], isLoading } = useQuery({
    queryKey: ['staff-reimbursements'],
    queryFn: () => base44.entities.PurchaseRequest.filter({ status: 'approved' }),
  });

  const availableMonths = useMemo(() => {
    const s = new Set();
    requests.forEach(r => {
      const m = r.purchase_date ? r.purchase_date.slice(0, 7) : (r.billing_month || r.requested_date?.slice(0, 7));
      if (m) s.add(m);
    });
    return Array.from(s).sort().reverse();
  }, [requests]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return requests
      .filter(r => {
        if (filterMonth === 'all') return true;
        const m = r.purchase_date ? r.purchase_date.slice(0, 7) : (r.billing_month || r.requested_date?.slice(0, 7));
        return m === filterMonth;
      })
      .filter(r => {
        if (!q) return true;
        return [r.client_name, r.received_by_name, r.support_type, r.support_type_other, r.vendor, r.description, r.purchase_notes]
          .some(v => String(v || '').toLowerCase().includes(q));
      })
      .sort((a, b) => (b.purchase_date || '').localeCompare(a.purchase_date || ''));
  }, [requests, filterMonth, search]);

  const grouped = useMemo(() => {
    const map = {};
    filtered.forEach(r => {
      const key = r.received_by_name || r.received_by || 'Unknown';
      if (!map[key]) map[key] = { name: key, email: r.received_by, items: [] };
      map[key].items.push(r);
    });
    return Object.values(map).sort((a, b) => a.name.localeCompare(b.name));
  }, [filtered]);

  const grandReimbursable = filtered.reduce((s, r) => s + (r.amount_without_tax || 0), 0);
  const grandTax = filtered.reduce((s, r) => s + (r.tax || 0), 0);
  const grandTotal = filtered.reduce((s, r) => s + (r.total || 0), 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2"><Receipt className="h-6 w-6 text-primary" /> Staff Reimbursement Requests</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Approved employment-support purchases made by staff on behalf of clients, awaiting reimbursement. Reimbursable amount excludes tax.
        </p>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <Card className="border-amber-200 bg-amber-50/50">
          <CardContent className="p-3">
            <div className="text-xs text-muted-foreground flex items-center gap-1"><DollarSign className="w-3 h-3" /> To be Reimbursed</div>
            <div className="text-lg font-bold text-amber-700">${grandReimbursable.toFixed(2)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3">
            <div className="text-xs text-muted-foreground">Tax (documentation only)</div>
            <div className="text-lg font-bold text-muted-foreground">${grandTax.toFixed(2)}</div>
          </CardContent>
        </Card>
        <Card className="border-slate-200">
          <CardContent className="p-3">
            <div className="text-xs text-muted-foreground">Total (with tax)</div>
            <div className="text-lg font-bold text-foreground">${grandTotal.toFixed(2)}</div>
          </CardContent>
        </Card>
      </div>

      <div className="flex items-center justify-end gap-2">
        <div className="relative">
          <Search className="w-3.5 h-3.5 text-muted-foreground absolute left-2.5 top-1/2 -translate-y-1/2" />
          <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search staff, client, type…" className="pl-8 h-9 w-[240px]" />
        </div>
        <Select value={filterMonth} onValueChange={setFilterMonth}>
          <SelectTrigger className="w-[160px] h-9"><SelectValue placeholder="Purchase Month" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Months</SelectItem>
            {availableMonths.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className="text-sm text-muted-foreground">Loading...</div>
      ) : filtered.length === 0 ? (
        <Card><CardContent className="py-10 text-center text-sm text-muted-foreground">
          No approved staff reimbursement requests yet.
        </CardContent></Card>
      ) : (
        <div className="space-y-4">
          {grouped.map(group => {
            const subReimb = group.items.reduce((s, r) => s + (r.amount_without_tax || 0), 0);
            const subTax = group.items.reduce((s, r) => s + (r.tax || 0), 0);
            const subTotal = group.items.reduce((s, r) => s + (r.total || 0), 0);
            return (
              <Card key={group.name}>
                <div className="flex items-center justify-between px-4 py-2.5 border-b bg-muted/40">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-sm">{group.name}</span>
                    {group.email && <span className="text-xs text-muted-foreground">{group.email}</span>}
                    <Badge variant="outline" className="text-xs">{group.items.length} purchase{group.items.length !== 1 ? 's' : ''}</Badge>
                  </div>
                  <div className="flex items-center gap-4 text-xs">
                    <span className="text-muted-foreground">Reimbursable: <strong className="text-amber-700">${subReimb.toFixed(2)}</strong></span>
                    <span className="text-muted-foreground">Total: <strong>${subTotal.toFixed(2)}</strong></span>
                  </div>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="border-b bg-muted/30">
                      <tr>
                        <th className="text-left px-3 py-2 font-semibold">Client</th>
                        <th className="text-left px-3 py-2 font-semibold">Support Type</th>
                        <th className="text-left px-3 py-2 font-semibold">Vendor</th>
                        <th className="text-left px-3 py-2 font-semibold">Purchase Date</th>
                        <th className="text-right px-3 py-2 font-semibold">To be Reimbursed</th>
                        <th className="text-right px-3 py-2 font-semibold">Tax</th>
                        <th className="text-right px-3 py-2 font-semibold">Total</th>
                        <th className="text-center px-3 py-2 font-semibold">Receipt</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {group.items.map(r => (
                        <tr key={r.id} className="hover:bg-muted/30">
                          <td className="px-3 py-2 font-medium">{r.client_name || '—'}</td>
                          <td className="px-3 py-2">
                            {SUPPORT_TYPE_SHORT[r.support_type] || r.support_type}
                            {r.support_type === 'Other' && r.support_type_other ? `: ${r.support_type_other}` : ''}
                          </td>
                          <td className="px-3 py-2 max-w-[160px] break-words whitespace-normal">{r.vendor || '—'}</td>
                          <td className="px-3 py-2 whitespace-nowrap">{r.purchase_date ? format(new Date(r.purchase_date + 'T00:00:00'), 'MMM d, yy') : '—'}</td>
                          <td className="px-3 py-2 text-right font-semibold text-amber-700">${Number(r.amount_without_tax || 0).toFixed(2)}</td>
                          <td className="px-3 py-2 text-right text-muted-foreground">${Number(r.tax || 0).toFixed(2)}</td>
                          <td className="px-3 py-2 text-right font-semibold">${Number(r.total || 0).toFixed(2)}</td>
                          <td className="px-3 py-2 text-center">
                            {r.receipt_url ? (
                              <a href={r.receipt_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs text-blue-600 hover:underline">
                                <ExternalLink className="w-3.5 h-3.5" /> View
                              </a>
                            ) : <span className="text-xs text-muted-foreground">—</span>}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr className="bg-muted/40 border-t-2">
                        <td colSpan={4} className="px-3 py-2 text-right font-semibold">Staff subtotal:</td>
                        <td className="px-3 py-2 text-right font-bold text-amber-700">${subReimb.toFixed(2)}</td>
                        <td className="px-3 py-2 text-right font-semibold text-muted-foreground">${subTax.toFixed(2)}</td>
                        <td className="px-3 py-2 text-right font-bold">${subTotal.toFixed(2)}</td>
                        <td></td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}