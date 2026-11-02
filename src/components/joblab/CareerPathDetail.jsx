import { ArrowLeft, Trash2, Circle, CircleDot, CheckCircle2 } from 'lucide-react';
import { JLBadge, JLButton, JLCard } from '@/components/joblab/ui';

const NEXT_STATUS = { not_started: 'in_progress', in_progress: 'completed', completed: 'not_started' };

const STATUS_ICON = {
  not_started: Circle,
  in_progress: CircleDot,
  completed: CheckCircle2,
};

const STATUS_TONE = {
  not_started: 'text-jl-muted-fg',
  in_progress: 'text-jl-primary',
  completed: 'text-jl-success',
};

const PANEL_TONE = {
  not_started: 'border-jl-border bg-white',
  in_progress: 'border-jl-primary/30 bg-jl-primary/[0.03]',
  completed: 'border-jl-success/30 bg-jl-success/[0.04]',
};

export default function CareerPathDetail({ path, onBack, onDelete, onCycleStatus }) {
  const milestones = path.milestones || [];

  return (
    <div>
      <div className="mb-5 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <JLButton variant="ghost" size="icon" onClick={onBack} aria-label="Back to paths">
            <ArrowLeft className="h-4 w-4" />
          </JLButton>
          <h1 className="jl-heading text-xl font-bold text-jl-fg">{path.title}</h1>
        </div>
        <JLButton variant="outline" size="sm" className="text-red-600" onClick={() => onDelete(path)}>
          <Trash2 className="h-3.5 w-3.5" /> Delete
        </JLButton>
      </div>

      <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
        {[
          { label: 'Current Role', value: path.current_role || '—' },
          { label: 'Target Role', value: path.target_role || '—' },
          { label: 'Timeline', value: path.timeline_years ? `${path.timeline_years} year${path.timeline_years === 1 ? '' : 's'}` : '—' },
        ].map((stat) => (
          <JLCard key={stat.label} className="p-4">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-jl-muted-fg">{stat.label}</p>
            <p className="jl-heading mt-1 text-sm font-semibold text-jl-fg">{stat.value}</p>
          </JLCard>
        ))}
      </div>

      {(path.required_skills || []).length > 0 && (
        <JLCard className="mb-4 p-4">
          <h2 className="jl-heading mb-2 text-sm font-semibold text-jl-fg">Required Skills</h2>
          <div className="flex flex-wrap gap-1.5">
            {path.required_skills.map((skill) => (
              <JLBadge key={skill} className="border border-jl-border text-jl-fg">{skill}</JLBadge>
            ))}
          </div>
        </JLCard>
      )}

      <h2 className="jl-heading mb-3 text-sm font-semibold text-jl-fg">Milestones</h2>
      <div className="relative space-y-3 border-l border-jl-border pl-6">
        {milestones.map((milestone, index) => {
          const status = milestone.status || 'not_started';
          const Icon = STATUS_ICON[status];
          return (
            <div key={index} className="relative">
              <button
                onClick={() => onCycleStatus(path, index, NEXT_STATUS[status])}
                className={`absolute -left-[34px] top-1 rounded-full bg-white ${STATUS_TONE[status]}`}
                aria-label="Change milestone status"
                title="Click to change status"
              >
                <Icon className="h-5 w-5" />
              </button>
              <div className={`rounded-xl border p-3 ${PANEL_TONE[status]}`}>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="jl-heading text-sm font-semibold text-jl-fg">{milestone.title}</p>
                  {milestone.target_date && (
                    <JLBadge className="bg-jl-secondary text-jl-muted-fg">{milestone.target_date}</JLBadge>
                  )}
                </div>
                {milestone.description && (
                  <p className="mt-1 text-xs text-jl-muted-fg">{milestone.description}</p>
                )}
                {(milestone.skills_needed || []).length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {milestone.skills_needed.map((skill) => (
                      <JLBadge key={skill} className="bg-white text-jl-fg ring-1 ring-jl-border">{skill}</JLBadge>
                    ))}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}