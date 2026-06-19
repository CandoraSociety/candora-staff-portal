import { useEffect } from 'react';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { PORTAL_MODULES, TIER_PRESETS } from '@/lib/tierPermissionPresets';

/**
 * Displays a checkbox list of portals.
 * `value` is an array of allowed module IDs.
 * `onChange(newArray)` is called on every toggle.
 * `orgTier` drives the suggested defaults.
 */
export default function PortalAccessSelector({ value = [], onChange, orgTier }) {
  // When the org tier changes, reset to tier defaults
  useEffect(() => {
    if (orgTier) {
      onChange(TIER_PRESETS[orgTier] || []);
    }
  }, [orgTier]);

  const toggle = (moduleId) => {
    if (value.includes(moduleId)) {
      onChange(value.filter(id => id !== moduleId));
    } else {
      onChange([...value, moduleId]);
    }
  };

  return (
    <div className="space-y-2">
      <p className="text-xs text-muted-foreground mb-3">
        Pre-selected based on org tier. Adjust as needed before saving.
      </p>
      <div className="grid grid-cols-1 gap-2">
        {PORTAL_MODULES.map(mod => (
          <label
            key={mod.id}
            className="flex items-center gap-3 p-2.5 rounded-lg border cursor-pointer hover:bg-muted/40 transition-colors"
            style={{ borderColor: value.includes(mod.id) ? '#2b2de8' : undefined, background: value.includes(mod.id) ? '#f0f0fe' : undefined }}
          >
            <Checkbox
              checked={value.includes(mod.id)}
              onCheckedChange={() => toggle(mod.id)}
            />
            <div>
              <p className="text-sm font-medium leading-tight">{mod.label}</p>
              <p className="text-xs text-muted-foreground">{mod.route}</p>
            </div>
          </label>
        ))}
      </div>
    </div>
  );
}