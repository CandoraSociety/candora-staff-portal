import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { categoriesToText, textToCategories } from '@/lib/interviewGuides';

// One question: what the host asks, the preparation material grouped into thematic
// categories, the key message and the practice checklist. The narration is read
// from this same material, so the written and spoken versions stay in step.
export default function GuideQuestionDialog({ question, onClose, onSave }) {
  const [form, setForm] = useState({
    question: question?.question || '',
    key_message: question?.key_message || '',
    categories: categoriesToText(question?.categories || []),
    checklist: (question?.checklist || []).join('\n'),
  });
  const set = (key, value) => setForm((f) => ({ ...f, [key]: value }));

  const submit = () => onSave({
    question: form.question,
    key_message: form.key_message,
    categories: textToCategories(form.categories),
    checklist: form.checklist.split('\n').map((l) => l.trim()).filter(Boolean),
  });

  return (
    <div className="space-y-3">
      <div>
        <Label>Question as the host will ask it *</Label>
        <Textarea rows={2} value={form.question} onChange={(e) => set('question', e.target.value)} />
      </div>
      <div>
        <Label>Key points and context</Label>
        <p className="text-xs text-muted-foreground mb-1">
          Start a category with # and put each talking point on its own line. Wrap a phrase in ** to show it in bold.
        </p>
        <Textarea
          rows={14}
          value={form.categories}
          onChange={(e) => set('categories', e.target.value)}
          placeholder={'# Our history and community\n- Candora has been part of Northeast Edmonton for **nearly 40 years**.\n- We serve residents in Beverly, Abbottsfield and Rundle.'}
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
      <p className="text-xs text-muted-foreground">
        The narrator reads the question, each category heading and each talking point in this order. Regenerate the
        narration after changing the wording.
      </p>
      <div className="flex justify-end gap-2">
        <Button variant="outline" onClick={onClose}>Cancel</Button>
        <Button onClick={submit} disabled={!form.question.trim()}>Save question</Button>
      </div>
    </div>
  );
}