// Shared Central Database client-matching helpers — fuzzy name similarity and
// match-reason scoring. Used by the Pathways intake matcher and the ELL learner
// form's "similar existing clients" suggestions.

export const norm = (s) => (s || '').toString().toLowerCase().trim();
export const digits = (s) => (s || '').toString().replace(/\D/g, '');

export function levenshtein(a, b) {
  if (a === b) return 0;
  if (!a.length) return b.length;
  if (!b.length) return a.length;
  const prev = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 0; i < a.length; i++) {
    let cur = i + 1;
    for (let j = 0; j < b.length; j++) {
      const tmp = prev[j + 1];
      const cost = a[i] === b[j] ? 0 : 1;
      const sub = prev[j] + cost;
      const ins = cur + 1;
      const del = prev[j + 1] + 1;
      cur = Math.min(sub, ins, del);
      prev[j] = tmp;
    }
    prev[prev.length - 1] = cur;
  }
  return prev[prev.length - 1];
}

export function nameSimilarity(cand, client) {
  const a = `${norm(cand.first_name)} ${norm(cand.last_name)}`;
  const b = `${norm(client.first_name)} ${norm(client.last_name)}`;
  if (!a || !b) return 0;
  const dist = levenshtein(a, b);
  return 1 - dist / Math.max(a.length, b.length);
}

export function matchReasons(cand, client) {
  const reasons = [];
  if (client.email && cand.email && norm(cand.email) === norm(client.email)) {
    reasons.push({ label: 'Exact email match', strong: true });
  }
  if (client.phone && cand.phone && digits(cand.phone) && digits(cand.phone) === digits(client.phone)) {
    reasons.push({ label: 'Exact phone match', strong: true });
  }
  if (cand.date_of_birth && client.date_of_birth && cand.date_of_birth === client.date_of_birth) {
    reasons.push({ label: 'Same date of birth', strong: true });
  }
  const sim = nameSimilarity(cand, client);
  if (sim >= 0.92) reasons.push({ label: 'Same name', strong: true });
  else if (sim >= 0.6) reasons.push({ label: 'Similar name', strong: false });
  return { reasons, sim, strength: reasons.filter((r) => r.strong).length };
}

export const fullName = (c) => `${c.first_name || ''} ${c.last_name || ''}`.trim();