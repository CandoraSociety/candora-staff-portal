import { useState, useEffect, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Search, Database, CheckCircle2, Unlink, Loader2, UserPlus, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

const norm = (s) => (s || '').toString().toLowerCase().trim();
const digits = (s) => (s || '').toString().replace(/\D/g, '');

function levenshtein(a, b) {
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

function nameSimilarity(cand, client) {
  const a = `${norm(cand.first_name)} ${norm(cand.last_name)}`;
  const b = `${norm(client.first_name)} ${norm(client.last_name)}`;
  if (!a || !b) return 0;
  const dist = levenshtein(a, b);
  return 1 - dist / Math.max(a.length, b.length);
}

function matchReasons(cand, client) {
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

const fullName = (c) => `${c.first_name || ''} ${c.last_name || ''}`.trim();

export default function CentralDatabaseMatcher({ client, onLinked }) {
  const [suggestions, setSuggestions] = useState([]);
  const [manualQuery, setManualQuery] = useState('');
  const [manualResults, setManualResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [manualSearching, setManualSearching] = useState(false);
  const [linkedRecord, setLinkedRecord] = useState(null);
  const [loadingLinked, setLoadingLinked] = useState(false);
  const [saving, setSaving] = useState(null);
  const fetchedLinkedId = useRef(null);

  const clientId = client?.id;
  const linkedId = client?.linked_rc_client_id || null;

  // Auto-suggest from the client's identity fields.
  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      setSearching(true);
      try {
        const queries = [];
        if (client?.email) queries.push(base44.entities.RCClient.filter({ email: client.email }).catch(() => []));
        if (client?.first_name) queries.push(base44.entities.RCClient.filter({ first_name: client.first_name }).catch(() => []));
        if (client?.last_name) queries.push(base44.entities.RCClient.filter({ last_name: client.last_name }).catch(() => []));
        const results = await Promise.all(queries);
        const map = new Map();
        results.flat().forEach((c) => { if (c?.id) map.set(c.id, c); });
        const scored = Array.from(map.values())
          .map((c) => ({ c, ...matchReasons(c, client) }))
          .filter((s) => s.reasons.length > 0)
          .sort((a, b) => (b.strength - a.strength) || (b.sim - a.sim));
        if (!cancelled) setSuggestions(scored);
      } catch {
        if (!cancelled) setSuggestions([]);
      } finally {
        if (!cancelled) setSearching(false);
      }
    };
    run();
    return () => { cancelled = true; };
  }, [clientId, client?.first_name, client?.last_name, client?.email, client?.phone, client?.date_of_birth]);

  // Load the currently linked central record for display.
  useEffect(() => {
    if (linkedId === fetchedLinkedId.current) return;
    fetchedLinkedId.current = linkedId;
    if (!linkedId) { setLinkedRecord(null); return; }
    setLoadingLinked(true);
    base44.entities.RCClient.get(linkedId)
      .then((rec) => setLinkedRecord(rec))
      .catch(() => setLinkedRecord(null))
      .finally(() => setLoadingLinked(false));
  }, [linkedId]);

  const runManualSearch = async () => {
    const q = manualQuery.trim();
    if (!q) { setManualResults([]); return; }
    setManualSearching(true);
    try {
      const list = await base44.entities.RCClient.list('-updated_date', 300);
      const ql = q.toLowerCase();
      const filtered = (list || []).filter((c) => {
        const hay = `${fullName(c)} ${c.email || ''} ${c.phone || ''}`.toLowerCase();
        return hay.includes(ql);
      }).map((c) => ({ c, ...matchReasons(c, client) }));
      setManualResults(filtered);
    } catch {
      setManualResults([]);
    } finally {
      setManualSearching(false);
    }
  };

  const selectMatch = async (rcClientId) => {
    setSaving(rcClientId);
    try {
      await onLinked(rcClientId);
    } catch {
      toast.error('Could not link to Central Database record');
    } finally {
      setSaving(null);
    }
  };

  const clearMatch = async () => {
    setSaving('clear');
    try {
      await onLinked(null);
    } catch {
      toast.error('Could not unlink Central Database record');
    } finally {
      setSaving(null);
    }
  };

  const allCandidates = [
    ...suggestions.map((s) => ({ ...s, source: 'suggestion' })),
    ...manualResults
      .filter((m) => !suggestions.some((s) => s.c.id === m.c.id))
      .map((m) => ({ ...m, source: 'manual' })),
  ];

  return (
    <Card className="border-violet-200">
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Database className="w-4 h-4 text-violet-600" />
          Candora Central Database — Client Match
        </CardTitle>
        <p className="text-sm text-slate-500">
          Verify whether this person already exists in the Candora Central Database. If they do, link the existing record so the Pathways program indicator is added to it instead of creating a new file.
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Linked status */}
        {linkedId && (
          <div className="rounded-lg border border-green-200 bg-green-50 p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-2">
                <CheckCircle2 className="w-5 h-5 text-green-600 mt-0.5 shrink-0" />
                <div>
                  <p className="text-sm font-semibold text-green-800">Matched to existing Central Database record</p>
                  {loadingLinked ? (
                    <p className="text-xs text-green-700 mt-1 flex items-center gap-1"><Loader2 className="w-3 h-3 animate-spin" /> Loading record…</p>
                  ) : linkedRecord ? (
                    <div className="text-xs text-green-700 mt-1 space-y-0.5">
                      <p className="font-medium">{fullName(linkedRecord)}</p>
                      {(linkedRecord.email || linkedRecord.phone || linkedRecord.date_of_birth) && (
                        <p>
                          {linkedRecord.email && <>{linkedRecord.email}</>}
                          {linkedRecord.email && linkedRecord.phone && <> · </>}
                          {linkedRecord.phone && linkedRecord.phone}
                          {(linkedRecord.email || linkedRecord.phone) && linkedRecord.date_of_birth && <> · </>}
                          {linkedRecord.date_of_birth && <>DOB {linkedRecord.date_of_birth}</>}
                        </p>
                      )}
                      {(linkedRecord.program_participations || []).length > 0 && (
                        <p className="mt-1 text-green-600">
                          Programs: {linkedRecord.program_participations.map((p) => p.program).join(', ')}
                        </p>
                      )}
                    </div>
                  ) : (
                    <p className="text-xs text-green-700 mt-1">Record id: {linkedId}</p>
                  )}
                </div>
              </div>
              <Button variant="outline" size="sm" onClick={clearMatch} disabled={saving === 'clear'} className="gap-1.5">
                <Unlink className="w-3.5 h-3.5" /> Unlink
              </Button>
            </div>
          </div>
        )}

        {!linkedId && (
          <>
            {/* Manual search */}
            <div>
              <Label className="text-sm font-medium text-slate-700 mb-1 block">Search the Central Database</Label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <Input
                    className="pl-9"
                    placeholder="Search by name, email, or phone…"
                    value={manualQuery}
                    onChange={(e) => setManualQuery(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); runManualSearch(); } }}
                  />
                </div>
                <Button type="button" variant="outline" onClick={runManualSearch} disabled={manualSearching} className="gap-1.5">
                  {manualSearching ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                  Search
                </Button>
              </div>
            </div>

            {/* Auto-suggestions */}
            <div>
              <div className="flex items-center gap-2 mb-2">
                <p className="text-sm font-medium text-slate-700">Suggested matches</p>
                {searching && <Loader2 className="w-3.5 h-3.5 animate-spin text-slate-400" />}
              </div>
              {allCandidates.length === 0 && !searching && (
                <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 p-4 flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
                  <div className="text-sm text-slate-600">
                    <p className="font-medium">No existing matches found</p>
                    <p className="text-xs mt-0.5">A new Central Database record will be created automatically when this client is enrolled in Pathways.</p>
                  </div>
                </div>
              )}
              <div className="space-y-2">
                {allCandidates.map(({ c, reasons, sim, source }) => (
                  <div key={c.id} className="rounded-lg border border-slate-200 bg-white p-3 flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm font-medium text-slate-800 truncate">{fullName(c)}</p>
                        {source === 'suggestion' && reasons.some((r) => r.strong) && (
                          <Badge className="bg-violet-100 text-violet-700 border-violet-200">Best match</Badge>
                        )}
                      </div>
                      <div className="text-xs text-slate-500 mt-0.5 space-x-2">
                        {c.email && <span>{c.email}</span>}
                        {c.phone && <span>{c.phone}</span>}
                        {c.date_of_birth && <span>DOB {c.date_of_birth}</span>}
                      </div>
                      {reasons.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-1.5">
                          {reasons.map((r, i) => (
                            <span
                              key={i}
                              className={
                                'text-xs px-2 py-0.5 rounded-full border ' +
                                (r.strong
                                  ? 'bg-green-50 text-green-700 border-green-200'
                                  : 'bg-amber-50 text-amber-700 border-amber-200')
                              }
                            >
                              {r.label}
                            </span>
                          ))}
                        </div>
                      )}
                      {(c.program_participations || []).length > 0 && (
                        <p className="text-xs text-slate-400 mt-1">
                          Already in: {c.program_participations.map((p) => p.program).join(', ')}
                        </p>
                      )}
                    </div>
                    <Button
                      type="button"
                      size="sm"
                      onClick={() => selectMatch(c.id)}
                      disabled={saving !== null}
                      className="gap-1.5 shrink-0"
                    >
                      {saving === c.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                      Select as match
                    </Button>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex items-start gap-2 text-xs text-slate-500 bg-slate-50 rounded-lg p-3 border border-slate-200">
              <UserPlus className="w-3.5 h-3.5 mt-0.5 shrink-0" />
              <p>If none of these are the same person, leave it unlinked. The Central Database will create a new record automatically on enrollment.</p>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}