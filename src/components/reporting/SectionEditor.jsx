import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ChevronDown, ChevronUp, Sparkles, Trash2, GripVertical, Check, Bold, Italic, Underline, AlignLeft, AlignCenter, AlignRight, RotateCcw, RotateCw, Upload, Plus, X, BarChart3, Crop, ImageIcon, Settings2, Frame, ChartNoAxesCombined } from 'lucide-react';
import CropImageDialog from '@/components/settings/CropImageDialog';
import ReactQuill from 'react-quill';
import ChartRenderer from './ChartRenderer';
import TableRenderer from './TableRenderer';
import SectionGallery from './SectionGallery';
import PasteImageInput from './PasteImageInput';
import { IMAGE_FILTERS } from './imageFilters';

const FONT_FAMILIES = ['Inter', 'Georgia', 'Montserrat', 'Playfair Display', 'Nunito', 'Roboto', 'Arial'];

function parseStyles(raw) {
  try { return raw ? JSON.parse(raw) : {}; } catch { return {}; }
}

const LAYOUT_LABELS = {
  text_only: 'Text Only',
  image_left: 'Image Left',
  image_right: 'Image Right',
  image_full: 'Full Image',
  image_wrap: 'Text Wrap Around',
  two_column: 'Two Column'
};

const QUILL_MODULES = {
  toolbar: [
    [{ 'header': [1, 2, 3, 4, false] }],
    [{ 'font': [] }],
    ['bold', 'italic', 'underline', 'strike'],
    [{ 'color': [] }, { 'background': [] }],
    [{ 'align': [] }],
    [{ 'list': 'ordered'}, { 'list': 'bullet' }],
    ['link', 'image', 'clean']
  ]
};

const QUILL_FORMATS = [
  'header', 'font', 'bold', 'italic', 'underline', 'strike',
  'color', 'background', 'align', 'list', 'bullet', 'link', 'image'
];

export default function SectionEditor({ section, masterStyles, onUpdate, onDelete, onGenerateSuggestions, suggestions, onExpand, dataEntries = [], branding }) {
  const [expanded, setExpanded] = useState(false);
  const [title, setTitle] = useState(section.title || '');
  const [content, setContent] = useState(section.content || '');
  const [layout, setLayout] = useState(section.layout || 'text_only');
  const [textColumns, setTextColumns] = useState(section.text_columns || 1);
  const [imageUrl, setImageUrl] = useState(section.image_url || '');
  const [titleImageUrl, setTitleImageUrl] = useState(section.title_image_url || '');
  const [titleImageWidth, setTitleImageWidth] = useState(section.title_image_width || 80);
  const [cropDialogOpen, setCropDialogOpen] = useState(false);
  const [sectionCropOpen, setSectionCropOpen] = useState(false);
  const [imageCaption, setImageCaption] = useState(section.image_caption || '');
  const [imageWidth, setImageWidth] = useState(section.image_width || 50);
  const [isCollapsible, setIsCollapsible] = useState(section.is_collapsible || false);
  const [isExpandedDefault, setIsExpandedDefault] = useState(section.is_expanded_default !== false);
  const [hideHeader, setHideHeader] = useState(section.hide_header || false);
  const [hideFooter, setHideFooter] = useState(section.hide_footer || false);
  const [generatingVisual, setGeneratingVisual] = useState(false);
  const [visualCategory, setVisualCategory] = useState('infographic');
  const [visualDescription, setVisualDescription] = useState('');
  const [visualAspectRatio, setVisualAspectRatio] = useState('landscape');
  const [useTitleContext, setUseTitleContext] = useState(true);
  const [useContentContext, setUseContentContext] = useState(true);
  const [showVisualOptions, setShowVisualOptions] = useState(false);
  const [generatingSuggestions, setGeneratingSuggestions] = useState(false);
  const [titleStyles, setTitleStyles] = useState(parseStyles(section.title_styles));
  const [uploadingImage, setUploadingImage] = useState(false);
  const [showDataPanel, setShowDataPanel] = useState(false);
  const [chartLabel, setChartLabel] = useState('');
  const [chartType, setChartType] = useState('bar');
  const [chartRows, setChartRows] = useState([{ name: '', value: '' }, { name: '', value: '' }]);
  const [tableColumns, setTableColumns] = useState(['Item', 'Value']);
  const [tableData, setTableData] = useState([]);
  const [analyzing, setAnalyzing] = useState({});
  const [importingFile, setImportingFile] = useState(false);
  const [showPasteData, setShowPasteData] = useState(false);
  const [pasteDataValue, setPasteDataValue] = useState('');
  const [editingChartId, setEditingChartId] = useState(null);
  const [editChartLabel, setEditChartLabel] = useState('');
  const [editChartType, setEditChartType] = useState('bar');
  const [editChartRows, setEditChartRows] = useState([]);
  const [editTableColumns, setEditTableColumns] = useState([]);

  const master = parseStyles(masterStyles);
  const masterTitle = master.title || {};
  const effectiveTitle = section.title_styles ? { ...masterTitle, ...parseStyles(section.title_styles) } : { ...masterTitle };
  const hasTitleOverride = !!section.title_styles;

  useEffect(() => {
    setTitle(section.title || '');
    setContent(section.content || '');
    setLayout(section.layout || 'text_only');
    setTextColumns(section.text_columns || 1);
    setImageUrl(section.image_url || '');
    setTitleImageUrl(section.title_image_url || '');
    setTitleImageWidth(section.title_image_width || 80);
    setImageCaption(section.image_caption || '');
    setImageWidth(section.image_width || 50);
    setIsCollapsible(section.is_collapsible || false);
    setIsExpandedDefault(section.is_expanded_default !== false);
    setHideHeader(section.hide_header || false);
    setHideFooter(section.hide_footer || false);
    setTitleStyles(parseStyles(section.title_styles));
  }, [section]);

  const save = () => {
    onUpdate(section.id, { title, content, layout, text_columns: textColumns, image_url: imageUrl, image_caption: imageCaption, image_width: imageWidth, is_collapsible: isCollapsible, is_expanded_default: isExpandedDefault, hide_header: hideHeader, hide_footer: hideFooter, title_styles: JSON.stringify(titleStyles) });
  };

  const updateTitleStyle = (key, value) => {
    const updated = { ...titleStyles, [key]: value };
    setTitleStyles(updated);
    onUpdate(section.id, { title_styles: JSON.stringify(updated) });
  };

  const resetTitleOverride = () => {
    setTitleStyles({ ...masterTitle });
    onUpdate(section.id, { title_styles: null });
  };

  const handleGenerateVisual = async () => {
    setGeneratingVisual(true);
    try {
      const plainContent = content ? content.replace(/<[^>]+>/g, '').trim() : '';
      const res = await base44.functions.invoke('generateReportVisual', {
        section_title: useTitleContext ? title : '',
        section_content: useContentContext ? plainContent : '',
        category: visualCategory,
        custom_description: visualDescription,
        aspect_ratio: visualAspectRatio,
        report_context: '',
        brand_colors: '#1a2744, #c8952e'
      });
      const url = res.data?.url;
      if (url) {
        setImageUrl(url);
        const newLayout = layout === 'text_only' ? 'image_full' : layout;
        if (layout === 'text_only') setLayout('image_full');
        onUpdate(section.id, { image_url: url, layout: newLayout });
      }
    } catch {}
    setGeneratingVisual(false);
  };

  const handleGenerateSuggestions = async () => {
    setGeneratingSuggestions(true);
    try {
      await onGenerateSuggestions(section);
    } catch {}
    setGeneratingSuggestions(false);
  };

  const uploadSectionImage = async (file) => {
    if (!file) return;
    setUploadingImage(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setImageUrl(file_url);
      const newLayout = layout === 'text_only' ? 'image_full' : layout;
      if (layout === 'text_only') setLayout('image_full');
      onUpdate(section.id, { image_url: file_url, layout: newLayout });
    } catch {}
    setUploadingImage(false);
  };

  const handleImageUpload = async (e) => {
    uploadSectionImage(e.target.files?.[0]);
  };

  const handleTitleImagePaste = async (file) => {
    setUploadingImage(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setTitleImageUrl(file_url);
      onUpdate(section.id, { title_image_url: file_url });
    } catch {}
    setUploadingImage(false);
  };

  const handleRemoveImage = () => {
    setImageUrl('');
    onUpdate(section.id, { image_url: null });
  };

  const handleToggleData = () => {
    setShowDataPanel(!showDataPanel);
  };

  const updateChartRow = (idx, field, val) => {
    setChartRows(prev => prev.map((r, i) => i === idx ? { ...r, [field]: val } : r));
  };

  const addChartRow = () => setChartRows(prev => [...prev, { name: '', value: '' }]);
  const removeChartRow = (idx) => setChartRows(prev => prev.filter((_, i) => i !== idx));

  // Table-specific handlers
  const updateTableColumn = (idx, val) => {
    setTableColumns(prev => prev.map((c, i) => i === idx ? val : c));
  };

  const addTableColumn = () => setTableColumns(prev => [...prev, `Column ${prev.length + 1}`]);
  const removeTableColumn = (idx) => setTableColumns(prev => prev.filter((_, i) => i !== idx));

  const updateTableCell = (rowIdx, colIdx, val) => {
    setChartRows(prev => prev.map((r, i) => {
      if (i !== rowIdx) return r;
      const updated = { ...r };
      if (!updated.columns) updated.columns = {};
      updated.columns[tableColumns[colIdx]] = val;
      return updated;
    }));
  };

  const handleSaveChart = async () => {
    let validRows;
    if (chartType === 'table') {
      // For tables, validate that all cells have data
      validRows = chartRows.filter(r => {
        if (!r.columns) return false;
        return tableColumns.some(col => r.columns[col] && r.columns[col].trim() !== '');
      });
      if (validRows.length === 0 || !chartLabel.trim()) return;
    } else {
      validRows = chartRows.filter(r => r.name.trim() && r.value !== '');
      if (!validRows.length || !chartLabel.trim()) return;
    }
    
    let chartData;
    if (chartType === 'table') {
      chartData = validRows.map(r => ({
        name: r.name || r.columns?.[tableColumns[0]] || '',
        value: r.value || r.columns?.[tableColumns[1]] || '',
        columns: r.columns || {}
      }));
    } else {
      chartData = validRows.map(r => ({ name: r.name.trim(), value: parseFloat(r.value) || 0 }));
    }
    
    const config = { chart_type: chartType, title: chartLabel, data: chartData };
    await base44.entities.AGRReportData.create({
      label: chartLabel, report_id: section.report_id, section_id: section.id,
      data_type: 'manual', chart_config: JSON.stringify(config), status: 'analyzed'
    });
    setChartLabel('');
    setChartType('bar');
    setChartRows([{ name: '', value: '' }, { name: '', value: '' }]);
    setTableColumns(['Item', 'Value']);
  };

  const handleImportSpreadsheet = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImportingFile(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      const result = await base44.integrations.Core.ExtractDataFromUploadedFile({
        file_url,
        json_schema: {
          type: "object",
          properties: {
            rows: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  name: { type: "string" },
                  value: { type: "number" }
                }
              }
            },
            suggested_label: { type: "string" }
          }
        }
      });
      if (result.output?.rows?.length) {
        setChartRows(result.output.rows.map(r => ({ name: r.name || '', value: r.value != null ? String(r.value) : '' })));
        if (result.output.suggested_label && !chartLabel) {
          setChartLabel(result.output.suggested_label);
        }
      }
    } catch {}
    setImportingFile(false);
    e.target.value = '';
  };

  const handleDataFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    await base44.entities.AGRReportData.create({ label: file.name, report_id: section.report_id, section_id: section.id, data_type: 'file_upload', source_file_url: file_url, source_file_name: file.name });
  };

  const handleAnalyze = async (entryId) => {
    setAnalyzing(prev => ({ ...prev, [entryId]: true }));
    try { await base44.functions.invoke('analyzeReportData', { data_entry_id: entryId }); } catch {}
    setAnalyzing(prev => ({ ...prev, [entryId]: false }));
  };

  const handleEditChart = (entry) => {
    setEditingChartId(entry.id);
    const chartConfig = entry.chart_config ? (typeof entry.chart_config === 'string' ? JSON.parse(entry.chart_config) : entry.chart_config) : null;
    if (chartConfig) {
      setEditChartLabel(chartConfig.title || '');
      setEditChartType(chartConfig.chart_type || 'bar');
      const data = chartConfig.data || [];
      setEditChartRows(data.map(r => ({ name: r.name || '', value: r.value != null ? String(r.value) : '', columns: r.columns || {} })));
      // Extract table columns from first row if it's a table
      if (chartConfig.chart_type === 'table' && data.length > 0 && data[0].columns) {
        setEditTableColumns(Object.keys(data[0].columns));
      } else {
        setEditTableColumns(['Item', 'Value']);
      }
    }
  };

  const handleSaveEditChart = async () => {
    let validRows;
    if (editChartType === 'table') {
      validRows = editChartRows.filter(r => {
        if (!r.columns) return false;
        return editTableColumns.some(col => r.columns[col] && r.columns[col].trim() !== '');
      });
      if (validRows.length === 0) return;
    } else {
      validRows = editChartRows.filter(r => r.name.trim() && r.value !== '');
      if (!validRows.length) return;
    }
    
    let chartData;
    if (editChartType === 'table') {
      chartData = validRows.map(r => ({
        name: r.name || r.columns?.[editTableColumns[0]] || '',
        value: r.value || r.columns?.[editTableColumns[1]] || '',
        columns: r.columns || {}
      }));
    } else {
      chartData = validRows.map(r => ({ name: r.name.trim(), value: parseFloat(r.value) || 0 }));
    }
    
    const config = { chart_type: editChartType, title: editChartLabel, data: chartData };
    await base44.entities.AGRReportData.update(editingChartId, {
      label: editChartLabel,
      chart_config: JSON.stringify(config)
    });
    setEditingChartId(null);
    setEditChartLabel('');
    setEditChartType('bar');
    setEditChartRows([]);
    setEditTableColumns([]);
  };

  const handleCancelEdit = () => {
    setEditingChartId(null);
    setEditChartLabel('');
    setEditChartType('bar');
    setEditChartRows([]);
    setEditTableColumns([]);
  };

  const handleDeleteChart = async (entryId) => {
    if (confirm('Delete this chart/table?')) {
      await base44.entities.AGRReportData.delete(entryId);
    }
  };

  const handlePasteData = () => {
    const lines = pasteDataValue.trim().split('\n').filter(l => l.trim());
    if (lines.length === 0) {
      alert('Please paste your data from Excel, Google Sheets, or CSV');
      return;
    }

    // Detect delimiter (tab for Excel/Sheets, comma for CSV)
    const firstLine = lines[0];
    const delimiter = firstLine.includes('\t') ? '\t' : ',';
    
    // Parse all rows
    const parsedRows = lines.map(line => {
      const parts = line.split(delimiter).map(p => p.trim());
      return parts;
    });

    // Check if first row looks like headers (contains text, not just numbers)
    const firstRow = parsedRows[0];
    const hasHeaders = firstRow.some(cell => isNaN(parseFloat(cell)) && cell.trim() !== '');
    
    // Determine data structure
    const dataRows = hasHeaders ? parsedRows.slice(1) : parsedRows;
    const headers = hasHeaders ? firstRow : [];

    // If we have 2 columns: Label, Value (for charts)
    if (dataRows[0]?.length === 2) {
      const rows = dataRows.map(row => ({ name: row[0] || '', value: row[1] || '' }));
      setChartRows(rows);
      if (hasHeaders && headers[0] && !chartLabel) {
        setChartLabel(headers[0]);
      }
    }
    // If we have 3+ columns: multi-column data (perfect for tables)
    else if (dataRows[0]?.length >= 3) {
      // Set column headers
      const columnNames = hasHeaders ? headers : headers.map((_, idx) => `Column ${idx + 1}`);
      setTableColumns(columnNames);
      
      // Create multi-column format: each row object has all columns
      const multiColumnData = dataRows.map(row => {
        const rowData = {};
        row.forEach((cell, idx) => {
          const key = columnNames[idx] || `Column ${idx}`;
          rowData[key] = cell || '';
        });
        return rowData;
      });
      
      // For chart rows, store each row with its multi-column data
      const chartData = multiColumnData.map((rowData, idx) => ({
        name: Object.values(rowData)[0] || `Item ${idx + 1}`,
        value: Object.values(rowData)[1] || '0',
        columns: rowData
      }));
      
      setChartRows(chartData);
      setChartLabel(hasHeaders && columnNames[0] ? columnNames[0] : 'Data Table');
      setChartType('table'); // Auto-switch to table type
    } else {
      alert('Please paste data with at least 2 columns (Label and Value)');
      return;
    }

    setShowPasteData(false);
    setPasteDataValue('');
  };

  return (
    <div className="border rounded-xl bg-white">
      <div
        className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-slate-50 rounded-t-xl"
        onClick={() => {
          const next = !expanded;
          setExpanded(next);
          if (next && onExpand) onExpand(section.id);
        }}
      >
        <GripVertical className="w-4 h-4 text-slate-300" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold truncate">{title || 'Untitled Section'}</p>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="text-xs bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded">{LAYOUT_LABELS[layout]}</span>
            {hasTitleOverride ? (
              <span className="text-[10px] bg-accent/10 text-accent px-1.5 py-0.5 rounded">custom title</span>
            ) : (
              <span className="text-[10px] bg-gray-100 text-gray-400 px-1.5 py-0.5 rounded">master</span>
            )}
            {content && <span className="text-xs text-muted-foreground truncate">{content.replace(/<[^>]+>/g, '').slice(0, 60)}</span>}
          </div>
        </div>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); const next = !expanded; setExpanded(next); if (next && onExpand) onExpand(section.id); }}>
            {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </Button>
          <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); onDelete(section.id); }} className="text-red-400 hover:text-red-600">
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {expanded && (
        <div className="px-4 pb-4 space-y-4 border-t">
          <div className="grid sm:grid-cols-2 gap-3 pt-3">
            <div className="sm:col-span-2">
              <div className="flex items-center gap-2 mb-1">
                <Label className="text-xs">Section Title</Label>
                {!hasTitleOverride && masterTitle && Object.keys(masterTitle).length > 0 && (
                  <span className="text-[10px] bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded">using master style</span>
                )}
                {hasTitleOverride && (
                  <button onClick={resetTitleOverride} className="text-[10px] text-muted-foreground hover:text-destructive flex items-center gap-1" title="Revert to master styles">
                    <RotateCcw className="w-3 h-3" /> revert to master
                  </button>
                )}
              </div>
              <Input value={title} onChange={e => setTitle(e.target.value)} onBlur={save} placeholder="e.g. Executive Message" className="mt-1" />
              {/* Title Image */}
              <div className="mt-2">
                <Label className="text-[10px] text-muted-foreground">Title Image (shown on right)</Label>
                {titleImageUrl ? (
                  <div className="mt-1 space-y-2">
                    <div className="flex items-center gap-2">
                      <img src={titleImageUrl} alt="Title" className="object-contain rounded border" style={{ height: `${titleImageWidth}px`, maxWidth: `${titleImageWidth}px` }} />
                      <div className="flex flex-col gap-1">
                        <button onClick={() => setCropDialogOpen(true)} className="text-[10px] flex items-center gap-1 text-accent hover:underline">
                          <Crop className="w-3 h-3" /> Crop
                        </button>
                        <label className="text-[10px] flex items-center gap-1 text-accent hover:underline cursor-pointer">
                          <Upload className="w-3 h-3" /> Replace
                          <input type="file" accept="image/*" className="hidden" onChange={async (e) => {
                            const file = e.target.files?.[0];
                            if (!file) return;
                            try {
                              const { file_url } = await base44.integrations.Core.UploadFile({ file });
                              setTitleImageUrl(file_url);
                              onUpdate(section.id, { title_image_url: file_url });
                            } catch {}
                          }} />
                        </label>
                        <button onClick={() => { setTitleImageUrl(''); onUpdate(section.id, { title_image_url: null, title_image_width: null }); }} className="text-[10px] flex items-center gap-1 text-red-400 hover:text-red-600">
                          <X className="w-3 h-3" /> Remove
                        </button>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-muted-foreground w-6">Size</span>
                      <input type="range" min="24" max="200" value={titleImageWidth} onChange={e => { const v = parseInt(e.target.value); setTitleImageWidth(v); onUpdate(section.id, { title_image_width: v }); }} className="flex-1 h-1 accent-accent" />
                      <span className="text-[10px] text-muted-foreground w-10 text-right">{titleImageWidth}px</span>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-1.5 mt-1">
                    <label className="inline-flex items-center gap-1 text-xs text-accent cursor-pointer hover:underline">
                      <ImageIcon className="w-3 h-3" /> Add title image
                      <input type="file" accept="image/*" className="hidden" onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        setUploadingImage(true);
                        try {
                          const { file_url } = await base44.integrations.Core.UploadFile({ file });
                          setTitleImageUrl(file_url);
                          onUpdate(section.id, { title_image_url: file_url });
                        } catch {}
                        setUploadingImage(false);
                      }} />
                    </label>
                    <PasteImageInput onPasteImage={handleTitleImagePaste} disabled={uploadingImage} />
                  </div>
                )}
              </div>
              <CropImageDialog
                open={cropDialogOpen}
                imageSrc={titleImageUrl}
                aspect={1.5}
                cropShape="rect"
                onCropComplete={(url) => { setTitleImageUrl(url); onUpdate(section.id, { title_image_url: url }); setCropDialogOpen(false); }}
                onClose={() => setCropDialogOpen(false)}
              />
              <CropImageDialog
                open={sectionCropOpen}
                imageSrc={imageUrl}
                aspect={4 / 3}
                cropShape="rect"
                onCropComplete={(url) => { setImageUrl(url); onUpdate(section.id, { image_url: url }); setSectionCropOpen(false); }}
                onClose={() => setSectionCropOpen(false)}
              />
              {/* Title Styling Toolbar */}
              <div className="mt-2 p-2 border rounded bg-gray-50/50 space-y-1.5">
                <div className="flex flex-wrap items-center gap-1">
                  <select
                    value={titleStyles.font_family || 'Inter'}
                    onChange={e => updateTitleStyle('font_family', e.target.value)}
                    className="text-[10px] border rounded px-1 py-0.5 h-6 bg-white"
                  >
                    {FONT_FAMILIES.map(f => <option key={f} value={f}>{f}</option>)}
                  </select>
                  <span className="w-px h-5 bg-border mx-0.5" />
                  <button onClick={() => updateTitleStyle('bold', !effectiveTitle.bold)}
                    className={`w-6 h-6 flex items-center justify-center rounded border text-[10px] ${effectiveTitle.bold ? 'bg-accent text-white border-accent' : 'bg-white hover:bg-gray-100'}`}
                    title="Bold"><Bold className="w-3 h-3" /></button>
                  <button onClick={() => updateTitleStyle('italic', !effectiveTitle.italic)}
                    className={`w-6 h-6 flex items-center justify-center rounded border text-[10px] ${effectiveTitle.italic ? 'bg-accent text-white border-accent' : 'bg-white hover:bg-gray-100'}`}
                    title="Italic"><Italic className="w-3 h-3" /></button>
                  <button onClick={() => updateTitleStyle('underline', !effectiveTitle.underline)}
                    className={`w-6 h-6 flex items-center justify-center rounded border text-[10px] ${effectiveTitle.underline ? 'bg-accent text-white border-accent' : 'bg-white hover:bg-gray-100'}`}
                    title="Underline"><Underline className="w-3 h-3" /></button>
                  <span className="w-px h-5 bg-border mx-0.5" />
                  <button onClick={() => updateTitleStyle('align', 'left')}
                    className={`w-6 h-6 flex items-center justify-center rounded border text-[10px] ${effectiveTitle.align === 'left' || !effectiveTitle.align ? 'bg-accent text-white border-accent' : 'bg-white hover:bg-gray-100'}`}
                    title="Align Left"><AlignLeft className="w-3 h-3" /></button>
                  <button onClick={() => updateTitleStyle('align', 'center')}
                    className={`w-6 h-6 flex items-center justify-center rounded border text-[10px] ${effectiveTitle.align === 'center' ? 'bg-accent text-white border-accent' : 'bg-white hover:bg-gray-100'}`}
                    title="Align Center"><AlignCenter className="w-3 h-3" /></button>
                  <button onClick={() => updateTitleStyle('align', 'right')}
                    className={`w-6 h-6 flex items-center justify-center rounded border text-[10px] ${effectiveTitle.align === 'right' ? 'bg-accent text-white border-accent' : 'bg-white hover:bg-gray-100'}`}
                    title="Align Right"><AlignRight className="w-3 h-3" /></button>
                  <span className="w-px h-5 bg-border mx-0.5" />
                  <div className="flex items-center gap-1">
                    <span className="text-[10px] text-muted-foreground">Color</span>
                    <input
                      type="color"
                      value={effectiveTitle.color || '#000000'}
                      onChange={e => updateTitleStyle('color', e.target.value)}
                      className="w-6 h-6 rounded border cursor-pointer p-0.5"
                    />
                  </div>
                  <span className="w-px h-5 bg-border mx-0.5" />
                  <div className="flex items-center gap-1">
                    <span className="text-[10px] text-muted-foreground">Size</span>
                    <input
                      type="number"
                      value={effectiveTitle.font_size || 18}
                      onChange={e => updateTitleStyle('font_size', parseInt(e.target.value) || 18)}
                      className="w-12 h-6 text-xs border rounded px-1"
                      min="8" max="72"
                    />
                    <span className="text-[10px] text-muted-foreground">px</span>
                  </div>
                </div>
              </div>
            </div>
            <div>
              <Label className="text-xs">Layout</Label>
              <Select value={layout} onValueChange={v => { setLayout(v); onUpdate(section.id, { layout: v }); }}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(LAYOUT_LABELS).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">Text Columns</Label>
              <Select value={String(textColumns)} onValueChange={v => { const n = parseInt(v); setTextColumns(n); onUpdate(section.id, { text_columns: n }); }}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">1 Column</SelectItem>
                  <SelectItem value="2">2 Columns</SelectItem>
                  <SelectItem value="3">3 Columns</SelectItem>
                  <SelectItem value="4">4 Columns</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <Label className="text-xs">Content</Label>
              <div className="flex items-center gap-1">
                <Button variant="outline" size="sm" onClick={() => {
                  const subHeading = '<h3>Sub-heading</h3><p>Your text here...</p>';
                  setContent(prev => prev + subHeading);
                }} className="text-xs gap-1 h-7">
                  <Plus className="w-3 h-3" /> Add Sub-heading
                </Button>
                <Button variant="ghost" size="sm" onClick={handleGenerateSuggestions} disabled={generatingSuggestions} className="text-xs gap-1 h-7">
                  <Sparkles className="w-3 h-3" />{generatingSuggestions ? '...' : 'AI Suggestions'}
                </Button>
              </div>
            </div>
            <ReactQuill 
              theme="snow" 
              value={content} 
              onChange={setContent} 
              modules={QUILL_MODULES}
              formats={QUILL_FORMATS}
              className="bg-white rounded-lg" 
              style={{ minHeight: 280 }} 
            />
            <div className="flex items-center gap-2 mt-1">
              <Button variant="outline" size="sm" onClick={save} className="gap-1 text-xs h-7"><Check className="w-3 h-3" />Apply Content</Button>
              <div className="flex items-center gap-1.5 ml-auto">
                <span className="text-[10px] text-muted-foreground">BG Color</span>
                <input
                  type="color"
                  value={section.content_bg_color || '#ffffff'}
                  onChange={e => onUpdate(section.id, { content_bg_color: e.target.value })}
                  className="w-6 h-6 rounded border cursor-pointer p-0.5"
                />
                {section.content_bg_color && (
                  <button onClick={() => onUpdate(section.id, { content_bg_color: null })} className="text-[10px] text-red-400 hover:text-red-600 flex items-center" title="Remove background">
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>
            </div>
          </div>

          {suggestions && suggestions.length > 0 && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <p className="text-xs font-semibold text-blue-800 mb-2">AI Writing Suggestions</p>
              <ul className="text-xs text-blue-700 space-y-1">
                {suggestions.map((s, i) => <li key={i} className="flex items-start gap-1.5"><span className="font-bold">{i + 1}.</span> {s}</li>)}
              </ul>
            </div>
          )}

          {/* Section Image */}
          <div>
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <Label className="text-xs">Section Image</Label>
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] text-muted-foreground">AI style:</span>
                <Select value={visualCategory} onValueChange={setVisualCategory}>
                  <SelectTrigger className="h-6 text-[10px] w-[130px]"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="infographic">Infographic</SelectItem>
                    <SelectItem value="graph">Graph / Chart</SelectItem>
                    <SelectItem value="chart">Data Chart</SelectItem>
                    <SelectItem value="comparison">Comparison</SelectItem>
                    <SelectItem value="visual_aide">Visual Aide</SelectItem>
                    <SelectItem value="timeline">Timeline</SelectItem>
                    <SelectItem value="diagram">Diagram</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button variant="ghost" size="sm" onClick={handleGenerateVisual} disabled={generatingVisual} className="text-xs gap-1 h-6">
                <Sparkles className="w-3 h-3" />{generatingVisual ? 'Generating...' : 'AI Generate'}
              </Button>
              <button onClick={() => setShowVisualOptions(!showVisualOptions)} className="text-[10px] text-muted-foreground hover:text-accent flex items-center gap-1">
                <Settings2 className="w-3 h-3" />{showVisualOptions ? 'Hide options' : 'More options'}
              </button>
            </div>
            {showVisualOptions && (
              <div className="mb-2 p-3 border rounded-lg bg-slate-50/50 space-y-2.5">
                <div>
                  <Label className="text-[10px] text-muted-foreground">Describe what you want the image to show</Label>
                  <textarea
                    value={visualDescription}
                    onChange={e => setVisualDescription(e.target.value)}
                    placeholder="e.g. A diverse group of community members at a workshop, warm and welcoming atmosphere, natural lighting..."
                    className="w-full mt-1 text-xs border rounded p-2 h-16 resize-none bg-white"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label className="text-[10px] text-muted-foreground">Aspect Ratio / Size</Label>
                    <Select value={visualAspectRatio} onValueChange={setVisualAspectRatio}>
                      <SelectTrigger className="h-7 text-xs mt-1"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="landscape">Landscape (16:9)</SelectItem>
                        <SelectItem value="square">Square (1:1)</SelectItem>
                        <SelectItem value="portrait">Portrait (3:4)</SelectItem>
                        <SelectItem value="wide">Wide banner (2:1)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex flex-col justify-end gap-1.5">
                    <label className="flex items-center gap-1.5 text-[10px]">
                      <input type="checkbox" checked={useTitleContext} onChange={e => setUseTitleContext(e.target.checked)} className="rounded" />
                      Use section title as context
                    </label>
                    <label className="flex items-center gap-1.5 text-[10px]">
                      <input type="checkbox" checked={useContentContext} onChange={e => setUseContentContext(e.target.checked)} className="rounded" />
                      Use section text as context
                    </label>
                  </div>
                </div>
              </div>
            )}
            {imageUrl ? (
              <div className="relative rounded-lg overflow-hidden border bg-slate-100">
                <img src={imageUrl} alt="Section" className="w-full h-40 object-cover" />
                <div className="absolute top-2 right-2 flex gap-1">
                  <button onClick={() => setSectionCropOpen(true)} className="bg-black/60 text-white rounded-full p-1 hover:bg-black/80" title="Crop image">
                    <Crop className="w-3.5 h-3.5" />
                  </button>
                  <button onClick={handleRemoveImage} className="bg-black/60 text-white rounded-full p-1 hover:bg-red-500" title="Remove image">
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <label className="flex flex-col items-center justify-center gap-2 border-2 border-dashed rounded-lg p-6 cursor-pointer hover:border-accent/50 hover:bg-slate-50 transition-colors">
                  {uploadingImage ? (
                    <div className="w-6 h-6 border-2 border-accent/30 border-t-accent rounded-full animate-spin" />
                  ) : (
                    <Upload className="w-5 h-5 text-muted-foreground" />
                  )}
                  <span className="text-xs text-muted-foreground">{uploadingImage ? 'Uploading...' : 'Click to upload image'}</span>
                  <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} disabled={uploadingImage} />
                </label>
                <PasteImageInput onPasteImage={uploadSectionImage} disabled={uploadingImage} />
              </div>
            )}
          </div>
          {imageUrl && (layout === 'image_left' || layout === 'image_right' || layout === 'image_full' || layout === 'image_wrap') && (
            <div className="flex items-center gap-2">
              <Label className="text-xs shrink-0">Image Width</Label>
              <input type="range" min="10" max="100" value={imageWidth} onChange={e => setImageWidth(parseInt(e.target.value))} onMouseUp={() => onUpdate(section.id, { image_width: imageWidth })} onTouchEnd={() => onUpdate(section.id, { image_width: imageWidth })} className="flex-1 h-1 accent-accent" />
              <span className="text-xs text-muted-foreground w-10 text-right">{imageWidth}%</span>
            </div>
          )}
          {imageUrl && (
            <div className="flex items-center gap-2">
              <Label className="text-xs shrink-0">Rotate</Label>
              <Button variant="outline" size="sm" onClick={() => onUpdate(section.id, { image_rotation: ((section.image_rotation || 0) - 90 + 360) % 360 })} className="h-7 px-2 text-xs gap-1"><RotateCcw className="w-3 h-3" />90°</Button>
              <Button variant="outline" size="sm" onClick={() => onUpdate(section.id, { image_rotation: ((section.image_rotation || 0) + 90) % 360 })} className="h-7 px-2 text-xs gap-1"><RotateCw className="w-3 h-3" />90°</Button>
              <span className="text-xs text-muted-foreground">{section.image_rotation || 0}°</span>
              {(section.image_rotation || 0) !== 0 && (
                <button onClick={() => onUpdate(section.id, { image_rotation: 0 })} className="text-[10px] text-muted-foreground hover:text-destructive">reset</button>
              )}
            </div>
          )}
          {imageUrl && (
            <div className="flex items-center gap-2">
              <Label className="text-xs shrink-0">Opacity</Label>
              <input type="range" min="0" max="100" value={section.image_opacity != null ? section.image_opacity : 100} onChange={e => onUpdate(section.id, { image_opacity: parseInt(e.target.value) })} className="flex-1 h-1 accent-accent" />
              <span className="text-xs text-muted-foreground w-10 text-right">{section.image_opacity != null ? section.image_opacity : 100}%</span>
            </div>
          )}
          {imageUrl && (
            <div className="flex items-center gap-2">
              <Label className="text-xs shrink-0">Filter</Label>
              <select value={section.image_filter || 'none'} onChange={e => onUpdate(section.id, { image_filter: e.target.value })} className="text-xs border rounded px-1 py-0.5 h-7 bg-white flex-1">
                {Object.entries(IMAGE_FILTERS).map(([k, f]) => <option key={k} value={k}>{f.label}</option>)}
              </select>
            </div>
          )}
          {imageUrl && (
            <div className="flex items-center gap-2">
              <Label className="text-xs shrink-0">Effects</Label>
              <Button variant={section.image_frame !== false ? 'default' : 'outline'} size="sm" onClick={() => onUpdate(section.id, { image_frame: section.image_frame === false })} className="h-7 px-2 text-xs gap-1"><Frame className="w-3 h-3" />Frame</Button>
              <Button variant={section.image_shadow !== false ? 'default' : 'outline'} size="sm" onClick={() => onUpdate(section.id, { image_shadow: section.image_shadow === false })} className="h-7 px-2 text-xs">Shadow</Button>
            </div>
          )}
          <div>
            <Label className="text-xs">Image Caption</Label>
            <Input value={imageCaption} onChange={e => setImageCaption(e.target.value)} onBlur={() => onUpdate(section.id, { image_caption: imageCaption })} placeholder="Caption text" className="mt-1" />
          </div>

          {/* Photo Gallery & Collage Builder */}
          <SectionGallery section={section} onUpdate={onUpdate} />

          <div className="flex flex-wrap gap-4 text-xs">
            <label className="flex items-center gap-1.5">
              <input type="checkbox" checked={isCollapsible} onChange={e => { setIsCollapsible(e.target.checked); onUpdate(section.id, { is_collapsible: e.target.checked }); }} className="rounded" />
              Collapsible
            </label>
            <label className="flex items-center gap-1.5">
              <input type="checkbox" checked={isExpandedDefault} onChange={e => { setIsExpandedDefault(e.target.checked); onUpdate(section.id, { is_expanded_default: e.target.checked }); }} className="rounded" />
              Expanded by default
            </label>
            <label className="flex items-center gap-1.5">
              <input type="checkbox" checked={hideHeader} onChange={e => { setHideHeader(e.target.checked); onUpdate(section.id, { hide_header: e.target.checked }); }} className="rounded" />
              Hide header on this page
            </label>
            <label className="flex items-center gap-1.5">
              <input type="checkbox" checked={hideFooter} onChange={e => { setHideFooter(e.target.checked); onUpdate(section.id, { hide_footer: e.target.checked }); }} className="rounded" />
              Hide footer on this page
            </label>
            <label className="flex items-center gap-1.5">
              <input type="checkbox" checked={section.fit_to_page || false} onChange={e => onUpdate(section.id, { fit_to_page: e.target.checked })} className="rounded" />
              Fit to one page (scale text to fit)
            </label>
          </div>

          {/* Inline Data & Charts */}
          <div className="border-t pt-3 mt-1">
            <button onClick={handleToggleData} className="flex items-center gap-2 text-xs font-semibold hover:text-accent transition-colors w-full text-left">
              <BarChart3 className="w-3.5 h-3.5" />
              Data &amp; Charts
              {dataEntries.filter(d => d.section_id === section.id).length > 0 && <span className="bg-accent/10 text-accent text-[10px] px-1.5 py-0.5 rounded-full">{dataEntries.filter(d => d.section_id === section.id).length}</span>}
              <span className="ml-auto">{showDataPanel ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}</span>
            </button>
            {showDataPanel && (
              <div className="mt-2 space-y-3">
                {/* Existing chart entries */}
                {dataEntries.filter(d => d.section_id === section.id).map(entry => {
                  const chartConfig = entry.chart_config ? (typeof entry.chart_config === 'string' ? JSON.parse(entry.chart_config) : entry.chart_config) : null;
                  const isEditing = editingChartId === entry.id;
                  
                  if (isEditing) {
                    return (
                      <div key={entry.id} className="border rounded-lg p-3 bg-blue-50/30">
                        <p className="text-xs font-semibold mb-2">Edit {editChartType === 'table' ? 'Table' : 'Chart'}</p>
                        <div className="grid grid-cols-2 gap-2 mb-2">
                          <div>
                            <Label className="text-[10px] text-muted-foreground">Label</Label>
                            <Input value={editChartLabel} onChange={e => setEditChartLabel(e.target.value)} placeholder="Leave empty for no label" className="text-xs h-7" />
                          </div>
                          <div>
                            <Label className="text-[10px] text-muted-foreground">Type</Label>
                            <Select value={editChartType} onValueChange={setEditChartType}>
                              <SelectTrigger className="h-7 text-xs"><SelectValue /></SelectTrigger>
                              <SelectContent>
                                <SelectItem value="bar">Bar Chart</SelectItem>
                                <SelectItem value="line">Line Chart</SelectItem>
                                <SelectItem value="pie">Pie Chart</SelectItem>
                                <SelectItem value="area">Area Chart</SelectItem>
                                <SelectItem value="table">Table</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                        {editChartType === 'table' ? (
                          <div className="mb-2">
                            <div className="flex items-center gap-2 mb-1 text-[10px] text-muted-foreground font-medium">
                              <span className="text-[10px] text-accent font-semibold">Columns:</span>
                              {editTableColumns.map((col, idx) => (
                                <div key={idx} className="flex items-center gap-1 flex-1">
                                  <Input value={col} onChange={e => {
                                    const newCols = [...editTableColumns];
                                    newCols[idx] = e.target.value;
                                    setEditTableColumns(newCols);
                                  }} placeholder={`Column ${idx + 1}`} className="text-xs h-6" />
                                  {editTableColumns.length > 2 && (
                                    <button onClick={() => setEditTableColumns(prev => prev.filter((_, i) => i !== idx))} className="w-5 h-5 flex items-center justify-center rounded text-red-400 hover:text-red-600 hover:bg-red-50">
                                      <X className="w-3 h-3" />
                                    </button>
                                  )}
                                </div>
                              ))}
                              <button onClick={() => setEditTableColumns(prev => [...prev, `Column ${prev.length + 1}`])} className="w-6 h-6 flex items-center justify-center rounded text-accent hover:bg-accent/10">
                                <Plus className="w-3 h-3" />
                              </button>
                            </div>
                            <div className="space-y-1 mt-2">
                              {editChartRows.map((row, rowIdx) => (
                                <div key={rowIdx} className="flex items-center gap-2">
                                  {editTableColumns.map((col, colIdx) => (
                                    <Input key={colIdx} value={row.columns?.[col] || ''} onChange={e => {
                                      const newRow = { ...row, columns: { ...row.columns, [col]: e.target.value } };
                                      setEditChartRows(prev => prev.map((r, i) => i === rowIdx ? newRow : r));
                                    }} placeholder={col} className="text-xs h-7 flex-1" />
                                  ))}
                                  {editChartRows.length > 1 && (
                                    <button onClick={() => setEditChartRows(prev => prev.filter((_, i) => i !== rowIdx))} className="w-6 h-6 flex items-center justify-center rounded text-red-400 hover:text-red-600 hover:bg-red-50">
                                      <X className="w-3 h-3" />
                                    </button>
                                  )}
                                </div>
                              ))}
                            </div>
                            <button onClick={() => setEditChartRows(prev => [...prev, {}])} className="flex items-center gap-1 text-[10px] text-accent hover:underline mt-2">
                              <Plus className="w-3 h-3" />Add Row
                            </button>
                          </div>
                        ) : (
                          <div className="mb-2">
                            <div className="flex items-center gap-2 mb-1 text-[10px] text-muted-foreground font-medium">
                              <span className="flex-1">Label</span>
                              <span className="w-20">Value</span>
                              <span className="w-6" />
                            </div>
                            {editChartRows.map((row, idx) => (
                              <div key={idx} className="flex items-center gap-2 mb-1">
                                <Input value={row.name} onChange={e => setEditChartRows(prev => prev.map((r, i) => i === idx ? { ...r, name: e.target.value } : r))} placeholder={`Data point ${idx + 1}`} className="flex-1 text-xs h-7" />
                                <Input type="number" value={row.value} onChange={e => setEditChartRows(prev => prev.map((r, i) => i === idx ? { ...r, value: e.target.value } : r))} placeholder="0" className="w-20 text-xs h-7" />
                                {editChartRows.length > 2 && (
                                  <button onClick={() => setEditChartRows(prev => prev.filter((_, i) => i !== idx))} className="w-6 h-6 flex items-center justify-center rounded text-red-400 hover:text-red-600 hover:bg-red-50">
                                    <X className="w-3 h-3" />
                                  </button>
                                )}
                                {editChartRows.length <= 2 && <span className="w-6" />}
                              </div>
                            ))}
                            <button onClick={() => setEditChartRows(prev => [...prev, { name: '', value: '' }])} className="flex items-center gap-1 text-[10px] text-accent hover:underline">
                              <Plus className="w-3 h-3" />Add Row
                            </button>
                          </div>
                        )}
                        <div className="flex gap-2 mt-2">
                          <Button onClick={handleSaveEditChart} size="sm" className="gap-1 text-xs h-7" disabled={!editChartLabel.trim() && editChartType !== 'table'}>
                            <Check className="w-3 h-3" />Save Changes
                          </Button>
                          <Button variant="outline" onClick={handleCancelEdit} size="sm" className="text-xs h-7">Cancel</Button>
                        </div>
                      </div>
                    );
                  }
                  
                  return (
                    <div key={entry.id} className="border rounded-lg p-3 bg-slate-50">
                      <div className="flex items-center justify-between mb-2">
                        <div>
                          <p className="text-sm font-semibold">{entry.label}</p>
                          <p className="text-[10px] text-muted-foreground">{entry.data_type === 'file_upload' ? `File: ${entry.source_file_name}` : 'Manual chart'}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button variant="ghost" size="sm" onClick={() => handleEditChart(entry)} className="text-xs gap-1 h-6">
                            <Settings2 className="w-3 h-3" />Edit
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => handleDeleteChart(entry.id)} className="text-xs gap-1 h-6 text-red-400 hover:text-red-600">
                            <Trash2 className="w-3 h-3" />Delete
                          </Button>
                          {entry.data_type === 'file_upload' && entry.status !== 'analyzed' && (
                            <Button variant="outline" size="sm" onClick={() => handleAnalyze(entry.id)} disabled={analyzing[entry.id]} className="gap-1 text-[10px] h-6">
                              <Sparkles className="w-3 h-3" />{analyzing[entry.id] ? '...' : 'Analyze'}
                            </Button>
                          )}
                          {entry.status === 'analyzed' && <span className="text-[10px] bg-green-100 text-green-700 px-1.5 py-0.5 rounded-full">Ready</span>}
                        </div>
                      </div>
                      {chartConfig && <ChartRenderer chartConfig={chartConfig} branding={branding} />}
                      {entry.ai_narrative && <p className="text-xs text-slate-700 mt-2">{entry.ai_narrative}</p>}
                    </div>
                  );
                })}

                {/* New chart builder */}
                <div className="border rounded-lg p-3 bg-blue-50/30">
                  <p className="text-xs font-semibold mb-2">Add a {chartType === 'table' ? 'Table' : 'Chart'}</p>

                  <div className="grid grid-cols-2 gap-2 mb-2">
                    <div>
                      <Label className="text-[10px] text-muted-foreground">Label</Label>
                      <Input value={chartLabel} onChange={e => setChartLabel(e.target.value)} placeholder={chartType === 'table' ? "e.g. Program Summary" : "e.g. Program Stats"} className="text-xs h-7" />
                    </div>
                    <div>
                      <Label className="text-[10px] text-muted-foreground">Type</Label>
                      <Select value={chartType} onValueChange={(v) => {
                        setChartType(v);
                        if (v === 'table' && chartRows.length < 2) {
                          setTableColumns(['Item', 'Value']);
                        }
                      }}>
                        <SelectTrigger className="h-7 text-xs"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="bar">Bar Chart</SelectItem>
                          <SelectItem value="line">Line Chart</SelectItem>
                          <SelectItem value="pie">Pie Chart</SelectItem>
                          <SelectItem value="area">Area Chart</SelectItem>
                          <SelectItem value="table">Table</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {chartType === 'table' ? (
                    // Table input mode
                    <div className="mb-2">
                      {/* Column headers */}
                      <div className="flex items-center gap-2 mb-1 text-[10px] text-muted-foreground font-medium">
                        <span className="text-[10px] text-accent font-semibold">Columns:</span>
                        {tableColumns.map((col, idx) => (
                          <div key={idx} className="flex items-center gap-1 flex-1">
                            <Input
                              value={col}
                              onChange={e => updateTableColumn(idx, e.target.value)}
                              placeholder={`Column ${idx + 1}`}
                              className="text-xs h-6"
                            />
                            {tableColumns.length > 2 && (
                              <button onClick={() => removeTableColumn(idx)} className="w-5 h-5 flex items-center justify-center rounded text-red-400 hover:text-red-600 hover:bg-red-50">
                                <X className="w-3 h-3" />
                              </button>
                            )}
                          </div>
                        ))}
                        <button onClick={addTableColumn} className="w-6 h-6 flex items-center justify-center rounded text-accent hover:bg-accent/10">
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>
                      {/* Data rows */}
                      <div className="space-y-1 mt-2">
                        {chartRows.map((row, rowIdx) => (
                          <div key={rowIdx} className="flex items-center gap-2">
                            {tableColumns.map((col, colIdx) => (
                              <Input
                                key={colIdx}
                                value={row.columns?.[col] || ''}
                                onChange={e => updateTableCell(rowIdx, colIdx, e.target.value)}
                                placeholder={col}
                                className="text-xs h-7 flex-1"
                              />
                            ))}
                            {chartRows.length > 1 && (
                              <button onClick={() => {
                                setChartRows(prev => prev.filter((_, i) => i !== rowIdx));
                              }} className="w-6 h-6 flex items-center justify-center rounded text-red-400 hover:text-red-600 hover:bg-red-50">
                                <X className="w-3 h-3" />
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                      <button onClick={() => setChartRows(prev => [...prev, {}])} className="flex items-center gap-1 text-[10px] text-accent hover:underline mt-2">
                        <Plus className="w-3 h-3" />Add Row
                      </button>
                    </div>
                  ) : (
                    // Chart input mode (2 columns)
                    <div className="mb-2">
                      <div className="flex items-center gap-2 mb-1 text-[10px] text-muted-foreground font-medium">
                        <span className="flex-1">Label</span>
                        <span className="w-20">Value</span>
                        <span className="w-6" />
                      </div>
                      {chartRows.map((row, idx) => (
                        <div key={idx} className="flex items-center gap-2 mb-1">
                          <Input
                            value={row.name}
                            onChange={e => updateChartRow(idx, 'name', e.target.value)}
                            placeholder={`Data point ${idx + 1}`}
                            className="flex-1 text-xs h-7"
                          />
                          <Input
                            type="number"
                            value={row.value}
                            onChange={e => updateChartRow(idx, 'value', e.target.value)}
                            placeholder="0"
                            className="w-20 text-xs h-7"
                          />
                          {chartRows.length > 2 && (
                            <button onClick={() => removeChartRow(idx)} className="w-6 h-6 flex items-center justify-center rounded text-red-400 hover:text-red-600 hover:bg-red-50">
                              <X className="w-3 h-3" />
                            </button>
                          )}
                          {chartRows.length <= 2 && <span className="w-6" />}
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="flex items-center gap-2">
                    {chartType !== 'table' && (
                      <button onClick={addChartRow} className="flex items-center gap-1 text-[10px] text-accent hover:underline">
                        <Plus className="w-3 h-3" />Add Row
                      </button>
                    )}
                    <button onClick={() => setShowPasteData(!showPasteData)} className="flex items-center gap-1 text-[10px] text-accent hover:underline">
                      <Plus className="w-3 h-3" /> Paste Data
                    </button>
                    <label className="flex items-center gap-1 text-[10px] text-accent hover:underline cursor-pointer">
                      {importingFile ? (
                        <><div className="w-3 h-3 border-2 border-accent/30 border-t-accent rounded-full animate-spin" />Parsing...</>
                      ) : (
                        <><Upload className="w-3 h-3" />Import from Excel/CSV</>
                      )}
                      <input type="file" accept=".csv,.xlsx,.xls" className="hidden" onChange={handleImportSpreadsheet} disabled={importingFile} />
                    </label>
                    <div className="flex-1" />
                    <Button 
                      onClick={handleSaveChart} 
                      disabled={
                        !chartLabel.trim() || 
                        (chartType === 'table' 
                          ? chartRows.filter(r => r.columns && Object.keys(r.columns).length > 0).length === 0
                          : chartRows.filter(r => r.name.trim() && r.value !== '').length === 0
                        )
                      } 
                      size="sm" 
                      className="gap-1 text-xs h-7"
                    >
                      <Check className="w-3 h-3" />Save {chartType === 'table' ? 'Table' : 'Chart'}
                    </Button>
                  </div>

                  {showPasteData && (
                    <div className="mt-2 p-3 border rounded-lg bg-slate-50">
                      <p className="text-xs font-semibold mb-2">Paste your data (from Excel, Google Sheets, etc.)</p>
                      <p className="text-[10px] text-muted-foreground mb-2">
                        {chartType === 'table' 
                          ? 'Paste from Excel/Google Sheets with multiple columns (headers auto-detected)'
                          : 'Paste two columns: Label and Value'}
                      </p>
                      <textarea
                        value={pasteDataValue}
                        onChange={e => setPasteDataValue(e.target.value)}
                        placeholder={
                          chartType === 'table'
                            ? 'Program\tParticipants\tCompleted\tEmployed\nPathways\t45\t38\t32\nDEA\t62\t55\t48'
                            : 'Program A\t45\nProgram B\t62\nProgram C\t38'
                        }
                        className="w-full text-xs border rounded p-2 h-32 font-mono bg-white"
                      />
                      <div className="flex gap-2 mt-2">
                        <Button onClick={handlePasteData} size="sm" className="gap-1 text-xs h-7">
                          <Check className="w-3 h-3" /> Parse Data
                        </Button>
                        <Button variant="outline" onClick={() => { setShowPasteData(false); setPasteDataValue(''); }} size="sm" className="text-xs h-7">
                          Cancel
                        </Button>
                      </div>
                    </div>
                  )}
                </div>

                {/* File upload for auto-analysis */}
                <div className="border-t pt-2">
                  <label className="flex items-center gap-1 text-xs text-muted-foreground hover:text-accent transition-colors cursor-pointer">
                    <Upload className="w-3 h-3" />Or upload a file for AI analysis
                    <input type="file" accept=".csv,.xlsx,.json,.pdf" className="hidden" onChange={handleDataFileUpload} />
                  </label>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}