import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { Trash2 } from 'lucide-react';
import { TEST_CLIENT_BG, TEST_CLIENT_TEXT, TEST_CLIENT_MUTED } from '@/lib/rcTestClients';

// Lists every test client in the Central Database, with per-client delete and a
// delete-all action. Rows use the same neon blue / sportscar yellow highlight
// used in the client list.
export default function TestClientsDialog({ open, onOpenChange, testClients = [] }) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [busy, setBusy] = useState(false);

  const refresh = () => queryClient.invalidateQueries({ queryKey: ['rc-clients'] });

  const removeOne = async (c) => {
    try {
      await base44.entities.RCClient.delete(c.id);
      refresh();
      toast({ title: 'Test client deleted', description: `${c.first_name} ${c.last_name}` });
    } catch (err) {
      toast({ title: 'Error deleting test client', description: err.message, variant: 'destructive' });
    }
  };

  const removeAll = async () => {
    if (!window.confirm(`Delete all ${testClients.length} test clients? This cannot be undone.`)) return;
    setBusy(true);
    try {
      await Promise.all(testClients.map(c => base44.entities.RCClient.delete(c.id)));
      refresh();
      toast({ title: 'All test clients deleted', description: `${testClients.length} record${testClients.length === 1 ? '' : 's'} removed` });
    } catch (err) {
      toast({ title: 'Error deleting test clients', description: err.message, variant: 'destructive' });
      refresh();
    } finally { setBusy(false); }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
        <DialogHeader><DialogTitle>Test Clients</DialogTitle></DialogHeader>
        <div className="space-y-2">
          {testClients.length === 0 && <p className="text-sm text-muted-foreground py-2">No test clients in the database.</p>}
          {testClients.map(c => (
            <div key={c.id} className="flex items-center justify-between gap-3 rounded-md px-3 py-2" style={{ backgroundColor: TEST_CLIENT_BG }}>
              <div className="min-w-0">
                <button
                  type="button"
                  className="text-sm font-bold truncate block text-left hover:underline cursor-pointer"
                  style={{ color: TEST_CLIENT_TEXT }}
                  title="Open client profile"
                  onClick={() => { onOpenChange(false); navigate(`/rc/clients/${c.id}`); }}
                >
                  {c.first_name} {c.last_name}
                </button>
                <p className="text-xs truncate" style={{ color: TEST_CLIENT_MUTED }}>{[c.email, c.phone].filter(Boolean).join(' · ') || 'No contact info'}</p>
              </div>
              <Button size="sm" variant="destructive" className="flex-shrink-0" onClick={() => removeOne(c)}><Trash2 className="h-3.5 w-3.5" /> Delete</Button>
            </div>
          ))}
        </div>
        {testClients.length > 0 && (
          <DialogFooter>
            <Button variant="destructive" onClick={removeAll} disabled={busy}><Trash2 className="h-3.5 w-3.5" /> {busy ? 'Deleting...' : 'Delete All Test Clients'}</Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}