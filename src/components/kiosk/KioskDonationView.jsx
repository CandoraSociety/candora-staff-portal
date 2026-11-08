import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Check, Heart } from 'lucide-react';
import KioskFrame from '@/components/kiosk/KioskFrame';

const DEFAULT_AMOUNTS = [10, 20, 50, 100];

export default function KioskDonationView({ prompt, onRespond, onClose }) {
  const amounts = prompt.amounts?.length ? prompt.amounts : DEFAULT_AMOUNTS;
  const [amount, setAmount] = useState(null);
  const [custom, setCustom] = useState('');
  const [form, setForm] = useState({ name: '', email: '' });
  const [monthly, setMonthly] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const chosen = custom ? Number(custom) : amount;

  const submit = async () => {
    if (!chosen || chosen <= 0) return;
    setBusy(true);
    setError('');
    try {
      await onRespond({
        amount: chosen,
        recurring: monthly,
        name: form.name,
        email: form.email,
        notes: [prompt.campaign_name, monthly ? 'Monthly gift' : 'Kiosk gift'].filter(Boolean).join(' — '),
      });
    } catch (e) {
      setError(e.response?.data?.error || e.message || 'Something went wrong. Please ask reception for help.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <KioskFrame prompt={prompt} icon={Heart} onClose={onClose}>
      <div className="space-y-6">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {amounts.map((value) => (
            <button
              key={value}
              onClick={() => { setAmount(value); setCustom(''); }}
              className={`h-24 rounded-2xl border-2 text-2xl font-bold transition-colors ${amount === value && !custom ? 'bg-primary text-primary-foreground border-primary' : 'bg-card text-foreground border-border hover:border-primary'}`}
            >
              ${value}
            </button>
          ))}
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-muted-foreground">Or enter another amount</label>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-2xl text-muted-foreground">$</span>
            <Input
              value={custom}
              onChange={(e) => { setCustom(e.target.value.replace(/[^0-9.]/g, '')); setAmount(null); }}
              inputMode="decimal"
              placeholder="0.00"
              className="h-16 pl-10 text-2xl"
            />
          </div>
        </div>

        <div className="grid sm:grid-cols-2 gap-3">
          <Input value={form.name} onChange={(e) => setForm(p => ({ ...p, name: e.target.value }))} placeholder="Your name (optional)" className="h-14 text-lg" />
          <Input value={form.email} onChange={(e) => setForm(p => ({ ...p, email: e.target.value }))} placeholder="Email for a receipt (optional)" className="h-14 text-lg" />
        </div>

        <button
          type="button"
          onClick={() => setMonthly((value) => !value)}
          className={`w-full flex items-center gap-4 rounded-2xl border-2 p-4 text-left transition-colors ${monthly ? 'border-primary bg-primary/10' : 'border-border bg-card hover:border-primary'}`}
        >
          <span className={`h-10 w-10 rounded-full border-2 flex items-center justify-center shrink-0 ${monthly ? 'bg-primary border-primary text-primary-foreground' : 'border-border text-transparent'}`}>
            <Check className="h-6 w-6" />
          </span>
          <span>
            <span className="block text-lg font-semibold">Make it a monthly gift</span>
            <span className="block text-sm text-muted-foreground">
              {monthly ? 'This amount will be given every month.' : 'Give this amount every month instead of once.'}
            </span>
          </span>
        </button>

        {error && <p className="text-sm text-destructive">{error}</p>}

        <Button onClick={submit} disabled={busy || !chosen || chosen <= 0} className="w-full h-16 text-xl font-semibold">
          {chosen > 0
            ? `Give $${Number(chosen).toFixed(2)}${monthly ? ' a month' : ''}`
            : 'Choose an amount'}
        </Button>
      </div>
    </KioskFrame>
  );
}