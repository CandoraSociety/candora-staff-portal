import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';
import { PROGRAM_LABELS } from '@/lib/frnConstants';

const EMPTY = {
  referral_id: '', participant_id: '', participant_name: '', program: '',
  assessment_date: '', assessor_name: '', relevance: '', ability_to_participate: '',
  willingness_to_participate: '', supports_needed: '', assessment_notes: '',
  recommendation: '', recommendation_notes: '',
};

export default function AssessmentFormDialog({ open, onOpenChange, onSaved }) {
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(EMPTY);

  const { data: scheduled = [] } = useQuery({
    queryKey: ['frn-referrals', 'assessment_scheduled'],
    queryFn: () => base44.entities.FRNReferral.filter({ status: 'assessment_scheduled' }),
    enabled: open,
  });
  const { data: pending = [] } = useQuery({
    queryKey: ['frn-referrals', 'pending'],
    queryFn: () => base44.entities.FRNReferral.filter({ status: 'pending' }),
    enabled: open,
  });

  const assessable = [...scheduled, ...pending];

  useEffect(() => {
    if (open) {
      setForm({ ...EMPTY, assessment_date: new Date().toISOString().split('T')[0] });
    }
  }, [open]);

  const update = (field, value) => setForm(prev => ({ ...prev, [field]: value }));

  const handleReferralChange = (referralId) => {
    const r = assessable.find(r => r.id === referralId);
    if (r) {
      setForm(prev => ({
        ...prev,
        referral_id: referralId,
        participant_id: r.participant_id,
        participant_name: r.participant_name,
        program: r.program,
      }));
    }
  };

  const handleSave = async () => {
    if (!form.referral_id || !form.assessment_date) {
      toast({ title: 'Referral and assessment date are required', variant: 'destructive' });
      return;
    }
    setSaving(true);
    try {
      await base44.entities.FRNAssessment.create(form);
      await base44.entities.FRNReferral.update(form.referral_id, { status: 'assessed' });
      toast({ title: 'Assessment created' });
      onSaved?.();
    } catch (err) {
      toast({ title: 'Error saving assessment', description: err.message, variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>New Assessment</DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5 col-span-2">
            <Label>Referral *</Label>
            <Select value={form.referral_id} onValueChange={handleReferralChange}>
              <SelectTrigger><SelectValue placeholder="Select a pending referral..." /></SelectTrigger>
              <SelectContent>
                {assessable.map(r => (
                  <SelectItem key={r.id} value={r.id}>
                    {r.participant_name} — {PROGRAM_LABELS[r.program] || r.program}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {assessable.length === 0 && (
              <p className="text-xs text-muted-foreground">No referrals pending assessment. Create a referral first.</p>
            )}
          </div>
          <div className="space-y-1.5">
            <Label>Assessment Date *</Label>
            <Input type="date" value={form.assessment_date || ''} onChange={(e) => update('assessment_date', e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>Assessor Name</Label>
            <Input value={form.assessor_name || ''} onChange={(e) => update('assessor_name', e.target.value)} />
          </div>

          <div className="col-span-2"><p className="text-sm font-medium text-foreground mt-2 mb-1">Program Fit Assessment</p></div>
          <div className="space-y-1.5">
            <Label>Relevance to Program</Label>
            <Select value={form.relevance} onValueChange={(v) => update('relevance', v)}>
              <SelectTrigger><SelectValue placeholder="Select..." /></SelectTrigger>
              <SelectContent>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="moderate">Moderate</SelectItem>
                <SelectItem value="low">Low</SelectItem>
                <SelectItem value="not_suitable">Not Suitable</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Ability to Participate</Label>
            <Select value={form.ability_to_participate} onValueChange={(v) => update('ability_to_participate', v)}>
              <SelectTrigger><SelectValue placeholder="Select..." /></SelectTrigger>
              <SelectContent>
                <SelectItem value="yes">Yes</SelectItem>
                <SelectItem value="with_support">Yes, with support</SelectItem>
                <SelectItem value="no">No</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Willingness to Participate</Label>
            <Select value={form.willingness_to_participate} onValueChange={(v) => update('willingness_to_participate', v)}>
              <SelectTrigger><SelectValue placeholder="Select..." /></SelectTrigger>
              <SelectContent>
                <SelectItem value="yes">Yes</SelectItem>
                <SelectItem value="uncertain">Uncertain</SelectItem>
                <SelectItem value="no">No</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Recommendation</Label>
            <Select value={form.recommendation} onValueChange={(v) => update('recommendation', v)}>
              <SelectTrigger><SelectValue placeholder="Select..." /></SelectTrigger>
              <SelectContent>
                <SelectItem value="accept">Accept</SelectItem>
                <SelectItem value="accept_with_support">Accept with support</SelectItem>
                <SelectItem value="defer">Defer</SelectItem>
                <SelectItem value="decline">Decline</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5 col-span-2">
            <Label>Supports Needed</Label>
            <Textarea value={form.supports_needed || ''} onChange={(e) => update('supports_needed', e.target.value)} rows={2} placeholder="What supports would the participant need to participate?" />
          </div>
          <div className="space-y-1.5 col-span-2">
            <Label>Assessment Notes</Label>
            <Textarea value={form.assessment_notes || ''} onChange={(e) => update('assessment_notes', e.target.value)} rows={3} placeholder="Detailed observations from the assessment..." />
          </div>
          <div className="space-y-1.5 col-span-2">
            <Label>Recommendation Notes</Label>
            <Textarea value={form.recommendation_notes || ''} onChange={(e) => update('recommendation_notes', e.target.value)} rows={2} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSave} disabled={saving}>{saving ? 'Saving...' : 'Save Assessment'}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}