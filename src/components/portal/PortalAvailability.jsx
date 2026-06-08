import { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { X } from 'lucide-react';
import AvailabilitySelector from './AvailabilitySelector';

export default function PortalAvailability({ volunteerId, onBack }) {
  const [availabilityData, setAvailabilityData] = useState({
    weekly_schedule: {
      monday: [], tuesday: [], wednesday: [], thursday: [], friday: [], saturday: [], sunday: []
    },
    blocked_dates: []
  });
  const [isLoading, setIsLoading] = useState(true);

  // Fetch existing availability on mount
  useEffect(() => {
    const fetchAvailability = async () => {
      try {
        const results = await base44.entities.VolunteerAvailability.filter({ volunteer_id: volunteerId });
        if (results && results.length > 0 && results[0].weekly_schedule) {
          setAvailabilityData({
            weekly_schedule: results[0].weekly_schedule,
            blocked_dates: results[0].blocked_dates || []
          });
        }
      } catch (error) {
        console.error('Failed to fetch availability:', error);
      } finally {
        setIsLoading(false);
      }
    };

    if (volunteerId) {
      fetchAvailability();
    }
  }, [volunteerId]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      const volunteer = await base44.entities.Volunteer.get(volunteerId);
      await base44.functions.invoke('updateVolunteerAvailability', {
        volunteer_id: volunteerId,
        volunteer_name: `${volunteer.first_name} ${volunteer.last_name}`,
        volunteer_email: volunteer.email,
        weekly_schedule: availabilityData.weekly_schedule,
        blocked_dates: availabilityData.blocked_dates,
      });
    },
    onSuccess: () => {
      toast.success('Availability updated successfully!');
      if (onBack) onBack();
    },
    onError: (error) => {
      toast.error('Failed to update: ' + error.message);
    },
  });

  if (isLoading) {
    return (
      <Card className="w-full max-w-2xl shadow-2xl border-0">
        <CardContent className="p-6 text-center">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-sm text-muted-foreground mt-2">Loading your availability...</p>
        </CardContent>
      </Card>
    );
  }

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
            Click time slots to select when you're available each week. Use the calendar to block specific dates.
          </p>
          <AvailabilitySelector
            value={availabilityData}
            onChange={(data) => setAvailabilityData(data)}
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
            {saveMutation.isPending ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}