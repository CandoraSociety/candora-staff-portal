import { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { X } from 'lucide-react';
import AvailabilitySelector from './AvailabilitySelector';

export default function PortalAvailability({ volunteerId, onBack }) {
  const [schedule, setSchedule] = useState({
    monday: [], tuesday: [], wednesday: [], thursday: [], friday: [], saturday: [], sunday: []
  });
  const [blockedDates, setBlockedDates] = useState([]);

  // Fetch existing availability
  const { data: existing } = useQuery({
    queryKey: ['vol-availability', volunteerId],
    queryFn: () => base44.entities.VolunteerAvailability.filter({ volunteer_id: volunteerId }).then(r => r[0]),
  });

  // Load existing data
  useEffect(() => {
    if (existing) {
      if (existing.weekly_schedule) setSchedule(existing.weekly_schedule);
      if (existing.blocked_dates) setBlockedDates(existing.blocked_dates);
    }
  }, [existing]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      const volunteer = await base44.entities.Volunteer.get(volunteerId);
      await base44.functions.invoke('updateVolunteerAvailability', {
        volunteer_id: volunteerId,
        volunteer_name: `${volunteer.first_name} ${volunteer.last_name}`,
        volunteer_email: volunteer.email,
        weekly_schedule: schedule,
        blocked_dates: blockedDates,
      });
    },
    onSuccess: () => {
      toast.success('Availability updated! The coordinator has been notified.');
      if (onBack) onBack();
    },
    onError: (error) => {
      toast.error('Failed to update availability: ' + error.message);
    },
  });

  return (
    <Card className="w-full max-w-2xl shadow-2xl border-0">
      <CardHeader className="bg-gradient-to-r from-primary/20 to-primary/5 rounded-t-lg py-4 flex flex-row items-center justify-between">
        <CardTitle className="text-foreground text-xl font-display font-bold">
          Edit My Availability
        </CardTitle>
        <Button variant="ghost" size="icon" onClick={onBack}>
          <X className="w-5 h-5" />
        </Button>
      </CardHeader>
      <CardContent className="p-6 space-y-4">
        <div>
          <p className="text-sm text-muted-foreground mb-3">
            Click on time slots to select when you're available each week. Add blocked dates for specific days you're unavailable.
          </p>
          <AvailabilitySelector
            value={{ weekly_schedule: schedule, blocked_dates: blockedDates }}
            onChange={(data) => {
              setSchedule(data.weekly_schedule);
              setBlockedDates(data.blocked_dates);
            }}
          />
        </div>

        <div className="flex gap-2 pt-4 border-t">
          <Button variant="outline" className="flex-1" onClick={onBack}>
            Cancel
          </Button>
          <Button
            className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90 font-semibold"
            onClick={() => saveMutation.mutate()}
            disabled={saveMutation.isPending}
          >
            {saveMutation.isPending ? 'Saving...' : 'Save Availability'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}