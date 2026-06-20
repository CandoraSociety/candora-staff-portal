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

function buildTimes() {
  const times = [];
  for (let h = 7; h <= 23; h++) {
    ['00','30'].forEach(m => {
      const ampm = h < 12 ? 'AM' : 'PM';
      const h12 = h === 0 ? 12 : h > 12 ? h - 12 : h;
      times.push({ value: `${String(h).padStart(2,'0')}:${m}`, label: `${h12}:${m} ${ampm}` });
    });
  }
  times.push({ value: '24:00', label: '12:00 AM (midnight)' });
  return times;
}
const TIMES = buildTimes();

export default function StepDateTime({ data, onChange }) {
  const set = (k) => (e) => onChange({ [k]: e.target.value });

  return (
    <div className="space-y-5">
      <h2 className="font-heading text-2xl font-bold text-cp-text mb-6">When is your event?</h2>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Field label="Event Date" required>
          <input type="date" className={inputCls} value={data.event_date} onChange={set('event_date')} min={new Date().toISOString().split('T')[0]} />
        </Field>
        <Field label="Start Time" required>
          <select className={inputCls} value={data.start_time} onChange={set('start_time')}>
            <option value="">Select time</option>
            {TIMES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
          </select>
        </Field>
        <Field label="End Time" required>
          <select className={inputCls} value={data.end_time} onChange={set('end_time')}>
            <option value="">Select time</option>
            {TIMES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
          </select>
        </Field>
      </div>

      {data.booking_type === 'external_event' && (
        <Field label="Number of Guests">
          <input type="number" className={inputCls} value={data.guest_count} onChange={set('guest_count')} min={1} placeholder="Estimated guest count" />
        </Field>
      )}

      <div className="flex items-center gap-3">
        <input type="checkbox" id="recurring" checked={data.is_recurring}
          onChange={e => onChange({ is_recurring: e.target.checked })}
          className="w-4 h-4 rounded border-cp-border accent-cp-primary" />
        <label htmlFor="recurring" className="text-sm font-medium text-gray-700">This is a recurring event</label>
      </div>

      {data.is_recurring && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-cp-muted p-5 rounded-xl">
          <Field label="Recurrence Pattern">
            <select className={inputCls} value={data.recurrence_pattern} onChange={set('recurrence_pattern')}>
              <option value="">Select pattern</option>
              <option value="weekly">Weekly</option>
              <option value="biweekly">Bi-weekly</option>
              <option value="monthly">Monthly</option>
            </select>
          </Field>
          <Field label="Day of Week / Month">
            <input className={inputCls} value={data.recurrence_day} onChange={set('recurrence_day')} placeholder="e.g. Every Monday" />
          </Field>
          <Field label="End Date">
            <input type="date" className={inputCls} value={data.recurrence_end_date} onChange={set('recurrence_end_date')} />
          </Field>
        </div>
      )}
    </div>
  );
}