import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import CompassTaskList from '@/components/compass/CompassTaskList';
import CompassTallyList from '@/components/compass/CompassTallyList';

import { Clock, ExternalLink, RotateCcw, User } from 'lucide-react';

const COMPASS_URL = 'https://csscm.alberta.ca/home';

function prettifyName(raw) {
  if (!raw) return '';
  let s = String(raw).trim();
  if (s.includes('@')) s = s.split('@')[0];
  if (!s.includes(' ') && /[._-]/.test(s)) {
    return s.split(/[._-]+/).filter(Boolean).map(p => p.charAt(0).toUpperCase() + p.slice(1)).join(' ');
  }
  return s.split(/\s+/).map(p => p.charAt(0).toUpperCase() + p.slice(1)).join(' ');
}

function groupTasksByCounsellor(tasks) {
  const groups = {};
  for (const task of tasks) {
    const raw = task.assigned_worker_name || task.triggered_by_name || 'Unassigned';
    const name = raw === 'Unassigned' ? 'Unassigned' : prettifyName(raw);
    if (!groups[name]) groups[name] = [];
    groups[name].push(task);
  }

  const AP_TYPES = ['barriers_identified', 'action_plan'];

  // Sort tasks within each group: AP types first, then by created_date desc
  for (const name of Object.keys(groups)) {
    groups[name].sort((a, b) => {
      const aAP = AP_TYPES.includes(a.task_type) ? 0 : 1;
      const bAP = AP_TYPES.includes(b.task_type) ? 0 : 1;
      if (aAP !== bAP) return aAP - bAP;
      return new Date(b.created_date) - new Date(a.created_date);
    });
  }

  // Sort counsellor names alphabetically, "Unassigned" last
  const sorted = Object.keys(groups).sort((a, b) => {
    if (a === 'Unassigned') return 1;
    if (b === 'Unassigned') return -1;
    return a.localeCompare(b);
  });

  return sorted.map(name => ({ name, tasks: groups[name] }));
}

export default function PathwaysCompass() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [pageTab, setPageTab] = useState('queue');

  useEffect(() => {
    base44.auth.me().then(u => setCurrentUser(u)).catch(() => {});
    loadTasks();
  }, []);

  const loadTasks = async () => {
    setLoading(true);
    const all = await base44.entities.CompassTask.list('-created_date', 500);
    setTasks(all);
    setLoading(false);
  };

  const pending = tasks.filter(t => t.status === 'pending');
  const groups = groupTasksByCounsellor(tasks);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Compass Task Queue</h1>
          <p className="text-sm text-slate-500 mt-0.5">Pending data entry tasks for the Government of Alberta Compass database</p>
        </div>
        <div className="flex items-center gap-3">
          {pending.length > 0 && (
            <span className="inline-flex items-center gap-1.5 bg-amber-100 text-amber-800 text-sm font-semibold px-3 py-1.5 rounded-full">
              <Clock className="w-3.5 h-3.5" />
              {pending.length} pending
            </span>
          )}
          <Button variant="outline" size="sm" onClick={loadTasks} className="gap-2">
            <RotateCcw className="w-3.5 h-3.5" /> Refresh
          </Button>
          <Button asChild size="sm" className="gap-2">
            <a href={COMPASS_URL} target="_blank" rel="noopener noreferrer">
              <ExternalLink className="w-3.5 h-3.5" /> Log in to Compass
            </a>
          </Button>
        </div>
      </div>

      {/* Page tabs */}
      <div className="flex gap-1 bg-slate-100 rounded-lg p-1 w-fit">
        <button
          onClick={() => setPageTab('queue')}
          className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${pageTab === 'queue' ? 'bg-white shadow text-slate-800' : 'text-slate-500 hover:text-slate-700'}`}
        >
          Task Queue
        </button>
        <button
          onClick={() => setPageTab('tally')}
          className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${pageTab === 'tally' ? 'bg-white shadow text-slate-800' : 'text-slate-500 hover:text-slate-700'}`}
        >
          Invoice Tracker Tally
        </button>
      </div>

      {pageTab === 'tally' ? (
        <CompassTallyList currentUser={currentUser} />
      ) : (
        <>
          {/* Loading */}
          {loading && groups.length === 0 && (
            <div className="flex justify-center py-16">
              <div className="w-8 h-8 border-4 rounded-full animate-spin candora-spin" />
            </div>
          )}

          {/* Empty */}
          {!loading && groups.length === 0 && (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <Clock className="w-12 h-12 text-slate-300 mb-3" />
              <p className="text-slate-500 font-medium">No Compass tasks yet.</p>
            </div>
          )}

          {/* Counsellor Groups */}
          {groups.map(({ name, tasks: groupTasks }) => (
            <div key={name} className="space-y-3">
              <div className="flex items-center gap-3">
                <div
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-semibold"
                  style={{ background: 'hsl(231,64%,20%)', color: 'white' }}
                >
                  <User className="w-3.5 h-3.5" />
                  {name}
                </div>
                <span className="text-xs text-slate-400">
                  {groupTasks.filter(t => t.status === 'pending').length} pending
                </span>
              </div>
              <CompassTaskList
                tasks={groupTasks}
                currentUser={currentUser}
                onRefresh={loadTasks}
              />
            </div>
          ))}
        </>
      )}
    </div>
  );
}