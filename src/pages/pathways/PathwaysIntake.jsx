import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

const WORKERS = [
  { email: 'priscilla@candorasociety.com', name: 'Priscilla' },
  { email: 'lola@candorasociety.com', name: 'Lola' },
  { email: 'john@candorasociety.com', name: 'John' },
  { email: 'Dawn.williston@candorasociety.com', name: 'Dawn' },
  { email: 'olena@candorasociety.com', name: 'Olena' },
];

const SERVICE_TYPES = [
  { value: 'direct_to_employment', label: 'Direct to Employment (DEA)' },
  { value: 'pathways', label: 'Pathways' },
  { value: 'casual', label: 'Casual' },
  { value: 'external_referral', label: 'External Referral' },
  { value: 'internal_referral', label: 'Internal Referral' },
  { value: 'not_eligible', label: 'Not Eligible' },
];

const RESIDENCY_STATUS = [
  { value: 'canadian_citizen', label: 'Canadian Citizen' },
  { value: 'permanent_resident', label: 'Permanent Resident' },
  { value: 'protected_person', label: 'Protected Person' },
  { value: 'convention_refugee', label: 'Convention Refugee' },
  { value: 'refugee_claimant', label: 'Refugee Claimant' },
  { value: 'temporary_resident', label: 'Temporary Resident' },
  { value: 'work_permit', label: 'Work Permit' },
  { value: 'study_permit', label: 'Study Permit' },
  { value: 'visitor', label: 'Visitor' },
  { value: 'other', label: 'Other' },
];

const CLB_LEVELS = [
  { value: 'clb_1', label: 'CLB 1' },
  { value: 'clb_2', label: 'CLB 2' },
  { value: 'clb_3', label: 'CLB 3' },
  { value: 'clb_4', label: 'CLB 4' },
  { value: 'clb_5', label: 'CLB 5' },
  { value: 'clb_6', label: 'CLB 6' },
  { value: 'clb_7', label: 'CLB 7' },
  { value: 'clb_8', label: 'CLB 8' },
  { value: 'clb_9', label: 'CLB 9' },
  { value: 'clb_10', label: 'CLB 10' },
  { value: 'clb_11', label: 'CLB 11' },
  { value: 'clb_12', label: 'CLB 12' },
  { value: 'native_english_french', label: 'Native English/French' },
];

const EMPLOYMENT_STATUS = [
  { value: 'E-RF', label: 'Employed - Regular Full-time' },
  { value: 'E-UF', label: 'Employed - Unstable Full-time' },
  { value: 'E-PT', label: 'Employed - Part-time' },
  { value: 'UE', label: 'Unemployed' },
  { value: 'UE-LA', label: 'Unemployed - Looking for Work' },
  { value: 'UE-S', label: 'Unemployed - Seeking Work' },
  { value: 'NA', label: 'Not Applicable' },
];

const REFERRAL_SOURCES = [
  { value: 'self', label: 'Self' },
  { value: 'family_friend', label: 'Family/Friend' },
  { value: 'school', label: 'School' },
  { value: 'employer', label: 'Employer' },
  { value: 'external_agency', label: 'External Agency' },
  { value: 'alberta_works', label: 'Alberta Works' },
  { value: 'other', label: 'Other' },
];

export default function PathwaysIntake() {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    zip: '',
    date_of_birth: '',
    sex: '',
    compass_hsid: '',
    residency_status: '',
    clb_level: '',
    employment_status: '',
    has_vehicle: '',
    referral_source: '',
    service_type: '',
    assigned_worker: '',
    career_objectives: '',
    employment_history: '',
    intake_notes: '',
    intake_date: new Date().toISOString().split('T')[0],
  });
  
  const createClientMutation = useMutation({
    mutationFn: async (data) => {
      return await base44.entities.Client.create(data);
    },
    onSuccess: () => {
      toast.success('Client intake completed successfully!');
      queryClient.invalidateQueries({ queryKey: ['pathways-clients'] });
      setFormData({
        first_name: '', last_name: '', email: '', phone: '', address: '', city: '', state: '', zip: '',
        date_of_birth: '', sex: '', compass_hsid: '', residency_status: '', clb_level: '',
        employment_status: '', has_vehicle: '', referral_source: '', service_type: '',
        assigned_worker: '', career_objectives: '', employment_history: '', intake_notes: '',
        intake_date: new Date().toISOString().split('T')[0],
      });
    },
    onError: (error) => {
      toast.error('Failed to create client: ' + error.message);
    },
  });
  
  const handleSubmit = (e) => {
    e.preventDefault();
    createClientMutation.mutate(formData);
  };
  
  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };
  
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link to="/pathways">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Client Intake</h1>
          <p className="text-sm text-slate-600">Register a new client</p>
        </div>
      </div>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Personal Information */}
        <Card>
          <CardHeader>
            <CardTitle>Personal Information</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="first_name">First Name *</Label>
              <Input
                id="first_name"
                value={formData.first_name}
                onChange={(e) => handleChange('first_name', e.target.value)}
                required
              />
            </div>
            <div>
              <Label htmlFor="last_name">Last Name *</Label>
              <Input
                id="last_name"
                value={formData.last_name}
                onChange={(e) => handleChange('last_name', e.target.value)}
                required
              />
            </div>
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => handleChange('email', e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                value={formData.phone}
                onChange={(e) => handleChange('phone', e.target.value)}
              />
            </div>
            <div className="md:col-span-2">
              <Label htmlFor="address">Address</Label>
              <Input
                id="address"
                value={formData.address}
                onChange={(e) => handleChange('address', e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="city">City</Label>
              <Input
                id="city"
                value={formData.city}
                onChange={(e) => handleChange('city', e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="state">Province/State</Label>
              <Input
                id="state"
                value={formData.state}
                onChange={(e) => handleChange('state', e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="zip">Postal/ZIP Code</Label>
              <Input
                id="zip"
                value={formData.zip}
                onChange={(e) => handleChange('zip', e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="date_of_birth">Date of Birth</Label>
              <Input
                id="date_of_birth"
                type="date"
                value={formData.date_of_birth}
                onChange={(e) => handleChange('date_of_birth', e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="sex">Sex</Label>
              <Select value={formData.sex} onValueChange={(v) => handleChange('sex', v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="male">Male</SelectItem>
                  <SelectItem value="female">Female</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>
        
        {/* Case Information */}
        <Card>
          <CardHeader>
            <CardTitle>Case Information</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="compass_hsid">Compass HSID #</Label>
              <Input
                id="compass_hsid"
                value={formData.compass_hsid}
                onChange={(e) => handleChange('compass_hsid', e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="residency_status">Residency Status</Label>
              <Select value={formData.residency_status} onValueChange={(v) => handleChange('residency_status', v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select" />
                </SelectTrigger>
                <SelectContent>
                  {RESIDENCY_STATUS.map(s => (
                    <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="clb_level">CLB Level</Label>
              <Select value={formData.clb_level} onValueChange={(v) => handleChange('clb_level', v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select" />
                </SelectTrigger>
                <SelectContent>
                  {CLB_LEVELS.map(s => (
                    <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="employment_status">Employment Status</Label>
              <Select value={formData.employment_status} onValueChange={(v) => handleChange('employment_status', v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select" />
                </SelectTrigger>
                <SelectContent>
                  {EMPLOYMENT_STATUS.map(s => (
                    <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="has_vehicle">Has Vehicle</Label>
              <Select value={formData.has_vehicle} onValueChange={(v) => handleChange('has_vehicle', v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="yes">Yes</SelectItem>
                  <SelectItem value="no_has_license">No (has license)</SelectItem>
                  <SelectItem value="no_no_license">No (no license)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="referral_source">Referral Source</Label>
              <Select value={formData.referral_source} onValueChange={(v) => handleChange('referral_source', v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select" />
                </SelectTrigger>
                <SelectContent>
                  {REFERRAL_SOURCES.map(s => (
                    <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="service_type">Service Type *</Label>
              <Select value={formData.service_type} onValueChange={(v) => handleChange('service_type', v)} required>
                <SelectTrigger>
                  <SelectValue placeholder="Select" />
                </SelectTrigger>
                <SelectContent>
                  {SERVICE_TYPES.map(s => (
                    <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="assigned_worker">Assigned Worker *</Label>
              <Select value={formData.assigned_worker} onValueChange={(v) => handleChange('assigned_worker', v)} required>
                <SelectTrigger>
                  <SelectValue placeholder="Select" />
                </SelectTrigger>
                <SelectContent>
                  {WORKERS.map(w => (
                    <SelectItem key={w.email} value={w.email}>{w.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>
        
        {/* Background */}
        <Card>
          <CardHeader>
            <CardTitle>Career Background</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="career_objectives">Career Objectives</Label>
              <Textarea
                id="career_objectives"
                value={formData.career_objectives}
                onChange={(e) => handleChange('career_objectives', e.target.value)}
                rows={3}
              />
            </div>
            <div>
              <Label htmlFor="employment_history">Employment History</Label>
              <Textarea
                id="employment_history"
                value={formData.employment_history}
                onChange={(e) => handleChange('employment_history', e.target.value)}
                rows={4}
              />
            </div>
            <div>
              <Label htmlFor="intake_notes">Intake Notes</Label>
              <Textarea
                id="intake_notes"
                value={formData.intake_notes}
                onChange={(e) => handleChange('intake_notes', e.target.value)}
                rows={4}
              />
            </div>
            <div>
              <Label htmlFor="intake_date">Intake Date</Label>
              <Input
                id="intake_date"
                type="date"
                value={formData.intake_date}
                onChange={(e) => handleChange('intake_date', e.target.value)}
                required
              />
            </div>
          </CardContent>
        </Card>
        
        <div className="flex gap-3">
          <Button type="submit" className="bg-[#1a237e] hover:bg-[#2c3799]" disabled={createClientMutation.isPending}>
            {createClientMutation.isPending ? 'Creating...' : 'Create Client'}
          </Button>
          <Link to="/pathways">
            <Button type="button" variant="outline">Cancel</Button>
          </Link>
        </div>
      </form>
    </div>
  );
}