import React, { useState, useRef, useCallback, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate, useLocation } from "react-router-dom";
import { toast } from "sonner";
import { useAuth } from "@/lib/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  ChevronLeft, Download, Save, Share2, Upload, FileText, Image as ImageIcon,
  ZoomIn, ZoomOut, LayoutTemplate, Palette, Undo2, Redo2, Trash2
} from "lucide-react";
import { DRAW_TOOLS, IMAGE_EXTS, COLORS, HIGHLIGHT_COLORS, SIZES } from "@/lib/editorConstants";
import { getFileExtension, generateStandardizedName } from "@/lib/fileHelpers";
import SignatureDialog from "@/components/files/SignatureDialog";
import SaveVaultDialog from "@/components/files/SaveVaultDialog";
import ShareDialog from "@/components/files/ShareDialog";
import DocumentOverlayPanel from "@/components/editor/DocumentOverlayPanel";
import EditorToolbar from "@/components/editor/EditorToolbar";
import EditorCanvas from "@/components/editor/EditorCanvas";
import EditorToolsPanel from "@/components/editor/EditorToolsPanel";
import EditorMobileToolbar from "@/components/editor/EditorMobileToolbar";

export default function FileEditor() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const fileId = new URLSearchParams(location.search).get("id");
  const [mode, setMode] = useState(fileId ? "loading" : "select");
  const [sourceFile, setSourceFile] = useState(null);
  const [fileKind, setFileKind] = useState(null);
  const [docUrl, setDocUrl] = useState(null);

  const canvasRef = useRef(null);
  const overlayCanvasRef = useRef(null);
  const imageRef = useRef(null);
  const [ctx, setCtx] = useState(null);
  const [tool, setTool] = useState("pen");
  const [color, setColor] = useState("#000000");
  const [size, setSize] = useState(4);
  const [history, setHistory] = useState([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [zoom, setZoom] = useState(1);

  const [drawing, setDrawing] = useState(false);
  const [startPos, setStartPos] = useState({ x: 0, y: 0 });
  const [textInput, setTextInput] = useState("");
  const [textPos, setTextPos] = useState(null);
  const [stickyText, setStickyText] = useState("");
  const [rightPanel, setRightPanel] = useState("tools");
  const [showMobilePanel, setShowMobilePanel] = useState(false);

  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [showShareDialog, setShowShareDialog] = useState(false);
  const [showSignatureDialog, setShowSignatureDialog] = useState(false);

  const { data: vaultFile } = useQuery({
    queryKey: ["file", fileId],
    queryFn: () => base44.entities.File.filter({ id: fileId }).then((r) => r[0]),
    enabled: !!fileId,
  });

  const { data: allFiles = [] } = useQuery({
    queryKey: ["files"],
    queryFn: () => base44.entities.File.list("-created_date", 500),
    enabled: mode === "select",
  });

  const openFile = useCallback((url, fileMeta) => {
    const ext = getFileExtension(fileMeta?.original_name || url);
    if (IMAGE_EXTS.includes(ext)) {
      setMode("loading");
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => {
        imageRef.current = img;
        initCanvas(img, fileMeta);
      };
      img.onerror = () => {
        toast.error("Could not load image.");
        setMode("select");
      };
      img.src = url;
    } else {
      setDocUrl(url);
      setSourceFile(fileMeta);
      setFileKind("document");
      setMode("editing");
    }
  }, [initCanvas]);

  const initCanvas = useCallback((img, fileMeta) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.width = img.naturalWidth || img.width;
    canvas.height = img.naturalHeight || img.height;
    const context = canvas.getContext("2d");
    context.drawImage(img, 0, 0);
    setCtx(context);
    const data = context.getImageData(0, 0, canvas.width, canvas.height);
    setHistory([data]);
    setHistoryIndex(0);
    setSourceFile(fileMeta);
    setFileKind("image");
    setMode("editing");
  }, []);

  useEffect(() => {
    if (vaultFile && mode === "loading") {
      openFile(vaultFile.file_url, vaultFile);
    }
  }, [vaultFile, mode, openFile]);

  const loadLocalFile = (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    openFile(URL.createObjectURL(f), {
      original_name: f.name,
      display_name: f.name.replace(/\.[^/.]+$/, ""),
      category: "general",
    });
  };

  const pushHistory = useCallback((context, canvas) => {
    const data = context.getImageData(0, 0, canvas.width, canvas.height);
    setHistory((prev) => {
      const h = prev.slice(0, historyIndex + 1);
      h.push(data);
      setHistoryIndex(h.length - 1);
      return h;
    });
  }, [historyIndex]);

  const undo = () => {
    if (!ctx || historyIndex <= 0) return;
    const ni = historyIndex - 1;
    ctx.putImageData(history[ni], 0, 0);
    setHistoryIndex(ni);
  };

  const redo = () => {
    if (!ctx || historyIndex >= history.length - 1) return;
    const ni = historyIndex + 1;
    ctx.putImageData(history[ni], 0, 0);
    setHistoryIndex(ni);
  };

  const clearCanvas = () => {
    const canvas = fileKind === "image" ? canvasRef.current : overlayCanvasRef.current;
    if (!ctx || !canvas) return;
    if (fileKind === "image" && imageRef.current) {
      ctx.drawImage(imageRef.current, 0, 0);
    } else {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
    pushHistory(ctx, canvas);
  };

  const handleSaveToVault = async ({ saveName, saveCategory, saveAccess }) => {
    const canvas = fileKind === "image" ? canvasRef.current : overlayCanvasRef.current;
    if (!canvas) return;
    const blob = await new Promise((r) => canvas.toBlob(r, "image/png"));
    const file = new File([blob], `${saveName || "edited-file"}.png`, { type: "image/png" });

    const { file_url } = await base44.integrations.Core.UploadFile({ file });

    await base44.entities.File.create({
      original_name: file.name,
      display_name: saveName || file.name,
      standardized_name: generateStandardizedName(file.name, saveCategory, saveAccess),
      file_url,
      file_type: "png",
      file_size: file.size,
      category: saveCategory,
      access_level: saveAccess,
      owner_email: user?.email,
      owner_name: user?.full_name,
      description: `Annotated version${sourceFile ? " of: " + (sourceFile.display_name || sourceFile.original_name) : ""}`,
      keywords: ["edited", "annotated"],
    });

    queryClient.invalidateQueries({ queryKey: ["files"] });
    toast.success("Saved to vault!");
    setShowSaveDialog(false);
  };

  const downloadEdited = () => {
    const canvas = fileKind === "image" ? canvasRef.current : overlayCanvasRef.current;
    if (!canvas) return;
    const link = document.createElement("a");
    link.download = (sourceFile?.display_name || "edited-file") + ".png";
    link.href = canvas.toDataURL("image/png");
    link.click();
  };

  const applySignature = (dataUrl) => {
    const canvas = fileKind === "image" ? canvasRef.current : overlayCanvasRef.current;
    if (!ctx || !canvas) return;
    const img = new Image();
    img.onload = () => {
      const sigW = Math.min(canvas.width * 0.35, 280);
      const sigH = (img.height / img.width) * sigW;
      ctx.drawImage(img, canvas.width - sigW - 24, canvas.height - sigH - 24, sigW, sigH);
      pushHistory(ctx, canvas);
    };
    img.src = dataUrl;
  };

  const addText = () => {
    const canvas = fileKind === "image" ? canvasRef.current : overlayCanvasRef.current;
    if (!ctx || !textInput || !textPos) return;
    ctx.fillStyle = color;
    ctx.font = `${(size * 4 + 12)}px Inter, sans-serif`;
    ctx.fillText(textInput, textPos.x, textPos.y);
    pushHistory(ctx, canvas);
    setTextInput("");
    setTextPos(null);
  };

  if (mode === "select") {
    return (
      <div className="min-h-screen bg-background">
        <div className="border-b bg-card px-6 py-4">
          <Button variant="ghost" onClick={() => navigate(-1)} className="gap-2">
            <ChevronLeft className="h-4 w-4" />
            Back
          </Button>
        </div>
        <div className="flex-1 flex items-center justify-center p-8">
          <div className="max-w-lg w-full space-y-6">
            <div className="text-center">
              <h2 className="text-xl font-bold mb-1">Open a File to Edit</h2>
              <p className="text-sm text-muted-foreground">
                All file types support annotations, drawing, text, highlights, watermarks, headers, footers and signatures.
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <label className="cursor-pointer">
                <input
                  type="file"
                  accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.csv"
                  className="hidden"
                  onChange={loadLocalFile}
                />
                <div className="border-2 border-dashed border-border rounded-xl p-6 text-center hover:border-primary/40 transition-colors">
                  <Upload className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                  <p className="font-medium text-sm">Upload from Device</p>
                  <p className="text-xs text-muted-foreground mt-1">Images & documents</p>
                </div>
              </label>
              <div className="border rounded-xl p-4 space-y-2 max-h-64 overflow-y-auto">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">From Vault</p>
                {allFiles.map((f) => {
                  const ext = getFileExtension(f.original_name);
                  return (
                    <button
                      key={f.id}
                      onClick={() => openFile(f.file_url, f)}
                      className="w-full text-left flex items-center gap-2 p-2 rounded-lg hover:bg-muted transition-colors"
                    >
                      {IMAGE_EXTS.includes(ext) ? <ImageIcon className="h-4 w-4" /> : <FileText className="h-4 w-4" />}
                      <span className="text-sm truncate">{f.display_name || f.original_name}</span>
                      <span className="text-xs text-muted-foreground uppercase ml-auto">{ext}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (mode === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent mb-4" />
          <p className="text-muted-foreground">Loading file...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <div className="h-14 border-b bg-card flex items-center justify-between px-4 shrink-0">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <div>
            <p className="font-semibold text-sm">{sourceFile?.display_name || sourceFile?.original_name || "Untitled"}</p>
            <p className="text-xs text-muted-foreground">
              {tool === "scroll" ? "Scroll mode" : DRAW_TOOLS.find((t) => t.id === tool)?.label}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setShowShareDialog(true)}>
            <Share2 className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={downloadEdited}>
            <Download className="h-4 w-4" />
          </Button>
          <Button size="sm" onClick={() => setShowSaveDialog(true)}>
            <Save className="h-4 w-4 mr-2" />
            Save to Vault
          </Button>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Left Toolbar (Desktop) */}
        <EditorToolbar
          tool={tool}
          setTool={setTool}
          setShowSignatureDialog={setShowSignatureDialog}
          undo={undo}
          redo={redo}
          clearCanvas={clearCanvas}
        />

        {/* Center Canvas */}
        <EditorCanvas
          fileKind={fileKind}
          docUrl={docUrl}
          zoom={zoom}
          canvasRef={canvasRef}
          overlayCanvasRef={overlayCanvasRef}
          tool={tool}
          color={color}
          size={size}
          drawing={drawing}
          startPos={startPos}
          setDrawing={setDrawing}
          setStartPos={setStartPos}
          pushHistory={pushHistory}
        />

        {/* Right Panel (Desktop) */}
        <EditorToolsPanel
          rightPanel={rightPanel}
          setRightPanel={setRightPanel}
          tool={tool}
          color={color}
          setColor={setColor}
          size={size}
          setSize={setSize}
          zoom={zoom}
          setZoom={setZoom}
          textInput={textInput}
          setTextInput={setTextInput}
          stickyText={stickyText}
          setStickyText={setStickyText}
          addText={addText}
          fileKind={fileKind}
          ctx={ctx}
          canvas={fileKind === "image" ? canvasRef.current : overlayCanvasRef.current}
          pushHistory={pushHistory}
        />
      </div>

      {/* Mobile Floating Toolbar */}
      <EditorMobileToolbar
        tool={tool}
        setTool={setTool}
        setShowSignatureDialog={setShowSignatureDialog}
        undo={undo}
        redo={redo}
        clearCanvas={clearCanvas}
        showMobilePanel={showMobilePanel}
        setShowMobilePanel={setShowMobilePanel}
        color={color}
        setColor={setColor}
        size={size}
        setSize={setSize}
      />

      <SignatureDialog
        open={showSignatureDialog}
        onOpenChange={setShowSignatureDialog}
        onApply={applySignature}
      />
      <SaveVaultDialog
        open={showSaveDialog}
        onOpenChange={setShowSaveDialog}
        onSave={handleSaveToVault}
        defaultName={sourceFile?.display_name ? `${sourceFile.display_name}_edited` : "edited-file"}
      />
      <ShareDialog
        open={showShareDialog}
        onOpenChange={setShowShareDialog}
        file={sourceFile}
      />
    </div>
  );
}