import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Check, Landmark, Pencil, X } from 'lucide-react';
import { useCurrentUser } from '@/lib/useAuth';

export default function EtransferEmailBar() {
  const { user } = useCurrentUser();
  const [localEmail, setLocalEmail] = useState(null); // locally updated after save
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const current = localEmail || user?.etransfer_email || user?.email || '';

  const startEdit = () => {
    setValue(current);
    setError('');
    setEditing(true);
  };

  const save = async () => {
    const v = value.trim();
    if (!/^\S+@\S+\.\S+$/.test(v)) { setError('Enter a valid email address.'); return; }
    try {
      setSaving(true);
      await base44.auth.updateMe({ etransfer_email: v });
      setLocalEmail(v);
      setEditing(false);
    } catch (err) {
      setError('Could not save the e-transfer email. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card className="px-4 py-3 flex items-center justify-between gap-3 flex-wrap">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-lg bg-accent/10 flex items-center justify-center shrink-0">
          <Landmark className="w-4 h-4 text-accent" />
        </div>
        <div>
          <p className="text-xs text-muted-foreground uppercase tracking-wide">E-transfer Email</p>
          <p className="text-sm font-semibold">{current || '—'}</p>
          <p className="text-[11px] text-muted-foreground">Used on your reimbursement forms and where your reimbursement is sent.</p>
        </div>
      </div>
      {editing ? (
        <div className="flex items-center gap-2 flex-wrap">
          <Input value={value} onChange={e => { setValue(e.target.value); setError(''); }} placeholder="name@email.com" className="w-72" />
          <Button size="sm" onClick={save} disabled={saving} className="gap-1.5">
            <Check className="w-4 h-4" />{saving ? 'Saving…' : 'Save'}
          </Button>
          <Button size="sm" variant="ghost" onClick={() => setEditing(false)}>
            <X className="w-4 h-4" />
          </Button>
          {error && <p className="text-xs text-red-600 w-full">{error}</p>}
        </div>
      ) : (
        <Button variant="outline" size="sm" className="gap-2" onClick={startEdit}>
          <Pencil className="w-4 h-4" />Change E-transfer Email
        </Button>
      )}
    </Card>
  );
}