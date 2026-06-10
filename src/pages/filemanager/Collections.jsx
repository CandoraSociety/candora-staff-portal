import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Plus, Search, FolderOpen, Trash2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { useAuth } from "@/lib/AuthContext";
import CreateCollectionDialog from "@/components/collections/CreateCollectionDialog";
import CollectionDetail from "@/components/collections/CollectionDetail";

export default function Collections() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [selectedCollection, setSelectedCollection] = useState(null);

  const { data: collections = [], isLoading } = useQuery({
    queryKey: ["collections"],
    queryFn: () => base44.entities.Collection.list("-created_date"),
  });

  const { data: files = [] } = useQuery({
    queryKey: ["files"],
    queryFn: () => base44.entities.File.list("-created_date", 1000),
  });

  const deleteCollectionMutation = useMutation({
    mutationFn: (id) => base44.entities.Collection.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["collections"] });
      toast.success("Collection deleted");
      setSelectedCollection(null);
    },
  });

  const handleDelete = (collection) => {
    if (window.confirm(`Delete collection "${collection.name}"? This won't delete the files themselves.`)) {
      deleteCollectionMutation.mutate(collection.id);
    }
  };

  if (isLoading) {
    return (
      <div className="p-8 text-center">
        <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent" />
      </div>
    );
  }

  if (selectedCollection) {
    return (
      <CollectionDetail
        collection={selectedCollection}
        files={files}
        onBack={() => setSelectedCollection(null)}
        onDelete={() => handleDelete(selectedCollection)}
      />
    );
  }

  const filteredCollections = collections.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-6 max-w-[1400px] mx-auto space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold">Collections</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {collections.length} collection{collections.length !== 1 ? "s" : ""}
          </p>
        </div>
        <Button onClick={() => setShowCreate(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          New Collection
        </Button>
      </div>

      <div className="relative w-full max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search collections..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      {filteredCollections.length === 0 ? (
        <div className="text-center py-16">
          <FolderOpen className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground">
            {collections.length === 0 ? "No collections yet" : "No collections match your search"}
          </p>
          {collections.length === 0 && (
            <Button onClick={() => setShowCreate(true)} className="mt-4 gap-2">
              <Plus className="h-4 w-4" />
              Create your first collection
            </Button>
          )}
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredCollections.map((collection) => {
            const fileCount = collection.file_ids?.length || 0;
            return (
              <Card
                key={collection.id}
                className="p-5 cursor-pointer hover:shadow-md transition-all group"
                onClick={() => setSelectedCollection(collection)}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div
                      className="h-10 w-10 rounded-lg flex items-center justify-center shrink-0"
                      style={{ backgroundColor: collection.color || "#e2e8f0" }}
                    >
                      <FolderOpen className="h-5 w-5 text-white" />
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(collection);
                      }}
                      className="opacity-0 group-hover:opacity-100 transition-opacity h-8 w-8 rounded flex items-center justify-center hover:bg-muted"
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </button>
                  </div>
                  <CardTitle className="text-lg mt-3 group-hover:text-primary transition-colors">
                    {collection.name}
                  </CardTitle>
                  {collection.description && (
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {collection.description}
                    </p>
                  )}
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-muted-foreground">
                      {fileCount} file{fileCount !== 1 ? "s" : ""}
                    </p>
                    <div className="flex items-center gap-2">
                      <Badge variant={collection.status === "active" ? "default" : "secondary"}>
                        {collection.status}
                      </Badge>
                      {collection.owner_email === user?.email && (
                        <Badge variant="outline">Owner</Badge>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <CreateCollectionDialog
        open={showCreate}
        onOpenChange={setShowCreate}
      />
    </div>
  );
}