import React, { useState, useEffect, useCallback } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import EmailList from '@/components/outlook/EmailList';
import EmailReader from '@/components/outlook/EmailReader';
import ComposeEmail from '@/components/outlook/ComposeEmail';
import CalendarView from '@/components/outlook/CalendarView';
import { Mail, Calendar as CalendarIcon, PenSquare, RefreshCw, X, Link2, Unlink, ShieldCheck, Copy, Bug } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/components/ui/use-toast';

const OUTLOOK_CONNECTOR_ID = '6a43f36f28e8ea04989eb603';

const TABS = [
  { id: 'inbox', label: 'Inbox', icon: Mail },
  { id: 'calendar', label: 'Calendar', icon: CalendarIcon },
  { id: 'compose', label: 'Compose', icon: PenSquare },
];

export default function OutlookTeamsFloatingWidget({ open, onClose }) {
  const { toast } = useToast();
  const [connected, setConnected] = useState(false);
  const [checking, setChecking] = useState(true);
  const [connecting, setConnecting] = useState(false);
  const [adminData, setAdminData] = useState(null);
  const [fetchingAdminUrl, setFetchingAdminUrl] = useState(false);
  const [debugUrl, setDebugUrl] = useState(null);
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

    // Open popup synchronously to preserve the user gesture (avoids popup blocker)
    const popup = window.open('about:blank', '_blank', 'width=600,height=700');

    try {
      const url = await base44.connectors.connectAppUser(OUTLOOK_CONNECTOR_ID);
      if (!url) {
        if (popup) popup.close();
        toast({ title: 'Connection failed', description: 'No OAuth URL returned.', variant: 'destructive' });
        setConnecting(false);
        return;
      }
      if (popup) {
        popup.location.href = url;
      } else {
        // Popup was blocked — fall back to full-page redirect
        window.location.href = url;
        return;
      }
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
      if (popup) popup.close();
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
      {/* Slide-out panel */}
      {open && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="absolute inset-0 bg-black/30" onClick={onClose} />

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
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onClose} title="Close">
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
                <Button onClick={async () => {
                  try {
                    const url = await base44.connectors.connectAppUser(OUTLOOK_CONNECTOR_ID);
                    setDebugUrl(url);
                  } catch (err) {
                    toast({ title: 'Error', description: err.message, variant: 'destructive' });
                  }
                }} variant="ghost" size="sm" className="text-xs gap-1.5 text-muted-foreground mb-2">
                  <Bug className="h-3.5 w-3.5" />
                  Debug: show OAuth URL
                </Button>
                {debugUrl && (
                  <div className="mb-4 w-full bg-amber-50 border border-amber-200 rounded p-2 text-left">
                    <p className="text-xs font-semibold mb-1">OAuth URL (check the scope= parameter):</p>
                    <div className="flex gap-1">
                      <input readOnly value={debugUrl} className="flex-1 text-[10px] px-1.5 py-1 rounded border bg-white truncate" onClick={(e) => e.target.select()} />
                      <button onClick={() => { navigator.clipboard.writeText(debugUrl); toast({ title: 'Copied!' }); }} className="text-[10px] px-2 rounded border bg-white hover:bg-amber-100"><Copy className="h-3 w-3" /></button>
                    </div>
                    <p className="text-[10px] text-muted-foreground mt-1">Look at the <code>scope=</code> part — those are the scopes being requested. They must ALL have admin consent in Azure.</p>
                  </div>
                )}
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

                {/* Admin consent helper */}
                <div className="mt-6 w-full border-t pt-4 space-y-3">
                  {adminData ? (
                    <div className="space-y-3 text-left max-h-[300px] overflow-y-auto">
                      <p className="text-xs font-semibold flex items-center gap-1.5">
                        <ShieldCheck className="h-3.5 w-3.5 text-primary" />
                        IT Admin Checklist
                      </p>

                      {/* Redirect URI */}
                      <div className="bg-muted rounded p-2 space-y-1">
                        <p className="text-xs font-medium">1. Redirect URI (Azure → Authentication)</p>
                        <div className="flex gap-1">
                          <input readOnly value={adminData.redirectUri} className="flex-1 text-[10px] px-1.5 py-1 rounded border bg-background truncate" onClick={(e) => e.target.select()} />
                          <button onClick={() => { navigator.clipboard.writeText(adminData.redirectUri); toast({ title: 'Copied!' }); }} className="text-[10px] px-2 rounded border bg-background hover:bg-muted-foreground/10"><Copy className="h-3 w-3" /></button>
                        </div>
                      </div>

                      {/* Required scopes */}
                      <div className="bg-muted rounded p-2 space-y-1">
                        <p className="text-xs font-medium">2. Required API permissions (all must have ✓ admin consent)</p>
                        <div className="flex flex-wrap gap-1">
                          {adminData.requiredScopes.map(s => (
                            <span key={s} className="text-[10px] px-1.5 py-0.5 rounded bg-background border font-mono">{s}</span>
                          ))}
                        </div>
                      </div>

                      {/* Admin consent URL */}
                      <div className="bg-muted rounded p-2 space-y-1">
                        <p className="text-xs font-medium">3. Admin consent link (send to IT)</p>
                        <div className="flex gap-1">
                          <input readOnly value={adminData.adminConsentUrl} className="flex-1 text-[10px] px-1.5 py-1 rounded border bg-background truncate" onClick={(e) => e.target.select()} />
                          <button onClick={() => { navigator.clipboard.writeText(adminData.adminConsentUrl); toast({ title: 'Copied!' }); }} className="text-[10px] px-2 rounded border bg-background hover:bg-muted-foreground/10"><Copy className="h-3 w-3" /></button>
                        </div>
                      </div>

                      {/* Test URL */}
                      <div className="bg-muted rounded p-2 space-y-1">
                        <p className="text-xs font-medium">4. Test sign-in (after admin consent)</p>
                        <a href={adminData.userConsentUrl} target="_blank" rel="noopener noreferrer" className="text-[10px] text-primary underline break-all">
                          Open test sign-in →
                        </a>
                        <p className="text-[10px] text-muted-foreground">If this still says "need admin approval", a scope is missing consent in Azure.</p>
                      </div>
                    </div>
                  ) : (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-xs gap-1.5 text-muted-foreground"
                      disabled={fetchingAdminUrl}
                      onClick={async () => {
                        setFetchingAdminUrl(true);
                        try {
                          const res = await base44.functions.invoke('getOutlookAdminConsentUrl', {});
                          setAdminData(res.data);
                        } catch (err) {
                          toast({ title: 'Could not generate links', description: err.message, variant: 'destructive' });
                        }
                        setFetchingAdminUrl(false);
                      }}
                    >
                      <ShieldCheck className="h-3.5 w-3.5" />
                      {fetchingAdminUrl ? 'Generating...' : 'IT admin says done? Get diagnostic checklist'}
                    </Button>
                  )}
                </div>
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