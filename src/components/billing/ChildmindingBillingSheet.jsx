import { useMemo, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Printer } from 'lucide-react';
import { format } from 'date-fns';
import { useOrgSettings } from '@/lib/useOrgSettings';
import { brandFooterLines } from '@/lib/candoraBrand';
import { RATE_PER_HOUR, MONTH_NAMES } from '@/lib/childmindingConstants';

const monthLabelFor = (ym) => {
  if (!ym) return '';
  const [y, m] = ym.split('-').map(Number);
  return `${MONTH_NAMES[m - 1]} ${y}`;
};

// Human-readable range label. Single month → "April 2026". Multi-month →
// "April 2026 – July 2026" (same year collapses to "April – July 2026").
const rangeLabel = (start, end) => {
  if (!end || end === start) return monthLabelFor(start);
  const [ys, ms] = start.split('-').map(Number);
  const [ye, me] = end.split('-').map(Number);
  if (ys === ye) return `${MONTH_NAMES[ms - 1]} – ${MONTH_NAMES[me - 1]} ${ys}`;
  return `${monthLabelFor(start)} – ${monthLabelFor(end)}`;
};

export default function ChildmindingBillingSheet({ billingMonth, billingMonthEnd }) {
  const sheetRef = useRef(null);
  const { invoiceLogoUrl, primaryColor, secondaryColor } = useOrgSettings();

  const navy = secondaryColor || '#0f1f6b';
  const gold = primaryColor || '#f5c116';

  const { data: records = [], isLoading } = useQuery({
    queryKey: ['childminding-records'],
    queryFn: () => base44.entities.ChildmindingRecord.list('-date', 2000),
  });

  // Effective range: start = billingMonth, end = billingMonthEnd (or start).
  const start = billingMonth;
  const end = billingMonthEnd && billingMonthEnd >= billingMonth ? billingMonthEnd : billingMonth;

  const monthRecords = useMemo(() => {
    return records
      .filter(r => {
        if (r.program !== 'pathways' || !r.date) return false;
        const ym = r.date.slice(0, 7); // "YYYY-MM"
        return ym >= start && ym <= end;
      })
      .sort((a, b) => (a.date || '').localeCompare(b.date || ''));
  }, [records, start, end]);

  const totalHours = monthRecords.reduce((s, r) => s + (r.hours || 0), 0);
  const totalAmount = monthRecords.reduce((s, r) => s + (r.billing_amount || (r.hours || 0) * RATE_PER_HOUR), 0);

  const label = rangeLabel(start, end);
  const issued = format(new Date(), 'MMMM d, yyyy');
  const footerLines = brandFooterLines();

  const handlePrint = () => {
    const win = window.open('', '_blank');
    if (!win) return;
    win.document.write(`<!DOCTYPE html><html><head><title>Pathways ${label} Childminding List</title>
      <style>
        @page { size: letter; margin: 0.6in; }
        body { font-family: Inter, Arial, sans-serif; color: #1a1a2e; margin: 0; }
        table { width: 100%; border-collapse: collapse; }
        * { print-color-adjust: exact !important; -webkit-print-color-adjust: exact !important; }
      </style></head><body>${sheetRef.current.outerHTML}</body></html>`);
    win.document.close();
    const img = win.document.querySelector('img');
    const doPrint = () => { win.focus(); win.print(); };
    if (img && !img.complete) img.onload = doPrint; else setTimeout(doPrint, 400);
  };

  const parentName = (r) => r.parent_name || `${r.parent_first_name || ''} ${r.parent_last_name || ''}`.trim() || '-';
  const childName = (r) => r.child_first_name || '-';
  const amount = (r) => r.billing_amount || (r.hours || 0) * RATE_PER_HOUR;

  return (
    <div className="space-y-3">
      <div className="flex justify-end no-print">
        <Button variant="outline" size="sm" onClick={handlePrint}>
          <Printer className="h-4 w-4 mr-2" /> Print / Save PDF
        </Button>
      </div>

      <div
        ref={sheetRef}
        style={{
          background: '#fff',
          color: '#0f172a',
          width: '100%',
          maxWidth: 850,
          margin: '0 auto',
          border: '1px solid #e2e8f0',
          borderRadius: 8,
          overflow: 'hidden',
          fontFamily: 'Inter, Arial, sans-serif',
        }}
      >
        {/* Top gold accent strip — matches the standard invoice letterhead */}
        <div style={{ height: 6, background: gold }} />

        {/* Letterhead — fixed-height navy band; logo zoomed via negative margins
            so the transparent padding around the mark is cropped (overflow hidden),
            the same treatment used on the official invoice. */}
        <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 32px', height: 120, background: navy, overflow: 'hidden' }}>
          <img
            src={invoiceLogoUrl}
            alt="Candora"
            style={{ height: 300, width: 'auto', marginTop: -90, marginBottom: -90, mixBlendMode: 'screen', filter: 'brightness(1.05) contrast(1.05)', objectFit: 'contain' }}
          />
          <div style={{ textAlign: 'right' }}>
            <h1 style={{ margin: 0, fontSize: 22, fontWeight: 800, letterSpacing: '0.06em', color: gold, lineHeight: 1.1 }}>Pathways {label} Childminding List</h1>
            <p style={{ margin: '6px 0 0', fontSize: 13, fontWeight: 600, color: '#fff' }}>Candora Society</p>
          </div>
        </div>

        {/* Meta band — navy tinted, mirrors the official invoice layout */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16, padding: '16px 32px', borderBottom: '1px solid #f1f5f9', background: navy + '0d', fontSize: 13 }}>
          <div>
            <p style={{ margin: 0, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.06em', color: navy }}>
              {end && end !== start ? 'Billing Period' : 'Billing Month'}
            </p>
            <p style={{ margin: '2px 0 0', fontWeight: 500 }}>{label}</p>
          </div>
          <div>
            <p style={{ margin: 0, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.06em', color: navy }}>Date Issued</p>
            <p style={{ margin: '2px 0 0', fontWeight: 500 }}>{issued}</p>
          </div>
          <div>
            <p style={{ margin: 0, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.06em', color: navy }}>Sessions</p>
            <p style={{ margin: '2px 0 0', fontWeight: 500 }}>{monthRecords.length}</p>
          </div>
        </div>

        {/* Rate statement */}
        <div style={{ padding: '10px 32px', borderBottom: `2px solid ${gold}`, background: '#f8f9fa', fontSize: 13, fontWeight: 600, color: navy }}>
          Billed at ${RATE_PER_HOUR}/hr per child
        </div>

        {/* Line items */}
        <div style={{ padding: '16px 32px' }}>
          {isLoading ? (
            <p style={{ textAlign: 'center', color: '#64748b', padding: 24 }}>Loading...</p>
          ) : monthRecords.length === 0 ? (
            <p style={{ textAlign: 'center', color: '#64748b', padding: 24 }}>
              No Pathways childminding sessions recorded for {label}.
            </p>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
              <thead>
                <tr style={{ borderBottom: `2px solid ${navy}` }}>
                  <th style={{ textAlign: 'left', padding: '8px 10px', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.06em', color: navy }}>#</th>
                  <th style={{ textAlign: 'left', padding: '8px 10px', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.06em', color: navy }}>Date</th>
                  <th style={{ textAlign: 'left', padding: '8px 10px', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.06em', color: navy }}>Parent/Guardian Full Name</th>
                  <th style={{ textAlign: 'left', padding: '8px 10px', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.06em', color: navy }}>Child's Full Name</th>
                  <th style={{ textAlign: 'center', padding: '8px 10px', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.06em', color: navy }}>Hours</th>
                  <th style={{ textAlign: 'right', padding: '8px 10px', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.06em', color: navy }}>Amount</th>
                </tr>
              </thead>
              <tbody>
                {monthRecords.map((r, i) => (
                  <tr key={r.id} style={{ borderBottom: '1px solid #f1f5f9', background: i % 2 === 0 ? '#fff' : '#f8fafc' }}>
                    <td style={{ padding: '6px 10px' }}>{i + 1}</td>
                    <td style={{ padding: '6px 10px' }}>{r.date ? format(new Date(r.date + 'T00:00:00'), 'MMM d, yyyy') : '-'}</td>
                    <td style={{ padding: '6px 10px' }}>{parentName(r)}</td>
                    <td style={{ padding: '6px 10px' }}>{childName(r)}</td>
                    <td style={{ padding: '6px 10px', textAlign: 'center' }}>{r.hours || 0}</td>
                    <td style={{ padding: '6px 10px', textAlign: 'right' }}>${amount(r).toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr style={{ background: '#f1f5f9', borderTop: `2px solid ${navy}` }}>
                  <td colSpan={4} style={{ padding: '8px 10px', textAlign: 'right', fontWeight: 'bold', color: navy }}>
                    TOTAL ({monthRecords.length} sessions):
                  </td>
                  <td style={{ padding: '8px 10px', textAlign: 'center', fontWeight: 'bold', color: navy }}>{totalHours.toFixed(1)}</td>
                  <td style={{ padding: '8px 10px', textAlign: 'right', fontWeight: 'bold', color: navy, fontSize: 14 }}>${totalAmount.toFixed(2)}</td>
                </tr>
              </tfoot>
            </table>
          )}
        </div>

        {/* Footer — Candora brand contact lines, matching the official invoice */}
        <div style={{ background: navy, color: '#fff', padding: '14px 32px', textAlign: 'center' }}>
          {footerLines.map((l, i) => (
            <p key={i} style={{ margin: '2px 0', fontSize: 11, color: i === 0 ? gold : '#e2e8f0' }}>{l}</p>
          ))}
        </div>
      </div>
    </div>
  );
}