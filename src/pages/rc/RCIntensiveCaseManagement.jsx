import React, { useEffect, useState } from 'react';
import { useLocation, Link } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { ClipboardList, Save } from 'lucide-react';
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
import { buildDefaultStages, CASE_STAGES, migrateCase, today } from '@/components/rc/intensive/caseConstants';

export default function RCIntensiveCaseManagement() {
  const location = useLocation();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [selectedId, setSelectedId] = useState(null);
  const [draft, setDraft] = useState(null);
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [selectedStage, setSelectedStage] = useState('main');
  const [mainTab, setMainTab] = useState('workflow');

  const { data: clients = [], isLoading } = useQuery({
    queryKey: ['rc-clients-intensive'],
    queryFn: () => base44.entities.RCClient.filter({ service_category: 'intensive_services' }, 'last_name', 200),
  });
  const { data: cases = [] } = useQuery({
    queryKey: ['intensive-cases'],
    queryFn: () => base44.entities.IntensiveCase.list(),
  });
  const { data: me } = useQuery({ queryKey: ['me'], queryFn: () => base44.auth.me() });

  useEffect(() => {
    const clientParam = new URLSearchParams(location.search).get('client');
    if (clientParam) { setSelectedId(clientParam); return; }
    if (!selectedId && clients.length > 0) setSelectedId(clients[0].id);
  }, [location.search, clients, selectedId]);

  const selectedCase = cases.find(c => c.client_id === selectedId);
  const selectedClient = clients.find(c => c.id === selectedId);

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

  const handleSidebarSelect = (key) => {
    setSelectedStage(key);
    setMainTab('workflow');
  };

  const progress = (c) => {
    if (!c) return 0;
    const done = (c.stages || []).filter(s => s.status === 'complete').length;
    return CASE_STAGES.length ? Math.round((done / CASE_STAGES.length) * 100) : 0;
  };

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-heading font-bold text-foreground">Intensive Services Case Management (FRN)</h1>
        <p className="text-muted-foreground text-sm mt-1">Building Resilient Caregivers — participant-centred intensive family support workflow: assessment, goals, service plan, case management, outcomes, transition and follow-up.</p>
      </div>

      {isLoading ? <div className="text-center py-8 text-muted-foreground">Loading...</div> : clients.length === 0 ? (
        <Card><CardContent className="p-8 text-center text-muted-foreground">No Intensive Services clients yet. Set a client's Service Category to Intensive Services on their profile to begin.</CardContent></Card>
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
                    {clients.map(c => (
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
            ) : (
              <Tabs value={mainTab} onValueChange={setMainTab}>
                <TabsList className="flex flex-wrap h-auto">
                  <TabsTrigger value="overview">Overview</TabsTrigger>
                  <TabsTrigger value="workflow">Workflow</TabsTrigger>
                  <TabsTrigger value="assessment">Assessment</TabsTrigger>
                  <TabsTrigger value="goals">Goals &amp; Plan</TabsTrigger>
                  <TabsTrigger value="activity">Activity &amp; Reviews</TabsTrigger>
                  <TabsTrigger value="outcomes">Outcomes</TabsTrigger>
                  <TabsTrigger value="transition">Transition</TabsTrigger>
                  <TabsTrigger value="history">History Log</TabsTrigger>
                  <TabsTrigger value="documents">Documents</TabsTrigger>
                </TabsList>

                <TabsContent value="overview" className="mt-4">
                  <CaseOverviewTab
                    client={selectedClient}
                    caseProgress={progress(draft)}
                    currentStage={draft.current_stage}
                  />
                </TabsContent>

                <TabsContent value="workflow" className="mt-4">
                  {selectedStage === 'main' ? (
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
                  ) : (
                    <StageToolsPanel
                      stageKey={selectedStage}
                      draft={draft}
                      onUpdateStage={updateStageByKey}
                      onAddTask={addTask}
                      onUpdateTask={updateTask}
                      onOpenTab={setMainTab}
                    />
                  )}
                </TabsContent>

                <TabsContent value="assessment" className="mt-4">
                  <CaseAssessmentTab
                    assessments={draft.assessments || []}
                    onChange={(list) => patchDraft(d => ({ ...d, assessments: list }))}
                    meName={me?.full_name}
                  />
                </TabsContent>

                <TabsContent value="goals" className="mt-4">
                  <div className="space-y-4">
                    <CaseGoalsTab
                      objectives={draft.objectives || []}
                      onAdd={addObjective}
                      onUpdate={updateObjective}
                      onDelete={deleteObjective}
                      meName={me?.full_name}
                    />
                    <CaseServicePlanTab plan={draft.service_plan || {}} onChange={updateServicePlan} />
                  </div>
                </TabsContent>

                <TabsContent value="activity" className="mt-4">
                  <CaseActivityTab
                    contacts={draft.contacts || []}
                    reviews={draft.reviews || []}
                    onAddContact={(r) => addRecord('contacts', r)}
                    onUpdateContact={(id, p) => updateRecord('contacts', id, p)}
                    onDeleteContact={(id) => deleteRecord('contacts', id)}
                    onAddReview={(r) => addRecord('reviews', r)}
                    onUpdateReview={(id, p) => updateRecord('reviews', id, p)}
                    onDeleteReview={(id) => deleteRecord('reviews', id)}
                    meName={me?.full_name}
                  />
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

                <TabsContent value="transition" className="mt-4">
                  <CaseTransitionTab
                    transition={draft.transition || {}}
                    followups={draft.followups || []}
                    onTransitionChange={updateTransition}
                    onAddFollowup={(r) => addRecord('followups', r)}
                    onUpdateFollowup={(id, p) => updateRecord('followups', id, p)}
                    onDeleteFollowup={(id) => deleteRecord('followups', id)}
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