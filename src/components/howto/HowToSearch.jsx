import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Search, Sparkles, ChevronDown, ChevronUp, BookOpen } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

export default function HowToSearch() {
  const [query, setQuery] = useState('');
  const [submittedQuery, setSubmittedQuery] = useState('');
  const [aiAnswer, setAiAnswer] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);

  const { data: allAnswers = [] } = useQuery({
    queryKey: ['howToAnswers'],
    queryFn: () => base44.entities.HowToAnswer.filter({ is_active: true }),
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

    // Check preset answers first
    const matches = allAnswers.filter(a => {
      const q = query.toLowerCase();
      return (
        a.question.toLowerCase().includes(q) ||
        a.answer.toLowerCase().includes(q) ||
        (a.keywords || []).some(k => k.toLowerCase().includes(q))
      );
    });

    if (matches.length === 0) {
      // No preset found, call AI
      try {
        const res = await base44.integrations.Core.InvokeLLM({
          prompt: `You are a helpful workplace assistant. Answer this "how to" question concisely and practically in 2-4 sentences: "${query}"`,
        });
        setAiAnswer(res);
      } catch (err) {
        console.error('AI call failed:', err);
      }
    }

    setIsLoading(false);
  };

  if (isCollapsed) {
    return (
      <div className="rounded-2xl border-2 border-border bg-gradient-to-br from-sky-500 to-blue-600 p-4">
        <button
          onClick={() => setIsCollapsed(false)}
          className="flex items-center justify-between w-full text-white"
        >
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
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setIsCollapsed(true)}
          className="text-white hover:bg-white/20"
        >
          <ChevronUp className="w-5 h-5" />
        </Button>
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
                        <Badge key={idx} variant="secondary" className="text-xs px-1.5 py-0">
                          {kw}
                        </Badge>
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