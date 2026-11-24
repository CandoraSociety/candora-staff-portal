import React, { useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Volume2 } from 'lucide-react';
import { GUIDE_VOICES, generateNarration } from '@/lib/interviewGuides';

// A short sample of the guide being narrated, so the voice can be confirmed before
// the whole guide is regenerated in it.
const PREVIEW = [
  'Question two.',
  'You’ve got an exciting few days coming up — tell us about Candora’s Kids’ Gift Shop, what it is and how people can get involved?',
  'Key points and context for the response.',
  'The scale of the initiative.',
  'We typically have up to 500 children registered for Kids’ Gift Shop each year.',
].join(' ');

export default function VoicePicker({ guide, onVoiceChange }) {
  const [previewUrl, setPreviewUrl] = useState('');
  const [busy, setBusy] = useState(false);

  const preview = async () => {
    setBusy(true);
    try {
      setPreviewUrl(await generateNarration({ text: PREVIEW, voice: guide.voice }));
    } catch (error) {
      toast.error(error.message || 'The voice preview could not be generated');
    } finally {
      setBusy(false);
    }
  };

  const current = GUIDE_VOICES.find((voice) => voice.id === guide.voice) || GUIDE_VOICES[0];

  return (
    <div className="rounded-xl border p-4 space-y-2">
      <Label>Narrator voice</Label>
      <p className="text-xs text-muted-foreground">
        A North American female voice with neutral pronunciation. Listen to the sample before regenerating the guide.
      </p>
      <div className="flex flex-wrap items-center gap-2">
        <Select value={current.id} onValueChange={onVoiceChange}>
          <SelectTrigger className="w-64"><SelectValue /></SelectTrigger>
          <SelectContent>
            {GUIDE_VOICES.map((voice) => (
              <SelectItem key={voice.id} value={voice.id}>
                {voice.label} — {voice.note}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button size="sm" variant="outline" onClick={preview} disabled={busy}>
          <Volume2 className="w-3.5 h-3.5 mr-1" /> {busy ? 'Preparing sample…' : 'Preview this voice'}
        </Button>
      </div>
      {previewUrl && (
        <audio key={previewUrl} controls autoPlay src={previewUrl} className="h-9 w-full max-w-md" />
      )}
      <p className="text-xs text-muted-foreground">
        Changing the voice does not change the audio already recorded. Regenerate the sections and every question after
        choosing a new voice.
      </p>
    </div>
  );
}