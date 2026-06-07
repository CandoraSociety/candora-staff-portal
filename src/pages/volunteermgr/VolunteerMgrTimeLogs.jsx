import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Search, Clock, Plus, Upload } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';
import moment from 'moment';

const statusColors = {
  signed_in: 'bg-green-50 text-green-700 border-green-200',
  completed: 'bg-blue-50 text-blue-700 border-blue-200',
  adjusted: 'bg-yellow-50 text-yellow-700 border-yellow-200',
};

const emptyForm = { volunteer_id: '', volunteer_name: '', position_title: '', date: '', total_hours: 0, status: 'completed', notes: '' };

export default function VolunteerMgrTimeLogs() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [formOpen, setFormOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [importFile, setImportFile] = useState(null);
  const queryClient = useQueryClient();

  const { data: timeLogs = [] } = useQuery({
    queryKey: ['vol-timelogs'],
    queryFn: () => base44.entities.VolunteerTimeLog.list('-date', 500),
  });

  const { data: volunteers = [] } = useQuery({
    queryKey: ['vol-volunteers'],
    queryFn: () => base44.entities.Volunteer.list('-created_date', 200),
  });

  const saveMutation = useMutation({
    mutationFn: (data) => base44.entities.VolunteerTimeLog.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vol-timelogs'] });
      queryClient.invalidateQueries({ queryKey: ['vol-timelogs-all'] });
      setFormOpen(false);
      setForm(emptyForm);
    },
  });

  const importMutation = useMutation({
    mutationFn: async (file) => {
      // Step 1: Upload file using Base44's UploadFile integration
      const uploadResponse = await base44.integrations.Core.UploadFile({ file });
      const fileUrl = uploadResponse.file_url;
      
      // Step 2: Call the import function with the file URL
      const importResult = await base44.functions.invoke('importTimeLogsFromSpreadsheet', { file_url: fileUrl });
      
      return importResult.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['vol-timelogs'] });
      queryClient.invalidateQueries({ queryKey: ['vol-timelogs-all'] });
      setImportOpen(false);
      setImportFile(null);
      if (data.summary) {
        alert(data.summary);
      } else {
        alert(`Successfully imported ${data.imported || 0} time logs`);
      }
    },
    onError: (error) => {
      console.error('Import error:', error);
      alert('Import failed: ' + (error.message || 'Unknown error'));
    },
  });

  const update = (f, v) => setForm(p => ({ ...p, [f]: v }));
  const selectVolunteer = (volId) => {
    const vol = volunteers.find(v => v.id === volId);
    setForm(p => ({ ...p, volunteer_id: volId, volunteer_name: vol ? `${vol.first_name} ${vol.last_name}` : '' }));
  };

  const filtered = timeLogs.filter(log => {
    const matchesSearch = (log.volunteer_name || '').toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'all' || log.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const totalHoursToday = timeLogs.filter(l => l.date === moment().format('YYYY-MM-DD') && l.total_hours).reduce((s, l) => s + l.total_hours, 0);
  const activeSignIns = timeLogs.filter(l => l.status === 'signed_in').length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold font-display">Time Logs</h1>
          <p className="text-sm text-muted-foreground mt-1">{timeLogs.length} total entries</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setImportOpen(true)} className="gap-2"><Upload className="w-4 h-4" /> Import Time Logs</Button>
          <Button onClick={() => setFormOpen(true)} className="gap-2"><Plus className="w-4 h-4" /> Log Hours</Button>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <Card><CardContent className="p-4 text-center"><p className="text-2xl font-bold">{activeSignIns}</p><p className="text-xs text-muted-foreground">Currently Signed In</p></CardContent></Card>
        <Card><CardContent className="p-4 text-center"><p className="text-2xl font-bold">{totalHoursToday.toFixed(1)}</p><p className="text-xs text-muted-foreground">Hours Today</p></CardContent></Card>
        <Card><CardContent className="p-4 text-center"><p className="text-2xl font-bold">{timeLogs.length}</p><p className="text-xs text-muted-foreground">Total Entries</p></CardContent></Card>
      </div>

      <div className="flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Search by volunteer name..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-36"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="signed_in">Signed In</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
            <SelectItem value="adjusted">Adjusted</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        {filtered.map(log => (
          <Card key={log.id} className="shadow-sm">
            <CardContent className="p-3 flex items-center gap-4">
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm">{log.volunteer_name}</p>
                <p className="text-xs text-muted-foreground">{log.position_title}</p>
              </div>
              <div className="text-xs text-muted-foreground text-right">
                <p>{moment(log.date || log.sign_in_time).format('MMM D, YYYY')}</p>
                {log.sign_in_time && <p className="flex items-center gap-1 justify-end"><Clock className="w-3 h-3" />{moment(log.sign_in_time).format('h:mm A')}{log.sign_out_time && ` → ${moment(log.sign_out_time).format('h:mm A')}`}</p>}
              </div>
              {log.total_hours != null && <span className="text-sm font-semibold w-12 text-right">{log.total_hours.toFixed(1)}h</span>}
              <Badge className={`text-xs border ${statusColors[log.status] || ''}`}>{log.status?.replace(/_/g, ' ')}</Badge>
            </CardContent>
          </Card>
        ))}
        {filtered.length === 0 && <div className="text-center py-12 text-muted-foreground">No time logs found.</div>}
      </div>

      <Dialog open={formOpen} onOpenChange={o => { setFormOpen(o); if (!o) setForm(emptyForm); }}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Log Volunteer Hours</DialogTitle></DialogHeader>
          <form onSubmit={e => { e.preventDefault(); saveMutation.mutate(form); }} className="space-y-4">
            <div>
              <Label>Volunteer *</Label>
              <Select value={form.volunteer_id} onValueChange={selectVolunteer}>
                <SelectTrigger><SelectValue placeholder="Select volunteer..." /></SelectTrigger>
                <SelectContent>
                  {volunteers.map(v => <SelectItem key={v.id} value={v.id}>{v.first_name} {v.last_name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div><Label>Position / Role</Label><Input value={form.position_title} onChange={e => update('position_title', e.target.value)} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Date *</Label><Input type="date" value={form.date} onChange={e => update('date', e.target.value)} required /></div>
              <div><Label>Hours *</Label><Input type="number" min="0" step="0.5" value={form.total_hours} onChange={e => update('total_hours', Number(e.target.value))} required /></div>
            </div>
            <div>
              <Label>Status</Label>
              <Select value={form.status} onValueChange={v => update('status', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="adjusted">Adjusted</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div><Label>Notes</Label><Textarea value={form.notes} onChange={e => update('notes', e.target.value)} rows={2} /></div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setFormOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={saveMutation.isPending}>{saveMutation.isPending ? 'Saving...' : 'Save'}</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={importOpen} onOpenChange={o => { setImportOpen(o); if (!o) setImportFile(null); }}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Import Time Logs from CSV</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground mb-2">Upload a CSV file with columns: volunteer_id, volunteer_name, position_id, position_title, sign_in_time, sign_out_time, total_hours, date, notes, status</p>
              <Input 
                type="file" 
                accept=".csv" 
                onChange={e => setImportFile(e.target.files?.[0] || null)} 
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setImportOpen(false)}>Cancel</Button>
              <Button 
                onClick={() => importFile && importMutation.mutate(importFile)} 
                disabled={!importFile || importMutation.isPending}
              >
                {importMutation.isPending ? 'Importing...' : 'Import'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}