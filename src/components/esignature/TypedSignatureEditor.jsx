import React from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { SIGNATURE_FONTS, SIGNATURE_COLORS } from '@/lib/esignature';

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
          <div className="flex items-center gap-2 pt-1">
            {SIGNATURE_COLORS.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => onChange({ ...value, font_color: c })}
                className="w-7 h-7 rounded-full border-2 transition-colors"
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

      <div className="flex flex-wrap gap-5">
        {[
          { key: 'bold', label: 'Bold' },
          { key: 'italic', label: 'Italic' },
          { key: 'shadow', label: 'Shadow' },
        ].map(({ key, label }) => (
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
    </div>
  );
}