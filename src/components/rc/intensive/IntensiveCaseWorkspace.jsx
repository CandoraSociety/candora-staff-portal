import React, { useEffect, useState } from 'react';
import { useLocation, Link } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { ArrowLeft, CalendarDays, ClipboardList, List, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';
import StatusBadge from '@/components/rc/StatusBadge';
import { CASE_STATUS_OPTIONS } from '@/lib/rcConstants';
import StageTracker from '@/components/rc/intensive/StageTracker';
import StageDetailSidebar from '@/components/rc/intensive/StageDetailSidebar';
import StageToolsPanel from '@/components/rc/intensive/StageToolsPanel';
import CaseTasksTab from '@/components/rc/intensive/CaseTasksTab';
import CaseRisksTab from '@/components/rc/intensive/CaseRisksTab';
import CaseOverviewTab from '@/components/rc/intensive/CaseOverviewTab';
import CaseHistoryTab from '@/components/rc/intensive/CaseHistoryTab';
import CaseDocumentsTab from '@/components/rc/intensive/CaseDocumentsTab';
import CaseDetailsCard from '@/components/rc/intensive/CaseDetailsCard';
import CaseAssessmentTab from '@/components/rc/intensive/CaseAssessmentTab';
import CaseGoalsTab from '@/components/rc/intensive/CaseGoalsTab';
import CaseServicePlanTab from '@/components/rc/intensive/CaseServicePlanTab';
import CaseActivityTab from '@/components/rc/intensive/CaseActivityTab';
import CaseOutcomesTab from '@/components/rc/intensive/CaseOutcomesTab';
import CaseTransitionTab from '@/components/rc/intensive/CaseTransitionTab';
import CaseWaitlistTab from '@/components/rc/intensive/CaseWaitlistTab';
import CaseClientList from '@/components/rc/intensive/CaseClientList';
import CaseCalendarTab from '@/components/rc/CaseCalendarTab';
import WorkerAppointmentsPanel from '@/components/rc/WorkerAppointmentsPanel';
import { buildDefaultStages, CASE_STAGES, migrateCase, today } from '@/components/rc/intensive/caseConstants';
import { matchesWorker } from '@/lib/rcCaseAccess';

// Intensive Services (FRN / Building Resilient Caregivers) workflow workspace —
// sidebar stage wizard, waitlist, assessments, goals, plan, activity and transition.
export default function IntensiveCaseWorkspace({ onlyMine = false }) {
  const location = useLocation();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [selectedId, setSelectedId] = useState(null);
  const [draft, setDraft] = useState(null);
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [selectedStage, setSelectedStage] = useState('main');
  const [mainTab, setMainTab] = useState('workflow');
  const [caseViewOpen, setCaseViewOpen] = useState(false);
  const [listView, setListView] = useState('list');

  const { data: clients = [], isLoading } = useQuery({
    queryKey: ['rc-clients-intensive'],
    queryFn: () => base44.entities.RCClient.filter({ service_category: 'intensive_services' }, 'last_name', 200),
  });
  const { data: cases = [] } = useQuery({
    queryKey: ['intensive-cases'],
    queryFn: () => base44.entities.IntensiveCase.list(),
  });
  const { data: me } = useQuery({ queryKey: ['me'], queryFn: () => base44.auth.me() });

  // "My Case Management" scope — only clients whose case or client record has
  // the signed-in worker's name on it.
  const visibleClients = onlyMine
    ? clients.filter(c => matchesWorker(c.assigned_worker, me) || cases.some(k => k.client_id === c.id && matchesWorker(k.assigned_worker, me)))
    : clients;

  useEffect(() => {
    const clientParam = new URLSearchParams(location.search).get('client');
    if (clientParam) { setSelectedId(clientParam); setCaseViewOpen(true); return; }
    if (!selectedId && visibleClients.length > 0) setSelectedId(visibleClients[0].id);
  }, [location.search, visibleClients, selectedId]);

  const selectedCase = cases.find(c => c.client_id === selectedId);
  const selectedClient = visibleClients.find(c => c.id === selectedId);

  useEffect(() => {
    setDraft(selectedCase ? migrateCase(selectedCase) : null);
    setDirty(false);
    setSelectedStage('main');
    setMainTab('workflow');
  }, [selectedCase?.id, selectedId]);

  const patchDraft = (fn) => { setDraft(prev => fn(prev)); setDirty(true); };

  const updateStage = (idx, patch) => patchDraft(d => {
    const stages = [...(d.stages || [])];
    stages[idx] = { ...stages[idx], ...patch };
    return { ...d, stages, current_stage: patch.status === 'in_progress' ? stages[idx].key : d.current_stage };
  });
  const updateStageByKey = (key, patch) => patchDraft(d => ({
    ...d,
    stages: (d.stages || []).map(s => s.key === key ? { ...s, ...patch } : s),
    current_stage: patch.status === 'in_progress' ? key : d.current_stage,
  }));

  const addTask = (task) => patchDraft(d => ({ ...d, tasks: [...(d.tasks || []), task] }));
  const updateTask = (id, patch) => patchDraft(d => ({ ...d, tasks: (d.tasks || []).map(t => t.id === id ? { ...t, ...patch } : t) }));
  const deleteTask = (id) => patchDraft(d => ({ ...d, tasks: (d.tasks || []).filter(t => t.id !== id) }));
  const addRisk = (risk) => patchDraft(d => ({ ...d, risk_factors: [...(d.risk_factors || []), risk] }));
  const updateRisk = (id, patch) => patchDraft(d => ({ ...d, risk_factors: (d.risk_factors || []).map(r => r.id === id ? { ...r, ...patch } : r) }));
  const deleteRisk = (id) => patchDraft(d => ({ ...d, risk_factors: (d.risk_factors || []).filter(r => r.id !== id) }));
  const addObjective = (obj) => patchDraft(d => ({ ...d, objectives: [...(d.objectives || []), obj] }));
  const updateObjective = (id, patch) => patchDraft(d => ({ ...d, objectives: (d.objectives || []).map(o => o.id === id ? { ...o, ...patch } : o) }));
  const deleteObjective = (id) => patchDraft(d => ({ ...d, objectives: (d.objectives || []).filter(o => o.id !== id) }));
  const addRecord = (field, rec) => patchDraft(d => ({ ...d, [field]: [...(d[field] || []), rec] }));
  const updateRecord = (field, id, patch) => patchDraft(d => ({ ...d, [field]: (d[field] || []).map(r => r.id === id ? { ...r, ...patch } : r) }));
  const deleteRecord = (field, id) => patchDraft(d => ({ ...d, [field]: (d[field] || []).filter(r => r.id !== id) }));
  const updateServicePlan = (patch) => patchDraft(d => ({ ...d, service_plan: { ...(d.service_plan || {}), ...patch } }));
  const updateTransition = (patch) => patchDraft(d => ({ ...d, transition: { ...(d.transition || {}), ...patch } }));
  const addHistoryEntry = (entry) => patchDraft(d => ({ ...d, history_log: [...(d.history_log || []), entry] }));
  const addDocument = (doc) => patchDraft(d => ({ ...d, documents: [...(d.documents || []), doc] }));
  const deleteDocument = (id) => patchDraft(d => ({ ...d, documents: (d.documents || []).filter(x => x.id !== id) }));

  const startCase = async () => {
    try {
      await base44.entities.IntensiveCase.create({
        client_id: selectedId,
        client_name: `${selectedClient?.first_name || ''} ${selectedClient?.last_name || ''}`.trim(),
        current_stage: CASE_STAGES[0].key,
        stages: buildDefaultStages(),
        assigned_worker: me?.full_name || '',
        service_start_date: today(),
        case_status: 'active',
        tasks: [], risk_factors: [], objectives: [], history_log: [], documents: [],
        assessments: [], contacts: [], reviews: [], outcomes: [], followups: [],
        service_plan: {}, transition: {},
      });
      queryClient.invalidateQueries({ queryKey: ['intensive-cases'] });
      toast({ title: 'Case management workflow started' });
    } catch (err) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    }
  };

  const addToWaitlist = async () => {
    if (!selectedClient || selectedClient.service_category !== 'intensive_services') return;
    try {
      const existing = cases.find(c => c.client_id === selectedId);
      if (existing) {
        await base44.entities.IntensiveCase.update(existing.id, {
          case_status: 'waitlisted',
          waitlist_date: existing.waitlist_date || today(),
          waitlist_removed_date: null,
        });
      } else {
        await base44.entities.IntensiveCase.create({
          client_id: selectedId,
          client_name: `${selectedClient.first_name || ''} ${selectedClient.last_name || ''}`.trim(),
          current_stage: CASE_STAGES[0].key,
          stages: buildDefaultStages(),
          case_status: 'waitlisted',
          waitlist_date: today(),
          tasks: [], risk_factors: [], objectives: [], history_log: [], documents: [],
          assessments: [], contacts: [], reviews: [], outcomes: [], followups: [],
          service_plan: {}, transition: {},
        });
      }
      queryClient.invalidateQueries({ queryKey: ['intensive-cases'] });
      toast({ title: 'Added to the Intensive Services waitlist' });
    } catch (err) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    }
  };

  // Updates any case in the list — routes through the draft (autosave) when it's the
  // currently open case, otherwise updates the record directly and refreshes.
  const updateCaseById = (id, patch) => {
    if (draft?.id === id) { patchDraft(d => ({ ...d, ...patch })); return; }
    base44.entities.IntensiveCase.update(id, patch)
      .then(() => queryClient.invalidateQueries({ queryKey: ['intensive-cases'] }))
      .catch(err => toast({ title: 'Error updating case', description: err.message, variant: 'destructive' }));
  };

  const save = async (silent = false) => {
    if (!draft?.id || saving) return;
    setSaving(true);
    try {
      await base44.entities.IntensiveCase.update(draft.id, draft);
      setDirty(false);
      if (!silent) {
        queryClient.invalidateQueries({ queryKey: ['intensive-cases'] });
        toast({ title: 'Case workflow saved' });
      }
    } catch (err) {
      toast({ title: 'Error saving', description: err.message, variant: 'destructive' });
    }
    setSaving(false);
  };

  // Autosave drafts ~2.5s after the last change; the Save button remains for explicit saves.
  useEffect(() => {
    if (!dirty || !draft?.id) return;
    const t = setTimeout(() => save(true), 2500);
    return () => clearTimeout(t);
  }, [draft, dirty]);

  const handleSidebarSelect = (key) => setSelectedStage(key);

  const progress = (c) => {
    if (!c) return 0;
    const done = (c.stages || []).filter(s => s.status === 'complete').length;
    return CASE_STAGES.length ? Math.round((done / CASE_STAGES.length) * 100) : 0;
  };

  // The sidebar stage IS the wizard — each stage shows its working form in the main area.
  const stageWork = draft ? {
    assessment: <CaseAssessmentTab assessments={draft.assessments || []} onChange={(list) => patchDraft(d => ({ ...d, assessments: list }))} meName={me?.full_name} />,
    goal_setting: <CaseGoalsTab objectives={draft.objectives || []} onAdd={addObjective} onUpdate={updateObjective} onDelete={deleteObjective} meName={me?.full_name} />,
    service_plan: <CaseServicePlanTab plan={draft.service_plan || {}} onChange={updateServicePlan} />,
    active_case_management: <CaseActivityTab focus="contacts" contacts={draft.contacts || []} reviews={draft.reviews || []}
      onAddContact={(r) => addRecord('contacts', r)} onUpdateContact={(id, p) => updateRecord('contacts', id, p)} onDeleteContact={(id) => deleteRecord('contacts', id)}
      onAddReview={(r) => addRecord('reviews', r)} onUpdateReview={(id, p) => updateRecord('reviews', id, p)} onDeleteReview={(id) => deleteRecord('reviews', id)}
      meName={me?.full_name} />,
    review_reassessment: <CaseActivityTab focus="reviews" contacts={draft.contacts || []} reviews={draft.reviews || []}
      onAddContact={(r) => addRecord('contacts', r)} onUpdateContact={(id, p) => updateRecord('contacts', id, p)} onDeleteContact={(id) => deleteRecord('contacts', id)}
      onAddReview={(r) => addRecord('reviews', r)} onUpdateReview={(id, p) => updateRecord('reviews', id, p)} onDeleteReview={(id) => deleteRecord('reviews', id)}
      meName={me?.full_name} />,
    transition_planning: <CaseTransitionTab focus="plan" transition={draft.transition || {}} followups={draft.followups || []} onTransitionChange={updateTransition}
      onAddFollowup={(r) => addRecord('followups', r)} onUpdateFollowup={(id, p) => updateRecord('followups', id, p)} onDeleteFollowup={(id) => deleteRecord('followups', id)}
      meName={me?.full_name} />,
    closure: <CaseTransitionTab focus="closure" transition={draft.transition || {}} followups={draft.followups || []} onTransitionChange={updateTransition}
      onAddFollowup={(r) => addRecord('followups', r)} onUpdateFollowup={(id, p) => updateRecord('followups', id, p)} onDeleteFollowup={(id) => deleteRecord('followups', id)}
      meName={me?.full_name} />,
    post_service_followup: <CaseTransitionTab focus="followups" transition={draft.transition || {}} followups={draft.followups || []} onTransitionChange={updateTransition}
      onAddFollowup={(r) => addRecord('followups', r)} onUpdateFollowup={(id, p) => updateRecord('followups', id, p)} onDeleteFollowup={(id) => deleteRecord('followups', id)}
      meName={me?.full_name} />,
  } : {};

  return (
    <div>
      {isLoading ? <div className="text-center py-8 text-muted-foreground">Loading...</div> : visibleClients.length === 0 ? (
        <Card><CardContent className="p-8 text-center text-muted-foreground">{onlyMine ? 'No Intensive Services clients assigned to you.' : "No Intensive Services clients yet. Set a client's Service Category to Intensive Services on their profile to begin."}</CardContent></Card>
      ) : !caseViewOpen ? (
        <div className="space-y-4">
          <div className="flex gap-1">
            <Button variant={listView === 'list' ? 'default' : 'outline'} size="sm" onClick={() => setListView('list')}><List className="h-4 w-4" /> Clients</Button>
            <Button variant={listView === 'calendar' ? 'default' : 'outline'} size="sm" onClick={() => setListView('calendar')}><CalendarDays className="h-4 w-4" /> Calendar</Button>
          </div>
          {listView === 'calendar' ? (
            <WorkerAppointmentsPanel />
          ) : (
            <CaseClientList
              clients={clients}
              cases={cases}
              onOpenClient={(id) => { setSelectedId(id); setCaseViewOpen(true); }}
            />
          )}
        </div>
      ) : (
        <div className="grid lg:grid-cols-[260px_1fr] gap-4 items-start">
          <StageDetailSidebar
            stages={draft?.stages || []}
            currentStage={draft?.current_stage}
            selectedKey={selectedStage}
            onSelect={handleSidebarSelect}
            caseData={draft}
            taskCountFor={(key) => (draft?.tasks || []).filter(t => t.stage_key === key && t.status !== 'done').length}
          />

          <div className="min-w-0">
            <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
              <div className="flex items-center gap-2.5 min-w-0">
                <Button variant="ghost" size="sm" onClick={() => setCaseViewOpen(false)} className="gap-1 px-2 shrink-0">
                  <ArrowLeft className="h-4 w-4" /> All Clients
                </Button>
                <h2 className="text-xl font-heading font-bold text-foreground truncate">
                  {selectedClient ? `${selectedClient.first_name} ${selectedClient.last_name}` : 'Select a client'}
                </h2>
                {selectedClient && <StatusBadge status={selectedClient.case_status} options={CASE_STATUS_OPTIONS} />}
                {selectedClient && <Link to={`/rc/clients/${selectedClient.id}`} className="text-xs text-primary hover:underline shrink-0">View profile</Link>}
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] text-muted-foreground hidden sm:block">{saving ? 'Saving...' : dirty ? 'Unsaved changes — autosaving' : 'All changes saved'}</span>
                <Select value={selectedId || undefined} onValueChange={setSelectedId}>
                  <SelectTrigger className="w-56"><SelectValue placeholder="Switch client" /></SelectTrigger>
                  <SelectContent>
                    {visibleClients.map(c => (
                      <SelectItem key={c.id} value={c.id}>{c.first_name} {c.last_name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button size="sm" onClick={() => save(false)} disabled={!draft || saving}>
                  <Save className="h-4 w-4" /> Save
                </Button>
              </div>
            </div>

            {!draft ? (
              <Card><CardContent className="p-8 text-center space-y-3">
                <p className="text-sm text-muted-foreground">{selectedClient ? `${selectedClient.first_name} ${selectedClient.last_name}` : 'This client'} has no case management workflow yet.</p>
                <Button onClick={startCase}><ClipboardList className="h-4 w-4" /> Start Case Management</Button>
              </CardContent></Card>
            ) : selectedStage !== 'main' ? (
              <div className="space-y-4">
                <StageToolsPanel
                  stageKey={selectedStage}
                  draft={draft}
                  onUpdateStage={updateStageByKey}
                  onAddTask={addTask}
                  onUpdateTask={updateTask}
                />
                {stageWork[selectedStage]}
              </div>
            ) : (
              <Tabs value={mainTab} onValueChange={setMainTab}>
                <TabsList className="flex flex-wrap h-auto">
                  <TabsTrigger value="workflow">Workflow Overview</TabsTrigger>
                  <TabsTrigger value="calendar">Calendar</TabsTrigger>
                  <TabsTrigger value="waitlist">Waitlist ({cases.filter(c => c.case_status === 'waitlisted').length})</TabsTrigger>
                  <TabsTrigger value="overview">Client Overview</TabsTrigger>
                  <TabsTrigger value="outcomes">Outcomes</TabsTrigger>
                  <TabsTrigger value="history">History Log</TabsTrigger>
                  <TabsTrigger value="documents">Documents</TabsTrigger>
                </TabsList>

                <TabsContent value="workflow" className="mt-4">
                  <div className="space-y-4">
                    <CaseDetailsCard draft={draft} onChange={(patch) => patchDraft(d => ({ ...d, ...patch }))} />
                    <div>
                      <p className="text-sm font-medium text-foreground mb-2">Workflow Stages</p>
                      <StageTracker stages={draft.stages || []} currentStage={draft.current_stage} onChange={updateStage} />
                    </div>
                    <Tabs defaultValue="tasks">
                      <TabsList>
                        <TabsTrigger value="tasks">Tasks ({(draft.tasks || []).length})</TabsTrigger>
                        <TabsTrigger value="risks">Risk Factors ({(draft.risk_factors || []).length})</TabsTrigger>
                      </TabsList>
                      <TabsContent value="tasks"><CaseTasksTab tasks={draft.tasks || []} onAdd={addTask} onUpdate={updateTask} onDelete={deleteTask} /></TabsContent>
                      <TabsContent value="risks"><CaseRisksTab risks={draft.risk_factors || []} onAdd={addRisk} onUpdate={updateRisk} onDelete={deleteRisk} /></TabsContent>
                    </Tabs>
                  </div>
                </TabsContent>

                <TabsContent value="calendar" className="mt-4">
                  <CaseCalendarTab
                    clientId={selectedId}
                    clientName={selectedClient ? `${selectedClient.first_name} ${selectedClient.last_name}` : ''}
                    clientEmail={selectedClient?.email}
                    draft={draft}
                  />
                </TabsContent>

                <TabsContent value="waitlist" className="mt-4">
                  <CaseWaitlistTab
                    cases={cases}
                    clients={clients}
                    selectedClientId={selectedId}
                    canAddToWaitlist={!!selectedClient && selectedClient.service_category === 'intensive_services' && selectedCase?.case_status !== 'waitlisted'}
                    onAddToWaitlist={addToWaitlist}
                    onUpdate={updateCaseById}
                    onOpenClient={(id) => setSelectedId(id)}
                  />
                </TabsContent>

                <TabsContent value="overview" className="mt-4">
                  <CaseOverviewTab client={selectedClient} caseProgress={progress(draft)} currentStage={draft.current_stage} />
                </TabsContent>

                <TabsContent value="outcomes" className="mt-4">
                  <CaseOutcomesTab
                    outcomes={draft.outcomes || []}
                    onAdd={(r) => addRecord('outcomes', r)}
                    onUpdate={(id, p) => updateRecord('outcomes', id, p)}
                    onDelete={(id) => deleteRecord('outcomes', id)}
                    meName={me?.full_name}
                  />
                </TabsContent>

                <TabsContent value="history" className="mt-4">
                  <CaseHistoryTab entries={draft.history_log || []} onAdd={addHistoryEntry} meName={me?.full_name} />
                </TabsContent>

                <TabsContent value="documents" className="mt-4">
                  <CaseDocumentsTab documents={draft.documents || []} onAdd={addDocument} onDelete={deleteDocument} meName={me?.full_name} />
                </TabsContent>
              </Tabs>
            )}
          </div>
        </div>
      )}
    </div>
  );
}