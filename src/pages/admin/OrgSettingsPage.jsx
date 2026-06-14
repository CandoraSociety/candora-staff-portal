import React, { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Settings, Save, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';

export default function OrgSettingsPage() {
  const { access } = useOutletContext();
  const queryClient = useQueryClient();

  const { data: settingsList = [] } = useQuery({
    queryKey: ['orgSettings'],
    queryFn: () => base44.entities.OrgSettings.list(),
  });

  const settings = settingsList[0] || null;
  const [form, setForm] = useState({
    org_name: 'Candora',
    logo_url: '',
    primary_color: '#f5c116',
    secondary_color: '#0f1f6b',
    welcome_message: 'Welcome to the Candora Staff Portal',
  });

  useEffect(() => {
    if (settings) {
      setForm({ ...form, ...settings });
    }
  }, [settings]);

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
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    setForm({ ...form, logo_url: file_url });
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
          <form onSubmit={e => { e.preventDefault(); mutation.mutate(form); }} className="space-y-5">
            <div className="space-y-1.5">
              <Label>Organization Name</Label>
              <Input value={form.org_name} onChange={e => setForm({ ...form, org_name: e.target.value })} />
            </div>

            <div className="space-y-1.5">
              <Label>Logo</Label>
              <div className="flex items-center gap-4">
                {form.logo_url && (
                  <img src={form.logo_url} alt="Logo" className="w-12 h-12 rounded-lg object-contain bg-muted" />
                )}
                <label className="cursor-pointer">
                  <div className="flex items-center gap-2 px-3 py-2 rounded-lg border border-dashed border-border text-sm text-muted-foreground hover:bg-muted transition-colors">
                    <Upload className="w-4 h-4" />
                    Upload logo
                  </div>
                  <input type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} />
                </label>
              </div>
            </div>

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
              <Label>Welcome Message</Label>
              <Textarea value={form.welcome_message} onChange={e => setForm({ ...form, welcome_message: e.target.value })} rows={2} />
            </div>

            <Button type="submit" disabled={mutation.isPending} className="gap-2">
              <Save className="w-4 h-4" />
              {mutation.isPending ? 'Saving...' : 'Save Settings'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}