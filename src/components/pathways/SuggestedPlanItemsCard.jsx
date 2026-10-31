import { Lightbulb } from 'lucide-react';
import { planItemLabel } from '@/lib/actionPlanItems';

// Shown on the counsellor's Program Flow tab when there is no action plan yet —
// the service navigator's suggested items and notes from the assessment.
export default function SuggestedPlanItemsCard({ client }) {
  const items = client?.suggested_plan_items || [];
  const other = client?.suggested_plan_other;
  const notes = client?.suggested_plan_notes;
  if (!items.length && !notes?.trim() && !other?.trim()) return null;

  const navigator = client?.assigned_service_navigator_name;

  return (
    <div className="max-w-xl mx-auto mb-6 text-left rounded-lg border border-amber-300 bg-amber-50 p-4 space-y-2">
      <div className="flex items-center gap-2">
        <Lightbulb className="w-4 h-4 text-amber-600 shrink-0" />
        <p className="text-sm font-semibold text-amber-900">
          Suggested action plan items{navigator ? ` — from ${navigator}` : ''}
        </p>
      </div>
      {items.length > 0 && (
        <ul className="text-sm text-amber-900 space-y-0.5 pl-5 list-disc">
          {items.map(key => (
            <li key={key}>
              {planItemLabel(key)}
              {key === 'other' && other?.trim() ? `: ${other}` : ''}
            </li>
          ))}
        </ul>
      )}
      {notes?.trim() && (
        <div className="text-sm text-amber-900">
          <span className="font-medium">Navigator's notes: </span>
          <span className="whitespace-pre-line">{notes}</span>
        </div>
      )}
      <p className="text-xs text-amber-700">
        These are suggestions from the assessment — choose what goes on the plan yourself.
      </p>
    </div>
  );
}