import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Upload, RefreshCw, Sparkles, Trash2, Heart, Undo2, Star } from 'lucide-react';

const FIELD_MAP = {
  front: 'cover_image',
  inside_front: 'inside_front_cover_image',
  inside_back: 'inside_back_cover_image',
  back: 'back_cover_image',
};

const LABEL_MAP = {
  front: 'Front Cover',
  inside_front: 'Inside Front Cover',
  inside_back: 'Inside Back Cover',
  back: 'Back Cover',
};

const STORAGE_KEY = (reportId) => `agr_cover_favourites_${reportId}`;

function loadFavourites(reportId) {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY(reportId)) || '[]');
  } catch {
    return [];
  }
}

function saveFavourites(reportId, favs) {
  localStorage.setItem(STORAGE_KEY(reportId), JSON.stringify(favs));
}

export default function CoverGenerator({ reportId, report, branding, onUpdate }) {
  const [generating, setGenerating] = useState({});
  const [prompts, setPrompts] = useState({});
  const [errors, setErrors] = useState({});
  const [previous, setPrevious] = useState({});
  const [favourites, setFavourites] = useState(() => loadFavourites(reportId));
  const [showFavPicker, setShowFavPicker] = useState({});
  const [favouriting, setFavouriting] = useState({});

  const generateCover = async (type) => {
    const currentUrl = report?.[FIELD_MAP[type]];
    setPrevious(prev => ({ ...prev, [type]: currentUrl || null }));
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
        await onUpdate({ [FIELD_MAP[type]]: res.data.url });
      } else {
        setErrors(prev => ({ ...prev, [type]: res.data?.error || 'No image returned' }));
      }
    } catch (err) {
      setErrors(prev => ({ ...prev, [type]: err?.response?.data?.error || err?.message || 'Generation failed' }));
    }
    setGenerating(prev => ({ ...prev, [type]: false }));
  };

  const undoCover = async (type) => {
    const prevUrl = previous[type];
    if (prevUrl !== undefined && prevUrl !== null) {
      await onUpdate({ [FIELD_MAP[type]]: prevUrl });
      setPrevious(prev => ({ ...prev, [type]: null }));
    }
  };

  const uploadCover = async (e, type) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPrevious(prev => ({ ...prev, [type]: report?.[FIELD_MAP[type]] || null }));
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    await onUpdate({ [FIELD_MAP[type]]: file_url });
  };

  const deleteCover = async (type) => {
    await onUpdate({ [FIELD_MAP[type]]: '' });
  };

  const favouriteCover = (type) => {
    const imageUrl = report?.[FIELD_MAP[type]];
    if (!imageUrl) return;
    setFavouriting(prev => ({ ...prev, [type]: true }));
    const newFav = {
      id: Date.now().toString(),
      cover_type: type,
      image_url: imageUrl,
      label: `${LABEL_MAP[type]} — ${new Date().toLocaleDateString('en-CA', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}`
    };
    const updated = [newFav, ...favourites];
    setFavourites(updated);
    saveFavourites(reportId, updated);
    setTimeout(() => setFavouriting(prev => ({ ...prev, [type]: false })), 600);
  };

  const pickFavourite = async (type, fav) => {
    setPrevious(prev => ({ ...prev, [type]: report?.[FIELD_MAP[type]] || null }));
    await onUpdate({ [FIELD_MAP[type]]: fav.image_url });
    setShowFavPicker(prev => ({ ...prev, [type]: false }));
  };

  const removeFavourite = (favId) => {
    const updated = favourites.filter(f => f.id !== favId);
    setFavourites(updated);
    saveFavourites(reportId, updated);
  };

  const typeFavourites = (type) => favourites.filter(f => f.cover_type === type);

  const CoverBlock = ({ type }) => {
    const imageUrl = report?.[FIELD_MAP[type]];
    const gen = generating[type] || false;
    const error = errors[type] || '';
    const label = LABEL_MAP[type];
    const prompt = prompts[type] || '';
    const setPrompt = (v) => setPrompts(prev => ({ ...prev, [type]: v }));
    const hasUndo = previous[type] !== undefined && previous[type] !== null;
    const favs = typeFavourites(type);
    const pickerOpen = showFavPicker[type] || false;
    const favving = favouriting[type] || false;

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
              {hasUndo && (
                <Button variant="outline" size="sm" onClick={() => undoCover(type)} className="gap-1">
                  <Undo2 className="w-3.5 h-3.5" />Undo
                </Button>
              )}
              <Button variant="outline" size="sm" onClick={() => favouriteCover(type)} disabled={favving} className="gap-1 text-pink-500 hover:text-pink-600">
                <Heart className={`w-3.5 h-3.5 ${favving ? 'animate-pulse fill-pink-500' : ''}`} />{favving ? 'Saved!' : 'Favourite'}
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

        {/* Favourites */}
        {favs.length > 0 && (
          <div>
            <button
              onClick={() => setShowFavPicker(prev => ({ ...prev, [type]: !pickerOpen }))}
              className="flex items-center gap-1 text-xs text-pink-500 hover:text-pink-600 transition-colors"
            >
              <Star className="w-3 h-3" />Favourites ({favs.length})
            </button>
            {pickerOpen && (
              <div className="mt-2 grid grid-cols-4 gap-2">
                {favs.map(fav => (
                  <div key={fav.id} className="relative group">
                    <button onClick={() => pickFavourite(type, fav)} className="w-full aspect-[8.5/11] rounded overflow-hidden border hover:ring-2 hover:ring-pink-400 transition-all">
                      <img src={fav.image_url} alt={fav.label || ''} className="w-full h-full object-cover" />
                    </button>
                    <button
                      onClick={() => removeFavourite(fav.id)}
                      className="absolute -top-1 -right-1 w-4 h-4 bg-red-400 text-white rounded-full text-[10px] flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                    >×</button>
                    {fav.label && <p className="text-[9px] text-muted-foreground mt-0.5 truncate">{fav.label}</p>}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
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