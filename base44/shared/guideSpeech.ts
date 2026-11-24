// Narration for an interview preparation guide.
//
// The guide is a briefing, not a script: the narrator works through the written
// material the way a colleague would — announcing the question, then the cue
// "Key points and context for the response", then each thematic category and its
// individual talking points, and finally the key message. Each of those is its
// own short audio clip, and a real pause is left after every one, so the listener
// has time to take the material in and the reader can highlight the point being
// spoken. Nothing here invents content: every clip is read from the written guide.

export const GUIDE_VOICES = [
  { id: 'nova', label: 'Nova', note: 'Warm, mature female — recommended' },
  { id: 'shimmer', label: 'Shimmer', note: 'Soft, gentle female' },
  { id: 'sage', label: 'Sage', note: 'Calm, measured female' },
  { id: 'coral', label: 'Coral', note: 'Friendly, brighter female' },
  { id: 'marin', label: 'Marin', note: 'Natural, conversational female' },
];

export const DEFAULT_GUIDE_VOICE = 'nova';

export const isGuideVoice = (voice) => GUIDE_VOICES.some((v) => v.id === voice);

// Delivery guidance for the speech model. This shapes how it sounds, never what
// it says.
const VOICE_STYLE = [
  'Speak as a warm, knowledgeable colleague briefing a spokesperson before a media interview.',
  'Neutral North American pronunciation, no regional accent.',
  'Natural, deliberate pace, clear and informative rather than performative.',
  'Supportive and calm, with light emphasis on names, numbers and dates.',
  'Never sound like an actor reading a script.',
].join(' ');

// Pauses that follow each kind of clip, in milliseconds.
export const PAUSES = {
  question: 2000,
  cue: 800,
  heading: 1000,
  point: 1200,
  categoryEnd: 2000,
  keyEnd: 3000,
  sectionEnd: 1000,
};

// Removes written-only markup and spells out addresses the way a person would
// say them, so the narrator never reads a bullet, an asterisk or a URL.
export function spokenText(raw) {
  return String(raw || '')
    .replace(/\*\*/g, '')
    .replace(/Candora\.ca\/donate\/?/gi, 'Candora dot C A, slash donate')
    .replace(/Candora\.ca(?![\w])/gi, 'Candora dot C A')
    .replace(/\s+/g, ' ')
    .trim();
}

const slug = (value) => String(value || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

// Runs `worker` over the items a few at a time, so a whole question is narrated
// in one pass without opening more connections than the runtime allows.
export async function mapLimit(items, limit, worker) {
  const out = new Array(items.length);
  let cursor = 0;
  const runners = Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (cursor < items.length) {
      const index = cursor;
      cursor += 1;
      out[index] = await worker(items[index], index);
    }
  });
  await Promise.all(runners);
  return out;
}

// One clip of speech, stored so it replays without generating again.
export async function speak(base44, { text, voice }) {
  const script = spokenText(text);
  if (!script) throw new Error('There is no narration text to read for this section.');
  if (script.length > 4096) {
    throw new Error('This section is too long to narrate in one clip. Split it into shorter talking points.');
  }

  const connection = await base44.asServiceRole.aiGateway.connection();
  const res = await fetch(`${connection.baseURL}/audio/speech`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${connection.token}`,
      ...(connection.headers || {}),
    },
    signal: AbortSignal.timeout(60000),
    body: JSON.stringify({
      model: 'gpt_4o_mini_tts',
      input: script,
      voice: isGuideVoice(voice) ? voice : DEFAULT_GUIDE_VOICE,
      response_format: 'mp3',
      speed: 0.95,
      language: 'en',
      instructions: VOICE_STYLE,
    }),
  });

  if (!res.ok) {
    const detail = await res.text().catch(() => '');
    throw new Error(`The narration service refused this section (${res.status}). ${detail.slice(0, 160)}`);
  }

  const bytes = await res.arrayBuffer();
  const file = new File([bytes], `guide-narration-${Date.now()}-${Math.random().toString(16).slice(2, 8)}.mp3`, {
    type: 'audio/mpeg',
  });
  const uploaded = await base44.asServiceRole.integrations.Core.UploadPublicFile({ file });
  if (!uploaded?.file_url) throw new Error('The narration audio could not be stored.');
  return uploaded.file_url;
}

const splitParagraphs = (value) =>
  String(value || '')
    .split(/\n{2,}/)
    .map((part) => spokenText(part))
    .filter(Boolean);

// The spoken order for one question: the question, the cue, every category with
// its talking points, then the key message.
export function buildQuestionSegments(question) {
  const segments = [];
  const push = (segment) => segments.push(segment);

  push({
    id: 'q',
    kind: 'question',
    text: spokenText(question?.question),
    category_label: 'The question',
    category_index: null,
    point_index: null,
    pause_after_ms: PAUSES.question,
  });

  push({
    id: 'cue',
    kind: 'cue',
    text: 'Key points and context for the response.',
    category_label: 'Key points and context',
    category_index: null,
    point_index: null,
    pause_after_ms: PAUSES.cue,
  });

  const categories = question?.categories || [];
  categories.forEach((category, categoryIndex) => {
    push({
      id: `h${categoryIndex}`,
      kind: 'heading',
      text: spokenText(category.heading),
      category_label: spokenText(category.heading),
      category_index: categoryIndex,
      point_index: null,
      pause_after_ms: PAUSES.heading,
    });

    const points = category.points || [];
    points.forEach((point, pointIndex) => {
      const lastOfCategory = pointIndex === points.length - 1;
      push({
        id: `p${categoryIndex}-${pointIndex}`,
        kind: 'point',
        text: spokenText(point),
        category_label: spokenText(category.heading),
        category_index: categoryIndex,
        point_index: pointIndex,
        pause_after_ms: lastOfCategory ? PAUSES.categoryEnd : PAUSES.point,
      });
    });
  });

  push({
    id: 'keylabel',
    kind: 'keylabel',
    text: 'Key message.',
    category_label: 'Key message',
    category_index: null,
    point_index: null,
    pause_after_ms: PAUSES.cue,
  });

  const keyParagraphs = splitParagraphs(question?.key_message);
  keyParagraphs.forEach((paragraph, index) => {
    push({
      id: `k${index}`,
      kind: 'key',
      text: paragraph,
      category_label: 'Key message',
      category_index: null,
      point_index: index,
      pause_after_ms: index === keyParagraphs.length - 1 ? PAUSES.keyEnd : PAUSES.point,
    });
  });

  return segments;
}

// The spoken quick reference — the one-page cheat sheet read aloud in the same
// order it is written: for each question the question itself, its key message and
// its short bullets, then the essential donation information once at the end.
export function buildQuickReferenceSegments(guide, questions = []) {
  const segments = [];
  const push = (segment) =>
    segments.push({ category_index: null, point_index: null, ...segment });

  push({
    id: 'qr-intro',
    kind: 'cue',
    text: 'Interview quick reference. The essentials for each question, then where to send donations.',
    category_label: 'Interview quick reference',
    pause_after_ms: PAUSES.cue,
  });

  (questions || []).forEach((question, questionIndex) => {
    const label = `Question ${questionIndex + 1}`;

    push({
      id: `qr-q${questionIndex}`,
      kind: 'question',
      text: spokenText(question?.question),
      category_label: label,
      category_index: questionIndex,
      pause_after_ms: PAUSES.question,
    });

    const keyParagraphs = splitParagraphs(question?.key_message);
    keyParagraphs.forEach((paragraph, index) => {
      push({
        id: `qr-k${questionIndex}-${index}`,
        kind: 'key',
        text: paragraph,
        category_label: label,
        category_index: questionIndex,
        point_index: index,
        pause_after_ms: index === keyParagraphs.length - 1 ? PAUSES.categoryEnd : PAUSES.point,
      });
    });

    const bullets = (question?.quick_points || []).filter(Boolean);
    bullets.forEach((bullet, index) => {
      push({
        id: `qr-p${questionIndex}-${index}`,
        kind: 'point',
        text: spokenText(bullet),
        category_label: label,
        category_index: questionIndex,
        point_index: index,
        pause_after_ms: index === bullets.length - 1 ? PAUSES.categoryEnd : PAUSES.point,
      });
    });
  });

  // The promotional box that closes the sheet: its heading, then each block with
  // every one of its lines as its own clip, so there is a real pause between them.
  const promoRows = (guide?.quick_reference_info || []).filter((row) => row?.label && (row.value || row.url));
  if (promoRows.length) {
    push({
      id: 'qr-promo',
      kind: 'heading',
      text: 'Essential promotional information.',
      category_label: 'Essential promotional information',
      pause_after_ms: PAUSES.heading,
    });

    promoRows.forEach((row, rowIndex) => {
      const label = spokenText(row.label);
      push({
        id: `qr-promo-h${rowIndex}`,
        kind: 'heading',
        text: label,
        category_label: label,
        pause_after_ms: PAUSES.cue,
      });

      const rowLines = String(row.value || '')
        .split(/\n+/)
        .map((line) => spokenText(line))
        .filter(Boolean);

      rowLines.forEach((line, index) => {
        push({
          id: `qr-promo-${rowIndex}-${index}`,
          kind: 'point',
          text: line,
          category_label: label,
          point_index: index,
          pause_after_ms: index === rowLines.length - 1 ? PAUSES.categoryEnd : PAUSES.point,
        });
      });
    });
  }

  if (segments.length > 1) {
    segments[segments.length - 1].pause_after_ms = PAUSES.sectionEnd;
  }

  return segments.filter((segment) => segment.text);
}

// Fills in the audio for every clip that has none (or that was recorded in a
// different voice), stopping at the time budget so one request never runs away.
// Clips already narrated are kept, so a stopped run simply continues next time.
export async function fillSegmentAudio(base44, segments, { voice, regenerate, budgetMs = 200000 }) {
  const started = Date.now();
  const pending = segments.filter(
    (segment) => regenerate || !segment.audio_url || segment.voice !== voice
  );

  const spoken = [];
  let remaining = 0;

  await mapLimit(pending, 5, async (segment) => {
    if (Date.now() - started > budgetMs) {
      remaining += 1;
      return;
    }
    try {
      const audioUrl = await speak(base44, { text: segment.text, voice });
      spoken.push({ id: segment.id, audio_url: audioUrl });
    } catch (error) {
      console.error('guide narration segment failed', segment.id, error?.message);
      remaining += 1;
    }
  });

  const byId = new Map(spoken.map((entry) => [entry.id, entry.audio_url]));
  const next = segments.map((segment) => {
    const audioUrl = byId.get(segment.id);
    if (audioUrl) return { ...segment, audio_url: audioUrl, voice };
    if (segment.voice && segment.voice !== voice) return { ...segment, audio_url: '', voice };
    return segment;
  });

  return {
    segments: next,
    total: segments.length,
    narrated: next.filter((segment) => segment.audio_url).length,
    remaining,
  };
}

export { slug };