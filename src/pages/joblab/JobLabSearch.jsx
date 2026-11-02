import { useEffect, useMemo, useState } from 'react';
import { Search, MapPin, Briefcase, ExternalLink, Check, Loader2 } from 'lucide-react';
import { useParticipant } from '@/lib/joblab/ParticipantContext';
import { callJobLab } from '@/lib/joblab/api';
import { JLBadge, JLButton, JLCard, JLEmpty, JLInput, JLTabs } from '@/components/joblab/ui';
import { useToast } from '@/components/ui/use-toast';

const JOB_SITES = [
  { name: 'Indeed Canada', base: 'https://ca.indeed.com/jobs?q=', description: 'Largest general job board in Canada.' },
  { name: 'Job Bank Canada', base: 'https://www.jobbank.gc.ca/jobsearch/jobsearch?searchstring=', description: 'Government of Canada listings.' },
  { name: 'LinkedIn Jobs', base: 'https://www.linkedin.com/jobs/search/?keywords=', description: 'Professional and networking-led roles.' },
  { name: 'Glassdoor', base: 'https://www.glassdoor.ca/Job/jobs.htm?sc.keyword=', description: 'Jobs plus company reviews and pay.' },
  { name: 'ALIS Alberta', base: 'https://alis.alberta.ca/look-for-work/', description: 'Alberta career and job search tools.', noQuery: true },
];

export default function JobLabSearch() {
  const { participant } = useParticipant();
  const { toast } = useToast();

  const [query, setQuery] = useState('');
  const [location, setLocation] = useState('Alberta');
  const [jobs, setJobs] = useState([]);
  const [searching, setSearching] = useState(false);
  const [searched, setSearched] = useState(false);
  const [prefilled, setPrefilled] = useState(false);
  const [savedTitles, setSavedTitles] = useState([]);
  const [savingTitle, setSavingTitle] = useState(null);
  const [tab, setTab] = useState('results');

  // Seed the box from the participant's own profile the first time through.
  useEffect(() => {
    if (prefilled) return;
    const skills = (participant?.skills || []).slice(0, 2).join(', ');
    const latestRole = (participant?.experience || [])[0]?.title || '';
    const seed = skills || latestRole;
    if (seed) {
      setQuery(seed);
      setPrefilled(true);
    }
  }, [participant, prefilled]);

  const encodedQuery = useMemo(() => encodeURIComponent(query || 'jobs'), [query]);

  const runSearch = async (event) => {
    event?.preventDefault();
    if (searching) return;
    if (!query.trim()) {
      toast({ title: 'Enter a job title or skill to search.', variant: 'destructive' });
      return;
    }
    setSearching(true);
    setSearched(true);
    setTab('results');
    try {
      const data = await callJobLab('aiJobs', { query, location });
      setJobs(data.jobs || []);
    } catch (error) {
      toast({ title: error.message, variant: 'destructive' });
      setJobs([]);
    } finally {
      setSearching(false);
    }
  };

  const saveToTracker = async (job) => {
    setSavingTitle(job.title);
    try {
      await callJobLab('createApplication', {
        data: {
          company: job.company,
          position: job.title,
          location: job.location,
          salary_range: job.salary,
          job_description: job.description,
          status: 'saved',
        },
      });
      setSavedTitles((prev) => [...prev, job.title]);
      toast({ title: `"${job.title}" saved to your Job Tracker!` });
    } catch (error) {
      toast({ title: error.message, variant: 'destructive' });
    } finally {
      setSavingTitle(null);
    }
  };

  return (
    <div>
      <div className="mb-5">
        <h1 className="jl-heading text-2xl font-bold text-jl-fg sm:text-3xl">Job Search</h1>
        <p className="mt-1 text-sm text-jl-muted-fg">Find opportunities tailored to your experience and skills</p>
      </div>

      <JLCard className="mb-5 p-4">
        <form onSubmit={runSearch} className="flex flex-col gap-2 sm:flex-row">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-jl-muted-fg" />
            <JLInput
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Job title, skills, or keywords…"
              className="pl-9"
            />
          </div>
          <div className="relative sm:w-52">
            <MapPin className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-jl-muted-fg" />
            <JLInput value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Location" className="pl-9" />
          </div>
          <JLButton type="submit" disabled={searching}>
            {searching ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />} Search
          </JLButton>
        </form>
      </JLCard>

      <JLTabs
        className="mb-4"
        value={tab}
        onChange={setTab}
        tabs={[
          { value: 'results', label: 'AI Results' },
          { value: 'sites', label: 'Job Sites' },
        ]}
      />

      {tab === 'results' && (
        <div>
          {searching ? (
            <div className="flex flex-col items-center justify-center py-16">
              <Loader2 className="h-8 w-8 animate-spin text-jl-primary" />
              <p className="mt-3 text-sm text-jl-muted-fg">Searching for jobs…</p>
            </div>
          ) : jobs.length > 0 ? (
            <div className="space-y-3">
              {jobs.map((job, index) => {
                const saved = savedTitles.includes(job.title);
                return (
                  <JLCard key={`${job.title}-${index}`} className="p-4">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="jl-heading text-base font-semibold text-jl-fg">{job.title}</h3>
                          {job.type && <JLBadge className="bg-jl-secondary text-jl-muted-fg">{job.type}</JLBadge>}
                          {job.match_score >= 80 && (
                            <JLBadge className="bg-jl-success/10 text-jl-success">Great match</JLBadge>
                          )}
                        </div>
                        <p className="mt-0.5 text-sm text-jl-fg">{job.company}</p>
                        <p className="text-xs text-jl-muted-fg">{job.location}</p>
                      </div>
                      <JLButton
                        size="sm"
                        variant={saved ? 'outline' : 'primary'}
                        disabled={saved || savingTitle === job.title}
                        onClick={() => saveToTracker(job)}
                        className={saved ? 'border-jl-success/40 text-jl-success' : ''}
                      >
                        {saved ? <><Check className="h-3.5 w-3.5" /> Saved</> : savingTitle === job.title ? 'Saving…' : 'Save to Tracker'}
                      </JLButton>
                    </div>

                    <p className="mt-3 line-clamp-2 text-sm text-jl-muted-fg">{job.description}</p>

                    <div className="mt-3 flex flex-wrap gap-2">
                      {job.salary && <JLBadge className="bg-jl-secondary text-jl-fg">{job.salary}</JLBadge>}
                      {job.posted && <JLBadge className="bg-jl-secondary text-jl-muted-fg">{job.posted}</JLBadge>}
                    </div>
                  </JLCard>
                );
              })}
              <p className="pt-2 text-center text-[11px] text-jl-muted-fg">
                These results are AI-generated suggestions. Use the Job Sites tab to search real job postings.
              </p>
            </div>
          ) : searched ? (
            <JLEmpty icon={Search} title="No results found. Try different keywords." />
          ) : (
            <JLEmpty
              icon={Briefcase}
              title="Enter a search term to find matching jobs"
              hint={prefilled && query ? "We've pre-filled based on your profile skills" : undefined}
            />
          )}
        </div>
      )}

      {tab === 'sites' && (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {JOB_SITES.map((site) => (
            <a
              key={site.name}
              href={site.noQuery ? site.base : `${site.base}${encodedQuery}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              <JLCard className="flex h-full items-start justify-between gap-3 p-4 transition-shadow hover:shadow-md">
                <div>
                  <p className="text-sm font-semibold text-jl-fg">{site.name}</p>
                  <p className="mt-0.5 text-xs text-jl-muted-fg">{site.description}</p>
                </div>
                <ExternalLink className="mt-0.5 h-4 w-4 shrink-0 text-jl-muted-fg" />
              </JLCard>
            </a>
          ))}
          <p className="sm:col-span-2 text-[11px] text-jl-muted-fg">
            {query ? `Links open with "${query}" already searched.` : 'Type a search above to pre-fill these sites.'}
          </p>
        </div>
      )}
    </div>
  );
}