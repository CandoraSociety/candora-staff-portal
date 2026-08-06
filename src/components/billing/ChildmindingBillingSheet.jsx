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

export default function ChildmindingBillingSheet({ billingMonth }) {
  const sheetRef = useRef(null);
  const { logoUrl } = useOrgSettings();

  const { data: records = [], isLoading } = useQuery({
    queryKey: ['childminding-records'],
    queryFn: () => base44.entities.ChildmindingRecord.list('-date', 2000),
  });

  const monthRecords = useMemo(() => {
    return records
      .filter(r => r.program === 'pathways' && r.date && r.date.startsWith(billingMonth))
      .sort((a, b) => (a.date || '').localeCompare(b.date || ''));
  }, [records, billingMonth]);

  const totalHours = monthRecords.reduce((s, r) => s + (r.hours || 0), 0);
  const totalAmount = monthRecords.reduce((s, r) => s + (r.billing_amount || (r.hours || 0) * RATE_PER_HOUR), 0);

  const [year, monIdx] = billingMonth.split('-');
  const monthLabel = `${MONTH_NAMES[parseInt(monIdx) - 1]} ${year}`;

  const handlePrint = () => {
    const win = window.open('', '_blank');
    if (!win) return;
    win.document.write(`<!DOCTYPE html><html><head><title>Pathways Childminding Services - ${monthLabel}</title>
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
            <p style={{ margin: '4px 0 0', fontSize: 13, color: '#fff' }}>{monthLabel} Invoice</p>
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
              No Pathways childminding sessions recorded for {monthLabel}.
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