import React, { useState, useEffect, useRef } from "react";
import ReactQuill from "react-quill";
import { ChevronUp, ChevronDown, Trash2 } from "lucide-react";
import { Input } from "@/components/ui/input";

export default function BoardReportSectionEditor({ section, index, total, onUpdate, onDelete, onMove }) {
  const [title, setTitle] = useState(section.title || "");
  const [content, setContent] = useState(section.content || "");
  const saveRef = useRef(onUpdate);
  saveRef.current = onUpdate;

  // Reset local state only when section ID changes (not on every refetch)
  useEffect(() => {
    setTitle(section.title || "");
    setContent(section.content || "");
  }, [section.id]);

  // Debounced save — title
  useEffect(() => {
    const timer = setTimeout(() => {
      if (title !== section.title) {
        saveRef.current(section.id, { title });
      }
    }, 800);
    return () => clearTimeout(timer);
  }, [title, section.id, section.title]);

  // Debounced save — content
  useEffect(() => {
    const timer = setTimeout(() => {
      if (content !== section.content) {
        saveRef.current(section.id, { content });
      }
    }, 1500);
    return () => clearTimeout(timer);
  }, [content, section.id, section.content]);

  return (
    <div className="bg-card border border-border rounded-xl p-4">
      <div className="flex items-center gap-2 mb-3">
        <span className="text-xs text-muted-foreground font-medium w-6 shrink-0">{index + 1}.</span>
        <Input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Section title (e.g. Executive Director's Message)"
          className="flex-1 h-8 text-sm font-medium"
        />
        <div className="flex items-center gap-0.5 shrink-0">
          <button onClick={() => onMove(index, -1)} disabled={index === 0} className="text-muted-foreground hover:text-foreground disabled:opacity-20 p-1">
            <ChevronUp className="w-4 h-4" />
          </button>
          <button onClick={() => onMove(index, 1)} disabled={index === total - 1} className="text-muted-foreground hover:text-foreground disabled:opacity-20 p-1">
            <ChevronDown className="w-4 h-4" />
          </button>
          <button onClick={() => onDelete(section.id)} className="text-muted-foreground hover:text-destructive p-1">
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
      <ReactQuill
        theme="snow"
        value={content}
        onChange={setContent}
        className="bg-white rounded-lg"
        style={{ minHeight: 200 }}
      />
    </div>
  );
}