import React, { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Heart, ShoppingBag, ClipboardCheck, Plus, Trash2 } from 'lucide-react';

const KINDS = [
  { id: 'donation', label: 'Donation', icon: Heart },
  { id: 'purchase', label: 'Order', icon: ShoppingBag },
  { id: 'self_registration', label: 'Client Info', icon: ClipboardCheck },
];

const DEFAULTS = {
  donation: { title: 'Support Candora today', message: 'Choose an amount and we will take care of the rest at the counter.' },
  purchase: { title: 'Order at the counter', message: 'Pick what you would like and reception will bring it to you.' },
  self_registration: { title: 'Accessing services today?', message: 'Share your details so a resource worker can help you.' },
};

export default function KioskSendPromptDialog({ open, onOpenChange, station, initialKind = 'donation', sentByName, onSent }) {
  const [kind, setKind] = useState(initialKind);
  const [title, setTitle] = useState(DEFAULTS[initialKind].title);
  const [message, setMessage] = useState(DEFAULTS[initialKind].message);
  const [amounts, setAmounts] = useState('10, 20, 50, 100');
  const [campaignName, setCampaignName] = useState('');
  const [items, setItems] = useState([{ name: '', price: '' }]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!open) return;
    setKind(initialKind);
    setTitle(DEFAULTS[initialKind].title);
    setMessage(DEFAULTS[initialKind].message);
    setError('');
  }, [open, initialKind]);

  const switchKind = (next) => {
    setKind(next);
    setTitle(DEFAULTS[next].title);
    setMessage(DEFAULTS[next].message);
  };

  const updateItem = (index, field, value) => {
    setItems((prev) => prev.map((item, i) => (i === index ? { ...item, [field]: value } : item)));
  };

  const validItems = items.filter((item) => item.name.trim());

  const send = async () => {
    if (saving) return;
    if (kind === 'purchase' && !validItems.length) {
      setError('Add at least one thing the customer can order.');
      return;
    }
    setSaving(true);
    setError('');
    const payload = {
      station_id: station.id,
      station_name: station.name,
      kind,
      title: title.trim() || DEFAULTS[kind].title || 'Message',
      message: message.trim(),
      status: 'sent',
      sent_by_name: sentByName || '',
    };
    if (kind === 'donation') {
      payload.amounts = amounts
        .split(',')
        .map((value) => Number(value.trim()))
        .filter((value) => Number.isFinite(value) && value > 0);
      payload.campaign_name = campaignName.trim();
    }
    if (kind === 'purchase') {
      payload.items = validItems.map((item) => ({ name: item.name.trim(), price: Number(item.price) || 0 }));
    }
    try {
      await base44.entities.KioskPrompt.create(payload);
      onSent();
      onOpenChange(false);
    } catch (e) {
      setError(e.message || 'Could not send this to the tablet.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Send to {station?.name || 'the tablet'}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-2">
            {KINDS.map(({ id, label, icon: Icon }) => (
              <Button
                key={id}
                variant={kind === id ? 'default' : 'outline'}
                className="justify-start"
                onClick={() => switchKind(id)}
              >
                <Icon className="h-4 w-4" /> {label}
              </Button>
            ))}
          </div>

          <div className="space-y-1.5">
            <Label>Headline on the tablet</Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="What the customer sees first" />
          </div>

          <div className="space-y-1.5">
            <Label>Supporting line</Label>
            <Textarea value={message} onChange={(e) => setMessage(e.target.value)} rows={2} />
          </div>

          {kind === 'donation' && (
            <>
              <div className="space-y-1.5">
                <Label>Suggested amounts</Label>
                <Input value={amounts} onChange={(e) => setAmounts(e.target.value)} placeholder="10, 20, 50, 100" />
                <p className="text-xs text-muted-foreground">Separate with commas. The customer can also type their own amount.</p>
              </div>
              <div className="space-y-1.5">
                <Label>Campaign or appeal (optional)</Label>
                <Input value={campaignName} onChange={(e) => setCampaignName(e.target.value)} placeholder="Winter Warmth Appeal" />
              </div>
            </>
          )}

          {kind === 'purchase' && (
            <div className="space-y-2">
              <Label>What can they order</Label>
              {items.map((item, index) => (
                <div key={index} className="flex gap-2">
                  <Input
                    value={item.name}
                    onChange={(e) => updateItem(index, 'name', e.target.value)}
                    placeholder="Item name"
                    className="flex-1"
                  />
                  <Input
                    value={item.price}
                    onChange={(e) => updateItem(index, 'price', e.target.value.replace(/[^0-9.]/g, ''))}
                    placeholder="0.00"
                    inputMode="decimal"
                    className="w-24"
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setItems((prev) => (prev.length === 1 ? [{ name: '', price: '' }] : prev.filter((_, i) => i !== index)))}
                    aria-label="Remove item"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
              <Button variant="outline" size="sm" onClick={() => setItems((prev) => [...prev, { name: '', price: '' }])}>
                <Plus className="h-4 w-4" /> Add item
              </Button>
            </div>
          )}

          {kind === 'self_registration' && (
            <p className="text-xs text-muted-foreground">
              The tablet asks for their name, date of birth, contact details and what they need. What they send becomes their client file in the Resource Centre.
            </p>
          )}

          {error && <p className="text-sm text-destructive">{error}</p>}

          <Button onClick={send} disabled={saving} className="w-full">
            {saving ? 'Sending…' : 'Show on tablet'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}