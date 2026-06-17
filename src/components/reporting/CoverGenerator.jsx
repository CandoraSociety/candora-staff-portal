import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Upload, RefreshCw, Sparkles } from 'lucide-react';

export default function CoverGenerator({ reportId, report, branding, onUpdate }) {
  const [generatingFront, setGeneratingFront] = useState(false);
  const [generatingBack, setGeneratingBack] = useState(false);
  const [frontPrompt, setFrontPrompt] = useState('');
  const [backPrompt, setBackPrompt] = useState('');

  const generateCover = async (type) => {
    const setGenerating = type === 'front' ? setGeneratingFront : setGeneratingBack;
    setGenerating(true);
    try {
      const res = await base44.functions.invoke('generateCoverPage', {
        report_id: reportId,
        type,
        logo_urls: branding?.logo_urls || [],
        custom_prompt: type === 'front' ? frontPrompt || undefined : backPrompt || undefined
      });
      if (res.data?.url) {
        onUpdate(type === 'front' ? { cover_image: res.data.url } : { back_cover_image: res.data.url });
      }
    } catch {}
    setGenerating(false);
  };

  const uploadCover = async (e, type) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    onUpdate(type === 'front' ? { cover_image: file_url } : { back_cover_image: file_url });
  };

  const CoverBlock = ({ type }) => {
    const isFront = type === 'front';
    const imageUrl = isFront ? report?.cover_image : report?.back_cover_image;
    const generating = isFront ? generatingFront : generatingBack;
    const label = isFront ? 'Front Cover' : 'Back Cover';

    return (
      <div className="space-y-3">
        <Label className="text-xs font-semibold">{label} (8.5″ × 11″)</Label>
        {imageUrl ? (
          <div>
            <div className="relative group rounded-lg overflow-hidden border bg-slate-100">
              <div className="aspect-[8.5/11] w-full">
                <img src={imageUrl} alt={label} className="w-full h-full object-cover" />
              </div>
            </div>
            <div className="flex gap-2 mt-2">
              <Button variant="outline" size="sm" onClick={() => generateCover(type)} disabled={generating} className="gap-1">
                <RefreshCw className="w-3.5 h-3.5" />Regenerate
              </Button>
              <label className="cursor-pointer">
                <Button variant="outline" size="sm" className="gap-1" asChild><span><Upload className="w-3.5 h-3.5" />Upload</span></Button>
                <input type="file" accept="image/*" className="hidden" onChange={e => uploadCover(e, type)} />
              </label>
            </div>
          </div>
        ) : (
          <div className="flex flex-col sm:flex-row gap-3">
            <Button onClick={() => generateCover(type)} disabled={generating} className="gap-2 flex-1" variant="outline">
              <Sparkles className="w-4 h-4" />{generating ? 'Generating...' : `AI Generate ${label}`}
            </Button>
            <label className="flex-1 cursor-pointer">
              <Button variant="outline" className="gap-2 w-full" asChild><span><Upload className="w-4 h-4" />Upload Image</span></Button>
              <input type="file" accept="image/*" className="hidden" onChange={e => uploadCover(e, type)} />
            </label>
          </div>
        )}
        {!imageUrl && (
          <div>
            <Label className="text-xs text-muted-foreground">Custom prompt (optional)</Label>
            <Textarea
              rows={2}
              value={isFront ? frontPrompt : backPrompt}
              onChange={e => isFront ? setFrontPrompt(e.target.value) : setBackPrompt(e.target.value)}
              placeholder="Additional instructions for the AI..."
              className="mt-1 text-xs"
            />
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="grid sm:grid-cols-2 gap-4">
      <CoverBlock type="front" />
      <CoverBlock type="back" />
    </div>
  );
}