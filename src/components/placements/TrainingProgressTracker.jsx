import { CheckCircle2, Circle } from 'lucide-react';

const MILESTONES = [
  { key: 'orientation_completed',         label: 'Orientation',          dateKey: 'orientation_date' },
  { key: 'health_safety_completed',       label: 'Health & Safety',      dateKey: 'health_safety_date' },
  { key: 'midpoint_checkin_completed',    label: 'Midpoint Check-In',    dateKey: 'midpoint_checkin_date' },
  { key: 'program_completion_completed',  label: 'Program Completion',   dateKey: 'program_completion_date' },
];

export default function TrainingProgressTracker({ training }) {
  return (
    <div className="space-y-2">
      <p className="text-xs text-slate-500 mb-3">Milestone progress for this placement.</p>
      {MILESTONES.map(m => {
        const done = !!training?.[m.key];
        const date = training?.[m.dateKey];
        return (
          <div key={m.key} className={`flex items-center gap-3 p-3 rounded-lg border ${done ? 'bg-green-50 border-green-200' : 'bg-slate-50 border-slate-200'}`}>
            {done
              ? <CheckCircle2 className="w-5 h-5 text-green-500 shrink-0" />
              : <Circle className="w-5 h-5 text-slate-300 shrink-0" />
            }
            <div className="flex-1">
              <p className={`text-sm font-medium ${done ? 'text-green-700' : 'text-slate-600'}`}>{m.label}</p>
              {date && <p className="text-xs text-slate-400">{date}</p>}
            </div>
            {done && (
              <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium">Complete</span>
            )}
          </div>
        );
      })}
    </div>
  );
}