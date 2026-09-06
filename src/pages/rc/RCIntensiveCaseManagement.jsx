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
import CaseObjectivesTab from '@/components/rc/intensive/CaseObjectivesTab';
import CaseOverviewTab from '@/components/rc/intensive/CaseOverviewTab';
import CaseHistoryTab from '@/components/rc/intensive/CaseHistoryTab';
import CaseDocumentsTab from '@/components/rc/intensive/CaseDocumentsTab';
import { buildDefaultStages, CASE_STAGES } from '@/components/rc/intensive/caseConstants';

export default function RCIntensiveCaseManagement() {
  const location = useLocation();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [selectedId, setSelectedId] = useState(null);
  const [draft, setDraft] = useState(null);
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [selectedStage, setSelectedStage] = useState('main');
  const [mainTab, setMainTab] = useState('case-management');

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
    setDraft(selectedCase
      ? { ...selectedCase, stages: selectedCase.stages?.length ? selectedCase.stages : buildDefaultStages() }
      : null);
    setDirty(false);
    setSelectedStage('main');
    setMainTab('case-management');
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
        tasks: [], risk_factors: [], objectives: [], history_log: [], documents: [],
      });
      queryClient.invalidateQueries({ queryKey: ['intensive-cases'] });
      toast({ title: 'Case management workflow started' });
    } catch (err) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    }
  };

  const save = async () => {
    setSaving(true);
    try {
      await base44.entities.IntensiveCase.update(draft.id, draft);
      queryClient.invalidateQueries({ queryKey: ['intensive-cases'] });
      setDirty(false);
      toast({ title: 'Case workflow saved' });
    } catch (err) {
      toast({ title: 'Error saving', description: err.message, variant: 'destructive' });
    }
    setSaving(false);
  };

  const handleSidebarSelect = (key) => {
    setSelectedStage(key);
    setMainTab('case-management');
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
        <p className="text-muted-foreground text-sm mt-1">Building Resilient Caregivers workflow for Intensive Services clients — stages, tasks, risk factors, and objectives.</p>
      </div>

      {isLoading ? <div className="text-center py-8 text-muted-foreground">Loading...</div> : clients.length === 0 ? (
        <Card><CardContent className="p-8 text-center text-muted-foreground">No Intensive Services clients yet. Set a client's Service Category to Intensive Services on their profile to begin.</CardContent></Card>
      ) : (
        <div className="grid lg:grid-cols-[240px_1fr] gap-4 items-start">
          <StageDetailSidebar
            stages={draft?.stages || []}
            currentStage={draft?.current_stage}
            selectedKey={selectedStage}
            onSelect={handleSidebarSelect}
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
                <Select value={selectedId || undefined} onValueChange={setSelectedId}>
                  <SelectTrigger className="w-56"><SelectValue placeholder="Switch client" /></SelectTrigger>
                  <SelectContent>
                    {clients.map(c => (
                      <SelectItem key={c.id} value={c.id}>{c.first_name} {c.last_name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button size="sm" onClick={save} disabled={!draft || !dirty || saving}>
                  <Save className="h-4 w-4" /> {saving ? 'Saving...' : dirty ? 'Save Changes' : 'Saved'}
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
                <TabsList>
                  <TabsTrigger value="overview">Client Overview</TabsTrigger>
                  <TabsTrigger value="case-management">Case Management</TabsTrigger>
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

                <TabsContent value="case-management" className="mt-4">
                  {selectedStage === 'main' ? (
                    <div className="space-y-4">
                      <div>
                        <p className="text-sm font-medium text-foreground mb-2">Workflow Stages</p>
                        <StageTracker stages={draft.stages || []} currentStage={draft.current_stage} onChange={updateStage} />
                      </div>
                      <Tabs defaultValue="tasks">
                        <TabsList>
                          <TabsTrigger value="tasks">Tasks ({(draft.tasks || []).length})</TabsTrigger>
                          <TabsTrigger value="risks">Risk Factors ({(draft.risk_factors || []).length})</TabsTrigger>
                          <TabsTrigger value="objectives">Objectives ({(draft.objectives || []).length})</TabsTrigger>
                        </TabsList>
                        <TabsContent value="tasks"><CaseTasksTab tasks={draft.tasks || []} onAdd={addTask} onUpdate={updateTask} onDelete={deleteTask} /></TabsContent>
                        <TabsContent value="risks"><CaseRisksTab risks={draft.risk_factors || []} onAdd={addRisk} onUpdate={updateRisk} onDelete={deleteRisk} /></TabsContent>
                        <TabsContent value="objectives"><CaseObjectivesTab objectives={draft.objectives || []} onAdd={addObjective} onUpdate={updateObjective} onDelete={deleteObjective} /></TabsContent>
                      </Tabs>
                    </div>
                  ) : (
                    <StageToolsPanel stageKey={selectedStage} draft={draft} onUpdateStage={updateStageByKey} onAddTask={addTask} onUpdateTask={updateTask} />
                  )}
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