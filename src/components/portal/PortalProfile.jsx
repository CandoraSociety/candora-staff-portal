import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { User, Edit2, Save, X, CheckCircle, Clock, Mail, Phone, MapPin, Calendar } from 'lucide-react';
import moment from 'moment';

export default function PortalProfile({ volunteerId, onBack }) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedData, setEditedData] = useState({});
  const [submitStatus, setSubmitStatus] = useState(null);
  const queryClient = useQueryClient();

  const { data: volunteer, isLoading } = useQuery({
    queryKey: ['volunteer-profile', volunteerId],
    queryFn: () => base44.entities.Volunteer.get(volunteerId),
    enabled: !!volunteerId,
  });

  const { data: pendingChanges } = useQuery({
    queryKey: ['volunteer-pending-changes', volunteerId],
    queryFn: () => base44.entities.VolunteerProfileChange.filter({ 
      volunteer_id: volunteerId, 
      status: 'pending' 
    }),
    enabled: !!volunteerId,
  });

  const submitChangeMutation = useMutation({
    mutationFn: async (changes) => {
      const response = await base44.functions.invoke('submitProfileChange', {
        volunteer_id: volunteerId,
        changes,
        volunteer_email: volunteer.email,
      });
      return response.data;
    },
    onSuccess: () => {
      setSubmitStatus('submitted');
      setIsEditing(false);
      setEditedData({});
      queryClient.invalidateQueries({ queryKey: ['volunteer-pending-changes'] });
    },
  });

  const handleEdit = () => {
    setEditedData({
      phone: volunteer.phone || '',
      address: volunteer.address || '',
      city: volunteer.city || '',
      emergency_contact_name: volunteer.emergency_contact_name || '',
      emergency_contact_phone: volunteer.emergency_contact_phone || '',
      availability: volunteer.availability || '',
      skills: volunteer.skills || '',
      allergies: volunteer.allergies || '',
      food_restriction: volunteer.food_restriction || '',
    });
    setIsEditing(true);
    setSubmitStatus(null);
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditedData({});
    setSubmitStatus(null);
  };

  const handleSubmit = () => {
    // Filter out unchanged fields
    const changes = {};
    Object.keys(editedData).forEach(key => {
      if (editedData[key] !== volunteer[key]) {
        changes[key] = editedData[key];
      }
    });

    if (Object.keys(changes).length === 0) {
      setSubmitStatus('no-changes');
      return;
    }

    submitChangeMutation.mutate(changes);
  };

  if (isLoading) {
    return (
      <Card className="w-full max-w-2xl shadow-2xl border-0">
        <CardContent className="p-8 flex items-center justify-center">
          <div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
        </CardContent>
      </Card>
    );
  }

  if (!volunteer) {
    return (
      <Card className="w-full max-w-2xl shadow-2xl border-0">
        <CardContent className="p-8 text-center text-muted-foreground">
          <p>Volunteer profile not found.</p>
          <Button onClick={onBack} className="mt-4">Back to Home</Button>
        </CardContent>
      </Card>
    );
  }

  const hasPendingChanges = pendingChanges && pendingChanges.length > 0;

  return (
    <Card className="w-full max-w-2xl shadow-2xl border-0">
      <CardHeader className="bg-gradient-to-r from-accent/20 to-accent/5 rounded-t-lg">
        <div className="flex items-center justify-between">
          <CardTitle className="text-foreground text-2xl font-display font-bold flex items-center gap-2">
            <User className="w-6 h-6 text-accent" />
            My Profile
          </CardTitle>
          {!isEditing && !hasPendingChanges && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleEdit}
              className="gap-2"
            >
              <Edit2 className="w-4 h-4" />
              Edit
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="p-6 space-y-6">
        {submitStatus === 'submitted' && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-center gap-3 text-blue-800">
            <Clock className="w-5 h-5 text-blue-600 shrink-0" />
            <div>
              <p className="text-sm font-medium">Changes submitted for approval</p>
              <p className="text-xs text-blue-700">The coordinator will review your changes and notify you once approved.</p>
            </div>
          </div>
        )}

        {submitStatus === 'no-changes' && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex items-center gap-3 text-amber-800">
            <X className="w-5 h-5 text-amber-600 shrink-0" />
            <p className="text-sm font-medium">No changes detected. Please modify at least one field.</p>
          </div>
        )}

        {hasPendingChanges && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex items-center gap-3 text-amber-800">
            <Clock className="w-5 h-5 text-amber-600 shrink-0" />
            <div>
              <p className="text-sm font-medium">You have pending changes awaiting approval</p>
              <p className="text-xs text-amber-700">
                {hasPendingChanges.length} change(s) pending review
              </p>
            </div>
          </div>
        )}

        {/* Profile Header */}
        <div className="flex items-center gap-4 pb-4 border-b">
          <div className="w-20 h-20 rounded-full bg-accent/10 flex items-center justify-center text-3xl font-bold text-accent">
            {volunteer.first_name?.[0]}{volunteer.last_name?.[0]}
          </div>
          <div>
            <h3 className="text-xl font-bold font-display">{volunteer.first_name} {volunteer.last_name}</h3>
            <Badge className="mt-1">{volunteer.volunteer_type}</Badge>
            <p className="text-sm text-muted-foreground mt-1">
              Volunteer since {volunteer.start_date ? moment(volunteer.start_date).format('MMM YYYY') : 'N/A'}
            </p>
          </div>
        </div>

        {/* Contact Information */}
        <div className="space-y-4">
          <h4 className="font-semibold text-sm uppercase tracking-wide text-muted-foreground">Contact Information</h4>
          
          {isEditing ? (
            <div className="grid gap-4">
              <div>
                <Label>Phone</Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                  <Input
                    value={editedData.phone || ''}
                    onChange={e => setEditedData({...editedData, phone: e.target.value})}
                    className="pl-10"
                    placeholder="780-555-1234"
                  />
                </div>
              </div>
              <div>
                <Label>Address</Label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                  <Input
                    value={editedData.address || ''}
                    onChange={e => setEditedData({...editedData, address: e.target.value})}
                    className="pl-10"
                    placeholder="Street address"
                  />
                </div>
              </div>
              <div>
                <Label>City</Label>
                <Input
                  value={editedData.city || ''}
                  onChange={e => setEditedData({...editedData, city: e.target.value})}
                  placeholder="City"
                />
              </div>
            </div>
          ) : (
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-muted-foreground" />
                <span>{volunteer.email}</span>
              </div>
              {volunteer.phone && (
                <div className="flex items-center gap-2">
                  <Phone className="w-4 h-4 text-muted-foreground" />
                  <span>{volunteer.phone}</span>
                </div>
              )}
              {(volunteer.address || volunteer.city) && (
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-muted-foreground" />
                  <span>{[volunteer.address, volunteer.city].filter(Boolean).join(', ')}</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Emergency Contact */}
        <div className="space-y-4">
          <h4 className="font-semibold text-sm uppercase tracking-wide text-muted-foreground">Emergency Contact</h4>
          
          {isEditing ? (
            <div className="grid gap-4">
              <div>
                <Label>Contact Name</Label>
                <Input
                  value={editedData.emergency_contact_name || ''}
                  onChange={e => setEditedData({...editedData, emergency_contact_name: e.target.value})}
                  placeholder="Full name"
                />
              </div>
              <div>
                <Label>Contact Phone</Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                  <Input
                    value={editedData.emergency_contact_phone || ''}
                    onChange={e => setEditedData({...editedData, emergency_contact_phone: e.target.value})}
                    className="pl-10"
                    placeholder="780-555-1234"
                  />
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-2 text-sm">
              {volunteer.emergency_contact_name || volunteer.emergency_contact_phone ? (
                <>
                  {volunteer.emergency_contact_name && (
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4 text-muted-foreground" />
                      <span>{volunteer.emergency_contact_name}</span>
                    </div>
                  )}
                  {volunteer.emergency_contact_phone && (
                    <div className="flex items-center gap-2">
                      <Phone className="w-4 h-4 text-muted-foreground" />
                      <span>{volunteer.emergency_contact_phone}</span>
                    </div>
                  )}
                </>
              ) : (
                <p className="text-muted-foreground italic">Not provided</p>
              )}
            </div>
          )}
        </div>

        {/* Availability & Skills */}
        <div className="space-y-4">
          <h4 className="font-semibold text-sm uppercase tracking-wide text-muted-foreground">Availability & Skills</h4>
          
          {isEditing ? (
            <div className="grid gap-4">
              <div>
                <Label>Availability</Label>
                <Textarea
                  value={editedData.availability || ''}
                  onChange={e => setEditedData({...editedData, availability: e.target.value})}
                  placeholder="e.g., Weekday mornings, weekends"
                  className="min-h-[80px]"
                />
              </div>
              <div>
                <Label>Skills</Label>
                <Textarea
                  value={editedData.skills || ''}
                  onChange={e => setEditedData({...editedData, skills: e.target.value})}
                  placeholder="e.g., First aid, food handling, customer service"
                  className="min-h-[80px]"
                />
              </div>
              <div>
                <Label>Allergies / Food Restrictions</Label>
                <Textarea
                  value={editedData.allergies || ''}
                  onChange={e => setEditedData({...editedData, allergies: e.target.value, food_restriction: e.target.value})}
                  placeholder="List any allergies or dietary restrictions"
                  className="min-h-[60px]"
                />
              </div>
            </div>
          ) : (
            <div className="space-y-2 text-sm">
              {volunteer.availability && (
                <div>
                  <span className="font-medium">Availability:</span>
                  <span className="text-muted-foreground ml-2">{volunteer.availability}</span>
                </div>
              )}
              {volunteer.skills && (
                <div>
                  <span className="font-medium">Skills:</span>
                  <span className="text-muted-foreground ml-2">{volunteer.skills}</span>
                </div>
              )}
              {!volunteer.availability && !volunteer.skills && (
                <p className="text-muted-foreground italic">Not provided</p>
              )}
            </div>
          )}
        </div>

        {/* Action Buttons */}
        {isEditing && (
          <div className="flex gap-3 pt-4 border-t">
            <Button
              className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90 gap-2"
              onClick={handleSubmit}
              disabled={submitChangeMutation.isPending}
            >
              <Save className="w-4 h-4" />
              {submitChangeMutation.isPending ? 'Submitting...' : 'Submit Changes'}
            </Button>
            <Button
              variant="outline"
              className="flex-1 gap-2"
              onClick={handleCancel}
              disabled={submitChangeMutation.isPending}
            >
              <X className="w-4 h-4" />
              Cancel
            </Button>
          </div>
        )}

        <Button variant="ghost" onClick={onBack} className="w-full text-muted-foreground mt-4">
          Back to Home
        </Button>
      </CardContent>
    </Card>
  );
}