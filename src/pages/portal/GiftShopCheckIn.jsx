import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { CANDORA_BRAND } from '@/lib/candoraBrand';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { CheckCircle2, Loader2 } from 'lucide-react';

// The family's side of check-in. Opened by scanning the QR code at the Kids
// Gift Shop desk, on their own phone: they type the six-digit code from their
// confirmation email, see what they registered for, then type the name that
// prints on their parent or guardian name tag. Nothing else in the app is
// reachable from here.
export default function GiftShopCheckIn() {
  const sessionToken = new URLSearchParams(window.location.search).get('t') || '';
  const [step, setStep] = useState('code');
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [family, setFamily] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const call = async (payload) => {
    const response = await base44.functions.invoke('giftShopCheckin', { session_token: sessionToken, ...payload });
    if (response.data?.error) throw new Error(response.data.error);
    return response.data;
  };

  const reason = (err) => err?.response?.data?.error || err?.message || 'Something went wrong. Please ask a volunteer for help.';

  const lookup = async (event) => {
    event.preventDefault();
    setError('');
    setBusy(true);
    try {
      const data = await call({ action: 'lookup', code });
      setFamily(data.family);
      setName(data.family?.guardian_name || '');
      setStep('name');
    } catch (err) {
      setError(reason(err));
    } finally {
      setBusy(false);
    }
  };

  const submit = async (event) => {
    event.preventDefault();
    setError('');
    setBusy(true);
    try {
      const data = await call({ action: 'submit', code, guardian_name: name });
      setFamily(data.family);
      setStep('done');
    } catch (err) {
      setError(reason(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen bg-accent px-4 py-8">
      <div className="mx-auto w-full max-w-md">
        <div className="mb-5 flex items-center gap-3">
          <img src={CANDORA_BRAND.logoUrl} alt="Candora" className="h-10 w-10 object-contain" />
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-primary">Winter Wonderland</p>
            <h1 className="font-display text-lg font-bold leading-tight text-white">Kids Gift Shop check-in</h1>
          </div>
        </div>

        <div className="rounded-2xl bg-card p-6 shadow-xl">
          {!sessionToken ? (
            <div className="space-y-2">
              <h2 className="font-display text-xl font-bold">Scan the code at the desk</h2>
              <p className="text-sm text-muted-foreground">
                This page only works from the QR code at the Kids Gift Shop check-in desk. Please scan it with your
                phone camera, or ask a volunteer for help.
              </p>
            </div>
          ) : step === 'code' ? (
            <form onSubmit={lookup} className="space-y-4">
              <div>
                <h2 className="font-display text-2xl font-bold leading-tight">Enter your check-in code</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Type the six-digit code from your confirmation email.
                </p>
              </div>
              <Input
                value={code}
                onChange={(event) => setCode(event.target.value.replace(/\D/g, '').slice(0, 6))}
                inputMode="numeric"
                autoComplete="one-time-code"
                placeholder="123456"
                autoFocus
                aria-label="Six-digit check-in code"
                className="h-16 text-center font-display text-4xl font-bold tracking-[0.35em]"
              />
              {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
              <Button type="submit" size="lg" className="w-full" disabled={busy || code.length !== 6}>
                {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                {busy ? 'Checking your code…' : 'Continue'}
              </Button>
            </form>
          ) : step === 'name' ? (
            <form onSubmit={submit} className="space-y-4">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-muted-foreground">Your registration</p>
                <h2 className="font-display text-2xl font-bold leading-tight">
                  {family?.guardian_name || 'Your family'}
                </h2>
                {family?.time_label && <p className="text-sm font-semibold text-muted-foreground">Shopping time {family.time_label}</p>}
              </div>

              <ul className="space-y-2 rounded-xl border bg-muted/40 p-3">
                {(family?.children || []).map((child) => (
                  <li key={`${child.name}-${child.gifts}`} className="text-sm">
                    <span className="font-semibold text-foreground">{child.name}</span>
                    {child.age ? <span className="text-muted-foreground"> · {child.age}</span> : null}
                    <span className="block text-xs text-muted-foreground">{child.gifts}</span>
                  </li>
                ))}
              </ul>

              <div className="space-y-1.5">
                <Label htmlFor="guardian-name">Your name — this prints on your name tag</Label>
                <Input
                  id="guardian-name"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  autoComplete="name"
                  autoFocus
                  className="h-12 text-lg"
                />
              </div>

              {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
              <Button type="submit" size="lg" className="w-full" disabled={busy || !name.trim()}>
                {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                {busy ? 'Checking you in…' : 'Submit and print my name tag'}
              </Button>
            </form>
          ) : (
            <div className="space-y-3 text-center">
              <CheckCircle2 className="mx-auto h-12 w-12 text-success" />
              <h2 className="font-display text-2xl font-bold leading-tight">You’re checked in, {family?.guardian_name || name}</h2>
              <p className="text-sm text-muted-foreground">
                Your parent or guardian name tag is printing at the desk. Please wait there and a volunteer will take
                you to the shop.
              </p>
              {(family?.children || []).length > 0 && (
                <p className="text-sm font-semibold">
                  Shopping with: {(family.children || []).map((child) => child.name).join(', ')}
                </p>
              )}
            </div>
          )}
        </div>

        <p className="mt-5 text-center text-xs text-white/70">
          Keep your code to yourself — it opens your family’s registration.
        </p>
      </div>
    </div>
  );
}