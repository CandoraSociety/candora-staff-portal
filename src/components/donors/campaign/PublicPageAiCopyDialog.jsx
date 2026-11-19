import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, Sparkles } from 'lucide-react';
import { CAMPAIGN_TYPES, formatMoney } from '@/lib/donorConstants';

// Writes the campaign page's tagline, story and thank-you message from the
// campaign's own details plus any direction the staff member adds.
export default function PublicPageAiCopyDialog({ campaign, onSave }) {
  const [open, setOpen] = useState(false);
  const [direction, setDirection] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [draft, setDraft] = useState(null);
  const [saving, setSaving] = useState(false);

  const typeLabel = CAMPAIGN_TYPES.find((t) => t.value === campaign?.campaign_type)?.label || 'appeal';

  const changeOpen = (value) => {
    setOpen(value);
    if (value) {
      setDraft(null);
      setError('');
    }
  };

  const generate = async () => {
    setBusy(true);
    setError('');
    try {
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `You write fundraising copy for Candora, a Canadian non-profit that runs employment, family and community programs.

Write the public page copy for this campaign:
- Campaign name: ${campaign?.name || 'Untitled campaign'}
- Type: ${typeLabel}
- Goal: ${campaign?.goal_amount ? formatMoney(campaign.goal_amount) : 'no set goal'}
- Current short description: ${campaign?.description || 'none yet'}
- Current story (may be empty): ${campaign?.story || 'none yet'}
${direction.trim() ? `- Direction from the fundraiser: ${direction.trim()}` : ''}

Return:
- tagline: one short line under the campaign title, under 12 words.
- story: 3 to 5 short paragraphs separated by a blank line, written in warm plain Canadian English, second person where it helps ("your gift"), no headings, no markdown, no bullet points. Say who is helped, what a gift makes possible, and why it matters now. Do not invent statistics, dollar figures or named people.
- thank_you_message: 1 to 2 sentences shown right after someone gives.`,
        response_json_schema: {
          type: 'object',
          properties: {
            tagline: { type: 'string' },
            story: { type: 'string' },
            thank_you_message: { type: 'string' },
          },
          required: ['tagline', 'story', 'thank_you_message'],
        },
      });
      setDraft(result);
    } catch (e) {
      setError(e.message || 'The copy could not be written. Try again.');
    }
    setBusy(false);
  };

  const use = async () => {
    setSaving(true);
    await onSave({
      tagline: draft.tagline || '',
      story: draft.story || '',
      thank_you_message: draft.thank_you_message || '',
    });
    setSaving(false);
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={changeOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <Sparkles className="w-4 h-4 mr-2" /> Write copy with AI
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Write the page copy</DialogTitle>
          <DialogDescription>
            Uses the campaign's name, type, goal and description. Add any direction you want, then review before saving.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label>Anything to steer it? (optional)</Label>
            <Textarea
              rows={3}
              value={direction}
              onChange={(e) => setDirection(e.target.value)}
              placeholder="Focus on parents who are job hunting, keep it hopeful, mention the winter coat drive"
            />
          </div>

          {draft && (
            <div className="space-y-3 rounded-lg border bg-muted/40 p-4">
              <div>
                <Label>Tagline</Label>
                <Input value={draft.tagline} onChange={(e) => setDraft({ ...draft, tagline: e.target.value })} />
              </div>
              <div>
                <Label>Story</Label>
                <Textarea rows={10} value={draft.story} onChange={(e) => setDraft({ ...draft, story: e.target.value })} />
              </div>
              <div>
                <Label>Thank-you message</Label>
                <Textarea rows={3} value={draft.thank_you_message} onChange={(e) => setDraft({ ...draft, thank_you_message: e.target.value })} />
              </div>
            </div>
          )}

          {error && <p className="text-sm text-destructive">{error}</p>}
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={generate} disabled={busy}>
            {busy && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            {busy ? 'Writing…' : draft ? 'Write again' : 'Write copy'}
          </Button>
          <Button onClick={use} disabled={!draft || saving}>
            {saving ? 'Saving…' : 'Use this copy'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}