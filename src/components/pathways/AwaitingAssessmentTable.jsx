import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { ClipboardCheck, Clock } from 'lucide-react';
import { base44 } from '@/api/base44Client';

const ATTEMPT_STATUSES = [
  { value: 'not_attempted', label: 'Not attempted' },
  { value: 'reached', label: 'Reached' },
  { value: 'left_message', label: 'Left message' },
  { value: 'no_answer', label: 'No answer' },
  { value: 'wrong_number', label: 'Wrong number' },
];

const STATUS_TONE = {
  not_attempted: 'text-slate-500 border-slate-200',
  reached: 'text-green-700 border-green-300 bg-green-50',
  left_message: 'text-blue-700 border-blue-300 bg-blue-50',
  no_answer: 'text-amber-700 border-amber-300 bg-amber-50',
  wrong_number: 'text-red-700 border-red-300 bg-red-50',
};

export default function AwaitingAssessmentTable({ clients, onUpdate, onWaitlist }) {
  const [overrides, setOverrides] = useState({});
  const [saving, setSaving] = useState({});

  const handleChange = async (client, attempt, value) => {
    const field = `contact_attempt_${attempt}_status`;
    setOverrides(o => ({ ...o, [`${client.id}_${attempt}`]: value }));
    setSaving(s => ({ ...s, [`${client.id}_${attempt}`]: true }));
    try {
      const updated = await base44.entities.Client.update(client.id, { [field]: value });
      onUpdate?.(updated);
    } catch (e) {
      console.error(e);
      setOverrides(o => ({ ...o, [`${client.id}_${attempt}`]: client[field] }));
    } finally {
      setSaving(s => ({ ...s, [`${client.id}_${attempt}`]: false }));
    }
  };

  const statusFor = (c, attempt) =>
    overrides[`${c.id}_${attempt}`] ?? c[`contact_attempt_${attempt}_status`] ?? 'not_attempted';

  const renderAttempt = (c, attempt) => {
    const value = statusFor(c, attempt);
    return (
      <select
        value={value}
        disabled={saving[`${c.id}_${attempt}`]}
        onChange={(e) => handleChange(c, attempt, e.target.value)}
        className={`h-8 text-xs rounded-md border px-1.5 py-0.5 focus:outline-none focus:ring-1 focus:ring-blue-400 disabled:opacity-50 ${STATUS_TONE[value] || 'text-slate-600 border-slate-200'}`}
      >
        {ATTEMPT_STATUSES.map(s => (
          <option key={s.value} value={s.value}>{s.label}</option>
        ))}
      </select>
    );
  };

  return (
    <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="text-left px-3 py-3 font-semibold text-slate-600">Name</th>
              <th className="text-left px-3 py-3 font-semibold text-slate-600">HSID#</th>
              <th className="text-left px-3 py-3 font-semibold text-slate-600">Phone</th>
              <th className="text-left px-3 py-3 font-semibold text-slate-600">Intake Date</th>
              <th className="text-left px-3 py-3 font-semibold text-slate-600">Self-Reg</th>
              <th className="text-left px-3 py-3 font-semibold text-slate-600">Contact Attempt 1</th>
              <th className="text-left px-3 py-3 font-semibold text-slate-600">Contact Attempt 2</th>
              <th className="px-3 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {clients.map(c => (
              <tr key={c.id} className="hover:bg-slate-50 transition-colors">
                <td className="px-3 py-2.5 font-medium text-blue-700">
                  {c.first_name} {c.last_name}
                </td>
                <td className="px-3 py-2.5 text-slate-600">{c.compass_hsid || '—'}</td>
                <td className="px-3 py-2.5 text-slate-600">{c.phone || '—'}</td>
                <td className="px-3 py-2.5 text-slate-500">
                  {c.intake_date ? format(new Date(c.intake_date), 'MMM d, yyyy') : '—'}
                </td>
                <td className="px-3 py-2.5">
                  {c.self_registered ? (
                    <span className="text-xs bg-green-100 text-green-700 px-1.5 py-0.5 rounded-full font-medium">
                      Yes
                    </span>
                  ) : '—'}
                </td>
                <td className="px-3 py-2.5">{renderAttempt(c, 1)}</td>
                <td className="px-3 py-2.5">{renderAttempt(c, 2)}</td>
                <td className="px-3 py-2.5">
                  <div className="flex items-center gap-1.5">
                    <Link to={`/pathways/assessment/${c.id}`}>
                      <Button variant="outline" size="sm" className="gap-1">
                        <ClipboardCheck className="w-3.5 h-3.5" />
                        Assess
                      </Button>
                    </Link>
                    <Button
                      variant="outline"
                      size="sm"
                      className="gap-1 text-amber-700 border-amber-300 hover:bg-amber-50"
                      onClick={() => onWaitlist?.(c)}
                    >
                      <Clock className="w-3.5 h-3.5" />
                      Add to Waitlist
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
            {clients.length === 0 && (
              <tr>
                <td colSpan={8} className="text-center py-10 text-slate-400">
                  No clients awaiting assessment.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}