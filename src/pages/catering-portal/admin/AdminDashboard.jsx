import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { normalizeBookings } from '@/lib/normalizeBooking';
import { Link } from 'react-router-dom';
import { ClipboardList, CalendarDays, UtensilsCrossed, Package, BarChart3, DollarSign, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';

const STATUS_COLORS = { pending: 'bg-yellow-100 text-yellow-700', confirmed: 'bg-green-100 text-green-700', denied: 'bg-red-100 text-red-600', cancelled: 'bg-gray-100 text-gray-500', completed: 'bg-blue-100 text-blue-700', more_info_requested: 'bg-orange-100 text-orange-700' };
const TYPE_COLORS = { external_event: 'bg-amber-100 text-amber-700', inhouse_event: 'bg-green-100 text-green-700' };

export default function AdminDashboard() {
  const { data: raw = [] } = useQuery({ queryKey: ['admin-bookings'], queryFn: () => base44.entities.BookingRequest.list('-created_date') });
  const bookings = normalizeBookings(raw);

  const now = new Date();
  const thisMonth = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}`;
  const pending = bookings.filter(b => b.status === 'pending').length;
  const moreInfo = bookings.filter(b => b.status === 'more_info_requested').length;
  const monthRevenue = bookings.filter(b => ['confirmed','completed'].includes(b.status) && b.event_date?.startsWith(thisMonth)).reduce((sum, b) => sum + (b.estimated_total || 0), 0);
  const recent = bookings.slice(0, 10);

  const QUICK = [
    { label: 'Bookings', icon: ClipboardList, path: '/catering-portal/admin/bookings' },
    { label: 'Calendar', icon: CalendarDays, path: '/catering-portal/admin/calendar' },
    { label: 'Menus', icon: UtensilsCrossed, path: '/catering-portal/admin/catering' },
    { label: 'Equipment', icon: Package, path: '/catering-portal/admin/equipment' },
    { label: 'Analytics', icon: BarChart3, path: '/catering-portal/admin/analytics' },
    { label: 'Financials', icon: DollarSign, path: '/catering-portal/admin/financials' },
  ];

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="font-heading text-3xl font-bold text-gray-800">Candora Admin</h1>
        <p className="text-gray-400 text-sm mt-1">{format(now, 'EEEE, MMMM d, yyyy')}</p>
      </div>

      {moreInfo > 0 && (
        <div className="flex items-center gap-3 bg-orange-50 border border-orange-200 rounded-xl p-4 text-orange-700">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span className="text-sm font-medium">{moreInfo} booking{moreInfo > 1 ? 's' : ''} require additional information from the client.</span>
          <Link to="/catering-portal/admin/bookings" className="ml-auto text-xs font-bold underline">View →</Link>
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
            <p className={`font-heading text-2xl font-bold ${color}`}>{value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
        {QUICK.map(({ label, icon: Icon, path }) => (
          <Link key={path} to={path} className="bg-white border border-gray-200 rounded-xl p-4 flex flex-col items-center gap-2 hover:border-cp-primary hover:shadow-sm transition-all">
            <Icon className="w-6 h-6 text-cp-primary" />
            <span className="text-xs font-medium text-gray-600">{label}</span>
          </Link>
        ))}
      </div>

      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="font-heading font-bold text-gray-800">Recent Bookings</h2>
          <Link to="/catering-portal/admin/bookings" className="text-xs text-cp-primary font-semibold hover:underline">View All</Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-xs text-gray-400 uppercase tracking-wide">
              <tr>{['Code','Contact','Event Date','Type','Status','Total'].map(h => <th key={h} className="px-4 py-3 text-left">{h}</th>)}</tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {recent.map(b => (
                <tr key={b.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-mono font-bold text-cp-primary">{b.confirmation_code}</td>
                  <td className="px-4 py-3 text-gray-700">{b.contact_name}</td>
                  <td className="px-4 py-3 text-gray-500">{b.event_date}</td>
                  <td className="px-4 py-3"><span className={`text-xs px-2 py-0.5 rounded-full font-medium ${TYPE_COLORS[b.booking_type] || 'bg-gray-100 text-gray-500'}`}>{b.booking_type?.replace(/_/g,' ')}</span></td>
                  <td className="px-4 py-3"><span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLORS[b.status] || 'bg-gray-100'}`}>{b.status?.replace(/_/g,' ')}</span></td>
                  <td className="px-4 py-3 text-gray-700">{b.estimated_total > 0 ? `$${b.estimated_total.toFixed(2)}` : '—'}</td>
                </tr>
              ))}
              {recent.length === 0 && (
                <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-400">No bookings yet.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}