import { useEffect, useState } from 'react';
import { Plus, Trash2, Save, AlertTriangle } from 'lucide-react';
import { useParticipant } from '@/lib/joblab/ParticipantContext';
import { callJobLab } from '@/lib/joblab/api';
import {
  JLButton, JLCard, JLInput, JLLabel, JLSelect, JLTextarea,
} from '@/components/joblab/ui';
import SkillInput from '@/components/joblab/SkillInput';
import YearSelect from '@/components/joblab/YearSelect';
import { DEGREE_OPTIONS } from '@/lib/joblab/constants';
import { useToast } from '@/components/ui/use-toast';

const emptyExperience = () => ({ title: '', company: '', start_date: '', end_date: '', current: false, description: '' });
const emptyEducation = () => ({ institution: '', degree: '', field: '', start_year: '', end_year: '', description: '' });

export default function JobLabProfile() {
  const { participant, isGuest, updateParticipant } = useParticipant();
  const { toast } = useToast();
  const [form, setForm] = useState({ career_goals: '', experience: [], education: [], skills: [], interests: [] });
  const [interest, setInterest] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!participant) return;
    setForm({
      career_goals: participant.career_goals || '',
      experience: participant.experience || [],
      education: participant.education || [],
      skills: participant.skills || [],
      interests: participant.interests || [],
    });
  }, [participant]);

  const updateList = (key, index, patch) => {
    setForm((prev) => ({
      ...prev,
      [key]: prev[key].map((item, i) => (i === index ? { ...item, ...patch } : item)),
    }));
  };

  const removeFromList = (key, index) => {
    setForm((prev) => ({ ...prev, [key]: prev[key].filter((_, i) => i !== index) }));
  };

  const addInterest = (event) => {
    if (event.key !== 'Enter') return;
    event.preventDefault();
    const value = interest.trim();
    if (!value || form.interests.includes(value)) return;
    setForm((prev) => ({ ...prev, interests: [...prev.interests, value] }));
    setInterest('');
  };

  const save = async () => {
    setSaving(true);
    try {
      const data = await callJobLab('saveProfile', { profile: form });
      updateParticipant(data.participant);
      toast({ title: 'Profile saved!' });
    } catch (error) {
      toast({ title: error.message, variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="jl-heading text-2xl font-bold text-jl-fg sm:text-3xl">My Profile</h1>
          <p className="mt-1 text-sm text-jl-muted-fg">Your education, experience, and skills power all the features in Job Lab</p>
        </div>
        <JLButton onClick={save} disabled={saving}>
          <Save className="h-4 w-4" /> {saving ? 'Saving…' : 'Save Profile'}
        </JLButton>
      </div>

      <div className="space-y-4">
        <JLCard className="p-4">
          <h2 className="jl-heading mb-3 text-sm font-semibold text-jl-fg">Contact Information</h2>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div>
              <JLLabel>Name</JLLabel>
              <p className="text-sm text-jl-fg">{participant?.name || '—'}</p>
            </div>
            <div>
              <JLLabel>Email</JLLabel>
              <p className="text-sm text-jl-fg">{participant?.email || '—'}</p>
            </div>
            <div>
              <JLLabel>Phone</JLLabel>
              <p className="text-sm text-jl-fg">{participant?.phone || '—'}</p>
            </div>
          </div>
          {isGuest && (
            <div className="mt-3 flex items-start gap-2 rounded-lg bg-jl-accent/10 px-3 py-2 text-xs text-jl-accent">
              <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
              Guest account — create a full account to save your profile
            </div>
          )}
        </JLCard>

        <JLCard className="p-4">
          <h2 className="jl-heading mb-3 text-sm font-semibold text-jl-fg">Career Goals</h2>
          <JLTextarea
            rows={3}
            value={form.career_goals}
            onChange={(e) => setForm((prev) => ({ ...prev, career_goals: e.target.value }))}
            placeholder="What kind of work are you looking for? What are you working towards?"
          />
        </JLCard>

        <JLCard className="p-4">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="jl-heading text-sm font-semibold text-jl-fg">Work Experience</h2>
            <JLButton variant="outline" size="sm" onClick={() => setForm((prev) => ({ ...prev, experience: [...prev.experience, emptyExperience()] }))}>
              <Plus className="h-3.5 w-3.5" /> Add
            </JLButton>
          </div>
          {form.experience.length === 0 && <p className="text-xs text-jl-muted-fg">No experience added yet</p>}
          <div className="space-y-3">
            {form.experience.map((entry, index) => (
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
                      onChange={(v) => updateList('experience', index, { end_date: v === 'Present' ? '' : v, current: v === 'Present' })}
                    />
                  </div>
                </div>
                <div className="mt-2">
                  <JLLabel>Description</JLLabel>
                  <JLTextarea rows={2} value={entry.description || ''} onChange={(e) => updateList('experience', index, { description: e.target.value })} />
                </div>
              </div>
            ))}
          </div>
        </JLCard>

        <JLCard className="p-4">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="jl-heading text-sm font-semibold text-jl-fg">Education</h2>
            <JLButton variant="outline" size="sm" onClick={() => setForm((prev) => ({ ...prev, education: [...prev.education, emptyEducation()] }))}>
              <Plus className="h-3.5 w-3.5" /> Add
            </JLButton>
          </div>
          {form.education.length === 0 && <p className="text-xs text-jl-muted-fg">No education added yet</p>}
          <div className="space-y-3">
            {form.education.map((entry, index) => (
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
          <SkillInput skills={form.skills} onChange={(skills) => setForm((prev) => ({ ...prev, skills }))} />
        </JLCard>

        <JLCard className="p-4">
          <h2 className="jl-heading mb-3 text-sm font-semibold text-jl-fg">Interests &amp; Industries</h2>
          {form.interests.length > 0 && (
            <div className="mb-2 flex flex-wrap gap-1.5">
              {form.interests.map((item) => (
                <span key={item} className="inline-flex items-center gap-1 rounded-full border border-jl-border px-2.5 py-1 text-xs font-medium text-jl-fg">
                  {item}
                  <button type="button" onClick={() => setForm((prev) => ({ ...prev, interests: prev.interests.filter((i) => i !== item) }))} aria-label={`Remove ${item}`}>
                    <Trash2 className="h-3 w-3" />
                  </button>
                </span>
              ))}
            </div>
          )}
          <JLInput value={interest} onChange={(e) => setInterest(e.target.value)} onKeyDown={addInterest} placeholder="Type an interest and press Enter" />
        </JLCard>

        <JLButton onClick={save} size="lg" className="w-full" disabled={saving}>
          {saving ? 'Saving…' : 'Save Profile'}
        </JLButton>
      </div>
    </div>
  );
}