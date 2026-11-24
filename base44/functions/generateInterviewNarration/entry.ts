import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';
import { speak, DEFAULT_GUIDE_VOICE, isGuideVoice } from '../../shared/guideSpeech.ts';

// Narrates one section of an interview guide that is written as a single piece -
// the introduction, the key-messages summary, or a short voice preview. The audio
// is stored and its URL returned, so the same file is replayed without generating
// it again. Only signed-in staff can generate audio.
export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me().catch((e) => (e.status === 401 ? null : Promise.reject(e)));
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { text, voice } = await req.json().catch(() => ({}));
    const script = String(text || '').trim();
    if (!script) {
      return Response.json({ error: 'There is no narration text to read for this section.' }, { status: 400 });
    }

    const audioUrl = await speak(base44, {
      text: script,
      voice: isGuideVoice(voice) ? voice : DEFAULT_GUIDE_VOICE,
    });

    return Response.json({ audio_url: audioUrl, characters: script.length });
  } catch (error) {
    console.error('generateInterviewNarration failed', error);
    return Response.json({ error: error.message || 'Audio generation failed.' }, { status: 500 });
  }
}