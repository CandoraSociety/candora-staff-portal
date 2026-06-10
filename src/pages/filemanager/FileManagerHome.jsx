import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Files, StickyNote, FolderOpen, HardDrive } from "lucide-react";
import StatCard from "@/components/dashboard/StatCard";
import RecentFiles from "@/components/dashboard/RecentFiles";
import RecentNotes from "@/components/dashboard/RecentNotes";
import CategoryBreakdown from "@/components/dashboard/CategoryBreakdown";
import SortingTasksBanner from "@/components/dashboard/SortingTasksBanner";
import { Card, CardContent } from "@/components/ui/card";

function formatFileSize(bytes) {
  if (!bytes) return "0 B";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function FileManagerHome() {
  const [user, setUser] = useState(null);
  const [files, setFiles] = useState([]);
  const [notes, setNotes] = useState([]);
  const [collections, setCollections] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
    Promise.all([
      base44.entities.File.list("-created_date", 50),
      base44.entities.Note.list("-created_date", 10),
      base44.entities.Collection.filter({ status: "active" }),
      base44.entities.FileCategory.list(),
    ]).then(([f, n, c, cats]) => {
      setFiles(f);
      setNotes(n);
      setCollections(c);
      setCategories(cats);
    }).finally(() => setLoading(false));
  }, []);

  const myFiles = user ? files.filter(f =>
    f.access_level !== "personal" || f.owner_email === user.email
  ) : files;

  const unsortedFiles = myFiles.filter(f => !f.category || f.category === "");
  const totalSize = myFiles.reduce((sum, f) => sum + (f.file_size || 0), 0);

  return (
    <div className="max-w-screen-xl mx-auto px-6 py-8 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-800">
          {user ? `${user.full_name?.split(" ")[0]}'s File Manager` : "File Manager"}
        </h1>
        <p className="text-slate-500 text-sm mt-1">Your centralized cloud storage portal</p>
      </div>

      {/* Sorting Banner */}
      {unsortedFiles.length > 0 && (
        <Card className="border-amber-200 bg-amber-50 overflow-hidden p-0">
          <CardContent className="p-0">
            <SortingTasksBanner count={unsortedFiles.length} files={unsortedFiles} />
          </CardContent>
        </Card>
      )}

      {/* Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard title="Total Files" value={loading ? "—" : myFiles.length} icon={Files} href="/filemanager/files" />
        <StatCard title="Notes" value={loading ? "—" : notes.length} icon={StickyNote} href="/filemanager/notes" />
        <StatCard title="Collections" value={loading ? "—" : collections.length} icon={FolderOpen} href="/filemanager/collections" />
        <StatCard title="Storage Used" value={loading ? "—" : formatFileSize(totalSize)} icon={HardDrive} />
      </div>

      {/* Main Content Grid */}
      <div className="grid md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-6">
          <RecentFiles files={myFiles} />
          <RecentNotes notes={notes} />
        </div>
        <div>
          <CategoryBreakdown files={myFiles} categories={categories} />
        </div>
      </div>
    </div>
  );
}