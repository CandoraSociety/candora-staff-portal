import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { PlusCircle, LogOut, ClipboardCheck, UserCheck, XCircle } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { toast } from 'sonner';
import IntakeForm from '@/components/intake/IntakeForm';
import DuplicateWarningDialog from '@/components/intake/DuplicateWarningDialog';
import ClientListControls, { applyFiltersAndSort } from '@/components/lists/ClientListControls';
import { createCompassTask, taskNewClient } from '@/lib/compassTasks';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const EMPTY_FILTERS = {
  service_type: '', program_status: '', employment_status: '',
  clb_level: '', assigned_worker: '', age_min: '', age_max: '',
  duration_min: '', duration_max: '', referral_source: '', residency_status: '', followup_90day_status: '',
};

const SERVICE_LABELS = {
  direct_to_employment: 'DEA',
  pathways: 'Pathways',
  casual: 'Casual',
  external_referral: 'Ext. Referral',
  internal_referral: 'Int. Referral',
  not_eligible: 'Not Eligible',
};

const PROGRAM_STATUS_COLORS = {
  in_progress: 'bg-blue-100 text-blue-700',
  complete: 'bg-green-100 text-green-700',
  incomplete: 'bg-yellow-100 text-yellow-700',
  cancelled: 'bg-red-100 text-red-700',
};

export default function PathwaysIntake() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [clients, setClients] = useState([]);
  const [staffList, setStaffList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingClient, setEditingClient] = useState(null);
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState(EMPTY_FILTERS);
  const [sortKey, setSortKey] = useState('intake_date_desc');
  const [pendingData, setPendingData] = useState(null);
  const [duplicates, setDuplicates] = useState([]);
  const [assignClientId, setAssignClientId] = useState(null);
  const [selectedWorker, setSelectedWorker] = useState('');
  const [assigning, setAssigning] = useState(false);

  useEffect(() => {
    const load = async () => {
      const [me, clientList, staff] = await Promise.all([
        base44.auth.me().catch(() => null),
        base44.entities.Client.list('-created_date', 1000),
        base44.entities.PathwaysStaff.filter({ role: 'career_counsellor', is_active: true }, 'name'),
      ]);
      setUser(me);
      setClients(clientList);
      setStaffList(staff);
      setLoading(false);
    };
    load();
  }, []);

  // Unassigned = no assigned_worker AND not closed
  const unassignedClients = clients.filter(c => !c.assigned_worker && !c.file_closed && c.status !== 'closed');

  // Split by assessment status
  const assessmentPending = unassignedClients.filter(c => c.status !== 'pending');
  const assessmentComplete = unassignedClients.filter(c => c.status === 'pending');

  const workerNames = [...new Set(clients.map(c => c.assigned_worker_name).filter(Boolean))];

  const displayedPending = applyFiltersAndSort(assessmentPending, search, filters, sortKey);
  const displayedComplete = applyFiltersAndSort(assessmentComplete, search, filters, sortKey);

  const findDuplicates = (data) => {
    return clients.filter(c => {
      if (editingClient && c.id === editingClient.id) return false;
      return (
        (data.email && c.email && data.email.toLowerCase() === c.email.toLowerCase()) ||
        (data.phone && c.phone && data.phone.replace(/\D/g, '') === c.phone.replace(/\D/g, '')) ||
        (data.compass_hsid && c.compass_hsid && data.compass_hsid === c.compass_hsid)
      );
    });
  };

  const handleSaveAttempt = (data) => {
    const found = findDuplicates(data);
    if (found.length > 0 && !editingClient) {
      setPendingData(data);
      setDuplicates(found);
    } else {
      doSave(data);
    }
  };

  const doSave = async (data) => {
    if (editingClient) {
      const updated = await base44.entities.Client.update(editingClient.id, data);
      setClients(prev => prev.map(c => c.id === updated.id ? updated : c));
    } else {
      const withDate = { ...data, intake_date: new Date().toISOString().split('T')[0] };
      const created = await base44.entities.Client.create(withDate);
      setClients(prev => [created, ...prev]);
      const t = taskNewClient(created);
      await createCompassTask({ client_id: created.id, ...t });
    }
    setShowForm(false);
    setEditingClient(null);
    setPendingData(null);
    setDuplicates([]);
  };

  const handleAssign = async () => {
    const worker = staffList.find(s => s.id === selectedWorker);
    if (!worker) return;
    setAssigning(true);
    try {
      await base44.entities.Client.update(assignClientId, {
        assigned_worker: worker.email,
        assigned_worker_name: worker.name,
        status: 'active',
      });
      setClients(prev => prev.map(c => c.id === assignClientId
        ? { ...c, assigned_worker: worker.email, assigned_worker_name: worker.name, status: 'active' }
        : c));
      toast.success(`Assigned to ${worker.name}`);
      setAssignClientId(null);
      setSelectedWorker('');
    } catch (err) {
      toast.error('Failed to assign client');
    }
    setAssigning(false);
  };

  const handleReject = async (clientId) => {
    const c = clients.find(x => x.id === clientId);
    if (!confirm(`Reject ${c?.first_name} ${c?.last_name} from the program?`)) return;
    try {
      await base44.entities.Client.update(clientId, {
        service_type: 'not_eligible',
        status: 'closed',
      });
      setClients(prev => prev.map(c => c.id === clientId
        ? { ...c, service_type: 'not_eligible', status: 'closed' }
        : c));
      toast.success('Client removed from program');
    } catch (err) {
      toast.error('Failed to update client');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin" />
      </div>
    );
  }

  const assignClient = clients.find(c => c.id === assignClientId);

  return (
    <div className="min-h-screen bg-background">
      {/* Page Header */}
      <header className="bg-white border-b border-slate-200 px-4 py-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-800">Intake</h1>
          <p className="text-sm text-slate-500">
            {assessmentPending.length} awaiting assessment · {assessmentComplete.length} awaiting assignment · Welcome, {user?.full_name}
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Button variant="outline" size="sm" onClick={() => navigate('/pathways/master')}>Master List</Button>
          <Button variant="outline" size="sm" onClick={() => navigate('/pathways/reports')}>Reports</Button>
          {!showForm && (
            <Button onClick={() => { setEditingClient(null); setShowForm(true); }} className="gap-2">
              <PlusCircle className="w-4 h-4" /> New Client
            </Button>
          )}
          <Button variant="ghost" size="icon" onClick={() => base44.auth.logout('/login')}>
            <LogOut className="w-4 h-4" />
          </Button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6">
        {showForm ? (
          <IntakeForm
            client={editingClient}
            onSave={handleSaveAttempt}
            onCancel={() => { setShowForm(false); setEditingClient(null); }}
          />
        ) : (
          <>
            <ClientListControls
              search={search} onSearch={setSearch}
              filters={filters} onFilters={setFilters}
              sortKey={sortKey} onSort={setSortKey}
              workers={workerNames}
            />

            {/* Section 1: Awaiting Assessment */}
            <div className="mb-8">
              <div className="flex items-center gap-2 mb-3">
                <ClipboardCheck className="w-5 h-5 text-blue-600" />
                <h2 className="text-lg font-bold text-slate-800">New Intake — Awaiting Assessment</h2>
                <span className="text-sm text-slate-400">({assessmentPending.length})</span>
              </div>
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
                      {displayedPending.map(c => (
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
                      {displayedPending.length === 0 && (
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
            </div>

            {/* Section 2: Assessment Complete — Awaiting Assignment */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <UserCheck className="w-5 h-5 text-green-600" />
                <h2 className="text-lg font-bold text-slate-800">Assessment Complete — Awaiting Assignment</h2>
                <span className="text-sm text-slate-400">({assessmentComplete.length})</span>
              </div>
              <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-slate-50 border-b border-slate-200">
                      <tr>
                        <th className="text-left px-3 py-3 font-semibold text-slate-600">Name</th>
                        <th className="text-left px-3 py-3 font-semibold text-slate-600">HSID#</th>
                        <th className="text-left px-3 py-3 font-semibold text-slate-600">Phone</th>
                        <th className="text-left px-3 py-3 font-semibold text-slate-600">Intake Date</th>
                        <th className="px-3 py-3" />
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {displayedComplete.map(c => (
                        <tr key={c.id} className="hover:bg-slate-50 transition-colors">
                          <td className="px-3 py-2.5 font-medium text-slate-800">
                            {c.first_name} {c.last_name}
                          </td>
                          <td className="px-3 py-2.5 text-slate-600">{c.compass_hsid || '—'}</td>
                          <td className="px-3 py-2.5 text-slate-600">{c.phone || '—'}</td>
                          <td className="px-3 py-2.5 text-slate-500">
                            {c.intake_date ? format(new Date(c.intake_date), 'MMM d, yyyy') : '—'}
                          </td>
                          <td className="px-3 py-2.5">
                            <div className="flex items-center gap-1.5">
                              <Link to={`/pathways/assessment/${c.id}`}>
                                <Button variant="ghost" size="sm">Review</Button>
                              </Link>
                              <Button
                                size="sm"
                                className="gap-1"
                                onClick={() => { setAssignClientId(c.id); setSelectedWorker(''); }}
                              >
                                <UserCheck className="w-3.5 h-3.5" />
                                Assign
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                onClick={() => handleReject(c.id)}
                              >
                                <XCircle className="w-3.5 h-3.5" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                      {displayedComplete.length === 0 && (
                        <tr>
                          <td colSpan={5} className="text-center py-10 text-slate-400">
                            No clients awaiting assignment.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </>
        )}
      </main>

      {/* Duplicate warning dialog */}
      {duplicates.length > 0 && pendingData && (
        <DuplicateWarningDialog
          duplicates={duplicates}
          onConfirm={() => doSave(pendingData)}
          onCancel={() => { setDuplicates([]); setPendingData(null); }}
        />
      )}

      {/* Assignment dialog */}
      <Dialog open={!!assignClientId} onOpenChange={(open) => { if (!open) { setAssignClientId(null); setSelectedWorker(''); } }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Assign to Career Counsellor</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <p className="text-sm text-slate-500">
              Assign <span className="font-semibold text-slate-700">{assignClient?.first_name} {assignClient?.last_name}</span> to a career counsellor. The client will appear on their dashboard and the master list.
            </p>
            <Select value={selectedWorker} onValueChange={setSelectedWorker}>
              <SelectTrigger><SelectValue placeholder="Select career counsellor..." /></SelectTrigger>
              <SelectContent>
                {staffList.map(s => (
                  <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {staffList.length === 0 && (
              <p className="text-sm text-amber-600">No career counsellors found. Add staff in the Master List.</p>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setAssignClientId(null); setSelectedWorker(''); }}>Cancel</Button>
            <Button onClick={handleAssign} disabled={!selectedWorker || assigning}>
              {assigning ? 'Assigning...' : 'Assign Client'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}