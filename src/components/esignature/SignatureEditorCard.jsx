import React, { useState, useEffect, useMemo } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import TypedSignatureEditor from './TypedSignatureEditor';
import DrawSignatureCanvas from './DrawSignatureCanvas';
import UploadSignatureEditor from './UploadSignatureEditor';
import { SIGNATURE_FONTS } from '@/lib/esignature';
import { composeSignedImage } from '@/lib/esignatureRender';
import { PenTool, Save } from 'lucide-react';

const SIG_FIELDS = [
  'signature_type', 'typed_text', 'font_family', 'font_color', 'bold', 'italic',
  'shadow', 'underline', 'glow', 'outline', 'letter_spacing', 'signature_url',
];

// Extracts just the signature-design fields from a record
export function signaturePayload(sig) {
  return Object.fromEntries(SIG_FIELDS.map((k) => [k, sig[k] ?? null]));
}

export default function SignatureEditorCard({ user, profile, editingSig, nextIndex, onDone }) {
  const queryClient = useQueryClient();
  const [name, setName] = useState(editingSig?.name || `Signature ${nextIndex}`);
  const [tab, setTab] = useState(
    editingSig?.signature_type === 'drawn' || editingSig?.signature_type === 'upload'
      ? editingSig.signature_type
      : 'typed'
  );
  const [typed, setTyped] = useState({
    typed_text: editingSig?.typed_text || user?.full_name || '',
    font_family: editingSig?.font_family || SIGNATURE_FONTS[0].value,
    font_color: editingSig?.font_color || '#0f172a',
    bold: !!editingSig?.bold,
    italic: !!editingSig?.italic,
    shadow: !!editingSig?.shadow,
    underline: !!editingSig?.underline,
    glow: !!editingSig?.glow,
    outline: !!editingSig?.outline,
    letter_spacing: editingSig?.letter_spacing || 0,
  });
  const [imageDataUrl, setImageDataUrl] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);
  const [previewUrl, setPreviewUrl] = useState(null);

  const signature =
    tab === 'typed'
      ? { signature_type: 'typed', ...typed }
      : { signature_type: tab, signature_url: imageDataUrl || editingSig?.signature_url };

  const canSave =
    !!(name || '').trim() &&
    (tab === 'typed'
      ? !!(typed.typed_text || '').trim()
      : !!(imageDataUrl || editingSig?.signature_url));

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

  const applyToProfile = async (sigId, payload) => {
    const fields = { active_signature_id: sigId, ...payload };
    if (profile) {
      await base44.entities.ESignatureProfile.update(profile.id, fields);
    } else {
      await base44.entities.ESignatureProfile.create({
        user_id: user.id,
        user_name: user.full_name,
        user_email: user.email,
        ...fields,
      });
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setError('');
    setSaved(false);
    try {
      let signature_url = editingSig?.signature_url || null;
      if (tab !== 'typed' && imageDataUrl) {
        const blob = await (await fetch(imageDataUrl)).blob();
        const file = new File([blob], 'signature.png', { type: 'image/png' });
        const res = await base44.integrations.Core.UploadPublicFile({ file });
        signature_url = res.file_url;
      }
      const payload = {
        ...signaturePayload(signature),
        typed_text: tab === 'typed' ? typed.typed_text.trim() : null,
        signature_url,
      };
      if (editingSig) {
        await base44.entities.SavedESignature.update(editingSig.id, { name: name.trim(), ...payload });
        // Keep the profile in sync if this is the active signature
        if (profile?.active_signature_id === editingSig.id) {
          await applyToProfile(editingSig.id, payload);
        }
      } else {
        const created = await base44.entities.SavedESignature.create({
          user_id: user.id,
          name: name.trim(),
          ...payload,
        });
        await applyToProfile(created.id, payload);
      }
      setSaved(true);
      queryClient.invalidateQueries(['esignatureProfile', user?.id]);
      queryClient.invalidateQueries(['savedSignatures', user?.id]);
      onDone?.();
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
          {editingSig ? `Edit — ${editingSig.name}` : 'Create a signature'}
        </CardTitle>
        <CardDescription>
          Type it with your choice of font, colour and effects, draw it, or upload an image (the background is
          removed automatically). Saving makes it your active signature.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-1.5 max-w-xs">
          <Label>Signature name</Label>
          <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Primary" />
        </div>

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
          {saving ? 'Saving…' : editingSig ? 'Save changes' : 'Save signature'}
        </Button>
      </CardContent>
    </Card>
  );
}