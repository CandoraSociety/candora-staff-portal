import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Send } from 'lucide-react';

export default function ComposeEmail({ onSend }) {
  const [to, setTo] = useState('');
  const [cc, setCc] = useState('');
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [sending, setSending] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!to.trim() || !subject.trim()) return;
    setSending(true);
    try {
      await onSend({ to: to.split(',').map(s => s.trim()), cc: cc ? cc.split(',').map(s => s.trim()) : [], subject, body });
      setTo('');
      setCc('');
      setSubject('');
      setBody('');
    } finally {
      setSending(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3 max-w-2xl">
      <div>
        <label className="text-xs text-muted-foreground font-medium">To</label>
        <Input
          type="text"
          value={to}
          onChange={(e) => setTo(e.target.value)}
          placeholder="recipient@example.com (comma-separated)"
          required
        />
      </div>
      <div>
        <label className="text-xs text-muted-foreground font-medium">Cc</label>
        <Input
          type="text"
          value={cc}
          onChange={(e) => setCc(e.target.value)}
          placeholder="cc@example.com (optional)"
        />
      </div>
      <div>
        <label className="text-xs text-muted-foreground font-medium">Subject</label>
        <Input
          type="text"
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          placeholder="Email subject"
          required
        />
      </div>
      <div>
        <label className="text-xs text-muted-foreground font-medium">Message</label>
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="Write your message..."
          rows={10}
          className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
        />
      </div>
      <Button type="submit" disabled={sending} className="gap-2">
        <Send className="w-4 h-4" />
        {sending ? 'Sending...' : 'Send Email'}
      </Button>
    </form>
  );
}