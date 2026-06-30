import React, { useState, useEffect, useCallback } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import EmailList from '@/components/outlook/EmailList';
import EmailReader from '@/components/outlook/EmailReader';
import ComposeEmail from '@/components/outlook/ComposeEmail';
import CalendarView from '@/components/outlook/CalendarView';
import { Mail, Calendar as CalendarIcon, PenSquare, RefreshCw, X, Link2, Unlink } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/components/ui/use-toast';

const OUTLOOK_CONNECTOR_ID = '6a43f36f28e8ea04989eb603';

const TABS = [
  { id: 'inbox', label: 'Inbox', icon: Mail },
  { id: 'calendar', label: 'Calendar', icon: CalendarIcon },
  { id: 'compose', label: 'Compose', icon: PenSquare },
];

export default function OutlookTeamsFloatingWidget() {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [connected, setConnected] = useState(false);
  const [checking, setChecking] = useState(true);
  const [connecting, setConnecting] = useState(false);
  const [activeTab, setActiveTab] = useState('inbox');
  const [emails, setEmails] = useState([]);
  const [selectedEmail, setSelectedEmail] = useState(null);
  const [emailLoading, setEmailLoading] = useState(false);
  const [events, setEvents] = useState([]);
  const [eventsLoading, setEventsLoading] = useState(false);
  const [profile, setProfile] = useState(null);

  const fetchProfile = useCallback(async () => {
    try {
      const res = await base44.functions.invoke('msOutlook', { action: 'getProfile' });
      setProfile(res.data.profile);
      setConnected(true);
      return true;
    } catch {
      setConnected(false);
      setProfile(null);
      return false;
    }
  }, []);

  const fetchEmails = useCallback(async () => {
    setEmailLoading(true);
    try {
      const res = await base44.functions.invoke('msOutlook', { action: 'listEmails', top: 20 });
      setEmails(res.data.emails || []);
    } catch (err) {
      toast({ title: 'Error loading emails', description: err.message, variant: 'destructive' });
    } finally {
      setEmailLoading(false);
    }
  }, [toast]);

  const fetchEvents = useCallback(async () => {
    setEventsLoading(true);
    try {
      const res = await base44.functions.invoke('msOutlook', { action: 'listCalendarEvents', days: 14 });
      setEvents(res.data.events || []);
    } catch (err) {
      toast({ title: 'Error loading calendar', description: err.message, variant: 'destructive' });
    } finally {
      setEventsLoading(false);
    }
  }, [toast]);

  // Check connection status on mount (silently)
  useEffect(() => {
    base44.auth.isAuthenticated().then(async (authed) => {
      if (authed) {
        await fetchProfile();
      }
      setChecking(false);
    });
  }, [fetchProfile]);

  // Fetch data when panel opens and connected
  useEffect(() => {
    if (open && connected) {
      fetchEmails();
      fetchEvents();
    }
  }, [open, connected, fetchEmails, fetchEvents]);

  const handleConnect = async () => {
    if (connecting) return;
    setConnecting(true);
    try {
      const url = await base44.connectors.connectAppUser(OUTLOOK_CONNECTOR_ID);
      if (!url) {
        toast({ title: 'Connection failed', description: 'No OAuth URL returned.', variant: 'destructive' });
        setConnecting(false);
        return;
      }
      const popup = window.open(url, '_blank', 'width=600,height=700');
      const timer = setInterval(() => {
        if (!popup || popup.closed) {
          clearInterval(timer);
          setConnecting(false);
          fetchProfile().then((ok) => {
            if (ok) { fetchEmails(); fetchEvents(); }
          });
        }
      }, 1000);
    } catch (err) {
      setConnecting(false);
      toast({ title: 'Connection failed', description: err.message, variant: 'destructive' });
    }
  };

  const handleDisconnect = async () => {
    try {
      await base44.connectors.disconnectAppUser(OUTLOOK_CONNECTOR_ID);
      setConnected(false);
      setProfile(null);
      setEmails([]);
      setSelectedEmail(null);
      setEvents([]);
      toast({ title: 'Outlook disconnected' });
    } catch (err) {
      toast({ title: 'Disconnect failed', description: err.message, variant: 'destructive' });
    }
  };

  const handleSelectEmail = async (email) => {
    setSelectedEmail(email);
    if (!email.body) {
      try {
        const res = await base44.functions.invoke('msOutlook', { action: 'getEmail', messageId: email.id });
        setSelectedEmail(res.data.email);
      } catch (err) {
        toast({ title: 'Error loading email', description: err.message, variant: 'destructive' });
      }
    }
  };

  const handleSendEmail = async ({ to, cc, subject, body }) => {
    try {
      await base44.functions.invoke('msOutlook', { action: 'sendEmail', to, cc, subject, body });
      toast({ title: 'Email sent successfully!' });
      fetchEmails();
      setActiveTab('inbox');
    } catch (err) {
      toast({ title: 'Failed to send email', description: err.message, variant: 'destructive' });
      throw err;
    }
  };

  const unreadCount = emails.filter(e => !e.isRead).length;

  if (checking) return null;

  return (
    <>
      {/* Floating button */}
      {!open && (
        <button
          onClick={() => setOpen(true)}
          className="fixed bottom-6 left-[4.5rem] z-50 flex items-center justify-center w-12 h-12 rounded-full shadow-lg bg-primary text-primary-foreground hover:shadow-xl hover:scale-105 transition-all"
          title="Outlook"
        >
          <Mail className="h-6 w-6" />
          {connected && unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 bg-destructive text-destructive-foreground text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </button>
      )}

      {/* Slide-out panel */}
      {open && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="absolute inset-0 bg-black/30" onClick={() => setOpen(false)} />

          <div className="relative w-full max-w-md bg-background shadow-2xl flex flex-col h-full ml-auto animate-in slide-in-from-right duration-200">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b flex-shrink-0">
              <div className="flex items-center gap-2 min-w-0">
                <Mail className="h-5 w-5 text-primary flex-shrink-0" />
                <div className="min-w-0">
                  <h3 className="font-semibold text-sm">Outlook</h3>
                  {profile && (
                    <p className="text-xs text-muted-foreground truncate">{profile.mail || profile.userPrincipalName}</p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-1 flex-shrink-0">
                {connected && (
                  <>
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => { fetchEmails(); fetchEvents(); }} title="Refresh">
                      <RefreshCw className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={handleDisconnect} title="Disconnect">
                      <Unlink className="h-4 w-4" />
                    </Button>
                  </>
                )}
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setOpen(false)} title="Close">
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Not connected */}
            {!connected ? (
              <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
                <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
                  <Mail className="h-8 w-8 text-primary" />
                </div>
                <h4 className="font-semibold mb-2">Connect Your Outlook</h4>
                <p className="text-sm text-muted-foreground mb-6">
                  Connect your Microsoft 365 account to read and send emails, and manage your calendar.
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
                      Connect Outlook
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
                {/* Tabs */}
                <div className="flex border-b flex-shrink-0">
                  {TABS.map((tab) => {
                    const Icon = tab.icon;
                    return (
                      <button
                        key={tab.id}
                        onClick={() => { setActiveTab(tab.id); setSelectedEmail(null); }}
                        className={cn(
                          'flex items-center gap-1.5 px-3 py-2 text-xs font-medium border-b-2 transition-colors flex-1 justify-center',
                          activeTab === tab.id
                            ? 'border-primary text-primary'
                            : 'border-transparent text-muted-foreground hover:text-foreground'
                        )}
                      >
                        <Icon className="h-3.5 w-3.5" />
                        {tab.label}
                      </button>
                    );
                  })}
                </div>

                {/* Tab content */}
                <div className="flex-1 overflow-hidden">
                  {activeTab === 'inbox' && (
                    <div className="h-full flex flex-col">
                      {selectedEmail ? (
                        <div className="flex-1 overflow-hidden">
                          <EmailReader email={selectedEmail} onClose={() => setSelectedEmail(null)} />
                        </div>
                      ) : (
                        <div className="flex-1 overflow-y-auto">
                          <EmailList emails={emails} selectedId={null} onSelect={handleSelectEmail} loading={emailLoading} />
                        </div>
                      )}
                    </div>
                  )}
                  {activeTab === 'calendar' && (
                    <div className="h-full overflow-y-auto p-3">
                      <CalendarView events={events} loading={eventsLoading} />
                    </div>
                  )}
                  {activeTab === 'compose' && (
                    <div className="h-full overflow-y-auto p-3">
                      <ComposeEmail onSend={handleSendEmail} />
                    </div>
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