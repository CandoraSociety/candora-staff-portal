import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Award, Clock, Users, Trophy } from 'lucide-react';
import PageHeader from '@/components/shared/PageHeader';
import EmptyState from '@/components/shared/EmptyState';
import moment from 'moment';

export default function VolunteerMgrMilestones() {
  const [showAward, setShowAward] = useState(false);
  const [selectedVolunteer, setSelectedVolunteer] = useState(null);
  const [awardForm, setAwardForm] = useState({ title: '', description: '', type: 'milestone_hours' });
  const queryClient = useQueryClient();

  const { data: volunteers = [] } = useQuery({
    queryKey: ['vol-volunteers'],
    queryFn: () => base44.entities.Volunteer.list(undefined, 500),
  });

  const { data: timeLogs = [] } = useQuery({
    queryKey: ['vol-timelogs-all'],
    queryFn: () => base44.entities.VolunteerTimeLog.list('-date', 5000),
  });

  const { data: recognitions = [] } = useQuery({
    queryKey: ['vol-recognition'],
    queryFn: () => base44.entities.VolunteerRecognition.list('-date_awarded', 500),
  });

  const createRecognitionMutation = useMutation({
    mutationFn: (data) => base44.entities.VolunteerRecognition.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vol-recognition'] });
      setShowAward(false);
      setSelectedVolunteer(null);
      setAwardForm({ title: '', description: '', type: 'milestone_hours' });
    },
  });

  // Calculate pending milestones for each volunteer
  const calculateMilestones = (volunteer) => {
    const totalHours = timeLogs
      .filter(log => log.volunteer_id === volunteer.id)
      .reduce((sum, log) => sum + (log.total_hours || 0), 0);

    const awardedKeys = recognitions
      .filter(rec => rec.volunteer_id === volunteer.id)
      .map(rec => rec.milestone_key);

    const pending = [];

    // Hour milestones
    [50, 100, 250, 500, 1000].forEach(hours => {
      const key = `milestone_hours_${hours}`;
      if (totalHours >= hours && !awardedKeys.includes(key)) {
        pending.push({
          type: 'milestone_hours',
          milestone_key: key,
          title: `${hours} Hours Milestone`,
          description: `Reached ${hours} hours of volunteer service`,
          volunteer_id: volunteer.id,
        });
      }
    });

    // Years of service
    if (volunteer.start_date) {
      const yearsWorked = moment().diff(moment(volunteer.start_date), 'years');
      [1, 3, 5, 10, 15, 20].forEach(years => {
        const key = `years_of_service_${years}`;
        if (yearsWorked >= years && !awardedKeys.includes(key)) {
          pending.push({
            type: 'years_of_service',
            milestone_key: key,
            title: `${years} Year${years > 1 ? 's' : ''} of Service`,
            description: `Celebrating ${years} year${years > 1 ? 's' : ''} of dedication`,
            volunteer_id: volunteer.id,
          });
        }
      });
    }

    return { totalHours, pending };
  };

  const volunteersWithMilestones = volunteers
    .map(v => {
      const { totalHours, pending } = calculateMilestones(v);
      return { volunteer: v, totalHours, pending };
    })
    .filter(v => v.pending.length > 0);

  const handleAward = (milestone, volunteer) => {
    setSelectedVolunteer(volunteer);
    setAwardForm({
      title: milestone.title,
      description: milestone.description,
      type: milestone.type,
    });
    setShowAward(true);
  };

  const handleAwardSubmit = () => {
    if (selectedVolunteer && awardForm.title) {
      createRecognitionMutation.mutate({
        volunteer_id: selectedVolunteer.id,
        volunteer_name: `${selectedVolunteer.first_name} ${selectedVolunteer.last_name}`,
        type: awardForm.type,
        title: awardForm.title,
        description: awardForm.description,
        date_awarded: moment().format('YYYY-MM-DD'),
        awarded_by: 'Volunteer Manager',
        milestone_key: awardForm.type === 'milestone_hours' 
          ? `milestone_hours_${selectedVolunteer.totalHours}` 
          : `years_of_service_${moment().diff(moment(selectedVolunteer.start_date), 'years')}`,
      });
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Pending Milestones"
        description="Recognize volunteers for their achievements"
      />

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <Trophy className="w-8 h-8 text-accent" />
            <div>
              <p className="text-2xl font-bold">{volunteersWithMilestones.length}</p>
              <p className="text-xs text-muted-foreground">Volunteers with Milestones</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <Award className="w-8 h-8 text-primary" />
            <div>
              <p className="text-2xl font-bold">
                {volunteersWithMilestones.reduce((sum, v) => sum + v.pending.length, 0)}
              </p>
              <p className="text-xs text-muted-foreground">Pending Awards</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Milestones List */}
      {volunteersWithMilestones.length === 0 ? (
        <EmptyState
          icon={Award}
          title="No pending milestones"
          description="All eligible volunteers have been recognized!"
        />
      ) : (
        <div className="grid gap-6">
          {volunteersWithMilestones.map(({ volunteer, totalHours, pending }) => (
            <Card key={volunteer.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>{volunteer.first_name} {volunteer.last_name}</CardTitle>
                    <p className="text-sm text-muted-foreground">
                      {volunteer.volunteer_type?.replace(/_/g, ' ')} • {totalHours} total hours
                    </p>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Clock className="w-4 h-4 text-muted-foreground" />
                    <span className="font-medium">{pending.length} pending</span>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                  {pending.map((milestone, idx) => (
                    <div key={idx} className="p-4 border rounded-lg hover:bg-muted/30 transition-colors">
                      <div className="flex items-start justify-between mb-2">
                        <Award className="w-5 h-5 text-accent" />
                        <Button size="sm" onClick={() => handleAward(milestone, volunteer)}>
                          Award
                        </Button>
                      </div>
                      <p className="font-medium text-sm mb-1">{milestone.title}</p>
                      <p className="text-xs text-muted-foreground">{milestone.description}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Award Dialog */}
      <Dialog open={showAward} onOpenChange={setShowAward}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Award Milestone</DialogTitle>
          </DialogHeader>
          <form onSubmit={(e) => { e.preventDefault(); handleAwardSubmit(); }} className="space-y-4">
            <div className="space-y-1">
              <Label>Volunteer</Label>
              <Input value={selectedVolunteer ? `${selectedVolunteer.first_name} ${selectedVolunteer.last_name}` : ''} disabled />
            </div>
            <div className="space-y-1">
              <Label>Award Title *</Label>
              <Input value={awardForm.title} onChange={e => setAwardForm({ ...awardForm, title: e.target.value })} required />
            </div>
            <div className="space-y-1">
              <Label>Description *</Label>
              <Textarea value={awardForm.description} onChange={e => setAwardForm({ ...awardForm, description: e.target.value })} className="h-24" required />
            </div>
            <div className="space-y-1">
              <Label>Award Type *</Label>
              <Select value={awardForm.type} onValueChange={v => setAwardForm({ ...awardForm, type: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="milestone_hours">Milestone Hours</SelectItem>
                  <SelectItem value="years_of_service">Years of Service</SelectItem>
                  <SelectItem value="outstanding_service">Outstanding Service</SelectItem>
                  <SelectItem value="volunteer_of_month">Volunteer of Month</SelectItem>
                  <SelectItem value="special_achievement">Special Achievement</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button type="submit" disabled={createRecognitionMutation.isPending} className="w-full">
              {createRecognitionMutation.isPending ? 'Awarding...' : 'Award Milestone'}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}