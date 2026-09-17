import React, { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import TypedSignatureEditor from './TypedSignatureEditor';
import DrawSignatureCanvas from './DrawSignatureCanvas';
import UploadSignatureEditor from './UploadSignatureEditor';
import ESignaturePreview from './ESignaturePreview';
import { SIGNATURE_FONTS } from '@/lib/esignature';
import { PenTool, Save } from 'lucide-react';

export default function SignatureEditorCard({ user, profile }) {
  const queryClient = useQueryClient();
  const [tab, setTab] = useState(profile?.signature_type === 'drawn' || profile?.signature_type === 'upload' ? profile.signature_type : 'typed');
  const [typed, setTyped] = useState({
    typed_text: profile?.typed_text || user?.full_name || '',
    font_family: profile?.font_family || SIGNATURE_FONTS[0].value,
    font_color: profile?.font_color || '#0f172a',
    bold: !!profile?.bold,
    italic: !!profile?.italic,
    shadow: !!profile?.shadow,
  });
  const [imageDataUrl, setImageDataUrl] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);

  const signature =
    tab === 'typed'
      ? { signature_type: 'typed', ...typed }
      : { signature_type: tab, signature_url: imageDataUrl };

  const canSave = tab === 'typed' ? !!(typed.typed_text || '').trim() : !!imageDataUrl;

  const handleSave = async () => {
    setSaving(true);
    setError('');
    setSaved(false);
    try {
      let signature_url = profile?.signature_url || null;
      if (tab !== 'typed') {
        const blob = await (await fetch(imageDataUrl)).blob();
        const file = new File([blob], 'signature.png', { type: 'image/png' });
        const res = await base44.integrations.Core.UploadPublicFile({ file });
        signature_url = res.file_url;
      }
      const payload = {
        signature_type: tab,
        typed_text: tab === 'typed' ? typed.typed_text.trim() : null,
        font_family: typed.font_family,
        font_color: typed.font_color,
        bold: typed.bold,
        italic: typed.italic,
        shadow: typed.shadow,
        signature_url,
      };
      if (profile) {
        await base44.entities.ESignatureProfile.update(profile.id, payload);
      } else {
        await base44.entities.ESignatureProfile.create({
          user_id: user.id,
          user_name: user.full_name,
          user_email: user.email,
          ...payload,
        });
      }
      setSaved(true);
      queryClient.invalidateQueries(['esignatureProfile', user?.id]);
    } catch (e) {
      setError(e.message || 'Could not save your signature. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <PenTool className="w-4 h-4 text-primary" />
          {profile?.signature_type ? 'Your signature' : 'Step 2 — Create your signature'}
        </CardTitle>
        <CardDescription>
          Type it with your choice of font and colour, draw it, or upload an image (the background is removed automatically).
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Tabs value={tab} onValueChange={setTab}>
          <TabsList>
            <TabsTrigger value="typed">Type</TabsTrigger>
            <TabsTrigger value="drawn">Draw</TabsTrigger>
            <TabsTrigger value="upload">Upload</TabsTrigger>
          </TabsList>
          <TabsContent value="typed" className="pt-4">
            <TypedSignatureEditor value={typed} onChange={setTyped} />
          </TabsContent>
          <TabsContent value="drawn" className="pt-4">
            <DrawSignatureCanvas onChange={setImageDataUrl} />
          </TabsContent>
          <TabsContent value="upload" className="pt-4">
            <UploadSignatureEditor onChange={setImageDataUrl} />
          </TabsContent>
        </Tabs>

        {/* Live preview */}
        <div className="rounded-lg border bg-white p-6 min-h-[120px] flex items-center justify-center">
          <ESignaturePreview signature={signature} />
        </div>

        {error && <p className="text-sm text-destructive">{error}</p>}
        {saved && <p className="text-sm text-success">Signature saved.</p>}

        <Button onClick={handleSave} disabled={saving || !canSave}>
          <Save className="w-4 h-4" />
          {saving ? 'Saving…' : 'Save signature'}
        </Button>
      </CardContent>
    </Card>
  );
}