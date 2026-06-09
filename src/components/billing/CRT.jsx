import { useState, useEffect } from "react";
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { FileText, Filter, X } from 'lucide-react';
import moment from 'moment';

const DATE_FIELDS = [
  { value: 'any', label: 'Any date field' },
  { value: 'intake_date', label: 'Intake Date' },
  { value: 'service_start_date', label: 'Service Start Date' },
  { value: 'completion_date', label: 'Completion Date' },
  { value: 'employment_start_date', label: 'Employment Start Date' },
  { value: 'post_completion_employment_date', label: 'Post-Comp. Employment Date' },
  { value: 'followup_90day_date', label: '90-Day Follow-Up Date' },
  { value: 'closed_date', label: 'File Closed Date' },
];

const EMPLOYMENT_STATUSES = [
  { value: '', label: 'All' },
  { value: 'E-RF', label: 'E-RF — Employed, Related Field' },
  { value: 'E-UF', label: 'E-UF — Employed, Unrelated Field' },
  { value: 'E-PT', label: 'E-PT — Employed, Part-Time' },
  { value: 'UE', label: 'UE — Unemployed' },
  { value: 'UE-LFW', label: 'UE-LFW — Looking for Work' },
  { value: 'UE-S', label: 'UE-S — Student' },
  { value: 'NA', label: 'NA — Not Available' },
];

const PROGRAM_STATUSES = [
  { value: '', label: 'All' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'complete', label: 'Complete' },
  { value: 'incomplete', label: 'Incomplete' },
  { value: 'cancelled', label: 'Cancelled' },
];

const SERVICE_TYPES = [
  { value: '', label: 'All' },
  { value: 'direct_to_employment', label: 'DEA' },
  { value: 'pathways', label: 'Pathways' },
  { value: 'casual', label: 'Casual' },
  { value: 'external_referral', label: 'Ext. Referral' },
  { value: 'internal_referral', label: 'Int. Referral' },
  { value: 'not_eligible', label: 'Not Eligible' },
];

export default function CRT() {
  const [loading, setLoading] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  
  // Filter state
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [dateField, setDateField] = useState('any');
  const [filterProgramStatus, setFilterProgramStatus] = useState('');
  const [filterEmploymentStatus, setFilterEmploymentStatus] = useState('');
  const [filterServiceType, setFilterServiceType] = useState('');
  const [filterWorker, setFilterWorker] = useState('');

  const { data: clients = [], isLoading: clientsLoading } = useQuery({
    queryKey: ['crt-clients'],
    queryFn: () => base44.entities.Client.list(),
  });

  const { data: financials = [] } = useQuery({
    queryKey: ['crt-financials'],
    queryFn: () => base44.entities.FinancialRecord.list(),
  });

  // Get unique workers for filter
  const workers = [...new Set(clients.filter(c => c.assigned_worker_name).map(c => c.assigned_worker_name))].sort();

  // Filter clients
  const filteredClients = clients.filter(client => {
    // Date range filter
    if (dateFrom || dateTo) {
      const dateValue = dateField === 'any' 
        ? Object.values(DATE_FIELDS.filter(f => f.value !== 'any').map(f => client[f.value])).find(d => d)
        : client[dateField];
      
      if (dateValue) {
        if (dateFrom && dateValue < dateFrom) return false;
        if (dateTo && dateValue > dateTo) return false;
      } else if (dateField !== 'any') {
        return false;
      }
    }

    // Other filters
    if (filterProgramStatus && client.program_status !== filterProgramStatus) return false;
    if (filterEmploymentStatus && client.employment_status !== filterEmploymentStatus) return false;
    if (filterServiceType && client.service_type !== filterServiceType) return false;
    if (filterWorker && client.assigned_worker_name !== filterWorker) return false;

    return true;
  });

  const activeFilterCount = [
    dateFrom,
    dateTo,
    filterProgramStatus,
    filterEmploymentStatus,
    filterServiceType,
    filterWorker,
  ].filter(Boolean).length;

  const clearFilters = () => {
    setDateFrom('');
    setDateTo('');
    setDateField('any');
    setFilterProgramStatus('');
    setFilterEmploymentStatus('');
    setFilterServiceType('');
    setFilterWorker('');
  };

  return (
    <div className="space-y-4">
      {/* Filter Bar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowFilters(!showFilters)}
          >
            <Filter className="h-4 w-4 mr-2" />
            Filters
            {activeFilterCount > 0 && (
              <Badge variant="secondary" className="ml-2 h-5 w-5 p-0 flex items-center justify-center text-xs">
                {activeFilterCount}
              </Badge>
            )}
          </Button>
          {activeFilterCount > 0 && (
            <Button variant="ghost" size="sm" onClick={clearFilters} className="text-xs">
              Clear all
            </Button>
          )}
          <Badge variant="outline" className="ml-2">
            {filteredClients.length} / {clients.length} clients
          </Badge>
        </div>
      </div>

      {/* Filter Panel */}
      {showFilters && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Filter Clients</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Date Range */}
            <div className="space-y-2">
              <Label>Date Range</Label>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label className="text-xs">Date Field</Label>
                  <Select value={dateField} onValueChange={setDateField}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {DATE_FIELDS.map(field => (
                        <SelectItem key={field.value} value={field.value}>
                          {field.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs">From</Label>
                  <Input
                    type="date"
                    value={dateFrom}
                    onChange={(e) => setDateFrom(e.target.value)}
                  />
                </div>
                <div>
                  <Label className="text-xs">To</Label>
                  <Input
                    type="date"
                    value={dateTo}
                    onChange={(e) => setDateTo(e.target.value)}
                  />
                </div>
              </div>
            </div>

            {/* Other Filters */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <Label className="text-xs">Program Status</Label>
                <Select value={filterProgramStatus} onValueChange={setFilterProgramStatus}>
                  <SelectTrigger>
                    <SelectValue placeholder="All" />
                  </SelectTrigger>
                  <SelectContent>
                    {PROGRAM_STATUSES.map(status => (
                      <SelectItem key={status.value} value={status.value}>
                        {status.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs">Employment Status</Label>
                <Select value={filterEmploymentStatus} onValueChange={setFilterEmploymentStatus}>
                  <SelectTrigger>
                    <SelectValue placeholder="All" />
                  </SelectTrigger>
                  <SelectContent>
                    {EMPLOYMENT_STATUSES.map(status => (
                      <SelectItem key={status.value} value={status.value}>
                        {status.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs">Service Element</Label>
                <Select value={filterServiceType} onValueChange={setFilterServiceType}>
                  <SelectTrigger>
                    <SelectValue placeholder="All" />
                  </SelectTrigger>
                  <SelectContent>
                    {SERVICE_TYPES.map(type => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {workers.length > 0 && (
                <div>
                  <Label className="text-xs">Career Counsellor</Label>
                  <Select value={filterWorker} onValueChange={setFilterWorker}>
                    <SelectTrigger>
                      <SelectValue placeholder="All" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={null}>All</SelectItem>
                      {workers.map(worker => (
                        <SelectItem key={worker} value={worker}>
                          {worker}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* CRT Tabs */}
      <Tabs defaultValue="client_data" className="space-y-4">
        <TabsList>
          <TabsTrigger value="client_data">Client Data</TabsTrigger>
          <TabsTrigger value="outcomes">Outcomes Tracker</TabsTrigger>
          <TabsTrigger value="financials">Financial Records</TabsTrigger>
        </TabsList>

        <TabsContent value="client_data">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Client Data Export</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-slate-600 mb-4">
                Tabular view of all client demographic and outcome data for CRT export
              </p>
              {filteredClients.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b bg-slate-50">
                        <th className="text-left py-2 px-3">Client Name</th>
                        <th className="text-left py-2 px-3">Service Type</th>
                        <th className="text-left py-2 px-3">Program Status</th>
                        <th className="text-left py-2 px-3">Employment Status</th>
                        <th className="text-left py-2 px-3">Intake Date</th>
                        <th className="text-left py-2 px-3">Completion Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredClients.map(client => (
                        <tr key={client.id} className="border-b last:border-0">
                          <td className="py-2 px-3 font-medium">
                            {client.first_name} {client.last_name}
                          </td>
                          <td className="py-2 px-3 capitalize">{client.service_type?.replace('_', ' ')}</td>
                          <td className="py-2 px-3">
                            <Badge variant="outline">{client.program_status}</Badge>
                          </td>
                          <td className="py-2 px-3">{client.employment_status}</td>
                          <td className="py-2 px-3">{client.intake_date || '-'}</td>
                          <td className="py-2 px-3">{client.completion_date || '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-8 text-slate-500">
                  <FileText className="h-12 w-12 mx-auto mb-2 text-slate-400" />
                  <p>No clients match the current filters</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="outcomes">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Outcomes Tracker</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-slate-600 mb-4">
                Aggregated outcome metrics for filtered clients
              </p>
              {filteredClients.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium">DEA Starters</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-2xl font-bold">
                        {filteredClients.filter(c => 
                          c.service_type === 'direct_to_employment' && 
                          c.service_start_date &&
                          (!dateFrom || c.service_start_date >= dateFrom) &&
                          (!dateTo || c.service_start_date <= dateTo)
                        ).length}
                      </p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium">DEA Completers</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-2xl font-bold">
                        {filteredClients.filter(c => 
                          c.service_type === 'direct_to_employment' && 
                          c.completion_date &&
                          c.program_status === 'complete'
                        ).length}
                      </p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium">Employment Outcomes</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-2xl font-bold text-green-600">
                        {filteredClients.filter(c => 
                          ['E-RF', 'E-UF', 'E-PT'].includes(c.post_completion_employment_status)
                        ).length}
                      </p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium">90-Day Follow-Up</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-2xl font-bold text-green-600">
                        {filteredClients.filter(c => 
                          ['E-RF', 'E-UF', 'E-PT'].includes(c.followup_90day_status)
                        ).length}
                      </p>
                    </CardContent>
                  </Card>
                </div>
              ) : (
                <div className="text-center py-8 text-slate-500">
                  <FileText className="h-12 w-12 mx-auto mb-2 text-slate-400" />
                  <p>No clients match the current filters</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="financials">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Financial Records</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-slate-600 mb-4">
                Financial records (exposure courses, placements, supports) for filtered clients
              </p>
              {financials.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b bg-slate-50">
                        <th className="text-left py-2 px-3">Client</th>
                        <th className="text-left py-2 px-3">Type</th>
                        <th className="text-left py-2 px-3">Description</th>
                        <th className="text-left py-2 px-3">Date</th>
                        <th className="text-right py-2 px-3">Amount</th>
                        <th className="text-right py-2 px-3">Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {financials
                        .filter(f => filteredClients.some(c => c.id === f.client_id))
                        .map(record => (
                        <tr key={record.id} className="border-b last:border-0">
                          <td className="py-2 px-3 font-medium">{record.client_name}</td>
                          <td className="py-2 px-3 capitalize">{record.record_type?.replace('_', ' ')}</td>
                          <td className="py-2 px-3 max-w-[200px] truncate">{record.description}</td>
                          <td className="py-2 px-3">{record.date}</td>
                          <td className="text-right py-2 px-3">${record.amount?.toFixed(2)}</td>
                          <td className="text-right py-2 px-3 font-bold">${record.total?.toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-8 text-slate-500">
                  <FileText className="h-12 w-12 mx-auto mb-2 text-slate-400" />
                  <p>No financial records found</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}