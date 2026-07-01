import React, { useState, useEffect, useCallback } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import ChatList from '@/components/teams/ChatList';
import ChatView from '@/components/teams/ChatView';
import ChannelsTab from '@/components/teams/ChannelsTab';
import { MessageSquare, Hash, RefreshCw, X, Link2, Unlink } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/components/ui/use-toast';

const TEAMS_CONNECTOR_ID = '6a43f37d6ee957e7d3ac6e0f';

const TABS = [
  { id: 'chats', label: 'Chats', icon: MessageSquare },
  { id: 'channels', label: 'Channels', icon: Hash },
];

export default function TeamsFloatingWidget({ open, onClose }) {
  const { toast } = useToast();
  const [connected, setConnected] = useState(false);
  const [checking, setChecking] = useState(true);
  const [connecting, setConnecting] = useState(false);
  const [activeTab, setActiveTab] = useState('chats');
  const [profile, setProfile] = useState(null);
  const [chats, setChats] = useState([]);
  const [chatsLoading, setChatsLoading] = useState(false);
  const [selectedChat, setSelectedChat] = useState(null);
  const [teams, setTeams] = useState([]);
  const [teamsLoading, setTeamsLoading] = useState(false);

  const fetchProfile = useCallback(async () => {
    try {
      const res = await base44.functions.invoke('msTeams', { action: 'getProfile' });
      setProfile(res.data.profile);
      setConnected(true);
      return true;
    } catch {
      setConnected(false);
      setProfile(null);
      return false;
    }
  }, []);

  const fetchChats = useCallback(async () => {
    setChatsLoading(true);
    try {
      const res = await base44.functions.invoke('msTeams', { action: 'listChats' });
      setChats(res.data.chats || []);
    } catch (err) {
      toast({ title: 'Error loading chats', description: err.message, variant: 'destructive' });
    } finally {
      setChatsLoading(false);
    }
  }, [toast]);

  const fetchTeams = useCallback(async () => {
    setTeamsLoading(true);
    try {
      const res = await base44.functions.invoke('msTeams', { action: 'listTeams' });
      setTeams(res.data.teams || []);
    } catch (err) {
      toast({ title: 'Error loading teams', description: err.message, variant: 'destructive' });
    } finally {
      setTeamsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    base44.auth.isAuthenticated().then(async (authed) => {
      if (authed) {
        await fetchProfile();
      }
      setChecking(false);
    });
  }, [fetchProfile]);

  useEffect(() => {
    if (open && connected) {
      fetchChats();
      fetchTeams();
    }
  }, [open, connected, fetchChats, fetchTeams]);

  const handleConnect = async () => {
    if (connecting) return;
    setConnecting(true);
    const popup = window.open('about:blank', '_blank', 'width=600,height=700');
    try {
      const url = await base44.connectors.connectAppUser(TEAMS_CONNECTOR_ID);
      if (!url) {
        if (popup) popup.close();
        toast({ title: 'Connection failed', description: 'No OAuth URL returned.', variant: 'destructive' });
        setConnecting(false);
        return;
      }
      if (popup) {
        popup.location.href = url;
      } else {
        window.location.href = url;
        return;
      }
      const timer = setInterval(() => {
        if (!popup || popup.closed) {
          clearInterval(timer);
          setConnecting(false);
          fetchProfile().then((ok) => {
            if (ok) { fetchChats(); fetchTeams(); }
          });
        }
      }, 1000);
    } catch (err) {
      if (popup) popup.close();
      setConnecting(false);
      toast({ title: 'Connection failed', description: err.message, variant: 'destructive' });
    }
  };

  const handleDisconnect = async () => {
    try {
      await base44.connectors.disconnectAppUser(TEAMS_CONNECTOR_ID);
      setConnected(false);
      setProfile(null);
      setChats([]);
      setSelectedChat(null);
      setTeams([]);
      toast({ title: 'Teams disconnected' });
    } catch (err) {
      toast({ title: 'Disconnect failed', description: err.message, variant: 'destructive' });
    }
  };

  const handleSendMessage = async (chatId, content) => {
    await base44.functions.invoke('msTeams', { action: 'sendChatMessage', chatId, content });
    toast({ title: 'Message sent' });
  };

  const handleSendChannelMessage = async (teamId, channelId, content) => {
    await base44.functions.invoke('msTeams', { action: 'sendChannelMessage', teamId, channelId, content });
    toast({ title: 'Message sent' });
  };

  if (checking) return null;

  return (
    <>
      {open && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="absolute inset-0 bg-black/30" onClick={onClose} />
          <div className="relative w-full max-w-md bg-background shadow-2xl flex flex-col h-full ml-auto animate-in slide-in-from-right duration-200">
            <div className="flex items-center justify-between px-4 py-3 border-b flex-shrink-0">
              <div className="flex items-center gap-2 min-w-0">
                <MessageSquare className="h-5 w-5 text-accent flex-shrink-0" />
                <div className="min-w-0">
                  <h3 className="font-semibold text-sm">Teams</h3>
                  {profile && (
                    <p className="text-xs text-muted-foreground truncate">{profile.displayName}</p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-1 flex-shrink-0">
                {connected && (
                  <>
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => { fetchChats(); fetchTeams(); }} title="Refresh">
                      <RefreshCw className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={handleDisconnect} title="Disconnect">
                      <Unlink className="h-4 w-4" />
                    </Button>
                  </>
                )}
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onClose} title="Close">
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {!connected ? (
              <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
                <div className="w-16 h-16 rounded-2xl bg-accent/10 flex items-center justify-center mb-4">
                  <MessageSquare className="h-8 w-8 text-accent" />
                </div>
                <h4 className="font-semibold mb-2">Connect Your Teams</h4>
                <p className="text-sm text-muted-foreground mb-6">
                  Connect your Microsoft 365 account to read and send Teams messages in chats and channels.
                </p>
                <Button onClick={handleConnect} size="lg" className="gap-2" disabled={connecting}>
                  {connecting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
                      Waiting for sign-in...
                    </>
                  ) : (
                    <>
                      <Link2 className="h-4 w-4" />
                      Connect Teams
                    </>
                  )}
                </Button>
                {connecting && (
                  <p className="text-xs text-muted-foreground mt-2">
                    Complete the Microsoft login in the popup window.
                  </p>
                )}
              </div>
            ) : (
              <>
                <div className="flex border-b flex-shrink-0">
                  {TABS.map((tab) => {
                    const Icon = tab.icon;
                    return (
                      <button
                        key={tab.id}
                        onClick={() => { setActiveTab(tab.id); setSelectedChat(null); }}
                        className={cn(
                          'flex items-center gap-1.5 px-3 py-2 text-xs font-medium border-b-2 transition-colors flex-1 justify-center',
                          activeTab === tab.id
                            ? 'border-accent text-accent'
                            : 'border-transparent text-muted-foreground hover:text-foreground'
                        )}
                      >
                        <Icon className="h-3.5 w-3.5" />
                        {tab.label}
                      </button>
                    );
                  })}
                </div>

                <div className="flex-1 overflow-hidden">
                  {activeTab === 'chats' && (
                    selectedChat ? (
                      <ChatView chat={selectedChat} onBack={() => setSelectedChat(null)} onSend={handleSendMessage} />
                    ) : (
                      <ChatList chats={chats} loading={chatsLoading} onSelect={setSelectedChat} profile={profile} />
                    )
                  )}
                  {activeTab === 'channels' && (
                    <ChannelsTab teams={teams} loading={teamsLoading} onSend={handleSendChannelMessage} />
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}