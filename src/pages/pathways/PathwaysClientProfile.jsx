import { useState } from 'react';
import { useParams, Navigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { Save, Upload, FileText, Users, DollarSign, ClipboardList } from 'lucide-react';
import moment from 'moment';

const WORKERS = [
  { email: 'priscilla@candorasociety.com', name: 'Priscilla' },
  { email: 'lola@candorasociety.com', name: 'Lola' },
  { email: 'john@candorasociety.com', name: 'John' },
  { email: 'Dawn.williston@candorasociety.com', name: 'Dawn' },
  { email: 'olena@candorasociety.com', name: 'Olena' },
];

const RESIDENCY_STATUS = ['canadian_citizen', 'permanent_resident', 'protected_person', 'convention_refugee', 'refugee_claimant', 'temporary_resident', 'work_permit', 'study_permit', 'visitor', 'other'];
const CLB_LEVELS = ['clb_1', 'clb_2', 'clb_3', 'clb_4', 'clb_5', 'clb_6', 'clb_7', 'clb_8', 'clb_9', 'clb_10', 'clb_11', 'clb_12', 'native_english_french'];
const EMPLOYMENT_STATUS = ['E-RF', 'E-UF', 'E-PT', 'UE', 'UE-LA', 'UE-S', 'NA'];
const SERVICE_TYPES = ['direct_to_employment', 'pathways', 'casual', 'external_referral', 'internal_referral', 'not_eligible'];
const PLACEMENT_TYPES = ['none', 'cleaning_arc', 'food_services_onsite', 'food_services_offsite', 'reception', 'childcare'];

export default function PathwaysClientProfile() {
  const { id } = useParams();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('overview');
  
  const { data: client, isLoading } = useQuery({
    queryKey: ['pathways-client', id],
    queryFn: () => base44.entities.Client.get(id),
  });
  
  const { data: financials = [] } = useQuery({
    queryKey: ['pathways-client-financials', id],
    queryFn: () => base44.entities.FinancialRecord.filter({ client_id: id }),
    enabled: !!id,
  });
  
  const updateClientMutation = useMutation({
    mutationFn: async (data) => await base44.entities.Client.update(id, data),
    onSuccess: () => {
      toast.success('Client updated');
      queryClient.invalidateQueries({ queryKey: ['pathways-client', id] });
    },
  });
  
  if (isLoading) return <div className="p-8 text-center">Loading...</div>;
  if (!client) return <Navigate to="/pathways/master" />;
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">{client.first_name} {client.last_name}</h1>
          <p className="text-sm text-slate-600">{client.email} • {client.phone}</p>
          <div className="flex gap-2 mt-2">
            <Badge>{client.status}</Badge>
            <Badge variant="outline">{client.service_type?.replace(/_/g, ' ')}</Badge>
            {client.employment_status?.startsWith('E-') && <Badge className="bg-green-100 text-green-800">Employed</Badge>}
          </div>
        </div>
        <Button onClick={() => document.getElementById('save-btn')?.click()}><Save className="h-4 w-4 mr-2" />Save Changes</Button>
      </div>
      
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="overview"><FileText className="h-4 w-4 mr-2" />Overview</TabsTrigger>
          <TabsTrigger value="financials"><DollarSign className="h-4 w-4 mr-2" />Financials</TabsTrigger>
          <TabsTrigger value="referrals"><Users className="h-4 w-4 mr-2" />Referrals</TabsTrigger>
          <TabsTrigger value="placements"><ClipboardList className="h-4 w-4 mr-2" />Placements</TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview">
          <Card>
            <CardHeader><CardTitle>Personal Information</CardTitle></CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div><Label>First Name</Label><Input id="first_name" defaultValue={client.first_name} /></div>
              <div><Label>Last Name</Label><Input id="last_name" defaultValue={client.last_name} /></div>
              <div><Label>Email</Label><Input id="email" type="email" defaultValue={client.email} /></div>
              <div><Label>Phone</Label><Input id="phone" defaultValue={client.phone} /></div>
              <div><Label>Date of Birth</Label><Input id="dob" type="date" defaultValue={client.date_of_birth} /></div>
              <div><Label>Sex</Label><Select defaultValue={client.sex}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="male">Male</SelectItem><SelectItem value="female">Female</SelectItem></SelectContent></Select></div>
              <div className="md:col-span-3"><Label>Address</Label><Input id="address" defaultValue={client.address} /></div>
              <div><Label>City</Label><Input id="city" defaultValue={client.city} /></div>
              <div><Label>Province</Label><Input id="state" defaultValue={client.state} /></div>
              <div><Label>Postal Code</Label><Input id="zip" defaultValue={client.zip} /></div>
            </CardContent>
          </Card>
          
          <Card className="mt-4">
            <CardHeader><CardTitle>Case Information</CardTitle></CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div><Label>Compass HSID</Label><Input id="hsid" defaultValue={client.compass_hsid} /></div>
              <div className="flex items-center gap-2"><input type="checkbox" id="cv" defaultChecked={client.compass_verified} /><Label htmlFor="cv">Compass Verified</Label></div>
              {client.compass_verified && (<><div><Label>Verified Date</Label><Input id="cvd" type="date" defaultValue={client.compass_verified_date} /></div><div><Label>Verified By</Label><Input id="cvb" defaultValue={client.compass_verified_by} /></div></>)}
              <div><Label>Residency Status</Label><Select defaultValue={client.residency_status}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{RESIDENCY_STATUS.map(s => <SelectItem key={s} value={s}>{s.replace(/_/g, ' ')}</SelectItem>)}</SelectContent></Select></div>
              <div><Label>CLB Level</Label><Select defaultValue={client.clb_level}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{CLB_LEVELS.map(s => <SelectItem key={s} value={s}>{s.replace('_', ' ').toUpperCase()}</SelectItem>)}</SelectContent></Select></div>
              <div><Label>Employment Status</Label><Select defaultValue={client.employment_status}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{EMPLOYMENT_STATUS.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent></Select></div>
              <div><Label>Service Type</Label><Select defaultValue={client.service_type}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{SERVICE_TYPES.map(s => <SelectItem key={s} value={s}>{s.replace(/_/g, ' ')}</SelectItem>)}</SelectContent></Select></div>
              <div><Label>Assigned Worker</Label><Select defaultValue={client.assigned_worker}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{WORKERS.map(w => <SelectItem key={w.email} value={w.email}>{w.name}</SelectItem>)}</SelectContent></Select></div>
              <div><Label>Status</Label><Select defaultValue={client.status}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="new">New</SelectItem><SelectItem value="active">Active</SelectItem><SelectItem value="pending">Pending</SelectItem><SelectItem value="closed">Closed</SelectItem></SelectContent></Select></div>
              <div><Label>Program Status</Label><Select defaultValue={client.program_status}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="in_progress">In Progress</SelectItem><SelectItem value="complete">Complete</SelectItem><SelectItem value="incomplete">Incomplete</SelectItem><SelectItem value="cancelled">Cancelled</SelectItem></SelectContent></Select></div>
              <div><Label>Service Start Date</Label><Input id="ssd" type="date" defaultValue={client.service_start_date} /></div>
            </CardContent>
          </Card>
          
          <Card className="mt-4">
            <CardHeader><CardTitle>Barriers (BIT)</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              {['barrier_1', 'barrier_2', 'barrier_3'].map((key, idx) => (
                <div key={key} className="p-4 border rounded-lg">
                  <Label>Barrier {idx + 1}</Label>
                  <Input className="mt-1" defaultValue={client[key]} placeholder="Describe barrier" />
                  <div className="grid grid-cols-3 gap-2 mt-2">
                    <Select defaultValue={client[`${key}_status`]}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="unresolved">Unresolved</SelectItem><SelectItem value="in_progress">In Progress</SelectItem><SelectItem value="resolved">Resolved</SelectItem></SelectContent></Select>
                    <Input defaultValue={client[`${key}_notes`]} placeholder="Notes" />
                    <Input defaultValue={client[`${key}_action_steps`]} placeholder="Action Steps" />
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="financials">
          <Card>
            <CardHeader><CardTitle>Financial Records</CardTitle></CardHeader>
            <CardContent>
              <div className="space-y-4">
                {financials.map(f => (
                  <div key={f.id} className="p-4 border rounded-lg">
                    <div className="flex justify-between">
                      <div>
                        <p className="font-medium">{f.record_type.replace(/_/g, ' ')}</p>
                        <p className="text-sm text-slate-600">{f.description}</p>
                        <p className="text-xs text-slate-500">{f.date} • {f.vendor}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold">${f.total?.toFixed(2)}</p>
                        <Badge>{f.registration_status}</Badge>
                      </div>
                    </div>
                  </div>
                ))}
                {financials.length === 0 && <p className="text-center text-slate-500 py-8">No financial records</p>}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="referrals">
          <Card>
            <CardHeader><CardTitle>Internal Referrals</CardTitle></CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {client.internal_referrals?.map((ref, idx) => (
                  <Badge key={idx} variant="outline">{ref}</Badge>
                ))}
                {!client.internal_referrals?.length && <p className="text-slate-500">No internal referrals</p>}
              </div>
            </CardContent>
          </Card>
          
          <Card className="mt-4">
            <CardHeader><CardTitle>External Referrals</CardTitle></CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {client.external_referrals?.map((ref, idx) => (
                  <Badge key={idx} variant="outline">{ref}</Badge>
                ))}
                {!client.external_referrals?.length && <p className="text-slate-500">No external referrals</p>}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="placements">
          <Card>
            <CardHeader><CardTitle>Internal Placement</CardTitle></CardHeader>
            <CardContent className="grid grid-cols-2 gap-4">
              <div><Label>Type</Label><p className="font-medium">{client.internal_placement?.replace(/_/g, ' ') || 'None'}</p></div>
              <div><Label>Start Date</Label><p className="font-medium">{client.placement_start_date || 'N/A'}</p></div>
              <div><Label>End Date</Label><p className="font-medium">{client.placement_end_date || 'N/A'}</p></div>
              <div><Label>Supervisor</Label><p className="font-medium">{client.placement_supervisor || 'N/A'}</p></div>
            </CardContent>
          </Card>
          
          <Card className="mt-4">
            <CardHeader><CardTitle>External Employment</CardTitle></CardHeader>
            <CardContent className="grid grid-cols-2 gap-4">
              <div><Label>Employer</Label><p className="font-medium">{client.employer_name || 'N/A'}</p></div>
              <div><Label>Job Title</Label><p className="font-medium">{client.job_title || 'N/A'}</p></div>
              <div><Label>Start Date</Label><p className="font-medium">{client.job_start_date || 'N/A'}</p></div>
              <div><Label>Wage</Label><p className="font-medium">${client.job_wage?.toFixed(2) || 'N/A'}</p></div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}