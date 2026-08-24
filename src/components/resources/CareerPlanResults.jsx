import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowRight, CheckCircle2, AlertTriangle, ListChecks } from 'lucide-react';

function ResultCard({ title, icon, subtitle, children }) {
  return (
    <Card>
      <CardHeader className="pb-2 pt-4 px-4">
        <CardTitle className="text-sm font-semibold text-slate-700 flex items-center gap-2">
          {icon}
          {title}
        </CardTitle>
        {subtitle && <p className="text-xs text-slate-400 mt-0.5">{subtitle}</p>}
      </CardHeader>
      <CardContent className="px-4 pb-4">{children}</CardContent>
    </Card>
  );
}

function BulletList({ items = [] }) {
  return (
    <ul className="space-y-1">
      {items.map((item, i) => (
        <li key={i} className="text-sm text-slate-600 flex gap-2">
          <span className="text-slate-400 mt-0.5">•</span>
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}

export default function CareerPlanResults({ result, jobType, clientName, hasResume, onRefineJob }) {
  const r = result || {};
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-semibold text-lg">Career Plan: {jobType}</h3>
          {clientName && <p className="text-sm text-muted-foreground">Prepared for {clientName}</p>}
          {hasResume && (
            <p className="text-xs text-emerald-600 mt-0.5">Includes assessment of the client's uploaded resume</p>
          )}
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <ResultCard title="Job Titles in This Field" subtitle={onRefineJob ? 'Click any title to refine the plan for that role' : undefined}>
          <ul className="space-y-1">
            {(r.job_titles || []).map((item, i) => {
              const label = typeof item === 'string' ? item : (String(item?.title || item?.name || item || ''));
              return (
                <li key={i} className="text-sm flex gap-2">
                  <span className="text-slate-400 mt-0.5">•</span>
                  {onRefineJob ? (
                    <button
                      onClick={() => onRefineJob(label)}
                      className="text-left text-blue-700 hover:text-blue-900 hover:underline"
                    >
                      {label}
                    </button>
                  ) : (
                    <span className="text-slate-600">{label}</span>
                  )}
                </li>
              );
            })}
          </ul>
        </ResultCard>

        <ResultCard title="Wage Range (Alberta)">
          <p className="text-sm text-slate-600">
            <span className="font-medium">Hourly:</span> ${r.wage_range?.hourly_min || '—'} – ${r.wage_range?.hourly_max || '—'}
          </p>
          <p className="text-sm text-slate-600 mt-1">
            <span className="font-medium">Annual:</span> ${r.wage_range?.annual_min || '—'} – ${r.wage_range?.annual_max || '—'}
          </p>
        </ResultCard>

        <ResultCard title="Education Required">
          <BulletList items={r.education} />
        </ResultCard>

        <ResultCard title="Experience Required">
          <BulletList items={r.experience} />
        </ResultCard>

        <ResultCard title="Key Skills">
          <BulletList items={r.skills} />
        </ResultCard>

        <ResultCard title="Certifications / Licenses">
          <BulletList items={r.certifications} />
        </ResultCard>
      </div>

      {/* Career Progression */}
      <ResultCard
        title="Career Progression (Entry → Senior)"
        icon={<ArrowRight className="w-4 h-4 text-slate-500" />}
      >
        <div className="flex items-center gap-2 flex-wrap">
          {(r.progression || []).map((stage, i) => (
            <div key={i} className="flex items-center gap-2">
              <div className="text-center min-w-[140px] max-w-[180px]">
                <span className="inline-block bg-slate-100 text-slate-700 text-xs font-semibold px-2 py-0.5 rounded-full mb-1">
                  {stage.level}
                </span>
                <p className="text-sm font-medium text-slate-800">{stage.title}</p>
                <p className="text-xs text-slate-500">{stage.description}</p>
                {stage.wage && <p className="text-xs text-slate-400 mt-0.5">{stage.wage}</p>}
              </div>
              {i < (r.progression || []).length - 1 && (
                <ArrowRight className="w-4 h-4 text-slate-300 shrink-0" />
              )}
            </div>
          ))}
        </div>
      </ResultCard>

      {/* Gap Analysis */}
      <ResultCard
        title="Gap Analysis"
        icon={<AlertTriangle className="w-4 h-4 text-amber-500" />}
      >
        {r.strengths?.length > 0 && (
          <div className="mb-3">
            <p className="text-sm font-semibold text-emerald-700 mb-1">Strengths</p>
            <ul className="space-y-1">
              {r.strengths.map((s, i) => (
                <li key={i} className="text-sm text-slate-600 flex gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                  <span>{s}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
        <p className="text-sm font-semibold text-amber-700 mb-1">Gaps to Close</p>
        {(r.gaps || []).length === 0 ? (
          <p className="text-sm text-slate-500">No gaps identified.</p>
        ) : (
          <ul className="space-y-2">
            {r.gaps.map((g, i) => (
              <li key={i} className="border-l-2 border-amber-400 pl-3">
                <p className="text-sm font-medium text-slate-800">{g.area}</p>
                {g.current && <p className="text-xs text-slate-500">Current: {g.current}</p>}
                {g.required && <p className="text-xs text-slate-500">Required: {g.required}</p>}
                {g.note && <p className="text-xs text-slate-400 mt-0.5">{g.note}</p>}
              </li>
            ))}
          </ul>
        )}
      </ResultCard>

      {/* Action Plan */}
      <ResultCard
        title="Action Plan — Closing the Gaps"
        icon={<ListChecks className="w-4 h-4 text-blue-500" />}
      >
        {(r.action_plan || []).length === 0 ? (
          <p className="text-sm text-slate-500">No action steps generated.</p>
        ) : (
          <ol className="space-y-2">
            {r.action_plan.map((step, i) => (
              <li key={i} className="flex gap-3 items-start">
                <span className="w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                  {step.step || i + 1}
                </span>
                <div className="text-sm text-slate-600">
                  <span>{step.action}</span>
                  {step.closes_gap && (
                    <span className="block text-xs text-blue-600 mt-0.5">Closes gap: {step.closes_gap}</span>
                  )}
                  {step.duration && (
                    <span className="text-slate-400 ml-1 text-xs">({step.duration})</span>
                  )}
                </div>
              </li>
            ))}
          </ol>
        )}
      </ResultCard>
    </div>
  );
}