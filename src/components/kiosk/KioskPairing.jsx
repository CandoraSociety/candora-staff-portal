import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, TabletSmartphone } from 'lucide-react';

// Shown the first time this tablet is opened. Staff read the code from the
// reception portal and type it here once; the tablet remembers it.
export default function KioskPairing({ brand, onPaired }) {
  const [value, setValue] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const connect = async () => {
    if (!value.trim() || busy) return;
    setBusy(true);
    setError('');
    try {
      const res = await base44.functions.invoke('kioskApi', { action: 'pair', access_code: value.trim() });
      const station = res.data?.station;
      if (!station) throw new Error('That code is not recognised.');
      onPaired({ id: station.id, name: station.name, code: value.trim() });
    } catch (e) {
      setError(e.response?.data?.error || e.message || 'Could not connect this tablet.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen bg-sidebar flex flex-col items-center justify-center px-6 py-16">
      <div className="w-full max-w-md text-center">
        {brand?.logo_url ? (
          <img src={brand.logo_url} alt={brand.name} className="h-16 w-auto mx-auto object-contain" />
        ) : (
          <div className="h-16 w-16 rounded-2xl bg-sidebar-primary mx-auto flex items-center justify-center">
            <TabletSmartphone className="h-7 w-7 text-sidebar-primary-foreground" />
          </div>
        )}
        <h1 className="mt-6 text-sidebar-foreground font-display font-bold text-3xl">Set up this tablet</h1>
        <p className="mt-2 text-sidebar-foreground/70">
          Ask the reception team for the code for this tablet, then enter it below.
        </p>

        <div className="mt-8 bg-card rounded-2xl p-6 text-left shadow-lg space-y-3">
          <Label htmlFor="kiosk-code" className="text-base">Tablet code</Label>
          <Input
            id="kiosk-code"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && connect()}
            placeholder="e.g. 4821"
            inputMode="numeric"
            autoComplete="off"
            className="h-16 text-center text-3xl tracking-[0.4em] font-semibold"
          />
          {error && <p className="text-sm text-destructive">{error}</p>}
          <Button onClick={connect} disabled={busy || !value.trim()} className="w-full h-14 text-lg font-semibold">
            {busy ? <Loader2 className="h-5 w-5 animate-spin" /> : 'Connect this tablet'}
          </Button>
        </div>
      </div>
    </div>
  );
}