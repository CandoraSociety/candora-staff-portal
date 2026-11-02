import { useEffect, useState } from 'react';
import { Plus, FileText, Trash2 } from 'lucide-react';
import { useParticipant } from '@/lib/joblab/ParticipantContext';
import { callJobLab } from '@/lib/joblab/api';
import {
  JLBadge, JLButton, JLCard, JLDialog, JLEmpty, JLInput, JLLabel, JLSelect,
} from '@/components/joblab/ui';
import ResumeEditor from '@/components/joblab/ResumeEditor';
import { TEMPLATE_OPTIONS } from '@/lib/joblab/constants';
import { useToast } from '@/components/ui/use-toast';

export default function JobLabResumeBuilder() {
  const { participant, isGuest } = useParticipant();
  const { toast } = useToast();
  const [resumes, setResumes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({ title: '', template: 'professional' });
  const [creating, setCreating] = useState(false);

  const load = async () => {
    try {
      const data = await callJobLab('listResumes');
      setResumes(data.items || []);
    } catch (error) {
      toast({ title: error.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const create = async (event) => {
    event.preventDefault();
    if (!form.title.trim()) return;
    setCreating(true);
    try {
      const data = await callJobLab('createResume', { title: form.title, template: form.template });
      setResumes((prev) => [data.item, ...prev]);
      setSelected(data.item);
      setDialogOpen(false);
      setForm({ title: '', template: 'professional' });
      toast({ title: 'Resume created!' });
    } catch (error) {
      toast({ title: error.message, variant: 'destructive' });
    } finally {
      setCreating(false);
    }
  };

  const remove = async (resume) => {
    try {
      await callJobLab('deleteResume', { id: resume.id });
      setResumes((prev) => prev.filter((item) => item.id !== resume.id));
      toast({ title: 'Removed.' });
    } catch (error) {
      toast({ title: error.message, variant: 'destructive' });
    }
  };

  if (selected) {
    return (
      <ResumeEditor
        resume={selected}
        participant={participant}
        isGuest={isGuest}
        onBack={() => setSelected(null)}
        onSaved={(updated) => {
          setSelected(updated);
          setResumes((prev) => prev.map((item) => (item.id === updated.id ? updated : item)));
        }}
      />
    );
  }

  return (
    <div>
      <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="jl-heading text-2xl font-bold text-jl-fg sm:text-3xl">Resume Builder</h1>
          <p className="mt-1 text-sm text-jl-muted-fg">Build, print and email a resume employers will read</p>
        </div>
        <JLButton onClick={() => setDialogOpen(true)}>
          <Plus className="h-4 w-4" /> New Resume
        </JLButton>
      </div>

      {isGuest && (
        <JLCard className="mb-4 border-jl-accent/40 bg-jl-accent/5 p-3 text-xs text-jl-accent">
          As a guest, your resume won't be saved after you log out. Use the email or print features to save your work.
        </JLCard>
      )}

      {loading ? (
        <p className="py-10 text-center text-sm text-jl-muted-fg">Loading…</p>
      ) : resumes.length === 0 ? (
        <JLEmpty icon={FileText} title="No resumes yet" hint="Create your first resume to get started" />
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {resumes.map((resume) => (
            <JLCard
              key={resume.id}
              className="group relative cursor-pointer p-4 transition-shadow hover:shadow-md"
              onClick={() => setSelected(resume)}
            >
              <button
                onClick={(event) => { event.stopPropagation(); remove(resume); }}
                className="absolute right-2 top-2 hidden rounded p-1.5 text-red-600 hover:bg-red-50 group-hover:block"
                aria-label="Delete resume"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
              <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-lg bg-jl-primary/10">
                <FileText className="h-4 w-4 text-jl-primary" />
              </div>
              <p className="jl-heading text-sm font-semibold text-jl-fg">{resume.title}</p>
              <JLBadge className="mt-1 bg-jl-secondary capitalize text-jl-muted-fg">{resume.template}</JLBadge>
              <p className="mt-2 text-xs text-jl-muted-fg">
                {(resume.experience || []).length} positions · {(resume.education || []).length} education · {(resume.skills || []).length} skills
              </p>
            </JLCard>
          ))}
        </div>
      )}

      <JLDialog open={dialogOpen} onClose={() => setDialogOpen(false)} title="New resume" description="Your profile info will be imported automatically.">
        <form onSubmit={create} className="space-y-3">
          <div>
            <JLLabel>Resume Name</JLLabel>
            <JLInput value={form.title} onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))} placeholder="e.g. General Resume" required />
          </div>
          <div>
            <JLLabel>Template Style</JLLabel>
            <JLSelect value={form.template} onChange={(e) => setForm((p) => ({ ...p, template: e.target.value }))}>
              {TEMPLATE_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
            </JLSelect>
          </div>
          <JLButton type="submit" className="w-full" disabled={creating}>
            {creating ? 'Creating…' : 'Create'}
          </JLButton>
        </form>
      </JLDialog>
    </div>
  );
}