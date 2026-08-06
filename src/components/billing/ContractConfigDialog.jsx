import { useState } from 'react';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';

const RATE_FIELDS = [
  { key: 'rate_dea_starter', label: 'DEA Starter Rate' },
  { key: 'rate_pathways_starter', label: 'Pathways Starter Rate' },
  { key: 'rate_dea_completer', label: 'DEA Completer Rate' },
  { key: 'rate_pathways_completer', label: 'Pathways Completer Rate' },
  { key: 'rate_employment_outcome', label: 'Employment Outcome Rate' },
  { key: 'rate_90day_outcome', label: '90-Day Outcome Rate' },
];

const CAP_FIELDS = [
  { key: 'cap_starters', label: 'Starters Cap' },
  { key: 'cap_completers', label: 'Completers Cap' },
  { key: 'cap_employment_outcomes', label: 'Employment Outcomes Cap' },
  { key: 'cap_90day_outcomes', label: '90-Day Outcomes Cap' },
  { key: 'cap_exposure_courses_dollars', label: 'Exposure Courses $ Cap' },
  { key: 'cap_paid_placements_dollars', label: 'Paid Placements $ Cap' },
  { key: 'cap_employment_supports_dollars', label: 'Employment Supports $ Cap' },
];

const EMPTY = {
  config_name: '',
  contract_start_date: '',
  contract_end_date: '',
  base_monthly_amount: '',
  notes: '',
  ...Object.fromEntries([...RATE_FIELDS, ...CAP_FIELDS].map(f => [f.key, ''])),
};

export default function ContractConfigDialog({ open, onOpenChange }) {
  const queryClient = useQueryClient();
  const [form, setForm] = useState(EMPTY);

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.InvoiceConfig.create({ ...data, is_active: true }),
    onSuccess: () => {
      toast.success('Contract configuration created');
      queryClient.invalidateQueries({ queryKey: ['invoice-configs'] });
      setForm(EMPTY);
      onOpenChange(false);
    },
    onError: () => toast.error('Failed to create configuration'),
  });

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSave = () => {
    if (!form.config_name?.trim()) {
      toast.error('Configuration name is required');
      return;
    }
    const numeric = {};
    [...RATE_FIELDS, ...CAP_FIELDS, { key: 'base_monthly_amount' }].forEach(({ key }) => {
      numeric[key] = form[key] === '' ? null : Number(form[key]);
    });
    createMutation.mutate({ ...form, ...numeric });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>New Contract Configuration</DialogTitle>
          <DialogDescription>
            Define the funder contract terms (rates, base amount, and budget caps) used to calculate invoices.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="config_name">Configuration Name *</Label>
            <Input id="config_name" value={form.config_name} onChange={e => set('config_name', e.target.value)} placeholder="e.g. Pathways / DEA 2025–2026" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="contract_start_date">Contract Start</Label>
              <Input id="contract_start_date" type="date" value={form.contract_start_date} onChange={e => set('contract_start_date', e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="contract_end_date">Contract End</Label>
              <Input id="contract_end_date" type="date" value={form.contract_end_date} onChange={e => set('contract_end_date', e.target.value)} />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="base_monthly_amount">Base Monthly Amount ($)</Label>
            <Input id="base_monthly_amount" type="number" value={form.base_monthly_amount} onChange={e => set('base_monthly_amount', e.target.value)} />
          </div>

          <div>
            <p className="text-sm font-semibold text-slate-700 mb-2">Service Rates ($)</p>
            <div className="grid grid-cols-2 gap-3">
              {RATE_FIELDS.map(f => (
                <div key={f.key} className="space-y-1">
                  <Label htmlFor={f.key} className="text-xs">{f.label}</Label>
                  <Input id={f.key} type="number" value={form[f.key]} onChange={e => set(f.key, e.target.value)} />
                </div>
              ))}
            </div>
          </div>

          <div>
            <p className="text-sm font-semibold text-slate-700 mb-2">Budget Caps</p>
            <div className="grid grid-cols-2 gap-3">
              {CAP_FIELDS.map(f => (
                <div key={f.key} className="space-y-1">
                  <Label htmlFor={f.key} className="text-xs">{f.label}</Label>
                  <Input id={f.key} type="number" value={form[f.key]} onChange={e => set(f.key, e.target.value)} />
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea id="notes" rows={2} value={form.notes} onChange={e => set('notes', e.target.value)} />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSave} disabled={createMutation.isPending}>
            {createMutation.isPending ? 'Saving...' : 'Create Configuration'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}