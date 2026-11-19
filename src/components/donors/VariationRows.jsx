import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Plus, Trash2 } from 'lucide-react';
import { formatMoney } from '@/lib/donorConstants';

export const newVariation = () => ({
  id: `var-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
  label: '',
  amount: '',
});

// Prices a supporter can choose between for one giving option — e.g. One week
// $25 / One month $90. Each one becomes its own price in Stripe.
export default function VariationRows({ variations = [], onChange }) {
  const set = (index, key, value) =>
    onChange(variations.map((variation, i) => (i === index ? { ...variation, [key]: value } : variation)));

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <Label>Price variations</Label>
        <span className="text-xs text-muted-foreground">Optional — e.g. $25, $50, $100</span>
      </div>

      {variations.map((variation, index) => (
        <div key={variation.id} className="flex items-center gap-2">
          <Input
            value={variation.label || ''}
            onChange={(e) => set(index, 'label', e.target.value)}
            placeholder={`Option ${index + 1} (e.g. One week)`}
            className="flex-1"
          />
          <Input
            type="number"
            min="1"
            step="1"
            value={variation.amount}
            onChange={(e) => set(index, 'amount', e.target.value)}
            placeholder="Amount"
            className="w-28"
          />
          <Button
            variant="ghost"
            size="icon"
            className="text-destructive shrink-0"
            aria-label="Remove variation"
            onClick={() => onChange(variations.filter((_, i) => i !== index))}
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      ))}

      <Button variant="outline" size="sm" onClick={() => onChange([...variations, newVariation()])}>
        <Plus className="w-3.5 h-3.5 mr-1" /> Add price variation
      </Button>
    </div>
  );
}

// Drops empty rows, names a blank label after its amount, and keeps the Stripe
// price already attached so re-saving does not create a new one.
export const cleanVariations = (variations = []) =>
  variations
    .filter((variation) => Number(variation.amount) > 0)
    .map((variation) => ({
      id: variation.id || newVariation().id,
      label: (variation.label || '').trim() || formatMoney(variation.amount),
      amount: Number(variation.amount),
      ...(variation.stripe_price_id ? { stripe_price_id: variation.stripe_price_id } : {}),
      ...(variation.stripe_price_amount != null
        ? { stripe_price_amount: Number(variation.stripe_price_amount) }
        : {}),
    }));