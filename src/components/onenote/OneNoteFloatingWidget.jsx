import React, { useState, useEffect, useCallback } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Notebook, RefreshCw, X, Link2, Unlink, ChevronLeft, FileText, Loader2, ShieldCheck, Copy } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/components/ui/use-toast';

const OUTLOOK_CONNECTOR_ID = '6a43f36f28e8ea04989eb603';

export default function OneNoteFloatingWidget({ open, onClose }) {
  const { toast } = useToast();
  const [connected, setConnected] = useState(false);
  const [checking, setChecking] = useState(true);
  const [connecting, setConnecting] = useState(false);
  const [profile, setProfile] = useState(null);
  const [adminData, setAdminData] = useState(null);
  const [fetchingAdminUrl, setFetchingAdminUrl] = useState(false);

  const [view, setView] = useState('notebooks');
  const [notebooks, setNotebooks] = useState([]);
  const [notebooksLoading, setNotebooksLoading] = useState(false);
  const [selectedNotebook, setSelectedNotebook] = useState(null);
  const [sections, setSections] = useState([]);
  const [sectionsLoading, setSectionsLoading] = useState(false);
  const [selectedSection, setSelectedSection] = useState(null);
  const [pages, setPages] = useState([]);
  const [pagesLoading, setPagesLoading] = useState(false);
  const [pageContent, setPageContent] = useState('');
  const [pageContentLoading, setPageContentLoading] = useState(false);
  const [selectedPage, setSelectedPage] = useState(null);

  const fetchProfile = useCallback(async () => {
    try {
      const res = await base44.functions.invoke('msOneNote', { action: 'getProfile' });
      setProfile(res.data.profile);
      setConnected(true);
      return true;
    } catch {
      setConnected(false);
      setProfile(null);
      return false;
    }
  }, []);

  const fetchNotebooks = useCallback(async () => {
    setNotebooksLoading(true);
    try {
      const res = await base44.functions.invoke('msOneNote', { action: 'listNotebooks' });
      setNotebooks(res.data.notebooks || []);
    } catch (err) {
      toast({ title: 'Error loading notebooks', description: err.message, variant: 'destructive' });
    } finally {
      setNotebooksLoading(false);
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
      fetchNotebooks();
    }
  }, [open, connected, fetchNotebooks]);

  const handleConnect = async () => {
    if (connecting) return;
    setConnecting(true);
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
        window.location.href = url;
        return;
      }
      const timer = setInterval(() => {
        if (!popup || popup.closed) {
          clearInterval(timer);
          setConnecting(false);
          fetchProfile().then((ok) => {
            if (ok) fetchNotebooks();
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
      setNotebooks([]);
      setSections([]);
      setPages([]);
      setPageContent('');
      setView('notebooks');
      setSelectedNotebook(null);
      setSelectedSection(null);
      setSelectedPage(null);
      toast({ title: 'OneNote disconnected' });
    } catch (err) {
      toast({ title: 'Disconnect failed', description: err.message, variant: 'destructive' });
    }
  };

  const handleSelectNotebook = async (notebook) => {
    setSelectedNotebook(notebook);
    setView('sections');
    setSections([]);
    setSectionsLoading(true);
    try {
      const res = await base44.functions.invoke('msOneNote', { action: 'listSections', notebookId: notebook.id });
      setSections(res.data.sections || []);
    } catch (err) {
      toast({ title: 'Error loading sections', description: err.message, variant: 'destructive' });
    } finally {
      setSectionsLoading(false);
    }
  };

  const handleSelectSection = async (section) => {
    setSelectedSection(section);
    setView('pages');
    setPages([]);
    setPagesLoading(true);
    try {
      const res = await base44.functions.invoke('msOneNote', { action: 'listPages', sectionId: section.id });
      setPages(res.data.pages || []);
    } catch (err) {
      toast({ title: 'Error loading pages', description: err.message, variant: 'destructive' });
    } finally {
      setPagesLoading(false);
    }
  };

  const handleSelectPage = async (page) => {
    setSelectedPage(page);
    setView('page');
    setPageContent('');
    setPageContentLoading(true);
    try {
      const res = await base44.functions.invoke('msOneNote', { action: 'getPageContent', pageId: page.id });
      setPageContent(res.data.html || '');
    } catch (err) {
      toast({ title: 'Error loading page', description: err.message, variant: 'destructive' });
    } finally {
      setPageContentLoading(false);
    }
  };

  const handleBack = () => {
    if (view === 'page') { setView('pages'); setSelectedPage(null); setPageContent(''); }
    else if (view === 'pages') { setView('sections'); setSelectedSection(null); setPages([]); }
    else if (view === 'sections') { setView('notebooks'); setSelectedNotebook(null); setSections([]); }
  };

  const breadcrumb = () => {
    const crumbs = [{ label: 'Notebooks', action: () => { setView('notebooks'); setSelectedNotebook(null); setSelectedSection(null); setSelectedPage(null); setSections([]); setPages([]); setPageContent(''); } }];
    if (selectedNotebook) crumbs.push({ label: selectedNotebook.displayName, action: () => { setView('sections'); setSelectedSection(null); setSelectedPage(null); setPages([]); setPageContent(''); } });
    if (selectedSection) crumbs.push({ label: selectedSection.displayName, action: () => { setView('pages'); setSelectedPage(null); setPageContent(''); } });
    if (selectedPage) crumbs.push({ label: selectedPage.title, action: null });
    return crumbs;
  };

  if (checking) return null;

  return (
    <>
      {open && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="absolute inset-0 bg-black/30" onClick={onClose} />
          <div className="relative w-full max-w-md bg-background shadow-2xl flex flex-col h-full ml-auto animate-in slide-in-from-right duration-200">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b flex-shrink-0">
              <div className="flex items-center gap-2 min-w-0">
                <Notebook className="h-5 w-5 flex-shrink-0" style={{ color: '#7719AA' }} />
                <div className="min-w-0">
                  <h3 className="font-semibold text-sm">OneNote</h3>
                  {profile && (
                    <p className="text-xs text-muted-foreground truncate">{profile.displayName}</p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-1 flex-shrink-0">
                {connected && (
                  <>
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={fetchNotebooks} title="Refresh">
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
                <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4" style={{ backgroundColor: '#7719AA15' }}>
                  <Notebook className="h-8 w-8" style={{ color: '#7719AA' }} />
                </div>
                <h4 className="font-semibold mb-2">Connect Your OneNote</h4>
                <p className="text-sm text-muted-foreground mb-6">
                  Connect your Microsoft 365 account to browse your OneNote notebooks, sections, and pages.
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
                      Connect OneNote
                    </>
                  )}
                </Button>
                {connecting && (
                  <p className="text-xs text-muted-foreground mt-2">
                    Complete the Microsoft login in the popup window.
                  </p>
                )}

                {/* Admin consent helper */}
                <div className="mt-6 w-full border-t pt-4">
                  {adminData ? (
                    <div className="space-y-3 text-left max-h-[300px] overflow-y-auto">
                      <p className="text-xs font-semibold flex items-center gap-1.5">
                        <ShieldCheck className="h-3.5 w-3.5" style={{ color: '#7719AA' }} />
                        IT Admin Checklist — OneNote Scopes
                      </p>
                      <div className="bg-muted rounded p-2 space-y-1">
                        <p className="text-xs font-medium">1. Redirect URI (Azure → Authentication)</p>
                        <div className="flex gap-1">
                          <input readOnly value={adminData.redirectUri} className="flex-1 text-[10px] px-1.5 py-1 rounded border bg-background truncate" onClick={(e) => e.target.select()} />
                          <button onClick={() => { navigator.clipboard.writeText(adminData.redirectUri); toast({ title: 'Copied!' }); }} className="text-[10px] px-2 rounded border bg-background hover:bg-muted-foreground/10"><Copy className="h-3 w-3" /></button>
                        </div>
                      </div>
                      <div className="bg-muted rounded p-2 space-y-1">
                        <p className="text-xs font-medium">2. Required API permissions (all must have ✓ admin consent)</p>
                        <div className="flex flex-wrap gap-1">
                          {adminData.requiredScopes.map(s => (
                            <span key={s} className="text-[10px] px-1.5 py-0.5 rounded bg-background border font-mono">{s}</span>
                          ))}
                        </div>
                      </div>
                      <div className="bg-muted rounded p-2 space-y-1">
                        <p className="text-xs font-medium">3. Admin consent link (send to IT)</p>
                        <div className="flex gap-1">
                          <input readOnly value={adminData.adminConsentUrl} className="flex-1 text-[10px] px-1.5 py-1 rounded border bg-background truncate" onClick={(e) => e.target.select()} />
                          <button onClick={() => { navigator.clipboard.writeText(adminData.adminConsentUrl); toast({ title: 'Copied!' }); }} className="text-[10px] px-2 rounded border bg-background hover:bg-muted-foreground/10"><Copy className="h-3 w-3" /></button>
                        </div>
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
                          const res = await base44.functions.invoke('getOneNoteAdminConsentUrl', {});
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
                {/* Breadcrumb */}
                {view !== 'notebooks' && (
                  <div className="flex items-center gap-1 px-3 py-2 border-b flex-shrink-0 overflow-x-auto">
                    <button onClick={handleBack} className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground flex-shrink-0">
                      <ChevronLeft className="h-3.5 w-3.5" />
                      Back
                    </button>
                    <span className="text-muted-foreground/30 text-xs">/</span>
                    {breadcrumb().map((crumb, idx) => (
                      <span key={idx} className="flex items-center gap-1 flex-shrink-0">
                        {idx > 0 && <span className="text-muted-foreground/30 text-xs">/</span>}
                        {crumb.action ? (
                          <button onClick={crumb.action} className="text-xs text-muted-foreground hover:text-foreground truncate max-w-[100px]">
                            {crumb.label}
                          </button>
                        ) : (
                          <span className="text-xs font-medium text-foreground truncate max-w-[100px]">{crumb.label}</span>
                        )}
                      </span>
                    ))}
                  </div>
                )}

                {/* Content */}
                <div className="flex-1 overflow-y-auto">
                  {/* Notebooks view */}
                  {view === 'notebooks' && (
                    <div className="p-2">
                      {notebooksLoading ? (
                        <div className="flex justify-center py-12"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
                      ) : notebooks.length === 0 ? (
                        <div className="text-center py-12 text-sm text-muted-foreground">No notebooks found</div>
                      ) : (
                        notebooks.map(nb => (
                          <button
                            key={nb.id}
                            onClick={() => handleSelectNotebook(nb)}
                            className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-muted transition-colors text-left"
                          >
                            <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: '#7719AA15' }}>
                              <Notebook className="w-5 h-5" style={{ color: '#7719AA' }} />
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="font-medium text-sm truncate">{nb.displayName}</p>
                              {nb.isDefault && <span className="text-[10px] text-muted-foreground">Default</span>}
                            </div>
                          </button>
                        ))
                      )}
                    </div>
                  )}

                  {/* Sections view */}
                  {view === 'sections' && (
                    <div className="p-2">
                      {sectionsLoading ? (
                        <div className="flex justify-center py-12"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
                      ) : sections.length === 0 ? (
                        <div className="text-center py-12 text-sm text-muted-foreground">No sections found</div>
                      ) : (
                        sections.map(sec => (
                          <button
                            key={sec.id}
                            onClick={() => handleSelectSection(sec)}
                            className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-muted transition-colors text-left"
                          >
                            <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 bg-muted">
                              <FileText className="w-4 h-4 text-muted-foreground" />
                            </div>
                            <p className="font-medium text-sm truncate">{sec.displayName}</p>
                          </button>
                        ))
                      )}
                    </div>
                  )}

                  {/* Pages view */}
                  {view === 'pages' && (
                    <div className="p-2">
                      {pagesLoading ? (
                        <div className="flex justify-center py-12"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
                      ) : pages.length === 0 ? (
                        <div className="text-center py-12 text-sm text-muted-foreground">No pages found</div>
                      ) : (
                        pages.map(pg => (
                          <button
                            key={pg.id}
                            onClick={() => handleSelectPage(pg)}
                            className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-muted transition-colors text-left"
                          >
                            <FileText className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                            <div className="min-w-0 flex-1">
                              <p className="font-medium text-sm truncate">{pg.title || 'Untitled'}</p>
                              <p className="text-[10px] text-muted-foreground">{pg.lastModifiedDateTime ? new Date(pg.lastModifiedDateTime).toLocaleDateString() : ''}</p>
                            </div>
                          </button>
                        ))
                      )}
                    </div>
                  )}

                  {/* Page content view */}
                  {view === 'page' && (
                    pageContentLoading ? (
                      <div className="flex justify-center py-12"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
                    ) : (
                      <div
                        className="onenote-content p-4 text-sm"
                        dangerouslySetInnerHTML={{ __html: pageContent }}
                      />
                    )
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