import { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowRight, ArrowLeft, Loader2 } from 'lucide-react';

function ResultCard({ title, children }) {
  return (
    <Card>
      <CardHeader className="pb-2 pt-4 px-4">
        <CardTitle className="text-sm font-semibold text-slate-700">{title}</CardTitle>
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

export default function CareerPlanning() {
  const [mode, setMode] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  // Forward mode
  const [jobType, setJobType] = useState('');
  const [location, setLocation] = useState('Alberta, Canada');

  // Reverse mode
  const [education, setEducation] = useState('');
  const [experience, setExperience] = useState('');
  const [skills, setSkills] = useState('');

  const reset = () => {
    setMode(null);
    setResult(null);
    setError(null);
    setJobType('');
    setEducation('');
    setExperience('');
    setSkills('');
  };

  const runForward = async () => {
    setLoading(true);
    setError(null);
    const res = await base44.integrations.Core.InvokeLLM({
      prompt: `You are a Canadian career counsellor. Given the job type "${jobType}" in ${location}, provide a detailed career profile including:\n1. Typical job titles in this field\n2. Required education (credentials, certificates, degrees)\n3. Required/preferred experience\n4. Key skills and competencies\n5. Typical wage range (hourly and annual) in Alberta, Canada\n6. Career progression pathway (entry → mid → senior level)\n7. Suggested training plan for someone starting from scratch (step by step)\n8. Relevant certifications or licenses required in Alberta\n\nBe practical and specific. Format clearly with sections.`,
      response_json_schema: {
        type: 'object',
        properties: {
          job_titles: { type: 'array', items: { type: 'string' } },
          education: { type: 'array', items: { type: 'string' } },
          experience: { type: 'array', items: { type: 'string' } },
          skills: { type: 'array', items: { type: 'string' } },
          wage_range: {
            type: 'object',
            properties: {
              hourly_min: { type: 'string' },
              hourly_max: { type: 'string' },
              annual_min: { type: 'string' },
              annual_max: { type: 'string' },
            },
          },
          career_progression: {
            type: 'array',
            items: { type: 'object', properties: { level: { type: 'string' }, description: { type: 'string' } } },
          },
          training_plan: {
            type: 'array',
            items: { type: 'object', properties: { step: { type: 'number' }, action: { type: 'string' }, duration: { type: 'string' } } },
          },
          certifications: { type: 'array', items: { type: 'string' } },
        },
      },
    });
    setResult(res);
    setLoading(false);
  };

  const runReverse = async () => {
    setLoading(true);
    setError(null);
    const res = await base44.integrations.Core.InvokeLLM({
      prompt: `You are a Canadian career counsellor. A client has the following background:\nEducation: ${education}\nWork Experience: ${experience}\nSkills: ${skills}\nLocation: Alberta, Canada\n\nBased on this profile:\n1. List job types/careers they currently qualify for (ready now)\n2. List job types/careers within reach with some additional training (1-2 years)\n3. List longer-term career goals that are achievable (3-5 years)\n4. For each "within reach" career, provide a specific training plan to get there\n5. Highlight any transferable skills that are particularly valuable\n\nBe practical, encouraging, and specific to the Alberta labour market.`,
      response_json_schema: {
        type: 'object',
        properties: {
          qualify_now: {
            type: 'array',
            items: { type: 'object', properties: { title: { type: 'string' }, reason: { type: 'string' } } },
          },
          within_reach: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                title: { type: 'string' },
                gap: { type: 'string' },
                training_plan: { type: 'array', items: { type: 'string' } },
              },
            },
          },
          long_term: {
            type: 'array',
            items: { type: 'object', properties: { title: { type: 'string' }, path: { type: 'string' } } },
          },
          transferable_skills: { type: 'array', items: { type: 'string' } },
        },
      },
    });
    setResult(res);
    setLoading(false);
  };

  // Mode Selection
  if (!mode) {
    return (
      <div className="space-y-4">
        <p className="text-sm text-muted-foreground">Choose how you'd like to explore career options:</p>
        <div className="grid md:grid-cols-2 gap-4">
          <button
            onClick={() => setMode('forward')}
            className="text-left border rounded-lg p-5 hover:border-blue-400 hover:bg-blue-50 transition-colors group"
          >
            <div className="flex items-center gap-3 mb-2">
              <div className="w-9 h-9 rounded-full bg-blue-100 flex items-center justify-center group-hover:bg-blue-200 transition-colors">
                <ArrowRight className="w-5 h-5 text-blue-600" />
              </div>
              <span className="font-semibold text-slate-800">Explore a Career Path</span>
            </div>
            <p className="text-sm text-slate-500">I know what job I want — show me what education, experience, and training I need to get there.</p>
          </button>
          <button
            onClick={() => setMode('reverse')}
            className="text-left border rounded-lg p-5 hover:border-green-400 hover:bg-green-50 transition-colors group"
          >
            <div className="flex items-center gap-3 mb-2">
              <div className="w-9 h-9 rounded-full bg-green-100 flex items-center justify-center group-hover:bg-green-200 transition-colors">
                <ArrowLeft className="w-5 h-5 text-green-600" />
              </div>
              <span className="font-semibold text-slate-800">Find Matching Careers</span>
            </div>
            <p className="text-sm text-slate-500">I have experience and education — show me what careers I qualify for or can reach with training.</p>
          </button>
        </div>
      </div>
    );
  }

  // Forward Mode Form
  if (mode === 'forward' && !result) {
    return (
      <div className="space-y-4 max-w-lg">
        <div className="flex items-center gap-2">
          <button onClick={reset} className="text-sm text-muted-foreground hover:underline">← Back</button>
          <h3 className="font-semibold">Explore a Career Path</h3>
        </div>
        <div className="space-y-3">
          <div>
            <label className="text-sm font-medium text-slate-700 block mb-1">Job Type / Career Goal</label>
            <Input
              value={jobType}
              onChange={e => setJobType(e.target.value)}
              placeholder="e.g. Dental Assistant, Warehouse Worker, Early Childhood Educator"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-slate-700 block mb-1">Location</label>
            <Input value={location} onChange={e => setLocation(e.target.value)} />
          </div>
          {error && <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded p-3">{error}</p>}
          <Button onClick={runForward} disabled={!jobType || loading}>
            {loading && <Loader2 className="w-4 h-4 mr-1 animate-spin" />}
            {loading ? 'Generating...' : 'Generate Career Profile'}
          </Button>
        </div>
      </div>
    );
  }

  // Reverse Mode Form
  if (mode === 'reverse' && !result) {
    return (
      <div className="space-y-4 max-w-lg">
        <div className="flex items-center gap-2">
          <button onClick={reset} className="text-sm text-muted-foreground hover:underline">← Back</button>
          <h3 className="font-semibold">Find Matching Careers</h3>
        </div>
        <div className="space-y-3">
          <div>
            <label className="text-sm font-medium text-slate-700 block mb-1">Education Background</label>
            <Textarea
              rows={2}
              value={education}
              onChange={e => setEducation(e.target.value)}
              placeholder="e.g. High school diploma, LINC Level 5, ESL Certificate..."
            />
          </div>
          <div>
            <label className="text-sm font-medium text-slate-700 block mb-1">Work Experience</label>
            <Textarea
              rows={2}
              value={experience}
              onChange={e => setExperience(e.target.value)}
              placeholder="e.g. 3 years food service in home country, 1 year cleaning in Canada..."
            />
          </div>
          <div>
            <label className="text-sm font-medium text-slate-700 block mb-1">Skills & Strengths</label>
            <Textarea
              rows={2}
              value={skills}
              onChange={e => setSkills(e.target.value)}
              placeholder="e.g. customer service, physical work, attention to detail, working with children..."
            />
          </div>
          {error && <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded p-3">{error}</p>}
          <Button onClick={runReverse} disabled={(!education && !experience) || loading}>
            {loading && <Loader2 className="w-4 h-4 mr-1 animate-spin" />}
            {loading ? 'Finding options...' : 'Find My Career Options'}
          </Button>
        </div>
      </div>
    );
  }

  // Forward Mode Results
  if (mode === 'forward' && result) {
    const r = result;
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-lg">Career Profile: {jobType}</h3>
          <Button variant="outline" size="sm" onClick={reset}>New Search</Button>
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <ResultCard title="Job Titles in This Field">
            <BulletList items={r.job_titles} />
          </ResultCard>

          <ResultCard title="Wage Range (Alberta)">
            <p className="text-sm text-slate-600">
              <span className="font-medium">Hourly:</span> ${r.wage_range?.hourly_min} – ${r.wage_range?.hourly_max}
            </p>
            <p className="text-sm text-slate-600 mt-1">
              <span className="font-medium">Annual:</span> ${r.wage_range?.annual_min} – ${r.wage_range?.annual_max}
            </p>
          </ResultCard>

          <ResultCard title="Education Required">
            <BulletList items={r.education} />
          </ResultCard>

          <ResultCard title="Experience & Skills">
            <BulletList items={[...(r.experience || []), ...(r.skills || [])]} />
          </ResultCard>

          <ResultCard title="Certifications / Licenses">
            <BulletList items={r.certifications} />
          </ResultCard>

          <ResultCard title="Key Skills">
            <BulletList items={r.skills} />
          </ResultCard>
        </div>

        {/* Career Progression */}
        <ResultCard title="Career Progression">
          <div className="flex items-center gap-2 flex-wrap">
            {(r.career_progression || []).map((stage, i) => (
              <div key={i} className="flex items-center gap-2">
                <div className="text-center">
                  <span className="inline-block bg-slate-100 text-slate-700 text-xs font-semibold px-2 py-0.5 rounded-full mb-1">{stage.level}</span>
                  <p className="text-xs text-slate-500 max-w-[140px]">{stage.description}</p>
                </div>
                {i < (r.career_progression || []).length - 1 && (
                  <ArrowRight className="w-4 h-4 text-slate-300 shrink-0" />
                )}
              </div>
            ))}
          </div>
        </ResultCard>

        {/* Training Plan */}
        <ResultCard title="Training Plan (Step by Step)">
          <ol className="space-y-2">
            {(r.training_plan || []).map((step, i) => (
              <li key={i} className="flex gap-3 items-start">
                <span className="w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                  {step.step || i + 1}
                </span>
                <span className="text-sm text-slate-600">
                  {step.action}
                  {step.duration && <span className="text-slate-400 ml-1">({step.duration})</span>}
                </span>
              </li>
            ))}
          </ol>
        </ResultCard>
      </div>
    );
  }

  // Reverse Mode Results
  if (mode === 'reverse' && result) {
    const r = result;
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-lg">Your Career Options</h3>
          <Button variant="outline" size="sm" onClick={reset}>New Search</Button>
        </div>

        {r.transferable_skills?.length > 0 && (
          <ResultCard title="Your Transferable Skills">
            <div className="flex flex-wrap gap-2">
              {r.transferable_skills.map((skill, i) => (
                <span key={i} className="bg-blue-100 text-blue-700 text-xs px-2 py-1 rounded-full">{skill}</span>
              ))}
            </div>
          </ResultCard>
        )}

        {r.qualify_now?.length > 0 && (
          <ResultCard title="✅ Ready Now — Careers You Qualify For">
            <ul className="space-y-2">
              {r.qualify_now.map((item, i) => (
                <li key={i} className="text-sm text-slate-600">
                  <span className="font-semibold text-slate-800">{item.title}</span> — {item.reason}
                </li>
              ))}
            </ul>
          </ResultCard>
        )}

        {r.within_reach?.length > 0 && (
          <ResultCard title="🎯 Within Reach — With Some Training (1–2 Years)">
            <ul className="space-y-4">
              {r.within_reach.map((item, i) => (
                <li key={i} className="border-l-2 border-amber-400 pl-3">
                  <p className="text-sm font-semibold text-slate-800">{item.title}</p>
                  {item.gap && <p className="text-xs text-slate-500 mt-0.5">{item.gap}</p>}
                  {item.training_plan?.length > 0 && (
                    <ul className="mt-1 space-y-0.5">
                      {item.training_plan.map((step, j) => (
                        <li key={j} className="text-xs text-slate-600 flex gap-1">
                          <span className="text-amber-500">→</span> {step}
                        </li>
                      ))}
                    </ul>
                  )}
                </li>
              ))}
            </ul>
          </ResultCard>
        )}

        {r.long_term?.length > 0 && (
          <ResultCard title="🌟 Long-Term Goals (3–5 Years)">
            <ul className="space-y-2">
              {r.long_term.map((item, i) => (
                <li key={i} className="text-sm text-slate-600">
                  <span className="font-semibold text-slate-800">{item.title}</span> — {item.path}
                </li>
              ))}
            </ul>
          </ResultCard>
        )}
      </div>
    );
  }

  return null;
}