import { createClientFromRequest } from 'npm:@base44/sdk@0.8.49';
import { base44 } from 'npm:@base44/sdk@0.8.49';

// Monthly billing — runs on the 1st of each month. For every InvoiceCustomer
// with monthly_billing enabled, creates this month's FinanceInvoice using the
// customer's invoicing convention (PREFIX-####) and categorizes it as
// "to_be_sent". Skips customers who already have an invoice for this month.
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    // Current month in Candora's timezone — en-CA gives YYYY-MM
    const ym = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'America/Edmonton', year: 'numeric', month: '2-digit',
    }).format(new Date());
    const invoiceDate = `${ym}-01`;

    const customers = await base44.asServiceRole.entities.InvoiceCustomer.filter({ monthly_billing: true });
    const created = [];
    const skipped = [];

    for (const c of customers) {
      if (!c.monthly_amount || !c.invoice_prefix) {
        skipped.push({ customer: c.name, reason: 'missing monthly amount or invoice prefix' });
        continue;
      }

      // Skip if this customer already has an invoice for this month
      const existing = await base44.asServiceRole.entities.FinanceInvoice.filter({ customer_id: c.id });
      if (existing.some(inv => inv.invoice_date === invoiceDate)) {
        skipped.push({ customer: c.name, reason: 'invoice already exists for this month' });
        continue;
      }

      const seq = c.next_invoice_seq || 1;
      const number = `${c.invoice_prefix}-${String(seq).padStart(4, '0')}`;
      const subtotal = Number(c.monthly_amount) || 0;
      const gst = c.monthly_charge_gst ? Math.round(subtotal * 0.05 * 100) / 100 : 0;
      // Explicitly state the billing month and year on the invoice
      const [yy, mm] = ym.split('-');
      const monthLabel = new Date(Number(yy), Number(mm) - 1, 1)
        .toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
      const description = `${(c.monthly_line_description || 'Monthly services').trim()} — ${monthLabel}`;

      await base44.asServiceRole.entities.FinanceInvoice.create({
        invoice_type: 'receivable',
        invoice_number: number,
        customer_id: c.id,
        counterparty_name: c.name,
        counterparty_email: c.email || '',
        counterparty_phone: c.phone || '',
        counterparty_address: c.address || '',
        reference: description,
        invoice_date: invoiceDate,
        due_date: null,
        payment_terms: c.payment_terms || 'Payment due upon receipt',
        line_items: [{ description, quantity: 1, unit_price: subtotal }],
        charge_gst: !!c.monthly_charge_gst,
        subtotal,
        gst,
        total: subtotal + gst,
        notes: '',
        status: 'to_be_sent',
        prepared_by_name: 'Automatic monthly billing',
      });

      // Advance the customer's sequential invoice number
      await base44.asServiceRole.entities.InvoiceCustomer.update(c.id, { next_invoice_seq: seq + 1 });

      created.push({ customer: c.name, invoice_number: number });
    }

    return Response.json({ success: true, month: ym, created: created.length, created_invoices: created, skipped });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});