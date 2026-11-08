import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { HandHeart, Loader2, Tablet } from 'lucide-react';

// A tablet that has not been paired yet asks for the short code from the portal.
// Classroom tablets are added by Central Registration, so this is how a brand
// new screen gets pointed at the right station.
export default function KioskPairing({ brand, onPaired }) {
  const [value, setValue] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const pair = async () => {
    const entered = value.trim();
    if (!entered || busy) return;
    setBusy(true);
    setError('');
    try {
      const res = await base44.functions.invoke('kioskApi', { action: 'pair', access_code: entered });
      const station = res.data?.station;
      if (!station) {
        setError('That code is not recognised.');
        return;
      }
      onPaired(station, res.data?.brand);
    } catch (e) {
      setError(e.response?.data?.error || 'That code is not recognised. Check the portal for this tablet.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen bg-sidebar flex flex-col items-center justify-center px-6 text-center">
      {brand?.logo_url ? (
        <img src={brand.logo_url} alt={brand.name} className="h-40 w-auto object-contain mb-8" />
      ) : (
        <div className="h-24 w-24 rounded-3xl bg-sidebar-primary flex items-center justify-center mb-8">
          <HandHeart className="h-12 w-12 text-sidebar-primary-foreground" />
        </div>
      )}
      <h1 className="text-sidebar-foreground font-display font-bold text-3xl">Set up this tablet</h1>
      <p className="mt-3 text-sidebar-foreground/70 text-lg max-w-md">
        Type the code shown in Central Registration for this tablet. You only do this once.
      </p>

      <div className="mt-8 w-full max-w-xs space-y-3">
        <Input
          value={value}
          onChange={(e) => { setValue(e.target.value.replace(/[^0-9a-zA-Z]/g, '').slice(0, 6)); setError(''); }}
          onKeyDown={(e) => { if (e.key === 'Enter') pair(); }}
          inputMode="numeric"
          placeholder="0000"
          className="h-20 text-center text-4xl tracking-[0.4em] font-bold"
        />
        {error && <p className="text-sm text-destructive-foreground bg-destructive/20 rounded-lg p-2">{error}</p>}
        <Button onClick={pair} disabled={busy || !value.trim()} className="w-full h-14 text-lg gap-2">
          {busy ? <Loader2 className="h-5 w-5 animate-spin" /> : <Tablet className="h-5 w-5" />}
          Connect this tablet
        </Button>
      </div>
    </div>
  );
}