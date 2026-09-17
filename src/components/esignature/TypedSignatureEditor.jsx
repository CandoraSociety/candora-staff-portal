import React from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { SIGNATURE_FONTS, SIGNATURE_COLORS } from '@/lib/esignature';

const EFFECTS = [
  { key: 'bold', label: 'Bold' },
  { key: 'italic', label: 'Italic' },
  { key: 'underline', label: 'Underline' },
  { key: 'shadow', label: 'Shadow' },
  { key: 'glow', label: 'Glow' },
  { key: 'outline', label: 'Outline' },
];

export default function TypedSignatureEditor({ value, onChange }) {
  return (
    <div className="space-y-4">
      <div className="space-y-1.5">
        <Label>Signature text</Label>
        <Input
          value={value.typed_text || ''}
          onChange={(e) => onChange({ ...value, typed_text: e.target.value })}
          placeholder="Your name"
        />
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label>Font</Label>
          <Select value={value.font_family} onValueChange={(v) => onChange({ ...value, font_family: v })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {SIGNATURE_FONTS.map((f) => (
                <SelectItem key={f.value} value={f.value}>
                  <span style={{ fontFamily: f.value, fontSize: 16 }}>{f.label}</span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label>Colour</Label>
          <div className="flex flex-wrap items-center gap-2 pt-1">
            {SIGNATURE_COLORS.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => onChange({ ...value, font_color: c })}
                className="w-6 h-6 rounded-full border-2 transition-colors"
                style={{ backgroundColor: c, borderColor: value.font_color === c ? 'hsl(var(--primary))' : 'hsl(var(--border))' }}
                title={c}
              />
            ))}
            <input
              type="color"
              value={value.font_color || '#0f172a'}
              onChange={(e) => onChange({ ...value, font_color: e.target.value })}
              className="w-7 h-7 rounded cursor-pointer border border-border bg-transparent p-0.5"
              title="Custom colour"
            />
          </div>
        </div>
      </div>

      <div className="space-y-3">
        <Label>Effects</Label>
        <div className="flex flex-wrap gap-x-6 gap-y-3">
          {EFFECTS.map(({ key, label }) => (
            <div key={key} className="flex items-center gap-2">
              <Switch
                id={`sig-${key}`}
                checked={!!value[key]}
                onCheckedChange={(v) => onChange({ ...value, [key]: v })}
              />
              <Label htmlFor={`sig-${key}`}>{label}</Label>
            </div>
          ))}
        </div>
        <div className="flex items-center gap-3">
          <Label className="whitespace-nowrap">Letter spacing</Label>
          <input
            type="range"
            min="-2"
            max="12"
            step="0.5"
            value={value.letter_spacing || 0}
            onChange={(e) => onChange({ ...value, letter_spacing: parseFloat(e.target.value) })}
            className="w-28"
          />
          <span className="text-xs text-muted-foreground w-12">{value.letter_spacing || 0}px</span>
        </div>
      </div>
    </div>
  );
}