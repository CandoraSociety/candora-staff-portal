import React, { useState, useEffect, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { ArrowLeft, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';

function formatTime(dateStr) {
  return new Date(dateStr).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
}

function stripHtml(html) {
  if (!html) return '';
  return html.replace(/<[^>]*>/g, '').trim();
}

export default function ChatView({ chat, onBack, onSend }) {
  const { toast } = useToast();
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    const loadMessages = async () => {
      setLoading(true);
      try {
        const res = await base44.functions.invoke('msTeams', { action: 'getChatMessages', chatId: chat.id });
        setMessages(res.data.messages || []);
      } catch (err) {
        toast({ title: 'Error loading messages', description: err.message, variant: 'destructive' });
      } finally {
        setLoading(false);
      }
    };
    loadMessages();
  }, [chat.id]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || sending) return;
    setSending(true);
    try {
      await onSend(chat.id, input.trim());
      setInput('');
      const res = await base44.functions.invoke('msTeams', { action: 'getChatMessages', chatId: chat.id });
      setMessages(res.data.messages || []);
    } catch (err) {
      toast({ title: 'Failed to send message', description: err.message, variant: 'destructive' });
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-2 px-4 py-2 border-b flex-shrink-0">
        <button onClick={onBack} className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="w-4 h-4" />
          Back
        </button>
        <span className="text-sm font-medium truncate">{chat.topic || 'Direct chat'}</span>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-8 h-8 border-4 border-muted border-t-accent rounded-full animate-spin" />
          </div>
        ) : messages.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">No messages yet</p>
        ) : (
          messages.filter(m => m.messageType === 'message').map((msg) => (
            <div key={msg.id} className="flex flex-col">
              <div className="flex items-baseline gap-2">
                <span className="text-sm font-medium text-foreground">
                  {msg.from?.user?.displayName || 'Unknown'}
                </span>
                <span className="text-xs text-muted-foreground">
                  {msg.createdDateTime && formatTime(msg.createdDateTime)}
                </span>
              </div>
              <p className="text-sm text-muted-foreground mt-0.5 break-words">
                {stripHtml(msg.body?.content)}
              </p>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="flex items-center gap-2 px-4 py-3 border-t flex-shrink-0">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSend()}
          placeholder="Type a message..."
          className="flex-1 px-3 py-2 text-sm rounded-md border bg-background focus:outline-none focus:ring-2 focus:ring-accent/20"
        />
        <Button size="icon" onClick={handleSend} disabled={sending || !input.trim()}>
          <Send className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}