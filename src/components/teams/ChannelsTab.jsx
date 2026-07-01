import React, { useState, useEffect, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { ArrowLeft, Send, Hash, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';

function formatTime(dateStr) {
  return new Date(dateStr).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
}

function stripHtml(html) {
  if (!html) return '';
  return html.replace(/<[^>]*>/g, '').trim();
}

export default function ChannelsTab({ teams, loading, onSend }) {
  const { toast } = useToast();
  const [selectedTeam, setSelectedTeam] = useState(null);
  const [channels, setChannels] = useState([]);
  const [channelsLoading, setChannelsLoading] = useState(false);
  const [selectedChannel, setSelectedChannel] = useState(null);
  const [messages, setMessages] = useState([]);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (!selectedTeam) return;
    setChannelsLoading(true);
    setSelectedChannel(null);
    base44.functions.invoke('msTeams', { action: 'listChannels', teamId: selectedTeam.id })
      .then(res => setChannels(res.data.channels || []))
      .catch(err => toast({ title: 'Error loading channels', description: err.message, variant: 'destructive' }))
      .finally(() => setChannelsLoading(false));
  }, [selectedTeam]);

  useEffect(() => {
    if (!selectedTeam || !selectedChannel) return;
    setMessagesLoading(true);
    base44.functions.invoke('msTeams', { action: 'listChannelMessages', teamId: selectedTeam.id, channelId: selectedChannel.id })
      .then(res => setMessages(res.data.messages || []))
      .catch(err => toast({ title: 'Error loading messages', description: err.message, variant: 'destructive' }))
      .finally(() => setMessagesLoading(false));
  }, [selectedTeam, selectedChannel]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || sending) return;
    setSending(true);
    try {
      await onSend(selectedTeam.id, selectedChannel.id, input.trim());
      setInput('');
      const res = await base44.functions.invoke('msTeams', { action: 'listChannelMessages', teamId: selectedTeam.id, channelId: selectedChannel.id });
      setMessages(res.data.messages || []);
    } catch (err) {
      toast({ title: 'Failed to send message', description: err.message, variant: 'destructive' });
    } finally {
      setSending(false);
    }
  };

  const handleBack = () => {
    if (selectedChannel) {
      setSelectedChannel(null);
      setMessages([]);
    } else if (selectedTeam) {
      setSelectedTeam(null);
      setChannels([]);
    }
  };

  // Channel messages view
  if (selectedTeam && selectedChannel) {
    return (
      <div className="flex flex-col h-full">
        <div className="flex items-center gap-2 px-4 py-2 border-b flex-shrink-0">
          <button onClick={handleBack} className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
            <ArrowLeft className="w-4 h-4" />
            Back
          </button>
          <span className="text-sm font-medium truncate flex items-center gap-1">
            <Hash className="w-3.5 h-3.5" />
            {selectedChannel.displayName}
          </span>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
          {messagesLoading ? (
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

  // Channels list view
  if (selectedTeam) {
    return (
      <div className="flex flex-col h-full">
        <div className="flex items-center gap-2 px-4 py-2 border-b flex-shrink-0">
          <button onClick={handleBack} className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
            <ArrowLeft className="w-4 h-4" />
            Back
          </button>
          <span className="text-sm font-medium truncate">{selectedTeam.displayName}</span>
        </div>

        {channelsLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-8 h-8 border-4 border-muted border-t-accent rounded-full animate-spin" />
          </div>
        ) : channels.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">No channels found</p>
        ) : (
          <div className="divide-y divide-border overflow-y-auto h-full">
            {channels.map((channel) => (
              <button
                key={channel.id}
                onClick={() => setSelectedChannel(channel)}
                className="w-full text-left px-4 py-3 hover:bg-muted/50 transition-colors flex items-center gap-2"
              >
                <Hash className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{channel.displayName}</p>
                  {channel.description && (
                    <p className="text-xs text-muted-foreground truncate">{channel.description}</p>
                  )}
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    );
  }

  // Teams list view
  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-8 h-8 border-4 border-muted border-t-accent rounded-full animate-spin" />
      </div>
    );
  }

  if (teams.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
        <Users className="w-10 h-10 mb-2 opacity-40" />
        <p className="text-sm">No teams found</p>
      </div>
    );
  }

  return (
    <div className="divide-y divide-border overflow-y-auto h-full">
      {teams.map((team) => (
        <button
          key={team.id}
          onClick={() => setSelectedTeam(team)}
          className="w-full text-left px-4 py-3 hover:bg-muted/50 transition-colors flex items-center gap-3"
        >
          <div className="w-9 h-9 rounded-lg bg-accent/10 flex items-center justify-center flex-shrink-0">
            <Users className="w-4 h-4 text-accent" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-foreground truncate">{team.displayName}</p>
            {team.description && (
              <p className="text-xs text-muted-foreground truncate">{team.description}</p>
            )}
          </div>
        </button>
      ))}
    </div>
  );
}