import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Trash2 } from 'lucide-react';
import BrandLogoSlot from './BrandLogoSlot';
import BrandLogoPicker from './BrandLogoPicker';

const ALTERNATE_SLOTS = [0, 1, 2];

const ROLE_LABELS = {
  primary: 'Primary logo',
  long_form: 'Long-form logo',
  'alt-0': 'Alternate 1',
  'alt-1': 'Alternate 2',
  'alt-2': 'Alternate 3',
};

// The logos category of Brand Assets: the primary logo, the long-form logo and up
// to three alternates are chosen here, and the app reads them from Org Settings.
export default function BrandLogoLibrary() {
  const qc = useQueryClient();
  const [pickerTarget, setPickerTarget] = useState(null);
  const [uploading, setUploading] = useState(false);

  const { data: settingsList = [] } = useQuery({
    queryKey: ['orgSettings'],
    queryFn: () => base44.entities.OrgSettings.list(),
  });
  const settings = settingsList[0] || null;

  const { data: logoAssets = [] } = useQuery({
    queryKey: ['mkt-logo-assets'],
    queryFn: async () => {
      const page = await base44.entities.MarketingAsset.filter(
        { asset_type: 'logo' },
        { sort: '-created_date', limit: 200 },
      );
      return page.items || [];
    },
  });

  const byId = Object.fromEntries(logoAssets.map(a => [a.id, a]));
  const selection = settings?.brand_logo_selection || {};
  const current = {
    primary: byId[selection.primary_asset_id] || null,
    longForm: byId[selection.long_form_asset_id] || null,
    alternates: (selection.alternate_asset_ids || []).map(id => byId[id] || null),
  };

  const roleOf = (asset) => {
    if (asset.id === selection.primary_asset_id) return 'Primary';
    if (asset.id === selection.long_form_asset_id) return 'Long form';
    const altIndex = (selection.alternate_asset_ids || []).indexOf(asset.id);
    if (altIndex >= 0) return `Alternate ${altIndex + 1}`;
    return null;
  };

  const applyRoles = async (next) => {
    if (!settings) return;
    const alternates = (next.alternates || []).filter(Boolean).slice(0, 3);
    await base44.entities.OrgSettings.update(settings.id, {
      brand_logo_selection: {
        primary_asset_id: next.primary?.id || '',
        long_form_asset_id: next.longForm?.id || '',
        alternate_asset_ids: alternates.map(a => a.id),
      },
      logo_url: next.primary?.file_url || '',
      logo_long_form_url: next.longForm?.file_url || '',
      alternate_logo_urls: alternates.map(a => a.file_url),
    });
    qc.invalidateQueries({ queryKey: ['orgSettings'] });
    toast.success('Logo branding updated');
  };

  const assign = (target, asset) => {
    const next = { primary: current.primary, longForm: current.longForm, alternates: [...current.alternates] };
    if (target === 'primary') next.primary = asset;
    else if (target === 'long_form') next.longForm = asset;
    else {
      const index = Number(target.split('-')[1]);
      next.alternates[index] = asset;
    }
    applyRoles(next);
    setPickerTarget(null);
  };

  const clear = (target) => {
    const next = { primary: current.primary, longForm: current.longForm, alternates: [...current.alternates] };
    if (target === 'primary') next.primary = null;
    else if (target === 'long_form') next.longForm = null;
    else next.alternates[Number(target.split('-')[1])] = null;
    applyRoles(next);
  };

  const handleUpload = async (file) => {
    if (!pickerTarget) return;
    setUploading(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      const created = await base44.entities.MarketingAsset.create({
        name: file.name.replace(/\.[^.]+$/, ''),
        asset_type: 'logo',
        category: 'brand',
        file_url,
        file_type: file.name.split('.').pop().toUpperCase(),
        file_size: file.size,
        is_active: true,
      });
      qc.invalidateQueries({ queryKey: ['mkt-logo-assets'] });
      qc.invalidateQueries({ queryKey: ['mkt-assets-all'] });
      assign(pickerTarget, created);
    } catch {
      toast.error('Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const deleteLogo = async (asset) => {
    await base44.entities.MarketingAsset.delete(asset.id);
    const next = {
      primary: current.primary?.id === asset.id ? null : current.primary,
      longForm: current.longForm?.id === asset.id ? null : current.longForm,
      alternates: current.alternates.map(a => (a?.id === asset.id ? null : a)),
    };
    if (settings) await applyRoles(next);
    qc.invalidateQueries({ queryKey: ['mkt-logo-assets'] });
    qc.invalidateQueries({ queryKey: ['mkt-assets-all'] });
    toast.success('Logo deleted');
  };

  return (
    <section className="rounded-2xl border bg-white p-5 space-y-4">
      <div>
        <h2 className="text-base font-bold text-slate-900">Logos &amp; logo components</h2>
        <p className="text-sm text-slate-500 mt-1">
          Choose which uploaded logo is the primary mark used across the app, which is the long-form
          version used in documents, and up to three alternates.
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-3">
        <BrandLogoSlot
          label={ROLE_LABELS.primary}
          hint="Used across the app"
          asset={current.primary}
          onChoose={() => setPickerTarget('primary')}
          onClear={() => clear('primary')}
        />
        <BrandLogoSlot
          label={ROLE_LABELS.long_form}
          hint="Documents & email"
          asset={current.longForm}
          onChoose={() => setPickerTarget('long_form')}
          onClear={() => clear('long_form')}
        />
        {ALTERNATE_SLOTS.map(index => {
          const target = `alt-${index}`;
          return (
            <BrandLogoSlot
              key={target}
              label={ROLE_LABELS[target]}
              hint="Optional"
              asset={current.alternates[index] || null}
              onChoose={() => setPickerTarget(target)}
              onClear={() => clear(target)}
            />
          );
        })}
      </div>

      {logoAssets.length > 0 && (
        <div className="space-y-2 pt-2 border-t">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Logo assets</p>
          <div className="flex flex-wrap gap-3">
            {logoAssets.map(asset => {
              const role = roleOf(asset);
              return (
                <div key={asset.id} className="w-28 group relative rounded-lg border bg-slate-50 overflow-hidden">
                  <div className="h-20 flex items-center justify-center p-2">
                    <img src={asset.file_url} alt={asset.name} className="max-h-full max-w-full object-contain" />
                  </div>
                  <p className="text-[10px] text-slate-600 px-1.5 pb-1 truncate">{asset.name}</p>
                  {role && (
                    <Badge className="absolute top-1 left-1 text-[9px] px-1.5 py-0">{role}</Badge>
                  )}
                  <button
                    type="button"
                    onClick={() => deleteLogo(asset)}
                    title="Delete logo asset"
                    className="absolute top-1 right-1 p-1 rounded bg-white/90 text-slate-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <BrandLogoPicker
        open={!!pickerTarget}
        onOpenChange={(open) => !open && setPickerTarget(null)}
        title={`Choose ${ROLE_LABELS[pickerTarget] || 'logo'}`}
        assets={logoAssets}
        onPick={(asset) => assign(pickerTarget, asset)}
        onUpload={handleUpload}
        uploading={uploading}
      />
    </section>
  );
}