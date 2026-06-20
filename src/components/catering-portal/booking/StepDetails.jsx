import React from 'react';

function Field({ label, required, children }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}{required && <span className="text-red-400 ml-1">*</span>}</label>
      {children}
    </div>
  );
}

const inputCls = "w-full border border-cp-border rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-cp-primary/30 bg-white";

export default function StepDetails({ data, onChange }) {
  const set = (k) => (e) => onChange({ [k]: e.target.value });

  return (
    <div className="space-y-5">
      <h2 className="font-heading text-2xl font-bold text-cp-text mb-6">Tell us about yourself & your event</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Field label="Contact Name" required>
          <input className={inputCls} value={data.contact_name} onChange={set('contact_name')} placeholder="Full name" />
        </Field>
        <Field label="Contact Email" required>
          <input type="email" className={inputCls} value={data.contact_email} onChange={set('contact_email')} placeholder="email@example.com" />
        </Field>
        <Field label="Phone Number">
          <input className={inputCls} value={data.contact_phone} onChange={set('contact_phone')} placeholder="(780) 000-0000" />
        </Field>
        <Field label="Organization / Company">
          <input className={inputCls} value={data.organization} onChange={set('organization')} placeholder="Optional" />
        </Field>
      </div>

      {data.booking_type === 'external_event' && (
        <Field label="Event Location / Venue Address" required>
          <input className={inputCls} value={data.event_location} onChange={set('event_location')} placeholder="Venue name or full address" />
        </Field>
      )}

      {data.booking_type === 'inhouse_event' && (
        <Field label="Number of Guests" required>
          <input type="number" className={inputCls} value={data.guest_count} onChange={set('guest_count')} min={1} max={30} placeholder="Max 30 guests" />
          {parseInt(data.guest_count) > 30 && (
            <p className="text-amber-600 text-xs mt-1 font-medium">⚠ Our in-house spaces accommodate a maximum of 30 guests.</p>
          )}
          {parseInt(data.guest_count) >= 25 && parseInt(data.guest_count) <= 30 && (
            <p className="text-amber-500 text-xs mt-1">Approaching maximum capacity for in-house events.</p>
          )}
        </Field>
      )}

      <Field label="Event Description">
        <textarea rows={3} className={inputCls} value={data.event_description} onChange={set('event_description')} placeholder="Tell us about your event, theme, special requests..." />
      </Field>
    </div>
  );
}