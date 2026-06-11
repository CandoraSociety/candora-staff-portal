import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Trash2, Plus } from 'lucide-react';
import { format, parseISO } from 'date-fns';

const STATUS_OPTIONS = ['upcoming','in_progress','submitted','accepted','overdue'];
const DEADLINE_TYPES = ['progress_report','interim_report','final_report','financial_report','outcome_report','other'];

const STATUS_COLORS = {
  upcoming: 'bg-blue-100 text-blue-700',
  in_progress: 'bg-yellow-100 text-yellow-700',
  submitted: 'bg-purple-100 text-purple-700',
  accepted: 'bg-green-100 text-green-700',
  overdue: 'bg-red-100 text-red-700',
};

export default function ManageDeadlinesModal({ hub, onClose }) {
  const queryClient = useQueryClient();
  const [newDeadline, setNewDeadline] = useState({ title: '', deadline_type: 'progress_report', due_date: '' });
  const [adding, setAdding] = useState(false);

  const { data: deadlines = [], refetch } = useQuery({
    queryKey: ['funder-deadlines', hub.id],
    queryFn: () => base44.entities.FunderReportingDeadline.filter({ hub_id: hub.id }),
  });

  const handleStatusChange = async (id, status) => {
    await base44.entities.FunderReportingDeadline.update(id, { status });
    refetch();
    queryClient.invalidateQueries(['funder-deadlines']);
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this deadline?')) return;
    await base44.entities.FunderReportingDeadline.delete(id);
    refetch();
    queryClient.invalidateQueries(['funder-deadlines']);
  };

  const handleAdd = async () => {
    if (!newDeadline.title || !newDeadline.due_date) return;
    setAdding(true);
    await base44.entities.FunderReportingDeadline.create({
      hub_id: hub.id,
      ...newDeadline,
      status: 'upcoming',
    });
    setNewDeadline({ title: '', deadline_type: 'progress_report', due_date: '' });
    refetch();
    queryClient.invalidateQueries(['funder-deadlines']);
    setAdding(false);
  };

  const sorted = [...deadlines].sort((a, b) => (a.due_date || '').localeCompare(b.due_date || ''));

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Deadlines — {hub.name}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3 pt-2">
          {sorted.length === 0 && <p className="text-sm text-muted-foreground text-center py-4">No deadlines yet</p>}
          {sorted.map(d => (
            <div key={d.id} className="flex items-center gap-2 p-2 border border-border rounded-lg">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{d.title}</p>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-xs text-muted-foreground capitalize">{d.deadline_type?.replace(/_/g, ' ')}</span>
                  {d.due_date && <span className="text-xs text-muted-foreground">{format(parseISO(d.due_date), 'MMM d, yyyy')}</span>}
                </div>
              </div>
              <select
                value={d.status}
                onChange={e => handleStatusChange(d.id, e.target.value)}
                className={`text-xs px-2 py-1 rounded-full border-0 font-medium cursor-pointer ${STATUS_COLORS[d.status] || 'bg-gray-100 text-gray-700'}`}
              >
                {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>)}
              </select>
              <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive flex-shrink-0" onClick={() => handleDelete(d.id)}>
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
          ))}

          {/* Add new deadline */}
          <div className="border-t border-border pt-3">
            <p className="text-xs font-semibold text-muted-foreground mb-2">Add Deadline</p>
            <div className="grid grid-cols-[1fr_auto_auto_auto] gap-2 items-center">
              <Input value={newDeadline.title} onChange={e => setNewDeadline(d => ({ ...d, title: e.target.value }))} placeholder="Label" className="text-xs h-8" />
              <Input type="date" value={newDeadline.due_date} onChange={e => setNewDeadline(d => ({ ...d, due_date: e.target.value }))} className="text-xs h-8 w-36" />
              <select value={newDeadline.deadline_type} onChange={e => setNewDeadline(d => ({ ...d, deadline_type: e.target.value }))} className="h-8 rounded-md border border-input bg-transparent px-2 text-xs">
                {DEADLINE_TYPES.map(t => <option key={t} value={t}>{t.replace(/_/g, ' ')}</option>)}
              </select>
              <Button size="icon" className="h-8 w-8" onClick={handleAdd} disabled={adding || !newDeadline.title || !newDeadline.due_date}>
                <Plus className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <Button variant="outline" onClick={onClose}>Close</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}