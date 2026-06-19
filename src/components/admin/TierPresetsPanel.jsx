import { useState } from 'react';
import { PORTAL_MODULES, TIER_PRESETS, TIER_LABELS } from '@/lib/tierPermissionPresets';
import { Check, X, Info } from 'lucide-react';

/**
 * Read-only visual reference of what each org tier gets by default.
 * Future: make it editable and persist to a settings entity.
 */
export default function TierPresetsPanel() {
  const tiers = Object.keys(TIER_LABELS);

  return (
    <div className="space-y-4">
      <div className="flex items-start gap-2 p-3 rounded-lg bg-blue-50 border border-blue-200 text-sm text-blue-800">
        <Info className="w-4 h-4 mt-0.5 flex-shrink-0" />
        <p>These presets define which portals new employees can access based on their org tier. They are applied automatically when a new employee is added in NexusHR.</p>
      </div>

      <div className="overflow-x-auto rounded-xl border border-border">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 border-b border-border">
            <tr>
              <th className="p-3 text-left font-semibold text-foreground min-w-[160px]">Portal / Module</th>
              {tiers.map(tier => (
                <th key={tier} className="p-3 text-center font-semibold text-foreground whitespace-nowrap">
                  {TIER_LABELS[tier]}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {PORTAL_MODULES.map(mod => (
              <tr key={mod.id} className="hover:bg-muted/20 transition-colors">
                <td className="p-3 font-medium text-foreground">
                  <div>{mod.label}</div>
                  <div className="text-xs text-muted-foreground font-mono">{mod.route}</div>
                </td>
                {tiers.map(tier => {
                  const allowed = (TIER_PRESETS[tier] || []).includes(mod.id);
                  return (
                    <td key={tier} className="p-3 text-center">
                      {allowed
                        ? <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-emerald-100 text-emerald-700"><Check className="w-3.5 h-3.5" /></span>
                        : <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-muted text-muted-foreground"><X className="w-3.5 h-3.5" /></span>
                      }
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="text-xs text-muted-foreground">
        * Individual overrides can be added per-user after they've been created. Presets only apply at the time of employee creation.
      </p>
    </div>
  );
}