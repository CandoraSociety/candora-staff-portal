import React from 'react';
import { useNavigate } from 'react-router-dom';
import { format, parseISO } from 'date-fns';
import { X, FileText, Calendar, Flag } from 'lucide-react';
import { Button } from '@/components/ui/button';

const TYPE_ICONS = { report: FileText, proposal: Calendar, milestone: Flag };
const TYPE_LABELS = { report: 'Report Due', proposal: 'Submission Deadline', milestone: 'Milestone' };
const TYPE_COLORS = {
  report: 'bg-blue-50 border-blue-200 text-blue-700',
  proposal: 'bg-amber-50 border-amber-200 text-amber-700',
  milestone: 'bg-purple-50 border-purple-200 text-purple-700',
};

export default function GrantsDeadlineDetailPopup({ day, deadlines, onClose }) {
  const navigate = useNavigate();

  const handleNavigate = (deadline) => {
    if (deadline.project_id) {
      navigate(`/grants/projects/${deadline.project_id}`);
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/30" />
      <div className="relative bg-card border rounded-xl shadow-xl w-full max-w-sm p-5" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-sm">{format(day, 'MMMM d, yyyy')}</h3>
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onClose}><X className="h-4 w-4" /></Button>
        </div>
        <div className="space-y-2">
          {deadlines.map(d => {
            const Icon = TYPE_ICONS[d.type] || Calendar;
            return (
              <button
                key={d.id}
                onClick={() => handleNavigate(d)}
                className={`w-full text-left flex items-start gap-3 p-3 rounded-lg border transition-opacity hover:opacity-80 ${TYPE_COLORS[d.type] || 'bg-gray-50 border-gray-200 text-gray-700'}`}
              >
                <Icon className="h-4 w-4 mt-0.5 flex-shrink-0" />
                <div className="min-w-0">
                  <p className="text-xs font-semibold uppercase tracking-wide opacity-70">{TYPE_LABELS[d.type]}</p>
                  <p className="text-sm font-medium truncate">{d.title}</p>
                  {d.projectTitle && <p className="text-xs opacity-70 truncate">{d.projectTitle}</p>}
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}