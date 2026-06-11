import React, { useState, useRef, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Send, Bot, User, Loader2, Database } from 'lucide-react';

const SYSTEM_PROMPT = `You are MoneyMan, an expert grants researcher and funding intelligence assistant. Your job is to help nonprofit organizations in Canada find, research, and evaluate potential funding sources.

When asked about funders, provide:
- Organization name and type (federal/provincial/foundation/corporate)
- Contact information if known
- Funding streams and programs they offer
- Typical grant sizes and deadlines
- Eligibility criteria
- Application process and URLs

Focus on Canadian funders relevant to employment services, settlement services, newcomer support, and community programs.

When you identify funders to add to the database, structure your response clearly so the user can easily create records.`;

export default function FundingDatabaseChat() {
  const queryClient = useQueryClient();
  const [messages, setMessages] = useState([
    { role: 'assistant', content: "Hi! I'm MoneyMan — your AI funding researcher. Ask me to find funders for specific programs, research a particular funder, or suggest new grant opportunities. I can search the web for the latest information." }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [addingFunder, setAddingFunder] = useState(null);
  const bottomRef = useRef();

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async () => {
    const text = input.trim();
    if (!text || loading) return;
    setInput('');
    const newMessages = [...messages, { role: 'user', content: text }];
    setMessages(newMessages);
    setLoading(true);

    const history = newMessages.slice(-10).map(m => `${m.role === 'user' ? 'User' : 'MoneyMan'}: ${m.content}`).join('\n');

    const response = await base44.integrations.Core.InvokeLLM({
      prompt: `${SYSTEM_PROMPT}\n\nConversation:\n${history}\n\nMoneyMan:`,
      add_context_from_internet: true,
      model: 'gemini_3_flash',
    });

    setMessages(prev => [...prev, { role: 'assistant', content: response }]);
    setLoading(false);
  };

  const handleAddToDatabase = async (funderData) => {
    await base44.entities.FundingSource.create(funderData);
    queryClient.invalidateQueries(['fundingSources']);
    setAddingFunder(null);
    setMessages(prev => [...prev, { role: 'assistant', content: `✅ "${funderData.name}" has been added to your Funder Database!` }]);
  };

  return (
    <div className="flex flex-col h-[600px]">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto space-y-4 pr-1">
        {messages.map((msg, i) => (
          <div key={i} className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
            <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 ${msg.role === 'user' ? 'bg-primary' : 'bg-accent'}`}>
              {msg.role === 'user' ? <User className="w-4 h-4 text-primary-foreground" /> : <Bot className="w-4 h-4 text-accent-foreground" />}
            </div>
            <div className={`flex-1 max-w-[85%] rounded-xl px-4 py-3 text-sm whitespace-pre-wrap leading-relaxed ${msg.role === 'user' ? 'bg-primary text-primary-foreground ml-auto' : 'bg-muted'}`}>
              {msg.content}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex gap-3">
            <div className="w-7 h-7 rounded-full bg-accent flex items-center justify-center flex-shrink-0">
              <Bot className="w-4 h-4 text-accent-foreground" />
            </div>
            <div className="bg-muted rounded-xl px-4 py-3 flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Researching…</span>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="border-t border-border pt-4 mt-4">
        <div className="text-xs text-muted-foreground mb-2 flex items-center gap-1">
          <Database className="w-3 h-3" />
          Suggested: "Find federal funders for employment programs" · "Research United Way Alberta" · "What foundations fund newcomer services?"
        </div>
        <div className="flex gap-2">
          <Input
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
            placeholder="Ask MoneyMan to research a funder or find new opportunities…"
            disabled={loading}
          />
          <Button onClick={sendMessage} disabled={loading || !input.trim()} size="icon">
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}