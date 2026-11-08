import React, { useEffect, useMemo, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, CheckCircle2, Loader2, UserCheck } from 'lucide-react';
import { toast } from 'sonner';
import ClientFormCore from '@/components/rc/ClientFormCore';
import { matchReasons, fullName } from '@/lib/clientMatch';

// Fields the tablet form collects — used to prefill the same registration form
// reception would have filled in at the desk.
const EMPTY_FORM = {
  first_name: '', last_name: '', date_of_birth: '', phone: '', email: '', address: '', city: '', postal_code: '',
  preferred_language: '', additional_languages: '', emergency_contact_name: '', emergency_contact_phone: '',
  gender: '', marital_status: '', spouse_client_id: '', spouse_name: '', dependants_count: '', dependants_detail: '',
  service_category: '', has_children_0_6: false, children_count_0_6: 0, children_ages_detail: '',
  english_proficiency: '', english_proficiency_notes: '', indigenous_first_nations: false, newcomer: false,
  senior: false, youth_under_25: false,
  reason_for_accessing: '', reason_for_accessing_other: '', identified_needs: '',
  assigned_worker: '', case_status: 'intake', referral_source: '', notes: '',
};

const today = () => new Date().toISOString().slice(0, 10);

function formFromDetails(details) {
  const next = { ...EMPTY_FORM };
  Object.entries(details || {}).forEach(([key, value]) => {
    if (key in next && value !== null && value !== undefined) next[key] = value;
  });
  if (next.dependants_count === '' || next.dependants_count === null) next.dependants_count = '';
  return next;
}

// Reception's check step for details a customer typed on the tablet. The form is
// the same one used to register someone at the desk, so anything the tablet
// missed can be filled in before the file is added to the Central Database.
export default function KioskClientVerificationDialog({ open, prompt, onOpenChange, onSaved }) {
  const [form, setForm] = useState(EMPTY_FORM);
  const [clients, setClients] = useState([]);
  const [matches, setMatches] = useState([]);
  const [checking, setChecking] = useState(false);
  const [chosenId, setChosenId] = useState('');
  const [saving, setSaving] = useState(false);

  const update = (field, value) => setForm((prev) => ({ ...prev, [field]: value }));

  const checkDuplicates = async (values) => {
    setChecking(true);
    try {
      const queries = [];
      if (values.email) queries.push(base44.entities.RCClient.filter({ email: values.email }).catch(() => []));
      if (values.last_name) queries.push(base44.entities.RCClient.filter({ last_name: values.last_name }).catch(() => []));
      const results = await Promise.all(queries);
      const map = new Map();
      results.flat().forEach((c) => { if (c?.id) map.set(c.id, c); });
      const scored = Array.from(map.values())
        .map((c) => ({ client: c, ...matchReasons(c, values) }))
        .filter((m) => m.reasons.length > 0)
        .sort((a, b) => (b.strength - a.strength) || (b.sim - a.sim));
      setMatches(scored);
    } catch {
      setMatches([]);
    } finally {
      setChecking(false);
    }
  };

  useEffect(() => {
    if (!open) return;
    const details = formFromDetails(prompt?.response_details);
    setForm(details);
    setChosenId('');
    checkDuplicates(details);
    base44.entities.RCClient.list('last_name', 300).then((rows) => setClients(rows || [])).catch(() => setClients([]));
  }, [open, prompt?.id]);

  const sortedClients = useMemo(
    () => [...clients].sort((a, b) => fullName(a).localeCompare(fullName(b))),
    [clients],
  );

  const save = async () => {
    if (!form.first_name?.trim() || !form.last_name?.trim()) {
      toast.error('First and last name are required');
      return;
    }
    setSaving(true);
    try {
      const values = { ...form };
      if (values.dependants_count === '') delete values.dependants_count;
      let clientId = chosenId;
      if (chosenId) {
        await base44.entities.RCClient.update(chosenId, values);
      } else {
        const created = await base44.entities.RCClient.create({
          ...values,
          case_status: values.case_status || 'intake',
          intake_date: values.intake_date || today(),
          referral_source: values.referral_source || (prompt?.program && prompt.program !== 'reception'
            ? `${prompt.program === 'ell' ? 'ELL' : prompt.program === 'empoweru' ? 'EmpowerU' : prompt.program === 'frn' ? 'FRN' : 'Central Registration'} classroom tablet`
            : 'Front desk tablet'),
        });
        clientId = created.id;
      }
      await base44.entities.KioskPrompt.update(prompt.id, { rc_client_id: clientId });
      toast.success(chosenId ? 'Existing client file updated' : 'Client added to the Central Database');
      onSaved?.(clientId);
      onOpenChange(false);
    } catch (err) {
      toast.error(err.message || 'Could not save the client file');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[92vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserCheck className="h-5 w-5 text-primary" /> Verify client details
          </DialogTitle>
          <DialogDescription>
            Submitted at the tablet. Check the details with the person, make sure they are not already in the Central Database, then add them.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 rounded-xl border border-amber-200 bg-amber-50 p-4">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-amber-600" />
            <p className="text-sm font-semibold text-amber-900">Duplicate check</p>
            {checking && <Loader2 className="h-3.5 w-3.5 animate-spin text-amber-600" />}
            <Button
              variant="ghost"
              size="sm"
              className="ml-auto text-amber-800 hover:bg-amber-100"
              onClick={() => checkDuplicates(form)}
              disabled={checking}
            >
              Search again
            </Button>
          </div>

          {!checking && matches.length === 0 && (
            <p className="text-sm text-amber-900">No existing client file matches these details — this will be a new file.</p>
          )}

          {matches.map(({ client, reasons }) => {
            const isChosen = chosenId === client.id;
            return (
              <div
                key={client.id}
                className={`rounded-lg border bg-card p-3 flex flex-wrap items-center justify-between gap-2 ${isChosen ? 'border-primary' : 'border-border'}`}
              >
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">{fullName(client)}</p>
                  <p className="text-xs text-muted-foreground">
                    {[client.phone, client.email, client.date_of_birth && `DOB ${client.date_of_birth}`].filter(Boolean).join(' · ')}
                  </p>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {reasons.map((r, i) => (
                      <Badge key={i} variant="secondary" className="text-xs">{r.label}</Badge>
                    ))}
                  </div>
                </div>
                {isChosen ? (
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium text-primary flex items-center gap-1">
                      <CheckCircle2 className="h-3.5 w-3.5" /> Details save to this file
                    </span>
                    <Button variant="ghost" size="sm" onClick={() => setChosenId('')}>Undo</Button>
                  </div>
                ) : (
                  <Button variant="outline" size="sm" onClick={() => setChosenId(client.id)}>
                    This is them
                  </Button>
                )}
              </div>
            );
          })}
        </div>

        <ClientFormCore form={form} update={update} clients={sortedClients} />

        <div className="flex flex-wrap items-center justify-end gap-2 pt-2 border-t">
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={save} disabled={saving}>
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
            {chosenId ? 'Save to existing file' : 'Add to Central Database'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}