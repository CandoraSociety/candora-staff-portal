import React, { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { useNavigate } from "react-router-dom";
import { Search, X, FileText } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { canAccessFile, getFileExtension, getFileTypeStyle, formatFileSize } from "@/lib/fileHelpers";

export default function SearchPage() {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [filters, setFilters] = useState({ category: "all", access: "all" });

  const { data: allFiles = [] } = useQuery({
    queryKey: ["all-files-search"],
    queryFn: () => base44.entities.File.list("-created_date", 2000),
  });

  const user = base44.auth.me();

  const accessibleFiles = useMemo(() => 
    allFiles.filter((f) => canAccessFile(f, user)), 
    [allFiles, user]
  );

  const results = useMemo(() => {
    if (!query.trim()) return [];
    const q = query.toLowerCase().trim();
    return accessibleFiles.filter((f) => {
      const matchesQuery =
        (f.display_name || f.original_name || "").toLowerCase().includes(q) ||
        (f.description || "").toLowerCase().includes(q) ||
        (f.summary || "").toLowerCase().includes(q) ||
        (f.keywords || []).some((k) => k.toLowerCase().includes(q));

      const matchesCategory = filters.category === "all" || f.category === filters.category;
      const matchesAccess = filters.access === "all" || f.access_level === filters.access;

      return matchesQuery && matchesCategory && matchesAccess;
    });
  }, [query, accessibleFiles, filters]);

  const clearSearch = () => {
    setQuery("");
    setFilters({ category: "all", access: "all" });
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-5xl mx-auto">
        {/* Search Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-6">Search Files</h1>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search by filename, description, summary, or keywords..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="pl-10 pr-10 h-12 text-lg"
              autoFocus
            />
            {query && (
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8"
                onClick={clearSearch}
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>

        {/* Filters */}
        {query && (
          <div className="flex gap-4 mb-6">
            <Select
              value={filters.category}
              onValueChange={(value) => setFilters({ ...filters, category: value })}
            >
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                <SelectItem value="finance">Finance</SelectItem>
                <SelectItem value="hr">HR</SelectItem>
                <SelectItem value="operations">Operations</SelectItem>
                <SelectItem value="legal">Legal</SelectItem>
                <SelectItem value="marketing">Marketing</SelectItem>
                <SelectItem value="general">General</SelectItem>
              </SelectContent>
            </Select>

            <Select
              value={filters.access}
              onValueChange={(value) => setFilters({ ...filters, access: value })}
            >
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Access Level" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Access</SelectItem>
                <SelectItem value="universal">Universal</SelectItem>
                <SelectItem value="personal">Personal</SelectItem>
                <SelectItem value="manager">Manager</SelectItem>
                <SelectItem value="finance">Finance</SelectItem>
                <SelectItem value="corporate">Corporate</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}

        {/* Results */}
        {query && (
          <>
            <div className="mb-4 text-sm text-muted-foreground">
              {results.length} result{results.length !== 1 ? "s" : ""} found
            </div>

            {results.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground">No files match your search. Try different keywords.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {results.map((file) => {
                  const ext = getFileExtension(file);
                  const style = getFileTypeStyle(file);

                  return (
                    <div
                      key={file.id}
                      onClick={() => navigate(`/filemanager/view?id=${file.id}`)}
                      className="flex gap-4 p-4 rounded-lg border bg-card hover:bg-accent/10 cursor-pointer transition-colors"
                    >
                      <div className={`h-10 w-10 rounded-lg ${style.bg} flex items-center justify-center shrink-0`}>
                        <FileText className={`h-5 w-5 ${style.color}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">
                          {file.display_name || file.original_name}
                        </p>
                        {file.summary && (
                          <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                            {file.summary}
                          </p>
                        )}
                        {file.description && !file.summary && (
                          <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                            {file.description}
                          </p>
                        )}
                        <div className="flex items-center gap-2 mt-2 flex-wrap">
                          <Badge variant="secondary">{ext.toUpperCase()}</Badge>
                          <Badge variant="outline">{formatFileSize(file.file_size)}</Badge>
                          <Badge variant="outline" className="capitalize">
                            {file.access_level}
                          </Badge>
                          {file.keywords?.slice(0, 3).map((kw, i) => (
                            <Badge key={i} variant="secondary">
                              {kw}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}