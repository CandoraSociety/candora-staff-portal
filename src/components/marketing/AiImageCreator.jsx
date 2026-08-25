import { useState, useRef, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Sparkles, Loader2, Download, Save, Wand2, Send, ImageIcon, RefreshCw, Building2,
} from 'lucide-react';
import { toast } from 'sonner';

const SYSTEM_PROMPT = `You are Candora's AI art director for marketing imagery. You help staff arrive at the right image through a short conversation BEFORE generating anything.

How to behave:
- Ask concise clarifying questions ONE OR TWO at a time: subject, setting/location, lighting, mood, audience, colours, and whether to include Candora branding. Do not ask everything at once.
- When you have enough to produce a strong, specific image prompt, STOP asking and set ready=true. Then write the full image_prompt: a single detailed text prompt for an image generator that describes subject, composition, lighting, colour palette, style, and any Candora brand elements (logo placement, navy + gold palette) explicitly.
- Keep your reply short, friendly, and plain. Never mention internal fields like image_prompt or ready — just talk naturally.
- If the user asks to refine a previously generated image, set ready=true and rewrite image_prompt to reflect the requested changes (the previous image is passed back as a reference automatically).`;

const CHAT_SCHEMA = {
  type: 'object',
  properties: {
    reply: { type: 'string', description: 'What to say to the user' },
    ready: { type: 'boolean', description: 'True when you have enough to generate the image' },
    image_prompt: { type: 'string', description: 'The full detailed prompt sent to the image generator when ready=true' },
    should_use_branding: { type: 'boolean', description: 'Whether Candora brand logos should be passed as a reference' },
  },
  required: ['reply', 'ready'],
};

const uid = () => `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

export default function AiImageCreator() {
  const qc = useQueryClient();
  const [messages, setMessages] = useState([]); // {id, role, text, image_url, ready, image_prompt, pending, saved, name}
  const [input, setInput] = useState('');
  const [includeBranding, setIncludeBranding] = useState(true);
  const [busy, setBusy] = useState(false);
  const [savingId, setSavingId] = useState(null);
  const scrollRef = useRef(null);

  const { data: brandAssets } = useQuery({
    queryKey: ['mkt-brand-logos'],
    queryFn: () => base44.entities.MarketingAsset.filter({ asset_type: 'logo', is_active: true }),
  });
  const brandLogoUrls = (brandAssets || [])
    .map((a) => a.file_url)
    .filter((u) => !!u && /\.(png|jpe?g|webp|svg)$/i.test(u));

  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages, busy]);

  const send = async (overrideText) => {
    const text = (overrideText ?? input).trim();
    if (!text || busy) return;
    const userMsg = { id: uid(), role: 'user', text };
    const history = [...messages, userMsg];
    setMessages(history);
    setInput('');
    setBusy(true);

    const assistantId = uid();
    setMessages((m) => [...m, { id: assistantId, role: 'assistant', text: '', pending: true }]);

    try {
      const convoText = history
        .filter((mm) => mm.text)
        .map((mm) => `${mm.role === 'user' ? 'User' : 'Assistant'}: ${mm.text}`)
        .join('\n');

      const lastImage = [...history].reverse().find((mm) => mm.image_url)?.image_url;

      const llmRes = await base44.integrations.Core.InvokeLLM({
        prompt: `${SYSTEM_PROMPT}\n\nConversation so far:\n${convoText}\n\nUser intent: produce marketing imagery for Candora (a Canadian non-profit). Reply now.`,
        response_json_schema: CHAT_SCHEMA,
      });

      const reply = llmRes?.reply || '';
      const ready = !!llmRes?.ready;
      const imagePrompt = llmRes?.image_prompt || '';
      const useBranding = llmRes?.should_use_branding !== false;

      setMessages((m) =>
        m.map((msg) =>
          msg.id === assistantId
            ? { ...msg, text: reply, pending: false, ready, image_prompt: imagePrompt }
            : msg
        )
      );

      if (ready && imagePrompt) {
        const refs = [];
        if (includeBranding && useBranding) refs.push(...brandLogoUrls);
        if (lastImage) refs.push(lastImage);
        const imgRes = await base44.integrations.Core.GenerateImage({
          prompt: imagePrompt,
          ...(refs.length ? { existing_image_urls: refs } : {}),
        });
        const url = imgRes?.url;
        if (url) {
          setMessages((m) =>
            m.map((msg) => (msg.id === assistantId ? { ...msg, image_url: url } : msg))
          );
        } else {
          toast.error('No image returned');
        }
      }
    } catch (e) {
      setMessages((m) =>
        m.map((msg) =>
          msg.id === assistantId
            ? { ...msg, text: msg.text || 'Sorry, something went wrong. Try rephrasing.', pending: false }
            : msg
        )
      );
      toast.error(e?.message || 'Generation failed');
    } finally {
      setBusy(false);
    }
  };

  const regenerate = async (msgId) => {
    const target = messages.find((m) => m.id === msgId);
    if (!target?.image_prompt || busy) return;
    setBusy(true);
    setMessages((m) => m.map((msg) => (msg.id === msgId ? { ...msg, regenerating: true } : msg)));
    try {
      const idx = messages.findIndex((m) => m.id === msgId);
      const prevImage = [...messages].slice(0, idx).reverse().find((m) => m.image_url)?.image_url;
      const refs = [];
      if (includeBranding) refs.push(...brandLogoUrls);
      if (prevImage) refs.push(prevImage);
      const imgRes = await base44.integrations.Core.GenerateImage({
        prompt: target.image_prompt,
        ...(refs.length ? { existing_image_urls: refs } : {}),
      });
      const url = imgRes?.url;
      if (url) {
        setMessages((m) => m.map((msg) => (msg.id === msgId ? { ...msg, image_url: url, saved: false, regenerating: false } : msg)));
      } else {
        toast.error('No image returned');
      }
    } catch (e) {
      toast.error(e?.message || 'Regeneration failed');
    } finally {
      setBusy(false);
      setMessages((m) => m.map((msg) => (msg.id === msgId ? { ...msg, regenerating: false } : msg)));
    }
  };

  const saveToAssets = async (msg) => {
    setSavingId(msg.id);
    try {
      await base44.entities.MarketingAsset.create({
        name: msg.name || msg.image_prompt?.slice(0, 60) || 'AI generated image',
        asset_type: 'photo',
        category: 'social_media',
        file_url: msg.image_url,
        description: msg.image_prompt,
        tags: ['ai-generated'],
      });
      qc.invalidateQueries(['mkt-assets-all']);
      qc.invalidateQueries(['mkt-assets']);
      qc.invalidateQueries(['mkt-brand-logos']);
      setMessages((m) => m.map((it) => (it.id === msg.id ? { ...it, saved: true } : it)));
      toast.success('Saved to Brand Assets');
    } catch (e) {
      toast.error(e?.message || 'Save failed');
    } finally {
      setSavingId(null);
    }
  };

  const setName = (id, name) =>
    setMessages((m) => m.map((it) => (it.id === id ? { ...it, name } : it)));

  return (
    <div className="space-y-6">
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-xl bg-pink-100 flex items-center justify-center shrink-0">
          <Wand2 className="w-5 h-5 text-pink-600" />
        </div>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-slate-900">AI Image Creator</h1>
          <p className="text-sm text-slate-500 mt-1">
            Chat with the art director to lock in the concept, then it generates the image. You can
            refine or regenerate as many times as you like.
          </p>
        </div>
        <label className="flex items-center gap-2 text-sm text-slate-600 shrink-0 mt-1">
          <Checkbox checked={includeBranding} onCheckedChange={(v) => setIncludeBranding(!!v)} />
          <Building2 className="w-4 h-4 text-slate-400" />
          <span>
            Candora branding
            {brandLogoUrls.length ? (
              <span className="text-xs text-slate-400 ml-1">({brandLogoUrls.length} logo{brandLogoUrls.length > 1 ? 's' : ''})</span>
            ) : null}
          </span>
        </label>
      </div>

      <Card className="flex flex-col" style={{ height: 'calc(100vh - 230px)', minHeight: 420 }}>
        <CardHeader className="pb-2 border-b">
          <CardTitle className="text-base flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-pink-500" /> Art Director Chat
          </CardTitle>
        </CardHeader>

        <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/50">
          {messages.length === 0 && (
            <div className="text-center py-16 text-slate-400">
              <ImageIcon className="w-12 h-12 mx-auto mb-3 opacity-40" />
              <p>Describe the image you need and the art director will help you shape it.</p>
              <p className="text-xs mt-1">e.g. "I need a header image for our volunteer recruitment page"</p>
            </div>
          )}

          {messages.map((m) => (
            <div key={m.id} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div
                className={`max-w-[85%] rounded-2xl px-4 py-3 ${
                  m.role === 'user'
                    ? 'bg-pink-600 text-white'
                    : 'bg-white border border-slate-200 text-slate-800'
                }`}
              >
                {m.pending ? (
                  <div className="flex items-center gap-2 text-slate-400 text-sm">
                    <Loader2 className="w-4 h-4 animate-spin" /> thinking…
                  </div>
                ) : (
                  <>
                    {m.text && <p className="text-sm whitespace-pre-wrap">{m.text}</p>}
                    {m.ready && m.image_prompt && !m.image_url && (
                      <p className="text-xs text-slate-400 italic mt-1">Generating image…</p>
                    )}
                    {m.image_url && (
                      <div className="mt-3 space-y-2">
                        <div className="rounded-lg overflow-hidden border border-slate-200 bg-white">
                          <img src={m.image_url} alt={m.image_prompt} className="w-full max-h-72 object-contain" />
                        </div>
                        <div className="flex flex-wrap items-center gap-2">
                          <Button size="sm" variant="outline" asChild>
                            <a href={m.image_url} download target="_blank" rel="noreferrer">
                              <Download className="w-3.5 h-3.5 mr-1" /> Download
                            </a>
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => regenerate(m.id)} disabled={busy}>
                            {m.regenerating ? (
                              <><Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" /> Regenerating…</>
                            ) : (
                              <><RefreshCw className="w-3.5 h-3.5 mr-1" /> Regenerate</>
                            )}
                          </Button>
                          <Input
                            placeholder="Asset name"
                            value={m.name || ''}
                            onChange={(e) => setName(m.id, e.target.value)}
                            className="h-8 flex-1 min-w-[120px] text-xs"
                            disabled={m.saved}
                          />
                          {m.saved ? (
                            <span className="text-xs text-emerald-600 font-medium px-2">✓ Saved</span>
                          ) : (
                            <Button
                              size="sm"
                              onClick={() => saveToAssets(m)}
                              disabled={m.id === savingId}
                            >
                              {m.id === savingId ? (
                                <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" />
                              ) : (
                                <Save className="w-3.5 h-3.5 mr-1" />
                              )}
                              Save
                            </Button>
                          )}
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          ))}
        </div>

        <div className="border-t p-3 bg-white">
          <div className="flex items-end gap-2">
            <Textarea
              rows={1}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  send();
                }
              }}
              placeholder="Describe or refine your image…  (Enter to send, Shift+Enter for newline)"
              className="resize-none min-h-[40px] max-h-32"
            />
            <Button onClick={() => send()} disabled={!input.trim() || busy} className="shrink-0">
              {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4 mr-1" />}
              Send
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}