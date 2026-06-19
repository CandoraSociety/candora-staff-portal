import React, { useState, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate, Link } from "react-router-dom";
import { toast } from "sonner";
import { Loader2, Plus, SortAsc, Grid, List, Upload, FolderOpen, Globe, User, Shield, DollarSign, Building2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import FileCard from "@/components/files/FileCard";
import FileListItem from "@/components/files/FileListItem";
import FileFilters from "@/components/files/FileFilters";
import SearchBar from "@/components/files/SearchBar";
import FileSortingDialog from "@/components/files/FileSortingDialog";
import { canAccessFile } from "@/lib/fileHelpers";
import { useAuth } from "@/lib/AuthContext";
import { FilePermissionsContext } from "@/components/filemanager/FileManagerLayout";
import { useContext } from "react";

export default function FileBrowser() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const urlParams = new URLSearchParams(window.location.search);
  const initialAccess = urlParams.get("access") || "all";
  const [viewMode, setViewMode] = useState("grid");
  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState({ fileType: "all", category: "all", access: initialAccess, sort: "-created_date" });
  const [showSorting, setShowSorting] = useState(false);
  const [filesToSort, setFilesToSort] = useState([]);

  const queryClient = useQueryClient();
  const { grantedFileLevels = [], isAdmin = false } = useContext(FilePermissionsContext);

  const { data: files = [], isLoading, refetch } = useQuery({
    queryKey: ["files", filters, search, grantedFileLevels],
    queryFn: async () => {
      const allFiles = await base44.entities.File.list("-created_date", 1000);
      return allFiles.filter((f) => canAccessFile(f, user, grantedFileLevels));
    },
    enabled: !!user,
  });

  const deleteFileMutation = useMutation({
    mutationFn: (id) => base44.entities.File.delete(id),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["files"] }); toast.success("File deleted"); },
  });

  const handleDelete = (file) => {
    if (window.confirm(`Delete "${file.display_name || file.original_name}"?`)) {
      deleteFileMutation.mutate(file.id);
    }
  };

  const unsortedFiles = useMemo(() => files.filter((f) => f.category === "to_be_sorted"), [files]);

  const accessLabels = {
    all: "All Files",
    universal: "Universal Files",
    personal: "My Files",
    manager: "Manager Files",
    finance: "Finance Files",
    corporate: "Corporate Files",
  };

  const filteredFiles = useMemo(() => {
    let result = [...files];
    if (search) {
      const q = search.toLowerCase();
      result = result.filter((f) => (f.display_name || f.original_name || "").toLowerCase().includes(q) || (f.description || "").toLowerCase().includes(q));
    }
    if (filters.fileType !== "all") {
      const exts = { pdf: ["pdf"], doc: ["doc", "docx"], xls: ["xls", "xlsx"], ppt: ["ppt", "pptx"], image: ["png", "jpg", "jpeg", "gif", "webp", "svg"] };
      const allowedExts = exts[filters.fileType] || [];
      result = result.filter((f) => {
        const ext = (f.file_type || f.original_name?.split(".").pop()?.toLowerCase() || "");
        return allowedExts.includes(ext);
      });
    }
    if (filters.category !== "all") result = result.filter((f) => f.category === filters.category);
    if (filters.access !== "all") result = result.filter((f) => f.access_level === filters.access);
    const sortKey = filters.sort.replace("-", "");
    const desc = filters.sort.startsWith("-");
    result.sort((a, b) => {
      if (sortKey === "created_date") return desc ? new Date(b.created_date) - new Date(a.created_date) : new Date(a.created_date) - new Date(b.created_date);
      return 0;
    });
    return result;
  }, [files, search, filters]);

  if (isLoading) return <div className="fixed inset-0 flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin" /></div>;

  return (
    <div className="p-6 max-w-[1600px] mx-auto space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold">{accessLabels[filters.access] || "All Files"}</h1>
          <p className="text-sm text-muted-foreground mt-1">{filteredFiles.length} files{unsortedFiles.length > 0 && ` · ${unsortedFiles.length} need sorting`}</p>
        </div>
        <div className="flex items-center gap-2">
          {unsortedFiles.length > 0 && (
            <Button variant="outline" size="sm" onClick={() => { setFilesToSort(unsortedFiles); setShowSorting(true); }}>
              <SortAsc className="h-4 w-4 mr-1" /> Sort {unsortedFiles.length}
            </Button>
          )}
          <Link to="/filemanager/upload"><Button className="gap-2"><Plus className="h-4 w-4" /> Upload File</Button></Link>
        </div>
      </div>

      <div className="flex items-center gap-4 flex-wrap">
        <SearchBar value={search} onChange={setSearch} placeholder="Search files..." />
        <FileFilters filters={filters} onFilterChange={setFilters} />
        <div className="ml-auto flex items-center gap-1 border rounded-lg p-1">
          <button onClick={() => setViewMode("grid")} className={`h-8 px-3 rounded-md text-sm ${viewMode === "grid" ? "bg-primary text-primary-foreground" : "hover:bg-muted"}`}><Grid className="h-4 w-4" /></button>
          <button onClick={() => setViewMode("list")} className={`h-8 px-3 rounded-md text-sm ${viewMode === "list" ? "bg-primary text-primary-foreground" : "hover:bg-muted"}`}><List className="h-4 w-4" /></button>
        </div>
      </div>

      {filteredFiles.length === 0 ? (
        <div className="text-center py-16"><p className="text-muted-foreground">No files found.</p><Link to="/filemanager/upload"><Button className="mt-4 gap-2"><Upload className="h-4 w-4" /> Upload File</Button></Link></div>
      ) : viewMode === "grid" ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">{filteredFiles.map((file, i) => <FileCard key={file.id} file={file} onDelete={handleDelete} index={i} />)}</div>
      ) : (
        <div className="space-y-2">{filteredFiles.map((file, i) => <FileListItem key={file.id} file={file} onDelete={handleDelete} index={i} />)}</div>
      )}

      <FileSortingDialog files={filesToSort} open={showSorting} onOpenChange={(v) => { setShowSorting(v); if (!v) refetch(); }} />
    </div>
  );
}