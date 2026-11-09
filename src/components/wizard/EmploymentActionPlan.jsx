import { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { CheckCircle2, ChevronRight, Plus, RotateCcw, X } from 'lucide-react';
import ResetActionPlanDialog from '@/components/wizard/ResetActionPlanDialog';
import { toast } from 'sonner';
import { base44 } from '@/api/base44Client';
import { createCompassTask, taskActionPlanCreated } from '@/lib/compassTasks';
import { ACTION_PLAN_ITEMS } from '@/lib/actionPlanItems';

// ─── Action Plan Options ────────────────────────────────────────────────────

const ALL_ITEMS = ACTION_PLAN_ITEMS;

const DEA_ACTIVITY_TYPES = [
  'Job Search Workshop',
  'Resume Writing Workshop',
  'Cover Letter Workshop',
  'Interview Skills Workshop',
  'Job Club Workshop',
  'Workplace Readiness Workshop',
  'Financial Literacy Workshop',
  'Skills Assessment',
  'Exposure Course',
  'Employment Supports',
  'One on One Career Counselling',
  'Job Applications',
  'Networking',
  'Other',
];

const CATEGORIES = ['Workshops', 'Programs', 'Placement/Training', 'Job Search', 'Supports', 'Other'];

// ─── Main Component ─────────────────────────────────────────────────────────

export default function EmploymentActionPlan({ client, onSave, onComplete, onClientUpdate }) {
  const isPathways = client?.service_type === 'pathways';
  const isDEA = client?.service_type === 'direct_to_employment';
  const isSubmitted = !!client?.action_plan_submitted;

  const [saving, setSaving] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [showResetDialog, setShowResetDialog] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [pendingAndComplete, setPendingAndComplete] = useState(false);

  // Pathways state
  const defaultSelected = useMemo(() => {
    if (client?.sdp_items?.length > 0) return client.sdp_items;
    return [];
  }, []);
  const [selectedItems, setSelectedItems] = useState(defaultSelected);
  const [itemDetails, setItemDetails] = useState(client?.sdp_item_details || {});
  // Several "other" activities can be planned. An older single description is
  // folded in as the first entry so existing plans open unchanged.
  const [otherItems, setOtherItems] = useState(() => {
    const stored = client?.sdp_item_details?.other_items;
    if (Array.isArray(stored) && stored.length) return stored;
    return client?.sdp_other_desc ? [{ description: client.sdp_other_desc }] : [];
  });
  const [sdpNotes, setSdpNotes] = useState(client?.sdp_notes || '');
  // Program start date — defaults to today on first action plan creation, editable thereafter
  const [programStartDate, setProgramStartDate] = useState(
    client?.service_start_date || new Date().toISOString().split('T')[0]
  );

  // DEA state
  const [deaActivities, setDeaActivities] = useState(
    client?.dea_activities?.length > 0
      ? client.dea_activities
      : [{ id: '1', type: '', notes: '' }, { id: '2', type: '', notes: '' }, { id: '3', type: '', notes: '' }]
  );

  const availableItems = ALL_ITEMS.filter(item => {
    if (isDEA && item.notDEA) return false;
    if (isDEA && item.pathwaysOnly) return false;
    if (!isPathways && item.pathwaysOnly) return false;
    return true;
  });

  // Detect if action items have changed from saved state
  const itemsChanged = isDEA
    ? JSON.stringify(deaActivities.filter(a => a.type).map(a => a.type).sort()) !==
      JSON.stringify((client?.dea_activities || []).filter(a => a.type).map(a => a.type).sort())
    : JSON.stringify([...selectedItems].sort()) !== JSON.stringify([...(client?.sdp_items || [])].sort());

  const toggleItem = (key) => {
    if (key === 'other' && !selectedItems.includes('other') && otherItems.length === 0) {
      setOtherItems([{ description: '' }]);
    }
    setSelectedItems(prev => prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]);
  };

  const updateOther = (idx, patch) =>
    setOtherItems(prev => prev.map((o, i) => i === idx ? { ...o, ...patch } : o));

  const addDeaActivity = () =>
    setDeaActivities(prev => [...prev, { id: Date.now().toString(), type: '', notes: '' }]);

  const updateDea = (id, field, val) =>
    setDeaActivities(prev => prev.map(a => a.id === id ? { ...a, [field]: val } : a));

  const removeDea = (id) =>
    setDeaActivities(prev => prev.filter(a => a.id !== id));

  const deaEndDate = useMemo(() => {
    if (!programStartDate) return 'TBD';
    const d = new Date(programStartDate);
    d.setDate(d.getDate() + 14);
    return d.toLocaleDateString('en-CA');
  }, [programStartDate]);

  const handleSave = async (andComplete = false) => {
    setSaving(true);
    try {
      const details = { ...itemDetails };
      if (selectedItems.includes('other')) {
        details.other_items = otherItems.filter(o => (o.description || '').trim() || o.timeline_end);
      } else {
        delete details.other_items;
      }
      const updates = isDEA
        ? { dea_activities: deaActivities, sdp_notes: sdpNotes, action_plan_submitted: true, service_start_date: programStartDate }
        : { sdp_items: selectedItems, sdp_item_details: details, sdp_other_desc: details.other_items?.[0]?.description || '', sdp_notes: sdpNotes, action_plan_submitted: true, service_start_date: programStartDate };

      const updatedClient = await onSave(updates);

      if (!isSubmitted) {
        const task = taskActionPlanCreated(updatedClient || { ...client, ...updates });
        await createCompassTask({
          client_id: client.id,
          client_name: `${client.first_name} ${client.last_name}`,
          compass_hsid: client.compass_hsid || '',
          assigned_worker: client.assigned_worker,
          assigned_worker_name: client.assigned_worker_name,
          ...task,
        });
      }

      toast.success(isSubmitted ? 'Action plan updated' : 'Employment action plan created');
      if (andComplete) onComplete?.();
    } catch (error) {
      toast.error('Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveClick = (andComplete = false) => {
    if (isSubmitted && itemsChanged) {
      setPendingAndComplete(andComplete);
      setShowConfirmDialog(true);
      return;
    }
    handleSave(andComplete);
  };

  const handleConfirmSave = () => {
    setShowConfirmDialog(false);
    handleSave(pendingAndComplete);
    setPendingAndComplete(false);
  };

  // Reverses the saved plan so the client returns to "Not Started".
  const handleReset = async () => {
    setResetting(true);
    try {
      await onSave({
        action_plan_submitted: false,
        sdp_items: [],
        sdp_item_details: {},
        sdp_other_desc: '',
        sdp_notes: '',
        dea_activities: [],
        // Moving back to Not Started means the program is no longer running
        // for this client — clear the start date and the in-progress status.
        program_status: null,
        service_start_date: null,
      });
      setSelectedItems([]);
      setItemDetails({});
      setOtherItems([]);
      setSdpNotes('');
      setDeaActivities([{ id: '1', type: '', notes: '' }, { id: '2', type: '', notes: '' }, { id: '3', type: '', notes: '' }]);
      setShowResetDialog(false);
      toast.success('Action plan reset — client moved back to Not Started');
    } catch (error) {
      toast.error('Failed to reset action plan');
    } finally {
      setResetting(false);
    }
  };

  // ─── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6">
      {isSubmitted && (
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-green-600">
            <CheckCircle2 className="w-5 h-5" />
            <span className="font-semibold">Employment Action Plan Created</span>
            {itemsChanged && <span className="text-xs text-amber-600 ml-2">(unsaved changes)</span>}
          </div>
          <Button variant="outline" size="sm" className="text-destructive hover:text-destructive" onClick={() => setShowResetDialog(true)}>
            <RotateCcw className="w-3.5 h-3.5 mr-1" /> Reset Action Plan
          </Button>
        </div>
      )}

      {/* Intake Summary */}
      <Card data-tour="pw-plan-summary" className="border-blue-200 bg-blue-50/50">
        <CardHeader className="pb-2">
          <CardTitle className="text-xs font-semibold text-blue-800">Intake Summary (Auto-populated)</CardTitle>
        </CardHeader>
        <CardContent className="text-xs text-blue-900 grid grid-cols-2 gap-x-4 gap-y-1">
          <div><span className="font-medium">Employment Status:</span> {client?.employment_status || 'N/A'}</div>
          <div><span className="font-medium">CLB Level:</span> {client?.clb_level || 'N/A'}</div>
          <div><span className="font-medium">Service Stream:</span> {client?.service_type || 'N/A'}</div>
          <div><span className="font-medium">Career Objectives:</span> {client?.career_objectives || 'N/A'}</div>
          {client?.employment_history && <div className="col-span-2"><span className="font-medium">Employment History:</span> {client.employment_history}</div>}
          {client?.intake_notes && <div className="col-span-2"><span className="font-medium">Intake Notes:</span> {client.intake_notes}</div>}
          <div data-tour="pw-plan-start-date" className="col-span-2 flex items-center gap-2 pt-2 border-t border-blue-200">
            <Label className="text-xs font-medium whitespace-nowrap">Program Start Date</Label>
            <Input
              type="date"
              value={programStartDate}
              onChange={e => setProgramStartDate(e.target.value)}
              className="h-7 text-xs w-auto"
            />
            <span className="text-[10px] text-blue-700/70">Auto-set to today when the action plan is created — editable anytime.</span>
          </div>
        </CardContent>
      </Card>

      {/* DEA mode */}
      {isDEA && (
        <Card data-tour="pw-plan-items">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Employment Development Activities (EDA)</CardTitle>
            <div className="text-xs text-muted-foreground">Timeline: {programStartDate || 'TBD'} → {deaEndDate} (14-day program)</div>
          </CardHeader>
          <CardContent className="space-y-3">
            {deaActivities.map((act, idx) => (
              <div key={act.id} data-tour={`pw-plan-dea-${act.id}`} className="space-y-1">
                <div className="flex items-start gap-2">
                  <span className="text-xs text-muted-foreground mt-2 w-16 shrink-0">EDA {idx + 1}</span>
                  <Select value={act.type} onValueChange={v => updateDea(act.id, 'type', v)}>
                    <SelectTrigger className="w-48">
                      <SelectValue placeholder="Activity Type" />
                    </SelectTrigger>
                    <SelectContent>
                      {DEA_ACTIVITY_TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <Input value={act.notes} onChange={e => updateDea(act.id, 'notes', e.target.value)} placeholder="Notes..." className="flex-1 text-sm" />
                  {deaActivities.length > 3 && (
                    <button type="button" onClick={() => removeDea(act.id)} className="text-muted-foreground hover:text-destructive mt-2">
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
                {act.type && !(act.type === 'Job Club Workshop' && act.ongoing) && (
                  <div className="flex items-center gap-2 ml-18 pl-[72px]">
                    <Label className="text-xs text-muted-foreground whitespace-nowrap">Anticipated Completion:</Label>
                    <Input
                      type="date"
                      value={act.anticipated_end_date || ''}
                      onChange={e => updateDea(act.id, 'anticipated_end_date', e.target.value)}
                      className="h-7 text-xs w-auto"
                    />
                  </div>
                )}
                {act.type === 'Exposure Course' && (
                  <div className="pl-[72px]">
                    <Input
                      value={act.course_name || ''}
                      onChange={e => updateDea(act.id, 'course_name', e.target.value)}
                      className="text-sm max-w-md"
                      placeholder="Which exposure course? e.g. Food Safe Level 1..."
                    />
                  </div>
                )}
                {act.type === 'Job Club Workshop' && (
                  <div className="pl-[72px]">
                    <label className="flex items-center gap-2 text-xs text-muted-foreground cursor-pointer">
                      <input
                        type="checkbox"
                        className="accent-primary w-3.5 h-3.5"
                        checked={!!act.ongoing}
                        onChange={e => updateDea(act.id, 'ongoing', e.target.checked)}
                      />
                      Ongoing (no completion date)
                    </label>
                  </div>
                )}
              </div>
            ))}
            <Button type="button" variant="outline" size="sm" onClick={addDeaActivity}>
              <Plus className="w-3 h-3 mr-1" /> Add Activity
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Pathways/other mode — category checkboxes */}
      {!isDEA && (
        <div data-tour="pw-plan-items" className="space-y-4">
          {CATEGORIES.map(cat => {
            const catItems = availableItems.filter(i => i.category === cat);
            if (catItems.length === 0) return null;
            return (
              <Card key={cat} data-tour={`pw-plan-category-${cat}`}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">{cat}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {catItems.map(item => (
                    <div key={item.key}>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          data-tour={`pw-plan-item-${item.key}`}
                          className="accent-primary w-4 h-4"
                          checked={selectedItems.includes(item.key)}
                          onChange={() => toggleItem(item.key)}
                        />
                        <span className="text-sm">{item.label}</span>
                      </label>
                      {selectedItems.includes(item.key) && item.key !== 'other' && !(item.key === 'job_club_workshop' && itemDetails.job_club_workshop?.ongoing) && (
                        <div data-tour="pw-plan-dates" className="ml-6 mt-1 flex items-center gap-2">
                          <Label className="text-xs text-muted-foreground whitespace-nowrap">Anticipated Completion:</Label>
                          <Input
                            type="date"
                            value={itemDetails[item.key]?.timeline_end || ''}
                            onChange={e => setItemDetails(prev => ({ ...prev, [item.key]: { ...prev[item.key], timeline_end: e.target.value } }))}
                            className="h-7 text-xs w-auto"
                          />
                        </div>
                      )}
                      {item.key === 'job_club_workshop' && selectedItems.includes('job_club_workshop') && (
                        <div className="mt-1 ml-6 space-y-1">
                          <Input
                            value={itemDetails.job_club_workshop?.job_club_type || ''}
                            onChange={e => setItemDetails(prev => ({ ...prev, job_club_workshop: { ...prev.job_club_workshop, job_club_type: e.target.value } }))}
                            className="text-sm"
                            placeholder="Which job club? e.g. Trades job club, Youth job club..."
                          />
                          <label className="flex items-center gap-2 text-xs text-muted-foreground cursor-pointer">
                            <input
                              type="checkbox"
                              className="accent-primary w-3.5 h-3.5"
                              checked={!!itemDetails.job_club_workshop?.ongoing}
                              onChange={e => setItemDetails(prev => ({ ...prev, job_club_workshop: { ...prev.job_club_workshop, ongoing: e.target.checked } }))}
                            />
                            Ongoing (no completion date)
                          </label>
                        </div>
                      )}
                      {item.key === 'exposure_course' && selectedItems.includes('exposure_course') && (
                        <Input
                          value={itemDetails.exposure_course?.course_name || ''}
                          onChange={e => setItemDetails(prev => ({ ...prev, exposure_course: { ...prev.exposure_course, course_name: e.target.value } }))}
                          className="mt-1 ml-6 text-sm"
                          placeholder="Which exposure course? e.g. Food Safe Level 1..."
                        />
                      )}
                      {item.key === 'other' && selectedItems.includes('other') && (
                        <div className="ml-6 mt-2 space-y-2">
                          {otherItems.map((entry, idx) => (
                            <div key={idx} className="flex flex-wrap items-center gap-2">
                              <Input
                                value={entry.description || ''}
                                onChange={e => updateOther(idx, { description: e.target.value })}
                                className="text-sm flex-1 min-w-[12rem]"
                                placeholder={`Describe other activity ${idx + 1}...`}
                              />
                              <Input
                                type="date"
                                title="Anticipated completion"
                                value={entry.timeline_end || ''}
                                onChange={e => updateOther(idx, { timeline_end: e.target.value })}
                                className="h-8 text-xs w-auto"
                              />
                              {otherItems.length > 1 && (
                                <button type="button" onClick={() => setOtherItems(prev => prev.filter((_, i) => i !== idx))} className="text-muted-foreground hover:text-destructive">
                                  <X className="w-4 h-4" />
                                </button>
                              )}
                            </div>
                          ))}
                          <Button type="button" variant="outline" size="sm" onClick={() => setOtherItems(prev => [...prev, { description: '' }])}>
                            <Plus className="w-3 h-3 mr-1" /> Add Another Other Activity
                          </Button>
                        </div>
                      )}
                      {item.key === 'one_on_one_counselling' && selectedItems.includes('one_on_one_counselling') && (
                        <Textarea
                          value={itemDetails['one_on_one_counselling']?.notes || ''}
                          onChange={e => setItemDetails(prev => ({ ...prev, one_on_one_counselling: { ...prev['one_on_one_counselling'], notes: e.target.value } }))}
                          className="mt-2 text-sm"
                          rows={2}
                          placeholder="Counselling focus areas, session frequency, goals..."
                        />
                      )}
                    </div>
                  ))}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Notes */}
      <Card data-tour="pw-plan-notes">
        <CardHeader className="pb-2"><CardTitle className="text-sm">Additional Notes</CardTitle></CardHeader>
        <CardContent>
          <Textarea value={sdpNotes} onChange={e => setSdpNotes(e.target.value)} rows={3} placeholder="Add notes about the action plan..." className="text-sm" />
        </CardContent>
      </Card>

      <div className="flex gap-3">
        <Button data-tour="pw-plan-save" onClick={() => handleSaveClick(false)} disabled={saving}>
          {saving ? 'Saving...' : isSubmitted ? 'Save Changes' : 'Create Action Plan'}
        </Button>
        {isSubmitted && (
          <Button variant="outline" onClick={() => handleSaveClick(true)} disabled={saving}>
            Continue to Next Step <ChevronRight className="w-4 h-4 ml-1" />
          </Button>
        )}
      </div>

      {/* Reset (reverse a saved plan) */}
      <ResetActionPlanDialog
        open={showResetDialog}
        onOpenChange={setShowResetDialog}
        client={client}
        onConfirm={handleReset}
        saving={resetting}
      />

      {/* Confirmation Dialog */}
      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Action Plan Changes</AlertDialogTitle>
            <AlertDialogDescription>
              You've changed the selected action items. This will update the EDA tracking sub-tabs in the sidebar —
              tracking data for removed items may be lost. Do you want to continue?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmSave}>Confirm Changes</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}