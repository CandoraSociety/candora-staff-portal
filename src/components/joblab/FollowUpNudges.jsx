import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { BellRing, Check } from 'lucide-react';
import { callJobLab } from '@/lib/joblab/api';
import { addDays } from '@/lib/joblab/constants';
import { useToast } from '@/components/ui/use-toast';

const FOLLOW_UP_STATUSES = ['applied', 'phone_screen', 'interview'];
const today = () => new Date().toISOString().slice(0, 10);

const daysBetween = (from, to) =>
  Math.round((new Date(`${to}T12:00:00`) - new Date(`${from}T12:00:00`)) / 86400000);

// Nudges the participant about applications they should follow up on: either a
// follow-up date that has arrived, or an application that has gone quiet for a
// week with no follow-up booked.
export default function FollowUpNudges() {
  const { toast } = useToast();
  const [items, setItems] = useState([]);
  const [busyId, setBusyId] = useState(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    callJobLab('listApplications')
      .then((data) => {
        const now = today();
        const due = (data.items || []).filter((app) => {
          if (!FOLLOW_UP_STATUSES.includes(app.status)) return false;
          if (app.follow_up_date) return app.follow_up_date <= now;
          if (app.status !== 'applied' || !app.date_applied) return false;
          return daysBetween(app.date_applied, now) >= 7;
        });
        setItems(due);
      })
      .catch(() => {});
  }, []);

  const logFollowUp = async (app) => {
    setBusyId(app.id);
    try {
      await callJobLab('updateApplication', { id: app.id, data: { follow_up_date: addDays(today(), 7) } });
      setItems((prev) => prev.filter((item) => item.id !== app.id));
      toast({ title: `Follow-up booked for ${app.company} in a week` });
    } catch (error) {
      toast({ title: error.message, variant: 'destructive' });
    } finally {
      setBusyId(null);
    }
  };

  if (dismissed || items.length === 0) return null;

  return (
    <section className="rounded-2xl border border-jl-gold/60 bg-jl-gold/10 p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-2.5">
          <BellRing className="mt-0.5 h-4 w-4 shrink-0 text-jl-navy" />
          <div>
            <p className="jl-heading text-sm font-semibold text-jl-fg">
              {items.length === 1 ? 'One application is waiting on you' : `${items.length} applications are waiting on you`}
            </p>
            <p className="mt-0.5 text-xs text-jl-muted-fg">
              A short call or email keeps your name in front of the employer.
            </p>
          </div>
        </div>
        <button onClick={() => setDismissed(true)} className="text-[11px] font-semibold text-jl-primary">
          Hide
        </button>
      </div>

      <div className="mt-3 space-y-2">
        {items.slice(0, 3).map((app) => (
          <div key={app.id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-white px-3 py-2">
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-jl-fg">{app.position}</p>
              <p className="truncate text-xs text-jl-muted-fg">
                {app.company}
                {app.follow_up_date
                  ? ` · follow-up was due ${app.follow_up_date}`
                  : ' · applied a week ago or more'}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => logFollowUp(app)}
                disabled={busyId === app.id}
                className="inline-flex items-center gap-1 rounded-md bg-jl-primary px-2.5 py-1.5 text-[11px] font-semibold text-jl-primary-fg disabled:opacity-50"
              >
                <Check className="h-3 w-3" /> I followed up
              </button>
              <Link to="/joblab/job-tracker" className="text-[11px] font-semibold text-jl-primary">
                Open
              </Link>
            </div>
          </div>
        ))}
      </div>

      {items.length > 3 && (
        <Link to="/joblab/job-tracker" className="mt-2 inline-block text-[11px] font-semibold text-jl-primary">
          See all {items.length} in your applications
        </Link>
      )}
    </section>
  );
}