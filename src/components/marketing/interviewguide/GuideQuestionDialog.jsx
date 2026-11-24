import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { pointsToText, textToPoints } from '@/lib/interviewGuides';

// One question: what the host asks, the written points, and the spoken script.
export default function GuideQuestionDialog({ question, onClose, onSave }) {
  const [form, setForm] = useState({
    question: question?.question || '',
    key_message: question?.key_message || '',
    talking_points: pointsToText(question?.talking_points || []),
    checklist: (question?.checklist || []).join('\n'),
    narration: question?.narration || '',
  });
  const set = (key, value) => setForm((f) => ({ ...f, [key]: value }));

  const submit = () => onSave({
    question: form.question,
    key_message: form.key_message,
    talking_points: textToPoints(form.talking_points),
    checklist: form.checklist.split('\n').map((l) => l.trim()).filter(Boolean),
    narration: form.narration,
  });

  return (
    <div className="space-y-3">
      <div>
        <Label>Question as the host will ask it *</Label>
        <Textarea rows={2} value={form.question} onChange={(e) => set('question', e.target.value)} />
      </div>
      <div>
        <Label>Talking points</Label>
        <Textarea
          rows={8}
          value={form.talking_points}
          onChange={(e) => set('talking_points', e.target.value)}
          placeholder={'One point per line.\nStart a line with - to add a detail under the point above.'}
        />
      </div>
      <div>
        <Label>Key message</Label>
        <Textarea rows={3} value={form.key_message} onChange={(e) => set('key_message', e.target.value)} />
      </div>
      <div>
        <Label>Practice checklist (one per line)</Label>
        <Textarea rows={3} value={form.checklist} onChange={(e) => set('checklist', e.target.value)} />
      </div>
      <div>
        <Label>Spoken narration</Label>
        <Textarea
          rows={6}
          value={form.narration}
          onChange={(e) => set('narration', e.target.value)}
          placeholder="Read the question first, pause, then the talking points in your own spoken words."
        />
      </div>
      <div className="flex justify-end gap-2">
        <Button variant="outline" onClick={onClose}>Cancel</Button>
        <Button onClick={submit} disabled={!form.question.trim()}>Save question</Button>
      </div>
    </div>
  );
}