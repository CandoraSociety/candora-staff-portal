import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Plus, Pencil, Trash2, Building2, User, Calendar, ClipboardList } from 'lucide-react';
import { toast } from 'sonner';
import { base44 } from '@/api/base44Client';
import { format } from 'date-fns';

const PLACEMENT_TYPE_LABELS = {
  cleaning_arc: 'Cleaning ARC',
  food_services_onsite: 'Food Services (Onsite)',
  food_services_offsite: 'Food Services (Offsite)',
  reception: 'Reception/Admin',
  childcare: 'Childcare',
  program_support: 'Program Support',
  security: 'Security',
};

const STATUS_LABELS = {
  referred: 'Referred',
  active: 'Active',
  completed: 'Completed',
  withdrawn: 'Withdrawn',
  cancelled: 'Cancelled',
};

const STATUS_BADGE = {
  referred: 'bg-amber-100 text-amber-800',
  active: 'bg-blue-100 text-blue-800',
  completed: 'bg-green-100 text-green-800',
  withdrawn: 'bg-slate-100 text-slate-600',
  cancelled: 'bg-red-100 text-red-800',
};

const fmtDate = (d) => {
  if (!d) return '—';
  try { return format(new Date(d), 'MMM d, yy'); } catch { return '—'; }
};

function PlacementForm({ client, existing, onDone, onCancel }) {
  const [rec, setRec] = useState(existing || {
    placement_type: 'cleaning_arc',
    supervisor_name: '',
    supervisor_email: '',
    referral_date: '',
    start_date: '',
    expected_end_date: '',
    status: 'referred',
    training_goals: '',
    referral_notes: '',
  });
  const [saving, setSaving] = useState(false);

  const update = (f, v) => setRec(p => ({ ...p, [f]: v }));

  const handleSave = async () => {
    if (!rec.placement_type) {
      toast.error('Placement type is required');
      return;
    }
    setSaving(true);
    try {
      const data = {
        ...rec,
        client_id: client.id,
        client_name: `${client.first_name} ${client.last_name}`,
        assigned_worker: client.assigned_worker,
        assigned_worker_name: client.assigned_worker_name,
      };
      if (existing) {
        await base44.entities.InternalTraining.update(existing.id, data);
      } else {
        await base44.entities.InternalTraining.create(data);
      }
      toast.success(existing ? 'Internal placement updated' : 'Internal placement added');
      onDone();
    } catch { toast.error('Failed to save'); }
    finally { setSaving(false); }
  };

  return (
    <Dialog open onOpenChange={(o) => !o && onCancel()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{existing ? 'Edit Internal Placement' : 'Add Internal Placement'}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <Label className="text-xs">Placement Type *</Label>
            <Select value={rec.placement_type} onValueChange={v => update('placement_type', v)}>
              <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
              <SelectContent>
                {Object.entries(PLACEMENT_TYPE_LABELS).map(([v, l]) => <SelectItem key={v} value={v}>{l}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">Supervisor Name</Label>
              <Input value={rec.supervisor_name} onChange={e => update('supervisor_name', e.target.value)} className="mt-1" placeholder="e.g. Maria Lopez" />
            </div>
            <div>
              <Label className="text-xs">Supervisor Email</Label>
              <Input value={rec.supervisor_email} onChange={e => update('supervisor_email', e.target.value)} className="mt-1" placeholder="e.g. maria@candora.ca" />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <Label className="text-xs">Referral Date</Label>
              <Input type="date" value={rec.referral_date} onChange={e => update('referral_date', e.target.value)} className="mt-1" />
            </div>
            <div>
              <Label className="text-xs">Start Date</Label>
              <Input type="date" value={rec.start_date} onChange={e => update('start_date', e.target.value)} className="mt-1" />
            </div>
            <div>
              <Label className="text-xs">Expected End</Label>
              <Input type="date" value={rec.expected_end_date} onChange={e => update('expected_end_date', e.target.value)} className="mt-1" />
            </div>
          </div>
          <div>
            <Label className="text-xs">Status</Label>
            <Select value={rec.status} onValueChange={v => update('status', v)}>
              <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
              <SelectContent>
                {Object.entries(STATUS_LABELS).map(([v, l]) => <SelectItem key={v} value={v}>{l}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs">Training Goals</Label>
            <Textarea value={rec.training_goals} onChange={e => update('training_goals', e.target.value)} rows={2} className="mt-1 text-xs" placeholder="What the client is working toward in this placement" />
          </div>
          <div>
            <Label className="text-xs">Notes</Label>
            <Textarea value={rec.referral_notes} onChange={e => update('referral_notes', e.target.value)} rows={2} className="mt-1 text-xs" />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" size="sm" onClick={onCancel}>Cancel</Button>
          <Button size="sm" onClick={handleSave} disabled={saving}>{saving ? 'Saving...' : 'Save Placement'}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function PlacementCard({ placement, onEdit, onDelete }) {
  return (
    <Card>
      <CardContent className="p-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0 space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <Building2 className="w-4 h-4 text-slate-400 shrink-0" />
              <span className="font-semibold text-sm truncate">{PLACEMENT_TYPE_LABELS[placement.placement_type] || placement.placement_type}</span>
              <Badge className={`text-xs ${STATUS_BADGE[placement.status] || ''}`}>{STATUS_LABELS[placement.status] || placement.status}</Badge>
            </div>
            <div className="flex flex-wrap gap-x-4 gap-y-0.5 text-xs text-muted-foreground ml-6">
              {placement.supervisor_name && (
                <span className="flex items-center gap-1"><User className="w-3 h-3" />{placement.supervisor_name}</span>
              )}
              {placement.start_date && (
                <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{fmtDate(placement.start_date)}{placement.expected_end_date ? ` – ${fmtDate(placement.expected_end_date)}` : ''}</span>
              )}
            </div>
            {placement.training_goals && (
              <div className="flex items-start gap-1 text-xs text-slate-600 ml-6">
                <ClipboardList className="w-3 h-3 mt-0.5 shrink-0" />
                <span className="line-clamp-2">{placement.training_goals}</span>
              </div>
            )}
            {placement.referral_notes && <div className="text-xs text-slate-500 ml-6 mt-1">{placement.referral_notes}</div>}
          </div>
          <div className="flex gap-1 shrink-0">
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onEdit}>
              <Pencil className="w-3.5 h-3.5" />
            </Button>
            <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive" onClick={onDelete}>
              <Trash2 className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function InternalPlacementsTab({ client, onPlacementsChange }) {
  const [placements, setPlacements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingPlacement, setEditingPlacement] = useState(null);

  const fetchPlacements = async () => {
    setLoading(true);
    try {
      const recs = await base44.entities.InternalTraining.filter({ client_id: client.id }, '-created_date');
      setPlacements(recs);
    } catch { toast.error('Failed to load placements'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchPlacements(); }, [client.id]);

  const handleDone = async () => {
    setShowForm(false);
    setEditingPlacement(null);
    await fetchPlacements();
    onPlacementsChange?.();
  };

  const handleDelete = async (placement) => {
    if (!confirm(`Delete this internal placement (${PLACEMENT_TYPE_LABELS[placement.placement_type] || placement.placement_type})?`)) return;
    try {
      await base44.entities.InternalTraining.delete(placement.id);
      toast.success('Placement deleted');
      fetchPlacements();
      onPlacementsChange?.();
    } catch { toast.error('Failed to delete'); }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-semibold text-sm flex items-center gap-2">
            <Building2 className="w-4 h-4 text-emerald-600" />
            Internal Placements
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            Track internal training placements (Cleaning ARC, Food Services, Reception, Childcare) for this client.
          </p>
        </div>
        <Button size="sm" onClick={() => { setEditingPlacement(null); setShowForm(true); }}>
          <Plus className="w-4 h-4 mr-1" /> Add Internal Placement
        </Button>
      </div>

      {showForm && !editingPlacement && (
        <PlacementForm client={client} onDone={handleDone} onCancel={() => setShowForm(false)} />
      )}
      {editingPlacement && (
        <PlacementForm client={client} existing={editingPlacement} onDone={handleDone} onCancel={() => setEditingPlacement(null)} />
      )}

      {loading ? (
        <div className="text-center py-6 text-muted-foreground text-sm">Loading...</div>
      ) : placements.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground text-sm">
            No internal placements yet. Click "Add Internal Placement" to get started.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {placements.map(p => (
            <PlacementCard
              key={p.id}
              placement={p}
              onEdit={() => { setEditingPlacement(p); setShowForm(false); }}
              onDelete={() => handleDelete(p)}
            />
          ))}
        </div>
      )}
    </div>
  );
}