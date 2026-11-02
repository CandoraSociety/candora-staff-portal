import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, MapPin } from 'lucide-react';
import { callJobLab } from '@/lib/joblab/api';
import { EMPLOYMENT_TYPE_LABELS } from '@/lib/joblab/constants';

// A small teaser of the local job board on the dashboard, so posted jobs are
// visible without opening the board itself.
export default function LocalJobsStrip() {
  const [jobs, setJobs] = useState([]);

  useEffect(() => {
    callJobLab('localJobs')
      .then((data) => setJobs((data.items || []).slice(0, 3)))
      .catch(() => {});
  }, []);

  if (jobs.length === 0) return null;

  return (
    <section>
      <div className="mb-3 flex items-end justify-between">
        <h2 className="jl-heading text-base font-semibold text-jl-fg">Local job board</h2>
        <Link to="/joblab/local-jobs" className="inline-flex items-center gap-1 text-xs font-semibold text-jl-primary">
          See all jobs <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>
      <div className="grid gap-2.5 sm:grid-cols-3">
        {jobs.map((job) => (
          <Link
            key={job.id}
            to="/joblab/local-jobs"
            className="rounded-xl border border-jl-border bg-white p-3.5 transition-colors hover:border-jl-gold/60 hover:bg-jl-gold/5"
          >
            <p className="text-sm font-semibold text-jl-fg">{job.title}</p>
            <p className="text-xs text-jl-muted-fg">{job.employer_name}</p>
            <div className="mt-1.5 flex flex-wrap items-center gap-x-2 text-[11px] text-jl-muted-fg">
              {job.location && <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{job.location}</span>}
              <span>{EMPLOYMENT_TYPE_LABELS[job.employment_type] || 'Full-time'}</span>
            </div>
            {job.wage && <p className="mt-1 text-[11px] font-semibold text-jl-primary">{job.wage}</p>}
          </Link>
        ))}
      </div>
    </section>
  );
}