import React from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Mic, CheckCircle2 } from 'lucide-react';

const SECTIONS = [
  { key: 'intro', label: 'Introduction', textField: 'intro_narration', audioField: 'intro_audio_url' },
  { key: 'key_messages', label: 'Key messages only', textField: 'key_messages_narration', audioField: 'key_messages_audio_url' },
  { key: 'quick_reference', label: 'Quick reference', textField: 'quick_reference_narration', audioField: 'quick_reference_audio_url' },
];

// The spoken script, kept separate from the written talking points.
export default function GuideNarrationPanel({ guide, patch, onGenerate, busy }) {
  return (
    <div className="space-y-5">
      <p className="text-sm text-muted-foreground">
        Write these the way they should be heard — conversational, not read from a page. Audio is stored once
        generated, so it replays without using any more credits.
      </p>

      {SECTIONS.map((section) => {
        const text = guide[section.textField] || '';
        const audio = guide[section.audioField];
        const isBusy = Boolean(busy[section.key]);
        const tooLong = text.length > 5000;
        return (
          <div key={section.key} className="rounded-xl border p-4 space-y-2">
            <div className="flex items-center justify-between gap-2">
              <Label>{section.label} narration</Label>
              <span className={`text-xs ${tooLong ? 'text-destructive' : 'text-muted-foreground'}`}>
                {text.length.toLocaleString()} / 5,000
              </span>
            </div>
            <Textarea
              rows={6}
              value={text}
              onChange={(e) => patch({ [section.textField]: e.target.value })}
            />
            <div className="flex flex-wrap items-center gap-2">
              <Button size="sm" variant="outline" disabled={!text.trim() || tooLong || isBusy}
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
            {tooLong && (
              <p className="text-xs text-destructive">Shorten this to 5,000 characters or less, then generate again.</p>
            )}
          </div>
        );
      })}
    </div>
  );
}