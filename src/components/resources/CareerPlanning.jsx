import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Sparkles, User } from 'lucide-react';
import ClientPicker from './ClientPicker';
import CareerPlanResults from './CareerPlanResults';
import {
  deriveClientBackground,
  buildPrompt,
  CAREER_PLAN_SCHEMA,
} from './careerPlanningLogic';

const EMPTY_BG = { education: '', experience: '', skills: '', training: '', objective: '' };

export default function CareerPlanning() {
  const [clientId, setClientId] = useState(null);
  const [jobType, setJobType] = useState('');
  const [location, setLocation] = useState('Alberta, Canada');
  const [background, setBackground] = useState(EMPTY_BG);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const { data: clients = [] } = useQuery({
    queryKey: ['clients-career-planning'],
    queryFn: () => base44.entities.Client.list('-last_name', 1000),
  });

  const activeClients = useMemo(
    () => (clients || []).filter((c) => c.status !== 'closed'),
    [clients]
  );

  const selectedClient = (activeClients || []).find((c) => c.id === clientId) || null;

  const handleSelectClient = (id) => {
    setClientId(id);
    if (id) {
      const c = (activeClients || []).find((x) => x.id === id);
      setBackground(c ? deriveClientBackground(c) : EMPTY_BG);
    } else {
      // manual entry — clear the auto-filled background
      setBackground(EMPTY_BG);
    }
    setResult(null);
    setError(null);
  };

  const setField = (key, value) => setBackground((b) => ({ ...b, [key]: value }));

  const resumeUrls = (selectedClient?.resume_urls || []).filter(Boolean);
  const hasResume = resumeUrls.length > 0;

  const generate = async (targetJob) => {
    const rawJob = targetJob || jobType;
    const job = (rawJob && typeof rawJob === 'string' ? rawJob : String(rawJob || '')).trim();
    if (!job) return;
    setLoading(true);
    setError(null);
    try {
      const clientName = selectedClient
        ? `${selectedClient.first_name || ''} ${selectedClient.last_name || ''}`.trim()
        : '';
      const prompt = buildPrompt(background, job, location, !!selectedClient, clientName, hasResume);
      const res = await base44.integrations.Core.InvokeLLM({
        prompt,
        response_json_schema: CAREER_PLAN_SCHEMA,
        ...(hasResume ? { file_urls: resumeUrls } : {}),
      });
      setResult(res);
    } catch (e) {
      setError(e?.message || 'Failed to generate the career plan.');
    } finally {
      setLoading(false);
    }
  };

  // Refine the search by clicking a suggested job title — sets it as the new
  // target and re-runs the plan with the same client/background.
  const refineJob = (title) => {
    if (!title || loading) return;
    const t = typeof title === 'string' ? title : (String(title?.title || title?.name || title || ''));
    if (!t.trim()) return;
    setJobType(t);
    generate(t);
    if (typeof window !== 'undefined') window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const reset = () => {
    setResult(null);
    setError(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-start gap-3">
        <div className="w-9 h-9 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
          <Sparkles className="w-5 h-5 text-blue-600" />
        </div>
        <div>
          <h3 className="font-semibold text-slate-800">Client Career Planning</h3>
          <p className="text-sm text-muted-foreground">
            Select a program participant, choose a target job, and generate the role requirements,
            career progression, a gap analysis against the client's background, and a step-by-step
            plan to close the gaps. Leave the client blank to fill in the background manually.
          </p>
        </div>
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <User className="w-4 h-4 text-slate-500" /> Target Role
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-sm font-medium text-slate-700 block mb-1">Program Participant</label>
            <ClientPicker clients={activeClients} value={clientId} onChange={handleSelectClient} />
            <p className="text-xs text-slate-400 mt-1">
              Optional — selecting a client auto-fills their background below (you can still edit it).
            </p>
          </div>

          <div className="grid sm:grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-medium text-slate-700 block mb-1">Job Type / Career Goal</label>
              <Input
                value={jobType}
                onChange={(e) => setJobType(e.target.value)}
                placeholder="e.g. Dental Assistant, Warehouse Worker, Early Childhood Educator"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700 block mb-1">Location</label>
              <Input value={location} onChange={(e) => setLocation(e.target.value)} />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">
            Client Background {selectedClient ? `(${selectedClient.first_name} ${selectedClient.last_name})` : '(Manual Entry)'}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {!selectedClient && (
            <p className="text-xs text-slate-500 bg-slate-50 border border-slate-200 rounded p-2">
              No client selected — enter the client's education, experience, skills, and training below
              to run the gap analysis manually.
            </p>
          )}
          {hasResume && (
            <p className="text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 rounded p-2">
              {resumeUrls.length} resume(s) on file — the client's resume will be read and assessed as part of the gap analysis.
            </p>
          )}
          <div>
            <label className="text-sm font-medium text-slate-700 block mb-1">Education</label>
            <Textarea
              rows={2}
              value={background.education}
              onChange={(e) => setField('education', e.target.value)}
              placeholder="e.g. High school diploma, LINC Level 5, Bachelor of Commerce (home country)…"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-slate-700 block mb-1">Work Experience</label>
            <Textarea
              rows={2}
              value={background.experience}
              onChange={(e) => setField('experience', e.target.value)}
              placeholder="e.g. 3 years food service in home country, 1 year cleaning in Canada…"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-slate-700 block mb-1">Skills & Strengths</label>
            <Textarea
              rows={2}
              value={background.skills}
              onChange={(e) => setField('skills', e.target.value)}
              placeholder="e.g. customer service, physical work, attention to detail, working with children…"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-slate-700 block mb-1">Training / Certifications Completed</label>
            <Textarea
              rows={2}
              value={background.training}
              onChange={(e) => setField('training', e.target.value)}
              placeholder="e.g. First Aid, Food Safety, Job Search Workshop, ELL Classes…"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-slate-700 block mb-1">Career Objective</label>
            <Input
              value={background.objective}
              onChange={(e) => setField('objective', e.target.value)}
              placeholder="What the client is aiming for (optional — defaults to the job type above)"
            />
          </div>
        </CardContent>
      </Card>

      {error && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded p-3">{error}</p>
      )}

      <div className="flex items-center gap-3">
        <Button onClick={generate} disabled={!jobType.trim() || loading}>
          {loading && <Loader2 className="w-4 h-4 mr-1 animate-spin" />}
          {loading ? 'Generating plan…' : 'Generate Career Plan'}
        </Button>
        {result && (
          <Button variant="outline" onClick={reset}>Clear Results</Button>
        )}
      </div>

      {loading && (
        <div className="flex items-center justify-center py-12 text-sm text-slate-400 gap-2">
          <Loader2 className="w-5 h-5 animate-spin" /> Building the career plan…
        </div>
      )}

      {result && !loading && (
        <CareerPlanResults
          result={result}
          jobType={jobType}
          clientName={selectedClient ? `${selectedClient.first_name} ${selectedClient.last_name}`.trim() : null}
          hasResume={hasResume}
          onRefineJob={refineJob}
        />
      )}
    </div>
  );
}