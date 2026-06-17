import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Save, Plus, X, Upload, Palette, ChevronDown, ChevronUp, Check } from 'lucide-react';

export default function BrandingPanel({ reportId }) {
  const [branding, setBranding] = useState(null);
  const [expanded, setExpanded] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [form, setForm] = useState({
    logo_urls: [], subsidiary_logos: [], funder_logos: [], common_name: '', legal_name: '',
    tagline: '', primary_color: '#1a2744', secondary_color: '#c8952e', accent_color: '#2b2de8',
    footer_text: '', address: '', website: '',
    address_line1: '', address_line2: '', address_city: '', address_province: '', address_postal_code: '', address_country: 'Canada'
  });

  useEffect(() => {
    base44.entities.AGRBranding.filter({ report_id: reportId }).then(data => {
      if (data[0]) {
        setBranding(data[0]);
        setForm({
          logo_urls: data[0].logo_urls || [],
          subsidiary_logos: data[0].subsidiary_logos || [],
          funder_logos: data[0].funder_logos || [],
          common_name: data[0].common_name || '',
          legal_name: data[0].legal_name || '',
          tagline: data[0].tagline || '',
          primary_color: data[0].primary_color || '#1a2744',
          secondary_color: data[0].secondary_color || '#c8952e',
          accent_color: data[0].accent_color || '#2b2de8',
          footer_text: data[0].footer_text || '',
          address: data[0].address || '',
          website: data[0].website || '',
          address_line1: data[0].address_line1 || '',
          address_line2: data[0].address_line2 || '',
          address_city: data[0].address_city || '',
          address_province: data[0].address_province || '',
          address_postal_code: data[0].address_postal_code || '',
          address_country: data[0].address_country || 'Canada'
        });
      }
    });
  }, [reportId]);

  const addLogo = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    setForm(f => ({ ...f, logo_urls: [...f.logo_urls, file_url] }));
  };

  const addSubLogo = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    setForm(f => ({ ...f, subsidiary_logos: [...f.subsidiary_logos, { url: file_url, purpose: '' }] }));
  };

  const addFunderLogo = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    setForm(f => ({ ...f, funder_logos: [...f.funder_logos, { url: file_url, purpose: '' }] }));
  };

  const handleSave = async () => {
    setSaving(true);
    setSaved(false);
    const data = { ...form, report_id: reportId };
    if (branding) {
      await base44.entities.AGRBranding.update(branding.id, data);
    } else {
      const created = await base44.entities.AGRBranding.create(data);
      setBranding(created);
    }
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="border rounded-xl bg-white">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center gap-2 px-4 py-3 text-left hover:bg-slate-50 rounded-t-xl"
      >
        <Palette className="w-4 h-4 text-accent" />
        <span className="text-sm font-semibold">Brand Identity</span>
        <span className="ml-auto">{expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}</span>
      </button>
      {expanded && (
        <div className="px-4 pb-4 space-y-4 border-t">
          <div className="grid sm:grid-cols-2 gap-3 pt-3">
            <div>
              <Label className="text-xs">Common Name</Label>
              <Input value={form.common_name} onChange={e => setForm(f => ({ ...f, common_name: e.target.value }))} placeholder="e.g. Candora" className="mt-1" />
            </div>
            <div>
              <Label className="text-xs">Legal Name</Label>
              <Input value={form.legal_name} onChange={e => setForm(f => ({ ...f, legal_name: e.target.value }))} placeholder="e.g. Candora Society of Edmonton" className="mt-1" />
            </div>
            <div className="sm:col-span-2">
              <Label className="text-xs">Tagline</Label>
              <Input value={form.tagline} onChange={e => setForm(f => ({ ...f, tagline: e.target.value }))} placeholder="e.g. Empowering communities through..." className="mt-1" />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2">
            <div>
              <Label className="text-xs">Primary</Label>
              <div className="flex items-center gap-2 mt-1">
                <input type="color" value={form.primary_color} onChange={e => setForm(f => ({ ...f, primary_color: e.target.value }))} className="w-8 h-8 rounded cursor-pointer border" />
                <Input value={form.primary_color} onChange={e => setForm(f => ({ ...f, primary_color: e.target.value }))} className="text-xs font-mono" />
              </div>
            </div>
            <div>
              <Label className="text-xs">Secondary</Label>
              <div className="flex items-center gap-2 mt-1">
                <input type="color" value={form.secondary_color} onChange={e => setForm(f => ({ ...f, secondary_color: e.target.value }))} className="w-8 h-8 rounded cursor-pointer border" />
                <Input value={form.secondary_color} onChange={e => setForm(f => ({ ...f, secondary_color: e.target.value }))} className="text-xs font-mono" />
              </div>
            </div>
            <div>
              <Label className="text-xs">Accent</Label>
              <div className="flex items-center gap-2 mt-1">
                <input type="color" value={form.accent_color} onChange={e => setForm(f => ({ ...f, accent_color: e.target.value }))} className="w-8 h-8 rounded cursor-pointer border" />
                <Input value={form.accent_color} onChange={e => setForm(f => ({ ...f, accent_color: e.target.value }))} className="text-xs font-mono" />
              </div>
            </div>
          </div>

          <div>
            <Label className="text-xs">Primary Logos</Label>
            <div className="flex flex-wrap gap-2 mt-1">
              {form.logo_urls.map((url, i) => (
                <div key={i} className="relative group">
                  <img src={url} alt="Logo" className="h-12 rounded border object-contain bg-white" />
                  <button onClick={() => setForm(f => ({ ...f, logo_urls: f.logo_urls.filter((_, j) => j !== i) }))} className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"><X className="w-3 h-3" /></button>
                </div>
              ))}
              <label className="h-12 w-20 border-2 border-dashed rounded flex items-center justify-center cursor-pointer hover:border-accent transition-colors">
                <Upload className="w-4 h-4 text-muted-foreground" />
                <input type="file" accept="image/*" className="hidden" onChange={addLogo} />
              </label>
            </div>
          </div>

          <div>
            <Label className="text-xs">Subsidiary Logos</Label>
            <div className="space-y-2 mt-1">
              {form.subsidiary_logos.map((sl, i) => (
                <div key={i} className="flex items-center gap-2">
                  <img src={sl.url} alt="" className="h-10 rounded border object-contain bg-white" />
                  <Input value={sl.purpose} onChange={e => { const copy = [...form.subsidiary_logos]; copy[i] = { ...copy[i], purpose: e.target.value }; setForm(f => ({ ...f, subsidiary_logos: copy })); }} placeholder="e.g. Candora Housing" className="text-xs flex-1" />
                  <button onClick={handleSave} title="Save description" className="p-1 rounded hover:bg-green-100 text-green-600 transition-colors"><Check className="w-3.5 h-3.5" /></button>
                  <button onClick={() => setForm(f => ({ ...f, subsidiary_logos: f.subsidiary_logos.filter((_, j) => j !== i) }))}><X className="w-3.5 h-3.5 text-red-400" /></button>
                </div>
              ))}
              <label className="flex items-center gap-1 text-xs text-accent cursor-pointer hover:underline">
                <Plus className="w-3 h-3" /> Add sub-brand logo
                <input type="file" accept="image/*" className="hidden" onChange={addSubLogo} />
              </label>
            </div>
          </div>

          <div>
            <Label className="text-xs">Funder Logos</Label>
            <div className="space-y-2 mt-1">
              {form.funder_logos.map((fl, i) => (
                <div key={i} className="flex items-center gap-2">
                  <img src={fl.url} alt="" className="h-10 rounded border object-contain bg-white" />
                  <Input value={fl.purpose} onChange={e => { const copy = [...form.funder_logos]; copy[i] = { ...copy[i], purpose: e.target.value }; setForm(f => ({ ...f, funder_logos: copy })); }} placeholder="e.g. Funded by..." className="text-xs flex-1" />
                  <button onClick={handleSave} title="Save description" className="p-1 rounded hover:bg-green-100 text-green-600 transition-colors"><Check className="w-3.5 h-3.5" /></button>
                  <button onClick={() => setForm(f => ({ ...f, funder_logos: f.funder_logos.filter((_, j) => j !== i) }))}><X className="w-3.5 h-3.5 text-red-400" /></button>
                </div>
              ))}
              <label className="flex items-center gap-1 text-xs text-accent cursor-pointer hover:underline">
                <Plus className="w-3 h-3" /> Add funder logo
                <input type="file" accept="image/*" className="hidden" onChange={addFunderLogo} />
              </label>
            </div>
          </div>

          <div>
            <Label className="text-xs font-semibold mb-1 block">Address</Label>
            <div className="grid sm:grid-cols-2 gap-2">
              <div className="sm:col-span-2">
                <Input value={form.address_line1} onChange={e => setForm(f => ({ ...f, address_line1: e.target.value }))} placeholder="Street address" className="text-xs" />
              </div>
              <div className="sm:col-span-2">
                <Input value={form.address_line2} onChange={e => setForm(f => ({ ...f, address_line2: e.target.value }))} placeholder="Apt / Suite / Unit (optional)" className="text-xs" />
              </div>
              <div>
                <Input value={form.address_city} onChange={e => setForm(f => ({ ...f, address_city: e.target.value }))} placeholder="City" className="text-xs" />
              </div>
              <div>
                <Input value={form.address_province} onChange={e => setForm(f => ({ ...f, address_province: e.target.value }))} placeholder="Province / State" className="text-xs" />
              </div>
              <div>
                <Input value={form.address_postal_code} onChange={e => setForm(f => ({ ...f, address_postal_code: e.target.value }))} placeholder="Postal / ZIP code" className="text-xs" />
              </div>
              <div>
                <Input value={form.address_country} onChange={e => setForm(f => ({ ...f, address_country: e.target.value }))} placeholder="Country" className="text-xs" />
              </div>
            </div>
          </div>
          <div>
            <Label className="text-xs">Website</Label>
            <Input value={form.website} onChange={e => setForm(f => ({ ...f, website: e.target.value }))} placeholder="https://..." className="mt-1 text-xs" />
          </div>
          <div>
            <Label className="text-xs">Footer Text</Label>
            <Input value={form.footer_text} onChange={e => setForm(f => ({ ...f, footer_text: e.target.value }))} placeholder="e.g. © 2025 Candora Society. All rights reserved." className="mt-1 text-xs" />
          </div>

          <div className="flex items-center gap-2">
            <Button onClick={handleSave} disabled={saving} className="gap-2" size="sm">
              <Save className="w-3.5 h-3.5" />{saving ? 'Saving...' : 'Save Branding'}
            </Button>
            {saved && <span className="text-xs text-green-600 font-medium animate-in fade-in">✓ Saved</span>}
          </div>
        </div>
      )}
    </div>
  );
}