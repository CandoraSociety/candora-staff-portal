import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Search, Sparkles, ChevronDown, ChevronUp, BookOpen, History, Trash2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

export default function HowToSearch({ user }) {
  const [query, setQuery] = useState('');
  const [submittedQuery, setSubmittedQuery] = useState('');
  const [aiAnswer, setAiAnswer] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const queryClient = useQueryClient();

  const { data: allAnswers = [] } = useQuery({
    queryKey: ['howToAnswers'],
    queryFn: () => base44.entities.HowToAnswer.filter({ is_active: true }),
  });

  const { data: history = [] } = useQuery({
    queryKey: ['howToSearchLog', user?.id],
    queryFn: () => base44.entities.HowToSearchLog.filter({ user_id: user?.id }, '-created_date', 20),
    enabled: !!user?.id && showHistory,
  });

  const presetMatches = submittedQuery
    ? allAnswers.filter(a => {
        const q = submittedQuery.toLowerCase();
        return (
          a.question.toLowerCase().includes(q) ||
          a.answer.toLowerCase().includes(q) ||
          (a.keywords || []).some(k => k.toLowerCase().includes(q))
        );
      })
    : [];

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!query.trim()) return;

    setSubmittedQuery(query);
    setIsLoading(true);
    setAiAnswer(null);

    const matches = allAnswers.filter(a => {
      const q = query.toLowerCase();
      return (
        a.question.toLowerCase().includes(q) ||
        a.answer.toLowerCase().includes(q) ||
        (a.keywords || []).some(k => k.toLowerCase().includes(q))
      );
    });

    if (matches.length > 0) {
      // Log preset matches
      if (user?.id) {
        base44.entities.HowToSearchLog.create({
          user_id: user.id,
          query: query.trim(),
          answer_type: 'preset',
          answer_text: matches[0].answer,
          matched_question: matches[0].question,
        });
        queryClient.invalidateQueries(['howToSearchLog', user?.id]);
      }
    } else {
      // Call AI
      try {
        const res = await base44.integrations.Core.InvokeLLM({
          prompt: `You are a helpful workplace assistant. Answer this "how to" question concisely and practically in 2-4 sentences: "${query}"`,
        });
        setAiAnswer(res);
        if (user?.id) {
          base44.entities.HowToSearchLog.create({
            user_id: user.id,
            query: query.trim(),
            answer_type: 'ai',
            answer_text: res,
          });
          queryClient.invalidateQueries(['howToSearchLog', user?.id]);
        }
      } catch (err) {
        console.error('AI call failed:', err);
      }
    }

    setIsLoading(false);
  };

  const clearHistory = async () => {
    for (const log of history) {
      await base44.entities.HowToSearchLog.delete(log.id);
    }
    queryClient.invalidateQueries(['howToSearchLog', user?.id]);
  };

  if (isCollapsed) {
    return (
      <div className="rounded-2xl border-2 border-border bg-gradient-to-br from-sky-500 to-blue-600 p-4">
        <button onClick={() => setIsCollapsed(false)} className="flex items-center justify-between w-full text-white">
          <div className="flex items-center gap-3">
            <BookOpen className="w-5 h-5" />
            <span className="font-semibold">How-To Knowledge Base</span>
          </div>
          <ChevronDown className="w-5 h-5" />
        </button>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border-2 border-border bg-gradient-to-br from-sky-500 to-blue-600 p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3 text-white">
          <BookOpen className="w-6 h-6" />
          <h2 className="text-xl font-bold">How-To Knowledge Base</h2>
        </div>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" onClick={() => setShowHistory(!showHistory)} className="text-white hover:bg-white/20" title="Search history">
            <History className="w-5 h-5" />
          </Button>
          <Button variant="ghost" size="icon" onClick={() => setIsCollapsed(true)} className="text-white hover:bg-white/20">
            <ChevronUp className="w-5 h-5" />
          </Button>
        </div>
      </div>

      <form onSubmit={handleSearch} className="mb-4">
        <div className="flex gap-2">
          <Input
            type="text"
            placeholder="Ask a how-to question... (e.g., How do I submit expenses?)"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="flex-1 bg-white/95 border-0"
          />
          <Button type="submit" variant="secondary" disabled={isLoading}>
            <Search className="w-4 h-4" />
            {isLoading ? 'Searching...' : 'Search'}
          </Button>
        </div>
      </form>

      {/* History Panel */}
      {showHistory && (
        <div className="mb-4 rounded-xl bg-white/95 p-4">
          <div className="flex items-center justify-between mb-3">
            <p className="font-semibold text-sm text-foreground">Search History</p>
            {history.length > 0 && (
              <Button variant="ghost" size="sm" className="h-7 text-xs text-destructive hover:text-destructive" onClick={clearHistory}>
                <Trash2 className="w-3 h-3 mr-1" /> Clear
              </Button>
            )}
          </div>
          {history.length === 0 ? (
            <p className="text-xs text-muted-foreground">No search history yet.</p>
          ) : (
            <div className="space-y-2 max-h-52 overflow-y-auto">
              {history.map(log => (
                <div key={log.id} className="flex items-start gap-2 cursor-pointer group" onClick={() => { setQuery(log.query); setShowHistory(false); }}>
                  <Badge variant={log.answer_type === 'ai' ? 'outline' : 'secondary'} className="text-[10px] mt-0.5 flex-shrink-0">
                    {log.answer_type === 'ai' ? <><Sparkles className="w-2.5 h-2.5 mr-0.5" />AI</> : 'KB'}
                  </Badge>
                  <div className="min-w-0">
                    <p className="text-xs font-medium text-foreground group-hover:text-primary truncate">{log.query}</p>
                    <p className="text-xs text-muted-foreground line-clamp-1">{log.answer_text}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {(isLoading || presetMatches.length > 0 || aiAnswer) && (
        <div className="space-y-3">
          {isLoading && (
            <div className="rounded-xl border border-border bg-white/95 p-4">
              <div className="flex items-center gap-2 text-muted-foreground">
                <div className="w-4 h-4 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
                <span>Searching knowledge base...</span>
              </div>
            </div>
          )}

          {presetMatches.length > 0 && (
            <div className="space-y-2">
              {presetMatches.map((match) => (
                <div key={match.id} className="rounded-xl border border-border bg-white/95 p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge className="bg-primary text-primary-foreground">Company Answer</Badge>
                  </div>
                  <p className="font-semibold text-foreground mb-2">{match.question}</p>
                  <p className="text-sm text-muted-foreground">{match.answer}</p>
                  {match.keywords && match.keywords.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-3">
                      {match.keywords.map((kw, idx) => (
                        <Badge key={idx} variant="secondary" className="text-xs px-1.5 py-0">{kw}</Badge>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {aiAnswer && (
            <div className="rounded-xl border border-violet-200 bg-violet-50/50 p-4">
              <div className="flex items-center gap-2 mb-2">
                <Sparkles className="w-4 h-4 text-violet-600" />
                <Badge className="bg-violet-600 text-white">AI Answer</Badge>
              </div>
              <p className="text-sm text-foreground">{aiAnswer}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}