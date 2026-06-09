import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Save, ChevronRight, Pencil, CheckCircle2, Download } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { createCompassTask, taskBarriersIdentified } from "@/lib/compassTasks";
import { exportBitPdf } from "@/lib/exportBitPdf";
import { toast } from "sonner";

// ─── Static Data ─────────────────────────────────────────────────────────────

const BIT_BARRIERS = [
  { key: "Housing Stability", examples: ["Homelessness", "Unstable housing", "Unsafe living conditions"], actions: ["Refer to housing support services", "Refer to shelters"] },
  { key: "Childcare", examples: ["Lack of affordable childcare", "Unreliable babysitters"], actions: ["Connect with childcare subsidies", "Connect with local childcare providers"] },
  { key: "Transportation", examples: ["No access to a vehicle", "Unreliable public transit"], actions: ["Provide transit passes", "Apply for TAG"] },
  { key: "Mental Health", examples: ["Anxiety", "Depression", "PTSD", "Lack of coping skills"], actions: ["Refer to counselling", "Refer to mental health resources"] },
  { key: "Physical Health", examples: ["Chronic illness", "Disability", "Lack of access to healthcare"], actions: ["Connect with healthcare providers", "Connect with disability supports"] },
  { key: "Language Proficiency", examples: ["Difficulty speaking/reading/writing English"], actions: ["Enroll in language classes", "Provide ELL resources"] },
  { key: "Legal / Immigration", examples: ["Lack of work permits", "Criminal record", "Unresolved legal issues"], actions: ["Refer to legal aid", "Refer to immigration services"] },
  { key: "Financial Stability", examples: ["Debt", "Lack of savings", "Inability to afford work-related expenses"], actions: ["Provide budgeting tools", "Financial literacy workshops"] },
  { key: "Social Support", examples: ["Isolation", "Lack of family or friends", "Limited community connections"], actions: ["Connect with community groups", "Connect with peer support programs"] },
];

const KEY_TO_LEGACY = {
  "Housing Stability": "Housing Instability",
  "Physical Health": "Health / Disability",
  "Language Proficiency": "Language / Communication",
  "Legal / Immigration": "Legal Issues",
  "Financial Stability": "Financial Barriers",
  "Social Support": "Cultural / Social Adjustment",
};

const CHECKIN_FREQUENCIES = ["Weekly", "Bi-Weekly", "Monthly"];
const FOLLOWUP_METHODS = ["Phone", "Email", "In-Person", "Other"];
const PROGRESS_OPTIONS = ["Resolved", "Ongoing", "Needs Further Support"];

// ─── Helpers ─────────────────────────────────────────────────────────────────

function makeDefaultBarrierState() {
  const s = {};
  BIT_BARRIERS.forEach((b) => {
    s[b.key] = { confirmed: null, selectedChallenges: [], challengeOthers: [""], selectedActions: [], actionOthers: [""], notes: "" };
  });
  return s;
}

function splitSaved(savedStr, knownOptions) {
  if (!savedStr) return { selected: [], others: [""] };
  const parts = savedStr.split("\n").map((s) => s.trim()).filter(Boolean);
  const selected = [];
  const others = [];
  parts.forEach((p) => {
    if (knownOptions.includes(p)) selected.push(p);
    else others.push(p);
  });
  return { selected, others: others.length > 0 ? others : [""] };
}

// ─── ChecklistCell ────────────────────────────────────────────────────────────

function ChecklistCell({ options, selected, others, isOpen, onOpen, onToggle, onOtherChange, onAddOther, onRemoveOther }) {
  const displayItems = [...selected, ...others.filter(Boolean)];
  const shown = displayItems.slice(0, 2);
  const extra = displayItems.length - 2;

  return (
    <div className="relative min-w-[160px]">
      <button
        type="button"
        onClick={onOpen}
        className="w-full text-left border border-input rounded-md px-2 py-1 text-xs bg-white hover:bg-slate-50 flex items-center justify-between gap-1"
      >
        <span className="truncate text-slate-700">
          {displayItems.length === 0
            ? <span className="text-muted-foreground">Select...</span>
            : <span>{shown.join(", ")}{extra > 0 ? ` +${extra}` : ""}</span>
          }
        </span>
        <span className="text-slate-400 shrink-0 text-xs">v</span>
      </button>

      {isOpen && (
        <div
          className="absolute z-50 mt-1 left-0 w-64 bg-white border border-border rounded-lg shadow-lg p-2 space-y-1"
          onClick={(e) => e.stopPropagation()}
        >
          {options.map((opt) => (
            <label key={opt} className="flex items-center gap-2 cursor-pointer hover:bg-amber-50 px-2 py-1 rounded text-xs">
              <input type="checkbox" className="accent-amber-500 w-3 h-3" checked={selected.includes(opt)} onChange={() => onToggle(opt)} />
              <span>{opt}</span>
            </label>
          ))}
          <div className="border-t border-border mt-2 pt-2 space-y-1">
            <div className="text-xs font-medium text-muted-foreground px-2">Other</div>
            {others.map((val, idx) => (
              <div key={idx} className="flex items-center gap-1 px-2">
                <Input value={val} onChange={(e) => onOtherChange(idx, e.target.value)} className="h-6 text-xs flex-1" placeholder="Type other..." />
                {others.length > 1 && (
                  <button type="button" className="text-muted-foreground hover:text-destructive text-xs" onClick={() => onRemoveOther(idx)}>x</button>
                )}
              </div>
            ))}
            <button type="button" onClick={onAddOther} className="text-xs text-primary hover:underline px-2">+ Add other</button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function BarrierIdentificationTool({ client, onSave, onComplete }) {
  const isCompleted = !!client?.bit_completed;
  const [submitted, setSubmitted] = useState(isCompleted);
  const [editing, setEditing] = useState(!isCompleted);
  const [saving, setSaving] = useState(false);
  const [assessorName, setAssessorName] = useState("");
  const [openDropdown, setOpenDropdown] = useState(null);

  const [barrierState, setBarrierState] = useState(() => {
    const s = makeDefaultBarrierState();
    [1, 2, 3].forEach((n) => {
      const legacyVal = client?.[`barrier_${n}`];
      if (!legacyVal) return;
      const barrier = BIT_BARRIERS.find((b) => (KEY_TO_LEGACY[b.key] || b.key) === legacyVal || b.key === legacyVal);
      if (!barrier) return;
      const savedChallenges = splitSaved(client?.[`barrier_${n}_challenges`], barrier.examples);
      const savedActions = splitSaved(client?.[`barrier_${n}_action_steps`], barrier.actions);
      s[barrier.key] = {
        confirmed: true,
        selectedChallenges: savedChallenges.selected,
        challengeOthers: savedChallenges.others,
        selectedActions: savedActions.selected,
        actionOthers: savedActions.others,
        notes: client?.[`barrier_${n}_notes`] || "",
      };
    });
    return s;
  });

  const [actionPlan, setActionPlan] = useState({
    recommendations: "",
    checkin_frequency: client?.bit_checkin_frequency || "",
    followup_methods: [],
    followup_other: "",
    review_dates: client?.bit_review_dates?.length ? [...client.bit_review_dates, "", "", "", ""].slice(0, 4) : ["", "", "", ""],
    progress: "",
    additional_notes: "",
  });

  // Auto-populate recommendations
  useEffect(() => {
    const lines = BIT_BARRIERS.filter((b) => barrierState[b.key]?.confirmed === true).map((b) => {
      const actions = [...(barrierState[b.key]?.selectedActions || []), ...(barrierState[b.key]?.actionOthers?.filter(Boolean) || [])];
      if (actions.length === 0) return `${b.key}:\n  (no actions selected)`;
      return `${b.key}:\n${actions.map((a) => `  - ${a}`).join("\n")}`;
    });
    setActionPlan((prev) => ({ ...prev, recommendations: lines.join("\n") }));
  }, [barrierState]);

  // Close dropdowns on outside click
  useEffect(() => {
    const handler = () => setOpenDropdown(null);
    document.addEventListener("click", handler);
    return () => document.removeEventListener("click", handler);
  }, []);

  const updateBarrier = (key, field, value) =>
    setBarrierState((prev) => ({ ...prev, [key]: { ...prev[key], [field]: value } }));

  const toggleOption = (barrierKey, field, opt) => {
    const current = barrierState[barrierKey][field];
    updateBarrier(barrierKey, field, current.includes(opt) ? current.filter((x) => x !== opt) : [...current, opt]);
  };

  const updateOther = (barrierKey, field, idx, val) => {
    const arr = [...barrierState[barrierKey][field]];
    arr[idx] = val;
    updateBarrier(barrierKey, field, arr);
  };

  const addOther = (barrierKey, field) => updateBarrier(barrierKey, field, [...barrierState[barrierKey][field], ""]);

  const removeOther = (barrierKey, field, idx) => {
    const arr = barrierState[barrierKey][field].filter((_, i) => i !== idx);
    updateBarrier(barrierKey, field, arr.length > 0 ? arr : [""]);
  };

  const buildSaveData = () => {
    const confirmedBarriers = BIT_BARRIERS.filter((b) => barrierState[b.key]?.confirmed === true);
    const data = {
      barriers_addressed: confirmedBarriers.length > 0,
      bit_completed: true,
      bit_review_dates: actionPlan.review_dates.filter(Boolean),
      bit_checkin_frequency: actionPlan.checkin_frequency,
    };
    for (let n = 1; n <= 3; n++) {
      const b = confirmedBarriers[n - 1];
      if (b) {
        const state = barrierState[b.key];
        const actions = [...state.selectedActions, ...state.actionOthers.filter(Boolean)];
        const challenges = [...state.selectedChallenges, ...state.challengeOthers.filter(Boolean)];
        const isSame = (KEY_TO_LEGACY[b.key] || b.key) === client?.[`barrier_${n}`];
        data[`barrier_${n}`] = KEY_TO_LEGACY[b.key] || b.key;
        data[`barrier_${n}_status`] = "unresolved";
        data[`barrier_${n}_other`] = "";
        data[`barrier_${n}_notes`] = state.notes;
        data[`barrier_${n}_action_steps`] = actions.join("\n");
        data[`barrier_${n}_challenges`] = challenges.join("\n");
        data[`barrier_${n}_timeline_start`] = isSame ? (client?.[`barrier_${n}_timeline_start`] || "") : "";
        data[`barrier_${n}_timeline_end`] = isSame ? (client?.[`barrier_${n}_timeline_end`] || "") : "";
        data[`barrier_${n}_responsible`] = isSame ? (client?.[`barrier_${n}_responsible`] || "") : "";
        data[`barrier_${n}_resources`] = isSame ? (client?.[`barrier_${n}_resources`] || "") : "";
      } else {
        data[`barrier_${n}`] = "";
        data[`barrier_${n}_status`] = "unresolved";
        data[`barrier_${n}_other`] = "";
        data[`barrier_${n}_notes`] = "";
        data[`barrier_${n}_action_steps`] = "";
        data[`barrier_${n}_challenges`] = "";
        data[`barrier_${n}_timeline_start`] = "";
        data[`barrier_${n}_timeline_end`] = "";
        data[`barrier_${n}_responsible`] = "";
        data[`barrier_${n}_resources`] = "";
      }
    }
    return { data, confirmedBarriers };
  };

  const handleSave = async (andComplete = false) => {
    setSaving(true);
    try {
      const { data, confirmedBarriers } = buildSaveData();
      const updatedClient = await onSave(data);

      if (confirmedBarriers.length > 0 && !client?.barriers_addressed) {
        const task = taskBarriersIdentified(updatedClient || { ...client, ...data });
        await createCompassTask({
          client_id: client.id,
          task_type: "barriers_identified",
          assigned_worker: client.assigned_worker,
          assigned_worker_name: client.assigned_worker_name,
          ...task,
        });
      }

      base44.functions.invoke("sendAlertEmail", {
        alert_type: "barriers",
        client_name: `${client.first_name} ${client.last_name}`,
        client_id: client.id,
        barriers: confirmedBarriers.map((b) => b.key),
      }).catch(() => {});

      toast.success("BIT saved");
      setSubmitted(true);
      setEditing(false);
      if (andComplete) onComplete?.();
    } catch (error) {
      toast.error("Failed to save BIT");
    } finally {
      setSaving(false);
    }
  };

  // ── Read-only summary ─────────────────────────────────────────────────────
  if (submitted && !editing) {
    const confirmedBarriers = BIT_BARRIERS.filter((b) => barrierState[b.key]?.confirmed === true);
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-green-600">
            <CheckCircle2 className="w-5 h-5" />
            <span className="font-semibold text-base">BIT Completed</span>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => exportBitPdf(client, barrierState, actionPlan, assessorName)}>
              <Download className="w-4 h-4 mr-1" />
              Save / Print BIT
            </Button>
            <Button variant="outline" size="sm" onClick={() => setEditing(true)}>
              <Pencil className="w-4 h-4 mr-1" />
              Edit
            </Button>
          </div>
        </div>

        {confirmedBarriers.length === 0 ? (
          <div className="text-muted-foreground text-sm">No barriers identified.</div>
        ) : (
          <div className="space-y-2">
            {confirmedBarriers.map((b) => {
              const state = barrierState[b.key];
              const challenges = [...state.selectedChallenges, ...state.challengeOthers.filter(Boolean)];
              return (
                <Card key={b.key} className="bg-amber-50 border-amber-200">
                  <CardContent className="p-4">
                    <div className="font-semibold text-sm">{b.key}</div>
                    {challenges.length > 0 && (
                      <div className="text-xs text-muted-foreground mt-1">Challenges: {challenges.join(", ")}</div>
                    )}
                    {state.notes && <div className="text-xs mt-1">{state.notes}</div>}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        <Button onClick={() => onComplete?.()} className="w-full">
          Continue to Next Step <ChevronRight className="w-4 h-4 ml-1" />
        </Button>
      </div>
    );
  }

  // ── Edit form ─────────────────────────────────────────────────────────────
  const today = new Date().toISOString().split("T")[0];

  return (
    <div className="space-y-6" onClick={() => setOpenDropdown(null)}>
      <div>
        <h3 className="text-base font-semibold">Step 1 — Barrier Identification Tool (BIT)</h3>
        <p className="text-sm text-muted-foreground mt-1">
          Identify barriers that may impact the client's employment journey. For each barrier, indicate whether support is needed and document relevant challenges and recommended actions.
        </p>
      </div>

      {/* Participant Info */}
      <Card>
        <CardContent className="p-4 grid grid-cols-3 gap-4">
          <div>
            <Label className="text-xs">Client Name</Label>
            <Input value={`${client.first_name} ${client.last_name}`} disabled className="mt-1 text-sm" />
          </div>
          <div>
            <Label className="text-xs">Date</Label>
            <Input value={today} disabled className="mt-1 text-sm" />
          </div>
          <div>
            <Label className="text-xs">Assessor Name</Label>
            <Input value={assessorName} onChange={(e) => setAssessorName(e.target.value)} className="mt-1 text-sm" placeholder="Enter assessor name" />
          </div>
        </CardContent>
      </Card>

      {/* Barrier Table */}
      <Card>
        <CardHeader className="pb-0">
          <CardTitle className="text-sm">Barrier Assessment</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto" onClick={(e) => e.stopPropagation()}>
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="bg-slate-100 border-b">
                  <th className="text-left px-3 py-2 font-medium text-xs w-36">Barrier</th>
                  <th className="text-left px-3 py-2 font-medium text-xs w-28">Support Needed?</th>
                  <th className="text-left px-3 py-2 font-medium text-xs w-44">Challenges</th>
                  <th className="text-left px-3 py-2 font-medium text-xs w-44">Recommended Actions</th>
                  <th className="text-left px-3 py-2 font-medium text-xs">Notes</th>
                </tr>
              </thead>
              <tbody>
                {BIT_BARRIERS.map((barrier) => {
                  const state = barrierState[barrier.key];
                  const rowBg = state.confirmed === true ? "bg-amber-50" : "bg-white";
                  const challengeKey = `${barrier.key}_challenges`;
                  const actionKey = `${barrier.key}_actions`;
                  return (
                    <tr key={barrier.key} className={`${rowBg} border-b last:border-0 align-top`}>
                      <td className="px-3 py-2 font-medium text-xs">{barrier.key}</td>
                      <td className="px-3 py-2">
                        <div className="flex flex-col gap-1">
                          <label className="flex items-center gap-1 text-xs cursor-pointer">
                            <input type="radio" name={`confirmed_${barrier.key}`} className="accent-amber-500" checked={state.confirmed === true} onChange={() => updateBarrier(barrier.key, "confirmed", true)} />
                            Yes
                          </label>
                          <label className="flex items-center gap-1 text-xs cursor-pointer">
                            <input type="radio" name={`confirmed_${barrier.key}`} className="accent-slate-400" checked={state.confirmed === false} onChange={() => updateBarrier(barrier.key, "confirmed", false)} />
                            No
                          </label>
                        </div>
                      </td>
                      <td className="px-3 py-2">
                        <ChecklistCell
                          options={barrier.examples}
                          selected={state.selectedChallenges}
                          others={state.challengeOthers}
                          isOpen={openDropdown === challengeKey}
                          onOpen={(e) => { e?.stopPropagation?.(); setOpenDropdown(openDropdown === challengeKey ? null : challengeKey); }}
                          onToggle={(opt) => toggleOption(barrier.key, "selectedChallenges", opt)}
                          onOtherChange={(idx, val) => updateOther(barrier.key, "challengeOthers", idx, val)}
                          onAddOther={() => addOther(barrier.key, "challengeOthers")}
                          onRemoveOther={(idx) => removeOther(barrier.key, "challengeOthers", idx)}
                        />
                      </td>
                      <td className="px-3 py-2">
                        <ChecklistCell
                          options={barrier.actions}
                          selected={state.selectedActions}
                          others={state.actionOthers}
                          isOpen={openDropdown === actionKey}
                          onOpen={(e) => { e?.stopPropagation?.(); setOpenDropdown(openDropdown === actionKey ? null : actionKey); }}
                          onToggle={(opt) => toggleOption(barrier.key, "selectedActions", opt)}
                          onOtherChange={(idx, val) => updateOther(barrier.key, "actionOthers", idx, val)}
                          onAddOther={() => addOther(barrier.key, "actionOthers")}
                          onRemoveOther={(idx) => removeOther(barrier.key, "actionOthers", idx)}
                        />
                      </td>
                      <td className="px-3 py-2">
                        <Textarea value={state.notes} onChange={(e) => updateBarrier(barrier.key, "notes", e.target.value)} rows={2} className="text-xs resize-none min-w-[140px]" />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Action Plan Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Action Plan Summary</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label className="text-xs font-semibold">Key Barriers Identified</Label>
            <div className="mt-1 flex flex-wrap gap-1">
              {BIT_BARRIERS.filter((b) => barrierState[b.key]?.confirmed === true).map((b) => (
                <span key={b.key} className="px-2 py-0.5 rounded bg-amber-100 text-amber-800 text-xs">{b.key}</span>
              ))}
              {BIT_BARRIERS.filter((b) => barrierState[b.key]?.confirmed === true).length === 0 && (
                <span className="text-xs text-muted-foreground">None selected</span>
              )}
            </div>
          </div>

          <div>
            <Label className="text-xs font-semibold">Recommendations</Label>
            <Textarea value={actionPlan.recommendations} onChange={(e) => setActionPlan((p) => ({ ...p, recommendations: e.target.value }))} rows={4} className="mt-1 text-xs font-mono" />
          </div>

          <div>
            <Label className="text-xs font-semibold">Check-in Frequency</Label>
            <div className="flex gap-4 mt-1">
              {CHECKIN_FREQUENCIES.map((f) => (
                <label key={f} className="flex items-center gap-1 text-xs cursor-pointer">
                  <input type="radio" name="checkin_freq" className="accent-amber-500" checked={actionPlan.checkin_frequency === f} onChange={() => setActionPlan((p) => ({ ...p, checkin_frequency: f }))} />
                  {f}
                </label>
              ))}
            </div>
          </div>

          <div>
            <Label className="text-xs font-semibold">Follow-up Method(s)</Label>
            <div className="flex flex-wrap gap-4 mt-1">
              {FOLLOWUP_METHODS.map((m) => (
                <label key={m} className="flex items-center gap-1 text-xs cursor-pointer">
                  <input
                    type="checkbox"
                    className="accent-amber-500"
                    checked={actionPlan.followup_methods.includes(m)}
                    onChange={() => {
                      const next = actionPlan.followup_methods.includes(m)
                        ? actionPlan.followup_methods.filter((x) => x !== m)
                        : [...actionPlan.followup_methods, m];
                      setActionPlan((p) => ({ ...p, followup_methods: next }));
                    }}
                  />
                  {m}
                </label>
              ))}
            </div>
            {actionPlan.followup_methods.includes("Other") && (
              <Input value={actionPlan.followup_other} onChange={(e) => setActionPlan((p) => ({ ...p, followup_other: e.target.value }))} className="mt-2 text-xs" placeholder="Describe other follow-up method..." />
            )}
          </div>

          <div>
            <Label className="text-xs font-semibold">Scheduled Review Dates</Label>
            <div className="grid grid-cols-4 gap-2 mt-1">
              {actionPlan.review_dates.map((d, i) => (
                <Input key={i} type="date" value={d} onChange={(e) => { const arr = [...actionPlan.review_dates]; arr[i] = e.target.value; setActionPlan((p) => ({ ...p, review_dates: arr })); }} className="text-xs" />
              ))}
            </div>
          </div>

          <div>
            <Label className="text-xs font-semibold">Progress</Label>
            <div className="flex gap-4 mt-1">
              {PROGRESS_OPTIONS.map((opt) => (
                <label key={opt} className="flex items-center gap-1 text-xs cursor-pointer">
                  <input type="radio" name="progress" className="accent-amber-500" checked={actionPlan.progress === opt} onChange={() => setActionPlan((p) => ({ ...p, progress: opt }))} />
                  {opt}
                </label>
              ))}
            </div>
          </div>

          <div>
            <Label className="text-xs font-semibold">Additional Notes</Label>
            <Textarea value={actionPlan.additional_notes} onChange={(e) => setActionPlan((p) => ({ ...p, additional_notes: e.target.value }))} rows={3} className="mt-1 text-xs" />
          </div>
        </CardContent>
      </Card>

      {/* Footer */}
      <div className="flex gap-3">
        <Button variant="outline" onClick={() => handleSave(false)} disabled={saving}>
          <Save className="w-4 h-4 mr-1" />
          {saving ? "Saving..." : "Save"}
        </Button>
        <Button onClick={() => handleSave(true)} disabled={saving}>
          Finish &amp; Continue
          <ChevronRight className="w-4 h-4 ml-1" />
        </Button>
      </div>
    </div>
  );
}