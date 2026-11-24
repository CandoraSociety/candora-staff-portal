import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';
import {
  buildQuestionSegments,
  buildQuickReferenceSegments,
  fillSegmentAudio,
  DEFAULT_GUIDE_VOICE,
  isGuideVoice,
} from '../../shared/guideSpeech.ts';

// Narrates the preparation material of a guide as short clips: the question, the
// "key points and context" cue, each category heading, each individual talking
// point and the key message - or the whole quick reference. Every clip is read
// from the written guide and is followed by a real pause, so the listener can
// take the material in and the reader can highlight the point being spoken.
//
// Clips already recorded in the chosen voice are kept; a run that runs out of
// time returns how many are left so the caller can simply ask again.
export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me().catch((e) => (e.status === 401 ? null : Promise.reject(e)));
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { guide_id, question_id, scope = 'question', voice, regenerate } = await req.json().catch(() => ({}));
    if (!guide_id) return Response.json({ error: 'A guide is required.' }, { status: 400 });

    const guide = await base44.asServiceRole.entities.InterviewGuide
      .get(guide_id)
      .catch((e) => (e.status === 404 ? null : Promise.reject(e)));
    if (!guide) return Response.json({ error: 'That guide could not be found.' }, { status: 404 });

    const chosen = isGuideVoice(voice) ? voice : isGuideVoice(guide.voice) ? guide.voice : DEFAULT_GUIDE_VOICE;

    if (scope === 'quick_reference') {
      const found = await base44.asServiceRole.entities.InterviewGuideQuestion.filter(
        { guide_id },
        { sort: 'display_order' }
      );
      const questions = Array.isArray(found) ? found : found?.items || [];
      const built = buildQuickReferenceSegments(guide, questions);
      if (!built.length) {
        return Response.json({ error: 'There is no quick-reference material to narrate yet.' }, { status: 400 });
      }
      const result = await fillSegmentAudio(base44, built, { voice: chosen, regenerate: Boolean(regenerate) });
      await base44.asServiceRole.entities.InterviewGuide.update(guide_id, {
        quick_reference_segments: result.segments,
        quick_reference_voice: chosen,
        quick_reference_generated_at: new Date().toISOString(),
      });
      return Response.json({
        scope,
        voice: chosen,
        total: result.total,
        narrated: result.narrated,
        remaining: result.remaining,
      });
    }

    if (!question_id) return Response.json({ error: 'A question is required.' }, { status: 400 });

    const question = await base44.asServiceRole.entities.InterviewGuideQuestion
      .get(question_id)
      .catch((e) => (e.status === 404 ? null : Promise.reject(e)));
    if (!question) return Response.json({ error: 'That question could not be found.' }, { status: 404 });

    const built = buildQuestionSegments(question);
    if (!built.some((segment) => segment.kind === 'point')) {
      return Response.json(
        { error: 'Add the talking points for this question before generating its narration.' },
        { status: 400 }
      );
    }

    const result = await fillSegmentAudio(base44, built, { voice: chosen, regenerate: Boolean(regenerate) });
    await base44.asServiceRole.entities.InterviewGuideQuestion.update(question_id, {
      narration_segments: result.segments,
      voice_used: chosen,
      audio_generated_at: new Date().toISOString(),
    });

    return Response.json({
      scope,
      question_id,
      voice: chosen,
      total: result.total,
      narrated: result.narrated,
      remaining: result.remaining,
    });
  } catch (error) {
    console.error('generateGuideNarration failed', error);
    return Response.json({ error: error.message || 'Audio generation failed.' }, { status: 500 });
  }
}