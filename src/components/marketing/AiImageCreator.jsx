import { useState, useRef } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Sparkles, Loader2, Download, Save, Upload, Wand2, X, ImageIcon } from 'lucide-react';
import { toast } from 'sonner';

const STYLES = [
  { value: '', label: 'No style preset' },
  { value: 'photorealistic, professional photography, high detail', label: 'Photorealistic' },
  { value: 'flat vector illustration, clean lines, minimal, brand-style', label: 'Vector illustration' },
  { value: 'modern flat design, soft gradients, marketing graphic', label: 'Flat marketing graphic' },
  { value: 'watercolor illustration, soft, artistic', label: 'Watercolor' },
  { value: 'line art, monochrome, sketch', label: 'Line art / sketch' },
  { value: 'logo mark, simple, iconic, centered on plain background', label: 'Logo / icon' },
  { value: 'social media banner, wide, bold composition', label: 'Social banner' },
];

const ASPECT_PRESETS = [
  { label: 'Square (1:1)', suffix: '' },
  { label: 'Wide banner (16:9)', suffix: ', wide 16:9 aspect ratio banner layout' },
  { label: 'Portrait (3:4)', suffix: ', portrait 3:4 aspect ratio' },
];

export default function AiImageCreator() {
  const qc = useQueryClient();
  const [prompt, setPrompt] = useState('');
  const [style, setStyle] = useState('');
  const [aspect, setAspect] = useState(ASPECT_PRESETS[0].label);
  const [refImageUrl, setRefImageUrl] = useState('');
  const [refName, setRefName] = useState('');
  const [uploadingRef, setUploadingRef] = useState(false);
  const [history, setHistory] = useState([]); // {id, url, prompt, ref}
  const [savingId, setSavingId] = useState(null);
  const fileRef = useRef(null);

  const uploadRef = async (file) => {
    setUploadingRef(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setRefImageUrl(file_url);
      setRefName(file.name);
    } catch (e) {
      toast.error('Reference upload failed');
    } finally {
      setUploadingRef(false);
    }
  };

  const generate = useMutation({
    mutationFn: async () => {
      const fullPrompt = `${prompt.trim()}${style ? `, ${style}` : ''}${
        ASPECT_PRESETS.find((a) => a.label === aspect)?.suffix || ''
      }`;
      const params = { prompt: fullPrompt };
      if (refImageUrl) params.existing_image_urls = [refImageUrl];
      return base44.integrations.Core.GenerateImage(params);
    },
    onSuccess: (res) => {
      const url = res?.url;
      if (!url) {
        toast.error('No image returned');
        return;
      }
      setHistory((h) => [
        { id: Date.now(), url, prompt: prompt.trim(), ref: refImageUrl },
        ...h,
      ]);
      toast.success('Image generated');
    },
    onError: (e) => toast.error(e?.message || 'Generation failed'),
  });

  const saveToAssets = useMutation({
    mutationFn: async ({ item, name }) => {
      return base44.entities.MarketingAsset.create({
        name: name || item.prompt?.slice(0, 60) || 'AI generated image',
        asset_type: 'photo',
        category: 'social_media',
        file_url: item.url,
        description: item.prompt,
        tags: ['ai-generated'],
      });
    },
    onSuccess: (_data, variables) => {
      qc.invalidateQueries(['mkt-assets-all']);
      qc.invalidateQueries(['mkt-assets']);
      toast.success('Saved to Brand Assets');
      setSavingId(null);
      setHistory((h) => h.map((it) => (it.id === variables.item.id ? { ...it, saved: true } : it)));
    },
    onError: (e) => {
      toast.error(e?.message || 'Save failed');
      setSavingId(null);
    },
  });

  const handleSave = (item) => {
    setSavingId(item.id);
    saveToAssets.mutate({ item, name: item.name || '' });
  };

  const setItemName = (id, name) => {
    setHistory((h) => h.map((it) => (it.id === id ? { ...it, name } : it)));
  };

  const onPickRef = (e) => {
    const f = e.target.files?.[0];
    if (f) uploadRef(f);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-xl bg-pink-100 flex items-center justify-center shrink-0">
          <Wand2 className="w-5 h-5 text-pink-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">AI Image Creator</h1>
          <p className="text-sm text-slate-500 mt-1">
            Generate marketing imagery from a text prompt. Upload a reference image to edit, restyle, or
            keep a consistent look. Save results straight to Brand Assets.
          </p>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Controls */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-pink-500" /> Create
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Describe the image *</Label>
              <Textarea
                rows={4}
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="e.g. Diverse group of adult learners smiling in a bright Edmonton community classroom, warm natural light, candid moment"
              />
            </div>

            <div className="grid sm:grid-cols-2 gap-3">
              <div>
                <Label>Style preset</Label>
                <Select value={style} onValueChange={setStyle}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {STYLES.map((s) => (
                      <SelectItem key={s.label} value={s.value}>{s.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Aspect ratio</Label>
                <Select value={aspect} onValueChange={setAspect}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {ASPECT_PRESETS.map((a) => (
                      <SelectItem key={a.label} value={a.label}>{a.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label>Reference image (optional — for editing / restyling)</Label>
              <label className="flex items-center gap-2 border-2 border-dashed border-slate-200 rounded-lg p-3 cursor-pointer hover:border-pink-300 transition-colors">
                <Upload className="w-4 h-4 text-slate-400" />
                <span className="text-sm text-slate-500">
                  {uploadingRef ? 'Uploading…' : refImageUrl ? 'Replace reference' : 'Upload a reference image'}
                </span>
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={onPickRef}
                />
              </label>
              {refImageUrl && (
                <div className="mt-2 flex items-center gap-2">
                  <img src={refImageUrl} alt="ref" className="w-12 h-12 object-cover rounded border" />
                  <span className="text-xs text-slate-500 truncate flex-1">{refName}</span>
                  <button
                    onClick={() => { setRefImageUrl(''); setRefName(''); if (fileRef.current) fileRef.current.value = ''; }}
                    className="text-slate-400 hover:text-red-500"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>

            <Button
              className="w-full"
              onClick={() => generate.mutate()}
              disabled={!prompt.trim() || generate.isPending}
            >
              {generate.isPending ? (
                <><Loader2 className="w-4 h-4 mr-1 animate-spin" /> Generating…</>
              ) : (
                <><Sparkles className="w-4 h-4 mr-1" /> Generate Image</>
              )}
            </Button>
            <p className="text-xs text-slate-400">
              Tip: be specific about subject, setting, lighting, and mood for better results.
            </p>
          </CardContent>
        </Card>

        {/* Latest result + history */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <ImageIcon className="w-4 h-4 text-slate-500" /> Results
            </CardTitle>
          </CardHeader>
          <CardContent>
            {history.length === 0 ? (
              <div className="text-center py-16 text-slate-400">
                <ImageIcon className="w-12 h-12 mx-auto mb-3 opacity-40" />
                <p>Generated images will appear here.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {history.map((item) => (
                  <div key={item.id} className="border border-slate-200 rounded-lg overflow-hidden">
                    <div className="bg-slate-50 flex items-center justify-center">
                      <img src={item.url} alt={item.prompt} className="max-h-80 object-contain" />
                    </div>
                    <div className="p-3 space-y-2">
                      <p className="text-xs text-slate-500 line-clamp-2">{item.prompt}</p>
                      <div className="flex flex-wrap items-center gap-2">
                        <a href={item.url} download target="_blank" rel="noreferrer">
                          <Button size="sm" variant="outline"><Download className="w-3.5 h-3.5 mr-1" /> Download</Button>
                        </a>
                        <Input
                          placeholder="Asset name (defaults to prompt)"
                          value={item.name || ''}
                          onChange={(e) => setItemName(item.id, e.target.value)}
                          className="h-8 flex-1 min-w-[140px] text-xs"
                          disabled={item.saved}
                        />
                        {item.saved ? (
                          <span className="text-xs text-emerald-600 font-medium px-2">✓ Saved</span>
                        ) : (
                          <Button
                            size="sm"
                            onClick={() => handleSave(item)}
                            disabled={item.id === savingId && saveToAssets.isPending}
                          >
                            {item.id === savingId && saveToAssets.isPending ? (
                              <><Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" /> Saving…</>
                            ) : (
                              <><Save className="w-3.5 h-3.5 mr-1" /> Save to Assets</>
                            )}
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}