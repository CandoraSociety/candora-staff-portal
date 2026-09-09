import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { completeClientVisit, VISIT_TYPE_LABELS } from '@/lib/rcClientVisits';
import { SERVICE_CATEGORY_OPTIONS } from '@/components/rc/ClientFormCore';

// One pending client visit — expand to complete it (visit notes + follow-up
// selection are both required before the visit can be marked complete).
export default function PendingVisitCard({ visit, onCompleted }) {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [notes, setNotes] = useState('');
  const [followUp, setFollowUp] = useState('');
  const [saving, setSaving] = useState(false);

  const intake = visit.intake_snapshot || {};
  const details = [
    intake.service_category && SERVICE_CATEGORY_OPTIONS.find(o => o.value === intake.service_category)?.label,
    intake.reason_for_accessing && `Reason: ${intake.reason_for_accessing.replace(/_/g, ' ')}`,
    intake.identified_needs && `Needs: ${intake.identified_needs}`,
    intake.notes && `Notes: ${intake.notes}`,
    visit.comments && `Comments: ${visit.comments}`,
  ].filter(Boolean);

  const handleSubmit = async () => {
    if (!notes.trim()) { toast({ title: 'Client visit notes are required to complete the visit', variant: 'destructive' }); return; }
    if (!followUp) { toast({ title: 'Select whether follow-up is required', variant: 'destructive' }); return; }
    setSaving(true);
    try {
      await completeClientVisit({ visit, visitNotes: notes, followUpRequired: followUp });
      toast({ title: 'Visit completed', description: 'Added to the client\'s service history' });
      onCompleted?.();
    } catch (err) {
      toast({ title: 'Error completing visit', description: err.message, variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card>
      <CardContent className="p-4">
        <button className="w-full text-left" onClick={() => setOpen(o => !o)}>
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="text-sm font-medium text-foreground">{visit.client_name}</p>
              <p className="text-xs text-muted-foreground">
                {new Date(visit.visit_date).toLocaleDateString()} · {VISIT_TYPE_LABELS[visit.visit_type] || visit.visit_type}
              </p>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <span className="text-xs px-2 py-1 rounded-full bg-amber-100 text-amber-800 font-medium">Pending</span>
              {open ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
            </div>
          </div>
        </button>
        {open && (
          <div className="mt-3 pt-3 border-t border-border/50 space-y-3">
            {details.length > 0 && (
              <div className="space-y-0.5">
                {details.map((d, i) => <p key={i} className="text-xs text-muted-foreground">{d}</p>)}
              </div>
            )}
            <div className="space-y-1.5">
              <Label>Client visit notes *</Label>
              <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} placeholder="What happened during the visit" />
            </div>
            <div className="space-y-1.5">
              <Label>Follow up required? *</Label>
              <Select value={followUp} onValueChange={setFollowUp}>
                <SelectTrigger className="w-40"><SelectValue placeholder="Select..." /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="yes">Yes</SelectItem>
                  <SelectItem value="no">No</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex justify-end">
              <Button onClick={handleSubmit} disabled={saving}>{saving ? 'Submitting...' : 'Mark Visit Complete'}</Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}