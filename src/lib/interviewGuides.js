import { base44 } from '@/api/base44Client';

// The narrator voices offered for a guide. The same ids are used by the speech
// function, which knows how each one sounds.
export const GUIDE_VOICES = [
  { id: 'nova', label: 'Nova', note: 'Warm, mature female — recommended' },
  { id: 'shimmer', label: 'Shimmer', note: 'Soft, gentle female' },
  { id: 'sage', label: 'Sage', note: 'Calm, measured female' },
  { id: 'coral', label: 'Coral', note: 'Friendly, brighter female' },
  { id: 'marin', label: 'Marin', note: 'Natural, conversational female' },
];

export const shareLink = (guide) => `${window.location.origin}/interview-guide/${guide.token}`;

export const newToken = () =>
  (crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`).replace(/-/g, '');

// Categories are edited as plain text: "# Heading" starts a category, every other
// line is one talking point under it.
export const categoriesToText = (categories = []) =>
  categories
    .map((category) => [`# ${category.heading || ''}`, ...(category.points || []).map((point) => `- ${point}`)].join('\n'))
    .join('\n\n');

export const textToCategories = (text = '') => {
  const out = [];
  String(text).split('\n').forEach((line) => {
    const trimmed = line.trim();
    if (!trimmed) return;
    if (trimmed.startsWith('#')) {
      out.push({ heading: trimmed.replace(/^#+\s*/, ''), points: [] });
      return;
    }
    if (!out.length) out.push({ heading: 'Key points', points: [] });
    out[out.length - 1].points.push(trimmed.replace(/^[-•*]\s*/, ''));
  });
  return out.filter((category) => String(category.heading || '').trim());
};

// One section written as a single piece of speech - the introduction, the
// key-messages summary, or a short voice preview.
export async function generateNarration({ text, voice }) {
  const res = await base44.functions.invoke('generateInterviewNarration', { text, voice });
  if (res.data?.error) throw new Error(res.data.error);
  if (!res.data?.audio_url) throw new Error('The narration service did not return an audio file.');
  return res.data.audio_url;
}

// Narrates the preparation material of one question, or the quick reference, as
// short clips. A run that stops before it is finished reports what is left, so it
// is simply asked again until every clip has audio.
export async function narrateStructure({ guideId, questionId, scope, voice, regenerate, segments }) {
  let last = null;
  for (let pass = 0; pass < 8; pass += 1) {
    const res = await base44.functions.invoke('generateGuideNarration', {
      guide_id: guideId,
      question_id: questionId,
      scope,
      voice,
      segments,
      regenerate: pass === 0 ? Boolean(regenerate) : false,
    });
    if (res.data?.error) throw new Error(res.data.error);
    last = res.data;
    if (!last?.remaining) return last;
  }
  return last;
}

// The flat list of clips the reader plays: the introduction, every question's
// clips in order, the key-messages summary and the quick reference.
export function buildPlaylist(guide, questions = []) {
  if (!guide) return [];
  const playlist = [];

  if (guide.intro_audio_url) {
    playlist.push({
      key: 'intro',
      section: 'intro',
      sectionLabel: 'Introduction',
      categoryLabel: 'How to use this guide',
      segmentId: 'intro',
      questionId: null,
      categoryIndex: null,
      kind: 'intro',
      text: '',
      url: guide.intro_audio_url,
      pauseAfterMs: 1000,
    });
  }

  questions.forEach((question, index) => {
    (question.narration_segments || []).forEach((segment) => {
      if (!segment.audio_url) return;
      playlist.push({
        key: `${question.id}-${segment.id}`,
        section: 'question',
        sectionLabel: `Question ${index + 1}`,
        categoryLabel: segment.category_label || 'Preparation',
        segmentId: segment.id,
        questionId: question.id,
        categoryIndex: segment.category_index ?? null,
        kind: segment.kind,
        text: segment.text || '',
        url: segment.audio_url,
        pauseAfterMs: segment.pause_after_ms || 0,
      });
    });
  });

  if (guide.key_messages_audio_url) {
    playlist.push({
      key: 'key-messages',
      section: 'key',
      sectionLabel: 'Key messages',
      categoryLabel: 'All five key messages',
      segmentId: 'key-messages',
      questionId: null,
      categoryIndex: null,
      kind: 'key',
      text: '',
      url: guide.key_messages_audio_url,
      pauseAfterMs: 1000,
    });
  }

  (guide.quick_reference_segments || []).forEach((segment) => {
    if (!segment.audio_url) return;
    playlist.push({
      key: `quick-${segment.id}`,
      section: 'quick',
      sectionLabel: 'Quick reference',
      categoryLabel: segment.category_label || 'Quick reference',
      segmentId: segment.id,
      questionId: null,
      categoryIndex: segment.category_index ?? null,
      kind: segment.kind,
      text: segment.text || '',
      url: segment.audio_url,
      pauseAfterMs: segment.pause_after_ms || 0,
    });
  });

  return playlist;
}

// The clips behind the Interview tips tab: the general coaching sections, read
// from the stored tips narration. Empty until the tips have been narrated.
export function buildTipsPlaylist(guide) {
  if (!guide) return [];
  return (guide.tips_segments || [])
    .filter((segment) => segment.audio_url)
    .map((segment) => ({
      key: `tips-${segment.id}`,
      section: 'tips',
      sectionLabel: 'Interview tips',
      categoryLabel: segment.category_label || 'Interview tips',
      segmentId: segment.id,
      questionId: null,
      categoryIndex: segment.category_index ?? null,
      kind: segment.kind,
      text: segment.text || '',
      url: segment.audio_url,
      pauseAfterMs: segment.pause_after_ms || 0,
    }));
}

// "Name | note", "When | event | location", "Label | value | url" - one per line.
export const textToRows = (text, keys) =>
  text
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const cells = line.split('|').map((c) => c.trim());
      const row = {};
      keys.forEach((key, i) => { row[key] = cells[i] || ''; });
      return row;
    });

export const rowsToText = (rows = [], keys) =>
  rows.map((row) => keys.map((key) => row[key] || '').join(' | ')).join('\n');