import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { AlertCircle, CheckCircle, Clock, XCircle, Info, MessageSquare } from 'lucide-react';

const STATUS_CONFIG = {
  pending: { label: 'Pending Review', color: 'bg-yellow-100 text-yellow-700 border-yellow-200', icon: Clock },
  confirmed: { label: 'Confirmed', color: 'bg-green-100 text-green-700 border-green-200', icon: CheckCircle },
  denied: { label: 'Denied', color: 'bg-red-100 text-red-700 border-red-200', icon: XCircle },
  cancelled: { label: 'Cancelled', color: 'bg-gray-100 text-gray-600 border-gray-200', icon: XCircle },
  completed: { label: 'Completed', color: 'bg-blue-100 text-blue-700 border-blue-200', icon: CheckCircle },
  more_info_requested: { label: 'More Info Needed', color: 'bg-orange-100 text-orange-700 border-orange-200', icon: AlertCircle },
};

function Field({ label, value }) {
  if (!value) return null;
  return (
    <div>
      <p className="text-xs text-gray-400 uppercase tracking-wide mb-0.5">{label}</p>
      <p className="text-sm text-gray-700 font-medium">{value}</p>
    </div>
  );
}

export default function MyBooking() {
  const [code, setCode] = useState('');
  const [pin, setPin] = useState('');
  const [booking, setBooking] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState('');
  const [responseSent, setResponseSent] = useState(false);

  const lookup = async () => {
    if (!code || !pin) { setError('Please enter both confirmation code and PIN.'); return; }
    setLoading(true); setError(''); setBooking(null);
    const results = await base44.entities.BookingRequest.filter({ confirmation_code: code.toUpperCase() });
    const match = results.find(b => b.pin === pin);
    if (match) { setBooking(match); }
    else { setError('No booking found with that code and PIN. Please double-check and try again.'); }
    setLoading(false);
  };

  const submitResponse = async () => {
    await base44.entities.BookingRequest.update(booking.id, { more_info_response: response });
    setBooking(b => ({ ...b, more_info_response: response }));
    setResponseSent(true);
  };

  const cfg = booking ? STATUS_CONFIG[booking.status] || {} : {};
  const StatusIcon = cfg.icon;

  return (
    <div className="max-w-2xl mx-auto px-4 py-12">
      <div className="text-center mb-10">
        <h1 className="font-heading text-4xl font-bold text-cp-text mb-2">My Booking</h1>
        <p className="text-gray-500">Look up your booking using your confirmation code and PIN.</p>
      </div>

      <div className="bg-white border border-cp-border rounded-2xl p-8 shadow-sm mb-8">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Confirmation Code</label>
            <input value={code} onChange={e => setCode(e.target.value.toUpperCase())} placeholder="e.g. ABC123"
              className="w-full border border-cp-border rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-cp-primary/30 font-mono uppercase tracking-widest" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">PIN</label>
            <input value={pin} onChange={e => setPin(e.target.value)} placeholder="4-digit PIN" maxLength={4} type="password"
              className="w-full border border-cp-border rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-cp-primary/30" />
          </div>
          {error && <p className="text-red-500 text-sm">{error}</p>}
          <button onClick={lookup} disabled={loading}
            className="w-full bg-cp-primary text-white font-semibold py-3 rounded-xl hover:opacity-90 transition-opacity disabled:opacity-60">
            {loading ? 'Looking up...' : 'Look Up My Booking'}
          </button>
        </div>
      </div>

      {booking && (
        <div className="bg-white border border-cp-border rounded-2xl p-8 shadow-sm space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-400 uppercase tracking-wide">Confirmation Code</p>
              <p className="font-mono font-bold text-xl text-cp-text">{booking.confirmation_code}</p>
            </div>
            {StatusIcon && (
              <span className={`flex items-center gap-1.5 text-sm font-semibold px-3 py-1.5 rounded-full border ${cfg.color}`}>
                <StatusIcon className="w-4 h-4" /> {cfg.label}
              </span>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Field label="Name" value={booking.contact_name} />
            <Field label="Email" value={booking.contact_email} />
            <Field label="Phone" value={booking.contact_phone} />
            <Field label="Organization" value={booking.organization} />
            <Field label="Event Date" value={booking.event_date} />
            <Field label="Time" value={booking.start_time && booking.end_time ? `${booking.start_time} – ${booking.end_time}` : ''} />
            <Field label="Type" value={booking.booking_type === 'external_event' ? 'External Event' : 'In-House Event'} />
            <Field label="Guests" value={booking.guest_count?.toString()} />
            {booking.event_location && <Field label="Location" value={booking.event_location} />}
            {booking.space && <Field label="Space" value={booking.space?.replace(/_/g,' ')} />}
            <Field label="Catering" value={booking.catering_required === 'yes' ? `${booking.catering_style} – ${booking.catering_service_level?.replace(/_/g,' ')}` : booking.catering_required} />
            {booking.estimated_total > 0 && <Field label="Estimated Total" value={`$${booking.estimated_total.toFixed(2)}`} />}
          </div>

          {booking.status === 'more_info_requested' && (
            <div className="bg-orange-50 border border-orange-200 rounded-xl p-5">
              <div className="flex items-start gap-2 mb-3">
                <Info className="w-5 h-5 text-orange-500 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-orange-700 mb-1">Additional Information Requested</p>
                  <p className="text-sm text-orange-700">{booking.more_info_request_details}</p>
                </div>
              </div>
              {!booking.more_info_response && !responseSent ? (
                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Your Response</label>
                  <textarea value={response} onChange={e => setResponse(e.target.value)} rows={4}
                    className="w-full border border-cp-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-cp-primary/30"
                    placeholder="Type your response here..." />
                  <button onClick={submitResponse} disabled={!response.trim()}
                    className="mt-2 bg-cp-primary text-white font-semibold px-6 py-2 rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 text-sm">
                    Submit Response
                  </button>
                </div>
              ) : (
                <div className="mt-3 bg-green-50 border border-green-200 rounded-lg p-3 flex items-center gap-2 text-green-700 text-sm">
                  <CheckCircle className="w-4 h-4" /> Response submitted. Our team will follow up shortly.
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}