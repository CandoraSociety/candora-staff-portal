import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { UserSearch, Pencil, RotateCcw, ArrowRight } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import ClientFormCore from '@/components/rc/ClientFormCore';
import { SERVICE_CATEGORY_OPTIONS } from '@/components/rc/ClientFormCore';
import { generateTestClientName } from '@/lib/rcTestClients';
import GrabAndGoDialog from '@/components/reception/clientvisit/GrabAndGoDialog';
import CaseworkVisitDialog from '@/components/reception/clientvisit/CaseworkVisitDialog';
import VisitTypeCards, { VISIT_TYPES } from '@/components/reception/clientvisit/VisitTypeCards';
import ClientLookupCard from '@/components/reception/clientvisit/ClientLookupCard';
import { todayStr, clientFullName } from '@/lib/rcClientVisits';
import { isReceptionPortalRoute } from '@/lib/receptionPortalSession';

const EMPTY_FORM = {
  first_name: '', last_name: '', date_of_birth: '', phone: '', email: '', address: '', city: '', postal_code: '',
  preferred_language: '', additional_languages: '', emergency_contact_name: '', emergency_contact_phone: '',
  gender: '', marital_status: '', spouse_client_id: '', spouse_name: '', dependants_count: '', dependants_detail: '',
  service_category: '', has_children_0_6: false, children_count_0_6: 0, children_ages_detail: '',
  english_proficiency: '', english_proficiency_notes: '', indigenous_first_nations: false, newcomer: false,
  senior: false, youth_under_25: false,
  reason_for_accessing: '', reason_for_accessing_other: '', identified_needs: '',
  assigned_worker: '', case_status: 'intake', referral_source: '', notes: '',
};

// Shared Client Visit flow — used by the Reception portal (all three visit types)
// and the Central Database portal (drop-in casework + scheduled visits only,
// via includeGrabAndGo={false}).
//
// Front-desk order: pick what is happening at the desk, then name the client at
// it. Only once the client is known does the visit form open.
export default function ClientVisitFlow({ includeGrabAndGo = true }) {
  const { toast } = useToast();
  const navigate = useNavigate();
  // The external Reception portal has no access to the staff-only client profiles.
  const inPortal = isReceptionPortalRoute();
  const queryClient = useQueryClient();

  // A card elsewhere in Reception can deep-link straight into one visit type.
  const requestedType = new URLSearchParams(window.location.search).get('type');
  const [action, setAction] = useState(() => (
    VISIT_TYPES.some(t => t.key === requestedType && (includeGrabAndGo || t.key !== 'grab_and_go'))
      ? requestedType
      : null
  ));
  const [selected, setSelected] = useState(null);
  const [showCreate, setShowCreate] = useState(false);
  const [createForm, setCreateForm] = useState({ ...EMPTY_FORM });
  const [saving, setSaving] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editForm, setEditForm] = useState({});
  const [creatingTest, setCreatingTest] = useState(false);

  const { data: clients = [], isLoading } = useQuery({
    queryKey: ['reception-visit-clients'],
    queryFn: () => base44.entities.RCClient.list('last_name', 500),
  });
  const sortedClients = useMemo(
    () => [...clients].sort((a, b) => clientFullName(a).localeCompare(clientFullName(b))),
    [clients]
  );

  const activeType = VISIT_TYPES.find(t => t.key === action) || null;

  const updateCreate = (field, value) => setCreateForm(prev => ({ ...prev, [field]: value }));
  const updateEdit = (field, value) => setEditForm(prev => ({ ...prev, [field]: value }));

  // Back to the three cards — a finished visit starts the desk over.
  const backToStart = () => {
    setDialogOpen(false);
    setSelected(null);
    setAction(null);
    setShowCreate(false);
    setCreateForm({ ...EMPTY_FORM });
  };

  const chooseType = (key) => {
    setSelected(null);
    setShowCreate(false);
    setDialogOpen(false);
    setAction(key);
  };

  const pickClient = (client) => {
    if (!client) return;
    setSelected(client);
    setShowCreate(false);
    setDialogOpen(true);
  };

  const refreshClient = async () => {
    queryClient.invalidateQueries({ queryKey: ['reception-visit-clients'] });
    if (selected) {
      try {
        const fresh = await base44.entities.RCClient.get(selected.id);
        setSelected(fresh);
      } catch { /* client list refresh is enough */ }
    }
  };

  const finishVisit = () => {
    refreshClient();
    backToStart();
  };

  const handleCreate = async () => {
    if (!createForm.first_name || !createForm.last_name) { toast({ title: 'First and last name are required', variant: 'destructive' }); return; }
    setSaving(true);
    try {
      const created = await base44.entities.RCClient.create({ ...createForm, case_status: 'intake', intake_date: todayStr() });
      toast({ title: 'Client profile created', description: clientFullName(created) });
      setCreateForm({ ...EMPTY_FORM });
      queryClient.invalidateQueries({ queryKey: ['reception-visit-clients'] });
      pickClient(created);
    } catch (err) {
      toast({ title: 'Error creating client profile', description: err.message, variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const handleCreateTestClient = async () => {
    setCreatingTest(true);
    try {
      const name = generateTestClientName();
      const created = await base44.entities.RCClient.create({ ...name, case_status: 'intake', intake_date: todayStr() });
      toast({ title: 'Test client created', description: clientFullName(created) });
      queryClient.invalidateQueries({ queryKey: ['reception-visit-clients'] });
      pickClient(created);
    } catch (err) {
      toast({ title: 'Error creating test client', description: err.message, variant: 'destructive' });
    } finally {
      setCreatingTest(false);
    }
  };

  const openEdit = () => {
    setEditForm({ ...EMPTY_FORM, ...selected });
    setEditOpen(true);
  };

  const handleEditSave = async () => {
    if (!editForm.first_name || !editForm.last_name) { toast({ title: 'First and last name are required', variant: 'destructive' }); return; }
    setSaving(true);
    try {
      const updated = await base44.entities.RCClient.update(selected.id, editForm);
      setSelected(updated);
      setEditOpen(false);
      queryClient.invalidateQueries({ queryKey: ['reception-visit-clients'] });
      toast({ title: 'Client info updated' });
    } catch (err) {
      toast({ title: 'Error updating client', description: err.message, variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4 max-w-3xl mx-auto">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-heading font-bold text-foreground">Client Visit</h1>
          <p className="text-muted-foreground text-sm mt-1">
            {!activeType && (includeGrabAndGo
              ? 'Start with what the visitor needs — grab-and-go resources, drop-in casework or a scheduled visit'
              : 'Start with the visit type — drop-in casework or a scheduled visit')}
            {activeType && !selected && `${activeType.label} — now find the client`}
            {activeType && selected && activeType.label}
          </p>
        </div>
        {activeType && (
          <Button variant="ghost" size="sm" onClick={backToStart}>
            <RotateCcw className="h-3.5 w-3.5" /> Start over
          </Button>
        )}
      </div>

      {/* Step 1 — what is happening at the desk */}
      {!activeType && <VisitTypeCards onSelect={chooseType} includeGrabAndGo={includeGrabAndGo} />}

      {/* Step 2 — who is at the desk */}
      {activeType && !selected && !showCreate && (
        <ClientLookupCard
          clients={sortedClients}
          isLoading={isLoading}
          creatingTest={creatingTest}
          onSelect={pickClient}
          onCreateProfile={() => setShowCreate(true)}
          onCreateTestClient={handleCreateTestClient}
        />
      )}

      {activeType && !selected && showCreate && (
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-3">
              <p className="font-heading font-bold text-foreground">New Client Profile</p>
              <Button variant="ghost" size="sm" onClick={() => { setShowCreate(false); setCreateForm({ ...EMPTY_FORM }); }}>
                <RotateCcw className="h-4 w-4" /> Back to search
              </Button>
            </div>
            <ClientFormCore form={createForm} update={updateCreate} clients={sortedClients} compact />
            <div className="flex justify-end gap-2 mt-4">
              <Button variant="outline" onClick={() => { setShowCreate(false); setCreateForm({ ...EMPTY_FORM }); }}>Cancel</Button>
              <Button onClick={handleCreate} disabled={saving}>{saving ? 'Saving...' : 'Create Profile'}</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 3 — the named client, visit type already chosen */}
      {activeType && selected && (
        <Card>
          <CardContent className="p-4 flex flex-wrap items-center justify-between gap-3">
            <div
              className={`flex items-center gap-3 ${inPortal ? '' : 'cursor-pointer group'}`}
              onClick={inPortal ? undefined : () => navigate(`/rc/clients/${selected.id}`)}
              title={inPortal ? undefined : 'Open client profile'}
            >
              <div className="h-10 w-10 rounded-full bg-primary/15 flex items-center justify-center"><UserSearch className="h-5 w-5 text-primary" /></div>
              <div>
                <p className="font-medium text-foreground group-hover:text-primary group-hover:underline">{clientFullName(selected)}</p>
                <p className="text-xs text-muted-foreground">
                  {[selected.phone, selected.email, selected.city].filter(Boolean).join(' · ') || 'No contact info'}
                  {selected.service_category ? ` · ${SERVICE_CATEGORY_OPTIONS.find(o => o.value === selected.service_category)?.label || selected.service_category}` : ''}
                  {selected.assigned_worker ? ` · Worker: ${selected.assigned_worker}` : ''}
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={openEdit}><Pencil className="h-3.5 w-3.5" /> Edit Client Info</Button>
              <Button variant="ghost" size="sm" onClick={() => setSelected(null)}><RotateCcw className="h-3.5 w-3.5" /> Change client</Button>
              <Button size="sm" onClick={() => setDialogOpen(true)}>
                {activeType.key === 'grab_and_go' ? 'Log resources' : 'Complete visit'} <ArrowRight className="h-3.5 w-3.5" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {includeGrabAndGo && (
        <GrabAndGoDialog
          open={dialogOpen && action === 'grab_and_go'}
          onOpenChange={setDialogOpen}
          client={selected}
          onSaved={finishVisit}
        />
      )}
      <CaseworkVisitDialog
        open={dialogOpen && (action === 'drop_in_casework' || action === 'scheduled')}
        onOpenChange={setDialogOpen}
        client={selected}
        mode={action}
        onSaved={finishVisit}
      />

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Edit Client Info</DialogTitle></DialogHeader>
          <ClientFormCore form={editForm} update={updateEdit} clients={sortedClients} />
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" onClick={() => setEditOpen(false)}>Cancel</Button>
            <Button onClick={handleEditSave} disabled={saving}>Save</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}