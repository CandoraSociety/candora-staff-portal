import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { AlertCircle, Shield, Lock, Save } from 'lucide-react';
import { toast } from 'sonner';

const BARRIER_STATUS = [
  { value: 'unresolved', label: 'Unresolved' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'resolved', label: 'Resolved' },
];

const BARRIER_FIELDS = ['status', 'notes', 'action_steps', 'challenges', 'timeline_start', 'timeline_end', 'responsible', 'resources'];

function buildLocal(client) {
  const obj = {};
  for (let n = 1; n <= 3; n++) {
    obj[n] = {
      name: client[`barrier_${n}`] || '',
      status: client[`barrier_${n}_status`] || 'unresolved',
      notes: client[`barrier_${n}_notes`] || '',
      action_steps: client[`barrier_${n}_action_steps`] || '',
      challenges: client[`barrier_${n}_challenges`] || '',
      timeline_start: client[`barrier_${n}_timeline_start`] || '',
      timeline_end: client[`barrier_${n}_timeline_end`] || '',
      responsible: client[`barrier_${n}_responsible`] || '',
      resources: client[`barrier_${n}_resources`] || '',
    };
  }
  return obj;
}

export default function BarriersTab({ client, onSave, canEdit }) {
  const [saving, setSaving] = useState(false);
  const [local, setLocal] = useState(() => buildLocal(client));

  // Sync local state when underlying client barrier fields change (e.g. after save or external edit)
  const sig = useMemo(() => JSON.stringify(
    [1, 2, 3].flatMap(n => [client[`barrier_${n}`], ...BARRIER_FIELDS.map(f => client[`barrier_${n}_${f}`])])
  ), [client]);
  useEffect(() => { setLocal(buildLocal(client)); }, [sig]);

  const identified = [1, 2, 3].filter(n => local[n].name);

  const setField = (n, field, val) => setLocal(prev => ({ ...prev, [n]: { ...prev[n], [field]: val } }));

  const handleSave = async () => {
    setSaving(true);
    try {
      const data = {};
      for (let n = 1; n <= 3; n++) {
        BARRIER_FIELDS.forEach(f => { data[`barrier_${n}_${f}`] = local[n][f]; });
      }
      await onSave(data);
      toast.success('Barriers updated');
    } catch (e) {
      toast.error('Failed to save barriers');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <Shield className="w-5 h-5 text-amber-500" />
          <h3 className="text-base font-semibold">Barriers</h3>
        </div>
        <div className="flex items-center gap-2">
          {!canEdit && (
            <span className="flex items-center gap-1 text-xs text-slate-400">
              <Lock className="w-3 h-3" /> View only — only the assigned Service Navigator can edit
            </span>
          )}
          {canEdit && (
            <Button size="sm" onClick={handleSave} disabled={saving}>
              <Save className="w-4 h-4 mr-1" />
              {saving ? 'Saving...' : 'Save Barriers'}
            </Button>
          )}
        </div>
      </div>

      {identified.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-muted-foreground gap-2">
          <AlertCircle className="w-8 h-8 opacity-30" />
          <p className="text-sm">No barriers have been identified for this client yet.</p>
          <p className="text-xs">Barriers are identified during the assessment (BIT).</p>
        </div>
      ) : (
        <div className="space-y-3">
          {identified.map(n => {
            const b = local[n];
            const statusColor = b.status === 'resolved' ? 'border-green-300 bg-green-50'
              : b.status === 'in_progress' ? 'border-blue-300 bg-blue-50'
              : 'border-amber-200 bg-amber-50';
            return (
              <Card key={n} className={statusColor}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <span className="text-amber-600 font-bold">Barrier {n}:</span>
                    <span>{b.name}</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <Label className="text-xs">Status</Label>
                      <Select value={b.status} onValueChange={v => canEdit && setField(n, 'status', v)} disabled={!canEdit}>
                        <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {BARRIER_STATUS.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label className="text-xs">Responsible</Label>
                      <Input value={b.responsible} onChange={e => setField(n, 'responsible', e.target.value)} disabled={!canEdit} className="mt-1" />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <Label className="text-xs">Start Date</Label>
                      <Input type="date" value={b.timeline_start} onChange={e => setField(n, 'timeline_start', e.target.value)} disabled={!canEdit} className="mt-1" />
                    </div>
                    <div>
                      <Label className="text-xs">End Date</Label>
                      <Input type="date" value={b.timeline_end} onChange={e => setField(n, 'timeline_end', e.target.value)} disabled={!canEdit} className="mt-1" />
                    </div>
                  </div>
                  <div>
                    <Label className="text-xs">Action Steps</Label>
                    <Textarea value={b.action_steps} onChange={e => setField(n, 'action_steps', e.target.value)} disabled={!canEdit} rows={2} className="mt-1" />
                  </div>
                  <div>
                    <Label className="text-xs">Challenges</Label>
                    <Textarea value={b.challenges} onChange={e => setField(n, 'challenges', e.target.value)} disabled={!canEdit} rows={2} className="mt-1" />
                  </div>
                  <div>
                    <Label className="text-xs">Resources</Label>
                    <Input value={b.resources} onChange={e => setField(n, 'resources', e.target.value)} disabled={!canEdit} className="mt-1" />
                  </div>
                  <div>
                    <Label className="text-xs">Notes</Label>
                    <Textarea value={b.notes} onChange={e => setField(n, 'notes', e.target.value)} disabled={!canEdit} rows={2} className="mt-1" />
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}