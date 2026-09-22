import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CalendarClock, Pencil, Plus } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { useCurrentUser } from '@/lib/useAuth';
import { displayName } from '@/lib/userDisplayName';
import InvoiceCustomerDialog from './InvoiceCustomerDialog';

const fmt = n => `$${Number(n || 0).toFixed(2)}`;

// Create this month's invoice for a monthly-billed customer on demand — for
// situations like a first month that starts after the 1st has already passed.
// Uses the same convention as the automatic monthly run: PREFIX-####, To Be Sent.
async function createThisMonthInvoice(customer, user) {
  const invoiceDate = `${format(new Date(), 'yyyy-MM')}-01`;
  const existing = await base44.entities.FinanceInvoice.filter({ customer_id: customer.id });
  if (existing.some(inv => inv.invoice_date === invoiceDate)) {
    return { exists: true };
  }
  const seq = customer.next_invoice_seq || 1;
  const number = `${customer.invoice_prefix}-${String(seq).padStart(4, '0')}`;
  const subtotal = Number(customer.monthly_amount) || 0;
  const gst = customer.monthly_charge_gst ? Math.round(subtotal * 0.05 * 100) / 100 : 0;
  const description = (customer.monthly_line_description || 'Monthly services').trim();
  await base44.entities.FinanceInvoice.create({
    invoice_type: 'receivable',
    invoice_number: number,
    customer_id: customer.id,
    counterparty_name: customer.name,
    counterparty_email: customer.email || '',
    counterparty_phone: customer.phone || '',
    counterparty_address: customer.address || '',
    reference: description,
    invoice_date: invoiceDate,
    due_date: null,
    payment_terms: customer.payment_terms || 'Payment due upon receipt',
    line_items: [{ description, quantity: 1, unit_price: subtotal }],
    charge_gst: !!customer.monthly_charge_gst,
    subtotal,
    gst,
    total: subtotal + gst,
    notes: '',
    status: 'to_be_sent',
    prepared_by_name: displayName(user),
  });
  await base44.entities.InvoiceCustomer.update(customer.id, { next_invoice_seq: seq + 1 });
  return { number, exists: false };
}

// Customers / vendors list — invoicing conventions, monthly billing setup,
// and on-demand generation of this month's invoice.
export default function CustomersTab() {
  const qc = useQueryClient();
  const { user } = useCurrentUser();
  const [editOpen, setEditOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [generatingId, setGeneratingId] = useState(null);

  const { data: customers = [], isLoading } = useQuery({
    queryKey: ['invoice-customers'],
    queryFn: () => base44.entities.InvoiceCustomer.list('name', 500),
  });

  const refresh = () => qc.invalidateQueries({ queryKey: ['invoice-customers'] });

  const generate = async (c) => {
    setGeneratingId(c.id);
    try {
      const res = await createThisMonthInvoice(c, user);
      if (res.exists) {
        toast.info(`${c.name} already has an invoice dated this month.`);
      } else {
        toast.success(`Invoice ${res.number} created — marked To Be Sent.`);
        qc.invalidateQueries({ queryKey: ['finance-invoices'] });
      }
    } catch {
      toast.error('Could not create the invoice. Try again.');
    } finally {
      setGeneratingId(null);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">
          People and organizations Candora invoices, with their invoicing convention and monthly billing setup.
        </p>
        <Button className="gap-2" onClick={() => { setEditing(null); setEditOpen(true); }}>
          <Plus className="w-4 h-4" />Add Customer
        </Button>
      </div>

      {isLoading ? (
        <div className="text-sm text-muted-foreground">Loading…</div>
      ) : customers.length === 0 ? (
        <Card><CardContent className="py-10 text-center text-sm text-muted-foreground">
          No invoice customers yet — add one to set up their invoicing convention and monthly billing.
        </CardContent></Card>
      ) : (
        <Card className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b bg-muted/30">
                <tr>
                  <th className="text-left px-3 py-2 font-semibold">Customer</th>
                  <th className="text-left px-3 py-2 font-semibold">Convention</th>
                  <th className="text-left px-3 py-2 font-semibold">Next Invoice #</th>
                  <th className="text-left px-3 py-2 font-semibold">Monthly Billing</th>
                  <th className="text-left px-3 py-2 font-semibold">Payment Terms</th>
                  <th className="text-center px-3 py-2 font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {customers.map(c => (
                  <tr key={c.id} className="hover:bg-muted/30">
                    <td className="px-3 py-2">
                      <div className="font-medium">{c.name}</div>
                      {c.email && <div className="text-xs text-muted-foreground">{c.email}</div>}
                    </td>
                    <td className="px-3 py-2 font-mono text-xs">{c.invoice_prefix}-####</td>
                    <td className="px-3 py-2 font-mono text-xs">
                      {c.invoice_prefix}-{String(c.next_invoice_seq || 1).padStart(4, '0')}
                    </td>
                    <td className="px-3 py-2">
                      {c.monthly_billing ? (
                        <Badge className="bg-blue-100 text-blue-800">Monthly — {fmt(c.monthly_amount)}</Badge>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </td>
                    <td className="px-3 py-2 text-muted-foreground">{c.payment_terms || '—'}</td>
                    <td className="px-3 py-2">
                      <div className="flex items-center justify-center gap-1 flex-wrap">
                        {c.monthly_billing && (
                          <Button
                            size="sm"
                            className="h-7 px-3 gap-1.5 font-semibold"
                            disabled={generatingId === c.id}
                            onClick={() => generate(c)}
                            title="Create this month's invoice now — for months that start after the 1st"
                          >
                            <CalendarClock className="w-4 h-4" />Generate This Month's Invoice
                          </Button>
                        )}
                        <Button variant="ghost" size="sm" className="h-7 px-2" onClick={() => { setEditing(c); setEditOpen(true); }} title="Edit">
                          <Pencil className="w-4 h-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      <InvoiceCustomerDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        customer={editing}
        onSaved={refresh}
      />
    </div>
  );
}