import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Search, TrendingUp, CheckCircle, AlertCircle, Globe, Tag, FileText, Loader2 } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';

const SEO_CHECKLIST = [
  { id: 'title', label: 'Page title includes primary keyword', category: 'On-Page' },
  { id: 'meta', label: 'Meta description is 150-160 characters', category: 'On-Page' },
  { id: 'h1', label: 'H1 heading includes primary keyword', category: 'On-Page' },
  { id: 'images', label: 'All images have alt text', category: 'Technical' },
  { id: 'speed', label: 'Page load time under 3 seconds', category: 'Technical' },
  { id: 'mobile', label: 'Website is mobile-friendly', category: 'Technical' },
  { id: 'sitemap', label: 'XML sitemap is up to date', category: 'Technical' },
  { id: 'backlinks', label: 'Building quality backlinks', category: 'Off-Page' },
  { id: 'gmb', label: 'Google My Business profile is up to date', category: 'Local' },
  { id: 'schema', label: 'Schema markup implemented', category: 'Technical' },
  { id: 'https', label: 'Website uses HTTPS', category: 'Technical' },
  { id: 'social', label: 'Social media links on website', category: 'Off-Page' },
];

export default function MarketingSEO() {
  const [keyword, setKeyword] = useState('');
  const [url, setUrl] = useState('');
  const [analysisResult, setAnalysisResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [checklist, setChecklist] = useState({});
  const [contentTopic, setContentTopic] = useState('');
  const [contentIdeas, setContentIdeas] = useState(null);
  const [loadingIdeas, setLoadingIdeas] = useState(false);

  const analyzeKeyword = async () => {
    if (!keyword) return;
    setLoading(true);
    const result = await base44.integrations.Core.InvokeLLM({
      prompt: `You are an SEO expert. Analyze the keyword "${keyword}" for a non-profit organization called "The Candora Society" based in Edmonton, Alberta, which helps newcomers and immigrants with employment and settlement services.

Provide:
1. Keyword difficulty estimate (low/medium/high)
2. Search intent (informational/navigational/transactional)
3. 5-8 related long-tail keywords they should also target
4. 3-5 content ideas for this keyword
5. Quick tips for ranking for this keyword

Format as JSON.`,
      response_json_schema: {
        type: 'object',
        properties: {
          difficulty: { type: 'string' },
          search_intent: { type: 'string' },
          related_keywords: { type: 'array', items: { type: 'string' } },
          content_ideas: { type: 'array', items: { type: 'string' } },
          tips: { type: 'array', items: { type: 'string' } },
        }
      }
    });
    setAnalysisResult(result);
    setLoading(false);
  };

  const generateContentIdeas = async () => {
    if (!contentTopic) return;
    setLoadingIdeas(true);
    const result = await base44.integrations.Core.InvokeLLM({
      prompt: `Generate SEO-optimized content ideas for The Candora Society (Edmonton non-profit helping newcomers with employment and settlement) on the topic: "${contentTopic}".

Provide 5 content pieces with title, format, target keyword, and brief description.`,
      response_json_schema: {
        type: 'object',
        properties: {
          ideas: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                title: { type: 'string' },
                format: { type: 'string' },
                target_keyword: { type: 'string' },
                description: { type: 'string' }
              }
            }
          }
        }
      }
    });
    setContentIdeas(result?.ideas || []);
    setLoadingIdeas(false);
  };

  const toggleChecklist = (id) => {
    setChecklist(c => ({ ...c, [id]: !c[id] }));
  };

  const checklistScore = Math.round((Object.values(checklist).filter(Boolean).length / SEO_CHECKLIST.length) * 100);

  const grouped = SEO_CHECKLIST.reduce((acc, item) => {
    if (!acc[item.category]) acc[item.category] = [];
    acc[item.category].push(item);
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">SEO Tools</h1>
        <p className="text-sm text-slate-500 mt-1">Keyword analysis, SEO health checklist, and AI-powered content ideas.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Keyword Analyzer */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2"><Search className="w-4 h-4 text-orange-500" /> Keyword Analyzer</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Input value={keyword} onChange={e => setKeyword(e.target.value)} placeholder="e.g. immigrant employment services Edmonton" className="flex-1" onKeyDown={e => e.key === 'Enter' && analyzeKeyword()} />
              <Button onClick={analyzeKeyword} disabled={!keyword || loading}>
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Analyze'}
              </Button>
            </div>
            {analysisResult && (
              <div className="space-y-3">
                <div className="flex gap-3 flex-wrap">
                  <Badge className={analysisResult.difficulty === 'low' ? 'bg-green-100 text-green-700' : analysisResult.difficulty === 'medium' ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'}>
                    Difficulty: {analysisResult.difficulty}
                  </Badge>
                  <Badge variant="outline">Intent: {analysisResult.search_intent}</Badge>
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-500 uppercase mb-2">Related Long-tail Keywords</p>
                  <div className="flex flex-wrap gap-1.5">
                    {(analysisResult.related_keywords || []).map((kw, i) => (
                      <span key={i} className="text-xs bg-orange-50 text-orange-700 px-2 py-1 rounded border border-orange-100">{kw}</span>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-500 uppercase mb-2">Content Ideas</p>
                  <ul className="space-y-1">
                    {(analysisResult.content_ideas || []).map((idea, i) => (
                      <li key={i} className="text-sm text-slate-700 flex items-start gap-2"><span className="text-orange-400 mt-0.5">•</span>{idea}</li>
                    ))}
                  </ul>
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-500 uppercase mb-2">Tips</p>
                  <ul className="space-y-1">
                    {(analysisResult.tips || []).map((tip, i) => (
                      <li key={i} className="text-sm text-slate-700 flex items-start gap-2"><CheckCircle className="w-3.5 h-3.5 text-green-500 mt-0.5 shrink-0" />{tip}</li>
                    ))}
                  </ul>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Content Ideas Generator */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2"><FileText className="w-4 h-4 text-blue-500" /> AI Content Ideas</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Input value={contentTopic} onChange={e => setContentTopic(e.target.value)} placeholder="e.g. newcomer job search resources" className="flex-1" onKeyDown={e => e.key === 'Enter' && generateContentIdeas()} />
              <Button onClick={generateContentIdeas} disabled={!contentTopic || loadingIdeas}>
                {loadingIdeas ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Generate'}
              </Button>
            </div>
            {contentIdeas && (
              <div className="space-y-3">
                {contentIdeas.map((idea, i) => (
                  <div key={i} className="p-3 bg-blue-50 rounded-lg border border-blue-100">
                    <p className="font-semibold text-sm text-slate-800">{idea.title}</p>
                    <div className="flex gap-2 mt-1 mb-2 flex-wrap">
                      <Badge variant="outline" className="text-xs">{idea.format}</Badge>
                      <span className="text-xs bg-orange-50 text-orange-700 px-2 py-0.5 rounded border border-orange-100">🔑 {idea.target_keyword}</span>
                    </div>
                    <p className="text-xs text-slate-600">{idea.description}</p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* SEO Health Checklist */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2"><CheckCircle className="w-4 h-4 text-green-500" /> SEO Health Checklist</CardTitle>
            <div className="flex items-center gap-2">
              <div className="w-32 h-2 bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full bg-green-500 rounded-full transition-all" style={{ width: `${checklistScore}%` }} />
              </div>
              <span className="text-sm font-semibold text-slate-700">{checklistScore}%</span>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {Object.entries(grouped).map(([category, items]) => (
              <div key={category}>
                <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">{category}</h3>
                <div className="space-y-2">
                  {items.map(item => (
                    <label key={item.id} className="flex items-center gap-2.5 cursor-pointer group">
                      <div className={`w-4 h-4 rounded border-2 flex items-center justify-center transition-colors ${checklist[item.id] ? 'bg-green-500 border-green-500' : 'border-slate-300 group-hover:border-green-400'}`}
                        onClick={() => toggleChecklist(item.id)}>
                        {checklist[item.id] && <span className="text-white text-[10px]">✓</span>}
                      </div>
                      <span className={`text-sm ${checklist[item.id] ? 'text-slate-400 line-through' : 'text-slate-700'}`}>{item.label}</span>
                    </label>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}