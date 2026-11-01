import React from 'react';
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';

// The one switch that turns simple mode on and off. Each user flips their own.
export default function SimpleModeToggle({ simpleMode, onChange, onDark = false, className }) {
  return (
    <label
      className={cn(
        'flex items-center gap-2 text-xs font-semibold cursor-pointer select-none',
        onDark ? 'text-white/90' : 'text-muted-foreground',
        className
      )}
      title="Show only the essentials for basic tasks"
    >
      <Switch checked={simpleMode} onCheckedChange={onChange} aria-label="Simple mode" />
      Simple mode
    </label>
  );
}