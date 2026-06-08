import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Users, AlertCircle, CheckCircle, Clock } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function WorkerDashboard() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");

  const { data: clients = [] } = useQuery({
    queryKey: ['clients-all'],
    queryFn: () => base44.entities.Client.list('-created_date', 100),
  });

  // Filter to assigned clients (in real app, filter by current user email)
  const myClients = clients; // TODO: Filter by assigned_worker === currentUser.email
  
  const activeClients = myClients.filter(c => c.status === 'active');
  const newClients = myClients.filter(c => c.status === 'new');
  const followUpsDue = myClients.filter(c => {
    if (!c.followup_90day_date) return false;
    const daysUntil = new Date(c.followup_90day_date).getTime() - new Date().getTime();
    return daysUntil <= 7 * 24 * 60 * 60 * 1000 && daysUntil >= 0;
  });

  return (
    <div className="max-w-7xl mx-auto px-6 py-8 space-y-8">
      <div>
        <h1 className="text-2xl font-bold font-display text-[#1a237e]">My Dashboard</h1>
        <p className="text-muted-foreground mt-1">Manage your assigned clients</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="bg-blue-100 p-3 rounded-lg">
                <Users className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Clients</p>
                <p className="text-2xl font-bold">{myClients.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="bg-green-100 p-3 rounded-lg">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Active</p>
                <p className="text-2xl font-bold">{activeClients.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="bg-amber-100 p-3 rounded-lg">
                <Clock className="w-6 h-6 text-amber-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Follow-ups Due</p>
                <p className="text-2xl font-bold">{followUpsDue.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="bg-purple-100 p-3 rounded-lg">
                <AlertCircle className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">New Intakes</p>
                <p className="text-2xl font-bold">{newClients.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Client List */}
      <Card>
        <CardHeader>
          <CardTitle>My Clients</CardTitle>
          <Input
            placeholder="Search clients..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="max-w-sm"
          />
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {myClients
              .filter(c => 
                c.first_name.toLowerCase().includes(search.toLowerCase()) ||
                c.last_name.toLowerCase().includes(search.toLowerCase())
              )
              .map((client) => (
                <div
                  key={client.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 cursor-pointer"
                  onClick={() => navigate(`/client/${client.id}`)}
                >
                  <div>
                    <p className="font-medium">{client.first_name} {client.last_name}</p>
                    <p className="text-sm text-muted-foreground">{client.email}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge variant={client.status === 'active' ? 'default' : 'secondary'}>
                      {client.status}
                    </Badge>
                    <Badge variant="outline">{client.service_type?.replace(/_/g, ' ')}</Badge>
                  </div>
                </div>
              ))}
            {myClients.length === 0 && (
              <p className="text-center text-muted-foreground py-8">No clients yet</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}