import { useState } from 'react';
import {
  ArrowLeft, Sparkles, Plus, Trash2, Printer, FileDown, Mail, Save,
} from 'lucide-react';
import { JLBadge, JLButton, JLCard, JLInput, JLLabel, JLSelect, JLTextarea, JLTabs } from '@/components/joblab/ui';
import SkillInput from '@/components/joblab/SkillInput';
import YearSelect from '@/components/joblab/YearSelect';
import ResumePreview from '@/components/joblab/ResumePreview';
import { downloadWord, printResume, resumeInnerHtml } from '@/components/joblab/resumeExport';
import { callJobLab } from '@/lib/joblab/api';
import { DEGREE_OPTIONS, TEMPLATE_OPTIONS } from '@/lib/joblab/constants';
import { useToast } from '@/components/ui/use-toast';

const emptyExperience = () => ({ company: '', title: '', start_date: '', end_date: '', current: false, bullets: [''] });
const emptyEducation = () => ({ institution: '', degree: '', field: '', start_year: '', end_year: '', achievements: '' });

export default function ResumeEditor({ resume, participant, onBack, onSaved, isGuest }) {
  const { toast } = useToast();
  const [draft, setDraft] = useState(resume);
  const [tab, setTab] = useState('edit');
  const [busy, setBusy] = useState(false);

  const set = (key, value) => setDraft((prev) => ({ ...prev, [key]: value }));

  const updateList = (key, index, patch) => {
    setDraft((prev) => ({
      ...prev,
      [key]: prev[key].map((item, i) => (i === index ? { ...item, ...patch } : item)),
    }));
  };

  const removeFromList = (key, index) => {
    setDraft((prev) => ({ ...prev, [key]: prev[key].filter((_, i) => i !== index) }));
  };

  const suggest = async (field) => {
    try {
      const data = await callJobLab(field === 'summary' ? 'aiSummary' : 'aiObjective');
      set(field, data.text || '');
      toast({ title: 'Suggested text added.' });
    } catch (error) {
      toast({ title: error.message, variant: 'destructive' });
    }
  };

  const save = async () => {
    setBusy(true);
    try {
      const data = await callJobLab('updateResume', { id: draft.id, data: draft });
      setDraft(data.item);
      onSaved?.(data.item);
      toast({ title: 'Saved!' });
      return data.item;
    } catch (error) {
      toast({ title: error.message, variant: 'destructive' });
      return null;
    } finally {
      setBusy(false);
    }
  };

  const saveAndPreview = async () => {
    const saved = await save();
    if (saved) setTab('preview');
  };

  const emailResume = async () => {
    const html = resumeInnerHtml();
    if (!html) {
      toast({ title: 'Open Preview first, then try again.', variant: 'destructive' });
      return;
    }
    const address = participant?.email;
    if (!address) {
      toast({ title: 'There is no email address on your profile.', variant: 'destructive' });
      return;
    }
    try {
      await callJobLab('emailResume', { to: address, title: draft.title, html });
      toast({ title: `Resume sent to ${address}.` });
    } catch (error) {
      toast({ title: error.message, variant: 'destructive' });
    }
  };

  const print = () => {
    setTab('preview');
    setTimeout(printResume, 300);
  };

  const word = () => {
    const html = resumeInnerHtml();
    if (!html) {
      toast({ title: 'Open Preview first, then try again.', variant: 'destructive' });
      return;
    }
    downloadWord(draft.title, html);
  };

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <JLButton variant="ghost" size="icon" onClick={onBack} aria-label="Back to resumes">
            <ArrowLeft className="h-4 w-4" />
          </JLButton>
          <div>
            <h1 className="jl-heading text-lg font-semibold text-jl-fg">{draft.title}</h1>
            <JLBadge className="bg-jl-secondary text-jl-muted-fg capitalize">{draft.template}</JLBadge>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <JLButton variant="outline" size="sm" onClick={emailResume}><Mail className="h-3.5 w-3.5" /> Email</JLButton>
          <JLButton variant="outline" size="sm" onClick={word}><FileDown className="h-3.5 w-3.5" /> Word</JLButton>
          <JLButton variant="outline" size="sm" onClick={print}><Printer className="h-3.5 w-3.5" /> PDF</JLButton>
          <JLButton size="sm" onClick={save} disabled={busy}><Save className="h-3.5 w-3.5" /> Save</JLButton>
        </div>
      </div>

      <JLTabs
        className="mb-4"
        value={tab}
        onChange={setTab}
        tabs={[{ value: 'edit', label: 'Edit' }, { value: 'preview', label: 'Preview' }]}
      />

      {isGuest && (
        <JLCard className="mb-4 border-jl-accent/40 bg-jl-accent/5 p-3 text-xs text-jl-accent">
          As a guest, your resume won't be saved after you log out. Use the email or print features to save your work.
        </JLCard>
      )}

      <div className={tab === 'edit' ? 'space-y-4' : 'hidden'}>
        <JLCard className="p-4">
          <h2 className="jl-heading mb-3 text-sm font-semibold text-jl-fg">Summary &amp; Objective</h2>
          <div className="space-y-3">
            <div>
              <div className="mb-1.5 flex items-center justify-between">
                <JLLabel className="mb-0">Professional Summary</JLLabel>
                <JLButton variant="ghost" size="sm" onClick={() => suggest('summary')}>
                  <Sparkles className="h-3.5 w-3.5" /> AI Suggest
                </JLButton>
              </div>
              <JLTextarea rows={4} value={draft.summary || ''} onChange={(e) => set('summary', e.target.value)} placeholder="Two or three sentences about who you are and what you bring." />
            </div>
            <div>
              <div className="mb-1.5 flex items-center justify-between">
                <JLLabel className="mb-0">Objective</JLLabel>
                <JLButton variant="ghost" size="sm" onClick={() => suggest('objective')}>
                  <Sparkles className="h-3.5 w-3.5" /> AI Suggest
                </JLButton>
              </div>
              <JLTextarea rows={3} value={draft.objective || ''} onChange={(e) => set('objective', e.target.value)} placeholder="What kind of role you're targeting." />
            </div>
          </div>
        </JLCard>

        <JLCard className="p-4">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="jl-heading text-sm font-semibold text-jl-fg">Work Experience</h2>
            <JLButton variant="outline" size="sm" onClick={() => set('experience', [...(draft.experience || []), emptyExperience()])}>
              <Plus className="h-3.5 w-3.5" /> Add
            </JLButton>
          </div>
          {(draft.experience || []).length === 0 && <p className="text-xs text-jl-muted-fg">No experience added yet.</p>}
          <div className="space-y-3">
            {(draft.experience || []).map((entry, index) => (
              <div key={index} className="relative rounded-lg border border-jl-border p-3">
                <button
                  onClick={() => removeFromList('experience', index)}
                  className="absolute right-2 top-2 rounded p-1 text-red-600 hover:bg-red-50"
                  aria-label="Remove role"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                  <div>
                    <JLLabel>Job Title</JLLabel>
                    <JLInput value={entry.title || ''} onChange={(e) => updateList('experience', index, { title: e.target.value })} />
                  </div>
                  <div>
                    <JLLabel>Company</JLLabel>
                    <JLInput value={entry.company || ''} onChange={(e) => updateList('experience', index, { company: e.target.value })} />
                  </div>
                  <div>
                    <JLLabel>Start Year</JLLabel>
                    <YearSelect value={entry.start_date} onChange={(v) => updateList('experience', index, { start_date: v })} allowPresent={false} />
                  </div>
                  <div>
                    <JLLabel>End Year</JLLabel>
                    <YearSelect
                      value={entry.current ? 'Present' : entry.end_date}
                      allowPresent
                      onChange={(v) => updateList('experience', index, { end_date: v === 'Present' ? '' : v, current: v === 'Present' })}
                    />
                  </div>
                </div>
                <div className="mt-2">
                  <JLLabel>Achievement bullets</JLLabel>
                  {(entry.bullets || ['']).map((bullet, bulletIndex) => (
                    <div key={bulletIndex} className="mb-1.5 flex items-center gap-1.5">
                      <JLInput
                        value={bullet}
                        placeholder="What you did and the result"
                        onChange={(e) => {
                          const bullets = [...(entry.bullets || [''])];
                          bullets[bulletIndex] = e.target.value;
                          updateList('experience', index, { bullets });
                        }}
                      />
                      <button
                        onClick={() => updateList('experience', index, { bullets: (entry.bullets || []).filter((_, i) => i !== bulletIndex) })}
                        className="rounded p-1.5 text-jl-muted-fg hover:bg-jl-secondary"
                        aria-label="Remove bullet"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))}
                  <JLButton variant="ghost" size="sm" onClick={() => updateList('experience', index, { bullets: [...(entry.bullets || []), ''] })}>
                    <Plus className="h-3.5 w-3.5" /> Bullet
                  </JLButton>
                </div>
              </div>
            ))}
          </div>
        </JLCard>

        <JLCard className="p-4">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="jl-heading text-sm font-semibold text-jl-fg">Education</h2>
            <JLButton variant="outline" size="sm" onClick={() => set('education', [...(draft.education || []), emptyEducation()])}>
              <Plus className="h-3.5 w-3.5" /> Add
            </JLButton>
          </div>
          {(draft.education || []).length === 0 && <p className="text-xs text-jl-muted-fg">No education added yet.</p>}
          <div className="space-y-3">
            {(draft.education || []).map((entry, index) => (
              <div key={index} className="relative rounded-lg border border-jl-border p-3">
                <button
                  onClick={() => removeFromList('education', index)}
                  className="absolute right-2 top-2 rounded p-1 text-red-600 hover:bg-red-50"
                  aria-label="Remove education"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                  <div>
                    <JLLabel>Institution</JLLabel>
                    <JLInput value={entry.institution || ''} onChange={(e) => updateList('education', index, { institution: e.target.value })} />
                  </div>
                  <div>
                    <JLLabel>Degree / Credential</JLLabel>
                    <JLSelect value={entry.degree || ''} onChange={(e) => updateList('education', index, { degree: e.target.value })}>
                      <option value="">Select…</option>
                      {DEGREE_OPTIONS.map((option) => <option key={option} value={option}>{option}</option>)}
                    </JLSelect>
                  </div>
                  <div>
                    <JLLabel>Field of Study</JLLabel>
                    <JLInput value={entry.field || ''} onChange={(e) => updateList('education', index, { field: e.target.value })} />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <JLLabel>Start</JLLabel>
                      <YearSelect value={entry.start_year} onChange={(v) => updateList('education', index, { start_year: v })} allowPresent={false} />
                    </div>
                    <div>
                      <JLLabel>End</JLLabel>
                      <YearSelect value={entry.end_year} onChange={(v) => updateList('education', index, { end_year: v })} />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </JLCard>

        <JLCard className="p-4">
          <h2 className="jl-heading mb-3 text-sm font-semibold text-jl-fg">Skills</h2>
          <SkillInput skills={draft.skills || []} onChange={(skills) => set('skills', skills)} />
        </JLCard>

        <JLCard className="p-4">
          <h2 className="jl-heading mb-3 text-sm font-semibold text-jl-fg">Template</h2>
          <JLSelect value={draft.template} onChange={(e) => set('template', e.target.value)} className="sm:w-64">
            {TEMPLATE_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
          </JLSelect>
        </JLCard>

        <div className="flex flex-wrap gap-2">
          <JLButton variant="outline" onClick={save} disabled={busy}>Save</JLButton>
          <JLButton onClick={saveAndPreview} disabled={busy}>Save &amp; Preview Resume</JLButton>
        </div>
      </div>

      <div className={tab === 'preview' ? 'block overflow-x-auto pb-6' : 'hidden'}>
        <ResumePreview resume={draft} participant={participant} />
      </div>
    </div>
  );
}