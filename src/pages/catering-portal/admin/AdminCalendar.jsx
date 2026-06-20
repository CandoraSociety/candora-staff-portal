import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { normalizeBookings } from '@/lib/normalizeBooking';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const STATUS_COLORS = { pending: 'bg-yellow-100 text-yellow-700', confirmed: 'bg-green-100 text-green-700', denied: 'bg-red-100 text-red-600', cancelled: 'bg-gray-100 text-gray-500', completed: 'bg-blue-100 text-blue-700', more_info_requested: 'bg-orange-100 text-orange-700' };

export default function AdminCalendar() {
  const [date, setDate] = useState(new Date());
  const [popover, setPopover] = useState(null);

  const { data: raw = [] } = useQuery({ queryKey: ['admin-bookings'], queryFn: () => base44.entities.BookingRequest.list('-created_date') });
  const bookings = normalizeBookings(raw);

  const year = date.getFullYear();
  const month = date.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];
  const DAYS = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];

  const getBookingsForDay = (day) => {
    const dateStr = `${year}-${String(month+1).padStart(2,'0')}-${String(day).padStart(2,'0')}`;
    return bookings.filter(b => b.event_date === dateStr);
  };

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="font-heading text-2xl font-bold text-gray-800">Booking Calendar</h1>
        <div className="flex items-center gap-3">
          <button onClick={() => setDate(new Date(year, month - 1))} className="p-2 rounded-lg hover:bg-gray-100"><ChevronLeft className="w-4 h-4" /></button>
          <span className="font-semibold text-gray-700 min-w-[140px] text-center">{MONTHS[month]} {year}</span>
          <button onClick={() => setDate(new Date(year, month + 1))} className="p-2 rounded-lg hover:bg-gray-100"><ChevronRight className="w-4 h-4" /></button>
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        <div className="grid grid-cols-7 border-b border-gray-100">
          {DAYS.map(d => <div key={d} className="px-2 py-3 text-xs font-semibold text-gray-400 text-center">{d}</div>)}
        </div>
        <div className="grid grid-cols-7">
          {Array(firstDay).fill(null).map((_, i) => <div key={`empty-${i}`} className="h-24 border-b border-r border-gray-50" />)}
          {Array(daysInMonth).fill(null).map((_, i) => {
            const day = i + 1;
            const dayBookings = getBookingsForDay(day);
            const today = new Date();
            const isToday = today.getFullYear() === year && today.getMonth() === month && today.getDate() === day;
            return (
              <div key={day} className="min-h-24 border-b border-r border-gray-50 p-1.5 relative">
                <span className={`text-xs font-semibold w-6 h-6 flex items-center justify-center rounded-full mb-1 ${isToday ? 'bg-cp-primary text-white' : 'text-gray-600'}`}>{day}</span>
                <div className="space-y-0.5">
                  {dayBookings.slice(0, 3).map(b => (
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
              <h3 className="font-heading font-bold text-lg">{popover.contact_name}</h3>
              <button onClick={() => setPopover(null)} className="text-gray-400 hover:text-gray-600 text-xl">×</button>
            </div>
            <div className="space-y-1.5 text-sm">
              <p><span className="text-gray-400">Date:</span> <span className="font-medium">{popover.event_date}</span></p>
              <p><span className="text-gray-400">Time:</span> <span className="font-medium">{popover.start_time} – {popover.end_time}</span></p>
              <p><span className="text-gray-400">Type:</span> <span className="font-medium capitalize">{popover.booking_type?.replace(/_/g,' ')}</span></p>
              {popover.space && <p><span className="text-gray-400">Space:</span> <span className="font-medium capitalize">{popover.space?.replace(/_/g,' ')}</span></p>}
              {popover.event_location && <p><span className="text-gray-400">Location:</span> <span className="font-medium">{popover.event_location}</span></p>}
              <p className="flex items-center gap-2"><span className="text-gray-400">Status:</span> <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${STATUS_COLORS[popover.status] || ''}`}>{popover.status?.replace(/_/g,' ')}</span></p>
              {popover.estimated_total > 0 && <p><span className="text-gray-400">Total:</span> <span className="font-bold text-cp-primary">${popover.estimated_total.toFixed(2)}</span></p>}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}