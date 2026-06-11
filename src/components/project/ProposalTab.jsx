import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Plus, FileText, StickyNote, ChevronRight, ChevronLeft } from 'lucide-react';
import SectionEditor from './SectionEditor';
import NotesPanel from './NotesPanel';
import DocViewerPanel from './DocViewerPanel';
import SectionPickerModal from './SectionPickerModal';
import TemplateManagerModal from './TemplateManagerModal';
import GenerateDocModal from './GenerateDocModal';

export default function ProposalTab({ project, orgInfo, onUpdate }) {
  const queryClient = useQueryClient();
  const [activeSectionId, setActiveSectionId] = useState(null);
  const [showNotes, setShowNotes] = useState(false);
  const [showDocViewer, setShowDocViewer] = useState(false);
  const [showSectionPicker, setShowSectionPicker] = useState(false);
  const [showTemplateManager, setShowTemplateManager] = useState(false);
  const [showGenerateDoc, setShowGenerateDoc] = useState(false);
  const [viewerDoc, setViewerDoc] = useState(null);

  const { data: sections = [], refetch: refetchSections } = useQuery({
    queryKey: ['proposalSections', project.id],
    queryFn: () => base44.entities.ProposalSection.filter({ project_id: project.id }, 'sort_order'),
  });

  const activeSection = sections.find(s => s.id === activeSectionId) || sections[0] || null;

  const handleAddSection = async (sectionData) => {
    await base44.entities.ProposalSection.create({
      project_id: project.id,
      section_title: sectionData.section_title,
      section_key: sectionData.section_key || sectionData.section_title.toLowerCase().replace(/\s+/g, '_'),
      content: '',
      is_required: sectionData.is_required || false,
      word_limit: sectionData.word_limit || null,
      instructions: sectionData.instructions || '',
      sort_order: sections.length,
      status: 'not_started',
    });
    refetchSections();
    setShowSectionPicker(false);
  };

  const handleDeleteSection = async (id) => {
    if (!confirm('Delete this section?')) return;
    await base44.entities.ProposalSection.delete(id);
    if (activeSectionId === id) setActiveSectionId(null);
    refetchSections();
  };

  const STATUS_COLORS = {
    not_started: 'bg-gray-100 text-gray-500',
    in_progress: 'bg-blue-100 text-blue-700',
    draft_complete: 'bg-amber-100 text-amber-700',
    reviewed: 'bg-purple-100 text-purple-700',
    approved: 'bg-green-100 text-green-700',
  };

  return (
    <div className="flex gap-4 h-[calc(100vh-280px)] min-h-[500px]">
      {/* Section sidebar */}
      <div className="w-52 flex-shrink-0 flex flex-col border rounded-xl bg-card overflow-hidden">
        <div className="p-3 border-b flex items-center justify-between">
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Sections</span>
          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setShowSectionPicker(true)}>
            <Plus className="h-3.5 w-3.5" />
          </Button>
        </div>
        <div className="flex-1 overflow-y-auto p-2 space-y-0.5">
          {sections.length === 0 && (
            <div className="text-center py-6">
              <p className="text-xs text-muted-foreground mb-2">No sections yet</p>
              <Button variant="outline" size="sm" className="text-xs" onClick={() => setShowSectionPicker(true)}>Add Section</Button>
            </div>
          )}
          {sections.map(s => (
            <button
              key={s.id}
              onClick={() => setActiveSectionId(s.id)}
              className={`w-full text-left px-2.5 py-2 rounded-lg text-xs transition-colors group ${activeSection?.id === s.id ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'}`}
            >
              <div className="flex items-center justify-between gap-1">
                <span className="truncate font-medium">{s.section_title}</span>
                <span className={`flex-shrink-0 px-1 py-0.5 rounded text-[10px] ${activeSection?.id === s.id ? 'bg-white/20 text-white' : STATUS_COLORS[s.status] || 'bg-gray-100 text-gray-500'}`}>
                  {s.status?.replace('_', ' ')}
                </span>
              </div>
            </button>
          ))}
        </div>
        <div className="p-2 border-t space-y-1">
          <Button variant="ghost" size="sm" className="w-full text-xs justify-start gap-1.5 h-7" onClick={() => setShowTemplateManager(true)}>
            <FileText className="h-3 w-3" />Templates
          </Button>
          {sections.length > 0 && (
            <Button variant="ghost" size="sm" className="w-full text-xs justify-start gap-1.5 h-7" onClick={() => setShowGenerateDoc(true)}>
              <FileText className="h-3 w-3" />Export Doc
            </Button>
          )}
        </div>
      </div>

      {/* Editor area */}
      <div className="flex-1 min-w-0 flex flex-col">
        {activeSection ? (
          <SectionEditor
            section={activeSection}
            orgInfo={orgInfo}
            onDelete={() => handleDeleteSection(activeSection.id)}
            onUpdate={refetchSections}
            onViewDoc={(doc) => { setViewerDoc(doc); setShowDocViewer(true); }}
          />
        ) : (
          <div className="flex-1 flex items-center justify-center border rounded-xl bg-card text-muted-foreground text-sm">
            Select a section or add one to start writing
          </div>
        )}
      </div>

      {/* Right panel toggles */}
      <div className="flex flex-col gap-2 flex-shrink-0">
        <button
          onClick={() => { setShowNotes(v => !v); setShowDocViewer(false); }}
          className={`p-2 rounded-lg border transition-colors ${showNotes ? 'bg-primary text-primary-foreground' : 'bg-card hover:bg-muted'}`}
          title="Notes"
        >
          <StickyNote className="h-4 w-4" />
        </button>
        <button
          onClick={() => { setShowDocViewer(v => !v); setShowNotes(false); }}
          className={`p-2 rounded-lg border transition-colors ${showDocViewer ? 'bg-primary text-primary-foreground' : 'bg-card hover:bg-muted'}`}
          title="Document Viewer"
        >
          <FileText className="h-4 w-4" />
        </button>
      </div>

      {/* Side panels */}
      {showNotes && (
        <div className="w-72 flex-shrink-0">
          <NotesPanel projectId={project.id} onClose={() => setShowNotes(false)} />
        </div>
      )}
      {showDocViewer && (
        <div className="w-80 flex-shrink-0">
          <DocViewerPanel projectId={project.id} initialDoc={viewerDoc} onClose={() => setShowDocViewer(false)} />
        </div>
      )}

      {showSectionPicker && (
        <SectionPickerModal
          existingKeys={sections.map(s => s.section_key)}
          onAdd={handleAddSection}
          onClose={() => setShowSectionPicker(false)}
        />
      )}
      {showTemplateManager && (
        <TemplateManagerModal
          project={project}
          sections={sections}
          onApply={async (templateSections) => {
            for (let i = 0; i < templateSections.length; i++) {
              await base44.entities.ProposalSection.create({
                project_id: project.id,
                section_title: templateSections[i].section_title,
                section_key: templateSections[i].section_key || templateSections[i].section_title.toLowerCase().replace(/\s+/g, '_'),
                content: '',
                sort_order: sections.length + i,
                status: 'not_started',
                word_limit: templateSections[i].word_limit || null,
              });
            }
            refetchSections();
            setShowTemplateManager(false);
          }}
          onClose={() => setShowTemplateManager(false)}
        />
      )}
      {showGenerateDoc && (
        <GenerateDocModal sections={sections} project={project} onClose={() => setShowGenerateDoc(false)} />
      )}
    </div>
  );
}