import React, { useState } from 'react';
import FoodAreaHeader from '@/components/food/FoodAreaHeader';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { normalizeBookings } from '@/lib/normalizeBooking';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Plus, ChevronLeft, ChevronRight, Printer, AlertCircle } from 'lucide-react';
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { format } from 'date-fns';

// ─── Shared constants ─────────────────────────────────────────────────────────
const STATUS_COLORS = { pending: 'bg-yellow-100 text-yellow-700', confirmed: 'bg-green-100 text-green-700', denied: 'bg-red-100 text-red-600', cancelled: 'bg-gray-100 text-gray-500', completed: 'bg-blue-100 text-blue-700', more_info_requested: 'bg-orange-100 text-orange-700' };
const TYPE_COLORS   = { external_event: 'bg-amber-100 text-amber-700', inhouse_event: 'bg-teal-100 text-teal-700' };
const MONTHS_SHORT  = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const MONTHS_LONG   = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const CHART_COLORS  = ['#2d6a4f','#f4a261','#4a90d9','#e63946','#9b5de5','#2ec4b6'];

function Row({ label, value }) {
  if (!value) return null;
  return <div className="flex gap-2 text-sm py-1"><span className="text-gray-400 w-36 flex-shrink-0">{label}</span><span className="text-gray-700 font-medium">{value}</span></div>;
}

// ─── Dashboard tab ────────────────────────────────────────────────────────────
function TabDashboard({ bookings, setActiveTab }) {
  const now = new Date();
  const thisMonth = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}`;
  const pending   = bookings.filter(b => b.status === 'pending').length;
  const moreInfo  = bookings.filter(b => b.status === 'more_info_requested').length;
  const monthRevenue = bookings.filter(b => ['confirmed','completed'].includes(b.status) && b.event_date?.startsWith(thisMonth)).reduce((s, b) => s + (b.estimated_total || 0), 0);
  const recent    = bookings.slice(0, 10);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-gray-800">Catering Overview</h2>
        <p className="text-gray-400 text-sm mt-1">{format(now, 'EEEE, MMMM d, yyyy')}</p>
      </div>

      {moreInfo > 0 && (
        <div className="flex items-center gap-3 bg-orange-50 border border-orange-200 rounded-xl p-4 text-orange-700">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span className="text-sm font-medium">{moreInfo} booking{moreInfo > 1 ? 's' : ''} require additional information from the client.</span>
          <button onClick={() => setActiveTab('bookings')} className="ml-auto text-xs font-bold underline">View →</button>
        </div>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Bookings', value: bookings.length, color: 'text-gray-700' },
          { label: 'Pending', value: pending, color: 'text-yellow-600' },
          { label: 'More Info Needed', value: moreInfo, color: 'text-orange-600' },
          { label: 'This Month Revenue', value: `$${monthRevenue.toFixed(0)}`, color: 'text-green-600' },
        ].map(({ label, value, color }) => (
          <div key={label} className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm">
            <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">{label}</p>
            <p className={`text-2xl font-bold ${color}`}>{value}</p>
          </div>
        ))}
      </div>

      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="font-bold text-gray-800">Recent Bookings</h2>
          <button onClick={() => setActiveTab('bookings')} className="text-xs text-primary font-semibold hover:underline">View All</button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-xs text-gray-400 uppercase tracking-wide">
              <tr>{['Code','Contact','Event Date','Type','Status','Total'].map(h => <th key={h} className="px-4 py-3 text-left">{h}</th>)}</tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {recent.map(b => (
                <tr key={b.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-mono font-bold text-primary text-xs">{b.confirmation_code}</td>
                  <td className="px-4 py-3 text-gray-700">{b.contact_name}</td>
                  <td className="px-4 py-3 text-gray-500">{b.event_date}</td>
                  <td className="px-4 py-3"><span className={`text-xs px-2 py-0.5 rounded-full font-medium ${TYPE_COLORS[b.booking_type] || 'bg-gray-100 text-gray-500'}`}>{b.booking_type?.replace(/_/g,' ')}</span></td>
                  <td className="px-4 py-3"><span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLORS[b.status] || 'bg-gray-100'}`}>{b.status?.replace(/_/g,' ')}</span></td>
                  <td className="px-4 py-3 text-gray-700">{b.estimated_total > 0 ? `$${b.estimated_total.toFixed(2)}` : '—'}</td>
                </tr>
              ))}
              {recent.length === 0 && <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-400">No bookings yet.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ─── Bookings list tab ────────────────────────────────────────────────────────
function TabBookings({ bookings }) {
  const qc = useQueryClient();
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter]     = useState('all');
  const [dateFrom, setDateFrom]         = useState('');
  const [dateTo, setDateTo]             = useState('');
  const [selected, setSelected]         = useState(null);
  const [tab, setTab]                   = useState('details');
  const [adminNotes, setAdminNotes]     = useState('');
  const [moreInfoText, setMoreInfoText] = useState('');
  const [showMoreInfo, setShowMoreInfo] = useState(false);

  const filtered = bookings.filter(b => {
    if (statusFilter !== 'all' && b.status !== statusFilter) return false;
    if (typeFilter   !== 'all' && b.booking_type !== typeFilter) return false;
    if (dateFrom && b.event_date < dateFrom) return false;
    if (dateTo   && b.event_date > dateTo)   return false;
    return true;
  });

  const updateStatus = async (id, status, extra = {}) => {
    await base44.entities.BookingRequest.update(id, { status, ...extra });
    qc.invalidateQueries(['admin-bookings']);
    setSelected(b => b ? { ...b, status, ...extra } : null);
    setShowMoreInfo(false);
  };

  const saveNotes = async () => {
    if (!selected) return;
    await base44.entities.BookingRequest.update(selected.id, { admin_notes: adminNotes });
    qc.invalidateQueries(['admin-bookings']);
  };

  const openDetail = (b) => { setSelected(b); setTab('details'); setAdminNotes(b.admin_notes || ''); setShowMoreInfo(false); };

  const barFee   = selected?.bar_service_addon ? 150 + (selected.bar_liquor_source === 'we_provide' ? (parseFloat(selected.bar_estimated_sales) || 0) * 0.15 : 0) : 0;
  const setupFee = { full_setup_teardown: 200, setup_only: 100, teardown_only: 100, self_service: 0 }[selected?.setup_teardown] || 0;

  return (
    <div className="space-y-5">
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
        <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} className="border border-gray-200 rounded-lg px-3 py-2 text-sm" />
        <input type="date" value={dateTo}   onChange={e => setDateTo(e.target.value)}   className="border border-gray-200 rounded-lg px-3 py-2 text-sm" />
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
                  <td className="px-4 py-3 font-mono font-bold text-primary text-xs">{b.confirmation_code}</td>
                  <td className="px-4 py-3 text-gray-700">{b.contact_name}</td>
                  <td className="px-4 py-3 text-gray-400">{b.organization || '—'}</td>
                  <td className="px-4 py-3 text-gray-500">{b.event_date}</td>
                  <td className="px-4 py-3"><span className={`text-xs px-2 py-0.5 rounded-full ${TYPE_COLORS[b.booking_type] || ''}`}>{b.booking_type?.replace(/_/g,' ')}</span></td>
                  <td className="px-4 py-3 text-gray-400 text-xs">{b.space || b.event_location || '—'}</td>
                  <td className="px-4 py-3 text-gray-500">{b.guest_count || '—'}</td>
                  <td className="px-4 py-3"><span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLORS[b.status] || ''}`}>{b.status?.replace(/_/g,' ')}</span></td>
                  <td className="px-4 py-3 text-gray-700">{b.estimated_total > 0 ? `$${b.estimated_total.toFixed(2)}` : '—'}</td>
                  <td className="px-4 py-3"><button onClick={() => openDetail(b)} className="text-xs bg-primary text-primary-foreground px-3 py-1 rounded-full hover:opacity-90">View</button></td>
                </tr>
              ))}
              {filtered.length === 0 && <tr><td colSpan={10} className="text-center py-10 text-gray-400">No bookings found.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>

      <Dialog open={!!selected} onOpenChange={() => setSelected(null)}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Booking — {selected?.confirmation_code}</DialogTitle></DialogHeader>
          {selected && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 flex-wrap">
                <span className={`text-xs px-3 py-1 rounded-full font-semibold ${STATUS_COLORS[selected.status] || ''}`}>{selected.status?.replace(/_/g,' ')}</span>
                <span className={`text-xs px-3 py-1 rounded-full ${TYPE_COLORS[selected.booking_type] || ''}`}>{selected.booking_type?.replace(/_/g,' ')}</span>
              </div>
              <div className="flex gap-2 border-b border-gray-100 pb-2">
                {['details','catering','services','financial','admin'].map(t => (
                  <button key={t} onClick={() => setTab(t)} className={`text-sm px-3 py-1 rounded-lg capitalize font-medium transition-colors ${tab === t ? 'bg-primary text-primary-foreground' : 'text-gray-500 hover:text-gray-700'}`}>{t}</button>
                ))}
              </div>
              {tab === 'details' && (
                <div className="space-y-1">
                  <Row label="Contact"      value={selected.contact_name} />
                  <Row label="Email"        value={selected.contact_email} />
                  <Row label="Phone"        value={selected.contact_phone} />
                  <Row label="Organization" value={selected.organization} />
                  <Row label="Description"  value={selected.event_description} />
                  <Row label="Event Date"   value={selected.event_date} />
                  <Row label="Time"         value={`${selected.start_time} – ${selected.end_time}`} />
                  <Row label="Guests"       value={selected.guest_count?.toString()} />
                  <Row label="Location"     value={selected.event_location} />
                  <Row label="Space"        value={selected.space} />
                  {selected.is_recurring && <Row label="Recurring" value={`${selected.recurrence_pattern} until ${selected.recurrence_end_date}`} />}
                </div>
              )}
              {tab === 'catering' && (
                <div className="space-y-1">
                  <Row label="Catering Required" value={selected.catering_required} />
                  <Row label="Style"              value={selected.catering_style} />
                  <Row label="Service Level"      value={selected.catering_service_level?.replace(/_/g,' ')} />
                  {(selected.catering_selections || []).length > 0 && (
                    <table className="w-full text-sm mt-2">
                      <thead className="text-xs text-gray-400 border-b"><tr><th className="text-left py-1">Item</th><th className="text-left py-1">Qty</th><th className="text-left py-1">Price</th></tr></thead>
                      <tbody>{selected.catering_selections.map((s, i) => <tr key={i}><td>{s.item_name}</td><td>{s.quantity}</td><td>${(s.unit_price * s.quantity).toFixed(2)}</td></tr>)}</tbody>
                    </table>
                  )}
                  <Row label="Bar Service"     value={selected.bar_service_addon ? `${selected.bar_service_type?.replace(/_/g,' ')} — ${selected.bar_liquor_source?.replace(/_/g,' ')}` : 'No'} />
                  {selected.catering_custom_request && <Row label="Custom Request" value={selected.catering_custom_request} />}
                </div>
              )}
              {tab === 'services' && (
                <div className="space-y-1">
                  <Row label="Staffing"       value={selected.staffing_required ? `${selected.staffing_count} staff` : 'No'} />
                  <Row label="Setup/Teardown" value={selected.setup_teardown?.replace(/_/g,' ')} />
                  {(selected.equipment_rentals || []).map((e, i) => (
                    <Row key={i} label={e.item_name} value={`×${e.quantity} — $${(e.unit_price * e.quantity).toFixed(2)}`} />
                  ))}
                </div>
              )}
              {tab === 'financial' && (
                <div className="space-y-1.5 bg-gray-50 p-4 rounded-xl">
                  {selected.space_rental_total   > 0 && <Row label="Space Rental"  value={`$${selected.space_rental_total.toFixed(2)}`} />}
                  {selected.catering_estimate     > 0 && <Row label="Catering"      value={`$${selected.catering_estimate.toFixed(2)}`} />}
                  {selected.catering_gratuity     > 0 && <Row label="Gratuity (15%)" value={`$${selected.catering_gratuity.toFixed(2)}`} />}
                  {barFee   > 0 && <Row label="Bar Service"   value={`$${barFee.toFixed(2)}`} />}
                  {selected.staffing_fee          > 0 && <Row label="Staffing"      value={`$${selected.staffing_fee.toFixed(2)}`} />}
                  {setupFee > 0 && <Row label="Setup/Teardown" value={`$${setupFee.toFixed(2)}`} />}
                  {selected.equipment_rental_total > 0 && <Row label="Equipment"   value={`$${selected.equipment_rental_total.toFixed(2)}`} />}
                  <div className="border-t pt-2 mt-2 flex justify-between font-bold text-primary"><span>Grand Total Estimate</span><span>${(selected.estimated_total || 0).toFixed(2)}</span></div>
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
                      {['pending','more_info_requested'].includes(selected.status) && <>
                        <button onClick={() => updateStatus(selected.id, 'confirmed')} className="bg-green-500 text-white text-sm px-4 py-2 rounded-lg hover:bg-green-600">Approve</button>
                        <button onClick={() => updateStatus(selected.id, 'denied')}    className="bg-red-500 text-white text-sm px-4 py-2 rounded-lg hover:bg-red-600">Deny</button>
                        {selected.status === 'pending' && <button onClick={() => setShowMoreInfo(true)} className="bg-orange-400 text-white text-sm px-4 py-2 rounded-lg hover:bg-orange-500">Request More Info</button>}
                      </>}
                      {selected.status === 'confirmed' && <>
                        <button onClick={() => updateStatus(selected.id, 'completed')} className="bg-blue-500 text-white text-sm px-4 py-2 rounded-lg hover:bg-blue-600">Mark Complete</button>
                        <button onClick={() => updateStatus(selected.id, 'cancelled')} className="bg-gray-400 text-white text-sm px-4 py-2 rounded-lg hover:bg-gray-500">Cancel</button>
                      </>}
                    </div>
                    {showMoreInfo && (
                      <div className="mt-2">
                        <textarea rows={3} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" value={moreInfoText} onChange={e => setMoreInfoText(e.target.value)} placeholder="Describe what additional info you need..." />
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

// ─── Calendar tab ─────────────────────────────────────────────────────────────
function TabCalendar({ bookings }) {
  const [date, setDate]       = useState(new Date());
  const [popover, setPopover] = useState(null);
  const year = date.getFullYear();
  const month = date.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const DAYS = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
  const getDay = (day) => {
    const ds = `${year}-${String(month+1).padStart(2,'0')}-${String(day).padStart(2,'0')}`;
    return bookings.filter(b => b.event_date === ds);
  };
  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-gray-800">Booking Calendar</h2>
        <div className="flex items-center gap-3">
          <button onClick={() => setDate(new Date(year, month - 1))} className="p-2 rounded-lg hover:bg-gray-100"><ChevronLeft className="w-4 h-4" /></button>
          <span className="font-semibold text-gray-700 min-w-[140px] text-center">{MONTHS_LONG[month]} {year}</span>
          <button onClick={() => setDate(new Date(year, month + 1))} className="p-2 rounded-lg hover:bg-gray-100"><ChevronRight className="w-4 h-4" /></button>
        </div>
      </div>
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        <div className="grid grid-cols-7 border-b border-gray-100">
          {DAYS.map(d => <div key={d} className="px-2 py-3 text-xs font-semibold text-gray-400 text-center">{d}</div>)}
        </div>
        <div className="grid grid-cols-7">
          {Array(firstDay).fill(null).map((_, i) => <div key={`e-${i}`} className="h-24 border-b border-r border-gray-50" />)}
          {Array(daysInMonth).fill(null).map((_, i) => {
            const day = i + 1;
            const dayBookings = getDay(day);
            const today = new Date();
            const isToday = today.getFullYear() === year && today.getMonth() === month && today.getDate() === day;
            return (
              <div key={day} className="min-h-24 border-b border-r border-gray-50 p-1.5">
                <span className={`text-xs font-semibold w-6 h-6 flex items-center justify-center rounded-full mb-1 ${isToday ? 'bg-primary text-primary-foreground' : 'text-gray-600'}`}>{day}</span>
                <div className="space-y-0.5">
                  {dayBookings.slice(0,3).map(b => (
                    <button key={b.id} onClick={() => setPopover(popover?.id === b.id ? null : b)}
                      className={`w-full text-left text-xs px-1.5 py-0.5 rounded font-medium truncate ${b.booking_type === 'external_event' ? 'bg-amber-100 text-amber-800' : 'bg-teal-100 text-teal-800'}`}>
                      {b.contact_name}
                    </button>
                  ))}
                  {dayBookings.length > 3 && <p className="text-xs text-gray-400 pl-1">+{dayBookings.length - 3} more</p>}
                </div>
              </div>
            );
          })}
        </div>
      </div>
      {popover && (
        <div className="fixed inset-0 bg-black/30 z-50 flex items-center justify-center" onClick={() => setPopover(null)}>
          <div className="bg-white rounded-2xl shadow-xl p-6 max-w-sm w-full mx-4" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-lg">{popover.contact_name}</h3>
              <button onClick={() => setPopover(null)} className="text-gray-400 hover:text-gray-600 text-xl">×</button>
            </div>
            <div className="space-y-1.5 text-sm">
              <p><span className="text-gray-400">Date:</span> <span className="font-medium">{popover.event_date}</span></p>
              <p><span className="text-gray-400">Time:</span> <span className="font-medium">{popover.start_time} – {popover.end_time}</span></p>
              <p><span className="text-gray-400">Type:</span> <span className="font-medium capitalize">{popover.booking_type?.replace(/_/g,' ')}</span></p>
              {popover.space          && <p><span className="text-gray-400">Space:</span> <span className="font-medium capitalize">{popover.space?.replace(/_/g,' ')}</span></p>}
              {popover.event_location && <p><span className="text-gray-400">Location:</span> <span className="font-medium">{popover.event_location}</span></p>}
              <p className="flex items-center gap-2"><span className="text-gray-400">Status:</span> <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${STATUS_COLORS[popover.status] || ''}`}>{popover.status?.replace(/_/g,' ')}</span></p>
              {popover.estimated_total > 0 && <p><span className="text-gray-400">Total:</span> <span className="font-bold text-primary">${popover.estimated_total.toFixed(2)}</span></p>}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Menus tab ────────────────────────────────────────────────────────────────
const MENU_CATS = ['appetizers','entrees','sides','desserts','beverages','platters'];
const MENU_EMPTY = { name:'', description:'', style:'buffet', category:'entrees', price_per_person:'', price_per_unit:'', dietary_tags:'', is_active:true };
const inputCls = "w-full border border-gray-200 rounded-lg px-3 py-2 text-sm";

function TabMenus() {
  const qc = useQueryClient();
  const [dialog, setDialog]       = useState(false);
  const [form, setForm]           = useState(MENU_EMPTY);
  const [editing, setEditing]     = useState(null);
  const [styleFilter, setStyleFilter] = useState('all');
  const [catFilter, setCatFilter]     = useState('all');
  const { data: items = [] } = useQuery({ queryKey: ['admin-menu-items'], queryFn: () => base44.entities.CateringMenuItem.list() });
  const save   = useMutation({ mutationFn: () => { const data = { ...form, dietary_tags: form.dietary_tags ? form.dietary_tags.split(',').map(t => t.trim()).filter(Boolean) : [], price_per_person: parseFloat(form.price_per_person) || undefined, price_per_unit: parseFloat(form.price_per_unit) || undefined }; return editing ? base44.entities.CateringMenuItem.update(editing, data) : base44.entities.CateringMenuItem.create(data); }, onSuccess: () => { qc.invalidateQueries(['admin-menu-items']); setDialog(false); setForm(MENU_EMPTY); setEditing(null); } });
  const del    = useMutation({ mutationFn: id => base44.entities.CateringMenuItem.delete(id), onSuccess: () => qc.invalidateQueries(['admin-menu-items']) });
  const toggle = useMutation({ mutationFn: ({ id, v }) => base44.entities.CateringMenuItem.update(id, { is_active: v }), onSuccess: () => qc.invalidateQueries(['admin-menu-items']) });
  const openEdit = item => { setEditing(item.id); setForm({ ...item, dietary_tags: (item.dietary_tags || []).join(', '), price_per_person: item.price_per_person?.toString() || '', price_per_unit: item.price_per_unit?.toString() || '' }); setDialog(true); };
  const filtered = items.filter(i => (styleFilter === 'all' || i.style === styleFilter) && (catFilter === 'all' || i.category === catFilter));
  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-gray-800">Catering Menu Items</h2>
        <button onClick={() => { setEditing(null); setForm(MENU_EMPTY); setDialog(true); }} className="flex items-center gap-2 bg-primary text-primary-foreground text-sm font-semibold px-4 py-2 rounded-xl hover:opacity-90"><Plus className="w-4 h-4" /> Add Item</button>
      </div>
      <div className="flex gap-3 flex-wrap">
        <select value={styleFilter} onChange={e => setStyleFilter(e.target.value)} className="border border-gray-200 rounded-lg px-3 py-2 text-sm"><option value="all">All Styles</option><option value="buffet">Buffet</option><option value="plated">Plated</option></select>
        <select value={catFilter}   onChange={e => setCatFilter(e.target.value)}   className="border border-gray-200 rounded-lg px-3 py-2 text-sm"><option value="all">All Categories</option>{MENU_CATS.map(c => <option key={c} value={c}>{c}</option>)}</select>
      </div>
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-xs text-gray-400 uppercase tracking-wide"><tr>{['Name','Style','Category','$/person','$/unit','Tags','Active',''].map(h => <th key={h} className="px-4 py-3 text-left">{h}</th>)}</tr></thead>
          <tbody className="divide-y divide-gray-50">
            {filtered.map(item => (
              <tr key={item.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 font-medium">{item.name}</td>
                <td className="px-4 py-3"><span className={`text-xs px-2 py-0.5 rounded-full ${item.style === 'plated' ? 'bg-purple-100 text-purple-600' : 'bg-green-100 text-green-600'}`}>{item.style}</span></td>
                <td className="px-4 py-3 capitalize text-gray-500">{item.category}</td>
                <td className="px-4 py-3">{item.price_per_person ? `$${item.price_per_person}` : '—'}</td>
                <td className="px-4 py-3">{item.price_per_unit   ? `$${item.price_per_unit}`   : '—'}</td>
                <td className="px-4 py-3 text-xs text-gray-400">{(item.dietary_tags || []).join(', ') || '—'}</td>
                <td className="px-4 py-3"><input type="checkbox" checked={item.is_active} onChange={e => toggle.mutate({ id: item.id, v: e.target.checked })} /></td>
                <td className="px-4 py-3 flex gap-2"><button onClick={() => openEdit(item)} className="text-xs text-primary hover:underline">Edit</button><button onClick={() => { if(confirm(`Delete "${item.name}"?`)) del.mutate(item.id); }} className="text-xs text-red-400 hover:underline">Delete</button></td>
              </tr>
            ))}
            {filtered.length === 0 && <tr><td colSpan={8} className="text-center py-8 text-gray-400">No items found.</td></tr>}
          </tbody>
        </table>
      </div>
      <Dialog open={dialog} onOpenChange={setDialog}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editing ? 'Edit' : 'Add'} Menu Item</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><label className="text-xs font-medium text-gray-500">Name</label><input className={inputCls} value={form.name} onChange={e => setForm(f => ({...f, name: e.target.value}))} /></div>
            <div><label className="text-xs font-medium text-gray-500">Description</label><textarea rows={2} className={inputCls} value={form.description} onChange={e => setForm(f => ({...f, description: e.target.value}))} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className="text-xs font-medium text-gray-500">Style</label><select className={inputCls} value={form.style} onChange={e => setForm(f => ({...f, style: e.target.value}))}><option value="buffet">Buffet</option><option value="plated">Plated</option></select></div>
              <div><label className="text-xs font-medium text-gray-500">Category</label><select className={inputCls} value={form.category} onChange={e => setForm(f => ({...f, category: e.target.value}))}>{MENU_CATS.map(c => <option key={c} value={c}>{c}</option>)}</select></div>
              <div><label className="text-xs font-medium text-gray-500">Price/Person ($)</label><input type="number" className={inputCls} value={form.price_per_person} onChange={e => setForm(f => ({...f, price_per_person: e.target.value}))} /></div>
              <div><label className="text-xs font-medium text-gray-500">Price/Unit ($)</label><input type="number" className={inputCls} value={form.price_per_unit} onChange={e => setForm(f => ({...f, price_per_unit: e.target.value}))} /></div>
            </div>
            <div><label className="text-xs font-medium text-gray-500">Dietary Tags (comma-separated)</label><input className={inputCls} value={form.dietary_tags} onChange={e => setForm(f => ({...f, dietary_tags: e.target.value}))} placeholder="vegan, gluten-free" /></div>
            <div className="flex items-center gap-2"><input type="checkbox" checked={form.is_active} onChange={e => setForm(f => ({...f, is_active: e.target.checked}))} /><label className="text-sm">Active</label></div>
            <div className="flex justify-end gap-2 pt-2">
              <button onClick={() => setDialog(false)} className="border border-gray-200 px-4 py-2 rounded-lg text-sm">Cancel</button>
              <button onClick={() => save.mutate()} disabled={!form.name || save.isPending} className="bg-primary text-primary-foreground px-5 py-2 rounded-lg text-sm hover:opacity-90 disabled:opacity-50">{save.isPending ? 'Saving...' : 'Save'}</button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ─── Equipment tab ────────────────────────────────────────────────────────────
const EQ_CATS  = ['serving_equipment','linens','furniture','audio_visual','kitchen','other'];
const EQ_EMPTY = { name:'', description:'', category:'serving_equipment', quantity_available:'', price_per_unit:'', price_per_day:'', is_active:true };

function TabEquipment() {
  const qc = useQueryClient();
  const [dialog, setDialog]   = useState(false);
  const [form, setForm]       = useState(EQ_EMPTY);
  const [editing, setEditing] = useState(null);
  const [catFilter, setCatFilter] = useState('all');
  const { data: items = [] } = useQuery({ queryKey: ['admin-equipment'], queryFn: () => base44.entities.RentalEquipment.list() });
  const save   = useMutation({ mutationFn: () => { const data = { ...form, quantity_available: parseInt(form.quantity_available) || 0, price_per_unit: parseFloat(form.price_per_unit) || 0, price_per_day: parseFloat(form.price_per_day) || 0 }; return editing ? base44.entities.RentalEquipment.update(editing, data) : base44.entities.RentalEquipment.create(data); }, onSuccess: () => { qc.invalidateQueries(['admin-equipment']); setDialog(false); setForm(EQ_EMPTY); setEditing(null); } });
  const del    = useMutation({ mutationFn: id => base44.entities.RentalEquipment.delete(id), onSuccess: () => qc.invalidateQueries(['admin-equipment']) });
  const toggle = useMutation({ mutationFn: ({ id, v }) => base44.entities.RentalEquipment.update(id, { is_active: v }), onSuccess: () => qc.invalidateQueries(['admin-equipment']) });
  const openEdit = item => { setEditing(item.id); setForm({ ...item, quantity_available: item.quantity_available?.toString(), price_per_unit: item.price_per_unit?.toString(), price_per_day: item.price_per_day?.toString() }); setDialog(true); };
  const filtered = items.filter(i => catFilter === 'all' || i.category === catFilter);
  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-gray-800">Rental Equipment</h2>
        <button onClick={() => { setEditing(null); setForm(EQ_EMPTY); setDialog(true); }} className="flex items-center gap-2 bg-primary text-primary-foreground text-sm font-semibold px-4 py-2 rounded-xl hover:opacity-90"><Plus className="w-4 h-4" /> Add Equipment</button>
      </div>
      <select value={catFilter} onChange={e => setCatFilter(e.target.value)} className="border border-gray-200 rounded-lg px-3 py-2 text-sm"><option value="all">All Categories</option>{EQ_CATS.map(c => <option key={c} value={c}>{c.replace(/_/g,' ')}</option>)}</select>
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-xs text-gray-400 uppercase tracking-wide"><tr>{['Name','Category','Qty','$/Unit','$/Day','Active',''].map(h => <th key={h} className="px-4 py-3 text-left">{h}</th>)}</tr></thead>
          <tbody className="divide-y divide-gray-50">
            {filtered.map(item => (
              <tr key={item.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 font-medium">{item.name}</td>
                <td className="px-4 py-3 text-gray-400 capitalize text-xs">{item.category?.replace(/_/g,' ')}</td>
                <td className="px-4 py-3">{item.quantity_available}</td>
                <td className="px-4 py-3">${item.price_per_unit}</td>
                <td className="px-4 py-3">${item.price_per_day}</td>
                <td className="px-4 py-3"><input type="checkbox" checked={item.is_active} onChange={e => toggle.mutate({ id: item.id, v: e.target.checked })} /></td>
                <td className="px-4 py-3 flex gap-2"><button onClick={() => openEdit(item)} className="text-xs text-primary hover:underline">Edit</button><button onClick={() => { if(confirm(`Delete "${item.name}"?`)) del.mutate(item.id); }} className="text-xs text-red-400 hover:underline">Delete</button></td>
              </tr>
            ))}
            {filtered.length === 0 && <tr><td colSpan={7} className="text-center py-8 text-gray-400">No equipment found.</td></tr>}
          </tbody>
        </table>
      </div>
      <Dialog open={dialog} onOpenChange={setDialog}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editing ? 'Edit' : 'Add'} Equipment</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><label className="text-xs font-medium text-gray-500">Name</label><input className={inputCls} value={form.name} onChange={e => setForm(f => ({...f, name: e.target.value}))} /></div>
            <div><label className="text-xs font-medium text-gray-500">Description</label><textarea rows={2} className={inputCls} value={form.description} onChange={e => setForm(f => ({...f, description: e.target.value}))} /></div>
            <div><label className="text-xs font-medium text-gray-500">Category</label><select className={inputCls} value={form.category} onChange={e => setForm(f => ({...f, category: e.target.value}))}>{EQ_CATS.map(c => <option key={c} value={c}>{c.replace(/_/g,' ')}</option>)}</select></div>
            <div className="grid grid-cols-3 gap-3">
              <div><label className="text-xs font-medium text-gray-500">Qty</label><input type="number" className={inputCls} value={form.quantity_available} onChange={e => setForm(f => ({...f, quantity_available: e.target.value}))} /></div>
              <div><label className="text-xs font-medium text-gray-500">$/Unit</label><input type="number" className={inputCls} value={form.price_per_unit} onChange={e => setForm(f => ({...f, price_per_unit: e.target.value}))} /></div>
              <div><label className="text-xs font-medium text-gray-500">$/Day</label><input type="number" className={inputCls} value={form.price_per_day} onChange={e => setForm(f => ({...f, price_per_day: e.target.value}))} /></div>
            </div>
            <div className="flex items-center gap-2"><input type="checkbox" checked={form.is_active} onChange={e => setForm(f => ({...f, is_active: e.target.checked}))} /><label className="text-sm">Active</label></div>
            <div className="flex justify-end gap-2 pt-2">
              <button onClick={() => setDialog(false)} className="border border-gray-200 px-4 py-2 rounded-lg text-sm">Cancel</button>
              <button onClick={() => save.mutate()} disabled={!form.name || save.isPending} className="bg-primary text-primary-foreground px-5 py-2 rounded-lg text-sm hover:opacity-90 disabled:opacity-50">{save.isPending ? 'Saving...' : 'Save'}</button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ─── Analytics tab ────────────────────────────────────────────────────────────
function TabAnalytics({ bookings }) {
  const [timeFilter, setTimeFilter] = useState('ytd');
  const now = new Date();
  const ytdStart = `${now.getFullYear()}-01-01`;
  const filtered  = timeFilter === 'ytd' ? bookings.filter(b => b.created_date >= ytdStart) : bookings;
  const confirmed = filtered.filter(b => ['confirmed','completed'].includes(b.status));
  const totalRevenue = confirmed.reduce((s, b) => s + (b.estimated_total || 0), 0);
  const avgValue     = confirmed.length > 0 ? totalRevenue / confirmed.length : 0;
  const monthly = Array(12).fill(0).map((_, i) => { const d = new Date(now.getFullYear(), now.getMonth() - 11 + i); const key = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`; return { name: MONTHS_SHORT[d.getMonth()], count: filtered.filter(b => b.created_date?.startsWith(key)).length }; });
  const typePie  = [{ name: 'External Event', value: filtered.filter(b => b.booking_type === 'external_event').length }, { name: 'In-House Event', value: filtered.filter(b => b.booking_type === 'inhouse_event').length }].filter(d => d.value > 0);
  const styleBar = [{ name: 'Buffet', count: filtered.filter(b => b.catering_style === 'buffet').length }, { name: 'Plated', count: filtered.filter(b => b.catering_style === 'plated').length }, { name: 'None', count: filtered.filter(b => b.catering_required !== 'yes').length }];
  const statuses = ['pending','confirmed','completed','denied','cancelled','more_info_requested'];
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-gray-800">Analytics</h2>
        <div className="flex gap-2">{[['ytd','Year to Date'],['all','All Time']].map(([v,l]) => <button key={v} onClick={() => setTimeFilter(v)} className={`text-sm px-4 py-2 rounded-full border transition-colors ${timeFilter === v ? 'bg-primary text-primary-foreground border-primary' : 'border-gray-200 text-gray-500 hover:border-primary'}`}>{l}</button>)}</div>
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[{ label: 'Total Bookings', value: filtered.length }, { label: 'Confirmed + Completed', value: confirmed.length }, { label: 'Total Revenue', value: `$${totalRevenue.toFixed(0)}` }, { label: 'Avg Booking Value', value: `$${avgValue.toFixed(0)}` }].map(({ label, value }) => (
          <div key={label} className="bg-white border border-gray-200 rounded-xl p-5"><p className="text-xs text-gray-400 uppercase tracking-wide mb-1">{label}</p><p className="text-2xl font-bold text-gray-800">{value}</p></div>
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white border border-gray-200 rounded-xl p-5"><h3 className="font-semibold text-gray-700 mb-4">Bookings Per Month</h3><ResponsiveContainer width="100%" height={200}><BarChart data={monthly}><XAxis dataKey="name" tick={{fontSize:11}} /><YAxis allowDecimals={false} tick={{fontSize:11}} /><Tooltip /><Bar dataKey="count" fill="#2d6a4f" radius={[4,4,0,0]} /></BarChart></ResponsiveContainer></div>
        <div className="bg-white border border-gray-200 rounded-xl p-5"><h3 className="font-semibold text-gray-700 mb-4">Event Type Breakdown</h3><ResponsiveContainer width="100%" height={200}><PieChart><Pie data={typePie} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label={({ name, percent }) => `${name} ${(percent*100).toFixed(0)}%`}>{typePie.map((_, i) => <Cell key={i} fill={CHART_COLORS[i]} />)}</Pie><Tooltip /><Legend /></PieChart></ResponsiveContainer></div>
        <div className="bg-white border border-gray-200 rounded-xl p-5 lg:col-span-2"><h3 className="font-semibold text-gray-700 mb-4">Catering Style Breakdown</h3><ResponsiveContainer width="100%" height={160}><BarChart data={styleBar} layout="vertical"><XAxis type="number" allowDecimals={false} tick={{fontSize:11}} /><YAxis dataKey="name" type="category" tick={{fontSize:11}} /><Tooltip /><Bar dataKey="count" fill="#f4a261" radius={[0,4,4,0]} /></BarChart></ResponsiveContainer></div>
      </div>
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100"><h3 className="font-bold text-gray-700">Bookings by Status</h3></div>
        <table className="w-full text-sm"><thead className="text-xs text-gray-400 bg-gray-50"><tr>{['Status','Count','Revenue Estimate'].map(h => <th key={h} className="px-4 py-3 text-left">{h}</th>)}</tr></thead>
          <tbody className="divide-y divide-gray-50">{statuses.map(s => { const rows = filtered.filter(b => b.status === s); return <tr key={s} className="hover:bg-gray-50"><td className="px-4 py-3 capitalize">{s.replace(/_/g,' ')}</td><td className="px-4 py-3">{rows.length}</td><td className="px-4 py-3">{rows.reduce((sum,b) => sum+(b.estimated_total||0),0) > 0 ? `$${rows.reduce((sum,b) => sum+(b.estimated_total||0),0).toFixed(0)}` : '—'}</td></tr>; })}</tbody>
        </table>
      </div>
    </div>
  );
}

// ─── Financials tab ────────────────────────────────────────────────────────────
function TabFinancials({ bookings }) {
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo,   setDateTo]   = useState('');
  const filtered = bookings.filter(b => { if (!['confirmed','completed'].includes(b.status)) return false; if (dateFrom && b.event_date < dateFrom) return false; if (dateTo && b.event_date > dateTo) return false; return true; });
  const totals = filtered.reduce((acc, b) => { const barFee = b.bar_service_addon ? 150 + (b.bar_liquor_source === 'we_provide' ? (b.bar_estimated_sales || 0)*0.15 : 0) : 0; const setupFee = { full_setup_teardown:200, setup_only:100, teardown_only:100, self_service:0 }[b.setup_teardown] || 0; acc.catering += b.catering_estimate||0; acc.gratuity += b.catering_gratuity||0; acc.bar += barFee; acc.staffing += b.staffing_fee||0; acc.equipment += b.equipment_rental_total||0; acc.space += b.space_rental_total||0; acc.grand += b.estimated_total||0; return acc; }, { catering:0, gratuity:0, bar:0, staffing:0, equipment:0, space:0, grand:0 });
  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-gray-800">Financials</h2>
        <button onClick={() => window.print()} className="flex items-center gap-2 bg-primary text-primary-foreground text-sm font-semibold px-4 py-2 rounded-xl hover:opacity-90 no-print"><Printer className="w-4 h-4" /> Export / Print</button>
      </div>
      <div className="flex gap-3 items-center no-print">
        <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} className="border border-gray-200 rounded-lg px-3 py-2 text-sm" />
        <span className="text-gray-400">to</span>
        <input type="date" value={dateTo}   onChange={e => setDateTo(e.target.value)}   className="border border-gray-200 rounded-lg px-3 py-2 text-sm" />
      </div>
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead className="bg-gray-50 text-gray-400 uppercase tracking-wide"><tr>{['Code','Contact','Event Date','Type','Catering','Gratuity','Bar','Staffing','Equipment','Space','Grand Total'].map(h => <th key={h} className="px-3 py-3 text-left">{h}</th>)}</tr></thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.map(b => { const barFee = b.bar_service_addon ? 150+(b.bar_liquor_source==='we_provide'?(b.bar_estimated_sales||0)*0.15:0):0; return (
                <tr key={b.id} className="hover:bg-gray-50">
                  <td className="px-3 py-2 font-mono font-bold text-primary">{b.confirmation_code}</td>
                  <td className="px-3 py-2">{b.contact_name}</td>
                  <td className="px-3 py-2 text-gray-500">{b.event_date}</td>
                  <td className="px-3 py-2 capitalize text-gray-400">{b.booking_type?.replace(/_/g,' ')}</td>
                  <td className="px-3 py-2">{b.catering_estimate > 0 ? `$${b.catering_estimate.toFixed(2)}` : '—'}</td>
                  <td className="px-3 py-2">{b.catering_gratuity > 0 ? `$${b.catering_gratuity.toFixed(2)}` : '—'}</td>
                  <td className="px-3 py-2">{barFee > 0 ? `$${barFee.toFixed(2)}` : '—'}</td>
                  <td className="px-3 py-2">{b.staffing_fee > 0 ? `$${b.staffing_fee.toFixed(2)}` : '—'}</td>
                  <td className="px-3 py-2">{b.equipment_rental_total > 0 ? `$${b.equipment_rental_total.toFixed(2)}` : '—'}</td>
                  <td className="px-3 py-2">{b.space_rental_total > 0 ? `$${b.space_rental_total.toFixed(2)}` : '—'}</td>
                  <td className="px-3 py-2 font-bold text-primary">{b.estimated_total > 0 ? `$${b.estimated_total.toFixed(2)}` : '—'}</td>
                </tr>
              ); })}
              {filtered.length > 0 && (
                <tr className="bg-primary/10 font-bold text-xs">
                  <td className="px-3 py-3" colSpan={4}>TOTALS ({filtered.length} bookings)</td>
                  <td className="px-3 py-3">${totals.catering.toFixed(2)}</td>
                  <td className="px-3 py-3">${totals.gratuity.toFixed(2)}</td>
                  <td className="px-3 py-3">${totals.bar.toFixed(2)}</td>
                  <td className="px-3 py-3">${totals.staffing.toFixed(2)}</td>
                  <td className="px-3 py-3">${totals.equipment.toFixed(2)}</td>
                  <td className="px-3 py-3">${totals.space.toFixed(2)}</td>
                  <td className="px-3 py-3 text-primary">${totals.grand.toFixed(2)}</td>
                </tr>
              )}
              {filtered.length === 0 && <tr><td colSpan={11} className="text-center py-8 text-gray-400">No confirmed/completed bookings found.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ─── Main FoodCatering page ───────────────────────────────────────────────────
const TABS = [
  { key: 'dashboard',  label: 'Dashboard'  },
  { key: 'bookings',   label: 'Bookings'   },
  { key: 'calendar',   label: 'Calendar'   },
  { key: 'menus',      label: 'Menus'      },
  { key: 'equipment',  label: 'Equipment'  },
  { key: 'analytics',  label: 'Analytics'  },
  { key: 'financials', label: 'Financials' },
];

export default function FoodCatering() {
  const [activeTab, setActiveTab] = useState('dashboard');

  const { data: raw = [], isLoading } = useQuery({
    queryKey: ['admin-bookings'],
    queryFn: () => base44.entities.BookingRequest.list('-created_date'),
  });
  const bookings = normalizeBookings(raw);

  return (
    <div className="flex flex-col h-full">
      {/* Header ribbon with sub-tabs */}
      <div className="border-b bg-background px-6 pt-5 pb-0">
        <h1 className="text-xl font-bold mb-3">Catering & Events</h1>
        <div className="flex gap-1 overflow-x-auto">
          {TABS.map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              className={`px-4 py-2 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
                activeTab === key
                  ? 'border-primary text-foreground'
                  : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        {isLoading ? (
          <div className="flex justify-center py-16"><div className="w-8 h-8 border-4 border-border border-t-primary rounded-full animate-spin" /></div>
        ) : (
          <>
            {activeTab === 'dashboard'  && <TabDashboard  bookings={bookings} setActiveTab={setActiveTab} />}
            {activeTab === 'bookings'   && <TabBookings   bookings={bookings} />}
            {activeTab === 'calendar'   && <TabCalendar   bookings={bookings} />}
            {activeTab === 'menus'      && <TabMenus />}
            {activeTab === 'equipment'  && <TabEquipment />}
            {activeTab === 'analytics'  && <TabAnalytics  bookings={bookings} />}
            {activeTab === 'financials' && <TabFinancials bookings={bookings} />}
          </>
        )}
      </div>
    </div>
  );
}