import React, { useCallback, useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import PageHeader from '@/components/shared/PageHeader';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, Pencil } from 'lucide-react';
import { toast } from 'sonner';
import VolunteerRoleDialog from '@/components/website/volunteers/VolunteerRoleDialog';
import ApplicationRow from '@/components/website/volunteers/ApplicationRow';
import { APPLICATION_STATUSES, applicationMeta } from '@/lib/websitePrograms';
import { cn } from '@/lib/utils';

export default function WebsiteVolunteers() {
  const [roles, setRoles] = useState([]);
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState('all');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [rolePage, applicationPage] = await Promise.all([
        base44.entities.VolunteerRole.filter({}, { sort: 'order', limit: 100 }),
        base44.entities.VolunteerApplication.filter({}, { sort: '-created_date', limit: 300 }),
      ]);
      setRoles(rolePage.items || []);
      setApplications(applicationPage.items || []);
    } catch (error) {
      toast.error(error?.message || 'The volunteer records could not be loaded.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const decide = async (application, decision) => {
    setBusy(true);
    try {
      const response = await base44.functions.invoke('volunteerApplicationAdmin', {
        id: application.id,
        decision,
      });
      if (response.data?.error) throw new Error(response.data.error);
      toast.success('Saved. The applicant has been emailed.');
      await load();
    } catch (error) {
      toast.error(error?.message || 'That decision could not be saved.');
    } finally {
      setBusy(false);
    }
  };

  const visible = applications.filter((item) => status === 'all' || item.status === status);

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <PageHeader
        title="Volunteers"
        description="The roles the website offers, and everyone who has applied."
      />

      <Tabs defaultValue="applications">
        <TabsList className="mb-4">
          <TabsTrigger value="applications">Applications ({applications.length})</TabsTrigger>
          <TabsTrigger value="roles">Roles ({roles.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="applications">
          <div className="flex flex-wrap gap-2 mb-4">
            <button
              type="button"
              onClick={() => setStatus('all')}
              className={cn(
                'rounded-full border px-3 py-1 text-xs font-semibold',
                status === 'all' ? 'bg-foreground text-background border-foreground' : 'bg-card text-muted-foreground'
              )}
            >
              All ({applications.length})
            </button>
            {APPLICATION_STATUSES.map((item) => (
              <button
                key={item.value}
                type="button"
                onClick={() => setStatus(item.value)}
                className={cn(
                  'rounded-full border px-3 py-1 text-xs font-semibold',
                  status === item.value ? item.tone : 'bg-card text-muted-foreground'
                )}
              >
                {item.label} ({applications.filter((application) => application.status === item.value).length})
              </button>
            ))}
          </div>

          {loading ? (
            <p className="text-sm text-muted-foreground">Loading applications…</p>
          ) : visible.length === 0 ? (
            <div className="rounded-xl border border-dashed p-10 text-center">
              <p className="font-medium">No applications here</p>
              <p className="text-sm text-muted-foreground mt-1">
                Applications sent from the website land here. Nobody is approved automatically.
              </p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {visible.map((application) => (
                <ApplicationRow
                  key={application.id}
                  application={application}
                  busy={busy}
                  onDecide={(decision) => decide(application, decision)}
                />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="roles">
          <div className="flex justify-end mb-3">
            <Button onClick={() => { setEditing(null); setDialogOpen(true); }}>
              <Plus className="w-4 h-4 mr-1.5" /> New role
            </Button>
          </div>
          {roles.length === 0 ? (
            <div className="rounded-xl border border-dashed p-10 text-center">
              <p className="font-medium">No volunteer roles yet</p>
              <p className="text-sm text-muted-foreground mt-1">
                Add the roles you need and they replace the old Apply Now buttons on the website.
              </p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {roles.map((role) => (
                <div key={role.id} className="rounded-xl border bg-card p-3.5 flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-semibold leading-tight">{role.title}</p>
                    <p className="text-sm text-muted-foreground mt-0.5">{role.summary}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {role.commitment || 'Commitment not set'} · {role.is_open ? 'Open' : 'Closed'}
                    </p>
                  </div>
                  <Button size="sm" variant="outline" onClick={() => { setEditing(role); setDialogOpen(true); }}>
                    <Pencil className="w-3.5 h-3.5 mr-1.5" /> Edit
                  </Button>
                </div>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      <VolunteerRoleDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        role={editing}
        onSaved={load}
      />
    </div>
  );
}