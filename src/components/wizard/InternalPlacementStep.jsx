import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { CheckCircle2, Clock, ChevronRight } from 'lucide-react';
import { toast } from 'sonner';
import { base44 } from '@/api/base44Client';

const PLACEMENT_TYPES = [
  { value: 'cleaning_arc',           label: 'Cleaning (ARC)' },
  { value: 'food_services_onsite',   label: 'Food Services (Onsite)' },
  { value: 'food_services_offsite',  label: 'Food Services (Offsite)' },
  { value: 'reception',              label: 'Reception' },
  { value: 'childcare',              label: 'Childcare' },
];

export default function InternalPlacementStep({ client, onSave, onComplete }) {
  const emailSent = !!client?.placement_request_sent;
  const [editing, setEditing] = useState(!emailSent);
  const [saving, setSaving] = useState(false);
  const [sending, setSending] = useState(false);
  const [requestSent, setRequestSent] = useState(emailSent);

  const [form, setForm] = useState({
    internal_placement: client?.internal_placement || 'none',
    internal_placement_details: client?.internal_placement_details || '',
    placement_start_date: client?.placement_start_date || '',
    placement_end_date: client?.placement_end_date || '',
    placement_supervisor: client?.placement_supervisor || '',
    placement_schedule: client?.placement_schedule || '',
    paid_external_placement: client?.paid_external_placement || false,
    external_employer: client?.external_employer || false,
    employer_name: client?.employer_name || '',
  });

  const update = (field, value) => setForm(p => ({ ...p, [field]: value }));

  const handleSave = async () => {
    setSaving(true);
    try {
      await onSave({ ...form });
      toast.success('Placement details saved');
    } catch (error) {
      toast.error('Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const handleSendRequest = async () => {
    setSending(true);
    try {
      await base44.functions.invoke('sendAlertEmail', {
        alert_type: 'internal_placement',
        client_name: `${client.first_name} ${client.last_name}`,
        client_id: client.id,
        placement: form.internal_placement,
        details: form.internal_placement_details,
        start_date: form.placement_start_date,
        supervisor: form.placement_supervisor,
      });
      await onSave({ ...form, placement_request_sent: true });
      setRequestSent(true);
      setEditing(false);
      toast.success('Placement request sent');
    } catch (error) {
      toast.error('Failed to send request');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Status banner */}
      <div className={`flex items-center gap-2 p-3 rounded-lg text-sm font-medium ${requestSent ? 'bg-green-50 text-green-700' : 'bg-amber-50 text-amber-700'}`}>
        {requestSent
          ? <><CheckCircle2 className="w-4 h-4" /> Placement Request Sent</>
          : <><Clock className="w-4 h-4" /> Placement Request Not Yet Sent</>
        }
        {requestSent && (
          <Button variant="ghost" size="sm" className="ml-auto h-6 text-xs" onClick={() => setEditing(true)}>Edit</Button>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Internal Placement</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label className="text-xs font-semibold">Placement Type</Label>
            <Select value={form.internal_placement} onValueChange={(v) => update('internal_placement', v)} disabled={!editing}>
              <SelectTrigger className="mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No Placement</SelectItem>
                {PLACEMENT_TYPES.map(t => (
                  <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {form.internal_placement && form.internal_placement !== 'none' && (
            <>
              <div>
                <Label className="text-xs font-semibold">Details</Label>
                <Textarea value={form.internal_placement_details} onChange={e => update('internal_placement_details', e.target.value)} rows={2} className="mt-1 text-sm" disabled={!editing} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs font-semibold">Start Date</Label>
                  <Input type="date" value={form.placement_start_date} onChange={e => update('placement_start_date', e.target.value)} className="mt-1" disabled={!editing} />
                </div>
                <div>
                  <Label className="text-xs font-semibold">End Date</Label>
                  <Input type="date" value={form.placement_end_date} onChange={e => update('placement_end_date', e.target.value)} className="mt-1" disabled={!editing} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs font-semibold">Supervisor</Label>
                  <Input value={form.placement_supervisor} onChange={e => update('placement_supervisor', e.target.value)} className="mt-1" disabled={!editing} />
                </div>
                <div>
                  <Label className="text-xs font-semibold">Schedule</Label>
                  <Input value={form.placement_schedule} onChange={e => update('placement_schedule', e.target.value)} className="mt-1" placeholder="e.g. Mon-Fri, 9am-3pm" disabled={!editing} />
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">External Placement</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <Label className="text-sm">External Employer</Label>
            <Switch checked={form.external_employer} onCheckedChange={v => update('external_employer', v)} disabled={!editing} />
          </div>
          {form.external_employer && (
            <div>
              <Label className="text-xs font-semibold">Employer Name</Label>
              <Input value={form.employer_name} onChange={e => update('employer_name', e.target.value)} className="mt-1" disabled={!editing} />
            </div>
          )}
          <div className="flex items-center justify-between">
            <Label className="text-sm">Paid External Placement</Label>
            <Switch checked={form.paid_external_placement} onCheckedChange={v => update('paid_external_placement', v)} disabled={!editing} />
          </div>
        </CardContent>
      </Card>

      {editing && (
        <div className="flex gap-3">
          <Button variant="outline" onClick={handleSave} disabled={saving}>
            {saving ? 'Saving...' : 'Save Details'}
          </Button>
          {!requestSent && form.internal_placement && form.internal_placement !== 'none' && (
            <Button onClick={handleSendRequest} disabled={sending}>
              {sending ? 'Sending...' : 'Send Request'}
            </Button>
          )}
        </div>
      )}

      {requestSent && !editing && (
        <Button className="w-full" onClick={() => onComplete?.()}>
          Continue to Next Step <ChevronRight className="w-4 h-4 ml-1" />
        </Button>
      )}
    </div>
  );
}