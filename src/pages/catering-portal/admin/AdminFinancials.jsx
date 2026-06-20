import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { normalizeBookings } from '@/lib/normalizeBooking';
import { Printer } from 'lucide-react';

export default function AdminFinancials() {
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  const { data: raw = [] } = useQuery({ queryKey: ['admin-bookings'], queryFn: () => base44.entities.BookingRequest.list('-event_date') });
  const all = normalizeBookings(raw);

  const bookings = all.filter(b => {
    if (!['confirmed','completed'].includes(b.status)) return false;
    if (dateFrom && b.event_date < dateFrom) return false;
    if (dateTo && b.event_date > dateTo) return false;
    return true;
  });

  const totals = bookings.reduce((acc, b) => {
    const barFee = b.bar_service_addon ? 150 + (b.bar_liquor_source === 'we_provide' ? (b.bar_estimated_sales || 0) * 0.15 : 0) : 0;
    const setupFee = { full_setup_teardown: 200, setup_only: 100, teardown_only: 100, self_service: 0 }[b.setup_teardown] || 0;
    acc.catering += b.catering_estimate || 0;
    acc.gratuity += b.catering_gratuity || 0;
    acc.bar += barFee;
    acc.staffing += b.staffing_fee || 0;
    acc.equipment += b.equipment_rental_total || 0;
    acc.space += b.space_rental_total || 0;
    acc.grand += b.estimated_total || 0;
    return acc;
  }, { catering:0, gratuity:0, bar:0, staffing:0, equipment:0, space:0, grand:0 });

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between no-print">
        <h1 className="font-heading text-2xl font-bold text-gray-800">Financials</h1>
        <button onClick={() => window.print()} className="flex items-center gap-2 bg-cp-primary text-white text-sm font-semibold px-4 py-2 rounded-xl hover:opacity-90">
          <Printer className="w-4 h-4" /> Export / Print
        </button>
      </div>

      <div className="flex gap-3 no-print">
        <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} className="border border-gray-200 rounded-lg px-3 py-2 text-sm" />
        <span className="self-center text-gray-400">to</span>
        <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} className="border border-gray-200 rounded-lg px-3 py-2 text-sm" />
      </div>

      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead className="bg-gray-50 text-gray-400 uppercase tracking-wide">
              <tr>{['Code','Contact','Event Date','Type','Catering','Gratuity','Bar','Staffing','Equipment','Space','Grand Total'].map(h => <th key={h} className="px-3 py-3 text-left">{h}</th>)}</tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {bookings.map(b => {
                const barFee = b.bar_service_addon ? 150 + (b.bar_liquor_source === 'we_provide' ? (b.bar_estimated_sales || 0) * 0.15 : 0) : 0;
                return (
                  <tr key={b.id} className="hover:bg-gray-50">
                    <td className="px-3 py-2 font-mono font-bold text-cp-primary">{b.confirmation_code}</td>
                    <td className="px-3 py-2">{b.contact_name}</td>
                    <td className="px-3 py-2 text-gray-500">{b.event_date}</td>
                    <td className="px-3 py-2 capitalize text-gray-400">{b.booking_type?.replace(/_/g,' ')}</td>
                    <td className="px-3 py-2">{b.catering_estimate > 0 ? `$${b.catering_estimate.toFixed(2)}` : '—'}</td>
                    <td className="px-3 py-2">{b.catering_gratuity > 0 ? `$${b.catering_gratuity.toFixed(2)}` : '—'}</td>
                    <td className="px-3 py-2">{barFee > 0 ? `$${barFee.toFixed(2)}` : '—'}</td>
                    <td className="px-3 py-2">{b.staffing_fee > 0 ? `$${b.staffing_fee.toFixed(2)}` : '—'}</td>
                    <td className="px-3 py-2">{b.equipment_rental_total > 0 ? `$${b.equipment_rental_total.toFixed(2)}` : '—'}</td>
                    <td className="px-3 py-2">{b.space_rental_total > 0 ? `$${b.space_rental_total.toFixed(2)}` : '—'}</td>
                    <td className="px-3 py-2 font-bold text-cp-primary">{b.estimated_total > 0 ? `$${b.estimated_total.toFixed(2)}` : '—'}</td>
                  </tr>
                );
              })}
              {bookings.length > 0 && (
                <tr className="bg-cp-primary/10 font-bold text-xs">
                  <td className="px-3 py-3" colSpan={4}>TOTALS ({bookings.length} bookings)</td>
                  <td className="px-3 py-3">${totals.catering.toFixed(2)}</td>
                  <td className="px-3 py-3">${totals.gratuity.toFixed(2)}</td>
                  <td className="px-3 py-3">${totals.bar.toFixed(2)}</td>
                  <td className="px-3 py-3">${totals.staffing.toFixed(2)}</td>
                  <td className="px-3 py-3">${totals.equipment.toFixed(2)}</td>
                  <td className="px-3 py-3">${totals.space.toFixed(2)}</td>
                  <td className="px-3 py-3 text-cp-primary">${totals.grand.toFixed(2)}</td>
                </tr>
              )}
              {bookings.length === 0 && <tr><td colSpan={11} className="text-center py-8 text-gray-400">No confirmed/completed bookings found.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}