import { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, Send, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import ReactMarkdown from 'react-markdown';
import { TYPE_LABELS } from '@/lib/grantKnowledgeConstants';

// Words too generic to search the knowledge base with.
const STOPWORDS = new Set([
  'what', 'which', 'when', 'where', 'have', 'does', 'been', 'with', 'this', 'that',
  'from', 'about', 'their', 'there', 'would', 'could', 'should', 'tell', 'give',
  'need', 'know', 'want', 'find', 'previous', 'past', 'grant', 'grants', 'funder',
  'fund', 'funds', 'funding', 'info', 'details', 'detail', 'anything', 'someone',
  'anyone', 'ever', 'tried', 'trying', 'like', 'made', 'just', 'also', 'more',
  'them', 'they', 'then', 'than', 'were', 'was', 'are', 'the', 'and', 'for',
  'our', 'how', 'why', 'who', 'can', 'did', 'got', 'get', 'you', 'will',
]);

const buildSearchQuery = (question, funder) => {
  const terms = question
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter(w => w.length > 3 && !STOPWORDS.has(w))
    .slice(0, 8);
  const query = {};
  if (terms.length) {
    query.$or = [];
    terms.forEach(t => {
      query.$or.push({ title: { $regex: t, $options: 'i' } });
      query.$or.push({ content: { $regex: t, $options: 'i' } });
      query.$or.push({ related_funder: { $regex: t, $options: 'i' } });
      query.$or.push({ tags: { $regex: t, $options: 'i' } });
    });
  }
  if (funder) query.related_funder = funder;
  return { query, hadTerms: terms.length > 0 };
};

export default function KnowledgeAskPanel({ funders = [] }) {
  const [question, setQuestion] = useState('');
  const [funder, setFunder] = useState('');
  const [asking, setAsking] = useState(false);
  const [answer, setAnswer] = useState(null);
  const [sources, setSources] = useState([]);
  const [fallbackNote, setFallbackNote] = useState('');

  const ask = async () => {
    if (!question.trim()) return;
    setAsking(true);
    setAnswer(null);
    setSources([]);
    setFallbackNote('');
    try {
      const { query, hadTerms } = buildSearchQuery(question, funder);
      let items = [];
      if (Object.keys(query).length) {
        const page = await base44.entities.GrantKnowledgeEntry.filter(query, { sort: '-created_date', limit: 30 });
        items = page.items || [];
      }
      // No keyword matches — fall back to the most recent entries (respecting a
      // selected funder) so the assistant can still answer from recent memory.
      if (!items.length) {
        const fb = funder ? { related_funder: funder } : {};
        const recent = await base44.entities.GrantKnowledgeEntry.filter(fb, { sort: '-created_date', limit: 20 });
        items = recent.items || [];
        if (hadTerms) setFallbackNote('No direct keyword matches — answered from the most recent entries.');
      }
      if (!items.length) {
        setAnswer('The knowledge base is empty for this question. Add notes or import documents first, then ask again.');
        setAsking(false);
        return;
      }

      const context = items
        .map((e, i) => `--- Entry ${i + 1}: "${e.title}" | type: ${TYPE_LABELS[e.entry_type] || e.entry_type || 'note'} | funder: ${e.related_funder || 'n/a'} | date: ${e.event_date || 'n/a'} | tags: ${(e.tags || []).join(', ')}\n${(e.content || '').slice(0, 6000)}`)
        .join('\n\n');

      const res = await base44.integrations.Core.InvokeLLM({
        prompt: `You are the grant knowledge assistant for the Candora Society of Edmonton grants team. A staff member asks: "${question.trim()}"

Answer using ONLY the knowledge entries provided below. When you use a piece of information, mention which entry it came from (e.g. "per '<title>'"). If the entries do not contain the answer, say so plainly and suggest what information should be added to the knowledge base.

KNOWLEDGE ENTRIES:
${context}`,
      });

      setAnswer(typeof res === 'string' ? res : String(res));
      setSources(items.slice(0, 12));
    } catch (e) {
      toast.error('Failed to search the knowledge base');
    } finally {
      setAsking(false);
    }
  };

  return (
    <div className="rounded-xl border bg-card shadow-sm p-4 sm:p-5">
      <div className="flex items-center gap-2 mb-1">
        <Sparkles className="w-5 h-5 text-primary" />
        <h2 className="font-heading text-lg font-bold">Ask the Knowledge Base</h2>
      </div>
      <p className="text-sm text-muted-foreground mb-3">
        Ask anything about past grants, funders, proposals or what the team has tried before — answered from everything stored below.
      </p>
      <div className="flex flex-col sm:flex-row gap-2">
        <Textarea
          value={question}
          onChange={e => setQuestion(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); ask(); } }}
          placeholder="e.g. What have we tried with United Way before? What was in our 2023 ECAMP grant?"
          rows={2}
          className="flex-1 resize-none"
        />
        <div className="flex sm:flex-col gap-2">
          <select
            value={funder}
            onChange={e => setFunder(e.target.value)}
            className="h-9 text-sm rounded-md border border-input bg-background px-2 flex-1 sm:flex-none"
          >
            <option value="">All funders</option>
            {funders.map(f => <option key={f} value={f}>{f}</option>)}
          </select>
          <Button onClick={ask} disabled={asking || !question.trim()} className="flex-1 sm:flex-none">
            {asking ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />} Ask
          </Button>
        </div>
      </div>

      {(asking || answer) && (
        <div className="mt-4 rounded-lg bg-muted/60 border p-4">
          {asking ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="w-4 h-4 animate-spin" /> Searching the knowledge base...
            </div>
          ) : (
            <>
              <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">Answer</div>
              <div className="text-sm leading-relaxed [&_p]:mb-2 [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5 [&_strong]:font-semibold [&_h1]:font-bold [&_h2]:font-bold [&_h3]:font-semibold">
                <ReactMarkdown>{answer}</ReactMarkdown>
              </div>
              {fallbackNote && (
                <div className="mt-3 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-md px-2 py-1.5">
                  {fallbackNote}
                </div>
              )}
              {sources.length > 0 && (
                <div className="mt-3 flex flex-wrap items-center gap-1.5">
                  <span className="text-xs text-muted-foreground">Sources:</span>
                  {sources.map(s => (
                    <span key={s.id} className="text-xs px-2 py-0.5 rounded-full bg-secondary text-secondary-foreground">
                      {s.title}
                    </span>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}