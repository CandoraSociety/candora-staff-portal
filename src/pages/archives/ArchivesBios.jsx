import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { useArchiveAdmin } from "@/components/archives/useArchiveAdmin";
import BioEditor from "@/components/archives/BioEditor";
import { useToast } from "@/components/ui/use-toast";

const ROLE_FILTERS = [
  { value: "all", label: "Everyone" },
  { value: "executive_director", label: "Executive Directors" },
  { value: "board_chair", label: "Board Chairs" },
  { value: "board_member", label: "Board Members" },
  { value: "founder", label: "Founders" },
  { value: "key_staff", label: "Key Staff" },
  { value: "community_champion", label: "Community Champions" },
  { value: "other", label: "Other" },
];

const ROLE_LABELS = {
  executive_director: "Executive Director",
  board_chair: "Board Chair",
  board_member: "Board Member",
  founder: "Founder",
  key_staff: "Key Staff",
  community_champion: "Community Champion",
  other: "Notable Figure",
};

function formatTerm(bio) {
  const start = bio.term_start ? new Date(bio.term_start).getFullYear() : "";
  const end = bio.is_current ? "Present" : bio.term_end ? new Date(bio.term_end).getFullYear() : "";
  if (!start && !end) return "";
  if (start && end) return `${start} — ${end}`;
  return start || end;
}

export default function ArchivesBios() {
  const { isAdmin } = useArchiveAdmin();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [roleFilter, setRoleFilter] = useState("all");
  const [viewBio, setViewBio] = useState(null);
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingBio, setEditingBio] = useState(null);

  const { data: bios } = useQuery({
    queryKey: ["archiveBios"],
    queryFn: () => base44.entities.ArchiveBio.list(),
  });

  const filtered = roleFilter === "all" ? (bios || []) : (bios || []).filter(b => b.role_title === roleFilter);

  const handleSave = async (data) => {
    try {
      if (editingBio) {
        await base44.entities.ArchiveBio.update(editingBio.id, data);
        toast({ title: "Bio updated" });
      } else {
        await base44.entities.ArchiveBio.create(data);
        toast({ title: "Bio added" });
      }
      queryClient.invalidateQueries({ queryKey: ["archiveBios"] });
      setEditorOpen(false);
      setEditingBio(null);
    } catch (err) {
      toast({ title: "Error saving", description: err.message, variant: "destructive" });
    }
  };

  const handleDelete = async (bio) => {
    if (!confirm(`Delete bio for ${bio.person_name}?`)) return;
    try {
      await base44.entities.ArchiveBio.delete(bio.id);
      queryClient.invalidateQueries({ queryKey: ["archiveBios"] });
      setViewBio(null);
      toast({ title: "Bio deleted" });
    } catch (err) {
      toast({ title: "Error deleting", description: err.message, variant: "destructive" });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold">People of Candora</h1>
          <p className="text-muted-foreground">The individuals who shaped our organization.</p>
        </div>
        {isAdmin && (
          <Button size="sm" className="gap-2" onClick={() => { setEditingBio(null); setEditorOpen(true); }}>
            <Plus className="h-4 w-4" /> Add Bio
          </Button>
        )}
      </div>

      <div className="flex flex-wrap gap-2">
        {ROLE_FILTERS.map(r => (
          <Button key={r.value} variant={roleFilter === r.value ? "default" : "outline"} size="sm" onClick={() => setRoleFilter(r.value)}>
            {r.label}
          </Button>
        ))}
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.length === 0 && <p className="text-muted-foreground col-span-full text-center py-12">No bios found.</p>}
        {filtered.map(bio => (
          <Card key={bio.id} className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => setViewBio(bio)}>
            <CardContent className="p-4 flex flex-col items-center text-center">
              {bio.photo_url ? (
                <img src={bio.photo_url} alt={bio.person_name} className="w-24 h-24 rounded-full object-cover mb-3" />
              ) : (
                <div className="w-24 h-24 rounded-full bg-muted flex items-center justify-center mb-3">
                  <span className="text-2xl font-bold text-muted-foreground">{bio.person_name?.charAt(0)}</span>
                </div>
              )}
              <h3 className="font-semibold">{bio.person_name}</h3>
              <p className="text-sm text-primary">{bio.role_label || ROLE_LABELS[bio.role_title] || bio.role_title}</p>
              {formatTerm(bio) && <p className="text-xs text-muted-foreground mt-1">{formatTerm(bio)}</p>}
              {bio.is_current && <span className="text-xs bg-success/10 text-success px-2 py-0.5 rounded-full mt-1">Current</span>}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* View Modal */}
      <Dialog open={!!viewBio} onOpenChange={(v) => !v && setViewBio(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          {viewBio && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-3">
                  {viewBio.photo_url && <img src={viewBio.photo_url} alt="" className="w-12 h-12 rounded-full object-cover" />}
                  <div>
                    <div>{viewBio.person_name}</div>
                    <span className="text-sm font-normal text-muted-foreground">{viewBio.role_label || ROLE_LABELS[viewBio.role_title] || viewBio.role_title}</span>
                    {formatTerm(viewBio) && <span className="text-sm font-normal text-muted-foreground block">{formatTerm(viewBio)}</span>}
                  </div>
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                {viewBio.bio_content && (
                  <div className="prose prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: viewBio.bio_content }} />
                )}
                {viewBio.highlights?.length > 0 && (
                  <div>
                    <h4 className="font-semibold text-sm mb-2">Key Highlights</h4>
                    <ul className="space-y-1">
                      {viewBio.highlights.map((h, i) => <li key={i} className="text-sm text-muted-foreground flex items-start gap-2"><span className="text-primary">•</span> {h}</li>)}
                    </ul>
                  </div>
                )}
                {isAdmin && (
                  <div className="flex gap-2 pt-2">
                    <Button variant="outline" size="sm" className="gap-2" onClick={() => { setEditingBio(viewBio); setViewBio(null); setEditorOpen(true); }}>
                      <Pencil className="h-4 w-4" /> Edit
                    </Button>
                    <Button variant="outline" size="sm" className="gap-2 text-destructive" onClick={() => handleDelete(viewBio)}>
                      <Trash2 className="h-4 w-4" /> Delete
                    </Button>
                  </div>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      <BioEditor open={editorOpen} onClose={() => { setEditorOpen(false); setEditingBio(null); }} onSave={handleSave} initial={editingBio} />
    </div>
  );
}