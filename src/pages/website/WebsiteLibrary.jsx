import React, { useCallback, useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import PageHeader from '@/components/shared/PageHeader';
import { Button } from '@/components/ui/button';
import { FileText, Link2, Plus, Pencil, Trash2, Eye, EyeOff } from 'lucide-react';
import { toast } from 'sonner';
import LibraryItemDialog from '@/components/website/library/LibraryItemDialog';

export default function WebsiteLibrary() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const page = await base44.entities.WebsiteLibraryItem.filter({}, { sort: 'display_order', limit: 200 });
      setItems(page.items || []);
    } catch (error) {
      toast.error(error?.message || 'The library could not be loaded.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const toggle = async (item) => {
    setBusy(true);
    try {
      await base44.entities.WebsiteLibraryItem.update(item.id, { is_published: !item.is_published });
      await load();
    } catch (error) {
      toast.error(error?.message || 'That change could not be saved.');
    } finally {
      setBusy(false);
    }
  };

  const remove = async (item) => {
    if (!window.confirm(`Remove “${item.title}” from the website library?`)) return;
    setBusy(true);
    try {
      await base44.entities.WebsiteLibraryItem.delete(item.id);
      toast.success('Removed.');
      await load();
    } catch (error) {
      toast.error(error?.message || 'The item could not be removed.');
    } finally {
      setBusy(false);
    }
  };

  const documents = items.filter((item) => item.kind === 'document');
  const resources = items.filter((item) => item.kind === 'resource');

  const renderList = (list) => (
    <div className="space-y-2.5">
      {list.map((item) => (
        <div key={item.id} className="rounded-xl border bg-card p-3.5 flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="font-semibold leading-tight flex items-center gap-2">
              {item.kind === 'document' ? <FileText className="w-4 h-4 text-muted-foreground" /> : <Link2 className="w-4 h-4 text-muted-foreground" />}
              {item.title}
            </p>
            {item.description && <p className="text-sm text-muted-foreground mt-0.5">{item.description}</p>}
            <p className="text-xs text-muted-foreground mt-1">
              {item.category || 'Ungrouped'} · {item.is_published ? 'On the website' : 'Hidden'}
            </p>
          </div>
          <div className="flex gap-1.5 shrink-0">
            <Button size="sm" variant="outline" onClick={() => { setEditing(item); setDialogOpen(true); }}>
              <Pencil className="w-3.5 h-3.5" />
            </Button>
            <Button size="sm" variant="outline" disabled={busy} onClick={() => toggle(item)}>
              {item.is_published ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
            </Button>
            <Button size="sm" variant="ghost" disabled={busy} onClick={() => remove(item)}>
              <Trash2 className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>
      ))}
    </div>
  );

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <PageHeader
        title="Documents & Resources"
        description="The AGM report, brochures and outside links the website publishes."
        actions={<Button onClick={() => { setEditing(null); setDialogOpen(true); }}><Plus className="w-4 h-4 mr-1.5" /> New item</Button>}
      />

      {loading ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : (
        <div className="space-y-8">
          <section>
            <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-2.5">
              Documents ({documents.length})
            </h2>
            {documents.length ? renderList(documents) : (
              <p className="text-sm text-muted-foreground">No documents yet.</p>
            )}
          </section>
          <section>
            <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-2.5">
              Online resources ({resources.length})
            </h2>
            {resources.length ? renderList(resources) : (
              <p className="text-sm text-muted-foreground">No links yet.</p>
            )}
          </section>
        </div>
      )}

      <LibraryItemDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        item={editing}
        onSaved={load}
      />
    </div>
  );
}