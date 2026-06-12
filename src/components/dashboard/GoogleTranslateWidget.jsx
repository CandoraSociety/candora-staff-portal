import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Languages, ArrowRightLeft, Copy, Check, Loader2 } from 'lucide-react';
import { base44 } from '@/api/base44Client';

const LANGUAGES = [
  { code: 'en', label: 'English' },
  { code: 'fr', label: 'French' },
  { code: 'es', label: 'Spanish' },
  { code: 'ar', label: 'Arabic' },
  { code: 'zh', label: 'Chinese (Simplified)' },
  { code: 'hi', label: 'Hindi' },
  { code: 'pt', label: 'Portuguese' },
  { code: 'ru', label: 'Russian' },
  { code: 'de', label: 'German' },
  { code: 'ja', label: 'Japanese' },
  { code: 'ko', label: 'Korean' },
  { code: 'it', label: 'Italian' },
  { code: 'vi', label: 'Vietnamese' },
  { code: 'tl', label: 'Tagalog' },
  { code: 'so', label: 'Somali' },
  { code: 'uk', label: 'Ukrainian' },
  { code: 'fa', label: 'Persian/Farsi' },
  { code: 'am', label: 'Amharic' },
  { code: 'ti', label: 'Tigrinya' },
  { code: 'sw', label: 'Swahili' },
];

export default function GoogleTranslateWidget() {
  const [inputText, setInputText] = useState('');
  const [outputText, setOutputText] = useState('');
  const [fromLang, setFromLang] = useState('en');
  const [toLang, setToLang] = useState('fr');
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleTranslate = async () => {
    if (!inputText.trim()) return;
    setLoading(true);
    try {
      const fromLabel = LANGUAGES.find(l => l.code === fromLang)?.label || fromLang;
      const toLabel = LANGUAGES.find(l => l.code === toLang)?.label || toLang;
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `Translate the following text from ${fromLabel} to ${toLabel}. Return ONLY the translated text, nothing else, no explanations.\n\n${inputText}`,
      });
      setOutputText(result);
    } catch {
      setOutputText('Translation failed. Please try again.');
    }
    setLoading(false);
  };

  const handleSwap = () => {
    setFromLang(toLang);
    setToLang(fromLang);
    setInputText(outputText);
    setOutputText(inputText);
  };

  const handleCopy = () => {
    if (!outputText) return;
    navigator.clipboard.writeText(outputText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-sm font-semibold">
          <Languages className="w-4 h-4 text-blue-500" />
          Translate
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Language selectors */}
        <div className="flex items-center gap-2">
          <select
            value={fromLang}
            onChange={e => setFromLang(e.target.value)}
            className="flex-1 text-sm border border-input rounded-md px-2 py-1.5 bg-background focus:outline-none focus:ring-1 focus:ring-ring"
          >
            {LANGUAGES.map(l => <option key={l.code} value={l.code}>{l.label}</option>)}
          </select>

          <button
            onClick={handleSwap}
            className="p-1.5 rounded-md hover:bg-muted transition-colors flex-shrink-0"
            title="Swap languages"
          >
            <ArrowRightLeft className="w-4 h-4 text-muted-foreground" />
          </button>

          <select
            value={toLang}
            onChange={e => setToLang(e.target.value)}
            className="flex-1 text-sm border border-input rounded-md px-2 py-1.5 bg-background focus:outline-none focus:ring-1 focus:ring-ring"
          >
            {LANGUAGES.map(l => <option key={l.code} value={l.code}>{l.label}</option>)}
          </select>
        </div>

        {/* Input */}
        <textarea
          value={inputText}
          onChange={e => setInputText(e.target.value)}
          placeholder="Enter text to translate..."
          rows={4}
          className="w-full text-sm border border-input rounded-md px-3 py-2 bg-background resize-none focus:outline-none focus:ring-1 focus:ring-ring"
          onKeyDown={e => { if (e.key === 'Enter' && e.ctrlKey) handleTranslate(); }}
        />

        <Button onClick={handleTranslate} disabled={loading || !inputText.trim()} className="w-full" size="sm">
          {loading ? <><Loader2 className="w-4 h-4 animate-spin mr-1" /> Translating...</> : 'Translate'}
        </Button>

        {/* Output */}
        {outputText && (
          <div className="relative">
            <div className="w-full text-sm border border-input rounded-md px-3 py-2 bg-muted min-h-[80px] whitespace-pre-wrap">
              {outputText}
            </div>
            <button
              onClick={handleCopy}
              className="absolute top-2 right-2 p-1 rounded hover:bg-background transition-colors"
              title="Copy translation"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5 text-muted-foreground" />}
            </button>
          </div>
        )}

        <p className="text-[10px] text-muted-foreground">Tip: Ctrl+Enter to translate</p>
      </CardContent>
    </Card>
  );
}