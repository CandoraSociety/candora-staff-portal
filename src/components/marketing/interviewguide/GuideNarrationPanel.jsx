import React from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Mic, CheckCircle2, ListMusic, Headphones } from 'lucide-react';
import VoicePicker from './VoicePicker';

const SECTIONS = [
  { key: 'intro', label: 'Introduction', textField: 'intro_narration', audioField: 'intro_audio_url' },
  { key: 'key_messages', label: 'Key messages only', textField: 'key_messages_narration', audioField: 'key_messages_audio_url' },
];

// The spoken sections that are written as a single piece, plus the voice the whole
// guide is narrated in. The questions and the quick reference are narrated from
// their written material, so there is no separate script to keep in step.
export default function GuideNarrationPanel({
  guide, patch, onGenerate, onGenerateQuickReference, onGenerateTips, busy, quickBusy, tipsBusy, onVoiceChange,
}) {
  const segments = guide.quick_reference_segments || [];
  const narrated = segments.filter((segment) => segment.audio_url).length;
  const tipsSegments = guide.tips_segments || [];
  const tipsNarrated = tipsSegments.filter((segment) => segment.audio_url).length;

  return (
    <div className="space-y-5">
      <VoicePicker guide={guide} onVoiceChange={onVoiceChange} />

      <p className="text-sm text-muted-foreground">
        The narrator briefs Dawn like a colleague: the question as the host will ask it, then the key points and context
        category by category, then the key message — with a real pause after every point so the material has time to
        settle. Nothing is turned into a scripted answer.
      </p>

      {SECTIONS.map((section) => {
        const text = guide[section.textField] || '';
        const audio = guide[section.audioField];
        const isBusy = Boolean(busy?.[section.key]);
        return (
          <div key={section.key} className="rounded-xl border p-4 space-y-2">
            <div className="flex items-center justify-between gap-2">
              <Label>{section.label} narration</Label>
              <span className="text-xs text-muted-foreground">{text.length.toLocaleString()} characters</span>
            </div>
            <Textarea
              rows={6}
              value={text}
              onChange={(e) => patch({ [section.textField]: e.target.value })}
            />
            <div className="flex flex-wrap items-center gap-2">
              <Button size="sm" variant="outline" disabled={!text.trim() || isBusy}
                onClick={() => onGenerate(section.key, text)}>
                <Mic className="w-3.5 h-3.5 mr-1" />
                {isBusy ? 'Generating…' : audio ? 'Regenerate audio' : 'Generate audio'}
              </Button>
              {audio ? (
                <>
                  <span className="text-xs text-green-700 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Audio ready
                  </span>
                  <audio controls src={audio} className="h-8" />
                </>
              ) : (
                <span className="text-xs text-muted-foreground">No audio generated yet</span>
              )}
            </div>
          </div>
        );
      })}

      <div className="rounded-xl border p-4 space-y-2">
        <Label>Quick reference narration</Label>
        <p className="text-xs text-muted-foreground">
          Read from the written quick reference, in the same order: priority messages, partners, dates, reminders and
          contacts — each category announced before its items.
        </p>
        <div className="flex flex-wrap items-center gap-2">
          <Button size="sm" variant="outline" disabled={quickBusy} onClick={() => onGenerateQuickReference(false)}>
            <ListMusic className="w-3.5 h-3.5 mr-1" />
            {quickBusy ? 'Generating…' : narrated ? 'Finish narration' : 'Generate narration'}
          </Button>
          {narrated > 0 && (
            <Button size="sm" variant="ghost" disabled={quickBusy} onClick={() => onGenerateQuickReference(true)}>
              Regenerate all
            </Button>
          )}
          <span className="text-xs text-muted-foreground">
            {segments.length ? `${narrated} of ${segments.length} clips ready` : 'No narration generated yet'}
          </span>
        </div>
      </div>

      <div className="rounded-xl border p-4 space-y-2">
        <Label>Interview tips narration</Label>
        <p className="text-xs text-muted-foreground">
          The general media interview coaching shown in the Interview tips tab — twelve numbered sections, each heading
          and point read on its own with a pause between them. The tips are the same for every guide, so this only has
          to be recorded once per guide.
        </p>
        <div className="flex flex-wrap items-center gap-2">
          <Button size="sm" variant="outline" disabled={tipsBusy} onClick={() => onGenerateTips(false)}>
            <Headphones className="w-3.5 h-3.5 mr-1" />
            {tipsBusy ? 'Generating…' : tipsNarrated ? 'Finish narration' : 'Generate narration'}
          </Button>
          {tipsNarrated > 0 && (
            <Button size="sm" variant="ghost" disabled={tipsBusy} onClick={() => onGenerateTips(true)}>
              Regenerate all
            </Button>
          )}
          <span className="text-xs text-muted-foreground">
            {tipsSegments.length ? `${tipsNarrated} of ${tipsSegments.length} clips ready` : 'No narration generated yet'}
          </span>
        </div>
      </div>
    </div>
  );
}