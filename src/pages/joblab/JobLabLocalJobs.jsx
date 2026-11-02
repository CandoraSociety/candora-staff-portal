import { useEffect, useMemo, useState } from 'react';
import { Search, Briefcase } from 'lucide-react';
import { callJobLab } from '@/lib/joblab/api';
import { JLInput, JLEmpty } from '@/components/joblab/ui';
import LocalJobCard from '@/components/joblab/LocalJobCard';
import { EMPLOYMENT_TYPES } from '@/lib/joblab/constants';
import { useToast } from '@/components/ui/use-toast';

export default function JobLabLocalJobs() {
  const { toast } = useToast();
  const [jobs, setJobs] = useState([]);
  const [savedKeys, setSavedKeys] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [type, setType] = useState('all');
  const [savingId, setSavingId] = useState(null);

  useEffect(() => {
    let cancelled = false;
    Promise.all([callJobLab('localJobs'), callJobLab('listApplications')])
      .then(([jobsData, appsData]) => {
        if (cancelled) return;
        setJobs(jobsData.items || []);
        setSavedKeys((appsData.items || []).map((app) => `${app.company}|${app.position}`.toLowerCase()));
      })
      .catch((error) => toast({ title: error.message, variant: 'destructive' }))
      .finally(() => !cancelled && setLoading(false));
    return () => { cancelled = true; };
  }, []);

  const visible = useMemo(() => {
    const text = query.trim().toLowerCase();
    return jobs.filter((job) => {
      if (type !== 'all' && job.employment_type !== type) return false;
      if (!text) return true;
      return [job.title, job.employer_name, job.location, job.description]
        .filter(Boolean)
        .some((value) => value.toLowerCase().includes(text));
    });
  }, [jobs, query, type]);

  const saveJob = async (job) => {
    setSavingId(job.id);
    try {
      await callJobLab('createApplication', {
        data: {
          company: job.employer_name,
          position: job.title,
          location: job.location || '',
          salary_range: job.wage || '',
          job_url: job.apply_url || '',
          status: 'saved',
          deadline: job.closing_date || '',
          how_to_apply: job.apply_url ? 'online' : job.contact_email ? 'email' : 'other',
          application_instructions: job.how_to_apply || '',
          job_description: [job.description, ...(job.requirements || [])].filter(Boolean).join('\n'),
        },
      });
      setSavedKeys((prev) => [...prev, `${job.employer_name}|${job.title}`.toLowerCase()]);
      toast({ title: 'Saved to your tracker' });
    } catch (error) {
      toast({ title: error.message, variant: 'destructive' });
    } finally {
      setSavingId(null);
    }
  };

  return (
    <div>
      <div className="mb-5">
        <h1 className="jl-heading text-2xl font-bold text-jl-fg sm:text-3xl">Local job board</h1>
        <p className="mt-1 text-sm text-jl-muted-fg">
          Jobs posted by Candora and local employers. Save any that interest you to your applications.
        </p>
      </div>

      <div className="mb-4 flex flex-wrap gap-2">
        <div className="relative min-w-[220px] flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-jl-muted-fg" />
          <JLInput
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search job title, employer or area"
            className="pl-9"
          />
        </div>
      </div>

      <div className="mb-4 flex flex-wrap gap-1.5">
        <button
          onClick={() => setType('all')}
          className={`rounded-full px-3 py-1 text-xs font-semibold ${type === 'all' ? 'bg-jl-primary text-jl-primary-fg' : 'bg-jl-secondary text-jl-muted-fg'}`}
        >
          All ({jobs.length})
        </button>
        {EMPLOYMENT_TYPES.map((option) => {
          const count = jobs.filter((job) => job.employment_type === option.value).length;
          if (!count) return null;
          return (
            <button
              key={option.value}
              onClick={() => setType(option.value)}
              className={`rounded-full px-3 py-1 text-xs font-semibold ${type === option.value ? 'bg-jl-primary text-jl-primary-fg' : 'bg-jl-secondary text-jl-muted-fg'}`}
            >
              {option.label} ({count})
            </button>
          );
        })}
      </div>

      {loading ? (
        <p className="py-10 text-center text-sm text-jl-muted-fg">Loading jobs…</p>
      ) : visible.length === 0 ? (
        <JLEmpty
          icon={Briefcase}
          title="No local jobs posted right now."
          hint="Check back soon, or use Find jobs to search openings online in the meantime."
        />
      ) : (
        <div className="space-y-3">
          {visible.map((job) => (
            <LocalJobCard
              key={job.id}
              job={job}
              saved={savedKeys.includes(`${job.employer_name}|${job.title}`.toLowerCase())}
              saving={savingId === job.id}
              onSave={() => saveJob(job)}
            />
          ))}
        </div>
      )}
    </div>
  );
}