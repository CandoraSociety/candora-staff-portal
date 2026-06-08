import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { base44 } from '@/api/base44Client';
import { Plus } from 'lucide-react';

const STREAM_OPTIONS = [
  { value: 'pathways', label: 'Pathways' },
  { value: 'direct_to_employment', label: 'Direct to Employment' },
  { value: 'casual', label: 'Casual' },
  { value: 'external_referral', label: 'External Referral' },
  { value: 'internal_referral', label: 'Internal Referral' },
  { value: 'not_eligible', label: 'Not Eligible' },
];

const REASON_OPTIONS = [
  { value: 'client_request', label: 'Client Request' },
  { value: 'better_fit', label: 'Better Program Fit' },
  { value: 'employment_outcome', label: 'Employment Outcome' },
  { value: 'barrier_resolution', label: 'Barrier Resolution' },
  { value: 'other', label: 'Other' },
];

export default function ClientStreamSwitches({ client, onSave }) {
  const [switches, setSwitches] = useState(client?.program_stream_switches || []);
  const [showDialog, setShowDialog] = useState(false);
  const [newSwitch, setNewSwitch] = useState({
    from_stream: client?.service_type || '',
    to_stream: '',
    reason: '',
    reason_other: '',
    date: new Date().toISOString().split('T')[0],
    notes: '',
  });

  const handleAddSwitch = async () => {
    try {
      const updatedSwitches = [...switches, newSwitch];
      await onSave({
        program_stream_switches: updatedSwitches,
        service_type: newSwitch.to_stream,
      });
      setSwitches(updatedSwitches);
      setShowDialog(false);
      setNewSwitch({
        from_stream: newSwitch.to_stream,
        to_stream: '',
        reason: '',
        reason_other: '',
        date: new Date().toISOString().split('T')[0],
        notes: '',
      });
      toast.success('Stream switch logged');
    } catch (error) {
      toast.error('Failed to add stream switch');
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold">Program Stream History</h3>
          <p className="text-sm text-muted-foreground">Current stream: <Badge>{client?.service_type}</Badge></p>
        </div>
        <Dialog open={showDialog} onOpenChange={setShowDialog}>
          <DialogTrigger asChild>
            <Button size="sm">
              <Plus className="w-4 h-4 mr-2" />
              Add Switch
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Log Program Stream Switch</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>From Stream</Label>
                  <Select value={newSwitch.from_stream} onValueChange={(v) => setNewSwitch(prev => ({ ...prev, from_stream: v }))}>
                    <SelectTrigger className="mt-2">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {STREAM_OPTIONS.map(opt => (
                        <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>To Stream</Label>
                  <Select value={newSwitch.to_stream} onValueChange={(v) => setNewSwitch(prev => ({ ...prev, to_stream: v }))}>
                    <SelectTrigger className="mt-2">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {STREAM_OPTIONS.map(opt => (
                        <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label>Reason</Label>
                <Select value={newSwitch.reason} onValueChange={(v) => setNewSwitch(prev => ({ ...prev, reason: v }))}>
                  <SelectTrigger className="mt-2">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {REASON_OPTIONS.map(opt => (
                      <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {newSwitch.reason === 'other' && (
                <div>
                  <Label>Reason (Other)</Label>
                  <Input
                    value={newSwitch.reason_other}
                    onChange={(e) => setNewSwitch(prev => ({ ...prev, reason_other: e.target.value }))}
                    className="mt-2"
                  />
                </div>
              )}

              <div>
                <Label>Date</Label>
                <Input
                  type="date"
                  value={newSwitch.date}
                  onChange={(e) => setNewSwitch(prev => ({ ...prev, date: e.target.value }))}
                  className="mt-2"
                />
              </div>

              <div>
                <Label>Notes</Label>
                <Textarea
                  value={newSwitch.notes}
                  onChange={(e) => setNewSwitch(prev => ({ ...prev, notes: e.target.value }))}
                  rows={3}
                  className="mt-2"
                />
              </div>

              <div className="flex gap-2">
                <Button onClick={handleAddSwitch} className="flex-1">Add Switch</Button>
                <Button variant="outline" onClick={() => setShowDialog(false)}>Cancel</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {switches.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            No stream switches recorded
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {switches.map((sw, i) => (
            <Card key={i}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Badge variant="outline">{sw.from_stream}</Badge>
                    <span className="text-muted-foreground">→</span>
                    <Badge>{sw.to_stream}</Badge>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {sw.date}
                  </div>
                </div>
                <div className="mt-2 text-sm">
                  <span className="font-medium">Reason:</span> {sw.reason}{sw.reason_other && ` - ${sw.reason_other}`}
                </div>
                {sw.notes && (
                  <div className="mt-1 text-sm text-muted-foreground">
                    {sw.notes}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}