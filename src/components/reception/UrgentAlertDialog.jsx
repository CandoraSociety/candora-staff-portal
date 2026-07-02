import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';
import { URGENCY_OPTIONS, RECIPIENT_TYPE_OPTIONS } from '@/lib/receptionConstants';

export default function UrgentAlertDialog({ open, onOpenChange, currentUser, onSaved }) {
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ title: '', message: '', urgency_level: 'urgent', recipient_type: 'all_managers', recipient_emails: [], recipient_names: [] });

  const { data: employees = [] } = useQuery({ queryKey: ['employees'], queryFn: () => base44.entities.Employee.filter({ is_deleted: false }), enabled: open });

  useEffect(() => {
    if (open) setForm({ title: '', message: '', urgency_level: 'urgent', recipient_type: 'all_managers', recipient_emails: [], recipient_names: [] });
  }, [open]);

  const update = (f, v) => setForm(p => ({ ...p, [f]: v }));

  const managers = employees.filter(e => ['executive_director', 'director', 'manager'].includes(e.org_tier) && e.status === 'active');
  const activeStaff = employees.filter(e => e.status === 'active');

  const handleSave = async () => {
    if (!form.title || !form.message) { toast({ title: 'Title and message are required', variant: 'destructive' }); return; }
    setSaving(true);
    try {
      let recipientEmails = [];
      let recipientNames = [];

      if (form.recipient_type === 'all_managers') {
        recipientEmails = managers.map(m => m.email).filter(Boolean);
        recipientNames = managers.map(m => `${m.first_name} ${m.last_name}`);
      } else if (form.recipient_type === 'all_staff') {
        recipientEmails = activeStaff.map(s => s.email).filter(Boolean);
        recipientNames = activeStaff.map(s => `${s.first_name} ${s.last_name}`);
      } else if (form.recipient_type === 'specific_staff') {
        recipientEmails = form.recipient_emails;
        recipientNames = form.recipient_names;
      } else if (form.recipient_type === 'specific_department') {
        const deptStaff = activeStaff.filter(s => form.recipient_emails.includes(s.email));
        recipientEmails = deptStaff.map(s => s.email).filter(Boolean);
        recipientNames = deptStaff.map(s => `${s.first_name} ${s.last_name}`);
      }

      const alertData = {
        ...form,
        sent_by_name: currentUser?.full_name || 'Reception',
        sent_by_email: currentUser?.email || '',
        recipient_emails: recipientEmails,
        recipient_names: recipientNames,
        sent_date: new Date().toISOString(),
        status: 'sent',
      };

      const created = await base44.entities.UrgentAlert.create(alertData);

      // Send emails to recipients
      if (recipientEmails.length > 0) {
        const urgencyLabel = URGENCY_OPTIONS.find(u => u.value === form.urgency_level)?.label || 'Urgent';
        const emailBody = `${alertData.message}\n\n---\nSent by: ${alertData.sent_by_name}\nUrgency: ${urgencyLabel}\nTime: ${new Date().toLocaleString()}\n\nThis is an urgent alert from the Candora Reception portal.`;
        
        for (const email of recipientEmails) {
          try {
            await base44.integrations.Core.SendEmail({
              to: email,
              subject: `[${urgencyLabel}] ${form.title}`,
              body: emailBody,
            });
          } catch (emailErr) {
            console.error(`Failed to send to ${email}:`, emailErr);
          }
        }
      }

      toast({ title: 'Urgent alert sent', description: `${recipientEmails.length} recipient(s) notified` });
      onSaved?.();
    } catch (err) { toast({ title: 'Error', description: err.message, variant: 'destructive' }); }
    finally { setSaving(false); }
  };

  const toggleStaffRecipient = (emp) => {
    const emails = form.recipient_emails || [];
    const names = form.recipient_names || [];
    if (emails.includes(emp.email)) {
      update('recipient_emails', emails.filter(e => e !== emp.email));
      update('recipient_names', names.filter((_, i) => emails[i] !== emp.email));
    } else {
      update('recipient_emails', [...emails, emp.email]);
      update('recipient_names', [...names, `${emp.first_name} ${emp.last_name}`]);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader><DialogTitle>Send Urgent Alert</DialogTitle></DialogHeader>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5 col-span-2"><Label>Title *</Label><Input value={form.title || ''} onChange={(e) => update('title', e.target.value)} placeholder="Brief summary" /></div>
          <div className="space-y-1.5 col-span-2"><Label>Message *</Label><Textarea value={form.message || ''} onChange={(e) => update('message', e.target.value)} rows={4} /></div>
          <div className="space-y-1.5"><Label>Urgency Level</Label><Select value={form.urgency_level} onValueChange={(v) => update('urgency_level', v)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{URGENCY_OPTIONS.map(u => <SelectItem key={u.value} value={u.value}>{u.label}</SelectItem>)}</SelectContent></Select></div>
          <div className="space-y-1.5"><Label>Recipients</Label><Select value={form.recipient_type} onValueChange={(v) => update('recipient_type', v)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{RECIPIENT_TYPE_OPTIONS.map(r => <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>)}</SelectContent></Select></div>
          {form.recipient_type === 'specific_staff' && (
            <div className="col-span-2 max-h-48 overflow-y-auto border rounded-md p-2 space-y-1">
              {activeStaff.map(emp => (
                <div key={emp.id} className="flex items-center gap-2">
                  <Checkbox id={`emp-${emp.id}`} checked={(form.recipient_emails || []).includes(emp.email)} onCheckedChange={() => toggleStaffRecipient(emp)} />
                  <label htmlFor={`emp-${emp.id}`} className="text-sm cursor-pointer">{emp.first_name} {emp.last_name} — {emp.position}</label>
                </div>
              ))}
            </div>
          )}
          {form.recipient_type === 'specific_department' && (
            <div className="col-span-2 max-h-48 overflow-y-auto border rounded-md p-2 space-y-1">
              {[...new Set(activeStaff.map(s => s.department))].map(dept => (
                <div key={dept} className="flex items-center gap-2">
                  <Checkbox id={`dept-${dept}`} checked={(form.recipient_emails || []).some(e => activeStaff.find(s => s.email === e && s.department === dept))} onCheckedChange={() => {
                    const deptEmails = activeStaff.filter(s => s.department === dept).map(s => s.email);
                    const hasAny = deptEmails.some(e => (form.recipient_emails || []).includes(e));
                    if (hasAny) {
                      update('recipient_emails', (form.recipient_emails || []).filter(e => !deptEmails.includes(e)));
                    } else {
                      update('recipient_emails', [...new Set([...(form.recipient_emails || []), ...deptEmails])]);
                    }
                  }} />
                  <label htmlFor={`dept-${dept}`} className="text-sm cursor-pointer">{dept}</label>
                </div>
              ))}
            </div>
          )}
          {form.recipient_type !== 'specific_staff' && form.recipient_type !== 'specific_department' && (
            <p className="col-span-2 text-xs text-muted-foreground">
              {form.recipient_type === 'all_managers' ? `${managers.length} managers will be notified` : `${activeStaff.length} active staff will be notified`}
            </p>
          )}
        </div>
        <DialogFooter><Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button><Button onClick={handleSave} disabled={saving} variant={form.urgency_level === 'critical' ? 'destructive' : 'default'}>{saving ? 'Sending...' : 'Send Alert'}</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  );
}