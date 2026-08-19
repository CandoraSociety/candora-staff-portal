import { useMemo, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Printer } from 'lucide-react';
import { format } from 'date-fns';
import { useOrgSettings } from '@/lib/useOrgSettings';
import { RATE_PER_HOUR, MONTH_NAMES } from '@/lib/childmindingConstants';

const NAVY = '#172554';
const GOLD = '#f5c116';

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
  const { logoUrl } = useOrgSettings();

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

  const handlePrint = () => {
    const win = window.open('', '_blank');
    if (!win) return;
    win.document.write(`<!DOCTYPE html><html><head><title>Pathways Childminding Services - ${label}</title>
      <style>
        @page { size: letter; margin: 0.6in; }
        body { font-family: Inter, Arial, sans-serif; color: #1a1a2e; margin: 0; }
        table { width: 100%; border-collapse: collapse; }
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

      <div ref={sheetRef} style={{ background: '#fff', border: `4px solid ${NAVY}`, borderRadius: 8, overflow: 'hidden' }}>
        <div style={{ background: NAVY, color: '#fff', padding: '20px 28px', display: 'flex', alignItems: 'center', gap: 16 }}>
          <img src={logoUrl} alt="Candora" style={{ height: 56, width: 'auto', background: '#fff', borderRadius: 8, padding: 4 }} />
          <div style={{ flex: 1 }}>
            <h1 style={{ margin: 0, fontSize: 20, color: GOLD, letterSpacing: '0.04em' }}>Pathways Childminding Services</h1>
            <p style={{ margin: '4px 0 0', fontSize: 13, color: '#fff' }}>{label} Invoice</p>
          </div>
        </div>

        <p style={{ margin: 0, padding: '6px 28px', fontSize: 11, color: NAVY, background: '#f8f9fa', borderBottom: `2px solid ${GOLD}` }}>
          Childminding billed at ${RATE_PER_HOUR}/hour per child
        </p>

        <div style={{ padding: '16px 28px' }}>
          {isLoading ? (
            <p style={{ textAlign: 'center', color: '#64748b', padding: 24 }}>Loading...</p>
          ) : monthRecords.length === 0 ? (
            <p style={{ textAlign: 'center', color: '#64748b', padding: 24 }}>
              No Pathways childminding sessions recorded for {label}.
            </p>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
              <thead>
                <tr style={{ background: NAVY }}>
                  <th style={{ textAlign: 'left', padding: '8px 10px', color: GOLD }}>#</th>
                  <th style={{ textAlign: 'left', padding: '8px 10px', color: GOLD }}>Date</th>
                  <th style={{ textAlign: 'left', padding: '8px 10px', color: GOLD }}>Parent/Guardian Full Name</th>
                  <th style={{ textAlign: 'left', padding: '8px 10px', color: GOLD }}>Child's Full Name</th>
                  <th style={{ textAlign: 'center', padding: '8px 10px', color: GOLD }}>Hours</th>
                  <th style={{ textAlign: 'right', padding: '8px 10px', color: GOLD }}>Amount</th>
                </tr>
              </thead>
              <tbody>
                {monthRecords.map((r, i) => (
                  <tr key={r.id} style={{ borderBottom: '1px solid #e5e7eb', background: i % 2 === 0 ? '#fff' : '#f8fafc' }}>
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
                <tr style={{ background: '#f1f5f9', borderTop: `2px solid ${NAVY}` }}>
                  <td colSpan={4} style={{ padding: '8px 10px', textAlign: 'right', fontWeight: 'bold', color: NAVY }}>
                    TOTAL ({monthRecords.length} sessions):
                  </td>
                  <td style={{ padding: '8px 10px', textAlign: 'center', fontWeight: 'bold', color: NAVY }}>{totalHours.toFixed(1)}</td>
                  <td style={{ padding: '8px 10px', textAlign: 'right', fontWeight: 'bold', color: NAVY, fontSize: 14 }}>${totalAmount.toFixed(2)}</td>
                </tr>
              </tfoot>
            </table>
          )}
        </div>

        <div style={{ borderTop: `2px solid ${GOLD}`, background: NAVY, color: '#fff', padding: '8px 28px', fontSize: 10, display: 'flex', justifyContent: 'space-between' }}>
          <span>Candora — Pathways Childminding Services</span>
          <span>Generated {format(new Date(), 'MMM d, yyyy')}</span>
        </div>
      </div>
    </div>
  );
}