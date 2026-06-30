import React, { useState, useEffect, useCallback } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import EmailList from '@/components/outlook/EmailList';
import EmailReader from '@/components/outlook/EmailReader';
import ComposeEmail from '@/components/outlook/ComposeEmail';
import CalendarView from '@/components/outlook/CalendarView';
import { Mail, Calendar as CalendarIcon, PenSquare, RefreshCw, Link2, Unlink } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/components/ui/use-toast';

const OUTLOOK_CONNECTOR_ID = '6a43f36f28e8ea04989eb603';

const TABS = [
  { id: 'inbox', label: 'Inbox', icon: Mail },
  { id: 'calendar', label: 'Calendar', icon: CalendarIcon },
  { id: 'compose', label: 'Compose', icon: PenSquare },
];

export default function OutlookDashboard() {
  const { toast } = useToast();
  const [user, setUser] = useState(null);
  const [connected, setConnected] = useState(false);
  const [loading, setLoading] = useState(true);
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
      return false;
    }
  }, []);

  const fetchEmails = useCallback(async () => {
    setEmailLoading(true);
    try {
      const res = await base44.functions.invoke('msOutlook', { action: 'listEmails', top: 25 });
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

  // Rule 1+2: check auth first, then fetch profile to detect connection
  useEffect(() => {
    base44.auth.isAuthenticated().then(async (authed) => {
      if (authed) {
        const me = await base44.auth.me();
        setUser(me);
        const isConnected = await fetchProfile();
        if (isConnected) {
          fetchEmails();
          fetchEvents();
        }
      }
      setLoading(false);
    });
  }, []);

  // Full-page redirect to OAuth consent, then user returns to this page
  const handleConnect = async () => {
    try {
      const url = await base44.connectors.connectAppUser(OUTLOOK_CONNECTOR_ID);
      window.location.href = url;
    } catch (err) {
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
    } catch (err) {
      toast({ title: 'Failed to send email', description: err.message, variant: 'destructive' });
      throw err;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-4 border-muted border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <p className="text-muted-foreground mb-4">Please sign in to access Outlook</p>
        <Button onClick={() => base44.auth.redirectToLogin()}>Sign In</Button>
      </div>
    );
  }

  // Not connected — show connect screen
  if (!connected) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
          <Mail className="w-8 h-8 text-primary" />
        </div>
        <h2 className="text-xl font-semibold mb-2">Connect Your Outlook Account</h2>
        <p className="text-muted-foreground text-center max-w-md mb-6">
          Connect your Microsoft 365 account to read and send emails, and manage your calendar — all from within the Candora portal.
        </p>
        <Button onClick={handleConnect} size="lg" className="gap-2">
          <Link2 className="w-4 h-4" />
          Connect Outlook
        </Button>
      </div>
    );
  }

  // Connected — show dashboard
  return (
    <div className="space-y-4">
      {/* Header bar */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-display font-bold">Outlook</h2>
          {profile && <p className="text-sm text-muted-foreground">{profile.mail || profile.userPrincipalName}</p>}
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => { fetchEmails(); fetchEvents(); }} className="gap-2">
            <RefreshCw className="w-4 h-4" />
            Refresh
          </Button>
          <Button variant="outline" size="sm" onClick={handleDisconnect} className="gap-2 text-destructive hover:text-destructive">
            <Unlink className="w-4 h-4" />
            Disconnect
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                'flex items-center gap-2 px-4 py-2 text-sm font-medium border-b-2 transition-colors -mb-px',
                activeTab === tab.id
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              )}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab content */}
      {activeTab === 'inbox' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 h-[calc(100vh-280px)] min-h-[400px]">
          <div className="border rounded-lg overflow-hidden bg-card">
            <div className="px-4 py-2 border-b bg-muted/30">
              <h3 className="text-sm font-semibold">Inbox ({emails.length})</h3>
            </div>
            <div className="overflow-y-auto h-[calc(100%-40px)]">
              <EmailList emails={emails} selectedId={selectedEmail?.id} onSelect={handleSelectEmail} loading={emailLoading} />
            </div>
          </div>
          <div className="border rounded-lg overflow-hidden bg-card hidden lg:block">
            <EmailReader email={selectedEmail} onClose={() => setSelectedEmail(null)} />
          </div>
          {/* Mobile reader overlay */}
          {selectedEmail && (
            <div className="fixed inset-0 z-50 bg-background lg:hidden">
              <EmailReader email={selectedEmail} onClose={() => setSelectedEmail(null)} />
            </div>
          )}
        </div>
      )}

      {activeTab === 'calendar' && (
        <div className="border rounded-lg bg-card p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold">Upcoming Events (14 days)</h3>
          </div>
          <CalendarView events={events} loading={eventsLoading} />
        </div>
      )}

      {activeTab === 'compose' && (
        <div className="border rounded-lg bg-card p-4">
          <h3 className="text-sm font-semibold mb-4">New Email</h3>
          <ComposeEmail onSend={handleSendEmail} />
        </div>
      )}
    </div>
  );
}