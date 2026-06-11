import React, { useState, useRef, useCallback, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Save, Sparkles, Trash2, FileDown } from 'lucide-react';
import OrgInfoPopup from './OrgInfoPopup';
import { Document, Packer, Paragraph, TextRun, HeadingLevel } from 'docx';

export default function SectionEditor({ section, orgInfo, onDelete, onUpdate, onViewDoc }) {
  const [content, setContent] = useState(section.content || '');
  const [saving, setSaving] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [contextMenu, setContextMenu] = useState(null);
  const [status, setStatus] = useState(section.status || 'not_started');
  const textareaRef = useRef(null);

  // Update content when section changes
  React.useEffect(() => {
    setContent(section.content || '');
    setStatus(section.status || 'not_started');
  }, [section.id]);

  const wordCount = content.trim() ? content.trim().split(/\s+/).length : 0;

  const handleSave = async () => {
    setSaving(true);
    await base44.entities.ProposalSection.update(section.id, { content, status });
    setSaving(false);
    onUpdate();
  };

  const handleAiAssist = async () => {
    if (!content.trim() && !section.instructions) return;
    setAiLoading(true);
    const result = await base44.integrations.Core.InvokeLLM({
      prompt: `You are helping write a grant proposal section. 
Section: "${section.section_title}"
${section.instructions ? `Instructions: ${section.instructions}` : ''}
${section.word_limit ? `Word limit: approximately ${section.word_limit} words` : ''}
Current draft: "${content}"

Please improve and expand this section for a nonprofit grant application. Be professional, specific, and outcome-focused. Return only the improved text.`,
    });
    setContent(result);
    setAiLoading(false);
  };

  const handleContextMenu = (e) => {
    if (!orgInfo) return;
    e.preventDefault();
    setContextMenu({ x: e.clientX, y: e.clientY });
  };

  const insertText = (text) => {
    const ta = textareaRef.current;
    if (!ta) return;
    const start = ta.selectionStart;
    const end = ta.selectionEnd;
    const newContent = content.slice(0, start) + text + content.slice(end);
    setContent(newContent);
    setContextMenu(null);
    setTimeout(() => {
      ta.selectionStart = ta.selectionEnd = start + text.length;
      ta.focus();
    }, 0);
  };

  const handleExportWord = async () => {
    const doc = new Document({
      sections: [{
        children: [
          new Paragraph({ text: section.section_title, heading: HeadingLevel.HEADING_1 }),
          ...content.split('\n').filter(Boolean).map(line => new Paragraph({ children: [new TextRun(line)] })),
        ],
      }],
    });
    const blob = await Packer.toBlob(doc);
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${section.section_title.replace(/\s+/g, '_')}.docx`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const STATUS_OPTIONS = [
    { value: 'not_started', label: 'Not Started' },
    { value: 'in_progress', label: 'In Progress' },
    { value: 'draft_complete', label: 'Draft Complete' },
    { value: 'reviewed', label: 'Reviewed' },
    { value: 'approved', label: 'Approved' },
  ];

  return (
    <div className="flex flex-col h-full border rounded-xl bg-card overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b flex-wrap">
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-sm">{section.section_title}</h3>
          {section.instructions && <p className="text-xs text-muted-foreground truncate">{section.instructions}</p>}
        </div>
        <select
          value={status}
          onChange={e => setStatus(e.target.value)}
          className="h-7 text-xs rounded border border-input bg-transparent px-2"
        >
          {STATUS_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
        <span className="text-xs text-muted-foreground">
          {wordCount} words{section.word_limit ? ` / ${section.word_limit}` : ''}
          {section.word_limit && wordCount > section.word_limit && <span className="text-destructive ml-1">Over limit</span>}
        </span>
        <Button variant="outline" size="sm" className="h-7 text-xs gap-1" onClick={handleExportWord}>
          <FileDown className="h-3.5 w-3.5" />Word
        </Button>
        <Button variant="outline" size="sm" className="h-7 text-xs gap-1" onClick={handleAiAssist} disabled={aiLoading}>
          <Sparkles className="h-3.5 w-3.5" />{aiLoading ? 'Thinking…' : 'AI Assist'}
        </Button>
        <Button size="sm" className="h-7 text-xs gap-1" onClick={handleSave} disabled={saving}>
          <Save className="h-3.5 w-3.5" />{saving ? 'Saving…' : 'Save'}
        </Button>
        <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={onDelete}>
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      </div>

      {/* Editor */}
      <div className="flex-1 relative">
        <textarea
          ref={textareaRef}
          value={content}
          onChange={e => setContent(e.target.value)}
          onContextMenu={handleContextMenu}
          placeholder={section.instructions || `Write your ${section.section_title} here…\n\nRight-click to insert org info.`}
          className="absolute inset-0 w-full h-full p-4 text-sm bg-transparent resize-none focus-visible:outline-none font-mono leading-relaxed"
        />
        {aiLoading && (
          <div className="absolute inset-0 bg-background/80 flex items-center justify-center">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              AI is improving your draft…
            </div>
          </div>
        )}
      </div>

      {contextMenu && orgInfo && (
        <OrgInfoPopup
          orgInfo={orgInfo}
          position={contextMenu}
          onInsert={insertText}
          onClose={() => setContextMenu(null)}
        />
      )}
    </div>
  );
}