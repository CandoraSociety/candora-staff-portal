import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft, User, FileText, DollarSign, Users } from 'lucide-react';
import { Link } from 'react-router-dom';
import moment from 'moment';

export default function PathwaysClientProfile() {
  const { id } = useParams();
  
  const { data: client, isLoading } = useQuery({
    queryKey: ['pathways-client', id],
    queryFn: () => base44.entities.Client.get(id),
  });
  
  if (isLoading || !client) {
    return <div className="text-center py-12">Loading...</div>;
  }
  
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link to="/pathways/master">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-slate-800">{client.first_name} {client.last_name}</h1>
          <p className="text-sm text-slate-600">{client.email} • {client.phone}</p>
        </div>
      </div>
      
      <div className="flex gap-2">
        <Badge variant={client.status === 'active' ? 'default' : 'outline'}>{client.status}</Badge>
        <Badge variant="outline">{client.service_type?.replace(/_/g, ' ')}</Badge>
        {client.compass_verified && <Badge variant="secondary">Compass Verified</Badge>}
      </div>
      
      <Tabs defaultValue="overview" className="w-full">
        <TabsList>
          <TabsTrigger value="overview">
            <User className="h-4 w-4 mr-2" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="financials">
            <DollarSign className="h-4 w-4 mr-2" />
            Financials
          </TabsTrigger>
          <TabsTrigger value="referrals">
            <Users className="h-4 w-4 mr-2" />
            Referrals
          </TabsTrigger>
          <TabsTrigger value="notes">
            <FileText className="h-4 w-4 mr-2" />
            Notes
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview" className="space-y-4">
          <Card>
            <CardHeader><CardTitle>Personal Information</CardTitle></CardHeader>
            <CardContent className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-slate-600">Date of Birth</p>
                <p className="font-medium">{client.date_of_birth ? moment(client.date_of_birth).format('MMM D, YYYY') : 'Not provided'}</p>
              </div>
              <div>
                <p className="text-sm text-slate-600">Sex</p>
                <p className="font-medium capitalize">{client.sex || 'Not provided'}</p>
              </div>
              <div>
                <p className="text-sm text-slate-600">Address</p>
                <p className="font-medium">{client.address || 'Not provided'}</p>
              </div>
              <div>
                <p className="text-sm text-slate-600">City</p>
                <p className="font-medium">{client.city || 'Not provided'}</p>
              </div>
              <div>
                <p className="text-sm text-slate-600">Residency Status</p>
                <p className="font-medium capitalize">{client.residency_status?.replace(/_/g, ' ') || 'Not provided'}</p>
              </div>
              <div>
                <p className="text-sm text-slate-600">CLB Level</p>
                <p className="font-medium uppercase">{client.clb_level || 'Not provided'}</p>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader><CardTitle>Case Information</CardTitle></CardHeader>
            <CardContent className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-slate-600">Assigned Worker</p>
                <p className="font-medium">{client.assigned_worker_name || client.assigned_worker || 'Unassigned'}</p>
              </div>
              <div>
                <p className="text-sm text-slate-600">Service Start Date</p>
                <p className="font-medium">{client.service_start_date ? moment(client.service_start_date).format('MMM D, YYYY') : 'Not set'}</p>
              </div>
              <div>
                <p className="text-sm text-slate-600">Employment Status</p>
                <p className="font-medium">{client.employment_status || 'Not provided'}</p>
              </div>
              <div>
                <p className="text-sm text-slate-600">Compass HSID</p>
                <p className="font-medium">{client.compass_hsid || 'Not verified'}</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="financials">
          <Card>
            <CardHeader><CardTitle>Financial Records</CardTitle></CardHeader>
            <CardContent>
              <p className="text-slate-600">Financial records will be displayed here.</p>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="referrals">
          <Card>
            <CardHeader><CardTitle>Referrals & Placements</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm font-medium mb-2">Internal Referrals</p>
                {client.internal_referrals?.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {client.internal_referrals.map((ref, i) => (
                      <Badge key={i}>{ref}</Badge>
                    ))}
                  </div>
                ) : (
                  <p className="text-slate-600 text-sm">No internal referrals</p>
                )}
              </div>
              <div>
                <p className="text-sm font-medium mb-2">External Referrals</p>
                {client.external_referrals?.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {client.external_referrals.map((ref, i) => (
                      <Badge key={i} variant="outline">{ref}</Badge>
                    ))}
                  </div>
                ) : (
                  <p className="text-slate-600 text-sm">No external referrals</p>
                )}
              </div>
              <div>
                <p className="text-sm font-medium mb-2">Internal Placement</p>
                <Badge variant={client.internal_placement && client.internal_placement !== 'none' ? 'default' : 'outline'}>
                  {client.internal_placement?.replace(/_/g, ' ') || 'None'}
                </Badge>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="notes">
          <Card>
            <CardHeader><CardTitle>Intake Notes</CardTitle></CardHeader>
            <CardContent>
              <p className="text-slate-700 whitespace-pre-wrap">{client.intake_notes || 'No notes'}</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}