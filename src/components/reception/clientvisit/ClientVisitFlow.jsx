import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { UserSearch, UserPlus, ShoppingBasket, HandHelping, CalendarCheck, Pencil, RotateCcw, FlaskConical } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import ClientFormCore from '@/components/rc/ClientFormCore';
import { SERVICE_CATEGORY_OPTIONS } from '@/components/rc/ClientFormCore';
import { generateTestClientName } from '@/lib/rcTestClients';
import GrabAndGoDialog from '@/components/reception/clientvisit/GrabAndGoDialog';
import CaseworkVisitDialog from '@/components/reception/clientvisit/CaseworkVisitDialog';
import { todayStr, clientFullName } from '@/lib/rcClientVisits';

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
export default function ClientVisitFlow({ includeGrabAndGo = true }) {
  const { toast } = useToast();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [selected, setSelected] = useState(null);
  const [showCreate, setShowCreate] = useState(false);
  const [createForm, setCreateForm] = useState({ ...EMPTY_FORM });
  const [saving, setSaving] = useState(false);
  const [grabGoOpen, setGrabGoOpen] = useState(false);
  const [caseworkMode, setCaseworkMode] = useState(null); // 'drop_in_casework' | 'scheduled'
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

  const updateCreate = (field, value) => setCreateForm(prev => ({ ...prev, [field]: value }));
  const updateEdit = (field, value) => setEditForm(prev => ({ ...prev, [field]: value }));

  const refreshClient = async () => {
    queryClient.invalidateQueries({ queryKey: ['reception-visit-clients'] });
    if (selected) {
      try {
        const fresh = await base44.entities.RCClient.get(selected.id);
        setSelected(fresh);
      } catch { /* client list refresh is enough */ }
    }
  };

  const handleCreate = async () => {
    if (!createForm.first_name || !createForm.last_name) { toast({ title: 'First and last name are required', variant: 'destructive' }); return; }
    setSaving(true);
    try {
      const created = await base44.entities.RCClient.create({ ...createForm, case_status: 'intake', intake_date: todayStr() });
      toast({ title: 'Client profile created', description: clientFullName(created) });
      setSelected(created);
      setCreateForm({ ...EMPTY_FORM });
      setShowCreate(false);
      queryClient.invalidateQueries({ queryKey: ['reception-visit-clients'] });
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
      setSelected(created);
      queryClient.invalidateQueries({ queryKey: ['reception-visit-clients'] });
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

  const OPTIONS = [
    ...(includeGrabAndGo ? [{
      key: 'grab_and_go', label: 'Grab and Go Resources',
      description: 'Bus tickets, emergency food, supplies and other quick resources',
      icon: ShoppingBasket, action: () => setGrabGoOpen(true),
    }] : []),
    { key: 'drop_in_casework', label: 'Drop-In Casework', description: 'Complete intake information and route the visit to the assigned caseworker', icon: HandHelping, action: () => setCaseworkMode('drop_in_casework') },
    { key: 'scheduled', label: 'Scheduled Visit', description: 'Casework visit auto-assigned from the client\'s appointment schedule', icon: CalendarCheck, action: () => setCaseworkMode('scheduled') },
  ];

  return (
    <div className="space-y-4 max-w-3xl mx-auto">
      <div>
        <h1 className="text-2xl font-heading font-bold text-foreground">Client Visit</h1>
        <p className="text-muted-foreground text-sm mt-1">
          {includeGrabAndGo
            ? 'Select a client, then log a grab-and-go resource, drop-in casework or scheduled visit'
            : 'Select a client, then log a drop-in casework or scheduled visit'}
        </p>
      </div>

      {!selected && !showCreate && (
        <Card>
          <CardContent className="p-5 space-y-4">
            <div className="space-y-1.5">
              <Label>Client search</Label>
              <Select onValueChange={(id) => setSelected(clients.find(c => c.id === id))}>
                <SelectTrigger><SelectValue placeholder={isLoading ? 'Loading clients...' : 'Select a client from the database...'} /></SelectTrigger>
                <SelectContent>
                  {sortedClients.map(c => (
                    <SelectItem key={c.id} value={c.id}>
                      {clientFullName(c)}{c.phone ? ` · ${c.phone}` : ''}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-2 pt-1">
              <p className="text-xs text-muted-foreground flex-1">Client doesn't have an existing profile?</p>
              <Button variant="outline" size="sm" onClick={handleCreateTestClient} disabled={creatingTest}><FlaskConical className="h-4 w-4" /> {creatingTest ? 'Creating...' : 'Create Test Client'}</Button>
              <Button variant="outline" size="sm" onClick={() => setShowCreate(true)}><UserPlus className="h-4 w-4" /> Create Client Profile</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {showCreate && !selected && (
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-3">
              <p className="font-heading font-bold text-foreground">New Client Profile</p>
              <Button variant="ghost" size="sm" onClick={() => { setShowCreate(false); setCreateForm({ ...EMPTY_FORM }); }}><RotateCcw className="h-4 w-4" /> Back to search</Button>
            </div>
            <ClientFormCore form={createForm} update={updateCreate} clients={sortedClients} compact />
            <div className="flex justify-end gap-2 mt-4">
              <Button variant="outline" onClick={() => { setShowCreate(false); setCreateForm({ ...EMPTY_FORM }); }}>Cancel</Button>
              <Button onClick={handleCreate} disabled={saving}>{saving ? 'Saving...' : 'Create Profile'}</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {selected && (
        <>
          <Card>
            <CardContent className="p-4 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3 cursor-pointer group" onClick={() => navigate(`/rc/clients/${selected.id}`)} title="Open client profile">
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
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {OPTIONS.map(opt => { const Icon = opt.icon; return (
              <button key={opt.key} onClick={opt.action} className="text-left">
                <Card className="h-full hover:shadow-md transition-shadow hover:border-primary/40">
                  <CardContent className="p-4">
                    <Icon className="h-6 w-6 text-primary mb-2" />
                    <p className="text-sm font-medium text-foreground">{opt.label}</p>
                    <p className="text-xs text-muted-foreground mt-1">{opt.description}</p>
                  </CardContent>
                </Card>
              </button>
            ); })}
          </div>
        </>
      )}

      {includeGrabAndGo && (
        <GrabAndGoDialog open={grabGoOpen} onOpenChange={setGrabGoOpen} client={selected} onSaved={refreshClient} />
      )}
      <CaseworkVisitDialog open={!!caseworkMode} onOpenChange={(o) => !o && setCaseworkMode(null)} client={selected} mode={caseworkMode} onSaved={refreshClient} />

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Edit Client Info</DialogTitle></DialogHeader>
          <ClientFormCore form={editForm} update={updateEdit} clients={sortedClients} />
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" onClick={() => setEditOpen(false)}>Cancel</Button>
            <Button onClick={handleEditSave} disabled={saving}>{saving ? 'Saving...' : 'Save'}</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}