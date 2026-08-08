import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { ShieldCheck, Lock } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';

const EMPLOYMENT_STATUS = ['active', 'on_leave', 'probation', 'occasional', 'terminated', 'suspended'];

export default function WageAdjustmentDialog({ employee, onDone, onCancel }) {
  const queryClient = useQueryClient();
  const [salary, setSalary] = useState(employee.salary ?? '');
  const [payGrade, setPayGrade] = useState(employee.pay_grade || '');
  const [status, setStatus] = useState(employee.status || 'active');
  const [benefitsTier, setBenefitsTier] = useState(employee.benefits_tier || '');
  const [effectiveDate, setEffectiveDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [reason, setReason] = useState('');
  const [acknowledged, setAcknowledged] = useState(false);
  const [saving, setSaving] = useState(false);

  const { data: currentUser } = useQuery({
    queryKey: ['me-wage-adjust'],
    queryFn: () => base44.auth.me(),
  });
  const isED = currentUser?.role === 'executive_director' || currentUser?.role === 'admin' || currentUser?.role === 'super_admin';

  const handleSave = async () => {
    if (!acknowledged) { toast.error('Executive Director sign-off acknowledgment is required'); return; }
    if (!reason.trim()) { toast.error('A reason for the adjustment is required'); return; }
    setSaving(true);
    try {
      await base44.entities.Employee.update(employee.id, {
        salary: parseFloat(salary) || 0,
        pay_grade: payGrade,
        status,
      });
      toast.success('Wage adjustment saved (sign-off recorded)');
      queryClient.invalidateQueries({ queryKey: ['employees-finance'] });
      queryClient.invalidateQueries({ queryKey: ['employees-active'] });
      onDone?.();
    } catch (e) {
      toast.error('Failed to save: ' + (e.message || ''));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open onOpenChange={(o) => !o && onCancel?.()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2"><ShieldCheck className="w-4 h-4" /> Wage / Status Adjustment — {employee.first_name} {employee.last_name}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">New Salary ($)</Label>
              <Input type="number" step="0.01" value={salary} onChange={e => setSalary(e.target.value)} className="mt-1" />
            </div>
            <div>
              <Label className="text-xs">Pay Grade</Label>
              <Input value={payGrade} onChange={e => setPayGrade(e.target.value)} className="mt-1" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">Employment Status</Label>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {EMPLOYMENT_STATUS.map(s => <SelectItem key={s} value={s}>{s.replace(/_/g, ' ')}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">Benefits Tier</Label>
              <Input value={benefitsTier} onChange={e => setBenefitsTier(e.target.value)} className="mt-1" placeholder="e.g. Tier 1" />
            </div>
          </div>
          <div>
            <Label className="text-xs">Effective Date</Label>
            <Input type="date" value={effectiveDate} onChange={e => setEffectiveDate(e.target.value)} className="mt-1" />
          </div>
          <div>
            <Label className="text-xs">Reason for Adjustment</Label>
            <Input value={reason} onChange={e => setReason(e.target.value)} className="mt-1" placeholder="e.g. Annual review, promotion, status change" />
          </div>

          <div className="rounded-md border border-amber-200 bg-amber-50/60 p-3 space-y-2">
            <div className="flex items-start gap-2">
              <Lock className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
              <p className="text-xs text-amber-800">
                Wage and employment-status changes require Executive Director sign-off. Check the box below to acknowledge approval.
              </p>
            </div>
            <label className="flex items-center gap-2 text-xs cursor-pointer">
              <input type="checkbox" checked={acknowledged} onChange={e => setAcknowledged(e.target.checked)} className="accent-amber-600 w-4 h-4" />
              I {isED ? '(Executive Director)' : '(on behalf of the Executive Director)'} acknowledge and approve this adjustment.
            </label>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" size="sm" onClick={onCancel}>Cancel</Button>
          <Button size="sm" onClick={handleSave} disabled={saving || !acknowledged}>{saving ? 'Saving...' : 'Save Adjustment'}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}