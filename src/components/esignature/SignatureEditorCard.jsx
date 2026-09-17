import React, { useState, useEffect, useMemo } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import TypedSignatureEditor from './TypedSignatureEditor';
import DrawSignatureCanvas from './DrawSignatureCanvas';
import UploadSignatureEditor from './UploadSignatureEditor';
import { SIGNATURE_FONTS } from '@/lib/esignature';
import { composeSignedImage } from '@/lib/esignatureRender';
import { PenTool, Save } from 'lucide-react';

export default function SignatureEditorCard({ user, profile }) {
  const queryClient = useQueryClient();
  const [tab, setTab] = useState(
    profile?.signature_type === 'drawn' || profile?.signature_type === 'upload' ? profile.signature_type : 'typed'
  );
  const [typed, setTyped] = useState({
    typed_text: profile?.typed_text || user?.full_name || '',
    font_family: profile?.font_family || SIGNATURE_FONTS[0].value,
    font_color: profile?.font_color || '#0f172a',
    bold: !!profile?.bold,
    italic: !!profile?.italic,
    shadow: !!profile?.shadow,
    underline: !!profile?.underline,
    glow: !!profile?.glow,
    outline: !!profile?.outline,
    letter_spacing: profile?.letter_spacing || 0,
  });
  const [imageDataUrl, setImageDataUrl] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);
  const [previewUrl, setPreviewUrl] = useState(null);

  const signature =
    tab === 'typed'
      ? { signature_type: 'typed', ...typed }
      : { signature_type: tab, signature_url: imageDataUrl };

  const canSave = tab === 'typed' ? !!(typed.typed_text || '').trim() : !!imageDataUrl;

  // Sample verification info so the preview shows exactly what a real
  // signed image looks like (dummy ID, current time)
  const dummyLog = useMemo(() => {
    const now = new Date();
    const pad = (n) => String(n).padStart(2, '0');
    return {
      generated_id: 'TX-00000-A',
      timestamp_utc: `${now.getUTCFullYear()}-${pad(now.getUTCMonth() + 1)}-${pad(now.getUTCDate())} ${pad(now.getUTCHours())}:${pad(now.getUTCMinutes())} UTC`,
      verification_status: 'PIN Verified',
    };
  }, []);

  useEffect(() => {
    if (!canSave) {
      setPreviewUrl(null);
      return;
    }
    let cancelled = false;
    composeSignedImage(signature, dummyLog)
      .then((url) => { if (!cancelled) setPreviewUrl(url); })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [canSave, tab, typed, imageDataUrl]);

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
        underline: typed.underline,
        glow: typed.glow,
        outline: typed.outline,
        letter_spacing: typed.letter_spacing,
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
          Type it with your choice of font, colour and effects, draw it, or upload an image (the background is
          removed automatically).
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

        {/* Final preview — exactly what the signed image will look like */}
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">
            Final preview (as it appears when signing)
          </p>
          <div className="rounded-lg border bg-white p-4 min-h-[160px] flex items-center justify-center">
            {canSave && previewUrl ? (
              <img src={previewUrl} alt="Signed signature preview" className="max-w-full" />
            ) : (
              <span className="text-sm text-muted-foreground">
                Your signature with its verification ID and timestamp will appear here
              </span>
            )}
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Preview uses a sample verification ID — the real ID is generated when you sign a document.
          </p>
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