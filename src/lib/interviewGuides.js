import { base44 } from '@/api/base44Client';

export const shareLink = (guide) => `${window.location.origin}/interview-guide/${guide.token}`;

export const newToken = () =>
  (crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`).replace(/-/g, '');

// Turns the stored talking points into the plain text an editor shows.
export const pointsToText = (points = []) =>
  points.map((p) => [p.text, ...(p.details || []).map((d) => `  - ${d}`)].join('\n')).join('\n');

// Reads that text back: a line starting with "-" is a detail of the point above it.
export const textToPoints = (text = '') => {
  const out = [];
  text.split('\n').forEach((line) => {
    const trimmed = line.trim();
    if (!trimmed) return;
    if (/^[-•]\s+/.test(trimmed) && out.length > 0) {
      out[out.length - 1].details.push(trimmed.replace(/^[-•]\s+/, ''));
      return;
    }
    out.push({ text: trimmed, details: [] });
  });
  return out;
};

export async function generateNarration({ text, voice }) {
  const res = await base44.functions.invoke('generateInterviewNarration', { text, voice });
  if (res.data?.error) throw new Error(res.data.error);
  if (!res.data?.audio_url) throw new Error('The narration service did not return an audio file.');
  return res.data.audio_url;
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