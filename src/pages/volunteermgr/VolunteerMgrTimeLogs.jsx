import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Clock, Plus, Upload, Search, Filter, Download, FileDown } from 'lucide-react';
import moment from 'moment-timezone';
import TimeLogsStats from '@/components/timelogs/TimeLogsStats';
import { toast } from 'sonner';

export default function VolunteerMgrTimeLogs() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [importFile, setImportFile] = useState(null);
  const [formData, setFormData] = useState({
    volunteer_id: '',
    position_title: '',
    date: moment().format('YYYY-MM-DD'),
    sign_in_time: '',
    sign_out_time: '',
    total_hours: '',
    notes: ''
  });
  const queryClient = useQueryClient();

  const { data: timeLogs = [], isLoading } = useQuery({
    queryKey: ['volunteer-timelogs'],
    queryFn: () => base44.entities.VolunteerTimeLog.list('-date', 5000),
  });

  const { data: volunteers = [] } = useQuery({
    queryKey: ['volunteers-list'],
    queryFn: () => base44.entities.Volunteer.list(),
  });

  const saveMutation = useMutation({
    mutationFn: async (data) => {
      const volunteer = volunteers.find(v => v.id === data.volunteer_id);
      return base44.entities.VolunteerTimeLog.create({
        volunteer_id: data.volunteer_id,
        volunteer_name: volunteer ? `${volunteer.first_name} ${volunteer.last_name}` : 'Unknown',
        position_title: data.position_title || 'General',
        date: data.date,
        sign_in_time: data.sign_in_time ? new Date(data.sign_in_time).toISOString() : null,
        sign_out_time: data.sign_out_time ? new Date(data.sign_out_time).toISOString() : null,
        total_hours: parseFloat(data.total_hours) || 0,
        status: data.sign_out_time ? 'completed' : 'signed_in',
        notes: data.notes
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['volunteer-timelogs'] });
      setAddDialogOpen(false);
      setFormData({
        volunteer_id: '',
        position_title: '',
        date: moment().format('YYYY-MM-DD'),
        sign_in_time: '',
        sign_out_time: '',
        total_hours: '',
        notes: ''
      });
      toast.success('Time log added successfully');
    }
  });

  const importMutation = useMutation({
    mutationFn: async (file) => {
      const formData = new FormData();
      formData.append('file', file);
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      return base44.functions.invoke('importTimeLogsFromSpreadsheet', { file_url });
    },
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ['volunteer-timelogs'] });
      setImportDialogOpen(false);
      setImportFile(null);
      toast.success(`Imported ${response.imported || 0} time logs`);
    },
    onError: (error) => {
      toast.error('Import failed: ' + error.message);
    }
  });

  const filteredLogs = timeLogs.filter(log => {
    if (statusFilter !== 'all' && log.status !== statusFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      return log.volunteer_name?.toLowerCase().includes(q) ||
             log.position_title?.toLowerCase().includes(q);
    }
    return true;
  });

  const statusColors = {
    signed_in: 'bg-green-50 text-green-700 border-green-200',
    completed: 'bg-blue-50 text-blue-700 border-blue-200',
    adjusted: 'bg-yellow-50 text-yellow-700 border-yellow-200'
  };

  const handleSave = () => {
    if (!formData.volunteer_id) {
      toast.error('Please select a volunteer');
      return;
    }
    saveMutation.mutate(formData);
  };

  const handleImport = () => {
    if (!importFile) {
      toast.error('Please select a file');
      return;
    }
    importMutation.mutate(importFile);
  };

  const handleExport = async () => {
    try {
      const response = await base44.functions.invoke('exportTimeLogsCSV', {});
      // Create download link
      const blob = new Blob([response.csv], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `time-logs-${moment().format('YYYY-MM-DD')}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast.success('Time logs exported successfully');
    } catch (error) {
      toast.error('Export failed: ' + error.message);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold">Time Logs</h1>
          <p className="text-sm text-muted-foreground">Track volunteer hours and attendance</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleExport} className="gap-2">
            <FileDown className="w-4 h-4" />
            Export
          </Button>

          <Dialog open={importDialogOpen} onOpenChange={setImportDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" className="gap-2">
                <Upload className="w-4 h-4" />
                Import
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Import Time Logs</DialogTitle>
                <DialogDescription>
                  Upload a CSV file with columns: volunteer_email, date, sign_in_time, sign_out_time, total_hours, position_title
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>CSV File</Label>
                  <Input
                    type="file"
                    accept=".csv"
                    onChange={(e) => setImportFile(e.target.files[0])}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setImportDialogOpen(false)}>Cancel</Button>
                <Button onClick={handleImport} disabled={!importFile || importMutation.isPending}>
                  {importMutation.isPending ? 'Importing...' : 'Import'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="w-4 h-4" />
                Add Time Log
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>Add Time Log</DialogTitle>
                <DialogDescription>Record volunteer hours manually</DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>Volunteer</Label>
                  <Select value={formData.volunteer_id} onValueChange={(v) => setFormData({ ...formData, volunteer_id: v })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select volunteer" />
                    </SelectTrigger>
                    <SelectContent>
                      {volunteers.map(v => (
                        <SelectItem key={v.id} value={v.id}>
                          {v.first_name} {v.last_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Position / Role</Label>
                  <Input
                    placeholder="e.g., Kitchen Helper, Driver"
                    value={formData.position_title}
                    onChange={(e) => setFormData({ ...formData, position_title: e.target.value })}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Date</Label>
                    <Input
                      type="date"
                      value={formData.date}
                      onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label>Total Hours</Label>
                    <Input
                      type="number"
                      step="0.25"
                      placeholder="0.00"
                      value={formData.total_hours}
                      onChange={(e) => setFormData({ ...formData, total_hours: e.target.value })}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Sign In Time</Label>
                    <Input
                      type="datetime-local"
                      value={formData.sign_in_time}
                      onChange={(e) => setFormData({ ...formData, sign_in_time: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label>Sign Out Time</Label>
                    <Input
                      type="datetime-local"
                      value={formData.sign_out_time}
                      onChange={(e) => setFormData({ ...formData, sign_out_time: e.target.value })}
                    />
                  </div>
                </div>
                <div>
                  <Label>Notes</Label>
                  <Input
                    placeholder="Additional details"
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setAddDialogOpen(false)}>Cancel</Button>
                <Button onClick={handleSave} disabled={saveMutation.isPending}>
                  {saveMutation.isPending ? 'Saving...' : 'Save'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Stats */}
      <TimeLogsStats timeLogs={timeLogs} />

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-4 items-end">
            <div className="flex-1">
              <Label>Search</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search by volunteer or position..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
            <div className="w-48">
              <Label>Status</Label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="signed_in">Signed In</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="adjusted">Adjusted</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Time Logs List */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">
            {filteredLogs.length} time log{filteredLogs.length !== 1 ? 's' : ''}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-12 text-muted-foreground">Loading...</div>
          ) : filteredLogs.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Clock className="w-12 h-12 mx-auto mb-4 opacity-20" />
              <p>No time logs found</p>
            </div>
          ) : (
            <div className="space-y-2">
              {filteredLogs.slice(0, 100).map((log) => (
                <div
                  key={log.id}
                  className="flex items-center justify-between p-4 bg-muted/40 rounded-lg border border-border/50"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <p className="font-medium">{log.volunteer_name}</p>
                      <Badge variant="outline" className={statusColors[log.status]}>
                        {log.status?.replace(/_/g, ' ')}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                      <span>{log.position_title || 'General'}</span>
                      <span>•</span>
                      <span>{moment(log.date || log.sign_in_time).format('MMM D, YYYY')}</span>
                      {log.total_hours && (
                        <>
                          <span>•</span>
                          <span className="text-primary font-medium">{log.total_hours}h</span>
                        </>
                      )}
                    </div>
                  </div>
                  <div className="text-right text-sm text-muted-foreground">
                    {log.sign_in_time && (
                      <p>{moment(log.sign_in_time).format('h:mm A')}</p>
                    )}
                    {log.sign_out_time && (
                      <p>{moment(log.sign_out_time).format('h:mm A')}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}