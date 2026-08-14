import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { ClipboardCheck, Clock, ArrowUpCircle } from 'lucide-react';

export default function WaitlistTable({ clients, onRemove }) {
  return (
    <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="text-left px-3 py-3 font-semibold text-slate-600">Name</th>
              <th className="text-left px-3 py-3 font-semibold text-slate-600">HSID#</th>
              <th className="text-left px-3 py-3 font-semibold text-slate-600">Phone</th>
              <th className="text-left px-3 py-3 font-semibold text-slate-600">Intake Date</th>
              <th className="text-left px-3 py-3 font-semibold text-slate-600">Waitlist Date</th>
              <th className="px-3 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {clients.map(c => (
              <tr key={c.id} className="hover:bg-slate-50 transition-colors">
                <td className="px-3 py-2.5 font-medium text-blue-700">
                  {c.first_name} {c.last_name}
                </td>
                <td className="px-3 py-2.5 text-slate-600">{c.compass_hsid || '—'}</td>
                <td className="px-3 py-2.5 text-slate-600">{c.phone || '—'}</td>
                <td className="px-3 py-2.5 text-slate-500">
                  {c.intake_date ? format(new Date(c.intake_date), 'MMM d, yyyy') : '—'}
                </td>
                <td className="px-3 py-2.5 text-amber-700">
                  {c.waitlist_date ? format(new Date(c.waitlist_date), 'MMM d, yyyy') : '—'}
                </td>
                <td className="px-3 py-2.5">
                  <div className="flex items-center gap-1.5">
                    <Link to={`/pathways/assessment/${c.id}`}>
                      <Button variant="outline" size="sm" className="gap-1">
                        <ClipboardCheck className="w-3.5 h-3.5" />
                        Assess
                      </Button>
                    </Link>
                    <Button
                      variant="outline"
                      size="sm"
                      className="gap-1 text-blue-700 border-blue-300 hover:bg-blue-50"
                      onClick={() => onRemove?.(c)}
                    >
                      <ArrowUpCircle className="w-3.5 h-3.5" />
                      Remove from Waitlist
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
            {clients.length === 0 && (
              <tr>
                <td colSpan={6} className="text-center py-10 text-slate-400">
                  No clients on the waitlist.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}