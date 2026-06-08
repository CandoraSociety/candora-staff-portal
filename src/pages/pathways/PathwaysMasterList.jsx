import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Link } from 'react-router-dom';
import { Search, FileText, UserCheck, UserX } from 'lucide-react';

export default function PathwaysMasterList() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('active');
  
  const { data: clients = [] } = useQuery({
    queryKey: ['pathways-clients-all'],
    queryFn: () => base44.entities.Client.list('-created_date', 1000),
  });
  
  const filteredClients = clients.filter(c => {
    const matchesSearch = 
      c.first_name.toLowerCase().includes(search.toLowerCase()) ||
      c.last_name.toLowerCase().includes(search.toLowerCase()) ||
      c.email?.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'all' || c.status === statusFilter;
    return matchesSearch && matchesStatus;
  });
  
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Master Client List</h1>
        <p className="text-sm text-slate-600">Browse all client files</p>
      </div>
      
      <div className="flex gap-3">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Search by name or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex gap-2">
          <Button variant={statusFilter === 'active' ? 'default' : 'outline'} onClick={() => setStatusFilter('active')}>
            Active
          </Button>
          <Button variant={statusFilter === 'closed' ? 'default' : 'outline'} onClick={() => setStatusFilter('closed')}>
            Closed
          </Button>
          <Button variant={statusFilter === 'all' ? 'default' : 'outline'} onClick={() => setStatusFilter('all')}>
            All
          </Button>
        </div>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Clients ({filteredClients.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-3 font-medium">Name</th>
                  <th className="text-left p-3 font-medium">Email</th>
                  <th className="text-left p-3 font-medium">Service Type</th>
                  <th className="text-left p-3 font-medium">Status</th>
                  <th className="text-left p-3 font-medium">Assigned Worker</th>
                  <th className="text-left p-3 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredClients.map((client) => (
                  <tr key={client.id} className="border-b hover:bg-slate-50">
                    <td className="p-3 font-medium">{client.first_name} {client.last_name}</td>
                    <td className="p-3 text-slate-600">{client.email}</td>
                    <td className="p-3">
                      <Badge variant="outline">{client.service_type?.replace(/_/g, ' ')}</Badge>
                    </td>
                    <td className="p-3">
                      <Badge variant={client.status === 'active' ? 'default' : client.status === 'new' ? 'secondary' : 'outline'}>
                        {client.status}
                      </Badge>
                    </td>
                    <td className="p-3 text-sm">{client.assigned_worker_name || client.assigned_worker || 'Unassigned'}</td>
                    <td className="p-3">
                      <Link to={`/pathways/client/${client.id}`}>
                        <Button size="sm" variant="outline">View Profile</Button>
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filteredClients.length === 0 && (
              <div className="text-center py-12 text-slate-500">
                <FileText className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>No clients found</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}