import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { base44 } from '@/api/base44Client';

const PLACEMENT_TYPES = [
  { value: 'cleaning_arc', label: 'Cleaning (ARC)' },
  { value: 'food_services_onsite', label: 'Food Services (Onsite)' },
  { value: 'food_services_offsite', label: 'Food Services (Offsite)' },
  { value: 'reception', label: 'Reception' },
  { value: 'childcare', label: 'Childcare' },
];

export default function InternalPlacementStep({ client, onSave, onComplete }) {
  const [internalPlacement, setInternalPlacement] = useState(client?.internal_placement || 'none');
  const [placementDetails, setPlacementDetails] = useState({
    placement_start_date: client?.placement_start_date || '',
    placement_end_date: client?.placement_end_date || '',
    placement_supervisor: client?.placement_supervisor || '',
    placement_schedule: client?.placement_schedule || '',
    internal_placement_details: client?.internal_placement_details || '',
  });
  const [sending, setSending] = useState(false);

  const handleSave = async () => {
    try {
      await onSave({
        internal_placement: internalPlacement,
        ...placementDetails,
        placement_request_sent: true,
      });
      toast.success('Placement details saved');
      onComplete?.();
    } catch (error) {
      toast.error('Failed to save');
    }
  };

  const handleSendRequest = async () => {
    setSending(true);
    try {
      await base44.functions.invoke('sendAlertEmail', {
        client_id: client.id,
        client_name: `${client.first_name} ${client.last_name}`,
        placement_type: internalPlacement,
        supervisor: placementDetails.placement_supervisor,
        start_date: placementDetails.placement_start_date,
      });
      await onSave({ placement_request_sent: true });
      toast.success('Placement request sent');
    } catch (error) {
      toast.error('Failed to send request');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-sm text-muted-foreground">
        Set up internal placement details for the client.
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Internal Placement</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Placement Type</Label>
            <Select value={internalPlacement} onValueChange={setInternalPlacement}>
              <SelectTrigger className="mt-2">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No Placement</SelectItem>
                {PLACEMENT_TYPES.map(type => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {internalPlacement !== 'none' && (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Start Date</Label>
                  <Input
                    type="date"
                    value={placementDetails.placement_start_date}
                    onChange={(e) => setPlacementDetails(prev => ({ ...prev, placement_start_date: e.target.value }))}
                    className="mt-2"
                  />
                </div>
                <div>
                  <Label>Expected End Date</Label>
                  <Input
                    type="date"
                    value={placementDetails.placement_end_date}
                    onChange={(e) => setPlacementDetails(prev => ({ ...prev, placement_end_date: e.target.value }))}
                    className="mt-2"
                  />
                </div>
              </div>

              <div>
                <Label>Supervisor</Label>
                <Input
                  value={placementDetails.placement_supervisor}
                  onChange={(e) => setPlacementDetails(prev => ({ ...prev, placement_supervisor: e.target.value }))}
                  className="mt-2"
                  placeholder="Supervisor name"
                />
              </div>

              <div>
                <Label>Schedule</Label>
                <Textarea
                  value={placementDetails.placement_schedule}
                  onChange={(e) => setPlacementDetails(prev => ({ ...prev, placement_schedule: e.target.value }))}
                  className="mt-2"
                  rows={2}
                  placeholder="e.g., Mon-Fri, 9am-3pm"
                />
              </div>

              <div>
                <Label>Additional Details</Label>
                <Textarea
                  value={placementDetails.internal_placement_details}
                  onChange={(e) => setPlacementDetails(prev => ({ ...prev, internal_placement_details: e.target.value }))}
                  className="mt-2"
                  rows={3}
                  placeholder="Any additional notes about the placement"
                />
              </div>

              <div className="flex gap-2">
                <Button onClick={handleSave} variant="outline">
                  Save Details
                </Button>
                <Button onClick={handleSendRequest} disabled={sending}>
                  {sending ? 'Sending...' : 'Send Placement Request'}
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}