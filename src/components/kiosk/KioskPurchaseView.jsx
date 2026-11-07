import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { ShoppingBag, Minus, Plus } from 'lucide-react';
import KioskFrame from '@/components/kiosk/KioskFrame';

export default function KioskPurchaseView({ prompt, onRespond, onClose }) {
  const items = prompt.items || [];
  const [quantities, setQuantities] = useState({});
  const [name, setName] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const change = (itemName, delta) => {
    setQuantities((prev) => {
      const next = Math.max(0, (prev[itemName] || 0) + delta);
      return { ...prev, [itemName]: next };
    });
  };

  const lines = items
    .filter((item) => (quantities[item.name] || 0) > 0)
    .map((item) => ({ name: item.name, price: Number(item.price) || 0, quantity: quantities[item.name] }));
  const total = lines.reduce((sum, line) => sum + line.price * line.quantity, 0);

  const submit = async () => {
    if (!lines.length) return;
    setBusy(true);
    setError('');
    try {
      await onRespond({ total, items: lines, name, notes: 'Order taken at the kiosk' });
    } catch (e) {
      setError(e.response?.data?.error || e.message || 'Something went wrong. Please ask reception for help.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <KioskFrame prompt={prompt} icon={ShoppingBag} onClose={onClose}>
      <div className="space-y-4">
        {items.length === 0 ? (
          <p className="text-muted-foreground text-center py-8">Nothing is available to order right now.</p>
        ) : (
          <div className="space-y-3">
            {items.map((item) => {
              const qty = quantities[item.name] || 0;
              return (
                <div key={item.name} className={`flex items-center justify-between gap-4 rounded-2xl border-2 p-4 ${qty > 0 ? 'border-primary bg-card' : 'border-border bg-card'}`}>
                  <div className="min-w-0">
                    <p className="text-lg font-semibold truncate">{item.name}</p>
                    <p className="text-muted-foreground">${(Number(item.price) || 0).toFixed(2)}</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button onClick={() => change(item.name, -1)} disabled={qty === 0} className="h-12 w-12 rounded-xl border border-border flex items-center justify-center disabled:opacity-40">
                      <Minus className="h-5 w-5" />
                    </button>
                    <span className="w-8 text-center text-xl font-bold">{qty}</span>
                    <button onClick={() => change(item.name, 1)} className="h-12 w-12 rounded-xl bg-primary text-primary-foreground flex items-center justify-center">
                      <Plus className="h-5 w-5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Your name (optional)"
          className="w-full h-14 rounded-md border border-input bg-transparent px-3 text-lg"
        />

        {error && <p className="text-sm text-destructive">{error}</p>}

        <div className="rounded-2xl bg-muted p-4 flex items-center justify-between">
          <span className="text-lg font-medium">Total</span>
          <span className="text-3xl font-bold">${total.toFixed(2)}</span>
        </div>

        <Button onClick={submit} disabled={busy || !lines.length} className="w-full h-16 text-xl font-semibold">
          {lines.length ? 'Place my order' : 'Choose something to order'}
        </Button>
      </div>
    </KioskFrame>
  );
}