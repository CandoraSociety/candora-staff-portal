import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { Mail, Phone, MapPin, ChevronDown, ChevronRight, Users, Building2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';

const STATUS_LABELS = { pending: 'Pending', in_progress: 'In Progress', completed: 'Completed', cancelled: 'Cancelled' };
const STATUS_COLORS = {
  pending: 'bg-amber-100 text-amber-700',
  in_progress: 'bg-blue-100 text-blue-700',
  completed: 'bg-green-100 text-green-700',
  cancelled: 'bg-red-100 text-red-700',
};

const fmt = (d) => d ? format(new Date(d + 'T00:00:00'), 'MMM d, yy') : '—';

export default function EmployersListTab() {
  const [employers, setEmployers] = useState([]);
  const [placements, setPlacements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState({});

  useEffect(() => {
    (async () => {
      try {
        const [emps, pls] = await Promise.all([
          base44.entities.Employer.list('-created_date', 500),
          base44.entities.WorkExposurePlacement.list('-created_date', 1000),
        ]);
        setEmployers(emps);
        setPlacements(pls);
      } catch {}
      setLoading(false);
    })();
  }, []);

  const currentOf = (id) => placements.filter(p => p.employer_id === id && ['pending', 'in_progress'].includes(p.status));
  const previousOf = (id) => placements.filter(p => p.employer_id === id && ['completed', 'cancelled'].includes(p.status));

  if (loading) return <p className="text-sm text-slate-500 text-center py-6">Loading employers...</p>;
  if (employers.length === 0) return (
    <div className="text-center py-16 text-slate-400">
      <Building2 className="w-12 h-12 mx-auto mb-3 opacity-30" />
      <p className="text-lg font-medium">No employers yet</p>
      <p className="text-sm mt-1">Add employers from the Employer Portal management page.</p>
    </div>
  );

  return (
    <div className="space-y-2">
      <p className="text-xs text-slate-500 mb-1">
        All employers and the clients currently or previously placed with them. Click an employer to expand.
      </p>
      {employers.map(emp => {
        const cur = currentOf(emp.id);
        const prev = previousOf(emp.id);
        const isOpen = !!expanded[emp.id];
        return (
          <div key={emp.id} className="border rounded-lg bg-white">
            <button
              className="w-full p-3 flex items-center justify-between gap-3 text-left hover:bg-slate-50 rounded-lg"
              onClick={() => setExpanded(p => ({ ...p, [emp.id]: !p[emp.id] }))}
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-semibold text-sm">{emp.name}</span>
                  <Badge variant="outline" className="text-xs">{emp.status}</Badge>
                </div>
                <div className="text-xs text-slate-600 mt-0.5 flex flex-wrap gap-x-3 gap-y-0.5">
                  {emp.contact_name && <span>{emp.contact_name}{emp.position ? ` · ${emp.position}` : ''}</span>}
                  {emp.contact_email && <span className="flex items-center gap-1"><Mail className="w-3 h-3" />{emp.contact_email}</span>}
                  {emp.contact_phone && <span className="flex items-center gap-1"><Phone className="w-3 h-3" />{emp.contact_phone}</span>}
                  {emp.industry && <span>{emp.industry}</span>}
                  {emp.address && <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{emp.address}</span>}
                </div>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <span className="text-xs flex items-center gap-1"><Users className="w-3.5 h-3.5 text-blue-600" /> {cur.length} current</span>
                <span className="text-xs text-slate-500">{prev.length} previous</span>
                {isOpen ? <ChevronDown className="w-4 h-4 text-slate-400" /> : <ChevronRight className="w-4 h-4 text-slate-400" />}
              </div>
            </button>
            {isOpen && (
              <div className="border-t bg-slate-50 p-3 space-y-3 rounded-b-lg">
                <ClientGroup title="Currently Assigned" rows={cur} />
                <ClientGroup title="Previously Assigned" rows={prev} />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

function ClientGroup({ title, rows }) {
  if (!rows.length) return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-400 mb-1">{title}</p>
      <p className="text-sm text-slate-400 italic px-2">None</p>
    </div>
  );
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 mb-1">{title} ({rows.length})</p>
      <div className="space-y-1">
        {rows.map(p => (
          <div key={p.id} className="flex items-center justify-between gap-2 px-2 py-1.5 rounded bg-white border border-slate-200 text-sm">
            <Link to={`/pathways/client/${p.client_id}`} className="font-medium hover:underline" style={{ color: 'hsl(231,64%,28%)' }}>
              {p.client_name}
            </Link>
            <div className="flex items-center gap-2 text-xs text-slate-500 flex-wrap justify-end">
              {p.position_type && <span>{p.position_type}</span>}
              <span className={`px-1.5 py-0.5 rounded ${STATUS_COLORS[p.status] || 'bg-slate-100 text-slate-600'}`}>{STATUS_LABELS[p.status] || p.status}</span>
              <span className="whitespace-nowrap">{p.start_date ? fmt(p.start_date) : ''}{p.anticipated_completion_date ? ` → ${fmt(p.anticipated_completion_date)}` : ''}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}