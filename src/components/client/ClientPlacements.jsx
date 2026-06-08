import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { base44 } from '@/api/base44Client';

const PLACEMENT_TYPES = [
  { value: 'cleaning_arc', label: 'Cleaning (ARC)' },
  { value: 'food_services_onsite', label: 'Food Services (Onsite)' },
  { value: 'food_services_offsite', label: 'Food Services (Offsite)' },
  { value: 'reception', label: 'Reception' },
  { value: 'childcare', label: 'Childcare' },
];

const TRANSPORTATION_OPTIONS = [
  { value: 'has_own_vehicle', label: 'Has Own Vehicle' },
  { value: 'no_vehicle_willing_to_bus', label: 'No Vehicle - Willing to Bus' },
  { value: 'no_vehicle_not_willing_to_bus', label: 'No Vehicle - Not Willing to Bus' },
  { value: 'transit_pass_provided', label: 'Transit Pass Provided' },
  { value: 'requires_transportation_support', label: 'Requires Transportation Support' },
  { value: 'offsite_not_applicable', label: 'Offsite - Not Applicable' },
];

const EVALUATION_RATINGS = [
  { value: 'excellent', label: 'Excellent' },
  { value: 'good', label: 'Good' },
  { value: 'satisfactory', label: 'Satisfactory' },
  { value: 'needs_improvement', label: 'Needs Improvement' },
  { value: 'unsatisfactory', label: 'Unsatisfactory' },
];

export default function ClientPlacements({ client }) {
  const [internalTraining, setInternalTraining] = useState(null);
  const [loading, setLoading] = useState(false);

  const fetchInternalTraining = async () => {
    setLoading(true);
    try {
      const records = await base44.entities.InternalTraining.filter({ client_id: client.id });
      setInternalTraining(records[0] || null);
    } catch (error) {
      toast.error('Failed to load placement data');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Internal Placements</CardTitle>
        </CardHeader>
        <CardContent>
          {!internalTraining ? (
            <div className="text-muted-foreground">
              No internal placement records found.
              <Button onClick={fetchInternalTraining} variant="outline" size="sm" className="ml-2">
                Load Records
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Placement Type</Label>
                  <div className="mt-1 font-medium">{internalTraining.placement_type}</div>
                </div>
                <div>
                  <Label>Status</Label>
                  <Badge className="mt-1">{internalTraining.status}</Badge>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Start Date</Label>
                  <div className="mt-1">{internalTraining.start_date || 'Not set'}</div>
                </div>
                <div>
                  <Label>Expected End Date</Label>
                  <div className="mt-1">{internalTraining.expected_end_date || 'Not set'}</div>
                </div>
              </div>

              <div>
                <Label>Supervisor</Label>
                <div className="mt-1">{internalTraining.supervisor || 'Not assigned'}</div>
              </div>

              <div>
                <Label>Transportation</Label>
                <div className="mt-1">{internalTraining.transportation || 'Not specified'}</div>
              </div>

              {internalTraining.transportation_notes && (
                <div>
                  <Label>Transportation Notes</Label>
                  <div className="mt-1 text-sm">{internalTraining.transportation_notes}</div>
                </div>
              )}

              {internalTraining.evaluation_completed && (
                <div className="border-t pt-4 mt-4">
                  <h4 className="font-semibold mb-3">Evaluation Summary</h4>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>Reliability: {internalTraining.evaluation_reliability}</div>
                    <div>Attitude: {internalTraining.evaluation_attitude}</div>
                    <div>Skill Development: {internalTraining.evaluation_skill_development}</div>
                    <div>Teamwork: {internalTraining.evaluation_teamwork}</div>
                    <div>Communication: {internalTraining.evaluation_communication}</div>
                    <div>Would Hire: {internalTraining.evaluation_would_hire}</div>
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>External Placements</CardTitle>
        </CardHeader>
        <CardContent>
          {client?.external_employer ? (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Employer Name</Label>
                  <div className="mt-1 font-medium">{client.employer_name}</div>
                </div>
                <div>
                  <Label>Job Title</Label>
                  <div className="mt-1">{client.job_title || 'Not specified'}</div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Employer Contact</Label>
                  <div className="mt-1">{client.employer_contact || 'Not provided'}</div>
                </div>
                <div>
                  <Label>Start Date</Label>
                  <div className="mt-1">{client.job_start_date || 'Not set'}</div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Wage ($/hr)</Label>
                  <div className="mt-1">${client.job_wage || '0.00'}</div>
                </div>
                <div>
                  <Label>Hours</Label>
                  <div className="mt-1">{client.job_hours || 'Not specified'}</div>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-muted-foreground">
              No external placement records found.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}