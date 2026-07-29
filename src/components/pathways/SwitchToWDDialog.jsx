import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { ArrowRightLeft } from 'lucide-react';
import { format } from 'date-fns';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';

export default function SwitchToWDDialog({ client, onClose, onSwitched }) {
  const [comments, setComments] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSwitch = async () => {
    setSaving(true);
    try {
      const existingSwitches = client.program_stream_switches || [];
      const newSwitch = {
        from_stream: 'direct_to_employment',
        to_stream: 'pathways',
        reason: 'switched_to_wd',
        date: format(new Date(), 'yyyy-MM-dd'),
        notes: comments.trim(),
      };
      const updated = await base44.entities.Client.update(client.id, {
        service_type: 'pathways',
        program_stream_switches: [...existingSwitches, newSwitch],
      });
      onSwitched?.(updated);
      toast.success(`${client.first_name} ${client.last_name} moved to WD`);
      onClose();
    } catch (e) {
      toast.error('Failed to switch client. Please try again.');
    }
    setSaving(false);
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent onClick={(e) => e.stopPropagation()}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ArrowRightLeft className="w-4 h-4 text-red-600" />
            Switch to Workforce Development (WD)
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <p className="text-sm text-slate-600">
            This will move <span className="font-semibold text-slate-800">{client.first_name} {client.last_name}</span> from DEA to WD.
            Use this when a client has started the program and is determined to be better suited to WD.
          </p>
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-slate-600">Comments</Label>
            <Textarea
              value={comments}
              onChange={(e) => setComments(e.target.value)}
              placeholder="Reason for switching to WD..."
              rows={3}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={saving}>Cancel</Button>
          <Button onClick={handleSwitch} disabled={saving}>
            {saving ? 'Switching...' : 'Switch to WD'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}