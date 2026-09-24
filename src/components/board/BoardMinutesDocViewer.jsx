import { useEffect, useState } from "react";
import { ArrowLeft, ExternalLink, Printer } from "lucide-react";

/**
 * In-app viewer for finalized board minutes (HTML documents stored in the
 * Board Portal). Renders the document inside the app with a Print / Save as PDF
 * button, so phones don't hand the file off to an external document app.
 */
export default function BoardMinutesDocViewer({ doc, onClose }) {
  const [html, setHtml] = useState(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    document.body.classList.add("fillable-printing");
    return () => document.body.classList.remove("fillable-printing");
  }, []);

  useEffect(() => {
    setHtml(null);
    setFailed(false);
    fetch(doc.file_url)
      .then((res) => { if (!res.ok) throw new Error("Could not load document"); return res.text(); })
      .then((text) => {
        // The stored file is a full HTML document — pull its <style> and body content
        // into the page so it renders and prints exactly as generated.
        const style = (text.match(/<style[\s\S]*?<\/style>/i) || [""])[0];
        const bodyHtml = (text.match(/<body[^>]*>([\s\S]*)<\/body>/i) || ["", text])[1];
        setHtml(style + bodyHtml);
      })
      .catch(() => setFailed(true));
  }, [doc.file_url]);

  return (
    <div className="fillable-minutes-overlay fixed inset-0 z-[100] overflow-auto bg-slate-200">
      <div className="fillable-page max-w-[830px] mx-auto bg-white my-6 px-6 sm:px-10 py-8 shadow-xl">
        <div className="no-print sticky top-0 z-10 flex items-center gap-3 -mx-4 px-4 py-2 bg-[#1e2f4d] rounded-lg text-white mb-4">
          <button
            type="button"
            onClick={() => window.print()}
            className="flex items-center gap-1.5 bg-[#f5c116] text-[#1e2f4d] font-bold px-3 py-1.5 rounded-md text-sm"
          >
            <Printer size={14} /> Print / Save as PDF
          </button>
          <button
            type="button"
            onClick={() => window.open(doc.file_url, "_blank")}
            title="Open the original file in a new tab"
            className="flex items-center gap-1.5 bg-white/10 border border-white/30 text-white px-3 py-1.5 rounded-md text-sm hover:bg-white/20"
          >
            <ExternalLink size={14} /> Open file
          </button>
          <span className="text-xs text-slate-200 hidden sm:inline">{doc.title}</span>
          <button type="button" onClick={onClose} className="ml-auto flex items-center gap-1 text-sm text-slate-300 hover:text-white">
            <ArrowLeft size={14} /> Back
          </button>
        </div>

        {failed ? (
          <div className="text-center py-16">
            <p className="text-sm font-semibold text-[#1e2f4d]">This document couldn't be displayed in the app.</p>
            <button type="button" onClick={() => window.open(doc.file_url, "_blank")} className="mt-3 text-sm text-blue-700 underline">
              Open it in a new tab instead
            </button>
          </div>
        ) : html === null ? (
          <div className="flex justify-center py-16"><div className="w-6 h-6 border-2 border-slate-300 border-t-[#1e2f4d] rounded-full animate-spin" /></div>
        ) : (
          <div dangerouslySetInnerHTML={{ __html: html }} />
        )}
      </div>
    </div>
  );
}