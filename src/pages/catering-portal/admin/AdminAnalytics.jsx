import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { normalizeBookings } from '@/lib/normalizeBooking';
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts';

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const COLORS = ['#2d6a4f','#f4a261','#4a90d9','#e63946','#9b5de5','#2ec4b6'];

export default function AdminAnalytics() {
  const [timeFilter, setTimeFilter] = useState('ytd');
  const { data: raw = [] } = useQuery({ queryKey: ['admin-bookings'], queryFn: () => base44.entities.BookingRequest.list('-created_date') });
  const all = normalizeBookings(raw);

  const now = new Date();
  const ytdStart = `${now.getFullYear()}-01-01`;
  const bookings = timeFilter === 'ytd' ? all.filter(b => b.created_date >= ytdStart) : all;
  const confirmed = bookings.filter(b => ['confirmed','completed'].includes(b.status));

  const totalRevenue = confirmed.reduce((sum, b) => sum + (b.estimated_total || 0), 0);
  const avgValue = confirmed.length > 0 ? totalRevenue / confirmed.length : 0;

  // Monthly bookings (last 12 months)
  const monthly = Array(12).fill(0).map((_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - 11 + i);
    const key = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`;
    return { name: MONTHS[d.getMonth()], count: bookings.filter(b => b.created_date?.startsWith(key)).length };
  });

  // Type breakdown
  const typePie = [
    { name: 'External Event', value: bookings.filter(b => b.booking_type === 'external_event').length },
    { name: 'In-House Event', value: bookings.filter(b => b.booking_type === 'inhouse_event').length },
  ].filter(d => d.value > 0);

  // Catering style breakdown
  const styleBar = [
    { name: 'Buffet', count: bookings.filter(b => b.catering_style === 'buffet').length },
    { name: 'Plated', count: bookings.filter(b => b.catering_style === 'plated').length },
    { name: 'None', count: bookings.filter(b => b.catering_required !== 'yes').length },
  ];

  // Status table
  const statuses = ['pending','confirmed','completed','denied','cancelled','more_info_requested'];
  const statusTable = statuses.map(s => ({
    status: s.replace(/_/g,' '),
    count: bookings.filter(b => b.status === s).length,
    revenue: bookings.filter(b => b.status === s).reduce((sum, b) => sum + (b.estimated_total || 0), 0),
  }));

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-heading text-2xl font-bold text-gray-800">Analytics</h1>
        <div className="flex gap-2">
          {[['ytd','Year to Date'],['all','All Time']].map(([v,l]) => (
            <button key={v} onClick={() => setTimeFilter(v)} className={`text-sm px-4 py-2 rounded-full border transition-colors ${timeFilter === v ? 'bg-cp-primary text-white border-cp-primary' : 'border-gray-200 text-gray-500 hover:border-cp-primary'}`}>{l}</button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Bookings', value: bookings.length },
          { label: 'Confirmed + Completed', value: confirmed.length },
          { label: 'Total Revenue', value: `$${totalRevenue.toFixed(0)}` },
          { label: 'Avg Booking Value', value: `$${avgValue.toFixed(0)}` },
        ].map(({ label, value }) => (
          <div key={label} className="bg-white border border-gray-200 rounded-xl p-5">
            <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">{label}</p>
            <p className="font-heading text-2xl font-bold text-gray-800">{value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white border border-gray-200 rounded-xl p-5">
          <h2 className="font-semibold text-gray-700 mb-4">Bookings Per Month</h2>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={monthly}><XAxis dataKey="name" tick={{ fontSize: 11 }} /><YAxis allowDecimals={false} tick={{ fontSize: 11 }} /><Tooltip /><Bar dataKey="count" fill="#2d6a4f" radius={[4,4,0,0]} /></BarChart>
          </ResponsiveContainer>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-5">
          <h2 className="font-semibold text-gray-700 mb-4">Event Type Breakdown</h2>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart><Pie data={typePie} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label={({ name, percent }) => `${name} ${(percent*100).toFixed(0)}%`}>
              {typePie.map((_, i) => <Cell key={i} fill={COLORS[i]} />)}
            </Pie><Tooltip /><Legend /></PieChart>
          </ResponsiveContainer>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-5 lg:col-span-2">
          <h2 className="font-semibold text-gray-700 mb-4">Catering Style Breakdown</h2>
          <ResponsiveContainer width="100%" height={160}>
            <BarChart data={styleBar} layout="vertical"><XAxis type="number" allowDecimals={false} tick={{ fontSize: 11 }} /><YAxis dataKey="name" type="category" tick={{ fontSize: 11 }} /><Tooltip /><Bar dataKey="count" fill="#f4a261" radius={[0,4,4,0]} /></BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100"><h2 className="font-heading font-bold text-gray-700">Bookings by Status</h2></div>
        <table className="w-full text-sm">
          <thead className="text-xs text-gray-400 bg-gray-50"><tr>{['Status','Count','Revenue Estimate'].map(h => <th key={h} className="px-4 py-3 text-left">{h}</th>)}</tr></thead>
          <tbody className="divide-y divide-gray-50">
            {statusTable.map(r => <tr key={r.status} className="hover:bg-gray-50"><td className="px-4 py-3 capitalize">{r.status}</td><td className="px-4 py-3">{r.count}</td><td className="px-4 py-3">{r.revenue > 0 ? `$${r.revenue.toFixed(0)}` : '—'}</td></tr>)}
          </tbody>
        </table>
      </div>
    </div>
  );
}