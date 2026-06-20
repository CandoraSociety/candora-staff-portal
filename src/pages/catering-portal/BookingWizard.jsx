import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Link } from 'react-router-dom';
import WizardProgress from '@/components/catering-portal/booking/WizardProgress';
import StepBookingType from '@/components/catering-portal/booking/StepBookingType';
import StepDetails from '@/components/catering-portal/booking/StepDetails';
import StepDateTime from '@/components/catering-portal/booking/StepDateTime';
import StepSpace from '@/components/catering-portal/booking/StepSpace';
import StepCatering from '@/components/catering-portal/booking/StepCatering';
import StepServices from '@/components/catering-portal/booking/StepServices';
import StepReview from '@/components/catering-portal/booking/StepReview';
import { CheckCircle } from 'lucide-react';

const INITIAL = {
  booking_type: '', contact_name: '', contact_email: '', contact_phone: '',
  organization: '', event_description: '', event_location: '', space: '',
  event_date: '', start_time: '', end_time: '', guest_count: '',
  is_recurring: false, recurrence_pattern: '', recurrence_day: '', recurrence_end_date: '',
  catering_required: '', catering_style: '', catering_service_level: '',
  bar_service_addon: false, bar_service_type: '', bar_liquor_source: '',
  bar_liquor_selections: [], bar_estimated_sales: '',
  catering_selections: [], catering_estimate: 0, catering_gratuity: 0,
  catering_custom_request: '',
  staffing_required: false, staffing_count: '', setup_teardown: 'self_service',
  equipment_rentals: [], equipment_rental_total: 0,
  space_rental_total: 0, services_total: 0, estimated_total: 0,
};

function generateCode() { return Math.random().toString(36).substring(2, 8).toUpperCase(); }
function generatePin() { return Math.floor(1000 + Math.random() * 9000).toString(); }

function getSteps(booking_type) {
  const base = ['Type', 'Details', 'Date & Time'];
  if (booking_type === 'inhouse_event') base.push('Space');
  base.push('Catering', 'Services', 'Review');
  return base;
}

export default function BookingWizard() {
  const [data, setData] = useState(INITIAL);
  const [currentStep, setCurrentStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [confirmed, setConfirmed] = useState(null);

  const steps = getSteps(data.booking_type);

  const onChange = (updates) => setData(d => ({ ...d, ...updates }));

  const canNext = () => {
    const stepName = steps[currentStep];
    if (stepName === 'Type') return !!data.booking_type;
    if (stepName === 'Details') return !!data.contact_name && !!data.contact_email && (data.booking_type === 'inhouse_event' ? parseInt(data.guest_count) <= 30 && !!data.guest_count : true);
    if (stepName === 'Date & Time') return !!data.event_date && !!data.start_time && !!data.end_time;
    if (stepName === 'Space') return !!data.space;
    return true;
  };

  const submit = async () => {
    setSubmitting(true);
    try {
      const code = generateCode();
      const pin = generatePin();

      const barFee = data.bar_service_addon ? 150 + (data.bar_liquor_source === 'we_provide' ? (parseFloat(data.bar_estimated_sales) || 0) * 0.15 : 0) : 0;
      const setupFee = { full_setup_teardown: 200, setup_only: 100, teardown_only: 100, self_service: 0 }[data.setup_teardown] || 0;
      const estimated_total = (data.space_rental_total || 0) + (data.catering_estimate || 0) + (data.catering_gratuity || 0) + barFee + (data.staffing_fee || 0) + setupFee + (data.equipment_rental_total || 0);

      // Strip empty strings from enum fields to avoid validation errors
      const clean = (val) => val === '' ? undefined : val;

      const payload = {
        confirmation_code: code,
        pin,
        status: 'pending',
        booking_type: clean(data.booking_type),
        contact_name: data.contact_name,
        contact_email: data.contact_email,
        contact_phone: clean(data.contact_phone),
        organization: clean(data.organization),
        event_description: clean(data.event_description),
        event_location: clean(data.event_location),
        space: clean(data.space),
        event_date: data.event_date,
        start_time: data.start_time,
        end_time: data.end_time,
        guest_count: parseInt(data.guest_count) || 0,
        is_recurring: data.is_recurring,
        recurrence_pattern: clean(data.recurrence_pattern),
        recurrence_day: clean(data.recurrence_day),
        recurrence_end_date: clean(data.recurrence_end_date),
        catering_required: clean(data.catering_required),
        catering_style: clean(data.catering_style),
        catering_service_level: clean(data.catering_service_level),
        catering_custom_request: clean(data.catering_custom_request),
        catering_selections: data.catering_selections,
        catering_estimate: data.catering_estimate || 0,
        catering_gratuity: data.catering_gratuity || 0,
        bar_service_addon: data.bar_service_addon,
        bar_service_type: clean(data.bar_service_type),
        bar_liquor_source: clean(data.bar_liquor_source),
        bar_liquor_selections: data.bar_liquor_selections,
        bar_estimated_sales: parseFloat(data.bar_estimated_sales) || undefined,
        bar_service_fee: barFee,
        staffing_required: data.staffing_required,
        staffing_count: parseInt(data.staffing_count) || undefined,
        staffing_fee: data.staffing_required ? (parseInt(data.staffing_count) || 0) * 45 : 0,
        setup_teardown: clean(data.setup_teardown),
        equipment_rentals: data.equipment_rentals,
        equipment_rental_total: data.equipment_rental_total || 0,
        space_rental_total: data.space_rental_total || 0,
        services_total: data.services_total || 0,
        estimated_total,
      };

      // Remove undefined keys entirely
      Object.keys(payload).forEach(k => payload[k] === undefined && delete payload[k]);

      await base44.entities.BookingRequest.create(payload);

      setConfirmed({ code, pin, total: estimated_total });
    } catch (err) {
      console.error('Booking submission failed:', err);
      alert('Something went wrong submitting your booking. Please try again.\n\nDetails: ' + (err?.message || err));
    } finally {
      setSubmitting(false);
    }
  };

  if (confirmed) {
    return (
      <div className="max-w-lg mx-auto px-4 py-16 text-center">
        <div className="bg-white border border-cp-border rounded-2xl p-10 shadow-sm">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-cp-primary/10 mb-6">
            <CheckCircle className="w-8 h-8 text-cp-primary" />
          </div>
          <h2 className="font-heading text-3xl font-bold text-cp-text mb-2">Booking Submitted!</h2>
          <p className="text-gray-500 mb-8">Our team will review your request and contact you within 24–48 hours.</p>

          <div className="bg-cp-muted rounded-xl p-6 mb-6">
            <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Confirmation Code</p>
            <p className="font-mono font-bold text-3xl text-cp-primary tracking-widest">{confirmed.code}</p>
            <p className="text-xs text-gray-400 uppercase tracking-wide mt-4 mb-1">Your PIN</p>
            <p className="font-mono font-bold text-2xl text-gray-700">{confirmed.pin}</p>
            <p className="text-xs text-gray-400 mt-3">Save these to look up your booking status anytime.</p>
          </div>

          {confirmed.total > 0 && (
            <p className="text-sm text-gray-500 mb-6">Estimated total: <span className="font-bold text-cp-text">${confirmed.total.toFixed(2)}</span></p>
          )}

          <div className="flex flex-col sm:flex-row gap-3">
            <Link to="/catering-portal/my-booking" className="flex-1 bg-cp-primary text-white font-semibold py-3 rounded-xl hover:opacity-90 transition-opacity text-center text-sm">
              Track My Booking
            </Link>
            <Link to="/catering-portal" className="flex-1 border border-cp-border text-gray-600 font-semibold py-3 rounded-xl hover:border-cp-primary transition-colors text-center text-sm">
              Return Home
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const stepComponents = {
    'Type': <StepBookingType data={data} onChange={onChange} />,
    'Details': <StepDetails data={data} onChange={onChange} />,
    'Date & Time': <StepDateTime data={data} onChange={onChange} />,
    'Space': <StepSpace data={data} onChange={onChange} />,
    'Catering': <StepCatering data={data} onChange={onChange} />,
    'Services': <StepServices data={data} onChange={onChange} />,
    'Review': <StepReview data={data} />,
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      <div className="text-center mb-8">
        <h1 className="font-heading text-4xl font-bold text-cp-text mb-2">Book an Event</h1>
        <p className="text-gray-500">Complete the form below to submit your booking request.</p>
      </div>

      <WizardProgress steps={steps} currentStep={currentStep} />

      <div className="bg-white border border-cp-border rounded-2xl p-8 shadow-sm mb-6">
        {stepComponents[steps[currentStep]]}
      </div>

      <div className="flex justify-between">
        {currentStep > 0 ? (
          <button onClick={() => setCurrentStep(s => s - 1)} className="border border-cp-border text-gray-600 font-semibold px-6 py-2.5 rounded-xl hover:border-cp-primary transition-colors text-sm">
            ← Back
          </button>
        ) : <div />}

        {currentStep < steps.length - 1 ? (
          <button onClick={() => setCurrentStep(s => s + 1)} disabled={!canNext()}
            className="bg-cp-primary text-white font-semibold px-8 py-2.5 rounded-xl hover:opacity-90 transition-opacity text-sm disabled:opacity-50 disabled:cursor-not-allowed">
            Next →
          </button>
        ) : (
          <button onClick={submit} disabled={submitting}
            className="bg-cp-accent text-white font-semibold px-10 py-2.5 rounded-xl hover:opacity-90 transition-opacity text-sm disabled:opacity-60">
            {submitting ? 'Submitting...' : 'Submit Booking Request'}
          </button>
        )}
      </div>
    </div>
  );
}