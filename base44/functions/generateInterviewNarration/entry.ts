import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';

// Generates the narration audio for one section of an interview guide. The
// audio is stored and its URL returned, so the same file is replayed without
// regenerating it. Only signed-in staff can generate audio.
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
    if (script.length > 5000) {
      return Response.json(
        { error: 'This narration is longer than 5,000 characters. Shorten it, then generate again.' },
        { status: 400 }
      );
    }

    const result = await base44.integrations.Core.GenerateSpeech({
      text: script,
      voice: voice || 'honey',
      language_code: 'en',
    });

    if (!result?.url) {
      return Response.json({ error: 'The narration service did not return an audio file.' }, { status: 502 });
    }

    return Response.json({ audio_url: result.url, characters: script.length });
  } catch (error) {
    console.error('generateInterviewNarration failed', error);
    return Response.json({ error: error.message || 'Audio generation failed.' }, { status: 500 });
  }
}