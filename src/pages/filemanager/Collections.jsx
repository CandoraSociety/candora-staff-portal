import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Plus, Search, FolderOpen, Trash2, ExternalLink } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { useAuth } from "@/lib/AuthContext";
import { Link } from "react-router-dom";
import CreateCollectionDialog from "@/components/collections/CreateCollectionDialog";

export default function Collections() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [showCreate, setShowCreate] = useState(false);

  const { data: collections = [] } = useQuery({
    queryKey: ["collections", user?.email],
    queryFn: async () => {
      const all = await base44.entities.Collection.list("-created_date", 100);
      return all.filter((c) => c.owner_email === user?.email);
    },
    enabled: !!user,
  });

  const deleteCollectionMutation = useMutation({
    mutationFn: (id) => base44.entities.Collection.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["collections"] });
      toast.success("Collection deleted");
    },
  });

  const filteredCollections = collections.filter((c) => c.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="p-6 max-w-[1400px] mx-auto space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold">Collections</h1>
          <p className="text-sm text-muted-foreground mt-1">{collections.length} collections</p>
        </div>
        <Button onClick={() => setShowCreate(true)} className="gap-2"><Plus className="h-4 w-4" /> New Collection</Button>
      </div>

      <div className="relative w-full max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Search collections..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
      </div>

      {filteredCollections.length === 0 ? (
        <div className="text-center py-16">
          <FolderOpen className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground">No collections yet</p>
          <Button onClick={() => setShowCreate(true)} className="mt-4 gap-2"><Plus className="h-4 w-4" /> Create your first collection</Button>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredCollections.map((collection) => (
            <Card key={collection.id} className="group hover:shadow-md transition-all">
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <CardTitle className="text-lg truncate">{collection.name}</CardTitle>
                    <p className="text-sm text-muted-foreground truncate">{collection.description || "No description"}</p>
                  </div>
                  <Badge variant={collection.status === "active" ? "default" : "secondary"}>{collection.status}</Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between mt-4">
                  <p className="text-xs text-muted-foreground">{collection.file_ids?.length || 0} files</p>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Link to={`/filemanager/collections/${collection.id}`}><Button variant="ghost" size="icon" className="h-8 w-8"><ExternalLink className="h-4 w-4" /></Button></Link>
                    <button onClick={() => deleteCollectionMutation.mutate(collection.id)} className="h-8 w-8 rounded flex items-center justify-center hover:bg-muted"><Trash2 className="h-4 w-4 text-destructive" /></button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <CreateCollectionDialog open={showCreate} onOpenChange={setShowCreate} />
    </div>
  );
}