import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowRight, CheckCircle2, AlertTriangle, ListChecks, HardHat, FileText, Building2, GraduationCap, ClipboardList, ExternalLink } from 'lucide-react';

const FIT_STYLES = {
  strong: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  moderate: 'bg-amber-50 text-amber-700 border-amber-200',
  weak: 'bg-slate-50 text-slate-500 border-slate-200',
};

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

      {/* Entry-Level Employers */}
      <ResultCard
        title="Companies That Frequently Hire Entry-Level"
        icon={<Building2 className="w-4 h-4 text-slate-500" />}
      >
        {(r.entry_level_employers || []).length === 0 ? (
          <p className="text-sm text-slate-500">No employer suggestions generated.</p>
        ) : (
          <div className="grid sm:grid-cols-2 gap-2">
            {r.entry_level_employers.map((emp, i) => (
              <div key={i} className="border border-slate-200 rounded-lg p-2.5">
                <p className="text-sm font-semibold text-slate-800">{emp.name}</p>
                {emp.hires_for && <p className="text-xs text-slate-600 mt-0.5">{emp.hires_for}</p>}
                {emp.region && (
                  <p className="text-xs text-slate-400 mt-1 flex items-center gap-1">
                    <span className="inline-block w-1.5 h-1.5 rounded-full bg-slate-400" />
                    {emp.region}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </ResultCard>

      {/* Jobsite Expectations */}
      <ResultCard
        title="What to Expect on the Jobsite"
        icon={<HardHat className="w-4 h-4 text-amber-600" />}
      >
        {(() => {
          const j = r.jobsite_expectations || {};
          const rows = [
            ['Work Environment & Conditions', j.work_environment],
            ['Safety & Onboarding', j.safety_and_onboarding],
            ['Workplace Culture', j.workplace_culture],
            ['First-Month Realities', j.first_month_realities],
          ].filter(([, v]) => v);
          return rows.length === 0 ? (
            <p className="text-sm text-slate-500">No jobsite guidance generated.</p>
          ) : (
            <div className="space-y-3">
              {rows.map(([label, val], i) => (
                <div key={i}>
                  <p className="text-sm font-semibold text-slate-700">{label}</p>
                  <p className="text-sm text-slate-600 mt-0.5">{val}</p>
                </div>
              ))}
            </div>
          );
        })()}
      </ResultCard>

      {/* Resume & Cover Letter Tailoring */}
      <ResultCard
        title="Resume & Cover Letter Tailoring"
        icon={<FileText className="w-4 h-4 text-blue-600" />}
      >
        {(() => {
          const t = r.resume_tailoring || {};
          const hasAny = t.highlight_on_resume?.length || t.ats_keywords?.length || t.credentials_to_emphasize?.length || t.transferable_experience_framing || t.cover_letter_focus;
          if (!hasAny) {
            return <p className="text-sm text-slate-500">No resume tailoring guidance generated.</p>;
          }
          return (
            <div className="space-y-4">
              {t.highlight_on_resume?.length > 0 && (
                <div>
                  <p className="text-sm font-semibold text-slate-700 mb-1">Highlight at the Top of the Resume</p>
                  <BulletList items={t.highlight_on_resume} />
                </div>
              )}
              {t.ats_keywords?.length > 0 && (
                <div>
                  <p className="text-sm font-semibold text-slate-700 mb-1">ATS Keywords to Include</p>
                  <div className="flex flex-wrap gap-1.5">
                    {t.ats_keywords.map((kw, i) => (
                      <span key={i} className="text-xs bg-blue-50 text-blue-700 border border-blue-200 px-2 py-0.5 rounded-full">{kw}</span>
                    ))}
                  </div>
                </div>
              )}
              {t.transferable_experience_framing && (
                <div>
                  <p className="text-sm font-semibold text-slate-700">Framing Transferable Experience</p>
                  <p className="text-sm text-slate-600 mt-0.5">{t.transferable_experience_framing}</p>
                </div>
              )}
              {t.cover_letter_focus && (
                <div>
                  <p className="text-sm font-semibold text-slate-700">Cover Letter Focus</p>
                  <p className="text-sm text-slate-600 mt-0.5">{t.cover_letter_focus}</p>
                </div>
              )}
              {t.credentials_to_emphasize?.length > 0 && (
                <div>
                  <p className="text-sm font-semibold text-slate-700 mb-1">Credentials to Make Prominent</p>
                  <BulletList items={t.credentials_to_emphasize} />
                </div>
              )}
            </div>
          );
        })()}
      </ResultCard>

      {/* Counsellor Aptitude Guide */}
      <ResultCard
        title="Counsellor Aptitude & Suitability Guide"
        icon={<ClipboardList className="w-4 h-4 text-indigo-500" />}
        subtitle="For the career counsellor — how to assess this client's fit for the path"
      >
        {(() => {
          const g = r.counsellor_aptitude_guide || {};
          const hasAny = g.aptitudes_to_probe?.length || g.assessment_questions?.length || g.red_flags?.length || g.positive_indicators_from_background?.length || g.suitability_summary;
          if (!hasAny) {
            return <p className="text-sm text-slate-500">No aptitude guidance generated.</p>;
          }
          return (
            <div className="space-y-4">
              {g.aptitudes_to_probe?.length > 0 && (
                <div>
                  <p className="text-sm font-semibold text-slate-700 mb-1">Aptitudes & Traits to Probe</p>
                  <BulletList items={g.aptitudes_to_probe} />
                </div>
              )}
              {g.assessment_questions?.length > 0 && (
                <div>
                  <p className="text-sm font-semibold text-slate-700 mb-1">Assessment Questions to Ask</p>
                  <ul className="space-y-1">
                    {g.assessment_questions.map((q, i) => (
                      <li key={i} className="text-sm text-slate-600 flex gap-2 italic">
                        <span className="text-slate-400 mt-0.5">?</span>
                        <span>"{q}"</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {g.positive_indicators_from_background?.length > 0 && (
                <div>
                  <p className="text-sm font-semibold text-emerald-700 mb-1">Positive Indicators from Their Background</p>
                  <ul className="space-y-1">
                    {g.positive_indicators_from_background.map((s, i) => (
                      <li key={i} className="text-sm text-slate-600 flex gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                        <span>{s}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {g.red_flags?.length > 0 && (
                <div>
                  <p className="text-sm font-semibold text-amber-700 mb-1">Red Flags to Watch For</p>
                  <ul className="space-y-1">
                    {g.red_flags.map((f, i) => (
                      <li key={i} className="text-sm text-slate-600 flex gap-2">
                        <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                        <span>{f}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {g.suitability_summary && (
                <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-3">
                  <p className="text-sm font-semibold text-indigo-700 mb-0.5">Suitability Summary</p>
                  <p className="text-sm text-slate-700">{g.suitability_summary}</p>
                </div>
              )}
            </div>
          );
        })()}
      </ResultCard>

      {/* Internal Training Match */}
      <ResultCard
        title="Recommended Candora Internal Training"
        icon={<GraduationCap className="w-4 h-4 text-slate-500" />}
        subtitle="In-house placements that build transferable skills for this path"
      >
        {(r.internal_training_match || []).length === 0 ? (
          <p className="text-sm text-slate-500">No internal training recommendations generated.</p>
        ) : (
          <div className="space-y-3">
            {r.internal_training_match.map((m, i) => {
              const fit = (m.fit_rating || 'moderate').toLowerCase();
              const style = FIT_STYLES[fit] || FIT_STYLES.moderate;
              return (
                <div key={i} className="border border-slate-200 rounded-lg p-3">
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <p className="text-sm font-semibold text-slate-800">{m.placement}</p>
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full border ${style}`}>
                      {fit} fit
                    </span>
                  </div>
                  {m.why && <p className="text-sm text-slate-600">{m.why}</p>}
                  {m.skills_gained?.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {m.skills_gained.map((s, j) => (
                        <span key={j} className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">{s}</span>
                      ))}
                    </div>
                  )}
                  {m.resume_positioning && (
                    <p className="text-xs text-slate-500 mt-2">
                      <span className="font-medium text-slate-600">Resume tip:</span> {m.resume_positioning}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </ResultCard>

      {/* External Training Vendors */}
      <ResultCard
        title="External Training Providers (Alberta)"
        icon={<GraduationCap className="w-4 h-4 text-emerald-600" />}
        subtitle="Real third-party providers offering relevant programs — click through to enrol"
      >
        {(r.external_training_vendors || []).length === 0 ? (
          <p className="text-sm text-slate-500">No external training vendors generated.</p>
        ) : (
          <div className="space-y-3">
            {r.external_training_vendors.map((v, i) => {
              const fit = (v.fit_rating || 'moderate').toLowerCase();
              const style = FIT_STYLES[fit] || FIT_STYLES.moderate;
              const url = v.url && /^(https?:)?\/\//i.test(v.url) ? v.url : null;
              return (
                <div key={i} className="border border-slate-200 rounded-lg p-3">
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <p className="text-sm font-semibold text-slate-800">
                      {url ? (
                        <a href={url} target="_blank" rel="noopener noreferrer" className="text-blue-700 hover:underline inline-flex items-center gap-1">
                          {v.name} <ExternalLink className="w-3 h-3" />
                        </a>
                      ) : (
                        v.name
                      )}
                    </p>
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full border ${style}`}>
                      {fit} fit
                    </span>
                  </div>
                  {v.programs_offered && <p className="text-sm text-slate-600">{v.programs_offered}</p>}
                  <div className="flex flex-wrap gap-1.5 mt-2 text-xs">
                    {v.format && (
                      <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full capitalize">{v.format}</span>
                    )}
                    {v.region && (
                      <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">{v.region}</span>
                    )}
                  </div>
                  {v.cost_note && (
                    <p className="text-xs text-slate-500 mt-2">
                      <span className="font-medium text-slate-600">Cost:</span> {v.cost_note}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </ResultCard>
    </div>
  );
}