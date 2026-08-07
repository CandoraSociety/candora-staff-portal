import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { UserPlus, Mail, Lock, Loader2, Building2 } from 'lucide-react';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';
import AuthLayout from '@/components/AuthLayout';
import { toast } from 'sonner';

const EMPTY = {
  first_name: '', last_name: '', position: '',
  email: '', phone: '',
  name: '', address: '', industry: '',
  alt_contact_name: '', alt_contact_position: '', alt_contact_phone: '', alt_contact_email: '',
  password: '', confirmPassword: '',
};

export default function EmployerRegister() {
  const [form, setForm] = useState(EMPTY);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showOtp, setShowOtp] = useState(false);
  const [otpCode, setOtpCode] = useState('');

  const set = (f, v) => setForm(p => ({ ...p, [f]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!form.name.trim()) return setError('Company name is required');
    if (!form.first_name.trim() || !form.last_name.trim()) return setError('Contact first and last name are required');
    if (!form.email.trim()) return setError('Email is required');
    if (form.password.length < 6) return setError('Password must be at least 6 characters');
    if (form.password !== form.confirmPassword) return setError('Passwords do not match');
    setLoading(true);
    try {
      await base44.auth.register({ email: form.email, password: form.password });
      setShowOtp(true);
    } catch (err) {
      setError(err.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  const createEmployerProfile = async () => {
    const me = await base44.auth.me();
    await base44.entities.Employer.create({
      name: form.name.trim(),
      first_name: form.first_name.trim(),
      last_name: form.last_name.trim(),
      position: form.position.trim(),
      contact_name: `${form.first_name.trim()} ${form.last_name.trim()}`,
      contact_email: form.email.trim(),
      contact_phone: form.phone.trim(),
      alt_contact_name: form.alt_contact_name.trim(),
      alt_contact_position: form.alt_contact_position.trim(),
      alt_contact_phone: form.alt_contact_phone.trim(),
      alt_contact_email: form.alt_contact_email.trim(),
      address: form.address.trim(),
      industry: form.industry.trim(),
      user_id: me.id,
      status: 'active',
      notes: '',
    });
  };

  const handleVerify = async () => {
    setError('');
    setLoading(true);
    try {
      const result = await base44.auth.verifyOtp({ email: form.email, otpCode });
      if (result?.access_token) base44.auth.setToken(result.access_token);
      try {
        await createEmployerProfile();
      } catch (err) {
        // Profile creation failed — log the partial account out so they can retry.
        await base44.auth.logout();
        throw new Error('Account created but profile setup failed: ' + (err.message || 'unknown error'));
      }
      toast.success('Employer account created');
      window.location.href = '/employer-portal';
    } catch (err) {
      setError(err.message || 'Invalid verification code');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setError('');
    try {
      await base44.auth.resendOtp(form.email);
      toast.success('A new code was sent to your email');
    } catch (err) {
      setError(err.message || 'Failed to resend code');
    }
  };

  if (showOtp) {
    return (
      <AuthLayout icon={Mail} title="Verify your email" subtitle={`We sent a code to ${form.email}`}>
        {error && <div className="mb-4 p-3 rounded-lg bg-destructive/10 text-destructive text-sm">{error}</div>}
        <div className="flex justify-center mb-6">
          <InputOTP maxLength={6} value={otpCode} onChange={setOtpCode} autoFocus autoComplete="one-time-code">
            <InputOTPGroup>
              <InputOTPSlot index={0} /><InputOTPSlot index={1} /><InputOTPSlot index={2} />
              <InputOTPSlot index={3} /><InputOTPSlot index={4} /><InputOTPSlot index={5} />
            </InputOTPGroup>
          </InputOTP>
        </div>
        <Button className="w-full h-12 font-medium" onClick={handleVerify} disabled={loading || otpCode.length < 6}>
          {loading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Verifying...</> : 'Verify & create account'}
        </Button>
        <p className="text-center text-sm text-muted-foreground mt-4">
          Didn't receive the code?{' '}
          <button onClick={handleResend} className="text-primary font-medium hover:underline">Resend</button>
        </p>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      icon={Building2}
      title="Register your company"
      subtitle="Create an Employer Portal account to submit work exposure hours"
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
          <Input placeholder="Company address" value={form.address} onChange={e => set('address', e.target.value)} className="h-11 mt-2" />
          <Input placeholder="Industry" value={form.industry} onChange={e => set('industry', e.target.value)} className="h-11 mt-2" />
        </div>
        <div className="space-y-1">
          <Label className="text-xs font-semibold uppercase text-muted-foreground">Primary contact</Label>
          <div className="grid grid-cols-2 gap-2">
            <Input placeholder="First name *" value={form.first_name} onChange={e => set('first_name', e.target.value)} className="h-11" required />
            <Input placeholder="Last name *" value={form.last_name} onChange={e => set('last_name', e.target.value)} className="h-11" required />
          </div>
          <Input placeholder="Position / title" value={form.position} onChange={e => set('position', e.target.value)} className="h-11 mt-2" />
          <div className="grid grid-cols-2 gap-2 mt-2">
            <Input type="email" placeholder="Email (login) *" value={form.email} onChange={e => set('email', e.target.value)} className="h-11" required />
            <Input placeholder="Phone" value={form.phone} onChange={e => set('phone', e.target.value)} className="h-11" />
          </div>
        </div>
        <div className="space-y-1">
          <Label className="text-xs font-semibold uppercase text-muted-foreground">Alternate contact (optional)</Label>
          <div className="grid grid-cols-2 gap-2">
            <Input placeholder="Name" value={form.alt_contact_name} onChange={e => set('alt_contact_name', e.target.value)} className="h-11" />
            <Input placeholder="Position" value={form.alt_contact_position} onChange={e => set('alt_contact_position', e.target.value)} className="h-11" />
          </div>
          <div className="grid grid-cols-2 gap-2 mt-2">
            <Input placeholder="Phone" value={form.alt_contact_phone} onChange={e => set('alt_contact_phone', e.target.value)} className="h-11" />
            <Input type="email" placeholder="Email" value={form.alt_contact_email} onChange={e => set('alt_contact_email', e.target.value)} className="h-11" />
          </div>
        </div>
        <div className="space-y-1">
          <Label className="text-xs font-semibold uppercase text-muted-foreground">Login</Label>
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
          {loading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Creating account...</> : <><UserPlus className="w-4 h-4 mr-2" /> Create employer account</>}
        </Button>
      </form>
    </AuthLayout>
  );
}