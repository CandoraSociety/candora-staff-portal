import React, { useState, useRef, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Send, Sparkles, Bot, User } from 'lucide-react';

export default function AIAssistant({ project, orgInfo }) {
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: `Hi! I'm your grant writing assistant for **${project.title}**. I can help you:\n\n- Draft and improve proposal sections\n- Research funder requirements\n- Suggest outcomes and metrics\n- Review and edit your writing\n- Answer questions about grant writing best practices\n\nWhat would you like to work on?`
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef(null);

  const { data: sections = [] } = useQuery({
    queryKey: ['proposalSections', project.id],
    queryFn: () => base44.entities.ProposalSection.filter({ project_id: project.id }, 'sort_order'),
  });

  const { data: notes = [] } = useQuery({
    queryKey: ['projectNotes', project.id],
    queryFn: () => base44.entities.ProjectNote.filter({ project_id: project.id }, '-created_date'),
  });

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const buildContext = () => {
    let ctx = `Project: ${project.title}\n`;
    ctx += `Funder: ${project.funding_source_name || 'Not specified'}\n`;
    ctx += `Status: ${project.status}\n`;
    if (project.amount_requested) ctx += `Amount Requested: $${project.amount_requested.toLocaleString()}\n`;
    if (project.description) ctx += `\nProject Description:\n${project.description}\n`;
    if (orgInfo) {
      ctx += `\nOrganization: ${orgInfo.legal_name || orgInfo.org_name}\n`;
      if (orgInfo.mission_statement) ctx += `Mission: ${orgInfo.mission_statement}\n`;
      if (orgInfo.mandate_description) ctx += `Mandate: ${orgInfo.mandate_description}\n`;
    }
    if (sections.length > 0) {
      ctx += `\nCurrent Proposal Sections:\n`;
      sections.forEach(s => {
        if (s.content) ctx += `\n[${s.section_title}]:\n${s.content.slice(0, 600)}${s.content.length > 600 ? '…' : ''}\n`;
      });
    }
    if (notes.length > 0) {
      ctx += `\nProject Notes:\n`;
      notes.slice(0, 5).forEach(n => { ctx += `- ${n.content.slice(0, 200)}\n`; });
    }
    return ctx;
  };

  const handleSend = async () => {
    if (!input.trim() || loading) return;
    const userMsg = { role: 'user', content: input };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    const history = messages.map(m => `${m.role === 'user' ? 'User' : 'Assistant'}: ${m.content}`).join('\n\n');
    const context = buildContext();

    const response = await base44.integrations.Core.InvokeLLM({
      prompt: `You are an expert grant writing assistant. Use the project context to give specific, actionable advice.

PROJECT CONTEXT:
${context}

CONVERSATION HISTORY:
${history}

User: ${userMsg.content}

Provide a helpful, specific response. Use markdown formatting for readability. Focus on the grant writing task at hand.`,
    });

    setMessages(prev => [...prev, { role: 'assistant', content: response }]);
    setLoading(false);
  };

  return (
    <div className="flex flex-col h-[calc(100vh-280px)] min-h-[500px] border rounded-xl bg-card overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-2 px-4 py-3 border-b bg-muted/30">
        <Sparkles className="h-4 w-4 text-primary" />
        <span className="font-semibold text-sm">AI Grant Writing Assistant</span>
        <span className="ml-auto text-xs text-muted-foreground">Context: {sections.length} sections, {notes.length} notes</span>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((m, i) => (
          <div key={i} className={`flex gap-3 ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            {m.role === 'assistant' && (
              <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                <Bot className="h-4 w-4 text-primary" />
              </div>
            )}
            <div className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm ${m.role === 'user' ? 'bg-primary text-primary-foreground rounded-tr-sm' : 'bg-muted rounded-tl-sm'}`}>
              <p className="whitespace-pre-wrap">{m.content}</p>
            </div>
            {m.role === 'user' && (
              <div className="w-7 h-7 rounded-full bg-secondary flex items-center justify-center flex-shrink-0 mt-0.5">
                <User className="h-4 w-4" />
              </div>
            )}
          </div>
        ))}
        {loading && (
          <div className="flex gap-3 justify-start">
            <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
              <Bot className="h-4 w-4 text-primary" />
            </div>
            <div className="bg-muted rounded-2xl rounded-tl-sm px-4 py-2.5">
              <div className="flex gap-1.5 items-center h-4">
                <div className="w-1.5 h-1.5 rounded-full bg-muted-foreground animate-bounce" style={{ animationDelay: '0ms' }} />
                <div className="w-1.5 h-1.5 rounded-full bg-muted-foreground animate-bounce" style={{ animationDelay: '150ms' }} />
                <div className="w-1.5 h-1.5 rounded-full bg-muted-foreground animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="border-t p-3 flex gap-2">
        <Input
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
          placeholder="Ask anything about this grant…"
          disabled={loading}
          className="flex-1"
        />
        <Button onClick={handleSend} disabled={loading || !input.trim()} size="icon">
          <Send className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}