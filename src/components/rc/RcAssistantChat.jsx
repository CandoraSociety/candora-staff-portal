import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Sparkles, Send, Loader2, Eraser, ArrowRight } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

const SUGGESTIONS = {
  rc: [
    'How many clients are active right now?',
    'Which clients have not been seen in 30 days?',
    'Who is on the intensive caseload?',
    'Show me unassigned intake clients.',
  ],
  rworker: [
    'Who are my clients?',
    'Which of my clients need a follow-up?',
    'Who have I not seen in 30 days?',
    'What appointments do I have coming up?',
  ],
};

// Answers arrive as markdown — plain sentences, bullets, timelines or tables —
// so the chat has to render all of those shapes cleanly in a narrow panel.
const markdownComponents = {
  p: (props) => <p className="mb-2 last:mb-0 leading-relaxed" {...props} />,
  ul: (props) => <ul className="mb-2 list-disc pl-4 space-y-1" {...props} />,
  ol: (props) => <ol className="mb-2 list-decimal pl-4 space-y-1" {...props} />,
  li: (props) => <li className="leading-relaxed" {...props} />,
  strong: (props) => <strong className="font-semibold" {...props} />,
  em: (props) => <em className="italic" {...props} />,
  h1: (props) => <p className="font-semibold mb-1 mt-3 first:mt-0" {...props} />,
  h2: (props) => <p className="font-semibold mb-1 mt-3 first:mt-0" {...props} />,
  h3: (props) => <p className="font-semibold mb-1 mt-3 first:mt-0" {...props} />,
  hr: () => <hr className="my-2 border-border/70" />,
  blockquote: (props) => (
    <blockquote className="mb-2 border-l-2 border-destructive/60 pl-2 text-destructive" {...props} />
  ),
  table: (props) => (
    <div className="mb-2 -mx-1 overflow-x-auto">
      <table className="w-full border-collapse text-xs" {...props} />
    </div>
  ),
  thead: (props) => <thead className="bg-background/70" {...props} />,
  th: (props) => (
    <th className="border border-border/70 px-2 py-1 text-left font-semibold align-top" {...props} />
  ),
  td: (props) => <td className="border border-border/70 px-2 py-1 align-top" {...props} />,
};

export default function RcAssistantChat({ portal = 'rc', focusClientId = null, onClose }) {
  const storageKey = `${portal}_rc_assistant_messages_v1`;
  const [messages, setMessages] = useState(() => {
    try {
      const saved = sessionStorage.getItem(storageKey);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const endRef = useRef(null);
  const clientPath = portal === 'rworker' ? '/rworker/clients' : '/rc/clients';

  useEffect(() => {
    try {
      sessionStorage.setItem(storageKey, JSON.stringify(messages.slice(-40)));
    } catch {
      /* session storage unavailable — conversation simply is not kept */
    }
    endRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }, [messages, storageKey]);

  const ask = async (text) => {
    const question = (text || '').trim();
    if (!question || busy) return;
    const next = [...messages, { role: 'user', content: question }];
    setMessages(next);
    setInput('');
    setBusy(true);
    try {
      const res = await base44.functions.invoke('rcAssistant', {
        question,
        portal,
        focus_client_id: focusClientId,
        history: next.slice(-8).map((m) => ({ role: m.role, content: m.content })),
      });
      const data = res.data || {};
      setMessages((prev) => [...prev, {
        role: 'assistant',
        content: data.answer || data.error || 'I could not answer that from the client records.',
        related: data.related || [],
      }]);
    } catch (error) {
      setMessages((prev) => [...prev, {
        role: 'assistant',
        content: 'That question did not go through. Please try again.',
        error: true,
      }]);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex flex-col h-full min-h-0">
      <div className="flex items-center justify-between gap-2 px-3 py-2 border-b border-border">
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Sparkles className="h-3.5 w-3.5 text-primary" />
          {portal === 'rworker' ? 'Answers from your own client files' : 'Answers from the client database'}
        </div>
        {messages.length > 0 && (
          <button
            onClick={() => setMessages([])}
            className="text-[11px] text-muted-foreground hover:text-foreground inline-flex items-center gap-1"
            title="Start a new conversation"
          >
            <Eraser className="h-3 w-3" /> Clear
          </button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto px-3 py-3 space-y-3 min-h-0">
        {messages.length === 0 && (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Ask about any client, caseload, visit history or referral. I only answer from the records on file.
            </p>
            <div className="space-y-1.5">
              {SUGGESTIONS[portal].map((s) => (
                <button
                  key={s}
                  onClick={() => ask(s)}
                  className="w-full text-left text-xs px-2.5 py-2 rounded-lg border border-border bg-muted/40 hover:bg-muted transition-colors"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((m, i) => (
          <div key={i} className={cn('flex', m.role === 'user' ? 'justify-end' : 'justify-start')}>
            <div
              className={cn(
                'rounded-xl px-3 py-2 text-sm max-w-[92%] min-w-0',
                m.role === 'user'
                  ? 'bg-accent text-accent-foreground'
                  : m.error
                    ? 'bg-destructive/10 text-destructive border border-destructive/20'
                    : 'bg-muted text-foreground',
              )}
            >
              {m.role === 'user' ? (
                <p className="whitespace-pre-wrap leading-relaxed">{m.content}</p>
              ) : (
                <>
                  <div className="[&>*:last-child]:mb-0">
                    <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
                      {m.content}
                    </ReactMarkdown>
                  </div>
                  {m.related?.length > 0 && (
                    <div className="mt-2 pt-2 border-t border-border/60 space-y-1">
                      <p className="text-[11px] uppercase tracking-wide text-muted-foreground">Open the file</p>
                      {m.related.map((c) => (
                        <Link
                          key={c.id}
                          to={`${clientPath}/${c.id}`}
                          className="flex items-center gap-1 text-xs font-medium text-primary hover:underline"
                        >
                          {c.name}
                          <ArrowRight className="h-3 w-3" />
                        </Link>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        ))}
        {busy && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Loader2 className="h-3.5 w-3.5 animate-spin" /> Reading the client records…
          </div>
        )}
        <div ref={endRef} />
      </div>

      <form
        onSubmit={(e) => { e.preventDefault(); ask(input); }}
        className="border-t border-border p-2 flex items-center gap-2"
      >
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask about a client or caseload…"
          className="h-9 text-sm"
          disabled={busy}
        />
        <Button type="submit" size="icon" className="h-9 w-9 shrink-0" disabled={busy || !input.trim()}>
          <Send className="h-4 w-4" />
        </Button>
      </form>
    </div>
  );
}