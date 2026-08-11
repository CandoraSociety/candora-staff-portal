import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { ClipboardCheck } from 'lucide-react';

export default function AwaitingAssessmentTable({ clients }) {
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
              <th className="text-left px-3 py-3 font-semibold text-slate-600">Self-Reg</th>
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
                <td className="px-3 py-2.5">
                  {c.self_registered ? (
                    <span className="text-xs bg-green-100 text-green-700 px-1.5 py-0.5 rounded-full font-medium">
                      Yes
                    </span>
                  ) : '—'}
                </td>
                <td className="px-3 py-2.5">
                  <Link to={`/pathways/assessment/${c.id}`}>
                    <Button variant="outline" size="sm" className="gap-1">
                      <ClipboardCheck className="w-3.5 h-3.5" />
                      Assess
                    </Button>
                  </Link>
                </td>
              </tr>
            ))}
            {clients.length === 0 && (
              <tr>
                <td colSpan={6} className="text-center py-10 text-slate-400">
                  No clients awaiting assessment.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}