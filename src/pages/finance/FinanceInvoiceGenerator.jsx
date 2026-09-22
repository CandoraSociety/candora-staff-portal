import React, { useMemo, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowDownToLine, ArrowUpFromLine, Ban, CheckCircle2, FileText, Pencil, Plus, Search, Send, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import InvoiceEditDialog from '@/components/finance/invoicegen/InvoiceEditDialog';
import InvoiceViewButton from '@/components/finance/invoicegen/InvoiceViewButton';
import CustomersTab from '@/components/finance/invoicegen/CustomersTab';

const MODES = [
  { value: 'receivable', label: 'Invoices to Customers', icon: ArrowDownToLine, desc: 'Create and send invoices to people who need to pay Candora.' },
  { value: 'payable', label: 'On-Behalf Vendor Invoices', icon: ArrowUpFromLine, desc: "Create an invoice on behalf of a service provider who doesn't issue their own — for our payables (e.g. musicians hired for events)." },
];

const STATUS_STYLES = {
  draft: { label: 'Draft', cls: 'bg-muted text-foreground' },
  to_be_sent: { label: 'To Be Sent', cls: 'bg-amber-100 text-amber-800' },
  issued: { label: 'Sent / Issued', cls: 'bg-blue-100 text-blue-800' },
  paid: { label: 'Paid', cls: 'bg-green-100 text-green-800' },
  void: { label: 'Void', cls: 'bg-red-100 text-red-800' },
};

const fmt = n => `$${Number(n || 0).toFixed(2)}`;
const fmtDate = d => d ? format(new Date(d + 'T00:00:00'), 'MMM d, yy') : '—';

export default function FinanceInvoiceGenerator() {
  const qc = useQueryClient();
  const [mode, setMode] = useState('receivable');
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [view, setView] = useState('invoices'); // 'invoices' | 'customers'
  const [editOpen, setEditOpen] = useState(false);
  const [editing, setEditing] = useState(null); // invoice being edited, null = new

  const { data: invoices = [], isLoading } = useQuery({
    queryKey: ['finance-invoices'],
    queryFn: () => base44.entities.FinanceInvoice.list('-invoice_date', 200),
  });

  const refresh = () => qc.invalidateQueries({ queryKey: ['finance-invoices'] });

  const setStatus = useMutation({
    mutationFn: async ({ inv, status }) => {
      const patch = { status };
      if (status === 'paid') patch.paid_date = format(new Date(), 'yyyy-MM-dd');
      await base44.entities.FinanceInvoice.update(inv.id, patch);
    },
    onSuccess: refresh,
  });

  const del = useMutation({
    mutationFn: id => base44.entities.FinanceInvoice.delete(id),
    onSuccess: () => { refresh(); toast.success('Invoice deleted.'); },
  });

  const modeInvoices = useMemo(() => invoices.filter(i => i.invoice_type === mode), [invoices, mode]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return modeInvoices
      .filter(i => filterStatus === 'all' || i.status === filterStatus)
      .filter(i => !q || [i.invoice_number, i.counterparty_name, i.reference, i.notes]
        .some(v => String(v || '').toLowerCase().includes(q)));
  }, [modeInvoices, filterStatus, search]);

  const totalDraft = modeInvoices.filter(i => i.status === 'draft' || i.status === 'to_be_sent').reduce((s, i) => s + (i.total || 0), 0);
  const totalIssued = modeInvoices.filter(i => i.status === 'issued').reduce((s, i) => s + (i.total || 0), 0);
  const totalPaid = modeInvoices.filter(i => i.status === 'paid').reduce((s, i) => s + (i.total || 0), 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2"><FileText className="h-6 w-6 text-primary" />Invoice Generator</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Create invoices to send to people who need to pay Candora, or prepare an invoice on behalf of a vendor who doesn't issue their own (payables).
          </p>
        </div>
        <div className="flex items-center gap-1 rounded-lg border p-1 bg-card">
          {['invoices', 'customers'].map(v => (
            <button
              key={v}
              onClick={() => setView(v)}
              className={cn('px-4 py-1.5 rounded-md text-sm font-medium transition-colors',
                view === v ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground')}
            >
              {v === 'invoices' ? 'Invoices' : 'Customers'}
            </button>
          ))}
        </div>
      </div>

      {view === 'invoices' && (
      <>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {MODES.map(m => (
          <button
            key={m.value}
            onClick={() => { setMode(m.value); setFilterStatus('all'); }}
            className={cn('text-left rounded-xl border p-4 transition-colors flex gap-3',
              mode === m.value ? 'border-primary bg-primary/5' : 'border-border hover:bg-muted/40')}
          >
            <div className={cn('h-10 w-10 rounded-lg flex items-center justify-center shrink-0',
              mode === m.value ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground')}>
              <m.icon className="h-5 w-5" />
            </div>
            <div>
              <div className="font-semibold text-sm">{m.label}</div>
              <div className="text-xs text-muted-foreground mt-0.5">{m.desc}</div>
            </div>
          </button>
        ))}
      </div>

      <div className="grid grid-cols-3 gap-3">
        <Card className="border-border bg-muted/30">
          <CardContent className="p-3">
            <div className="text-xs text-muted-foreground">Draft / To Be Sent</div>
            <div className="text-lg font-bold text-foreground">{fmt(totalDraft)}</div>
          </CardContent>
        </Card>
        <Card className="border-blue-200 bg-blue-50/50">
          <CardContent className="p-3">
            <div className="text-xs text-muted-foreground">{mode === 'receivable' ? 'Outstanding (sent)' : 'Issued for payment'}</div>
            <div className="text-lg font-bold text-blue-700">{fmt(totalIssued)}</div>
          </CardContent>
        </Card>
        <Card className="border-green-200 bg-green-50/50">
          <CardContent className="p-3">
            <div className="text-xs text-muted-foreground">{mode === 'receivable' ? 'Collected' : 'Paid out'}</div>
            <div className="text-lg font-bold text-green-700">{fmt(totalPaid)}</div>
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-muted-foreground absolute left-2.5 top-1/2 -translate-y-1/2" />
            <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search invoices…" className="pl-8 h-9 w-[260px]" />
          </div>
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-[160px] h-9"><SelectValue placeholder="Status" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="draft">Draft</SelectItem>
              <SelectItem value="to_be_sent">To Be Sent</SelectItem>
              <SelectItem value="issued">Sent / Issued</SelectItem>
              <SelectItem value="paid">Paid</SelectItem>
              <SelectItem value="void">Void</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Button className="gap-2" onClick={() => { setEditing(null); setEditOpen(true); }}>
          <Plus className="w-4 h-4" />New {mode === 'receivable' ? 'Customer Invoice' : 'Vendor Invoice'}
        </Button>
      </div>

      {isLoading ? (
        <div className="text-sm text-muted-foreground">Loading…</div>
      ) : filtered.length === 0 ? (
        <Card><CardContent className="py-10 text-center text-sm text-muted-foreground">
          No invoices here yet — click “New {mode === 'receivable' ? 'Customer Invoice' : 'Vendor Invoice'}” to create one.
        </CardContent></Card>
      ) : (
        <Card className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b bg-muted/30">
                <tr>
                  <th className="text-left px-3 py-2 font-semibold">Invoice #</th>
                  <th className="text-left px-3 py-2 font-semibold">{mode === 'payable' ? 'Vendor' : 'Customer'}</th>
                  <th className="text-left px-3 py-2 font-semibold">For / Reference</th>
                  <th className="text-left px-3 py-2 font-semibold">Date</th>
                  <th className="text-left px-3 py-2 font-semibold">Due</th>
                  <th className="text-right px-3 py-2 font-semibold">Total</th>
                  <th className="text-left px-3 py-2 font-semibold">Status</th>
                  <th className="text-center px-3 py-2 font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {filtered.map(r => {
                  const st = STATUS_STYLES[r.status] || STATUS_STYLES.draft;
                  return (
                    <tr key={r.id} className="hover:bg-muted/30">
                      <td className="px-3 py-2 font-mono text-xs">{r.invoice_number || '—'}</td>
                      <td className="px-3 py-2">
                        <div className="font-medium">{r.counterparty_name}</div>
                        {r.counterparty_email && <div className="text-xs text-muted-foreground">{r.counterparty_email}</div>}
                      </td>
                      <td className="px-3 py-2 text-muted-foreground">{r.reference || '—'}</td>
                      <td className="px-3 py-2 whitespace-nowrap">{fmtDate(r.invoice_date)}</td>
                      <td className="px-3 py-2 whitespace-nowrap">{fmtDate(r.due_date)}</td>
                      <td className="px-3 py-2 text-right font-semibold">{fmt(r.total)}</td>
                      <td className="px-3 py-2"><Badge className={st.cls}>{st.label}</Badge></td>
                      <td className="px-3 py-2">
                        <div className="flex items-center justify-center gap-1 flex-wrap">
                          <InvoiceViewButton invoice={r} />
                          {(r.status === 'draft' || r.status === 'to_be_sent') && (
                            <Button variant="ghost" size="sm" className="h-7 px-2" onClick={() => { setEditing(r); setEditOpen(true); }} title="Edit">
                              <Pencil className="w-4 h-4" />
                            </Button>
                          )}
                          {(r.status === 'draft' || r.status === 'to_be_sent') && (
                            <Button size="sm" className="h-7 px-3 gap-1.5 font-semibold" onClick={() => setStatus.mutate({ inv: r, status: 'issued' })}
                              title={mode === 'receivable' ? 'Mark as sent to the customer' : 'Submit for payment'}>
                              <Send className="w-4 h-4" />{mode === 'receivable' ? 'Mark Sent' : 'Issue for Payment'}
                            </Button>
                          )}
                          {r.status === 'issued' && (
                            <Button size="sm" className="h-7 px-3 gap-1.5 font-semibold" onClick={() => setStatus.mutate({ inv: r, status: 'paid' })}
                              title="Mark as paid">
                              <CheckCircle2 className="w-4 h-4" />Mark Paid
                            </Button>
                          )}
                          {(r.status === 'draft' || r.status === 'to_be_sent' || r.status === 'issued') && (
                            <Button variant="ghost" size="sm" className="h-7 px-2 text-red-700 hover:bg-red-50" onClick={() => setStatus.mutate({ inv: r, status: 'void' })} title="Void">
                              <Ban className="w-4 h-4" />
                            </Button>
                          )}
                          {(r.status === 'draft' || r.status === 'to_be_sent' || r.status === 'void') && (
                            <Button variant="ghost" size="sm" className="h-7 px-2 text-red-700 hover:bg-red-50" onClick={() => { if (window.confirm(`Delete invoice ${r.invoice_number || ''}? This cannot be undone.`)) del.mutate(r.id); }} title="Delete">
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      </>
      )}

      {view === 'customers' && (
        <CustomersTab />
      )}

      <InvoiceEditDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        invoice={editing}
        defaultType={mode}
        onSaved={refresh}
      />
    </div>
  );
}