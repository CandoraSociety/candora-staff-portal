import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { LogIn, Mail, Lock, Loader2 } from 'lucide-react';
import AuthLayout from '@/components/AuthLayout';
import { setEmployerSession } from '@/lib/employerPortalSession';
import { useOrgSettings } from '@/lib/useOrgSettings';

export default function EmployerLogin() {
  const { logoUrl } = useOrgSettings();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
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
      if (!emp.password_hash) {
        setError("Your portal account isn't set up yet. Please use the registration link your Candora contact sent you.");
        return;
      }
      const encoder = new TextEncoder();
      const data = encoder.encode(password);
      const hashBuffer = await crypto.subtle.digest('SHA-256', data);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const hash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
      if (hash !== emp.password_hash) {
        setError('Incorrect password.');
        return;
      }
      if (emp.status === 'inactive') {
        setError('Your account is inactive. Please contact your Candora career counsellor.');
        return;
      }
      setEmployerSession(emp.id);
      window.location.href = '/employer-portal';
    } catch (err) {
      setError(err.message || 'Sign in failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      icon={LogIn}
      logoUrl={logoUrl}
      brandText="Pathways Employer Portal"
      title="Pathways Employer Portal"
      subtitle="Sign in to submit work exposure hours"
      footer={
        <>
          Need an account?{' '}
          <span className="text-muted-foreground">Ask your Candora contact for a registration link.</span>
        </>
      }
    >
      {error && (
        <div className="mb-4 p-3 rounded-lg bg-destructive/10 text-destructive text-sm">{error}</div>
      )}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" aria-hidden="true" />
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
        <div className="space-y-2">
          <Label htmlFor="password">Password</Label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" aria-hidden="true" />
            <Input
              id="password"
              type="password"
              autoComplete="current-password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="pl-10 h-12"
              required
            />
          </div>
        </div>
        <Button type="submit" className="w-full h-12 font-medium" disabled={loading}>
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Signing in...
            </>
          ) : (
            'Sign in'
          )}
        </Button>
      </form>
      <p className="text-center text-xs text-muted-foreground mt-4">
        This portal is for work exposure placement employers only.
      </p>
    </AuthLayout>
  );
}