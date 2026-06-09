const RATING_FIELDS = [
  { key: 'evaluation_reliability',       label: 'Reliability' },
  { key: 'evaluation_attitude',          label: 'Attitude' },
  { key: 'evaluation_skill_development', label: 'Skill Development' },
  { key: 'evaluation_teamwork',          label: 'Teamwork' },
  { key: 'evaluation_communication',     label: 'Communication' },
];

const RATING_COLORS = {
  excellent:         'bg-green-100 text-green-700',
  good:              'bg-teal-100 text-teal-700',
  satisfactory:      'bg-blue-100 text-blue-700',
  needs_improvement: 'bg-amber-100 text-amber-700',
  unsatisfactory:    'bg-red-100 text-red-700',
};

const HIRE_COLORS = {
  yes:              'bg-green-100 text-green-700',
  yes_with_conditions: 'bg-amber-100 text-amber-700',
  no:               'bg-red-100 text-red-700',
  not_applicable:   'bg-slate-100 text-slate-600',
};

export default function TrainingEvaluation({ training }) {
  if (!training?.evaluation_completed) {
    return (
      <div className="text-center py-8 text-slate-400 text-sm">Evaluation not yet completed.</div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {RATING_FIELDS.map(f => (
          <div key={f.key} className="bg-slate-50 border border-slate-200 rounded-lg p-3">
            <p className="text-xs text-slate-500 font-medium">{f.label}</p>
            <span className={`mt-1 inline-block text-xs px-2 py-0.5 rounded-full font-semibold capitalize ${RATING_COLORS[training[f.key]] || 'bg-slate-100 text-slate-600'}`}>
              {training[f.key]?.replace(/_/g, ' ') || '—'}
            </span>
          </div>
        ))}
        <div className="bg-slate-50 border border-slate-200 rounded-lg p-3">
          <p className="text-xs text-slate-500 font-medium">Would Hire</p>
          <span className={`mt-1 inline-block text-xs px-2 py-0.5 rounded-full font-semibold capitalize ${HIRE_COLORS[training.evaluation_would_hire] || 'bg-slate-100 text-slate-600'}`}>
            {training.evaluation_would_hire?.replace(/_/g, ' ') || '—'}
          </span>
        </div>
      </div>

      {training.evaluation_date && (
        <p className="text-xs text-slate-400">Evaluated on {training.evaluation_date}</p>
      )}

      {training.evaluation_strengths && (
        <div>
          <p className="text-xs font-semibold text-slate-600 mb-1">Strengths</p>
          <p className="text-sm text-slate-700 bg-green-50 border border-green-100 rounded-lg px-3 py-2">{training.evaluation_strengths}</p>
        </div>
      )}
      {training.evaluation_areas_for_growth && (
        <div>
          <p className="text-xs font-semibold text-slate-600 mb-1">Areas for Growth</p>
          <p className="text-sm text-slate-700 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2">{training.evaluation_areas_for_growth}</p>
        </div>
      )}
      {training.evaluation_overall_comments && (
        <div>
          <p className="text-xs font-semibold text-slate-600 mb-1">Overall Comments</p>
          <p className="text-sm text-slate-700 bg-slate-50 border border-slate-100 rounded-lg px-3 py-2">{training.evaluation_overall_comments}</p>
        </div>
      )}
    </div>
  );
}