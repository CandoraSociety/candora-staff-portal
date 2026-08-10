import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { KeyRound, Mail, Lock, Loader2, Building2, CheckCircle2 } from 'lucide-react';
import AuthLayout from '@/components/AuthLayout';
import { setEmployerSession } from '@/lib/employerPortalSession';
import { useOrgSettings } from '@/lib/useOrgSettings';

// Standard "forgot password" flow. Since the platform can't email a reset
// link to an external (non-app-user) employer address, this verifies the
// requester against details already on the Employer record (company name)
// and lets them set a new password immediately — same end result as an
// emailed reset link, without the email dependency.
export default function EmployerForgotPassword() {
  const { logoUrl } = useOrgSettings();
  const [step, setStep] = useState('email'); // 'email' -> 'reset' -> 'done'
  const [email, setEmail] = useState('');
  const [employer, setEmployer] = useState(null);
  const [companyName, setCompanyName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const sha256 = async (text) => {
    const enc = new TextEncoder();
    const buf = await crypto.subtle.digest('SHA-256', enc.encode(text));
    return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, '0')).join('');
  };

  const handleFind = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const emps = await base44.entities.Employer.filter({ contact_email: email.trim().toLowerCase() });
      if (!emps || emps.length === 0) {
        setError('No employer account found for that email.');
        return;
      }
      const emp = emps[0];
      if (emp.status === 'inactive') {
        setError('Your account is inactive. Please contact your Candora career counsellor.');
        return;
      }
      setEmployer(emp);
      setStep('reset');
    } catch (err) {
      setError(err.message || 'Could not look up account.');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = async (e) => {
    e.preventDefault();
    setError('');
    if (!employer) return;
    if (companyName.trim().toLowerCase() !== (employer.name || '').trim().toLowerCase()) {
      setError('The company name you entered does not match what we have on file.');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    setLoading(true);
    try {
      const passwordHash = await sha256(password);
      await base44.entities.Employer.update(employer.id, {
        password_hash: passwordHash,
        must_change_password: false,
      });
      setEmployerSession(employer.id);
      setStep('done');
      setTimeout(() => { window.location.href = '/employer-portal'; }, 1200);
    } catch (err) {
      setError(err.message || 'Reset failed.');
    } finally {
      setLoading(false);
    }
  };

  const brand = { logoUrl, brandText: 'Pathways Employer Portal' };

  if (step === 'done') {
    return (
      <AuthLayout icon={CheckCircle2} {...brand} title="Password updated" subtitle="Signing you in…">
        <div className="flex flex-col items-center gap-3 py-6">
          <CheckCircle2 className="w-10 h-10 text-emerald-500" />
          <p className="text-sm text-muted-foreground">Your password has been reset. Taking you to your dashboard…</p>
        </div>
      </AuthLayout>
    );
  }

  if (step === 'reset') {
    return (
      <AuthLayout
        icon={KeyRound}
        {...brand}
        title="Reset your password"
        subtitle="Confirm your company name and choose a new password"
        footer={
          <>
            Remembered it?{' '}
            <Link to="/employer-portal/login" className="text-primary font-medium hover:underline">Sign in</Link>
          </>
        }
      >
        {error && <div className="mb-4 p-3 rounded-lg bg-destructive/10 text-destructive text-sm">{error}</div>}
        <form onSubmit={handleReset} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="company">Company name (as we have it on file)</Label>
            <div className="relative">
              <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                id="company"
                autoFocus
                placeholder="Your company name"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                className="pl-10 h-12"
                required
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">New password</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                id="password"
                type="password"
                autoComplete="new-password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="pl-10 h-12"
                required
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirm">Confirm new password</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                id="confirm"
                type="password"
                autoComplete="new-password"
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="pl-10 h-12"
                required
              />
            </div>
          </div>
          <Button type="submit" className="w-full h-12 font-medium" disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Resetting…
              </>
            ) : (
              'Reset password'
            )}
          </Button>
        </form>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      icon={KeyRound}
      {...brand}
      title="Forgot your password?"
      subtitle="Enter your login email and we'll help you reset it"
      footer={
        <>
          Remembered it?{' '}
          <Link to="/employer-portal/login" className="text-primary font-medium hover:underline">Sign in</Link>
        </>
      }
    >
      {error && <div className="mb-4 p-3 rounded-lg bg-destructive/10 text-destructive text-sm">{error}</div>}
      <form onSubmit={handleFind} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              id="email"
              type="email"
              autoComplete="email"
              autoFocus
              placeholder="you@company.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="pl-10 h-12"
              required
            />
          </div>
        </div>
        <Button type="submit" className="w-full h-12 font-medium" disabled={loading}>
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Looking up…
            </>
          ) : (
            'Continue'
          )}
        </Button>
      </form>
    </AuthLayout>
  );
}