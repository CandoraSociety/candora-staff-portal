import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Upload, RefreshCw, Sparkles, Trash2 } from 'lucide-react';

export default function CoverGenerator({ reportId, report, branding, onUpdate }) {
  const [generating, setGenerating] = useState({});
  const [prompts, setPrompts] = useState({});
  const [errors, setErrors] = useState({});

  const generateCover = async (type) => {
    setGenerating(prev => ({ ...prev, [type]: true }));
    setErrors(prev => ({ ...prev, [type]: '' }));
    try {
      const res = await base44.functions.invoke('generateCoverPage', {
        report_id: reportId,
        type,
        logo_urls: branding?.logo_urls || [],
        custom_prompt: prompts[type] || undefined
      });
      if (res.data?.url) {
        const fieldMap = {
          front: 'cover_image',
          inside_front: 'inside_front_cover_image',
          inside_back: 'inside_back_cover_image',
          back: 'back_cover_image'
        };
        await onUpdate({ [fieldMap[type]]: res.data.url });
      } else {
        setErrors(prev => ({ ...prev, [type]: res.data?.error || 'No image returned' }));
      }
    } catch (err) {
      setErrors(prev => ({ ...prev, [type]: err?.response?.data?.error || err?.message || 'Generation failed' }));
    }
    setGenerating(prev => ({ ...prev, [type]: false }));
  };

  const uploadCover = async (e, type) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    const fieldMap = {
      front: 'cover_image',
      inside_front: 'inside_front_cover_image',
      inside_back: 'inside_back_cover_image',
      back: 'back_cover_image'
    };
    await onUpdate({ [fieldMap[type]]: file_url });
  };

  const deleteCover = async (type) => {
    const fieldMap = {
      front: 'cover_image',
      inside_front: 'inside_front_cover_image',
      inside_back: 'inside_back_cover_image',
      back: 'back_cover_image'
    };
    await onUpdate({ [fieldMap[type]]: '' });
  };

  const imageMap = {
    front: report?.cover_image,
    inside_front: report?.inside_front_cover_image,
    inside_back: report?.inside_back_cover_image,
    back: report?.back_cover_image,
  };

  const labelMap = {
    front: 'Front Cover',
    inside_front: 'Inside Front Cover',
    inside_back: 'Inside Back Cover',
    back: 'Back Cover',
  };

  const CoverBlock = ({ type }) => {
    const imageUrl = imageMap[type];
    const gen = generating[type] || false;
    const error = errors[type] || '';
    const label = labelMap[type];
    const prompt = prompts[type] || '';
    const setPrompt = (v) => setPrompts(prev => ({ ...prev, [type]: v }));

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
            <div className="flex gap-2 mt-2 flex-wrap">
              <Button variant="outline" size="sm" onClick={() => generateCover(type)} disabled={gen} className="gap-1">
                <RefreshCw className={`w-3.5 h-3.5 ${gen ? 'animate-spin' : ''}`} />{gen ? 'Regenerating...' : 'Regenerate'}
              </Button>
              <label className="cursor-pointer">
                <Button variant="outline" size="sm" className="gap-1" asChild><span><Upload className="w-3.5 h-3.5" />Upload</span></Button>
                <input type="file" accept="image/*" className="hidden" onChange={e => uploadCover(e, type)} />
              </label>
              <Button variant="outline" size="sm" onClick={() => deleteCover(type)} className="gap-1 text-red-400 hover:text-red-600">
                <Trash2 className="w-3.5 h-3.5" />Delete
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col sm:flex-row gap-3">
            <Button onClick={() => generateCover(type)} disabled={gen} className="gap-2 flex-1" variant="outline">
              <Sparkles className="w-4 h-4" />{gen ? 'Generating...' : `AI Generate ${label}`}
            </Button>
            <label className="flex-1 cursor-pointer">
              <Button variant="outline" className="gap-2 w-full" asChild><span><Upload className="w-4 h-4" />Upload Image</span></Button>
              <input type="file" accept="image/*" className="hidden" onChange={e => uploadCover(e, type)} />
            </label>
          </div>
        )}
        <div>
          <Label className="text-xs text-muted-foreground">Custom prompt (optional)</Label>
          <Textarea
            rows={2}
            value={prompt}
            onChange={e => setPrompt(e.target.value)}
            placeholder="Additional instructions for the AI..."
            className="mt-1 text-xs"
          />
        </div>
        {error && <p className="text-xs text-red-500">{error}</p>}
      </div>
    );
  };

  return (
    <div className="grid sm:grid-cols-2 gap-4">
      <CoverBlock type="front" />
      <CoverBlock type="inside_front" />
      <CoverBlock type="inside_back" />
      <CoverBlock type="back" />
    </div>
  );
}