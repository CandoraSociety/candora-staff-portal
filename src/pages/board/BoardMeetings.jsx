import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Plus, Calendar, Clock, MapPin, Trash2, Upload, FileText, DollarSign, Package, Pencil } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import BoardNewMeetingModal from "@/components/board/BoardNewMeetingModal";
import UploadMeetingDocDialog from "@/components/board/UploadMeetingDocDialog";
import EditMeetingPackageDialog from "@/components/board/EditMeetingPackageDialog";
import MeetingPackageDialog from "@/components/board/MeetingPackageDialog";
import ConfirmDialog from "@/components/training/ConfirmDialog";

const statusColors = {
  upcoming: "bg-blue-100 text-blue-700",
  in_progress: "bg-green-100 text-green-700",
  completed: "bg-gray-100 text-gray-600",
  cancelled: "bg-red-100 text-red-700",
};

// Paperwork attached to a meeting, shown under its details with a link to open
function AttachedDocs({ label, docs }) {
  if (!docs.length) return null;
  return (
    <div className="flex items-center gap-2 mt-2 text-xs flex-wrap">
      <span className="flex items-center gap-1 text-green-700 font-medium"><FileText size={12} /> {label}</span>
      {docs.map(d => (
        <a key={d.id} href={d.file_url} target="_blank" rel="noreferrer" className="text-muted-foreground hover:text-foreground underline truncate max-w-[220px]">{d.title}</a>
      ))}
    </div>
  );
}

// A meeting package built in the Agenda Builder — the zip itself plus a direct
// link to every document inside it, so either can be opened without unzipping
function PackageAttachments({ packages, onEdit, onDelete }) {
  if (!packages.length) return null;
  return (
    <div className="mt-2 space-y-1.5">
      {packages.map((pkg) => (
        <div key={pkg.id} className="rounded-lg border border-border bg-muted/40 px-3 py-2 group/pkg">
          <div className="flex items-center gap-2">
            <a href={pkg.file_url} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 text-xs font-medium text-foreground hover:underline flex-1 min-w-0">
              <Package size={13} className="shrink-0" />
              <span className="truncate max-w-[260px]">{pkg.file_name || "Meeting Package.zip"}</span>
              <span className="font-normal text-muted-foreground">download zip</span>
            </a>
            <button
              type="button"
              onClick={() => onEdit(pkg)}
              title="Add or remove items"
              className="flex items-center gap-1 text-xs border border-border bg-card px-2 py-1 rounded-md hover:bg-muted transition text-foreground"
            >
              <Pencil size={12} /> Manage items
            </button>
            <button
              type="button"
              onClick={() => onDelete(pkg)}
              title="Delete this package"
              className="text-muted-foreground hover:text-destructive transition"
            >
              <Trash2 size={14} />
            </button>
          </div>
          {(pkg.package_files || []).length > 0 && (
            <div className="flex items-center gap-x-3 gap-y-1 flex-wrap mt-1.5">
              {(pkg.package_files || []).map((f) => (
                <a
                  key={f.file_url}
                  href={f.file_url}
                  target="_blank"
                  rel="noreferrer"
                  title={f.file_name || f.label}
                  className="text-xs text-muted-foreground hover:text-foreground underline truncate max-w-[220px]"
                >
                  {f.label}
                </a>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

export default function BoardMeetings() {
  const [meetings, setMeetings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showNew, setShowNew] = useState(false);
  const [meetingDocs, setMeetingDocs] = useState([]);
  const [packages, setPackages] = useState([]);
  const [uploadFor, setUploadFor] = useState(null);
  const [editPkg, setEditPkg] = useState(null);
  const [deletePkg, setDeletePkg] = useState(null);
  const [packageFor, setPackageFor] = useState(null); // { meeting, items } while the package dialog is open
  const [openingPackageId, setOpeningPackageId] = useState(null);

  const load = async () => {
    const [data, docs, corporateDocs] = await Promise.all([
      base44.entities.Meeting.list("-meeting_date"),
      base44.entities.BoardDocument.filter({ document_type: { $in: ["agenda", "minutes", "financial_report"] } }),
      base44.entities.BoardDocument.filter({ document_type: "corporate_doc" }),
    ]);
    setMeetings(data);
    setMeetingDocs(docs);
    setPackages(corporateDocs.filter((d) => (d.package_files || []).length > 0));
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const handleDelete = async (id) => {
    if (!confirm("Delete this meeting?")) return;
    await base44.entities.Meeting.delete(id);
    setMeetings(prev => prev.filter(m => m.id !== id));
  };

  const docsFor = (meetingId, type) => meetingDocs.filter(d => d.meeting_id === meetingId && d.document_type === type);
  const packagesFor = (meetingId) => packages.filter(p => p.meeting_id === meetingId);

  // Build a package straight from the meeting card — its agenda is loaded first
  const openPackageDialog = async (meeting) => {
    setOpeningPackageId(meeting.id);
    try {
      const agendaItems = await base44.entities.AgendaItem.filter({ meeting_id: meeting.id });
      const items = [...agendaItems].sort((a, b) => (a.order_index ?? 0) - (b.order_index ?? 0));
      setPackageFor({ meeting, items });
    } finally {
      setOpeningPackageId(null);
    }
  };

  const handleDeletePackage = async () => {
    if (!deletePkg) return;
    await base44.entities.BoardDocument.delete(deletePkg.id);
    setPackages(prev => prev.filter(p => p.id !== deletePkg.id));
    setDeletePkg(null);
    toast.success("Meeting package deleted");
  };

  const grouped = meetings.reduce((acc, m) => {
    const s = m.status || "upcoming";
    if (!acc[s]) acc[s] = [];
    acc[s].push(m);
    return acc;
  }, {});

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-heading text-3xl font-semibold">Meetings</h1>
          <p className="text-muted-foreground text-sm mt-1">Schedule and manage board meetings</p>
        </div>
        <button onClick={() => setShowNew(true)} className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-lg text-sm font-medium hover:opacity-90 transition">
          <Plus size={16} /> New Meeting
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><div className="w-6 h-6 border-2 border-border border-t-primary rounded-full animate-spin" /></div>
      ) : (
        <div className="space-y-8">
          {["in_progress", "upcoming", "completed", "cancelled"].map(status => {
            const group = grouped[status];
            if (!group?.length) return null;
            return (
              <div key={status}>
                <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">{status.replace(/_/g, " ")}</h2>
                <div className="space-y-3">
                  {group.map(meeting => (
                    <div key={meeting.id} className="bg-card border border-border rounded-xl p-5 hover:shadow-sm transition group">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="font-semibold text-foreground">{meeting.title}</h3>
                            <span className={`text-xs px-2 py-0.5 rounded-full ${statusColors[meeting.status]}`}>{meeting.status?.replace(/_/g, " ")}</span>
                            <span className="text-xs bg-secondary text-secondary-foreground px-2 py-0.5 rounded-full">{meeting.meeting_type}</span>
                          </div>
                          <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground flex-wrap">
                            <span className="flex items-center gap-1"><Calendar size={13} />{format(new Date(meeting.meeting_date), "MMMM d, yyyy")}</span>
                            <span className="flex items-center gap-1"><Clock size={13} />{format(new Date(meeting.meeting_date), "h:mm a")}</span>
                            {meeting.location && <span className="flex items-center gap-1"><MapPin size={13} />{meeting.location}</span>}
                          </div>
                          <AttachedDocs label="Agenda attached" docs={docsFor(meeting.id, "agenda")} />
                          <AttachedDocs label="Minutes attached" docs={docsFor(meeting.id, "minutes")} />
                          <AttachedDocs label="Financials attached" docs={docsFor(meeting.id, "financial_report")} />
                          <PackageAttachments
                            packages={packagesFor(meeting.id)}
                            onEdit={setEditPkg}
                            onDelete={setDeletePkg}
                          />
                        </div>
                        <div className="flex items-center gap-2 shrink-0 flex-wrap justify-end">
                          <Link to={`/board/meetings/${meeting.id}/agenda`} className="text-xs border border-border px-3 py-1.5 rounded-lg hover:bg-muted transition text-foreground">Agenda</Link>
                          <Link to={`/board/meetings/${meeting.id}/minutes`} className="text-xs border border-border px-3 py-1.5 rounded-lg hover:bg-muted transition text-foreground">Minutes</Link>
                          <button
                            onClick={() => openPackageDialog(meeting)}
                            disabled={openingPackageId === meeting.id}
                            className="flex items-center gap-1 text-xs border border-border px-3 py-1.5 rounded-lg hover:bg-muted transition text-foreground disabled:opacity-60"
                          >
                            {openingPackageId === meeting.id
                              ? <span className="w-3 h-3 border-2 border-border border-t-primary rounded-full animate-spin" />
                              : <Package size={13} />}
                            Create Package
                          </button>
                          <button onClick={() => setUploadFor({ meeting, documentType: "minutes" })} className="flex items-center gap-1 text-xs border border-border px-3 py-1.5 rounded-lg hover:bg-muted transition text-foreground"><Upload size={13} /> Upload Minutes</button>
                          <button onClick={() => setUploadFor({ meeting, documentType: "financial_report" })} className="flex items-center gap-1 text-xs border border-border px-3 py-1.5 rounded-lg hover:bg-muted transition text-foreground"><DollarSign size={13} /> Upload Financials</button>
                          <button onClick={() => handleDelete(meeting.id)} className="text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition"><Trash2 size={15} /></button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
          {meetings.length === 0 && (
            <div className="text-center py-16 text-muted-foreground">
              <Calendar size={40} className="mx-auto mb-3 opacity-30" />
              <p className="font-medium">No meetings yet</p>
            </div>
          )}
        </div>
      )}
      {uploadFor && (
        <UploadMeetingDocDialog
          meeting={uploadFor.meeting}
          documentType={uploadFor.documentType}
          onClose={() => setUploadFor(null)}
          onUploaded={(doc) => { setMeetingDocs(prev => [doc, ...prev]); setUploadFor(null); }}
        />
      )}
      {showNew && (
        <BoardNewMeetingModal
          onClose={() => setShowNew(false)}
          onSaved={(m) => { setMeetings(prev => [m, ...prev]); setShowNew(false); }}
        />
      )}
      {packageFor && (
        <MeetingPackageDialog
          meeting={packageFor.meeting}
          items={packageFor.items}
          onClose={() => setPackageFor(null)}
          onCreated={load}
        />
      )}
      {editPkg && meetings.some(m => m.id === editPkg.meeting_id) && (
        <EditMeetingPackageDialog
          pkg={editPkg}
          meeting={meetings.find(m => m.id === editPkg.meeting_id)}
          onClose={() => setEditPkg(null)}
          onSaved={(updated) => {
            setPackages(prev => prev.map(p => (p.id === updated.id ? updated : p)));
            setEditPkg(null);
            toast.success("Meeting package updated");
          }}
        />
      )}
      <ConfirmDialog
        open={!!deletePkg}
        onOpenChange={(open) => { if (!open) setDeletePkg(null); }}
        title="Delete this meeting package?"
        description="The zip and its document links are removed from the meeting. The original board documents stay in the library."
        confirmLabel="Delete"
        destructive
        onConfirm={handleDeletePackage}
      />
    </div>
  );
}