import { useEffect, useMemo, useState } from 'react';
import { Plus, ClipboardList } from 'lucide-react';
import { callJobLab } from '@/lib/joblab/api';
import { JLButton, JLEmpty, JLTabs } from '@/components/joblab/ui';
import ApplicationCard from '@/components/joblab/ApplicationCard';
import ApplicationDialog from '@/components/joblab/ApplicationDialog';
import { STATUS_LABELS, addDays } from '@/lib/joblab/constants';
import { useToast } from '@/components/ui/use-toast';

const today = () => new Date().toISOString().slice(0, 10);

export default function JobLabTracker() {
  const { toast } = useToast();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('saved');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [defaultStatus, setDefaultStatus] = useState('saved');

  const load = async () => {
    try {
      const data = await callJobLab('listApplications');
      setItems(data.items || []);
    } catch (error) {
      toast({ title: error.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const saved = useMemo(() => items.filter((item) => item.status === 'saved'), [items]);
  const applications = useMemo(() => items.filter((item) => item.status !== 'saved'), [items]);

  const statusCounts = useMemo(() => {
    const counts = {};
    applications.forEach((app) => { counts[app.status] = (counts[app.status] || 0) + 1; });
    return counts;
  }, [applications]);

  const visibleApplications = statusFilter === 'all'
    ? applications
    : applications.filter((app) => app.status === statusFilter);

  const openAdd = () => {
    setEditing(null);
    setDefaultStatus(tab === 'saved' ? 'saved' : 'applied');
    setDialogOpen(true);
  };

  const openEdit = (application) => {
    setEditing(application);
    setDialogOpen(true);
  };

  const save = async (form) => {
    try {
      if (editing) {
        const data = await callJobLab('updateApplication', { id: editing.id, data: form });
        setItems((prev) => prev.map((item) => (item.id === data.item.id ? data.item : item)));
        toast({ title: 'Updated!' });
      } else {
        const data = await callJobLab('createApplication', { data: form });
        setItems((prev) => [data.item, ...prev]);
        toast({ title: 'Added to tracker!' });
      }
    } catch (error) {
      toast({ title: error.message, variant: 'destructive' });
      throw error;
    }
  };

  const markApplied = async (application) => {
    try {
      const data = await callJobLab('updateApplication', {
        id: application.id,
        // Book a follow-up a week out — the dashboard nudges them about it.
        data: { status: 'applied', date_applied: today(), follow_up_date: addDays(today(), 7) },
      });
      setItems((prev) => prev.map((item) => (item.id === data.item.id ? data.item : item)));
      toast({ title: 'Marked as applied!' });
    } catch (error) {
      toast({ title: error.message, variant: 'destructive' });
    }
  };

  const remove = async (application) => {
    try {
      await callJobLab('deleteApplication', { id: application.id });
      setItems((prev) => prev.filter((item) => item.id !== application.id));
      toast({ title: 'Removed.' });
    } catch (error) {
      toast({ title: error.message, variant: 'destructive' });
    }
  };

  return (
    <div>
      <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="jl-heading text-2xl font-bold text-jl-fg sm:text-3xl">Job Tracker</h1>
          <p className="mt-1 text-sm text-jl-muted-fg">Track job listings and manage your applications</p>
        </div>
        <JLButton onClick={openAdd}>
          <Plus className="h-4 w-4" /> Add Job
        </JLButton>
      </div>

      <JLTabs
        className="mb-4"
        value={tab}
        onChange={setTab}
        tabs={[
          { value: 'saved', label: `Saved Listings (${saved.length})` },
          { value: 'applied', label: `Applications (${applications.length})` },
        ]}
      />

      {loading ? (
        <p className="py-10 text-center text-sm text-jl-muted-fg">Loading…</p>
      ) : tab === 'saved' ? (
        <div>
          <p className="mb-3 text-xs text-jl-muted-fg">
            Jobs you saved from Job Search land here. When you've applied, mark it applied to move it into your applications.
          </p>
          {saved.length === 0 ? (
            <JLEmpty
              icon={ClipboardList}
              title="No saved listings yet."
              hint="Search for jobs and tap Save to Tracker to keep them here."
            />
          ) : (
            <div className="space-y-3">
              {saved.map((application) => (
                <ApplicationCard
                  key={application.id}
                  application={application}
                  onEdit={openEdit}
                  onDelete={remove}
                  onMarkApplied={markApplied}
                  showApply
                />
              ))}
            </div>
          )}
        </div>
      ) : (
        <div>
          <div className="mb-3 flex flex-wrap gap-1.5">
            <button
              onClick={() => setStatusFilter('all')}
              className={`rounded-full px-3 py-1 text-xs font-semibold ${statusFilter === 'all' ? 'bg-jl-primary text-jl-primary-fg' : 'bg-jl-secondary text-jl-muted-fg'}`}
            >
              All ({applications.length})
            </button>
            {Object.keys(statusCounts).map((status) => (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={`rounded-full px-3 py-1 text-xs font-semibold ${statusFilter === status ? 'bg-jl-primary text-jl-primary-fg' : 'bg-jl-secondary text-jl-muted-fg'}`}
              >
                {STATUS_LABELS[status] || status} ({statusCounts[status]})
              </button>
            ))}
          </div>

          {visibleApplications.length === 0 ? (
            <JLEmpty
              icon={ClipboardList}
              title="No applications yet."
              hint="Add a job, or mark a saved listing as applied to start tracking it."
            />
          ) : (
            <div className="space-y-3">
              {visibleApplications.map((application) => (
                <ApplicationCard
                  key={application.id}
                  application={application}
                  onEdit={openEdit}
                  onDelete={remove}
                />
              ))}
            </div>
          )}
        </div>
      )}

      <ApplicationDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        onSave={save}
        application={editing}
        defaultStatus={defaultStatus}
      />
    </div>
  );
}