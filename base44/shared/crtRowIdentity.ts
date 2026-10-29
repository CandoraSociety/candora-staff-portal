import { CLIENT_DATA_START_ROW } from './crtWorkbook.ts';

const norm = (value) => String(value || '').toLowerCase().replace(/,/g, ' ').split(/\s+/).filter(Boolean).sort().join(' ');

// Return every duplicate belonging to this client, not just the first/last
// HSID hit. A shared HSID must never select a differently named participant.
export function findCrtRowIndexes(values, hsid, clientName) {
  const id = String(hsid || '').trim();
  const name = norm(clientName);
  const sameId = [], sameName = [];
  const matchesName = (value) => {
    const candidate = norm(value);
    if (!candidate || !name) return false;
    if (candidate === name) return true;
    const a = candidate.split(' '), b = name.split(' ');
    return a.length >= 2 && b.length >= 2 &&
      (a.every(token => b.includes(token)) || b.every(token => a.includes(token)));
  };
  for (let i = CLIENT_DATA_START_ROW - 1; i < values.length; i++) {
    const row = values[i];
    if (!row || !String(row[0] || '').trim()) continue;
    if (id && String(row[1] || '').trim() === id) sameId.push(i);
    if (name && norm(row[0]) === name) sameName.push(i);
  }
  if (!sameId.length) return sameName;
  const identified = sameId.filter(i => matchesName(values[i][0]));
  if (identified.length) return identified;
  if (new Set(sameId.map(i => norm(values[i][0]))).size === 1) return sameId;
  throw new Error(`HSID ${id} belongs to multiple names; cannot safely match ${clientName}`);
}