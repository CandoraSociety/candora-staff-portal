import { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2, Search, ExternalLink } from 'lucide-react';

const JOB_BOARDS = [
  {
    name: 'Indeed Canada',
    color: 'bg-blue-600 hover:bg-blue-700',
    url: (query, location) =>
      `https://ca.indeed.com/jobs?q=${encodeURIComponent(query)}&l=${encodeURIComponent(location)}`,
  },
  {
    name: 'ZipRecruiter',
    color: 'bg-orange-500 hover:bg-orange-600',
    url: (query, location) =>
      `https://www.ziprecruiter.com/jobs-search?search=${encodeURIComponent(query)}&location=${encodeURIComponent(location)}`,
  },
  {
    name: 'Government of Canada Job Bank',
    color: 'bg-red-700 hover:bg-red-800',
    url: (query, location) =>
      `https://www.jobbank.gc.ca/jobsearch/jobsearch?searchstring=${encodeURIComponent(query)}&locationstring=${encodeURIComponent(location)}`,
  },
];

function QuickLinks({ query, location }) {
  return (
    <div className="flex gap-2 flex-wrap mt-1">
      {JOB_BOARDS.map(board => (
        <a
          key={board.name}
          href={board.url(query, location)}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-blue-600 hover:underline"
        >
          {board.name.split(' ')[0]}
        </a>
      ))}
    </div>
  );
}

export default function JobSearch() {
  const [jobType, setJobType] = useState('');
  const [location, setLocation] = useState('Edmonton, Alberta');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState(null);
  const [error, setError] = useState(null);

  const search = async () => {
    setLoading(true);
    setError(null);
    setResults(null);
    const res = await base44.integrations.Core.InvokeLLM({
      prompt: `You are helping a job seeker in Alberta, Canada find employment. They are looking for: "${jobType}" near ${location}.\n\nGenerate a list of 10 specific, realistic job search queries they should use on job boards. For each query:\n- Provide the exact search term to use\n- A brief note on what type of role it targets\n- The NOC (National Occupational Classification) code if applicable\n\nAlso suggest 5 related job titles they might not have considered that use similar skills.\n\nKeep results practical and relevant to the Alberta labour market.`,
      response_json_schema: {
        type: 'object',
        properties: {
          search_queries: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                query: { type: 'string' },
                description: { type: 'string' },
                noc_code: { type: 'string' },
              },
            },
          },
          related_titles: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                title: { type: 'string' },
                reason: { type: 'string' },
              },
            },
          },
        },
      },
    });
    setResults(res);
    setLoading(false);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && jobType && !loading) search();
  };

  return (
    <div className="space-y-5">
      {/* Search Form */}
      <div className="flex gap-3 flex-wrap items-end">
        <div className="flex-1 min-w-[220px]">
          <label className="text-sm font-medium text-slate-700 block mb-1">Job Type / Career</label>
          <Input
            value={jobType}
            onChange={e => setJobType(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="e.g. Early Childhood Educator, Welder, Food Service Worker"
          />
        </div>
        <div className="w-48">
          <label className="text-sm font-medium text-slate-700 block mb-1">Location</label>
          <Input value={location} onChange={e => setLocation(e.target.value)} />
        </div>
        <Button onClick={search} disabled={!jobType || loading}>
          {loading ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <Search className="w-4 h-4 mr-1" />}
          {loading ? 'Searching...' : 'Find Jobs'}
        </Button>
      </div>

      {error && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded p-3">{error}</p>
      )}

      {results && (
        <div className="space-y-5">
          {/* Direct Job Board Links */}
          <div>
            <h4 className="text-sm font-semibold text-slate-700 mb-2">Search on Job Boards</h4>
            <div className="flex flex-wrap gap-2">
              {JOB_BOARDS.map(board => (
                <a
                  key={board.name}
                  href={board.url(jobType, location)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`inline-flex items-center gap-1.5 text-white text-sm font-medium px-4 py-2 rounded-md transition-opacity ${board.color}`}
                >
                  {board.name}
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              ))}
            </div>
          </div>

          {/* Recommended Search Queries */}
          {results.search_queries?.length > 0 && (
            <div>
              <h4 className="text-sm font-semibold text-slate-700 mb-2">Recommended Search Terms</h4>
              <div className="space-y-2">
                {results.search_queries.map((item, i) => (
                  <div key={i} className="flex gap-3 items-start bg-white border border-slate-200 rounded-lg p-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-semibold text-slate-800">{item.query}</span>
                        {item.noc_code && (
                          <span className="bg-slate-100 text-slate-500 text-[10px] px-1.5 py-0.5 rounded font-mono">
                            NOC {item.noc_code}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">{item.description}</p>
                      <QuickLinks query={item.query} location={location} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Related Roles */}
          {results.related_titles?.length > 0 && (
            <div>
              <h4 className="text-sm font-semibold text-slate-700 mb-2">Related Roles to Consider</h4>
              <div className="grid md:grid-cols-2 gap-2">
                {results.related_titles.map((item, i) => (
                  <div key={i} className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                    <p className="text-sm font-semibold text-slate-800">{item.title}</p>
                    <p className="text-xs text-slate-500 mt-0.5">{item.reason}</p>
                    <div className="flex gap-2 flex-wrap mt-1.5">
                      {JOB_BOARDS.map(board => (
                        <a
                          key={board.name}
                          href={board.url(item.title, location)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-blue-600 hover:underline"
                        >
                          {board.name.split(' ')[0]}
                        </a>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}