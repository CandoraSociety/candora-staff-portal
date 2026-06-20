import React from 'react';

function Section({ title, children }) {
  return (
    <div className="border border-cp-border rounded-xl p-5">
      <h3 className="font-heading font-bold text-cp-text mb-4">{title}</h3>
      {children}
    </div>
  );
}

function Row({ label, value }) {
  if (!value) return null;
  return (
    <div className="flex justify-between text-sm py-1">
      <span className="text-gray-500">{label}</span>
      <span className="font-medium text-gray-800 text-right max-w-xs">{value}</span>
    </div>
  );
}

export default function StepReview({ data }) {
  const barFee = data.bar_service_addon
    ? 150 + (data.bar_liquor_source === 'we_provide' ? (parseFloat(data.bar_estimated_sales) || 0) * 0.15 : 0)
    : 0;

  const setupFee = {
    full_setup_teardown: 200,
    setup_only: 100,
    teardown_only: 100,
    self_service: 0,
  }[data.setup_teardown] || 0;

  const grandTotal = (data.space_rental_total || 0) +
    (data.catering_estimate || 0) +
    (data.catering_gratuity || 0) +
    barFee +
    (data.staffing_fee || 0) +
    setupFee +
    (data.equipment_rental_total || 0);

  return (
    <div className="space-y-5">
      <h2 className="font-heading text-2xl font-bold text-cp-text mb-2">Review Your Booking</h2>
      <p className="text-gray-500 text-sm">Please review all details before submitting.</p>

      <Section title="Contact & Event Info">
        <Row label="Name" value={data.contact_name} />
        <Row label="Email" value={data.contact_email} />
        <Row label="Phone" value={data.contact_phone} />
        <Row label="Organization" value={data.organization} />
        <Row label="Event Type" value={data.booking_type === 'external_event' ? 'External Event' : 'In-House Event'} />
        <Row label="Event Date" value={data.event_date} />
        <Row label="Time" value={`${data.start_time} – ${data.end_time}`} />
        <Row label="Guests" value={data.guest_count?.toString()} />
        {data.event_location && <Row label="Location" value={data.event_location} />}
        {data.space && <Row label="Space" value={data.space?.replace(/_/g, ' ')} />}
        <Row label="Description" value={data.event_description} />
        {data.is_recurring && <Row label="Recurring" value={`${data.recurrence_pattern} until ${data.recurrence_end_date}`} />}
      </Section>

      {data.catering_required === 'yes' && (
        <Section title="Catering">
          <Row label="Style" value={data.catering_style} />
          <Row label="Service Level" value={data.catering_service_level?.replace(/_/g, ' ')} />
          {(data.catering_selections || []).length > 0 && (
            <div className="mt-2">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">Selected Items</p>
              {data.catering_selections.map((s, i) => (
                <div key={i} className="flex justify-between text-sm py-0.5">
                  <span className="text-gray-600">{s.item_name} ×{s.quantity}</span>
                  <span className="text-gray-800">${(s.unit_price * s.quantity).toFixed(2)}</span>
                </div>
              ))}
            </div>
          )}
          <div className="border-t border-cp-border mt-2 pt-2">
            <Row label="Catering Subtotal" value={`$${(data.catering_estimate || 0).toFixed(2)}`} />
            <Row label="Gratuity (15%)" value={`$${(data.catering_gratuity || 0).toFixed(2)}`} />
          </div>
        </Section>
      )}

      {data.bar_service_addon && (
        <Section title="Bar Service">
          <Row label="Bar Type" value={data.bar_service_type?.replace(/_/g, ' ')} />
          <Row label="Liquor Source" value={data.bar_liquor_source?.replace(/_/g, ' ')} />
          {data.bar_liquor_selections?.length > 0 && <Row label="Selections" value={data.bar_liquor_selections.join(', ')} />}
          <Row label="Staffing Fee" value="$150.00" />
          {data.bar_liquor_source === 'we_provide' && <Row label="15% of estimated sales" value={`$${((parseFloat(data.bar_estimated_sales) || 0) * 0.15).toFixed(2)}`} />}
          <Row label="Bar Total" value={`$${barFee.toFixed(2)}`} />
        </Section>
      )}

      {(data.staffing_required || data.setup_teardown !== 'self_service' || (data.equipment_rentals || []).length > 0) && (
        <Section title="Services & Equipment">
          {data.staffing_required && <Row label={`Staffing (${data.staffing_count} staff)`} value={`$${(data.staffing_fee || 0).toFixed(2)}`} />}
          {data.setup_teardown && data.setup_teardown !== 'self_service' && (
            <Row label="Setup/Teardown" value={`${data.setup_teardown.replace(/_/g,' ')} — $${setupFee.toFixed(2)}`} />
          )}
          {(data.equipment_rentals || []).map((e, i) => (
            <div key={i} className="flex justify-between text-sm py-0.5">
              <span className="text-gray-600">{e.item_name} ×{e.quantity}</span>
              <span className="text-gray-800">${(e.unit_price * e.quantity).toFixed(2)}</span>
            </div>
          ))}
        </Section>
      )}

      <div className="bg-cp-primary text-white rounded-xl p-6 space-y-2">
        <h3 className="font-heading font-bold text-lg mb-3">Cost Summary</h3>
        {data.space_rental_total > 0 && <div className="flex justify-between text-sm"><span className="text-white/70">Space Rental</span><span>${(data.space_rental_total || 0).toFixed(2)}</span></div>}
        {data.catering_estimate > 0 && <div className="flex justify-between text-sm"><span className="text-white/70">Catering</span><span>${(data.catering_estimate || 0).toFixed(2)}</span></div>}
        {data.catering_gratuity > 0 && <div className="flex justify-between text-sm"><span className="text-white/70">Gratuity (15%)</span><span>${(data.catering_gratuity || 0).toFixed(2)}</span></div>}
        {barFee > 0 && <div className="flex justify-between text-sm"><span className="text-white/70">Bar Service</span><span>${barFee.toFixed(2)}</span></div>}
        {data.staffing_fee > 0 && <div className="flex justify-between text-sm"><span className="text-white/70">Staffing</span><span>${(data.staffing_fee || 0).toFixed(2)}</span></div>}
        {setupFee > 0 && <div className="flex justify-between text-sm"><span className="text-white/70">Setup/Teardown</span><span>${setupFee.toFixed(2)}</span></div>}
        {data.equipment_rental_total > 0 && <div className="flex justify-between text-sm"><span className="text-white/70">Equipment</span><span>${(data.equipment_rental_total || 0).toFixed(2)}</span></div>}
        <div className="border-t border-white/30 pt-3 mt-2 flex justify-between font-bold text-lg">
          <span>Grand Total Estimate</span>
          <span>${grandTotal.toFixed(2)}</span>
        </div>
        <p className="text-xs text-white/50 mt-1">This is an estimate. Final invoice will be confirmed by Candora staff.</p>
      </div>
    </div>
  );
}