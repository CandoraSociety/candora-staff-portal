import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Plus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function CreateReportDialog({ open, onClose }) {
  const navigate = useNavigate();
  const [title, setTitle] = useState('');
  const [year, setYear] = useState(new Date().getFullYear());
  const [description, setDescription] = useState('');
  const [creating, setCreating] = useState(false);

  const handleCreate = async () => {
    if (!title.trim() || creating) return;
    setCreating(true);
    try {
      const report = await base44.entities.AGRReport.create({ title: title.trim(), year, description, status: 'draft' });
      navigate(`/reporting/agr/${report.id}/edit`);
    } catch {}
    setCreating(false);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader><DialogTitle>Create Annual General Report</DialogTitle></DialogHeader>
        <div className="space-y-4">
          <div>
            <Label>Report Title *</Label>
            <Input value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. 2025 Annual General Report" className="mt-1" onKeyDown={e => e.key === 'Enter' && handleCreate()} />
          </div>
          <div>
            <Label>Fiscal Year</Label>
            <Input type="number" value={year} onChange={e => setYear(parseInt(e.target.value) || new Date().getFullYear())} className="mt-1" />
          </div>
          <div>
            <Label>Description (optional)</Label>
            <Textarea rows={2} value={description} onChange={e => setDescription(e.target.value)} placeholder="Brief subtitle or description..." className="mt-1" />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleCreate} disabled={!title.trim() || creating}>
            {creating ? 'Creating...' : 'Create Report'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}