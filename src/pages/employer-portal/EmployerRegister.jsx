import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { UserPlus, Lock, Loader2, Building2 } from 'lucide-react';
import AuthLayout from '@/components/AuthLayout';
import { toast } from 'sonner';
import { setEmployerSession } from '@/lib/employerPortalSession';
import { propagateEmployerName } from '@/lib/employerNameSync';
import { useOrgSettings } from '@/lib/useOrgSettings';

export default function EmployerRegister() {
  const { logoUrl } = useOrgSettings();
  const [searchParams] = useSearchParams();
  const employerId = searchParams.get('employer');
  const [employer, setEmployer] = useState(null);
  const [loadingEmployer, setLoadingEmployer] = useState(true);
  const [form, setForm] = useState({
    name: '', first_name: '', last_name: '', position: '',
    contact_email: '', contact_phone: '', password: '', confirmPassword: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const set = (f, v) => setForm(p => ({ ...p, [f]: v }));

  useEffect(() => {
    (async () => {
      if (!employerId) { setLoadingEmployer(false); return; }
      try {
        const all = await base44.entities.Employer.list('-created_date', 500);
        const emp = all.find(e => e.id === employerId);
        if (emp) {
          setEmployer(emp);
          setForm({
            name: emp.name || '',
            first_name: emp.first_name || '',
            last_name: emp.last_name || '',
            position: emp.position || '',
            contact_email: emp.contact_email || '',
            contact_phone: emp.contact_phone || '',
            password: '', confirmPassword: '',
          });
        }
      } catch {
        setError('Could not load employer record. Please use the link your Candora contact sent you.');
      } finally {
        setLoadingEmployer(false);
      }
    })();
  }, [employerId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!employer) return;
    if (!form.name.trim()) return setError('Company name is required');
    if (!form.contact_email.trim()) return setError('Email is required');
    if (form.password.length < 6) return setError('Password must be at least 6 characters');
    if (form.password !== form.confirmPassword) return setError('Passwords do not match');
    setLoading(true);
    try {
      const encoder = new TextEncoder();
      const data = encoder.encode(form.password);
      const hashBuffer = await crypto.subtle.digest('SHA-256', data);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const passwordHash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

      const newName = form.name.trim();
      const nameChanged = employer.name !== newName;
      await base44.entities.Employer.update(employer.id, {
        name: newName,
        first_name: form.first_name.trim(),
        last_name: form.last_name.trim(),
        position: form.position.trim(),
        contact_name: `${form.first_name.trim()} ${form.last_name.trim()}`.trim(),
        contact_email: form.contact_email.trim().toLowerCase(),
        contact_phone: form.contact_phone.trim(),
        password_hash: passwordHash,
        must_change_password: false,
        status: 'active',
      });
      if (nameChanged) await propagateEmployerName(employer.id, newName);
      setEmployerSession(employer.id);
      toast.success('Your portal account is ready');
      window.location.href = '/employer-portal';
    } catch (err) {
      setError(err.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  const brand = { logoUrl, brandText: "Pathways Employer Portal" };

  if (loadingEmployer) {
    return (
      <AuthLayout icon={Building2} {...brand} title="Pathways Employer Portal" subtitle="Loading…">
        <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>
      </AuthLayout>
    );
  }

  if (!employerId || !employer) {
    return (
      <AuthLayout icon={Building2} {...brand} title="Pathways Employer Portal" subtitle="Registration is by invitation only">
        <p className="text-sm text-muted-foreground text-center">
          Please use the registration link your Candora contact sent you. If you don't have one, ask your Candora career counsellor to invite you.
        </p>
        <div className="text-center mt-4">
          <Link to="/employer-portal/login" className="text-primary font-medium hover:underline">Sign in</Link>
        </div>
      </AuthLayout>
    );
  }

  if (employer.password_hash) {
    return (
      <AuthLayout icon={Building2} {...brand} title="Pathways Employer Portal" subtitle="Account already set up">
        <p className="text-sm text-muted-foreground text-center">
          This employer account has already been registered. Please sign in.
        </p>
        <div className="text-center mt-4">
          <Link to="/employer-portal/login" className="text-primary font-medium hover:underline">Go to sign in</Link>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      icon={Building2}
      {...brand}
      title="Register your company"
      subtitle="Review your details and set your portal password"
      footer={
        <>
          Already have an account?{' '}
          <Link to="/employer-portal/login" className="text-primary font-medium hover:underline">Sign in</Link>
        </>
      }
    >
      {error && <div className="mb-4 p-3 rounded-lg bg-destructive/10 text-destructive text-sm">{error}</div>}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1">
          <Label className="text-xs font-semibold uppercase text-muted-foreground">Company</Label>
          <Input placeholder="Company name *" value={form.name} onChange={e => set('name', e.target.value)} className="h-11" required />
        </div>
        <div className="space-y-1">
          <Label className="text-xs font-semibold uppercase text-muted-foreground">Primary contact</Label>
          <div className="grid grid-cols-2 gap-2">
            <Input placeholder="First name" value={form.first_name} onChange={e => set('first_name', e.target.value)} className="h-11" />
            <Input placeholder="Last name" value={form.last_name} onChange={e => set('last_name', e.target.value)} className="h-11" />
          </div>
          <Input placeholder="Position / title" value={form.position} onChange={e => set('position', e.target.value)} className="h-11 mt-2" />
          <div className="grid grid-cols-2 gap-2 mt-2">
            <Input type="email" placeholder="Email (login) *" value={form.contact_email} onChange={e => set('contact_email', e.target.value)} className="h-11" required />
            <Input placeholder="Phone" value={form.contact_phone} onChange={e => set('contact_phone', e.target.value)} className="h-11" />
          </div>
        </div>
        <div className="space-y-1">
          <Label className="text-xs font-semibold uppercase text-muted-foreground">Set your password</Label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input type="password" placeholder="Password" value={form.password} onChange={e => set('password', e.target.value)} className="pl-10 h-11" required />
          </div>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input type="password" placeholder="Confirm password" value={form.confirmPassword} onChange={e => set('confirmPassword', e.target.value)} className="pl-10 h-11 mt-2" required />
          </div>
        </div>
        <Button type="submit" className="w-full h-12 font-medium" disabled={loading}>
          {loading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Setting up...</> : <><UserPlus className="w-4 h-4 mr-2" /> Create portal account</>}
        </Button>
      </form>
    </AuthLayout>
  );
}