import { useState, useMemo, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { DEFAULT_TIER_CONFIGS, DEFAULT_TIER_PORTAL_ACCESS, LOCKED_PORTAL_ACCESS, LOCKED_TIER_IDS } from '@/lib/tierPermissionPresets';
import { Check, X, Info, Lock, Plus, Trash2, Save, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/use-toast';

export default function TierPresetsPanel() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: cards = [], isLoading: cardsLoading } = useQuery({
    queryKey: ['portalCards'],
    queryFn: () => base44.entities.PortalCard.list(),
  });

  const { data: orgSettingsList = [] } = useQuery({
    queryKey: ['orgSettings'],
    queryFn: () => base44.entities.OrgSettings.list(),
  });
  const orgSettings = orgSettingsList[0];

  const defaultTiers = orgSettings?.tier_configs?.length > 0 ? orgSettings.tier_configs : DEFAULT_TIER_CONFIGS;
  const defaultAccess = orgSettings?.tier_portal_access || DEFAULT_TIER_PORTAL_ACCESS;

  const [tiers, setTiers] = useState(defaultTiers);
  const [accessMatrix, setAccessMatrix] = useState(defaultAccess);
  const [newTierLabel, setNewTierLabel] = useState('');
  const [editingTierId, setEditingTierId] = useState(null);
  const [editingLabel, setEditingLabel] = useState('');
  const [saving, setSaving] = useState(false);

  // Sync local state when OrgSettings loads/changes
  useEffect(() => {
    setTiers(defaultTiers);
    setAccessMatrix(defaultAccess);
  }, [JSON.stringify(defaultTiers), JSON.stringify(defaultAccess)]);

  // Derive portal modules from PortalCard records (auto-includes new portals)
  const portalModules = useMemo(() => {
    const fromCards = cards
      .filter(c => c.is_enabled && c.url && !c.is_external)
      .map(c => ({
        id: c.url.replace(/^\//, '').split('/')[0],
        label: c.name,
        route: c.url,
      }))
      .filter(m => m.id && m.id !== 'admin')
      .filter((m, i, arr) => arr.findIndex(x => x.id === m.id) === i);

    // Ensure locked portals always appear even without a PortalCard
    for (const modId of Object.keys(LOCKED_PORTAL_ACCESS)) {
      if (!fromCards.some(m => m.id === modId)) {
        fromCards.push({ id: modId, label: 'Executive Director Portal', route: '/ed' });
      }
    }
    return fromCards;
  }, [cards]);

  const toggleAccess = (moduleId, tierId) => {
    if (LOCKED_PORTAL_ACCESS[moduleId]) return;
    setAccessMatrix(prev => {
      const current = prev[tierId] || [];
      return {
        ...prev,
        [tierId]: current.includes(moduleId) ? current.filter(id => id !== moduleId) : [...current, moduleId],
      };
    });
  };

  const addTier = () => {
    const label = newTierLabel.trim();
    if (!label) return;
    const id = label.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '');
    if (tiers.some(t => t.id === id)) {
      toast({ title: 'That position type already exists', variant: 'destructive' });
      return;
    }
    setTiers([...tiers, { id, label }]);
    setNewTierLabel('');
  };

  const removeTier = (tierId) => {
    if (LOCKED_TIER_IDS.includes(tierId)) return;
    setTiers(tiers.filter(t => t.id !== tierId));
    setAccessMatrix(prev => { const u = { ...prev }; delete u[tierId]; return u; });
  };

  const saveEditTier = () => {
    if (!editingLabel.trim()) { setEditingTierId(null); return; }
    setTiers(tiers.map(t => t.id === editingTierId ? { ...t, label: editingLabel.trim() } : t));
    setEditingTierId(null);
    setEditingLabel('');
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      // Enforce locked portal access before saving
      const finalAccess = { ...accessMatrix };
      for (const [moduleId, tierId] of Object.entries(LOCKED_PORTAL_ACCESS)) {
        for (const tid of Object.keys(finalAccess)) {
          if (tid !== tierId) finalAccess[tid] = (finalAccess[tid] || []).filter(id => id !== moduleId);
        }
        if (!finalAccess[tierId]?.includes(moduleId)) {
          finalAccess[tierId] = [...(finalAccess[tierId] || []), moduleId];
        }
      }

      if (orgSettings?.id) {
        await base44.entities.OrgSettings.update(orgSettings.id, { tier_configs: tiers, tier_portal_access: finalAccess });
      } else {
        await base44.entities.OrgSettings.create({ org_name: 'Candora', tier_configs: tiers, tier_portal_access: finalAccess });
      }
      queryClient.invalidateQueries({ queryKey: ['orgSettings'] });
      toast({ title: 'Access presets saved' });
    } catch (err) {
      toast({ title: 'Failed to save', description: err.message, variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const hasChanges = JSON.stringify(tiers) !== JSON.stringify(defaultTiers) || JSON.stringify(accessMatrix) !== JSON.stringify(defaultAccess);

  if (cardsLoading) {
    return <div className="flex items-center justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-start gap-2 p-3 rounded-lg bg-blue-50 border border-blue-200 text-sm text-blue-800">
        <Info className="w-4 h-4 mt-0.5 flex-shrink-0" />
        <p>These presets control which portals each position type can access. Changes take effect immediately for all employees. New portals appear here automatically.</p>
      </div>

      <div className="overflow-x-auto rounded-xl border border-border">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 border-b border-border">
            <tr>
              <th className="p-3 text-left font-semibold text-foreground min-w-[200px]">Portal / Module</th>
              {tiers.map(tier => (
                <th key={tier.id} className="p-3 text-center font-semibold text-foreground whitespace-nowrap min-w-[130px]">
                  <div className="flex items-center justify-center gap-1">
                    {editingTierId === tier.id ? (
                      <input
                        autoFocus
                        value={editingLabel}
                        onChange={e => setEditingLabel(e.target.value)}
                        onBlur={saveEditTier}
                        onKeyDown={e => { if (e.key === 'Enter') saveEditTier(); if (e.key === 'Escape') setEditingTierId(null); }}
                        className="text-xs px-1 py-0.5 rounded border bg-background w-24 text-center"
                      />
                    ) : (
                      <span
                        onDoubleClick={() => !LOCKED_TIER_IDS.includes(tier.id) && (setEditingTierId(tier.id), setEditingLabel(tier.label))}
                        className={LOCKED_TIER_IDS.includes(tier.id) ? '' : 'cursor-pointer hover:text-primary'}
                        title={LOCKED_TIER_IDS.includes(tier.id) ? 'Locked' : 'Double-click to rename'}
                      >
                        {tier.label}
                      </span>
                    )}
                    {!LOCKED_TIER_IDS.includes(tier.id) && editingTierId !== tier.id && (
                      <button onClick={() => removeTier(tier.id)} className="text-muted-foreground hover:text-destructive" title="Remove">
                        <Trash2 className="w-3 h-3" />
                      </button>
                    )}
                    {LOCKED_TIER_IDS.includes(tier.id) && <Lock className="w-3 h-3 text-muted-foreground" />}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {portalModules.map(mod => {
              const isLocked = !!LOCKED_PORTAL_ACCESS[mod.id];
              return (
                <tr key={mod.id} className="hover:bg-muted/20 transition-colors">
                  <td className="p-3 font-medium text-foreground">
                    <div className="flex items-center gap-1.5">
                      {isLocked && <Lock className="w-3 h-3 text-muted-foreground flex-shrink-0" />}
                      <div>
                        <div>{mod.label}</div>
                        <div className="text-xs text-muted-foreground font-mono">{mod.route}</div>
                      </div>
                    </div>
                  </td>
                  {tiers.map(tier => {
                    const isLockedAllowed = isLocked && LOCKED_PORTAL_ACCESS[mod.id] === tier.id;
                    const allowed = isLockedAllowed || (accessMatrix[tier.id] || []).includes(mod.id);
                    return (
                      <td key={tier.id} className="p-3 text-center">
                        <button
                          onClick={() => !isLocked && toggleAccess(mod.id, tier.id)}
                          disabled={isLocked}
                          className={`inline-flex items-center justify-center w-6 h-6 rounded-full transition-all ${
                            allowed ? 'bg-emerald-100 text-emerald-700' : 'bg-muted text-muted-foreground'
                          } ${isLocked ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer hover:scale-110'}`}
                        >
                          {allowed ? <Check className="w-3.5 h-3.5" /> : <X className="w-3.5 h-3.5" />}
                        </button>
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="flex items-center gap-2">
        <Input
          placeholder="New position type name (e.g. Coordinator)"
          value={newTierLabel}
          onChange={e => setNewTierLabel(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && addTier()}
          className="max-w-xs"
        />
        <Button variant="outline" size="sm" onClick={addTier} disabled={!newTierLabel.trim()}>
          <Plus className="w-4 h-4" /> Add Position Type
        </Button>
      </div>

      <div className="flex items-center justify-between">
        <p className="text-xs text-muted-foreground">
          Double-click a position type name to rename it. The Executive Director Portal is locked to the Executive Director position type only.
        </p>
        <Button onClick={handleSave} disabled={saving || !hasChanges}>
          {saving ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving...</> : <><Save className="w-4 h-4" /> Save Changes</>}
        </Button>
      </div>
    </div>
  );
}