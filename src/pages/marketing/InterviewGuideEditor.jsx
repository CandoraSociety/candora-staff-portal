import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { ArrowLeft, Save } from 'lucide-react';
import GuideMetaPanel from '@/components/marketing/interviewguide/GuideMetaPanel';
import GuideNarrationPanel from '@/components/marketing/interviewguide/GuideNarrationPanel';
import GuideQuestionsPanel from '@/components/marketing/interviewguide/GuideQuestionsPanel';
import GuideReferencePanel from '@/components/marketing/interviewguide/GuideReferencePanel';
import { generateNarration } from '@/lib/interviewGuides';

// Builds one interactive guide: its details, its spoken narration, its
// questions and its quick reference.
export default function InterviewGuideEditor() {
  const { id } = useParams();
  const [guide, setGuide] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [tab, setTab] = useState('details');
  const [saving, setSaving] = useState(false);
  const [busy, setBusy] = useState({});

  const load = async () => {
    const loaded = await base44.entities.InterviewGuide.get(id);
    setGuide(loaded);
    const { items } = await base44.entities.InterviewGuideQuestion.filter(
      { guide_id: id },
      { sort: 'display_order', limit: 100 }
    );
    setQuestions(items);
  };

  useEffect(() => { load(); }, [id]);

  if (!guide) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-[3px] border-primary/20 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  const patch = (changes) => setGuide((g) => ({ ...g, ...changes }));

  const save = async (changes = {}) => {
    setSaving(true);
    try {
      const next = { ...guide, ...changes };
      await base44.entities.InterviewGuide.update(id, next);
      setGuide(next);
      toast.success('Guide saved');
    } catch (error) {
      toast.error(error.message || 'The guide could not be saved');
    } finally {
      setSaving(false);
    }
  };

  const generateSection = async (key, text) => {
    setBusy((b) => ({ ...b, [key]: true }));
    try {
      const url = await generateNarration({ text, voice: guide.voice });
      const field = `${key}_audio_url`;
      patch({ [field]: url });
      await base44.entities.InterviewGuide.update(id, { [field]: url });
      toast.success('Audio generated and saved');
    } catch (error) {
      toast.error(error.message || 'Audio generation failed');
    } finally {
      setBusy((b) => ({ ...b, [key]: false }));
    }
  };

  const saveQuestion = async (data) => {
    if (data.id) {
      await base44.entities.InterviewGuideQuestion.update(data.id, data);
    } else {
      await base44.entities.InterviewGuideQuestion.create({
        ...data,
        guide_id: id,
        display_order: questions.length,
      });
    }
    await load();
    toast.success('Question saved');
  };

  const deleteQuestion = async (question) => {
    if (!window.confirm('Remove this question from the guide?')) return;
    await base44.entities.InterviewGuideQuestion.delete(question.id);
    await load();
  };

  const moveQuestion = async (question, direction) => {
    const index = questions.findIndex((q) => q.id === question.id);
    const neighbour = questions[index + direction];
    if (!neighbour) return;
    await base44.entities.InterviewGuideQuestion.bulkUpdate([
      { id: question.id, display_order: index + direction },
      { id: neighbour.id, display_order: index },
    ]);
    await load();
  };

  const generateQuestion = async (question) => {
    setBusy((b) => ({ ...b, [question.id]: true }));
    try {
      const url = await generateNarration({ text: question.narration, voice: guide.voice });
      await base44.entities.InterviewGuideQuestion.update(question.id, {
        audio_url: url,
        audio_generated_at: new Date().toISOString(),
      });
      await load();
      toast.success('Audio generated and saved');
    } catch (error) {
      toast.error(error.message || 'Audio generation failed');
    } finally {
      setBusy((b) => ({ ...b, [question.id]: false }));
    }
  };

  return (
    <div className="space-y-5 max-w-4xl">
      <div className="flex items-start justify-between gap-3">
        <div>
          <Button variant="ghost" size="sm" className="mb-1 -ml-2" asChild>
            <Link to="/marketing/media"><ArrowLeft className="w-4 h-4 mr-1" /> Media & Press</Link>
          </Button>
          <h1 className="text-xl font-display font-bold">{guide.title}</h1>
          <div className="flex items-center gap-2 mt-1">
            <Badge variant="outline">{guide.status}</Badge>
            <span className="text-xs text-muted-foreground">
              {questions.length} question{questions.length === 1 ? '' : 's'}
            </span>
          </div>
        </div>
        <Button onClick={() => save()} disabled={saving}>
          <Save className="w-4 h-4 mr-1" /> {saving ? 'Saving…' : 'Save guide'}
        </Button>
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="details">Details</TabsTrigger>
          <TabsTrigger value="narration">Narration</TabsTrigger>
          <TabsTrigger value="questions">Questions</TabsTrigger>
          <TabsTrigger value="reference">Quick reference</TabsTrigger>
        </TabsList>

        <TabsContent value="details" className="mt-4">
          <GuideMetaPanel guide={guide} patch={patch} onSave={() => save()} saving={saving} />
        </TabsContent>

        <TabsContent value="narration" className="mt-4">
          <GuideNarrationPanel guide={guide} patch={patch} onGenerate={generateSection} busy={busy} />
        </TabsContent>

        <TabsContent value="questions" className="mt-4">
          <GuideQuestionsPanel
            questions={questions}
            onSave={saveQuestion}
            onDelete={deleteQuestion}
            onMove={moveQuestion}
            onGenerate={generateQuestion}
            busy={busy}
          />
        </TabsContent>

        <TabsContent value="reference" className="mt-4 space-y-4">
          <GuideReferencePanel guide={guide} patch={patch} />
          <Button onClick={() => save()} disabled={saving}>
            <Save className="w-4 h-4 mr-1" /> {saving ? 'Saving…' : 'Save guide'}
          </Button>
        </TabsContent>
      </Tabs>
    </div>
  );
}