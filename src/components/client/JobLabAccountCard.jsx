import { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, Laptop, Loader2, RefreshCw, Copy } from 'lucide-react';
import { toast } from 'sonner';
import moment from 'moment';

const makePassword = () => `candora${Math.floor(1000 + Math.random() * 9000)}`;

const call = (payload) =>
  base44.functions
    .invoke('manageJobLabAccount', payload)
    .then((res) => res.data)
    .catch((error) => {
      throw new Error(error?.response?.data?.error || 'Could not reach Job Lab');
    });

export default function JobLabAccountCard({ client }) {
  const [loading, setLoading] = useState(true);
  const [account, setAccount] = useState(null);
  const [saving, setSaving] = useState(false);
  const [justCreated, setJustCreated] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [resetting, setResetting] = useState(false);
  const [form, setForm] = useState({
    name: `${client.first_name || ''} ${client.last_name || ''}`.trim(),
    email: client.email || '',
    password: makePassword(),
  });

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    call({ action: 'getAccount', clientId: client.id })
      .then((data) => !cancelled && setAccount(data.account || null))
      .catch(() => {})
      .finally(() => !cancelled && setLoading(false));
    return () => { cancelled = true; };
  }, [client.id]);

  const handleCreate = async () => {
    setSaving(true);
    try {
      const data = await call({ action: 'createAccount', clientId: client.id, ...form });
      setAccount(data.account);
      setJustCreated(true);
      toast.success('Job Lab account created');
    } catch (error) {
      toast.error(error.message);
    }
    setSaving(false);
  };

  const handleReset = async () => {
    if (newPassword.length < 4) {
      toast.error('Password must be at least 4 characters.');
      return;
    }
    setResetting(true);
    try {
      const data = await call({ action: 'resetPassword', clientId: client.id, password: newPassword });
      setAccount(data.account);
      setJustCreated(false);
      setNewPassword('');
      toast.success('Job Lab password updated');
    } catch (error) {
      toast.error(error.message);
    }
    setResetting(false);
  };

  const copySignIn = () => {
    const text = `Job Lab sign-in\nEmail: ${account.email}\nPassword: ${form.password}`;
    navigator.clipboard?.writeText(text);
    toast.success('Sign-in details copied');
  };

  return (
    <div className="border border-slate-200 rounded-lg p-4 space-y-3" data-tour="jl-account-card">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-2">
          <Laptop className="w-4 h-4" style={{ color: 'hsl(231,64%,20%)' }} />
          <p className="text-sm font-medium text-slate-700">Job Lab Account</p>
          {account && (
            <Badge className="bg-green-100 text-green-800 border-green-200 gap-1">
              <CheckCircle2 className="w-3 h-3" /> Active
            </Badge>
          )}
        </div>
        {account && (
          <span className="text-xs text-slate-500">
            {account.total_visits || 0} visit{account.total_visits === 1 ? '' : 's'}
            {account.last_visit ? ` · last ${moment(account.last_visit).format('MMM D, YYYY')}` : ''}
          </span>
        )}
      </div>

      {loading ? (
        <div className="flex items-center gap-2 text-sm text-slate-500">
          <Loader2 className="w-4 h-4 animate-spin" /> Checking account…
        </div>
      ) : account ? (
        <>
          <p className="text-sm text-slate-600">
            The client signs in to Job Lab with <span className="font-medium text-slate-800">{account.email}</span> and their
            password. Their visits, applications, resumes and career plans appear under the Job Lab tab.
          </p>
          {justCreated && (
            <div className="flex items-center justify-between gap-2 flex-wrap bg-green-50 border border-green-200 rounded-md px-3 py-2">
              <p className="text-xs text-green-800">
                Password set to <span className="font-semibold">{form.password}</span> — give this to the client.
              </p>
              <Button size="sm" variant="outline" className="gap-1.5" onClick={copySignIn}>
                <Copy className="w-3.5 h-3.5" /> Copy
              </Button>
            </div>
          )}
          <div className="flex items-end gap-2 pt-1 border-t border-slate-100">
            <div className="flex-1 max-w-xs">
              <Label className="mb-1 block text-xs font-medium text-slate-600">Set a new password</Label>
              <Input
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="New password"
                className="h-9"
              />
            </div>
            <Button size="sm" variant="outline" onClick={handleReset} disabled={resetting}>
              {resetting ? 'Updating…' : 'Update password'}
            </Button>
          </div>
        </>
      ) : (
        <>
          <p className="text-xs text-slate-500">
            Set the client up so they can use the Job Lab kiosk or online portal. Their activity is logged on this file.
          </p>
          <div className="grid gap-3 sm:grid-cols-2" data-tour="jl-account-form">
            <div>
              <Label className="mb-1 block text-xs font-medium text-slate-600">Name</Label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="h-9" />
            </div>
            <div>
              <Label className="mb-1 block text-xs font-medium text-slate-600">Email</Label>
              <Input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="client@email.com"
                className="h-9"
              />
            </div>
            <div className="sm:col-span-2 flex items-end gap-2" data-tour="jl-account-password">
              <div className="flex-1">
                <Label className="mb-1 block text-xs font-medium text-slate-600">Password</Label>
                <Input value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} className="h-9" />
              </div>
              <Button
                size="sm"
                variant="outline"
                className="gap-1.5"
                onClick={() => setForm({ ...form, password: makePassword() })}
                title="Generate a new password"
              >
                <RefreshCw className="w-3.5 h-3.5" /> Generate
              </Button>
            </div>
          </div>
          <div className="flex justify-end" data-tour="jl-account-create">
            <Button size="sm" onClick={handleCreate} disabled={saving}>
              {saving ? 'Creating…' : 'Create Job Lab account'}
            </Button>
          </div>
        </>
      )}
    </div>
  );
}