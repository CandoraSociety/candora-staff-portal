import { useEffect, useRef, useState } from "react";
import { Mail, ShieldCheck, AlertCircle, Loader2 } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { base44 } from "@/api/base44Client";
import useEmailAssistant from "@/lib/useEmailAssistant";
import { featureOn, allowedAutomation } from "@/lib/emailAssistant";
import useEmailAnalysis from "@/lib/useEmailAnalysis";
import OverviewTab from "@/components/emailassistant/OverviewTab";
import SuggestedActionsTab from "@/components/emailassistant/SuggestedActionsTab";
import TasksFollowUpsTab from "@/components/emailassistant/TasksFollowUpsTab";
import SummariesTab from "@/components/emailassistant/SummariesTab";
import ChatTab from "@/components/emailassistant/ChatTab";
import BriefingTab from "@/components/emailassistant/BriefingTab";
import SettingsTab from "@/components/emailassistant/SettingsTab";
import DraftComposer from "@/components/emailassistant/DraftComposer";
import AdminPolicyCard from "@/components/emailassistant/AdminPolicyCard";

// The AI Email Assistant: a personal tool for each employee. Everything it
// reads and suggests belongs to that person alone.
export default function EmailAssistant() {
  const { user, email, messages, insights, pendingCount, prefs, policy, savePrefs, seedSamples, clearSamples, refresh, isLoading } = useEmailAssistant();
  const [tab, setTab] = useState("overview");
  const { analyzing, analysisError, analysisResult, runAnalysis, runSummary } = useEmailAnalysis({
    user, refresh, onComplete: (nextTab) => nextTab && setTab(nextTab),
  });
  const [draftOpen, setDraftOpen] = useState(false);
  const [autoState, setAutoState] = useState("");
  const autoRanRef = useRef(false);

  const hasSamples = messages.some((m) => m.is_demo);

  const guard = (featureKey, content) => {
    if (featureOn(featureKey, prefs, policy)) return content;
    return (
      <div className="rounded-xl border border-dashed border-border p-10 text-center">
        <AlertCircle className="w-8 h-8 text-muted-foreground mx-auto mb-3" />
        <p className="text-sm font-medium text-foreground">This feature is switched off</p>
        <p className="text-xs text-muted-foreground mt-1">
          Turn it back on in Settings and preferences, or ask an administrator if the organization has disabled it.
        </p>
      </div>
    );
  };

  // Proactive assistance actually does the work: on opening the assistant it
  // checks the mailbox for new mail and has suggestions ready before the
  // employee asks. Once per browser session, and only when there is new mail.
  useEffect(() => {
    if (isLoading || autoRanRef.current) return;
    if (!user || !email) return;
    if ((prefs?.automation_level || "manual") !== "proactive") return;
    if (allowedAutomation(policy) !== "proactive") return;
    if (!featureOn("analysis", prefs, policy)) return;

    const key = `ea_proactive_${email}`;
    if (sessionStorage.getItem(key)) return;
    autoRanRef.current = true;

    (async () => {
      try {
        setAutoState("checking");
        const sync = await base44.functions.invoke("emailAssistantSyncOutlook", {});
        if (sync.data?.error) throw new Error(sync.data.error);
        refresh();
        const page = await base44.entities.EmailMessage.filter(
          { owner_email: email, analysis_state: "not_analyzed" },
          { sort: "-received_at", limit: 100 }
        );
        const ids = (page.items || []).map((m) => m.id);
        if (!ids.length) return;
        setAutoState("analyzing");
        const result = await runAnalysis(ids);
        if (result) sessionStorage.setItem(key, "1");
      } catch {
        // Leave the manual controls available; do not retry automatically in a loop.
      } finally {
        setAutoState("");
      }
    })();
  }, [isLoading, user, email, prefs, policy]);

  if (isLoading) {
    return (
      <div className="p-6 lg:p-10">
        <div className="h-8 w-64 rounded-lg bg-muted animate-pulse" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mt-6">
          {Array(4).fill(0).map((_, i) => <div key={i} className="h-24 rounded-xl bg-muted animate-pulse" />)}
        </div>
      </div>
    );
  }

  if (policy?.is_enabled === false) {
    return (
      <div className="p-6 lg:p-10 max-w-2xl">
        <div className="rounded-xl border border-border bg-card p-6">
          <p className="font-display text-lg font-bold text-foreground">The assistant is switched off</p>
          <p className="text-sm text-muted-foreground mt-2">
            Your organization has turned off the AI Email Assistant for now. Your own settings and anything you saved
            are kept.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-10 max-w-5xl mx-auto space-y-6">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <Mail className="w-5 h-5 text-highlight" />
            <h1 className="font-display text-2xl font-bold text-foreground">Email Assistant</h1>
            {pendingCount > 0 && prefs?.notify_new_suggestions !== false && (
              <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-highlight text-highlight-foreground">
                {pendingCount} to review
              </span>
            )}
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            Turn your correspondence into tasks, follow-ups and clear summaries. Private to you.
          </p>
        </div>
        <p className="text-xs text-muted-foreground inline-flex items-center gap-1.5 rounded-full border border-border px-3 py-1.5">
          <ShieldCheck className="w-3.5 h-3.5 text-success" /> Only you can see this
        </p>
      </header>

      {autoState && (
        <div className="rounded-lg border border-border bg-muted/50 px-4 py-2.5 inline-flex items-center gap-2 text-xs text-muted-foreground">
          <Loader2 className="w-3.5 h-3.5 animate-spin" />
          {autoState === "analyzing"
            ? "Reading your new mail and preparing suggestions…"
            : "Checking your mailbox for new mail…"}
        </div>
      )}

      {analysisError && <p role="alert" className="text-sm text-destructive">{analysisError}</p>}
      {analysisResult && <p role="status" className="text-sm text-muted-foreground">{analysisResult}</p>}

      {hasSamples && (
        <div className="rounded-lg border border-warning/40 bg-warning/10 px-4 py-3 flex flex-wrap items-center justify-between gap-2">
          <p className="text-xs text-foreground">
            <span className="font-semibold">Sample correspondence.</span> This is demonstration email for trying the
            assistant, not real messages from anyone's inbox.
          </p>
          <button
            className="text-xs font-medium underline text-foreground"
            onClick={() => clearSamples.mutate()}
            disabled={clearSamples.isPending}
          >
            {clearSamples.isPending ? "Clearing…" : "Clear sample data"}
          </button>
        </div>
      )}

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="bg-muted h-auto flex-wrap justify-start">
          <TabsTrigger value="overview" className="text-xs">Overview</TabsTrigger>
          <TabsTrigger value="suggested" className="text-xs">
            Suggested actions{pendingCount ? ` (${pendingCount})` : ""}
          </TabsTrigger>
          <TabsTrigger value="tasks" className="text-xs">Tasks &amp; follow-ups</TabsTrigger>
          <TabsTrigger value="summaries" className="text-xs">Summaries</TabsTrigger>
          <TabsTrigger value="chat" className="text-xs">AI chat</TabsTrigger>
          <TabsTrigger value="briefing" className="text-xs">Daily briefing</TabsTrigger>
          <TabsTrigger value="settings" className="text-xs">Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-5">
          <OverviewTab
            messages={messages}
            insights={insights}
            prefs={prefs}
            onAnalyze={runAnalysis}
            analyzing={analyzing}
            pendingCount={pendingCount}
            onNavigate={setTab}
            onDraft={() => setDraftOpen(true)}
            onSeed={() => seedSamples.mutate()}
            seeding={seedSamples.isPending}
            onSynced={refresh}
          />
        </TabsContent>

        <TabsContent value="suggested" className="mt-5">
          {guard("analysis", (
            <SuggestedActionsTab
              insights={insights}
              messages={messages}
              user={user}
              prefs={prefs}
              onChanged={refresh}
              onGoAnalyze={() => setTab("overview")}
            />
          ))}
        </TabsContent>

        <TabsContent value="tasks" className="mt-5">
          {guard("tasks", (
            <TasksFollowUpsTab
              insights={insights}
              messages={messages}
              user={user}
              prefs={prefs}
              onChanged={refresh}
            />
          ))}
        </TabsContent>

        <TabsContent value="summaries" className="mt-5">
          {guard("summaries", (
            <SummariesTab
              insights={insights}
              messages={messages}
              summarizing={analyzing}
              onSummarize={runSummary}
            />
          ))}
        </TabsContent>

        <TabsContent value="chat" className="mt-5">
          {guard("chat", <ChatTab user={user} messages={messages} />)}
        </TabsContent>

        <TabsContent value="briefing" className="mt-5">
          {guard("briefing", <BriefingTab user={user} prefs={prefs} insights={insights} />)}
        </TabsContent>

        <TabsContent value="settings" className="mt-5 space-y-6">
          <SettingsTab
            user={user}
            prefs={prefs}
            policy={policy}
            savePrefs={savePrefs}
            messageCount={messages.length}
            onClearSamples={() => clearSamples.mutate()}
            clearing={clearSamples.isPending}
          />
          {user?.role === "admin" && <AdminPolicyCard user={user} policy={policy} />}
        </TabsContent>
      </Tabs>

      <DraftComposer
        user={user}
        messages={messages}
        prefs={prefs}
        open={draftOpen}
        onOpenChange={setDraftOpen}
      />
    </div>
  );
}