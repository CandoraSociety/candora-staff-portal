import { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { CheckCircle2, Copy, ChevronRight, Plus, X } from 'lucide-react';
import { toast } from 'sonner';
import { base44 } from '@/api/base44Client';
import { createCompassTask, taskActionPlan } from '@/lib/compassTasks';

// ─── Action Plan Options ────────────────────────────────────────────────────

const ALL_ITEMS = [
  { key: 'job_search_workshop',         label: 'Job Search Workshop',           category: 'Workshops' },
  { key: 'resume_writing_workshop',     label: 'Resume Writing Workshop',        category: 'Workshops' },
  { key: 'interview_skills_workshop',   label: 'Interview Skills Workshop',      category: 'Workshops' },
  { key: 'workplace_readiness_workshop',label: 'Workplace Readiness Workshop',   category: 'Workshops' },
  { key: 'financial_literacy_workshop', label: 'Financial Literacy Workshop',    category: 'Workshops' },
  { key: 'skills_assessment',           label: 'Skills Assessment',              category: 'Programs' },
  { key: 'internal_placement',          label: 'Internal Placement',             category: 'Placement/Training', pathwaysOnly: true },
  { key: 'exposure_course',             label: 'Exposure Course',                category: 'Placement/Training' },
  { key: 'paid_external_placement',     label: 'Paid External Placement',        category: 'Placement/Training', notDEA: true },
  { key: 'employment_supports',         label: 'Employment Supports',            category: 'Supports' },
  { key: 'job_applications',            label: 'Job Applications',               category: 'Job Search' },
  { key: 'networking',                  label: 'Networking',                     category: 'Job Search' },
  { key: 'barrier_support',             label: 'Barrier Support',                category: 'Supports' },
  { key: 'other',                       label: 'Other',                          category: 'Other' },
];

const DEA_ACTIVITY_TYPES = [
  'Job Search Workshop',
  'Resume Writing Workshop',
  'Interview Skills Workshop',
  'Workplace Readiness Workshop',
  'Financial Literacy Workshop',
  'Skills Assessment',
  'Exposure Course',
  'Employment Supports',
  'Job Applications',
  'Networking',
  'Barrier Support',
  'Other',
];

const CATEGORIES = ['Workshops', 'Programs', 'Placement/Training', 'Job Search', 'Supports', 'Other'];

// ─── Main Component ─────────────────────────────────────────────────────────

export default function EmploymentActionPlan({ client, onSave, onComplete, onClientUpdate }) {
  const isPathways = client?.service_type === 'pathways';
  const isDEA = client?.service_type === 'direct_to_employment';
  const isSubmitted = !!client?.action_plan_submitted;

  const [saving, setSaving] = useState(false);
  const [compassDismissed, setCompassDismissed] = useState(!!client?.action_plan_compass_entered);
  const [compassEntered, setCompassEntered] = useState(!!client?.action_plan_compass_entered);
  const [copiedCompass, setCopiedCompass] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [pendingAndComplete, setPendingAndComplete] = useState(false);

  // Pathways state
  const defaultSelected = useMemo(() => {
    if (client?.sdp_items?.length > 0) return client.sdp_items;
    return client?.barriers_addressed && client?.barrier_1 ? ['barrier_support'] : [];
  }, []);
  const [selectedItems, setSelectedItems] = useState(defaultSelected);
  const [itemDetails, setItemDetails] = useState(client?.sdp_item_details || {});
  const [otherDesc, setOtherDesc] = useState(client?.sdp_other_desc || '');
  const [sdpNotes, setSdpNotes] = useState(client?.sdp_notes || '');

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

  const toggleItem = (key) =>
    setSelectedItems(prev => prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]);

  const addDeaActivity = () =>
    setDeaActivities(prev => [...prev, { id: Date.now().toString(), type: '', notes: '' }]);

  const updateDea = (id, field, val) =>
    setDeaActivities(prev => prev.map(a => a.id === id ? { ...a, [field]: val } : a));

  const removeDea = (id) =>
    setDeaActivities(prev => prev.filter(a => a.id !== id));

  const deaEndDate = useMemo(() => {
    if (!client?.service_start_date) return 'TBD';
    const d = new Date(client.service_start_date);
    d.setDate(d.getDate() + 14);
    return d.toLocaleDateString('en-CA');
  }, [client?.service_start_date]);

  const generateCompassText = () => {
    const name = `${client.first_name} ${client.last_name}`;
    if (isDEA) {
      const acts = deaActivities.filter(a => a.type).map((a, i) => `  EDA ${i + 1}: ${a.type}${a.notes ? ` — ${a.notes}` : ''}`).join('\n');
      const barrierLines = [1, 2, 3].map(n => client[`barrier_${n}`] ? `  • ${client[`barrier_${n}`]}` : null).filter(Boolean).join('\n');
      const sdpNotesLine = sdpNotes ? `\nAdditional Notes:\n  ${sdpNotes}` : '';
      return `DEA Employment Action Plan — ${name}\nTimeline: ${client?.service_start_date || 'TBD'} to ${deaEndDate}\n\nEmployment Development Activities:\n${acts || '  (none)'}${barrierLines ? `\n\nBarriers:\n${barrierLines}` : ''}${sdpNotesLine}`;
    }
    const itemLines = selectedItems.map(k => {
      const item = ALL_ITEMS.find(i => i.key === k);
      return `  • ${item?.label || k}`;
    }).join('\n');
    const barrierLines = [1, 2, 3].map(n => {
      if (!client[`barrier_${n}`]) return null;
      const tl = client[`barrier_${n}_timeline_start`] ? ` (${client[`barrier_${n}_timeline_start`]} – ${client[`barrier_${n}_timeline_end`] || 'TBD'})` : '';
      return `  • ${client[`barrier_${n}`]}${tl}`;
    }).filter(Boolean).join('\n');
    const expLine = selectedItems.includes('exposure_course') ? '\nExposure Course: Yes' : '';
    const placeLine = selectedItems.includes('internal_placement') ? `\nInternal Placement: ${client?.internal_placement || 'TBD'}${client?.placement_start_date ? ` — ${client.placement_start_date}` : ''}` : '';
    const otherLine = selectedItems.includes('other') && otherDesc ? `\nOther: ${otherDesc}` : '';
    const notesLine = sdpNotes ? `\nAdditional Notes:\n  ${sdpNotes}` : '';
    return `Employment Action Plan — ${name}\n\nSelected Activities:\n${itemLines || '  (none)'}${expLine}${placeLine}${otherLine}${barrierLines ? `\n\nBarriers:\n${barrierLines}` : ''}${notesLine}`;
  };

  const handleCopy = async () => {
    await navigator.clipboard.writeText(generateCompassText());
    setCopiedCompass(true);
    setTimeout(() => setCopiedCompass(false), 2000);
  };

  const handleMarkEntered = async () => {
    await onSave({ action_plan_compass_entered: true });
    setCompassEntered(true);
    setCompassDismissed(true);
    toast.success('Marked as entered in Compass');
  };

  const handleSave = async (andComplete = false) => {
    setSaving(true);
    try {
      const updates = isDEA
        ? { dea_activities: deaActivities, sdp_notes: sdpNotes, action_plan_submitted: true }
        : { sdp_items: selectedItems, sdp_item_details: itemDetails, sdp_other_desc: otherDesc, sdp_notes: sdpNotes, action_plan_submitted: true };

      const updatedClient = await onSave(updates);

      if (!isSubmitted) {
        const task = taskActionPlan(updatedClient || { ...client, ...updates });
        await createCompassTask({
          client_id: client.id,
          task_type: 'action_plan',
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
        </div>
      )}

      {/* Intake Summary */}
      <Card className="border-blue-200 bg-blue-50/50">
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
        </CardContent>
      </Card>

      {/* DEA mode */}
      {isDEA && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Employment Development Activities (EDA)</CardTitle>
            <div className="text-xs text-muted-foreground">Timeline: {client?.service_start_date || 'TBD'} → {deaEndDate} (14-day program)</div>
          </CardHeader>
          <CardContent className="space-y-3">
            {deaActivities.map((act, idx) => (
              <div key={act.id} className="flex items-start gap-2">
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
            ))}
            <Button type="button" variant="outline" size="sm" onClick={addDeaActivity}>
              <Plus className="w-3 h-3 mr-1" /> Add Activity
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Pathways/other mode — category checkboxes */}
      {!isDEA && (
        <div className="space-y-4">
          {CATEGORIES.map(cat => {
            const catItems = availableItems.filter(i => i.category === cat);
            if (catItems.length === 0) return null;
            return (
              <Card key={cat}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">{cat}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {catItems.map(item => (
                    <div key={item.key}>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          className="accent-primary w-4 h-4"
                          checked={selectedItems.includes(item.key)}
                          onChange={() => toggleItem(item.key)}
                        />
                        <span className="text-sm">{item.label}</span>
                      </label>
                      {selectedItems.includes(item.key) && (
                        <div className="ml-6 mt-1 flex items-center gap-2">
                          <Label className="text-xs text-muted-foreground whitespace-nowrap">Date:</Label>
                          <Input
                            type="date"
                            value={itemDetails[item.key]?.date || ''}
                            onChange={e => setItemDetails(prev => ({ ...prev, [item.key]: { ...prev[item.key], date: e.target.value } }))}
                            className="h-7 text-xs w-auto"
                          />
                        </div>
                      )}
                      {item.key === 'other' && selectedItems.includes('other') && (
                        <Input value={otherDesc} onChange={e => setOtherDesc(e.target.value)} className="mt-2 text-sm" placeholder="Describe other activity..." />
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
      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-sm">Additional Notes</CardTitle></CardHeader>
        <CardContent>
          <Textarea value={sdpNotes} onChange={e => setSdpNotes(e.target.value)} rows={3} placeholder="Add notes about the action plan..." className="text-sm" />
        </CardContent>
      </Card>

      {/* Compass text */}
      {!compassDismissed ? (
        <Card className="border-amber-300 bg-amber-50">
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <CardTitle className="text-sm text-amber-800">Compass Entry Text</CardTitle>
            <Button size="sm" variant="outline" onClick={handleCopy} className="h-7 text-xs">
              <Copy className="w-3 h-3 mr-1" /> {copiedCompass ? 'Copied!' : 'Copy'}
            </Button>
          </CardHeader>
          <CardContent className="space-y-3">
            <pre className="text-xs whitespace-pre-wrap bg-white rounded border p-3">{generateCompassText()}</pre>
            <Button variant="outline" size="sm" onClick={handleMarkEntered} className="text-green-700 border-green-300">
              <CheckCircle2 className="w-3 h-3 mr-1" /> Mark as Entered in Compass
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="flex items-center gap-2 text-green-600 text-sm">
          <CheckCircle2 className="w-4 h-4" /> Marked as entered in Compass
        </div>
      )}

      <div className="flex gap-3">
        <Button onClick={() => handleSaveClick(false)} disabled={saving}>
          {saving ? 'Saving...' : isSubmitted ? 'Save Changes' : 'Create Action Plan'}
        </Button>
        {isSubmitted && (
          <Button variant="outline" onClick={() => handleSaveClick(true)} disabled={saving}>
            Continue to Next Step <ChevronRight className="w-4 h-4 ml-1" />
          </Button>
        )}
      </div>

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