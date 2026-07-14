import {
  FileText, Image as ImageIcon, Video, File, Link2, MessageSquare,
  CheckSquare, HelpCircle, ChevronDown, Table as TableIcon, Presentation, Sparkles,
} from "lucide-react";

export const MODULE_CATEGORIES = [
  { value: "onboarding", label: "Onboarding", color: "bg-blue-100 text-blue-700" },
  { value: "compliance", label: "Compliance", color: "bg-red-100 text-red-700" },
  { value: "role_specific", label: "Role-Specific", color: "bg-purple-100 text-purple-700" },
  { value: "soft_skills", label: "Soft Skills", color: "bg-pink-100 text-pink-700" },
  { value: "technical", label: "Technical", color: "bg-cyan-100 text-cyan-700" },
  { value: "safety", label: "Safety", color: "bg-orange-100 text-orange-700" },
  { value: "wellness", label: "Wellness", color: "bg-green-100 text-green-700" },
  { value: "volunteer", label: "Volunteer", color: "bg-amber-100 text-amber-700" },
  { value: "leadership", label: "Leadership", color: "bg-indigo-100 text-indigo-700" },
  { value: "other", label: "Other", color: "bg-slate-100 text-slate-700" },
];

export const DIFFICULTY_LEVELS = [
  { value: "beginner", label: "Beginner", color: "text-green-600" },
  { value: "intermediate", label: "Intermediate", color: "text-blue-600" },
  { value: "advanced", label: "Advanced", color: "text-red-600" },
  { value: "all_levels", label: "All Levels", color: "text-slate-600" },
];

export const MODULE_STATUSES = [
  { value: "draft", label: "Draft", color: "bg-slate-100 text-slate-600", dot: "bg-slate-400" },
  { value: "review", label: "In Review", color: "bg-amber-100 text-amber-700", dot: "bg-amber-500" },
  { value: "published", label: "Published", color: "bg-green-100 text-green-700", dot: "bg-green-500" },
  { value: "archived", label: "Archived", color: "bg-zinc-100 text-zinc-500", dot: "bg-zinc-400" },
];

export const PROGRAM_CATEGORIES = [
  { value: "onboarding", label: "Onboarding", color: "bg-blue-100 text-blue-700" },
  { value: "compliance", label: "Compliance", color: "bg-red-100 text-red-700" },
  { value: "role_specific", label: "Role-Specific", color: "bg-purple-100 text-purple-700" },
  { value: "professional_development", label: "Professional Development", color: "bg-indigo-100 text-indigo-700" },
  { value: "orientation", label: "Orientation", color: "bg-teal-100 text-teal-700" },
  { value: "volunteer_training", label: "Volunteer Training", color: "bg-amber-100 text-amber-700" },
  { value: "safety", label: "Safety", color: "bg-orange-100 text-orange-700" },
  { value: "leadership", label: "Leadership", color: "bg-violet-100 text-violet-700" },
  { value: "other", label: "Other", color: "bg-slate-100 text-slate-700" },
];

export const NAVIGATION_MODES = [
  { value: "strict_linear", label: "Strict Linear", description: "Learners complete everything in sequence. Cannot skip ahead or go back." },
  { value: "linear_review", label: "Linear with Review", description: "Learners may review previous material but cannot skip ahead." },
  { value: "flexible", label: "Flexible", description: "Learners may move freely throughout available content." },
];

export const MODULE_ENTRY_TYPES = [
  { value: "required", label: "Required", color: "bg-red-100 text-red-700" },
  { value: "optional", label: "Optional", color: "bg-blue-100 text-blue-700" },
  { value: "elective", label: "Elective", color: "bg-purple-100 text-purple-700" },
  { value: "role_specific", label: "Role-Specific", color: "bg-amber-100 text-amber-700" },
];

export const CONTENT_BLOCK_TYPES = [
  { value: "rich_text", label: "Rich Text", icon: FileText, description: "Formatted text with headings, lists, links, and images" },
  { value: "image", label: "Image", icon: ImageIcon, description: "Image with optional caption" },
  { value: "video", label: "Video", icon: Video, description: "YouTube, Vimeo, or uploaded video" },
  { value: "pdf", label: "PDF Document", icon: File, description: "Embedded PDF viewer" },
  { value: "external_link", label: "External Link", icon: Link2, description: "Link to external resource with description" },
  { value: "callout", label: "Callout Box", icon: MessageSquare, description: "Info, warning, tip, or success highlight" },
  { value: "checklist", label: "Checklist", icon: CheckSquare, description: "Interactive checklist items" },
  { value: "knowledge_check", label: "Knowledge Check", icon: HelpCircle, description: "Single question embedded in content flow" },
  { value: "accordion", label: "Accordion", icon: ChevronDown, description: "Expandable/collapsible sections" },
  { value: "table", label: "Table", icon: TableIcon, description: "Structured data table" },
  { value: "slides", label: "PowerPoint Slides", icon: Presentation, description: "Build and embed a slide deck with multiple layouts and themes" },
  { value: "dynamic", label: "Dynamic Reveal", icon: Sparkles, description: "Interactive elements (text, images, charts) that animate in one-by-one on click" },
];

export const CALLOUT_VARIANTS = [
  { value: "info", label: "Info", color: "bg-blue-50 border-blue-300 text-blue-800", icon: "ℹ️" },
  { value: "warning", label: "Warning", color: "bg-amber-50 border-amber-300 text-amber-800", icon: "⚠️" },
  { value: "tip", label: "Tip", color: "bg-green-50 border-green-300 text-green-800", icon: "💡" },
  { value: "success", label: "Success", color: "bg-emerald-50 border-emerald-300 text-emerald-800", icon: "✅" },
];

export function getModuleCategory(value) {
  return MODULE_CATEGORIES.find(c => c.value === value) || MODULE_CATEGORIES[MODULE_CATEGORIES.length - 1];
}
export function getDifficulty(value) {
  return DIFFICULTY_LEVELS.find(d => d.value === value) || DIFFICULTY_LEVELS[0];
}
export function getModuleStatus(value) {
  return MODULE_STATUSES.find(s => s.value === value) || MODULE_STATUSES[0];
}
export function getProgramCategory(value) {
  return PROGRAM_CATEGORIES.find(c => c.value === value) || PROGRAM_CATEGORIES[PROGRAM_CATEGORIES.length - 1];
}
export function getBlockType(value) {
  return CONTENT_BLOCK_TYPES.find(t => t.value === value) || CONTENT_BLOCK_TYPES[0];
}
export function getCalloutVariant(value) {
  return CALLOUT_VARIANTS.find(v => v.value === value) || CALLOUT_VARIANTS[0];
}
export function getNavigationMode(value) {
  return NAVIGATION_MODES.find(n => n.value === value) || NAVIGATION_MODES[1];
}

// Default data for each content block type
export function createDefaultBlockData(type) {
  switch (type) {
    case "rich_text": return { html: "" };
    case "image": return { url: "", caption: "", alt_text: "" };
    case "video": return { url: "", title: "" };
    case "pdf": return { url: "", title: "" };
    case "external_link": return { url: "", label: "", description: "" };
    case "callout": return { variant: "info", title: "", content: "" };
    case "checklist": return { items: [{ id: crypto.randomUUID(), text: "", checked: false }] };
    case "knowledge_check": return { questions: [{ id: crypto.randomUUID(), question: "", options: ["", ""], correct_index: 0, explanation: "" }] };
    case "accordion": return { items: [{ id: crypto.randomUUID(), title: "", content: "" }] };
    case "table": return { headers: ["", ""], rows: [["", ""]] };
    case "slides": return { theme: "light", slides: [{ id: crypto.randomUUID(), title: "", body: "", image_url: "", layout: "title_content", notes: "" }] };
    case "dynamic": return { title: "", elements: [] };
    default: return {};
  }
}

export function normalizeKnowledgeCheckData(data) {
  if (!data) return { questions: [{ id: crypto.randomUUID(), question: "", options: ["", ""], correct_index: 0, explanation: "" }] };
  if (data.questions) return data;
  // Migrate old single-question format
  return {
    questions: [{
      id: crypto.randomUUID(),
      question: data.question || "",
      options: data.options || ["", ""],
      correct_index: data.correct_index || 0,
      explanation: data.explanation || "",
    }]
  };
}

export function createEmptyBlock(type, sortOrder = 0) {
  return {
    id: crypto.randomUUID(),
    type,
    sort_order: sortOrder,
    page_break_before: type === "knowledge_check",
    data: createDefaultBlockData(type),
  };
}

export function getSectionPages(blocks) {
  if (!blocks || blocks.length === 0) return [[]];
  const pages = [];
  let currentPage = [];
  for (const block of blocks) {
    if (block.page_break_before && currentPage.length > 0) {
      pages.push(currentPage);
      currentPage = [];
    }
    currentPage.push(block);
  }
  if (currentPage.length > 0) pages.push(currentPage);
  return pages.length > 0 ? pages : [[]];
}

export function createEmptySection(sortOrder = 0) {
  return {
    id: crypto.randomUUID(),
    title: "",
    sort_order: sortOrder,
    content_blocks: [],
  };
}

export function createEmptyChapter(sortOrder = 0) {
  return {
    id: crypto.randomUUID(),
    title: "",
    sort_order: sortOrder,
    sections: [],
  };
}

// Immutable nested update helpers
export function updateChapter(chapters, chId, updater) {
  return chapters.map(ch => ch.id === chId ? updater(ch) : ch);
}

export function updateSection(chapters, chId, secId, updater) {
  return chapters.map(ch => {
    if (ch.id !== chId) return ch;
    return {
      ...ch,
      sections: (ch.sections || []).map(sec => sec.id === secId ? updater(sec) : sec)
    };
  });
}

export function updateBlock(chapters, chId, secId, blockId, updater) {
  return chapters.map(ch => {
    if (ch.id !== chId) return ch;
    return {
      ...ch,
      sections: (ch.sections || []).map(sec => {
        if (sec.id !== secId) return sec;
        return {
          ...sec,
          content_blocks: (sec.content_blocks || []).map(blk =>
            blk.id === blockId ? updater(blk) : blk
          )
        };
      })
    };
  });
}

export function reorderArray(arr, fromIdx, toIdx) {
  const result = [...arr];
  const [item] = result.splice(fromIdx, 1);
  result.splice(toIdx, 0, item);
  return result.map((item, i) => ({ ...item, sort_order: i }));
}

// Count content in a module
export function getModuleStats(module) {
  const chapters = module?.chapters || [];
  let sections = 0;
  let blocks = 0;
  let quizBlocks = 0;
  chapters.forEach(ch => {
    sections += (ch.sections || []).length;
    (ch.sections || []).forEach(sec => {
      blocks += (sec.content_blocks || []).length;
      (sec.content_blocks || []).forEach(blk => {
        if (blk.type === "knowledge_check") {
          const kcData = blk.data?.questions ? blk.data : normalizeKnowledgeCheckData(blk.data);
          quizBlocks += (kcData.questions || []).length;
        } else if (blk.type === "quiz") {
          quizBlocks++;
        }
      });
    });
  });
  return { chapters: chapters.length, sections, blocks, quizBlocks };
}