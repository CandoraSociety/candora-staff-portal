import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Copy, Check, Pencil, Save, X } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const FIELDS = [
  { key: 'org_name', label: 'Organization Name' },
  { key: 'legal_name', label: 'Legal Name' },
  { key: 'charitable_number', label: 'Charitable Number' },
  { key: 'registration_number', label: 'Registration / Business Number' },
  { key: 'gst_number', label: 'GST Number' },
  { key: 'fiscal_year_end', label: 'Fiscal Year End' },
  { key: 'annual_budget', label: 'Annual Budget' },
  { key: 'staff_count', label: 'Staff Count' },
  { key: 'volunteer_count', label: 'Volunteer Count' },
  { key: 'executive_director_name', label: 'Executive Director' },
  { key: 'executive_director_email', label: 'ED Email' },
  { key: 'signing_authority_name', label: 'Signing Authority' },
  { key: 'signing_authority_title', label: 'Signing Authority Title' },
  { key: 'phone', label: 'Phone' },
  { key: 'email', label: 'Email' },
  { key: 'website', label: 'Website' },
  { key: 'address', label: 'Address' },
  { key: 'city', label: 'City' },
  { key: 'province', label: 'Province' },
  { key: 'postal_code', label: 'Postal Code' },
  { key: 'mission_statement', label: 'Mission Statement' },
  { key: 'mandate_description', label: 'Mandate Description' },
];

function CopyField({ label, value }) {
  const [copied, setCopied] = useState(false);
  if (!value && value !== 0) return null;
  const display = typeof value === 'number' ? `$${value.toLocaleString()}` : String(value);
  const handleCopy = () => {
    navigator.clipboard.writeText(display);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };
  return (
    <div className="flex items-start justify-between gap-3 py-2 border-b last:border-0">
      <div className="min-w-0 flex-1">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-sm font-medium break-words">{display}</p>
      </div>
      <button onClick={handleCopy} className="flex-shrink-0 p-1.5 rounded hover:bg-muted transition-colors mt-1" title="Copy">
        {copied ? <Check className="h-3.5 w-3.5 text-green-500" /> : <Copy className="h-3.5 w-3.5 text-muted-foreground" />}
      </button>
    </div>
  );
}

export default function QuickReferenceTab({ orgInfo, onUpdate }) {
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({});
  const [saving, setSaving] = useState(false);

  const startEdit = () => {
    setForm({ ...orgInfo });
    setEditing(true);
  };

  const handleSave = async () => {
    setSaving(true);
    if (orgInfo?.id) {
      await base44.entities.OrganizationInfo.update(orgInfo.id, form);
    } else {
      await base44.entities.OrganizationInfo.create(form);
    }
    onUpdate();
    setEditing(false);
    setSaving(false);
  };

  if (editing) {
    return (
      <div className="max-w-2xl space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold">Edit Organization Info</h3>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => setEditing(false)}><X className="h-4 w-4 mr-1" />Cancel</Button>
            <Button size="sm" onClick={handleSave} disabled={saving}><Save className="h-4 w-4 mr-1" />{saving ? 'Saving…' : 'Save'}</Button>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          {FIELDS.map(f => (
            <div key={f.key} className={f.key === 'mission_statement' || f.key === 'mandate_description' ? 'col-span-2' : ''}>
              <Label className="text-xs">{f.label}</Label>
              {f.key === 'mission_statement' || f.key === 'mandate_description' ? (
                <textarea
                  value={form[f.key] || ''}
                  onChange={e => setForm(prev => ({ ...prev, [f.key]: e.target.value }))}
                  rows={3}
                  className="mt-1 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm resize-none focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                />
              ) : (
                <Input
                  value={form[f.key] || ''}
                  onChange={e => setForm(prev => ({ ...prev, [f.key]: e.target.value }))}
                  className="mt-1 h-8 text-sm"
                  type={f.key === 'annual_budget' || f.key === 'staff_count' || f.key === 'volunteer_count' ? 'number' : 'text'}
                />
              )}
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold">Organization Quick Reference</h3>
        <Button variant="outline" size="sm" onClick={startEdit} className="gap-1.5">
          <Pencil className="h-3.5 w-3.5" />Edit
        </Button>
      </div>
      {!orgInfo ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground text-sm mb-3">No organization info set up yet.</p>
            <Button onClick={startEdit} variant="outline" size="sm">Set Up Org Info</Button>
          </CardContent>
        </Card>
      ) : (
        <div className="border rounded-xl px-4 divide-y">
          {FIELDS.map(f => <CopyField key={f.key} label={f.label} value={orgInfo[f.key]} />)}
        </div>
      )}
    </div>
  );
}