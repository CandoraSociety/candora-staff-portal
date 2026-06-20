import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { normalizeBookings } from '@/lib/normalizeBooking';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

const STATUS_COLORS = { pending: 'bg-yellow-100 text-yellow-700', confirmed: 'bg-green-100 text-green-700', denied: 'bg-red-100 text-red-600', cancelled: 'bg-gray-100 text-gray-500', completed: 'bg-blue-100 text-blue-700', more_info_requested: 'bg-orange-100 text-orange-700' };
const TYPE_COLORS = { external_event: 'bg-amber-100 text-amber-700', inhouse_event: 'bg-teal-100 text-teal-700' };

function Row({ label, value }) {
  if (!value) return null;
  return <div className="flex gap-2 text-sm py-1"><span className="text-gray-400 w-36 flex-shrink-0">{label}</span><span className="text-gray-700 font-medium">{value}</span></div>;
}

export default function AdminBookingsList() {
  const qc = useQueryClient();
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [selected, setSelected] = useState(null);
  const [tab, setTab] = useState('details');
  const [adminNotes, setAdminNotes] = useState('');
  const [moreInfoText, setMoreInfoText] = useState('');
  const [showMoreInfoInput, setShowMoreInfoInput] = useState(false);

  const { data: raw = [], isLoading } = useQuery({ queryKey: ['admin-bookings'], queryFn: () => base44.entities.BookingRequest.list('-created_date') });
  const bookings = normalizeBookings(raw);

  const filtered = bookings.filter(b => {
    if (statusFilter !== 'all' && b.status !== statusFilter) return false;
    if (typeFilter !== 'all' && b.booking_type !== typeFilter) return false;
    if (dateFrom && b.event_date < dateFrom) return false;
    if (dateTo && b.event_date > dateTo) return false;
    return true;
  });

  const updateStatus = async (id, status, extra = {}) => {
    await base44.entities.BookingRequest.update(id, { status, ...extra });
    qc.invalidateQueries(['admin-bookings']);
    setSelected(b => b ? { ...b, status, ...extra } : null);
    setShowMoreInfoInput(false);
  };

  const saveNotes = async () => {
    if (!selected) return;
    await base44.entities.BookingRequest.update(selected.id, { admin_notes: adminNotes });
    qc.invalidateQueries(['admin-bookings']);
  };

  const openDetail = (b) => { setSelected(b); setTab('details'); setAdminNotes(b.admin_notes || ''); setShowMoreInfoInput(false); };

  const barFee = selected?.bar_service_addon ? 150 + (selected.bar_liquor_source === 'we_provide' ? (parseFloat(selected.bar_estimated_sales) || 0) * 0.15 : 0) : 0;
  const setupFee = { full_setup_teardown: 200, setup_only: 100, teardown_only: 100, self_service: 0 }[selected?.setup_teardown] || 0;

  return (
    <div className="p-6 space-y-5">
      <h1 className="font-heading text-2xl font-bold text-gray-800">All Bookings</h1>

      <div className="flex flex-wrap gap-3">
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="border border-gray-200 rounded-lg px-3 py-2 text-sm">
          <option value="all">All Statuses</option>
          {['pending','confirmed','denied','more_info_requested','completed','cancelled'].map(s => <option key={s} value={s}>{s.replace(/_/g,' ')}</option>)}
        </select>
        <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)} className="border border-gray-200 rounded-lg px-3 py-2 text-sm">
          <option value="all">All Types</option>
          <option value="external_event">External Event</option>
          <option value="inhouse_event">In-House Event</option>
        </select>
        <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} className="border border-gray-200 rounded-lg px-3 py-2 text-sm" placeholder="From" />
        <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} className="border border-gray-200 rounded-lg px-3 py-2 text-sm" placeholder="To" />
      </div>

      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-xs text-gray-400 uppercase tracking-wide">
              <tr>{['Code','Contact','Org','Event Date','Type','Space/Location','Guests','Status','Total',''].map(h => <th key={h} className="px-4 py-3 text-left">{h}</th>)}</tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.map(b => (
                <tr key={b.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-mono font-bold text-cp-primary text-xs">{b.confirmation_code}</td>
                  <td className="px-4 py-3 text-gray-700">{b.contact_name}</td>
                  <td className="px-4 py-3 text-gray-400">{b.organization || '—'}</td>
                  <td className="px-4 py-3 text-gray-500">{b.event_date}</td>
                  <td className="px-4 py-3"><span className={`text-xs px-2 py-0.5 rounded-full ${TYPE_COLORS[b.booking_type] || ''}`}>{b.booking_type?.replace(/_/g,' ')}</span></td>
                  <td className="px-4 py-3 text-gray-400 text-xs">{b.space || b.event_location || '—'}</td>
                  <td className="px-4 py-3 text-gray-500">{b.guest_count || '—'}</td>
                  <td className="px-4 py-3"><span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLORS[b.status] || ''}`}>{b.status?.replace(/_/g,' ')}</span></td>
                  <td className="px-4 py-3 text-gray-700">{b.estimated_total > 0 ? `$${b.estimated_total.toFixed(2)}` : '—'}</td>
                  <td className="px-4 py-3"><button onClick={() => openDetail(b)} className="text-xs bg-cp-primary text-white px-3 py-1 rounded-full hover:opacity-90">View</button></td>
                </tr>
              ))}
              {filtered.length === 0 && <tr><td colSpan={10} className="text-center py-10 text-gray-400">No bookings found.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>

      <Dialog open={!!selected} onOpenChange={() => setSelected(null)}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-heading">Booking — {selected?.confirmation_code}</DialogTitle>
          </DialogHeader>

          {selected && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 flex-wrap">
                <span className={`text-xs px-3 py-1 rounded-full font-semibold ${STATUS_COLORS[selected.status] || ''}`}>{selected.status?.replace(/_/g,' ')}</span>
                <span className={`text-xs px-3 py-1 rounded-full ${TYPE_COLORS[selected.booking_type] || ''}`}>{selected.booking_type?.replace(/_/g,' ')}</span>
              </div>

              <div className="flex gap-2 border-b border-gray-100 pb-2">
                {['details','catering','services','financial','admin'].map(t => (
                  <button key={t} onClick={() => setTab(t)} className={`text-sm px-3 py-1 rounded-lg capitalize font-medium transition-colors ${tab === t ? 'bg-cp-primary text-white' : 'text-gray-500 hover:text-gray-700'}`}>{t}</button>
                ))}
              </div>

              {tab === 'details' && (
                <div className="space-y-1">
                  <Row label="Contact" value={selected.contact_name} />
                  <Row label="Email" value={selected.contact_email} />
                  <Row label="Phone" value={selected.contact_phone} />
                  <Row label="Organization" value={selected.organization} />
                  <Row label="Description" value={selected.event_description} />
                  <Row label="Event Date" value={selected.event_date} />
                  <Row label="Time" value={`${selected.start_time} – ${selected.end_time}`} />
                  <Row label="Guests" value={selected.guest_count?.toString()} />
                  <Row label="Location" value={selected.event_location} />
                  <Row label="Space" value={selected.space} />
                  {selected.is_recurring && <Row label="Recurring" value={`${selected.recurrence_pattern} until ${selected.recurrence_end_date}`} />}
                </div>
              )}

              {tab === 'catering' && (
                <div className="space-y-1">
                  <Row label="Catering Required" value={selected.catering_required} />
                  <Row label="Style" value={selected.catering_style} />
                  <Row label="Service Level" value={selected.catering_service_level?.replace(/_/g,' ')} />
                  {(selected.catering_selections || []).length > 0 && (
                    <table className="w-full text-sm mt-2">
                      <thead className="text-xs text-gray-400 border-b"><tr><th className="text-left py-1">Item</th><th className="text-left py-1">Qty</th><th className="text-left py-1">Price</th></tr></thead>
                      <tbody>{selected.catering_selections.map((s, i) => <tr key={i}><td>{s.item_name}</td><td>{s.quantity}</td><td>${(s.unit_price * s.quantity).toFixed(2)}</td></tr>)}</tbody>
                    </table>
                  )}
                  <Row label="Bar Service" value={selected.bar_service_addon ? `${selected.bar_service_type?.replace(/_/g,' ')} — ${selected.bar_liquor_source?.replace(/_/g,' ')}` : 'No'} />
                  {selected.catering_custom_request && <Row label="Custom Request" value={selected.catering_custom_request} />}
                </div>
              )}

              {tab === 'services' && (
                <div className="space-y-1">
                  <Row label="Staffing" value={selected.staffing_required ? `${selected.staffing_count} staff` : 'No'} />
                  <Row label="Setup/Teardown" value={selected.setup_teardown?.replace(/_/g,' ')} />
                  {(selected.equipment_rentals || []).map((e, i) => (
                    <Row key={i} label={e.item_name} value={`×${e.quantity} — $${(e.unit_price * e.quantity).toFixed(2)}`} />
                  ))}
                </div>
              )}

              {tab === 'financial' && (
                <div className="space-y-1.5 bg-gray-50 p-4 rounded-xl">
                  {selected.space_rental_total > 0 && <Row label="Space Rental" value={`$${selected.space_rental_total.toFixed(2)}`} />}
                  {selected.catering_estimate > 0 && <Row label="Catering" value={`$${selected.catering_estimate.toFixed(2)}`} />}
                  {selected.catering_gratuity > 0 && <Row label="Gratuity (15%)" value={`$${selected.catering_gratuity.toFixed(2)}`} />}
                  {barFee > 0 && <Row label="Bar Service" value={`$${barFee.toFixed(2)}`} />}
                  {selected.staffing_fee > 0 && <Row label="Staffing" value={`$${selected.staffing_fee.toFixed(2)}`} />}
                  {setupFee > 0 && <Row label="Setup/Teardown" value={`$${setupFee.toFixed(2)}`} />}
                  {selected.equipment_rental_total > 0 && <Row label="Equipment" value={`$${selected.equipment_rental_total.toFixed(2)}`} />}
                  <div className="border-t pt-2 mt-2 flex justify-between font-bold text-cp-primary"><span>Grand Total Estimate</span><span>${(selected.estimated_total || 0).toFixed(2)}</span></div>
                </div>
              )}

              {tab === 'admin' && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">Admin Notes</label>
                    <textarea rows={4} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" value={adminNotes} onChange={e => setAdminNotes(e.target.value)} onBlur={saveNotes} placeholder="Internal notes..." />
                  </div>

                  <div className="space-y-2">
                    <p className="text-sm font-semibold text-gray-600">Status Actions</p>

                    {selected.status === 'more_info_requested' && selected.more_info_response && (
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-blue-700">
                        <p className="font-semibold mb-1">Client Response:</p>
                        <p>{selected.more_info_response}</p>
                      </div>
                    )}

                    <div className="flex flex-wrap gap-2">
                      {selected.status === 'pending' && <>
                        <button onClick={() => updateStatus(selected.id, 'confirmed')} className="bg-green-500 text-white text-sm px-4 py-2 rounded-lg hover:bg-green-600">Approve</button>
                        <button onClick={() => updateStatus(selected.id, 'denied')} className="bg-red-500 text-white text-sm px-4 py-2 rounded-lg hover:bg-red-600">Deny</button>
                        <button onClick={() => setShowMoreInfoInput(true)} className="bg-orange-400 text-white text-sm px-4 py-2 rounded-lg hover:bg-orange-500">Request More Info</button>
                      </>}
                      {selected.status === 'more_info_requested' && <>
                        <button onClick={() => updateStatus(selected.id, 'confirmed')} className="bg-green-500 text-white text-sm px-4 py-2 rounded-lg hover:bg-green-600">Approve</button>
                        <button onClick={() => updateStatus(selected.id, 'denied')} className="bg-red-500 text-white text-sm px-4 py-2 rounded-lg hover:bg-red-600">Deny</button>
                      </>}
                      {selected.status === 'confirmed' && <>
                        <button onClick={() => updateStatus(selected.id, 'completed')} className="bg-blue-500 text-white text-sm px-4 py-2 rounded-lg hover:bg-blue-600">Mark Complete</button>
                        <button onClick={() => updateStatus(selected.id, 'cancelled')} className="bg-gray-400 text-white text-sm px-4 py-2 rounded-lg hover:bg-gray-500">Cancel</button>
                      </>}
                    </div>

                    {showMoreInfoInput && (
                      <div className="mt-2">
                        <textarea rows={3} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" value={moreInfoText} onChange={e => setMoreInfoText(e.target.value)} placeholder="Describe what additional information you need from the client..." />
                        <button onClick={() => updateStatus(selected.id, 'more_info_requested', { more_info_request_details: moreInfoText, more_info_requested_date: new Date().toISOString().split('T')[0] })}
                          disabled={!moreInfoText.trim()} className="mt-2 bg-orange-400 text-white text-sm px-4 py-2 rounded-lg hover:bg-orange-500 disabled:opacity-50">
                          Send Request
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}