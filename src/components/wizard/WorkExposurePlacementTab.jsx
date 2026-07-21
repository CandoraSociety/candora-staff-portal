import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Plus, Pencil, Trash2, Briefcase, MapPin, Clock, Calendar, DollarSign } from 'lucide-react';
import { toast } from 'sonner';
import { base44 } from '@/api/base44Client';
import { format } from 'date-fns';

function deriveBillingMonth(dateStr) {
  if (!dateStr) return format(new Date(), 'yyyy-MM');
  try { return format(new Date(dateStr), 'yyyy-MM'); } catch { return format(new Date(), 'yyyy-MM'); }
}

const STATUS_LABELS = {
  pending: 'Pending',
  in_progress: 'In Progress',
  completed: 'Completed',
};
const STATUS_BADGE = {
  pending: 'bg-amber-100 text-amber-800',
  in_progress: 'bg-blue-100 text-blue-800',
  completed: 'bg-green-100 text-green-800',
};

const fmtDate = (d) => {
  if (!d) return '—';
  try { return format(new Date(d), 'MMM d, yy'); } catch { return '—'; }
};

function PlacementForm({ client, existing, onDone, onCancel }) {
  const [rec, setRec] = useState(existing || {
    business_name: '',
    location: '',
    position_type: '',
    expected_hours_per_week: '',
    hours_worked: '',
    hourly_rate: 15,
    start_date: '',
    anticipated_completion_date: '',
    status: 'pending',
    notes: '',
  });
  const [saving, setSaving] = useState(false);

  const update = (f, v) => setRec(p => ({ ...p, [f]: v }));

  const handleSave = async () => {
    if (!rec.business_name.trim()) {
      toast.error('Business name is required');
      return;
    }
    setSaving(true);
    try {
      const data = {
        ...rec,
        expected_hours_per_week: parseFloat(rec.expected_hours_per_week) || 0,
        hours_worked: parseFloat(rec.hours_worked) || 0,
        hourly_rate: parseFloat(rec.hourly_rate) || 15,
        client_id: client.id,
        client_name: `${client.first_name} ${client.last_name}`,
        assigned_worker: client.assigned_worker,
        assigned_worker_name: client.assigned_worker_name,
      };
      let placementId;
      if (existing) {
        await base44.entities.WorkExposurePlacement.update(existing.id, data);
        placementId = existing.id;
      } else {
        const created = await base44.entities.WorkExposurePlacement.create(data);
        placementId = created.id;
      }

      // Sync linked FinancialRecord for payables tracking
      const linkedRecords = await base44.entities.FinancialRecord.filter({
        client_id: client.id,
        linked_placement_id: placementId,
      });
      const hoursWorked = parseFloat(rec.hours_worked) || 0;
      const hourlyRate = parseFloat(rec.hourly_rate) || 15;
      const calculatedAmount = hoursWorked * hourlyRate;
      const frData = {
        record_type: 'paid_external_placement',
        client_id: client.id,
        client_name: `${client.first_name} ${client.last_name}`,
        assigned_worker: client.assigned_worker,
        vendor: rec.business_name,
        description: rec.position_type ? `Work Exposure: ${rec.position_type}` : 'Work Exposure Placement',
        date: rec.start_date || '',
        work_end_date: rec.anticipated_completion_date || '',
        billing_month: deriveBillingMonth(rec.start_date),
        completion_status: rec.status === 'completed' ? 'completed' : rec.status === 'in_progress' ? 'in_progress' : 'not_started',
        linked_placement_id: placementId,
        hours_worked: hoursWorked,
        hourly_rate: hourlyRate,
        amount: calculatedAmount,
        tax: 0,
        total: calculatedAmount,
        notes: rec.notes || '',
      };
      if (linkedRecords.length > 0) {
        await base44.entities.FinancialRecord.update(linkedRecords[0].id, frData);
      } else {
        await base44.entities.FinancialRecord.create(frData);
      }

      toast.success(existing ? 'Placement updated' : 'Work exposure placement added');
      onDone();
    } catch { toast.error('Failed to save'); }
    finally { setSaving(false); }
  };

  return (
    <Dialog open onOpenChange={(o) => !o && onCancel()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{existing ? 'Edit Work Exposure Placement' : 'Add Work Exposure Placement'}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <Label className="text-xs">Business Name *</Label>
            <Input value={rec.business_name} onChange={e => update('business_name', e.target.value)} className="mt-1" placeholder="e.g. ABC Manufacturing" />
          </div>
          <div>
            <Label className="text-xs">Location</Label>
            <Input value={rec.location} onChange={e => update('location', e.target.value)} className="mt-1" placeholder="Address or area" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">Position Type</Label>
              <Input value={rec.position_type} onChange={e => update('position_type', e.target.value)} className="mt-1" placeholder="e.g. Warehouse Associate" />
            </div>
            <div>
              <Label className="text-xs">Expected Hours / Week</Label>
              <Input type="number" step="0.5" value={rec.expected_hours_per_week} onChange={e => update('expected_hours_per_week', e.target.value)} className="mt-1" placeholder="e.g. 30" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">Work Start Date</Label>
              <Input type="date" value={rec.start_date} onChange={e => update('start_date', e.target.value)} className="mt-1" />
            </div>
            <div>
              <Label className="text-xs">Work End Date</Label>
              <Input type="date" value={rec.anticipated_completion_date} onChange={e => update('anticipated_completion_date', e.target.value)} className="mt-1" />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <Label className="text-xs">Hours Worked</Label>
              <Input type="number" step="0.5" min="0" value={rec.hours_worked} onChange={e => update('hours_worked', e.target.value)} className="mt-1" placeholder="e.g. 120" />
            </div>
            <div>
              <Label className="text-xs">Hourly Rate ($)</Label>
              <Input type="number" step="0.25" min="0" value={rec.hourly_rate} onChange={e => update('hourly_rate', e.target.value)} className="mt-1" />
            </div>
            <div>
              <Label className="text-xs">Calculated Total</Label>
              <div className="mt-1 h-9 flex items-center px-3 rounded-md bg-slate-100 text-sm font-semibold text-slate-700">
                ${((parseFloat(rec.hours_worked) || 0) * (parseFloat(rec.hourly_rate) || 0)).toFixed(2)}
              </div>
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
            <Label className="text-xs">Notes</Label>
            <Textarea value={rec.notes} onChange={e => update('notes', e.target.value)} rows={2} className="mt-1 text-xs" />
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
              <Briefcase className="w-4 h-4 text-slate-400 shrink-0" />
              <span className="font-semibold text-sm truncate">{placement.business_name}</span>
              <Badge className={`text-xs ${STATUS_BADGE[placement.status] || ''}`}>{STATUS_LABELS[placement.status] || placement.status}</Badge>
            </div>
            {placement.position_type && <div className="text-sm text-slate-600 ml-6">{placement.position_type}</div>}
            <div className="flex flex-wrap gap-x-4 gap-y-0.5 text-xs text-muted-foreground ml-6">
              {placement.location && (
                <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{placement.location}</span>
              )}
              {placement.expected_hours_per_week > 0 && (
                <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{placement.expected_hours_per_week} hrs/week</span>
              )}
              {placement.start_date && (
                <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{fmtDate(placement.start_date)}{placement.anticipated_completion_date ? ` – ${fmtDate(placement.anticipated_completion_date)}` : ''}</span>
              )}
            </div>
            {(placement.hours_worked > 0 || placement.hourly_rate > 0) && (
              <div className="flex flex-wrap gap-x-4 gap-y-0.5 text-xs ml-6">
                {placement.hours_worked > 0 && (
                  <span className="flex items-center gap-1 text-slate-600"><Clock className="w-3 h-3" />{placement.hours_worked} hrs worked</span>
                )}
                {placement.hourly_rate > 0 && (
                  <span className="flex items-center gap-1 text-slate-600"><DollarSign className="w-3 h-3" />{placement.hourly_rate}/hr</span>
                )}
                {placement.hours_worked > 0 && placement.hourly_rate > 0 && (
                  <span className="flex items-center gap-1 font-semibold text-slate-700"><DollarSign className="w-3 h-3" />{((placement.hours_worked || 0) * (placement.hourly_rate || 0)).toFixed(2)} total</span>
                )}
              </div>
            )}
            {placement.notes && <div className="text-xs text-slate-500 ml-6 mt-1">{placement.notes}</div>}
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

export default function WorkExposurePlacementTab({ client, onSave }) {
  const [placements, setPlacements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingPlacement, setEditingPlacement] = useState(null);

  const fetchPlacements = async () => {
    setLoading(true);
    try {
      const recs = await base44.entities.WorkExposurePlacement.filter({ client_id: client.id }, '-created_date');
      setPlacements(recs);
    } catch { toast.error('Failed to load placements'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchPlacements(); }, [client.id]);

  const handleDone = async () => {
    setShowForm(false);
    setEditingPlacement(null);
    await fetchPlacements();
  };

  const handleDelete = async (placement) => {
    if (!confirm(`Delete placement at ${placement.business_name}?`)) return;
    try {
      await base44.entities.WorkExposurePlacement.delete(placement.id);
      // Also delete the linked FinancialRecord (if amount is still 0)
      const linked = await base44.entities.FinancialRecord.filter({
        client_id: client.id,
        linked_placement_id: placement.id,
      });
      for (const fr of linked) {
        if ((fr.total || 0) === 0) {
          await base44.entities.FinancialRecord.delete(fr.id);
        }
      }
      toast.success('Placement deleted');
      fetchPlacements();
    } catch { toast.error('Failed to delete'); }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-semibold text-sm flex items-center gap-2">
            <Briefcase className="w-4 h-4 text-indigo-600" />
            Work Exposure Placements
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            Track external work exposure placements for this client.
          </p>
        </div>
        <Button size="sm" onClick={() => { setEditingPlacement(null); setShowForm(true); }}>
          <Plus className="w-4 h-4 mr-1" /> Add Work Exposure Placement
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
            No work exposure placements yet. Click "Add Work Exposure Placement" to get started.
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