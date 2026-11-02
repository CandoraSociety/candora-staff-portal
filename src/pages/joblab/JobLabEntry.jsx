import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff, AlertTriangle } from 'lucide-react';
import { CandoraMark } from '@/components/joblab/JobLabBrand';
import { useParticipant } from '@/lib/joblab/ParticipantContext';
import { callJobLab } from '@/lib/joblab/api';
import { isOnsite, locationType } from '@/lib/joblab/constants';
import { JLButton, JLCard, JLInput, JLLabel, JLSpinner, JLTabs } from '@/components/joblab/ui';
import { useToast } from '@/components/ui/use-toast';

const TABS = [
  { value: 'signin', label: 'Sign In' },
  { value: 'register', label: 'Register' },
  { value: 'guest', label: 'Guest' },
];

export default function JobLabEntry() {
  const { participant, loading, login } = useParticipant();
  const navigate = useNavigate();
  const { toast } = useToast();
  const onsite = isOnsite();

  const [tab, setTab] = useState('signin');
  const [busy, setBusy] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [form, setForm] = useState({
    name: '', email: '', phone: '', password: '', confirm: '',
  });

  useEffect(() => {
    if (!loading && participant) navigate('/joblab/dashboard', { replace: true });
  }, [loading, participant, navigate]);

  const set = (key) => (event) => setForm((prev) => ({ ...prev, [key]: event.target.value }));

  const finish = (data, message) => {
    login(data);
    toast({ title: message });
    navigate('/joblab/dashboard', { replace: true });
  };

  const submitSignIn = async (event) => {
    event.preventDefault();
    if (busy) return;
    if (!form.email.trim()) {
      toast({ title: 'Please enter your email address.', variant: 'destructive' });
      return;
    }
    setBusy(true);
    try {
      const data = await callJobLab('login', {
        email: form.email,
        password: form.password,
        locationType: locationType(),
      });
      finish(data, `Welcome back, ${data.participant.name}!`);
    } catch (error) {
      toast({ title: error.message, variant: 'destructive' });
    } finally {
      setBusy(false);
    }
  };

  const submitRegister = async (event) => {
    event.preventDefault();
    if (busy) return;
    if (!form.name.trim() || !form.email.trim()) {
      toast({ title: 'Please enter your name and email address.', variant: 'destructive' });
      return;
    }
    if (form.password !== form.confirm) {
      toast({ title: 'Passwords do not match.', variant: 'destructive' });
      return;
    }
    if (form.password.length < 4) {
      toast({ title: 'Password must be at least 4 characters.', variant: 'destructive' });
      return;
    }
    setBusy(true);
    try {
      const data = await callJobLab('register', {
        name: form.name,
        email: form.email,
        phone: form.phone,
        password: form.password,
        locationType: locationType(),
      });
      finish(data, `Welcome, ${data.participant.name}! Your account has been created.`);
    } catch (error) {
      toast({ title: error.message, variant: 'destructive' });
    } finally {
      setBusy(false);
    }
  };

  const submitGuest = async (event) => {
    event.preventDefault();
    if (busy) return;
    setBusy(true);
    try {
      const data = await callJobLab('guest', {
        name: form.name,
        email: form.email,
        phone: form.phone,
        locationType: locationType(),
      });
      finish(data, 'Guest session started.');
    } catch (error) {
      toast({ title: error.message, variant: 'destructive' });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="joblab flex min-h-screen items-center justify-center bg-gradient-to-b from-jl-bg via-jl-bg to-jl-primary/5 px-4 py-10">
      <div className="w-full max-w-md animate-[fadeUp_0.5s_ease-out]">
        <div className="mb-7 text-center">
          <div className="mx-auto mb-3 w-fit">
            <CandoraMark className="h-16 w-16 shadow-md" />
          </div>
          <div className="mx-auto mb-4 h-0.5 w-14 rounded-full bg-jl-gold" />
          <h1 className="jl-heading text-3xl font-bold text-jl-fg">Job Lab</h1>
          <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-jl-primary">A Candora program</p>
          <p className="mt-2 text-sm font-medium text-jl-fg">
            {onsite ? 'Riverview Crossing Jobs Lab' : 'Your career starts here'}
          </p>
          <p className="text-xs text-jl-muted-fg">{onsite ? 'Onsite Portal' : 'Public Portal'}</p>
        </div>

        <JLCard className="overflow-hidden p-6">
          <JLTabs tabs={TABS} value={tab} onChange={setTab} className="mb-5 w-full" />

          {tab === 'signin' && (
            <form onSubmit={submitSignIn} className="space-y-4">
              <div>
                <JLLabel>Email</JLLabel>
                <JLInput type="email" value={form.email} onChange={set('email')} placeholder="you@example.com" autoComplete="email" />
              </div>
              <div>
                <JLLabel>Password</JLLabel>
                <div className="relative">
                  <JLInput
                    type={showPassword ? 'text' : 'password'}
                    value={form.password}
                    onChange={set('password')}
                    placeholder="Your password"
                    autoComplete="current-password"
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-jl-muted-fg"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
              <JLButton type="submit" size="lg" className="w-full" disabled={busy}>
                {busy ? <JLSpinner /> : null} Sign In
              </JLButton>
            </form>
          )}

          {tab === 'register' && (
            <form onSubmit={submitRegister} className="space-y-3.5">
              <div>
                <JLLabel>Full Name</JLLabel>
                <JLInput value={form.name} onChange={set('name')} placeholder="Your full name" />
              </div>
              <div>
                <JLLabel>Email</JLLabel>
                <JLInput type="email" value={form.email} onChange={set('email')} placeholder="you@example.com" />
              </div>
              <div>
                <JLLabel>Phone</JLLabel>
                <JLInput value={form.phone} onChange={set('phone')} placeholder="780-555-1234" />
              </div>
              <div>
                <JLLabel>Password</JLLabel>
                <JLInput type="password" value={form.password} onChange={set('password')} placeholder="At least 4 characters" />
              </div>
              <div>
                <JLLabel>Confirm Password</JLLabel>
                <JLInput type="password" value={form.confirm} onChange={set('confirm')} placeholder="Repeat your password" />
              </div>
              <JLButton type="submit" size="lg" className="w-full" disabled={busy}>
                {busy ? <JLSpinner /> : null} Create Account
              </JLButton>
            </form>
          )}

          {tab === 'guest' && (
            <form onSubmit={submitGuest} className="space-y-3.5">
              <div className="flex items-start gap-2 rounded-lg bg-jl-accent/10 px-3 py-2.5 text-xs text-jl-accent">
                <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                <span>
                  Guest mode: Your work won't be saved after you log out, but you can email or print
                  documents during your session.
                </span>
              </div>
              <div>
                <JLLabel>Full Name</JLLabel>
                <JLInput value={form.name} onChange={set('name')} placeholder="Your full name" />
              </div>
              <div>
                <JLLabel>Email</JLLabel>
                <JLInput type="email" value={form.email} onChange={set('email')} placeholder="you@example.com" />
              </div>
              <div>
                <JLLabel>Phone</JLLabel>
                <JLInput value={form.phone} onChange={set('phone')} placeholder="780-555-1234" />
              </div>
              <JLButton type="submit" variant="outline" size="lg" className="w-full" disabled={busy}>
                {busy ? <JLSpinner className="border-jl-primary/30 border-t-jl-primary" /> : null} Continue as Guest
              </JLButton>
            </form>
          )}
        </JLCard>

        <p className="mt-5 text-center text-[11px] text-jl-muted-fg">
          Need help? Ask the staff at the front desk.
        </p>
        <p className="mt-1.5 text-center text-[10px] text-jl-muted-fg/80">
          Job Lab is a Candora Society program · Edmonton, Alberta
        </p>
      </div>
    </div>
  );
}