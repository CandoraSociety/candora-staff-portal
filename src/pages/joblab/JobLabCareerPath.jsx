import { useEffect, useState } from 'react';
import { Plus, Route } from 'lucide-react';
import { callJobLab } from '@/lib/joblab/api';
import { JLBadge, JLButton, JLCard, JLEmpty } from '@/components/joblab/ui';
import CareerPathDialog from '@/components/joblab/CareerPathDialog';
import CareerPathDetail from '@/components/joblab/CareerPathDetail';
import { useToast } from '@/components/ui/use-toast';

export default function JobLabCareerPath() {
  const { toast } = useToast();
  const [paths, setPaths] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const load = async () => {
    try {
      const data = await callJobLab('listPaths');
      setPaths(data.items || []);
    } catch (error) {
      toast({ title: error.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const cycleStatus = async (path, index, status) => {
    const milestones = (path.milestones || []).map((m, i) => (i === index ? { ...m, status } : m));
    const updated = { ...path, milestones };
    setSelected(updated);
    setPaths((prev) => prev.map((item) => (item.id === path.id ? updated : item)));
    try {
      await callJobLab('updatePath', { id: path.id, data: { milestones } });
    } catch (error) {
      toast({ title: error.message, variant: 'destructive' });
    }
  };

  const remove = async (path) => {
    try {
      await callJobLab('deletePath', { id: path.id });
      setPaths((prev) => prev.filter((item) => item.id !== path.id));
      setSelected(null);
      toast({ title: 'Removed.' });
    } catch (error) {
      toast({ title: error.message, variant: 'destructive' });
    }
  };

  if (selected) {
    return (
      <CareerPathDetail
        path={selected}
        onBack={() => setSelected(null)}
        onDelete={remove}
        onCycleStatus={cycleStatus}
      />
    );
  }

  return (
    <div>
      <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="jl-heading text-2xl font-bold text-jl-fg sm:text-3xl">Career Path</h1>
          <p className="mt-1 text-sm text-jl-muted-fg">Map the steps from where you are to the role you want</p>
        </div>
        <JLButton onClick={() => setDialogOpen(true)}>
          <Plus className="h-4 w-4" /> New Path
        </JLButton>
      </div>

      {loading ? (
        <p className="py-10 text-center text-sm text-jl-muted-fg">Loading…</p>
      ) : paths.length === 0 ? (
        <JLEmpty icon={Route} title="No career paths yet" hint="Generate one and we'll lay out the milestones for you." />
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {paths.map((path) => (
            <JLCard
              key={path.id}
              className="cursor-pointer p-4 transition-shadow hover:shadow-md"
              onClick={() => setSelected(path)}
            >
              <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-lg bg-jl-primary/10">
                <Route className="h-4 w-4 text-jl-primary" />
              </div>
              <p className="jl-heading text-sm font-semibold text-jl-fg">{path.title}</p>
              <p className="mt-0.5 text-xs text-jl-muted-fg">
                {path.current_role || 'Where you are'} → {path.target_role || 'Target role'}
              </p>
              <div className="mt-2 flex flex-wrap gap-1.5">
                <JLBadge className="border border-jl-border text-jl-fg">{path.timeline_years || '—'}y timeline</JLBadge>
                <JLBadge className="border border-jl-border text-jl-fg">{(path.milestones || []).length} milestones</JLBadge>
              </div>
            </JLCard>
          ))}
        </div>
      )}

      <CareerPathDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        onCreated={(created) => {
          setPaths((prev) => [created, ...prev]);
          setSelected(created);
        }}
      />
    </div>
  );
}