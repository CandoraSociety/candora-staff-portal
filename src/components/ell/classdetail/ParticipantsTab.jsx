import React from 'react';
import { format } from 'date-fns';

const parseLocalDate = (str) => {
  if (!str) return null;
  const [y, m, d] = str.split('-').map(Number);
  return new Date(y, m - 1, d);
};

export default function ParticipantsTab({ participants }) {
  const sorted = [...(participants || [])].sort((a, b) =>
    `${a.last_name || ''}${a.first_name || ''}`.localeCompare(`${b.last_name || ''}${b.first_name || ''}`)
  );

  return (
    <div className="rounded-lg border bg-card">
      <div className="p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-sm">Class Participants</h3>
          <span className="text-xs text-muted-foreground">{sorted.length} enrolled</span>
        </div>
        {sorted.length === 0 ? (
          <p className="text-sm text-muted-foreground py-6 text-center">
            No learners assigned to this class yet — assign learners from the Learners tab.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-muted-foreground border-b">
                  <th className="pb-2 font-medium">Learner</th>
                  <th className="pb-2 font-medium">CLB</th>
                  <th className="pb-2 font-medium">Status</th>
                  <th className="pb-2 font-medium">Contact</th>
                  <th className="pb-2 font-medium">Intake</th>
                </tr>
              </thead>
              <tbody>
                {sorted.map(l => (
                  <tr key={l.id} className="border-b last:border-0">
                    <td className="py-2 font-medium">{l.first_name} {l.last_name}</td>
                    <td className="py-2">{l.clb_level ? l.clb_level.replace('_', ' ').toUpperCase() : '—'}</td>
                    <td className="py-2">
                      <span className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground capitalize">{l.enrollment_status || '—'}</span>
                    </td>
                    <td className="py-2 text-xs text-muted-foreground">{l.phone || l.email || '—'}</td>
                    <td className="py-2 text-xs text-muted-foreground">{l.intake_date ? format(parseLocalDate(l.intake_date), 'MMM d, yyyy') : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}