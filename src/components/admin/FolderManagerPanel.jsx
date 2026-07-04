import { useState, useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Folder, Trash2, ExternalLink, AlertTriangle, Loader2, Search, FileWarning, FolderTree, RefreshCw, Link2, Unlink, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';

export default function FolderManagerPanel() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [deleting, setDeleting] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);

  const { data: folders = [], isLoading, error } = useQuery({
    queryKey: ['spFoldersDetailed'],
    queryFn: async () => {
      const res = await base44.functions.invoke('spListFoldersDetailed', {});
      const data = res.data || res;
      if (data?.error) throw new Error(data.error);
      return data?.folders || [];
    },
  });

  const { data: cards = [] } = useQuery({
    queryKey: ['portalCards'],
    queryFn: () => base44.entities.PortalCard.list(),
  });

  // Portals with full metadata for matching
  const portals = useMemo(() => {
    return cards
      .filter(c => c.is_enabled && c.url && !c.is_external)
      .map(c => ({ name: c.name, url: c.url, icon: c.icon, color: c.color }));
  }, [cards]);

  const portalNames = portals.map(p => p.name);

  // The sync function creates folders using the portal name with invalid chars stripped
  const INVALID_CHARS = /["#%*:<>?/\\{|}]/g;
  const expectedFolderName = (portalName) => portalName.replace(INVALID_CHARS, '').trim();

  // Exact match: folder name === portal name (after stripping invalid chars), case-insensitive
  const getMatchingPortal = (folderName) => {
    const fn = folderName.toLowerCase();
    return portals.find(p => expectedFolderName(p.name).toLowerCase() === fn);
  };

  // Group folders: matched to a portal, or unmatched
  const { matched, unmatched } = useMemo(() => {
    const matched = [];
    const unmatched = [];
    for (const f of folders) {
      const portal = getMatchingPortal(f.name);
      if (portal) {
        matched.push({ ...f, matchedPortal: portal });
      } else {
        unmatched.push(f);
      }
    }
    // Group matched by portal name to find duplicates
    return { matched, unmatched };
  }, [folders, portalNames]);

  // Find duplicate groups (multiple folders matching the same portal)
  const duplicateGroups = useMemo(() => {
    const groups = {};
    for (const f of matched) {
      if (!groups[f.matchedPortal]) groups[f.matchedPortal] = [];
      groups[f.matchedPortal].push(f);
    }
    return Object.entries(groups).filter(([, fs]) => fs.length > 1);
  }, [matched]);

  // Build portal → folder mapping (all portals, even those with no matching folder)
  const portalFolderMap = useMemo(() => {
    const map = portals.map(p => {
      const matchedFolders = matched.filter(m => m.matchedPortal === p.name);
      return { portal: p.name, url: p.url, icon: p.icon, color: p.color, folders: matchedFolders };
    });
    return map;
  }, [portals, matched]);

  const portalsWithoutFolders = portalFolderMap.filter(p => p.folders.length === 0);
  const portalsWithFolders = portalFolderMap.filter(p => p.folders.length > 0);

  const filteredFolders = useMemo(() => {
    if (!search) return folders;
    const q = search.toLowerCase();
    return folders.filter(f => f.name.toLowerCase().includes(q));
  }, [folders, search]);

  const handleDelete = async (folderName) => {
    setDeleting(folderName);
    try {
      const res = await base44.functions.invoke('spDeleteFolder', { folderPath: `/${folderName}` });
      toast({ title: `Deleted "${folderName}"`, description: 'The folder has been removed from SharePoint.' });
      queryClient.invalidateQueries({ queryKey: ['spFoldersDetailed'] });
    } catch (err) {
      toast({ title: 'Failed to delete', description: err.message, variant: 'destructive' });
    } finally {
      setDeleting(null);
      setConfirmDelete(null);
    }
  };

  if (isLoading) {
    return <div className="flex items-center justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>;
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-12 gap-3 text-center">
        <AlertTriangle className="w-8 h-8 text-destructive" />
        <p className="text-sm font-medium text-destructive">Failed to load folders</p>
        <p className="text-xs text-muted-foreground max-w-md">{error.message}</p>
        <Button variant="outline" size="sm" onClick={() => queryClient.invalidateQueries({ queryKey: ['spFoldersDetailed'] })}>
          <RefreshCw className="w-3.5 h-3.5" /> Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Duplicate warning banner */}
      {duplicateGroups.length > 0 && (
        <div className="flex items-start gap-2 p-3 rounded-lg bg-amber-50 border border-amber-200 text-sm text-amber-800">
          <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" />
          <div>
            <p className="font-semibold">{duplicateGroups.length} portal(s) have duplicate folders</p>
            <p className="text-xs mt-1">Review the duplicates below and delete the ones you don't need. Empty folders (0 items) are safe to remove. Folders with content should be checked first — make sure the content isn't needed or has been moved.</p>
          </div>
        </div>
      )}

      {/* Duplicate groups first */}
      {duplicateGroups.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
            <FileWarning className="w-4 h-4 text-amber-600" />
            Duplicate Folders ({duplicateGroups.length} groups)
          </h3>
          {duplicateGroups.map(([portalName, dupeFolders]) => (
            <Card key={portalName} className="border-amber-200">
              <CardContent className="p-3 space-y-2">
                <p className="text-sm font-medium text-foreground">Portal: <span className="text-primary">{portalName}</span></p>
                <div className="grid gap-2">
                  {dupeFolders.map(f => (
                    <div key={f.name} className="flex items-center gap-3 p-2 rounded-lg border border-border bg-card">
                      <Folder className={`w-5 h-5 flex-shrink-0 ${f.itemCount > 0 ? 'text-blue-500' : 'text-muted-foreground'}`} />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">{f.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {f.itemCount} item{f.itemCount !== 1 ? 's' : ''} · Last modified {new Date(f.lastModified).toLocaleDateString()}
                        </p>
                      </div>
                      {f.itemCount === 0 && (
                        <Badge variant="outline" className="text-[10px] bg-emerald-50 text-emerald-600 border-emerald-200">Empty</Badge>
                      )}
                      {f.itemCount > 0 && (
                        <Badge variant="outline" className="text-[10px] bg-blue-50 text-blue-600 border-blue-200">{f.itemCount} items</Badge>
                      )}
                      {f.name === portalName && (
                        <Badge variant="outline" className="text-[10px] bg-primary/10 text-primary border-primary/20">Matches portal name</Badge>
                      )}
                      {confirmDelete === f.name ? (
                        <div className="flex items-center gap-1">
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleDelete(f.name)}
                            disabled={deleting === f.name}
                          >
                            {deleting === f.name ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Confirm'}
                          </Button>
                          <Button size="sm" variant="ghost" onClick={() => setConfirmDelete(null)}>Cancel</Button>
                        </div>
                      ) : (
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-destructive hover:text-destructive hover:bg-destructive/10"
                          onClick={() => setConfirmDelete(f.name)}
                          disabled={deleting === f.name}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Portal → Folder Mapping */}
      <div className="space-y-2">
        <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
          <Link2 className="w-4 h-4 text-primary" />
          Portal → Folder Mapping
        </h3>

        {/* Portals with connected folders */}
        <div className="grid gap-1.5">
          {portalsWithFolders.map(({ portal, url, folders }) => (
            <div key={portal} className="flex items-center gap-3 p-2 rounded-lg border border-border bg-card">
              <div className="flex items-center gap-2 w-56 flex-shrink-0">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" />
                <div className="min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{portal}</p>
                  <p className="text-[10px] text-muted-foreground truncate">{url}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 flex-1 min-w-0 flex-wrap">
                {folders.map(f => (
                  <div key={f.name} className="flex items-center gap-1.5">
                    <Folder className={`w-3.5 h-3.5 flex-shrink-0 ${f.itemCount > 0 ? 'text-blue-500' : 'text-muted-foreground'}`} />
                    <span className="text-sm text-foreground">{f.name}</span>
                    <Badge variant="outline" className="text-[10px]">{f.itemCount} item{f.itemCount !== 1 ? 's' : ''}</Badge>
                    {folders.length > 1 && (
                      <Badge variant="outline" className="text-[10px] bg-amber-50 text-amber-600 border-amber-200">duplicate</Badge>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Portals with no folder */}
        {portalsWithoutFolders.length > 0 && (
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground flex items-center gap-1.5 pt-1">
              <Unlink className="w-3 h-3" />
              Portals with no matching folder ({portalsWithoutFolders.length})
            </p>
            <div className="flex flex-wrap gap-1.5">
              {portalsWithoutFolders.map(({ portal, url }) => (
                <div key={portal} className="flex items-center gap-1.5 px-2 py-1 rounded-md border border-dashed border-border bg-muted/30">
                  <span className="text-xs text-muted-foreground">{portal}</span>
                  <span className="text-[10px] text-muted-foreground/60">{url}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Unmatched folders */}
        {unmatched.length > 0 && (
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground flex items-center gap-1.5 pt-1">
              <Unlink className="w-3 h-3" />
              Folders not linked to any portal ({unmatched.length})
            </p>
            <div className="flex flex-wrap gap-1.5">
              {unmatched.map(f => (
                <div key={f.name} className="flex items-center gap-1.5 px-2 py-1 rounded-md border border-dashed border-border bg-muted/30">
                  <Folder className="w-3 h-3 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">{f.name}</span>
                  <Badge variant="outline" className="text-[10px]">{f.itemCount} item{f.itemCount !== 1 ? 's' : ''}</Badge>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Search */}
      <div className="relative w-full sm:w-72">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input placeholder="Search folders..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
      </div>

      {/* All folders list */}
      <div className="space-y-2">
        <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
          <FolderTree className="w-4 h-4" />
          All SharePoint Folders ({filteredFolders.length})
        </h3>
        {filteredFolders.map(f => {
          const portal = getMatchingPortal(f.name);
          const portalName = portal?.name;
          const isDuplicate = portal && matched.filter(m => m.matchedPortal === portalName).length > 1;
          return (
            <div key={f.name} className={`flex items-center gap-3 p-2.5 rounded-lg border bg-card transition-colors ${isDuplicate ? 'border-amber-200' : 'border-border'}`}>
              <Folder className={`w-4 h-4 flex-shrink-0 ${f.itemCount > 0 ? 'text-blue-500' : 'text-muted-foreground'}`} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium text-foreground truncate">{f.name}</p>
                  {portalName && (
                    <Badge variant="outline" className="text-[10px] flex-shrink-0">
                      → {portalName}
                    </Badge>
                  )}
                  {isDuplicate && (
                    <Badge variant="outline" className="text-[10px] bg-amber-50 text-amber-600 border-amber-200 flex-shrink-0">
                      Duplicate
                    </Badge>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  {f.itemCount} item{f.itemCount !== 1 ? 's' : ''} · {f.size > 0 ? `${(f.size / 1024).toFixed(0)} KB · ` : ''}Modified {new Date(f.lastModified).toLocaleDateString()}
                </p>
              </div>
              {f.webUrl && (
                <a href={f.webUrl} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-primary">
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              )}
              {confirmDelete === f.name ? (
                <div className="flex items-center gap-1">
                  <Button size="sm" variant="destructive" onClick={() => handleDelete(f.name)} disabled={deleting === f.name}>
                    {deleting === f.name ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Confirm'}
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => setConfirmDelete(null)}>Cancel</Button>
                </div>
              ) : (
                <Button
                  size="sm"
                  variant="ghost"
                  className="text-destructive hover:text-destructive hover:bg-destructive/10"
                  onClick={() => setConfirmDelete(f.name)}
                  disabled={deleting === f.name}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </Button>
              )}
            </div>
          );
        })}
        {filteredFolders.length === 0 && (
          <div className="text-center py-8 text-muted-foreground text-sm">
            <p>No folders found</p>
          </div>
        )}
      </div>
    </div>
  );
}