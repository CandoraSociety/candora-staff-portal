import { format } from 'date-fns';
import { CANDORA_BRAND, brandFooterLines } from '@/lib/candoraBrand';
import { useOrgSettings } from '@/lib/useOrgSettings';

const money = (n) => `$${(Number(n) || 0).toFixed(2)}`;
const qty = (n) => (n == null ? '—' : Number(n));

function Section({ title, items }) {
  if (!items.length) return null;
  return (
    <>
      <tr className="bg-slate-50">
        <td colSpan={4} className="py-1.5 px-3 text-[11px] font-semibold uppercase tracking-wide text-slate-600">
          {title}
        </td>
      </tr>
      {items.map((it) => (
        <tr key={it.key} className="border-b border-slate-100">
          <td className="py-2 px-3 text-sm text-slate-700">{it.label}</td>
          <td className="py-2 px-3 text-sm text-center text-slate-700 tabular-nums">
            {it.section === 'deliverable' ? qty(it.quantity) : '—'}
          </td>
          <td className="py-2 px-3 text-sm text-right text-slate-700 tabular-nums">
            {it.section === 'deliverable' ? money(it.unitPrice) : '—'}
          </td>
          <td className="py-2 px-3 text-sm text-right font-medium text-slate-900 tabular-nums">
            {money(it.amount)}
          </td>
        </tr>
      ))}
    </>
  );
}

const PROGRAM_OVERRIDE = 'Pathways Employment Program';
const PO_NUMBER = '9000158238';

export default function InvoiceDocument({ data, status }) {
  const { longLogoUrl } = useOrgSettings();
  if (!data) return null;
  const {
    invoiceNumber, billingMonth, header = [],
    lineItems = [], subtotalDeliverables = 0, subtotalDirectCosts = 0, total = 0,
  } = data;

  const fixed = lineItems.filter((i) => i.section === 'fixed');
  const deliverables = lineItems.filter((i) => i.section === 'deliverable');
  const directCosts = lineItems.filter((i) => i.section === 'direct_cost');
  const subtotalFixed = fixed.reduce((s, i) => s + (Number(i.amount) || 0), 0);

  const monthLabel = billingMonth ? format(new Date(billingMonth + '-01'), 'MMMM yyyy') : '';
  const issued = format(new Date(), 'MMMM d, yyyy');
  const footerLines = brandFooterLines();

  // Normalize header: strip trailing colons, override Program Name, split dates vs details.
  const cleaned = (header || [])
    .map((h) => ({ label: String(h.label ?? '').replace(/:\s*$/, '').trim(), value: String(h.value ?? '').trim() }))
    .filter((h) => h.label || h.value);

  const isDate = (label) => /start\s*date|end\s*date/i.test(label);
  const dateFields = cleaned.filter((h) => isDate(h.label));
  const detailFields = cleaned.filter((h) => !isDate(h.label)).map((h) =>
    /program\s*name/i.test(h.label) ? { ...h, value: PROGRAM_OVERRIDE } : h
  );
  detailFields.push({ label: 'P.O Number', value: PO_NUMBER });

  return (
    <div className="bg-white text-slate-900 mx-auto max-w-[850px] shadow-sm border border-slate-200 rounded-lg overflow-hidden">
      {/* Letterhead — Candora long-form logo (left) + INVOICE (right) */}
      <div className="flex items-center justify-between px-8 py-5 border-b border-slate-200">
        <img
          src={longLogoUrl}
          alt="Candora"
          className="h-16 w-auto object-contain"
          onError={(e) => { e.currentTarget.style.display = 'none'; }}
        />
        <div className="text-right">
          <p className="font-display font-extrabold text-2xl tracking-widest text-accent">INVOICE</p>
          <p className="text-sm mt-1 font-semibold text-slate-700">
            {invoiceNumber != null ? `Invoice #${invoiceNumber}` : 'Draft Invoice'}
          </p>
        </div>
      </div>

      {/* Invoice meta */}
      <div className="grid grid-cols-3 gap-4 px-8 py-4 border-b border-slate-100 text-sm">
        <div>
          <p className="text-[11px] uppercase tracking-wide text-slate-400">Billing Month</p>
          <p className="font-medium mt-0.5">{monthLabel}</p>
        </div>
        <div>
          <p className="text-[11px] uppercase tracking-wide text-slate-400">Date Issued</p>
          <p className="font-medium mt-0.5">{issued}</p>
        </div>
        <div>
          <p className="text-[11px] uppercase tracking-wide text-slate-400">Status</p>
          <p className="font-medium mt-0.5 capitalize">{status || (data.status) || 'Draft'}</p>
        </div>
      </div>

      {/* Program / Contract info — dates stacked on the left, details on the right */}
      <div className="px-8 py-4 border-b border-slate-100">
        <p className="text-[11px] uppercase tracking-wide text-slate-400 mb-3">Program / Contract Info</p>
        <div className="grid grid-cols-2 gap-x-8 gap-y-1.5">
          <div className="space-y-1.5">
            {dateFields.map((h, i) => (
              <div key={i} className="text-sm">
                <p className="text-slate-500">{h.label}:</p>
                <p className="font-medium text-slate-800">{h.value || '—'}</p>
              </div>
            ))}
          </div>
          <div className="space-y-1.5">
            {detailFields.map((h, i) => (
              <div key={i} className="flex gap-2 text-sm">
                <span className="text-slate-500 min-w-[130px]">{h.label}:</span>
                <span className="font-medium text-slate-800">{h.value || '—'}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Line items */}
      <div className="px-8 py-5">
        <table className="w-full">
          <thead>
            <tr className="border-b-2 border-slate-200 text-[11px] uppercase tracking-wide text-slate-500">
              <th className="text-left py-2 px-3 font-semibold">Description</th>
              <th className="text-center py-2 px-3 font-semibold">Qty</th>
              <th className="text-right py-2 px-3 font-semibold">Unit Price</th>
              <th className="text-right py-2 px-3 font-semibold">Amount</th>
            </tr>
          </thead>
          <tbody>
            {fixed.map((it) => (
              <tr key={it.key} className="border-b border-slate-100 bg-slate-50/60">
                <td className="py-2 px-3 text-sm font-medium text-slate-800">{it.label}</td>
                <td className="py-2 px-3 text-sm text-center text-slate-400">—</td>
                <td className="py-2 px-3 text-sm text-right text-slate-400">—</td>
                <td className="py-2 px-3 text-sm text-right font-medium text-slate-900 tabular-nums">{money(it.amount)}</td>
              </tr>
            ))}
            <Section title="Deliverables" items={deliverables} />
            <Section title="Direct Costs (Reimbursements)" items={directCosts} />
          </tbody>
        </table>

        {/* Totals */}
        <div className="mt-4 flex justify-end">
          <div className="w-64 space-y-1.5 text-sm">
            {subtotalFixed > 0 && (
              <div className="flex justify-between">
                <span className="text-slate-500">Subtotal — Fixed Fee</span>
                <span className="tabular-nums font-medium">{money(subtotalFixed)}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-slate-500">Subtotal — Deliverables</span>
              <span className="tabular-nums font-medium">{money(subtotalDeliverables)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Subtotal — Direct Costs</span>
              <span className="tabular-nums font-medium">{money(subtotalDirectCosts)}</span>
            </div>
            <div className="flex justify-between pt-2 border-t-2 border-accent text-base">
              <span className="font-bold text-accent">Total Due</span>
              <span className="tabular-nums font-bold text-accent">{money(total)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="px-8 py-4 bg-slate-50 border-t border-slate-100 text-center">
        {footerLines.map((l, i) => (
          <p key={i} className="text-xs text-slate-500 mt-0.5">{l}</p>
        ))}
      </div>
    </div>
  );
}