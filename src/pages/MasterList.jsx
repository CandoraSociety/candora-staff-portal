import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function MasterList() {
  const { data: clients = [] } = useQuery({
    queryKey: ['clients-all'],
    queryFn: () => base44.entities.Client.list('-created_date', 100),
  });

  const activeClients = clients.filter(c => c.status !== 'closed');
  const closedClients = clients.filter(c => c.status === 'closed');

  return (
    <div className="max-w-7xl mx-auto px-6 py-8 space-y-8">
      <div>
        <h1 className="text-2xl font-bold font-display text-[#1a237e]">Master Client List</h1>
        <p className="text-muted-foreground mt-1">Complete database of all clients</p>
      </div>

      <Card>
        <CardContent className="p-6">
          <h2 className="text-lg font-semibold mb-4">Active Files ({activeClients.length})</h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-4">Name</th>
                  <th className="text-left py-3 px-4">Email</th>
                  <th className="text-left py-3 px-4">Service Type</th>
                  <th className="text-left py-3 px-4">Status</th>
                  <th className="text-left py-3 px-4">Assigned Worker</th>
                </tr>
              </thead>
              <tbody>
                {activeClients.map((client) => (
                  <tr key={client.id} className="border-b hover:bg-muted/50">
                    <td className="py-3 px-4 font-medium">{client.first_name} {client.last_name}</td>
                    <td className="py-3 px-4 text-sm">{client.email}</td>
                    <td className="py-3 px-4">
                      <Badge variant="outline">{client.service_type?.replace(/_/g, ' ')}</Badge>
                    </td>
                    <td className="py-3 px-4">
                      <Badge variant={client.status === 'active' ? 'default' : 'secondary'}>{client.status}</Badge>
                    </td>
                    <td className="py-3 px-4 text-sm">{client.assigned_worker_name || client.assigned_worker}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {closedClients.length > 0 && (
        <Card>
          <CardContent className="p-6">
            <h2 className="text-lg font-semibold mb-4">Closed Files ({closedClients.length})</h2>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4">Name</th>
                    <th className="text-left py-3 px-4">Email</th>
                    <th className="text-left py-3 px-4">Closed Date</th>
                  </tr>
                </thead>
                <tbody>
                  {closedClients.map((client) => (
                    <tr key={client.id} className="border-b hover:bg-muted/50">
                      <td className="py-3 px-4 font-medium">{client.first_name} {client.last_name}</td>
                      <td className="py-3 px-4 text-sm">{client.email}</td>
                      <td className="py-3 px-4 text-sm">{client.completion_date || 'N/A'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}