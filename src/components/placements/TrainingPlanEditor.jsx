export default function TrainingPlanEditor({ training }) {
  const items = training?.training_plan_items || [];

  if (items.length === 0) {
    return (
      <div className="text-center py-8 text-slate-400 text-sm">No training plan items recorded.</div>
    );
  }

  return (
    <div className="space-y-2">
      {items.map((item, i) => (
        <div key={i} className="border border-slate-200 rounded-lg p-3 bg-slate-50">
          <p className="text-sm font-medium text-slate-700">{item.title || item.name || `Item ${i + 1}`}</p>
          {item.description && <p className="text-xs text-slate-500 mt-0.5">{item.description}</p>}
          {item.status && (
            <span className="mt-1 inline-block text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-700">
              {item.status}
            </span>
          )}
        </div>
      ))}
    </div>
  );
}