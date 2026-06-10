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
      prompt: `Search the web for actual current job postings for "${jobType}" near ${location}, Canada. Find real job listings from Indeed Canada, Job Bank Canada, ZipRecruiter, or other Canadian job boards.\n\nReturn up to 15 real job postings currently available. For each listing include:\n- The exact job title as posted\n- The employer/company name\n- The location (city, province)\n- Salary or wage if shown\n- A brief description of the role (1-2 sentences)\n- The direct URL to the job posting\n- The source job board name\n\nAlso include 3-5 related job titles the person might also search for.\n\nOnly include real, currently posted jobs. Do not fabricate listings.`,
      add_context_from_internet: true,
      model: 'gemini_3_flash',
      response_json_schema: {
        type: 'object',
        properties: {
          listings: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                title: { type: 'string' },
                company: { type: 'string' },
                location: { type: 'string' },
                salary: { type: 'string' },
                description: { type: 'string' },
                url: { type: 'string' },
                source: { type: 'string' },
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
            <h4 className="text-sm font-semibold text-slate-700 mb-2">Browse All on Job Boards</h4>
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

          {/* Live Job Listings */}
          {results.listings?.length > 0 && (
            <div>
              <h4 className="text-sm font-semibold text-slate-700 mb-2">
                Current Job Postings
                <span className="ml-2 text-xs font-normal text-slate-400">({results.listings.length} found)</span>
              </h4>
              <div className="space-y-2">
                {results.listings.map((job, i) => (
                  <div key={i} className="bg-white border border-slate-200 rounded-lg p-4 hover:border-slate-300 transition-colors">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          {job.url ? (
                            <a
                              href={job.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-sm font-semibold text-blue-700 hover:underline"
                            >
                              {job.title}
                            </a>
                          ) : (
                            <span className="text-sm font-semibold text-slate-800">{job.title}</span>
                          )}
                          {job.source && (
                            <span className="bg-slate-100 text-slate-500 text-[10px] px-1.5 py-0.5 rounded">
                              {job.source}
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-slate-600 mt-0.5">{job.company}</p>
                        <div className="flex items-center gap-3 mt-1 flex-wrap">
                          {job.location && (
                            <span className="text-xs text-slate-500">{job.location}</span>
                          )}
                          {job.salary && (
                            <span className="text-xs font-medium text-green-700 bg-green-50 px-1.5 py-0.5 rounded">
                              {job.salary}
                            </span>
                          )}
                        </div>
                        {job.description && (
                          <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">{job.description}</p>
                        )}
                      </div>
                      {job.url && (
                        <a
                          href={job.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="shrink-0 text-slate-400 hover:text-blue-600 transition-colors"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </a>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Related Roles */}
          {results.related_titles?.length > 0 && (
            <div>
              <h4 className="text-sm font-semibold text-slate-700 mb-2">Related Roles to Also Search</h4>
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