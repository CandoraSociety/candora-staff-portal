import { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { LayoutGrid, Users, FolderSync, Loader2, CheckCircle2, AlertTriangle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/use-toast';
import PortalAccessMatrix from '@/components/admin/PortalAccessMatrix';
import UserPortalAccessPanel from '@/components/admin/UserPortalAccessPanel';

export default function TierPresetsPanel() {
  const { toast } = useToast();
  const [subTab, setSubTab] = useState('matrix');
  const [syncing, setSyncing] = useState(false);
  const [syncResults, setSyncResults] = useState(null);

  const handleSyncFolders = async () => {
    setSyncing(true);
    setSyncResults(null);
    try {
      const res = await base44.functions.invoke('syncPortalFolders', {});
      const data = res.data || res;
      setSyncResults(data);

      if (data.errors?.length > 0) {
        toast({
          title: `Synced with ${data.errors.length} error(s)`,
          description: `${data.created} created, ${data.existing} already existed`,
          variant: 'destructive',
        });
      } else {
        toast({
          title: 'SharePoint folders synced',
          description: `${data.created} created, ${data.existing} already existed`,
        });
      }
    } catch (err) {
      toast({
        title: 'Failed to sync folders',
        description: err.message,
        variant: 'destructive',
      });
    } finally {
      setSyncing(false);
    }
  };

  const subTabs = [
    { id: 'matrix', label: 'Position Type Matrix', icon: LayoutGrid },
    { id: 'users', label: 'User Access Overview', icon: Users },
  ];

  return (
    <div className="space-y-4">
      {/* Sub-tabs + Sync button */}
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="flex gap-1 border-b border-border -mb-px">
          {subTabs.map(tab => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setSubTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                  subTab === tab.id
                    ? 'border-primary text-primary'
                    : 'border-transparent text-muted-foreground hover:text-foreground'
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </div>

        <Button variant="outline" size="sm" onClick={handleSyncFolders} disabled={syncing}>
          {syncing ? <Loader2 className="w-4 h-4 animate-spin" /> : <FolderSync className="w-4 h-4" />}
          {syncing ? 'Syncing...' : 'Sync SharePoint Folders'}
        </Button>
      </div>

      {/* Sync results */}
      {syncResults && (
        <div className="rounded-lg border border-border bg-card p-4 space-y-2">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-semibold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              SharePoint Folder Sync Results
            </h4>
            <Button variant="ghost" size="sm" onClick={() => setSyncResults(null)}>
              Clear
            </Button>
          </div>
          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="rounded-lg bg-emerald-50 border border-emerald-200 p-2">
              <p className="text-lg font-bold text-emerald-700">{syncResults.created}</p>
              <p className="text-xs text-emerald-600">Created</p>
            </div>
            <div className="rounded-lg bg-blue-50 border border-blue-200 p-2">
              <p className="text-lg font-bold text-blue-700">{syncResults.existing}</p>
              <p className="text-xs text-blue-600">Already Existed</p>
            </div>
            <div className="rounded-lg bg-amber-50 border border-amber-200 p-2">
              <p className="text-lg font-bold text-amber-700">{syncResults.errors?.length || 0}</p>
              <p className="text-xs text-amber-600">Errors</p>
            </div>
          </div>
          {syncResults.errors?.length > 0 && (
            <div className="space-y-1">
              {syncResults.errors.map((err, i) => (
                <div key={i} className="flex items-start gap-2 text-xs text-destructive bg-destructive/5 rounded p-2">
                  <AlertTriangle className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
                  <span><strong>{err.portal}</strong> → {err.folder}: {err.error?.slice(0, 200)}</span>
                </div>
              ))}
            </div>
          )}
          {syncResults.results && (
            <details className="text-xs">
              <summary className="cursor-pointer text-muted-foreground hover:text-foreground">View all {syncResults.results.length} portals</summary>
              <div className="mt-2 space-y-1 max-h-48 overflow-y-auto">
                {syncResults.results.map((r, i) => (
                  <div key={i} className="flex items-center justify-between gap-2 py-0.5">
                    <span className="text-foreground">{r.portal}</span>
                    <Badge
                      variant="outline"
                      className={`text-[10px] ${
                        r.status === 'created' ? 'text-emerald-600 border-emerald-200' :
                        r.status === 'exists' ? 'text-blue-600 border-blue-200' :
                        r.status === 'error' ? 'text-destructive border-destructive/20' :
                        'text-muted-foreground'
                      }`}
                    >
                      {r.status}
                    </Badge>
                  </div>
                ))}
              </div>
            </details>
          )}
        </div>
      )}

      {/* Sub-tab content */}
      {subTab === 'matrix' && <PortalAccessMatrix />}
      {subTab === 'users' && <UserPortalAccessPanel />}
    </div>
  );
}