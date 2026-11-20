import { useRef, useState } from "react";
import { base44 } from "@/api/base44Client";

export default function useEmailAnalysis({ user, refresh, onComplete }) {
  const locked = useRef(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisError, setAnalysisError] = useState("");
  const [analysisResult, setAnalysisResult] = useState("");
  const run = async (action, messageIds = []) => {
    if (!user || locked.current) return null;
    locked.current = true;
    setAnalyzing(true);
    setAnalysisError("");
    setAnalysisResult("");
    try {
      const response = await base44.functions.invoke("emailAssistantAnalyze", { action, message_ids: messageIds });
      const data = response.data || {};
      if (data.error) throw new Error(data.error);
      refresh();
      const remaining = data.remaining_message_count ? ` ${data.remaining_message_count} emails still await analysis; choose Analyze again to continue.` : "";
      const warnings = (data.warnings || []).join(" ");
      setAnalysisResult(`Read ${data.thread_count} conversation${data.thread_count === 1 ? "" : "s"} (${data.message_count} emails). ${action === "summary" ? "Summaries updated." : `${data.saved_count || 0} new suggestions; existing unreviewed suggestions refreshed.`}${remaining}${warnings ? ` ${warnings}` : ""}`);
      if (data.thread_count) onComplete(action === "summary" ? "summaries" : data.saved_count ? "suggested" : null);
      return data;
    } catch (error) {
      setAnalysisError(error.response?.data?.error || error.message || "The conversation could not be read. Please try again.");
      return null;
    } finally {
      locked.current = false;
      setAnalyzing(false);
    }
  };
  return { analyzing, analysisError, analysisResult,
    runAnalysis: (ids = []) => run("analyze", ids), runSummary: (ids = []) => run("summary", ids) };
}