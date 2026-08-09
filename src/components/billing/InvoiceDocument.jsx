import { format } from 'date-fns';
import { CANDORA_BRAND, brandFooterLines } from '@/lib/candoraBrand';
import { useOrgSettings } from '@/lib/useOrgSettings';

const money = (n) => `$${(Number(n) || 0).toFixed(2)}`;
const qty = (n) => (n == null ? '—' : Number(n));

function Section({ title, items, navy }) {
  if (!items.length) return null;
  return (
    <>
      <tr style={{ background: navy + '14' }}>
        <td colSpan={4} className="py-1.5 px-3 text-[11px] font-semibold uppercase tracking-wide" style={{ color: navy }}>
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
  const { invoiceLogoUrl, primaryColor, secondaryColor, accentColor } = useOrgSettings();
  if (!data) return null;
  const {
    invoiceNumber, billingMonth, header = [],
    lineItems = [], subtotalDeliverables = 0, subtotalDirectCosts = 0, total = 0,
  } = data;

  const navy = secondaryColor || '#0f1f6b';
  const gold = primaryColor || '#f5c116';
  const blue = accentColor || '#2b2de8';

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
      {/* Top gold accent strip */}
      <div style={{ height: 6, background: gold }} />

      {/* Letterhead — dominant navy brand band, logo directly on navy (tightly cropped, larger) */}
      <div className="flex items-center justify-between px-8 py-2" style={{ background: navy }}>
        <img
          src={invoiceLogoUrl}
          alt="Candora"
          className="h-52 w-auto max-w-[480px] object-contain"
          style={{ mixBlendMode: 'screen', filter: 'brightness(1.05) contrast(1.05)' }}
          onError={(e) => { e.currentTarget.style.display = 'none'; }}
        />
        <div className="text-right">
          <p className="font-display font-extrabold text-3xl tracking-widest" style={{ color: gold }}>INVOICE</p>
          <p className="text-sm mt-1.5 font-semibold text-white">
            {invoiceNumber != null ? `Invoice #${invoiceNumber}` : 'Draft Invoice'}
          </p>
        </div>
      </div>

      {/* Invoice meta — navy-tinted band */}
      <div className="grid grid-cols-3 gap-4 px-8 py-4 border-b border-slate-100 text-sm" style={{ background: navy + '0d' }}>
        <div>
          <p className="text-[11px] uppercase tracking-wide" style={{ color: navy }}>Billing Month</p>
          <p className="font-medium mt-0.5">{monthLabel}</p>
        </div>
        <div>
          <p className="text-[11px] uppercase tracking-wide" style={{ color: navy }}>Date Issued</p>
          <p className="font-medium mt-0.5">{issued}</p>
        </div>
        <div>
          <p className="text-[11px] uppercase tracking-wide" style={{ color: navy }}>Status</p>
          <p className="font-medium mt-0.5 capitalize">{status || (data.status) || 'Draft'}</p>
        </div>
      </div>

      {/* Program / Contract info — dates stacked on the left, details on the right */}
      <div className="px-8 py-4 border-b border-slate-100">
        <p className="text-[11px] uppercase tracking-wide mb-3" style={{ color: navy }}>Program / Contract Info</p>
        <div className="grid grid-cols-2 gap-x-8 gap-y-1.5">
          <div className="space-y-1.5">
            {dateFields.map((h, i) => (
              <div key={i} className="text-sm">
                <p className="text-slate-500">{h.label}:</p>
                <p className="font-medium" style={{ color: navy }}>{h.value || '—'}</p>
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
            <tr className="border-b-2 text-[11px] uppercase tracking-wide" style={{ borderColor: navy }}>
              <th className="text-left py-2 px-3 font-semibold" style={{ color: navy }}>Description</th>
              <th className="text-center py-2 px-3 font-semibold" style={{ color: navy }}>Qty</th>
              <th className="text-right py-2 px-3 font-semibold" style={{ color: navy }}>Unit Price</th>
              <th className="text-right py-2 px-3 font-semibold" style={{ color: navy }}>Amount</th>
            </tr>
          </thead>
          <tbody>
            {fixed.map((it) => (
              <tr key={it.key} className="border-b border-slate-100" style={{ background: navy + '0a' }}>
                <td className="py-2 px-3 text-sm font-medium text-slate-800">{it.label}</td>
                <td className="py-2 px-3 text-sm text-center text-slate-400">—</td>
                <td className="py-2 px-3 text-sm text-right text-slate-400">—</td>
                <td className="py-2 px-3 text-sm text-right font-medium text-slate-900 tabular-nums">{money(it.amount)}</td>
              </tr>
            ))}
            <Section title="Deliverables" items={deliverables} navy={navy} />
            <Section title="Direct Costs (Reimbursements)" items={directCosts} navy={navy} />
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
            <div className="flex justify-between px-3 py-2 mt-1 text-base" style={{ background: navy, borderTop: `3px solid ${gold}` }}>
              <span className="font-bold" style={{ color: gold }}>Total Due</span>
              <span className="tabular-nums font-bold text-white">{money(total)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="px-8 py-4 text-center" style={{ background: navy }}>
        {footerLines.map((l, i) => (
          <p key={i} className="text-xs mt-0.5" style={{ color: i === 0 ? gold : '#e2e8f0' }}>{l}</p>
        ))}
      </div>
    </div>
  );
}