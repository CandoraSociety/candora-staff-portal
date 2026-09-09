import React, { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';
import { GRAB_AND_GO_OPTIONS, logGrabAndGoVisit } from '@/lib/rcClientVisits';

export default function GrabAndGoDialog({ open, onOpenChange, client, onSaved }) {
  const { toast } = useToast();
  const [resourceType, setResourceType] = useState('');
  const [resourceOther, setResourceOther] = useState('');
  const [comments, setComments] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) { setResourceType(''); setResourceOther(''); setComments(''); }
  }, [open]);

  const handleSave = async () => {
    if (!resourceType) { toast({ title: 'Select a resource', variant: 'destructive' }); return; }
    if (resourceType === 'other' && !resourceOther.trim()) { toast({ title: 'Specify the other resource', variant: 'destructive' }); return; }
    setSaving(true);
    try {
      await logGrabAndGoVisit({ client, resourceType, resourceOther, comments });
      toast({ title: 'Grab and go visit logged', description: 'Added to the client\'s service history' });
      onOpenChange(false);
      onSaved?.();
    } catch (err) {
      toast({ title: 'Error logging visit', description: err.message, variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader><DialogTitle>Grab and Go Resources</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label>Resource *</Label>
            <Select value={resourceType} onValueChange={setResourceType}>
              <SelectTrigger><SelectValue placeholder="Select a resource..." /></SelectTrigger>
              <SelectContent>
                {GRAB_AND_GO_OPTIONS.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          {resourceType === 'other' && (
            <div className="space-y-1.5"><Label>Other (specify) *</Label><Input value={resourceOther} onChange={(e) => setResourceOther(e.target.value)} placeholder="Describe the resource provided" /></div>
          )}
          <div className="space-y-1.5"><Label>Comments</Label><Textarea value={comments} onChange={(e) => setComments(e.target.value)} rows={3} placeholder="Optional comments" /></div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSave} disabled={saving}>{saving ? 'Submitting...' : 'Submit'}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}