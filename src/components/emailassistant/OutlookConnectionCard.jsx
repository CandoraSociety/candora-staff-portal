import { useEffect, useRef, useState } from "react";
import { PlugZap, RefreshCw, CheckCircle2, AlertCircle, Plus, LogIn } from "lucide-react";
import { Button } from "@/components/ui/button";
import { base44 } from "@/api/base44Client";

// The Outlook account each staff member already connects — the same one the
// Outlook portal uses.
const CONNECTOR_ID = "6a43f36f28e8ea04989eb603";

const MODE_COPY = {
  delegated:
    "Reading your own Outlook mailbox — the account you connected for the Outlook portal.",
  app_only:
    "Reading the mailbox Candora's Microsoft 365 setup links to you, so the assistant works without another sign-in. Connect your own Outlook account for the fuller picture.",
};

export default function OutlookConnectionCard({ onSynced, onSeed, seeding, messageCount = 0 }) {
  const [status, setStatus] = useState("loading");
  const [mode, setMode] = useState(null);
  const [mailbox, setMailbox] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const pollRef = useRef(null);

  const sync = async ({ quiet = false } = {}) => {
    if (!quiet) setBusy(true);
    try {
      const res = await base44.functions.invoke("emailAssistantSyncOutlook", {});
      const data = res.data || {};
      if (data.connected) {
        setStatus("connected");
        setMode(data.mode);
        setMailbox(data.mailbox || "");
        setError("");
        if (data.imported || data.updated) onSynced?.();
      } else {
        setStatus("disconnected");
        setMode(null);
        setMailbox("");
        setError(data.error || "");
      }
    } catch (e) {
      setStatus("disconnected");
      setMode(null);
      setMailbox("");
      setError(e.message || "Outlook could not be reached just now.");
    } finally {
      setBusy(false);
    }
  };

  useEffect(() => {
    sync({ quiet: true });
    return () => clearInterval(pollRef.current);
  }, []);

  const connect = async () => {
    const authed = await base44.auth.isAuthenticated();
    if (!authed) {
      base44.auth.redirectToLogin();
      return;
    }
    const url = await base44.connectors.connectAppUser(CONNECTOR_ID);
    const popup = window.open(url, "_blank");
    pollRef.current = setInterval(() => {
      if (!popup || popup.closed) {
        clearInterval(pollRef.current);
        sync();
      }
    }, 600);
  };

  const badge = {
    loading: { label: "Checking…", tone: "bg-muted text-muted-foreground" },
    connected: { label: "Connected", tone: "bg-success/15 text-success" },
    disconnected: { label: "Not connected", tone: "bg-muted text-muted-foreground" },
  }[status];

  return (
    <div className="rounded-xl border border-border bg-card p-5 space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <PlugZap className="w-4 h-4 text-muted-foreground" />
        <p className="text-sm font-medium text-foreground">Outlook</p>
        <span className={`text-[10px] uppercase tracking-wide px-2 py-0.5 rounded-full ${badge.tone}`}>
          {badge.label}
        </span>
        {status === "connected" && (
          <Button size="sm" variant="ghost" className="ml-auto" onClick={() => sync()} disabled={busy}>
            <RefreshCw className={`w-3.5 h-3.5 ${busy ? "animate-spin" : ""}`} />
            {busy ? "Checking…" : "Check for new mail"}
          </Button>
        )}
      </div>

      {status === "loading" && (
        <p className="text-sm text-muted-foreground">Checking whether your Outlook mailbox is available…</p>
      )}

      {status === "connected" && (
        <div className="space-y-1.5">
          <p className="text-sm text-foreground inline-flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-success flex-shrink-0" />
            <span>
              Linked to{" "}
              <span className="font-medium break-all">{mailbox || "your work mailbox"}</span>
            </span>
          </p>
          <p className="text-sm text-muted-foreground leading-relaxed pl-6">
            {MODE_COPY[mode] || MODE_COPY.app_only}
          </p>
        </div>
      )}

      {status === "disconnected" && (
        <>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Your Outlook mailbox is not available to the assistant yet. Connect the account you use for work and your
            last two weeks of mail will be read here — nothing is sent or changed without you.
          </p>
          {error && (
            <p className="text-xs text-muted-foreground inline-flex items-start gap-1.5">
              <AlertCircle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" /> {error}
            </p>
          )}
        </>
      )}

      <div className="flex flex-wrap items-center gap-2">
        {status === "disconnected" && (
          <Button size="sm" onClick={connect}>
            <LogIn className="w-3.5 h-3.5" /> Connect my Outlook account
          </Button>
        )}
        {status === "connected" && mode === "app_only" && (
          <Button size="sm" variant="outline" onClick={connect}>
            <LogIn className="w-3.5 h-3.5" /> Connect my Outlook account
          </Button>
        )}
        {messageCount === 0 && (
          <Button size="sm" variant="outline" onClick={onSeed} disabled={seeding}>
            <Plus className="w-3.5 h-3.5" /> {seeding ? "Adding…" : "Load a sample conversation"}
          </Button>
        )}
      </div>
    </div>
  );
}