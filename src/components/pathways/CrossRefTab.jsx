import { useState, useEffect, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Upload, Loader2, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';

const DEFAULT_FILE_URL = 'https://media.base44.com/files/public/6a249282cb496579542673b7/e1cca0072_EmploymentprogramClientStatusV3.xlsx';
const DEFAULT_FILE_NAME = 'EmploymentprogramClientStatusV3.xlsx';

const normName = (s) => (s || '').toLowerCase().replace(/[,.\s]+/g, ' ').trim();

const rowNameKeys = (name) => {
  const n = normName(name);
  if (!n) return [];
  if (name.includes(',')) {
    const [last, ...rest] = name.split(',').map(s => s.trim());
    const first = rest.join(' ');
    return [n, normName(`${last} ${first}`), normName(`${first} ${last}`)].filter(Boolean);
  }
  return [n];
};

const buildClientNameKeys = (c) => {
  const first = (c.first_name || '').toLowerCase().trim();
  const last = (c.last_name || '').toLowerCase().trim();
  return [
    normName(`${last}, ${first}`),
    normName(`${first} ${last}`),
    normName(`${last} ${first}`),
  ].filter(Boolean);
};

export default function CrossRefTab({ activeClients, onCountsChange }) {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [fileName, setFileName] = useState(DEFAULT_FILE_NAME);
  const [comments, setComments] = useState({});
  const [filter, setFilter] = useState('all');
  const fileInput = useRef(null);

  const load = async (file_url, label) => {
    setLoading(true);
    try {
      const res = await base44.functions.invoke('parseClientStatusWorkbook', { file_url });
      setRows(res.data?.rows || []);
      if (label) setFileName(label);
      toast.success(`${res.data?.count || 0} clients loaded from workbook`);
    } catch (e) {
      toast.error('Failed to parse workbook');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(DEFAULT_FILE_URL, DEFAULT_FILE_NAME); }, []);

  const handleUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setLoading(true);
    try {
      const up = await base44.integrations.Core.UploadFile({ file });
      await load(up.file_url, file.name);
    } catch (err) {
      toast.error('Upload failed');
      setLoading(false);
    }
    e.target.value = '';
  };

  const hsidSet = new Set((activeClients || []).map(c => (c.compass_hsid || '').trim()).filter(Boolean));
  const nameKeys = new Set();
  (activeClients || []).forEach(c => buildClientNameKeys(c).forEach(k => nameKeys.add(k)));

  const isMatch = (row) => {
    const hsid = (row.hsid || '').trim();
    if (hsid && hsidSet.has(hsid)) return true;
    return rowNameKeys(row.client_name).some(k => nameKeys.has(k));
  };

  const matchedCount = rows.filter(isMatch).length;
  const unmatchedCount = rows.length - matchedCount;
  const filteredRows = filter === 'all' ? rows : rows.filter(r => filter === 'matched' ? isMatch(r) : !isMatch(r));

  useEffect(() => {
    if (onCountsChange) onCountsChange({ all: rows.length, matched: matchedCount, unmatched: unmatchedCount });
  }, [rows, matchedCount, unmatchedCount, onCountsChange]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="text-sm text-slate-600">
          Source: <span className="font-medium text-slate-800">{fileName}</span> · {rows.length} rows ·{' '}
          <span className="text-green-700 font-medium">{matchedCount} matched in master list</span>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 bg-slate-100 rounded-lg p-0.5">
            {[
              { id: 'all', label: 'All', count: rows.length },
              { id: 'matched', label: 'In Master List', count: matchedCount },
              { id: 'unmatched', label: 'Not in Master List', count: unmatchedCount },
            ].map(f => (
              <button
                key={f.id}
                onClick={() => setFilter(f.id)}
                className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors ${
                  filter === f.id ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                {f.label}
                <span className={`ml-1.5 ${filter === f.id ? 'text-slate-400' : 'text-slate-400'}`}>({f.count})</span>
              </button>
            ))}
          </div>
          <input ref={fileInput} type="file" accept=".xlsx,.xls" className="hidden" onChange={handleUpload} />
          <Button variant="outline" size="sm" onClick={() => fileInput.current?.click()} className="gap-1">
            <Upload className="w-4 h-4" /> Upload Workbook
          </Button>
        </div>
      </div>

      <div className="text-xs text-slate-600 bg-green-50 border border-green-200 rounded-md px-3 py-2">
        Rows highlighted in green are already in the All Active master list (matched by HSID# or name).
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
        </div>
      ) : (
        <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="text-left px-3 py-3 font-semibold text-slate-600">Source Sheet</th>
                  <th className="text-left px-3 py-3 font-semibold text-slate-600">Client Name</th>
                  <th className="text-left px-3 py-3 font-semibold text-slate-600">HSID#</th>
                  <th className="text-left px-3 py-3 font-semibold text-slate-600">Status</th>
                  <th className="text-left px-3 py-3 font-semibold text-slate-600">EDAS Completed</th>
                  <th className="text-left px-3 py-3 font-semibold text-slate-600">Extra Notes</th>
                  <th className="text-left px-3 py-3 font-semibold text-slate-600">Comments</th>
                  <th className="px-3 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredRows.map((r, i) => {
                  const matched = isMatch(r);
                  const rowKey = `${r.source_sheet}|${r.hsid}|${r.client_name}`;
                  return (
                    <tr key={rowKey} className={matched ? 'bg-green-50' : 'hover:bg-slate-50'}>
                      <td className="px-3 py-2.5">
                        <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">{r.source_sheet}</span>
                      </td>
                      <td className="px-3 py-2.5 font-medium text-slate-800">{r.client_name}</td>
                      <td className="px-3 py-2.5 text-slate-600">{r.hsid || '—'}</td>
                      <td className="px-3 py-2.5 text-slate-600">{r.status || '—'}</td>
                      <td className="px-3 py-2.5 text-slate-600">{r.edas_completed || '—'}</td>
                      <td className="px-3 py-2.5 text-slate-500 max-w-xs">{r.extra_notes || '—'}</td>
                      <td className="px-3 py-2.5">
                        <input
                          type="text"
                          value={comments[rowKey] || ''}
                          onChange={(e) => setComments(c => ({ ...c, [rowKey]: e.target.value }))}
                          placeholder="Add comment..."
                          className="w-full max-w-[200px] h-8 text-xs rounded-md border border-slate-200 px-2 py-1 focus:outline-none focus:ring-1 focus:ring-blue-400"
                        />
                      </td>
                      <td className="px-3 py-2.5">
                        {matched && <CheckCircle2 className="w-4 h-4 text-green-600" />}
                      </td>
                    </tr>
                  );
                })}
                {filteredRows.length === 0 && (
                  <tr><td colSpan={8} className="text-center py-10 text-slate-400">No clients match this filter.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}