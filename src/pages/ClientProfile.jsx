import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowLeft, User, Briefcase, DollarSign, FileText } from "lucide-react";

export default function ClientProfile() {
  const { id } = useParams();
  const navigate = useNavigate();

  const { data: client, isLoading } = useQuery({
    queryKey: ['client', id],
    queryFn: () => base44.entities.Client.get(id),
  });

  if (isLoading) return <div className="p-6">Loading...</div>;
  if (!client) return <div className="p-6">Client not found</div>;

  return (
    <div className="max-w-7xl mx-auto px-6 py-8 space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold font-display text-[#1a237e]">{client.first_name} {client.last_name}</h1>
          <p className="text-muted-foreground">{client.email}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Personal Info */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><User className="w-5 h-5" /> Personal</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p><strong>Phone:</strong> {client.phone || 'N/A'}</p>
            <p><strong>Address:</strong> {client.address || 'N/A'}, {client.city || 'N/A'}, {client.zip || 'N/A'}</p>
            <p><strong>CLB:</strong> {client.clb_level?.replace('_', ' ') || 'N/A'}</p>
            <p><strong>Residency:</strong> {client.residency_status?.replace(/_/g, ' ') || 'N/A'}</p>
            <p><strong>Vehicle:</strong> {client.has_vehicle?.replace('_', ' ') || 'N/A'}</p>
          </CardContent>
        </Card>

        {/* Case Info */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Briefcase className="w-5 h-5" /> Case</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p><strong>Service:</strong> <Badge variant="outline">{client.service_type?.replace(/_/g, ' ')}</Badge></p>
            <p><strong>Status:</strong> <Badge>{client.status}</Badge></p>
            <p><strong>Worker:</strong> {client.assigned_worker_name || client.assigned_worker}</p>
            <p><strong>Intake:</strong> {client.intake_date || 'N/A'}</p>
            <p><strong>Compass HSID:</strong> {client.compass_hsid || 'N/A'}</p>
          </CardContent>
        </Card>

        {/* Employment */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><DollarSign className="w-5 h-5" /> Employment</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p><strong>Status:</strong> {client.employment_status || 'N/A'}</p>
            <p><strong>Career Goals:</strong> {client.career_objectives || 'N/A'}</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs placeholder */}
      <Card>
        <CardHeader>
          <CardTitle>Client Management</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2 flex-wrap">
            <Button variant="outline">Edit Profile</Button>
            <Button variant="outline">Add Financial Record</Button>
            <Button variant="outline">Log Status Change</Button>
            <Button variant="outline">View Service Plan</Button>
          </div>
        </CardContent>
      </Card>

      {/* Notes */}
      {client.intake_notes && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><FileText className="w-5 h-5" /> Intake Notes</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm whitespace-pre-wrap">{client.intake_notes}</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}