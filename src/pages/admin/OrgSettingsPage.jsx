import React, { useState, useEffect, useRef } from 'react';
import { useOutletContext } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Settings, Save, Upload, Trash2, CheckCircle2, Pencil } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';

const nanoid = () => Math.random().toString(36).slice(2, 10);

export default function OrgSettingsPage() {
  const { access } = useOutletContext();
  const queryClient = useQueryClient();
  const logoInputRef = useRef(null);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [editingLogoId, setEditingLogoId] = useState(null);
  const [editingLogoName, setEditingLogoName] = useState('');
  const replaceInputRef = useRef(null);
  const [replacingLogoId, setReplacingLogoId] = useState(null);

  // Immediately persist logo changes to DB
  const saveLogosNow = async (newLogos, newLogoUrl) => {
    if (!settings) return;
    const update = { logos: newLogos, logo_url: newLogoUrl };
    await base44.entities.OrgSettings.update(settings.id, update);
    queryClient.invalidateQueries({ queryKey: ['orgSettings'] });
  };

  const { data: settingsList = [] } = useQuery({
    queryKey: ['orgSettings'],
    queryFn: () => base44.entities.OrgSettings.list(),
  });

  const settings = settingsList[0] || null;
  const [form, setForm] = useState({
    org_name: 'Candora',
    logo_url: '',
    logos: [],
    primary_color: '#f5c116',
    secondary_color: '#0f1f6b',
    accent_color: '#2b2de8',
    welcome_message: 'Welcome to the Candora Staff Portal',
  });

  useEffect(() => {
    if (settings) {
      setForm({
        org_name: settings.org_name || 'Candora',
        logo_url: settings.logo_url || '',
        logos: settings.logos || [],
        primary_color: settings.primary_color || '#f5c116',
        secondary_color: settings.secondary_color || '#0f1f6b',
        accent_color: settings.accent_color || '#2b2de8',
        welcome_message: settings.welcome_message || 'Welcome to the Candora Staff Portal',
      });
    }
  }, [settings?.id]);

  const mutation = useMutation({
    mutationFn: (data) => settings
      ? base44.entities.OrgSettings.update(settings.id, data)
      : base44.entities.OrgSettings.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orgSettings'] });
      toast.success('Settings saved');
    },
  });

  const handleLogoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingLogo(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      const newLogo = { id: nanoid(), name: file.name.replace(/\.[^.]+$/, ''), url: file_url, is_active: false };
      const newLogos = [...form.logos, newLogo];
      setForm(f => ({ ...f, logos: newLogos }));
      toast.success('Logo uploaded — set it as active to use it across the app');
    } catch {
      toast.error('Upload failed');
    } finally {
      setUploadingLogo(false);
      if (logoInputRef.current) logoInputRef.current.value = '';
    }
  };

  const setActiveLogo = async (id) => {
    const logo = form.logos.find(l => l.id === id);
    if (!logo) return;
    const newLogos = form.logos.map(l => ({ ...l, is_active: l.id === id }));
    const newLogoUrl = logo.url;
    setForm(f => ({ ...f, logo_url: newLogoUrl, logos: newLogos }));
    await saveLogosNow(newLogos, newLogoUrl);
    toast.success('Active logo updated');
  };

  const removeLogo = async (id) => {
    const wasActive = form.logos.find(l => l.id === id)?.is_active;
    const newLogos = form.logos.filter(l => l.id !== id);
    const newLogoUrl = wasActive ? (newLogos[0]?.url || '') : form.logo_url;
    setForm(f => ({ ...f, logos: newLogos, logo_url: newLogoUrl }));
    await saveLogosNow(newLogos, newLogoUrl);
  };

  const saveLogoName = async (id) => {
    const newLogos = form.logos.map(l => l.id === id ? { ...l, name: editingLogoName } : l);
    setForm(f => ({ ...f, logos: newLogos }));
    setEditingLogoId(null);
    await saveLogosNow(newLogos, form.logo_url);
    toast.success('Logo name updated');
  };

  const handleReplaceImage = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !replacingLogoId) return;
    setUploadingLogo(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      const isActive = form.logos.find(l => l.id === replacingLogoId)?.is_active;
      const newLogos = form.logos.map(l => l.id === replacingLogoId ? { ...l, url: file_url } : l);
      const newLogoUrl = isActive ? file_url : form.logo_url;
      setForm(f => ({ ...f, logos: newLogos, logo_url: newLogoUrl }));
      await saveLogosNow(newLogos, newLogoUrl);
      toast.success('Logo image replaced');
    } catch {
      toast.error('Upload failed');
    } finally {
      setUploadingLogo(false);
      setReplacingLogoId(null);
      if (replaceInputRef.current) replaceInputRef.current.value = '';
    }
  };

  if (!access.isAdmin) return <p className="text-muted-foreground">Access denied</p>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-display font-bold flex items-center gap-2">
          <Settings className="w-5 h-5 text-primary" />
          Organization Settings
        </h1>
        <p className="text-sm text-muted-foreground mt-1">Configure your organization's branding and settings</p>
      </div>

      <Card className="shadow-sm max-w-2xl">
        <CardHeader>
          <CardTitle className="text-base font-heading">General</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={e => { e.preventDefault(); mutation.mutate(form); }} className="space-y-6">
            <div className="space-y-1.5">
              <Label>Organization Name</Label>
              <Input value={form.org_name} onChange={e => setForm({ ...form, org_name: e.target.value })} />
            </div>

            {/* Logo Library */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>Logos</Label>
                <button
                  type="button"
                  onClick={() => logoInputRef.current?.click()}
                  disabled={uploadingLogo}
                  className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-md border border-dashed border-border text-muted-foreground hover:bg-muted transition-colors"
                >
                  <Upload className="w-3.5 h-3.5" />
                  {uploadingLogo ? 'Uploading…' : 'Upload Logo'}
                </button>
                <input ref={logoInputRef} type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} />
                <input ref={replaceInputRef} type="file" accept="image/*" className="hidden" onChange={handleReplaceImage} />
              </div>

              {form.logos.length === 0 && (
                <p className="text-sm text-muted-foreground italic">No logos uploaded yet.</p>
              )}

              <div className="space-y-2">
                {form.logos.map(logo => (
                  <div
                    key={logo.id}
                    className={`flex items-center gap-3 p-3 rounded-xl border-2 transition-colors ${logo.is_active ? 'border-primary bg-primary/5' : 'border-border bg-card'}`}
                  >
                    <button
                      type="button"
                      title="Click to replace image"
                      onClick={() => { setReplacingLogoId(logo.id); replaceInputRef.current?.click(); }}
                      className="w-10 h-10 rounded-lg shrink-0 overflow-hidden bg-muted hover:ring-2 hover:ring-primary transition-all group relative"
                    >
                      <img src={logo.url} alt={logo.name} className="w-full h-full object-contain" />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                        <Upload className="w-3.5 h-3.5 text-white" />
                      </div>
                    </button>

                    <div className="flex-1 min-w-0">
                      {editingLogoId === logo.id ? (
                        <div className="flex gap-1.5">
                          <Input
                            value={editingLogoName}
                            onChange={e => setEditingLogoName(e.target.value)}
                            className="h-7 text-sm"
                            autoFocus
                            onKeyDown={e => { if (e.key === 'Enter') saveLogoName(logo.id); if (e.key === 'Escape') setEditingLogoId(null); }}
                          />
                          <Button type="button" size="sm" className="h-7 px-2" onClick={() => saveLogoName(logo.id)}>Save</Button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1.5">
                          <span className="text-sm font-medium truncate">{logo.name || 'Untitled'}</span>
                          <button
                            type="button"
                            onClick={() => { setEditingLogoId(logo.id); setEditingLogoName(logo.name); }}
                            className="text-muted-foreground hover:text-foreground"
                          >
                            <Pencil className="w-3 h-3" />
                          </button>
                        </div>
                      )}
                      {logo.is_active && (
                        <span className="text-xs text-primary font-medium flex items-center gap-1 mt-0.5">
                          <CheckCircle2 className="w-3 h-3" /> Active — used across the app
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      {!logo.is_active && (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="text-xs h-7"
                          onClick={() => setActiveLogo(logo.id)}
                        >
                          Set Active
                        </Button>
                      )}
                      <button
                        type="button"
                        onClick={() => removeLogo(logo.id)}
                        className="p-1.5 rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Colors */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Primary Color</Label>
                <div className="flex items-center gap-2">
                  <input type="color" value={form.primary_color} onChange={e => setForm({ ...form, primary_color: e.target.value })} className="w-8 h-8 rounded cursor-pointer border-0" />
                  <Input value={form.primary_color} onChange={e => setForm({ ...form, primary_color: e.target.value })} />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label>Secondary Color</Label>
                <div className="flex items-center gap-2">
                  <input type="color" value={form.secondary_color} onChange={e => setForm({ ...form, secondary_color: e.target.value })} className="w-8 h-8 rounded cursor-pointer border-0" />
                  <Input value={form.secondary_color} onChange={e => setForm({ ...form, secondary_color: e.target.value })} />
                </div>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>Accent Color <span className="text-muted-foreground font-normal">(vivid blue from the Candora text in the logo)</span></Label>
              <div className="flex items-center gap-2">
                <input type="color" value={form.accent_color} onChange={e => setForm({ ...form, accent_color: e.target.value })} className="w-8 h-8 rounded cursor-pointer border-0" />
                <Input value={form.accent_color} onChange={e => setForm({ ...form, accent_color: e.target.value })} />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>Welcome Message</Label>
              <Textarea value={form.welcome_message} onChange={e => setForm({ ...form, welcome_message: e.target.value })} rows={2} />
            </div>

            <Button type="submit" disabled={mutation.isPending} className="gap-2">
              <Save className="w-4 h-4" />
              {mutation.isPending ? 'Saving…' : 'Save Settings'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}