import { useState } from 'react';
import { Sparkles } from 'lucide-react';
import { JLButton, JLDialog, JLInput, JLLabel, JLSelect } from '@/components/joblab/ui';
import { callJobLab } from '@/lib/joblab/api';
import { useToast } from '@/components/ui/use-toast';

const TIMELINES = ['1', '2', '3', '5', '7', '10'];

export default function CareerPathDialog({ open, onClose, onCreated }) {
  const { toast } = useToast();
  const [form, setForm] = useState({ title: '', currentRole: '', targetRole: '', years: '3' });
  const [generating, setGenerating] = useState(false);

  const set = (key) => (event) => setForm((prev) => ({ ...prev, [key]: event.target.value }));

  const generate = async (event) => {
    event.preventDefault();
    if (!form.targetRole.trim() || generating) return;
    setGenerating(true);
    try {
      const plan = await callJobLab('aiPath', {
        currentRole: form.currentRole,
        targetRole: form.targetRole,
        years: Number(form.years),
      });
      const data = await callJobLab('createPath', {
        data: {
          title: form.title.trim() || `${form.targetRole} Path`,
          current_role: form.currentRole,
          target_role: form.targetRole,
          timeline_years: Number(form.years),
          milestones: plan.milestones || [],
          required_skills: plan.required_skills || [],
          required_education: plan.required_education || '',
        },
      });
      onCreated(data.item);
      onClose();
      setForm({ title: '', currentRole: '', targetRole: '', years: '3' });
      toast({ title: 'Career path created!' });
    } catch (error) {
      toast({ title: error.message, variant: 'destructive' });
    } finally {
      setGenerating(false);
    }
  };

  return (
    <JLDialog open={open} onClose={onClose} title="New career path" description="We'll map the milestones from where you are to where you want to be.">
      <form onSubmit={generate} className="space-y-3">
        <div>
          <JLLabel>Path Name</JLLabel>
          <JLInput value={form.title} onChange={set('title')} placeholder="e.g. Move into bookkeeping" />
        </div>
        <div>
          <JLLabel>Current Role</JLLabel>
          <JLInput value={form.currentRole} onChange={set('currentRole')} placeholder="e.g. Retail cashier" />
        </div>
        <div>
          <JLLabel>Target Role *</JLLabel>
          <JLInput value={form.targetRole} onChange={set('targetRole')} placeholder="e.g. Accounting clerk" required />
        </div>
        <div>
          <JLLabel>Timeline</JLLabel>
          <JLSelect value={form.years} onChange={set('years')}>
            {TIMELINES.map((years) => (
              <option key={years} value={years}>{years} year{years === '1' ? '' : 's'}</option>
            ))}
          </JLSelect>
        </div>
        <JLButton type="submit" className="w-full" disabled={generating || !form.targetRole.trim()}>
          <Sparkles className="h-4 w-4" /> {generating ? 'Generating…' : 'Generate AI Career Path'}
        </JLButton>
      </form>
    </JLDialog>
  );
}