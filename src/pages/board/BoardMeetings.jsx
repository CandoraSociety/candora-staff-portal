import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Plus, Calendar, Clock, MapPin, Trash2, Upload, DollarSign, Package, FilePlus2 } from "lucide-react";
import { format } from "date-fns";
import { parseDateSmart } from "@/lib/dateUtils";
import { toast } from "sonner";
import BoardNewMeetingModal from "@/components/board/BoardNewMeetingModal";
import UploadMeetingDocDialog from "@/components/board/UploadMeetingDocDialog";
import AddMeetingDocumentDialog from "@/components/board/AddMeetingDocumentDialog";
import MeetingCardDocuments from "@/components/board/MeetingCardDocuments";
import EditMeetingPackageDialog from "@/components/board/EditMeetingPackageDialog";
import MeetingPackageDialog from "@/components/board/MeetingPackageDialog";
import ConfirmDialog from "@/components/training/ConfirmDialog";

const statusColors = {
  upcoming: "bg-blue-100 text-blue-700",
  in_progress: "bg-green-100 text-green-700",
  completed: "bg-gray-100 text-gray-600",
  cancelled: "bg-red-100 text-red-700",
};

export default function BoardMeetings() {
  const [meetings, setMeetings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showNew, setShowNew] = useState(false);
  const [meetingDocs, setMeetingDocs] = useState([]);
  const [packages, setPackages] = useState([]);
  const [uploadFor, setUploadFor] = useState(null);
  const [addDocFor, setAddDocFor] = useState(null);
  const [deleteDoc, setDeleteDoc] = useState(null);
  const [editPkg, setEditPkg] = useState(null);
  const [deletePkg, setDeletePkg] = useState(null);
  const [packageFor, setPackageFor] = useState(null); // { meeting, items } while the package dialog is open
  const [openingPackageId, setOpeningPackageId] = useState(null);

  const load = async () => {
    const [data, docs] = await Promise.all([
      base44.entities.Meeting.list("-meeting_date"),
      base44.entities.BoardDocument.filter({ meeting_id: { $exists: true } }),
    ]);
    setMeetings(data);
    setMeetingDocs(docs);
    setPackages(docs.filter((d) => (d.package_files || []).length > 0));
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const handleDelete = async (id) => {
    if (!confirm("Delete this meeting?")) return;
    await base44.entities.Meeting.delete(id);
    setMeetings(prev => prev.filter(m => m.id !== id));
  };

  const docsFor = (meetingId, type) => meetingDocs.filter(d => d.meeting_id === meetingId && d.document_type === type);

  // Documents on the card that aren't minutes, financials, ED report or agenda
  // (and not a meeting package, which the card lists separately)
  const otherDocsFor = (meetingId) =>
    meetingDocs.filter(
      d =>
        d.meeting_id === meetingId &&
        !["agenda", "minutes", "financial_report", "ed_report"].includes(d.document_type) &&
        !(d.package_files || []).length
    );

  const handleDeleteDoc = async () => {
    if (!deleteDoc) return;
    await base44.entities.BoardDocument.delete(deleteDoc.id);
    setMeetingDocs(prev => prev.filter(d => d.id !== deleteDoc.id));
    setDeleteDoc(null);
    toast.success("Document removed from the meeting");
  };

  // The most recent earlier meeting that has finalized minutes — those minutes
  // ride along on this meeting's card automatically, ready to approve.
  const prevMinutesFor = (meeting) => {
    const date = parseDateSmart(meeting.meeting_date);
    if (!date) return null;
    const earlier = meetings
      .filter(m => m.id !== meeting.id && parseDateSmart(m.meeting_date) && parseDateSmart(m.meeting_date) < date)
      .sort((a, b) => parseDateSmart(b.meeting_date) - parseDateSmart(a.meeting_date));
    for (const m of earlier) {
      const doc = meetingDocs.find(d => d.meeting_id === m.id && d.document_type === "minutes");
      if (doc) return doc;
    }
    return null;
  };
  const packagesFor = (meetingId) => packages.filter(p => p.meeting_id === meetingId);

  // Every document on a meeting as one list of compact chips, each carrying its
  // type (prev minutes belong to the earlier meeting, so they can't be removed)
  const docChipsFor = (meeting) => {
    const chips = [];
    const add = (docs, kind) => docs.forEach(doc => chips.push({ doc, kind }));
    add(docsFor(meeting.id, "agenda"), "Agenda");
    add(docsFor(meeting.id, "minutes"), "Minutes");
    const prev = prevMinutesFor(meeting);
    if (prev) chips.push({ doc: prev, kind: "Prev. minutes", readOnly: true });
    add(docsFor(meeting.id, "financial_report"), "Financials");
    add(docsFor(meeting.id, "ed_report"), "ED report");
    add(otherDocsFor(meeting.id), "Document");
    return chips;
  };

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
        <div className="space-y-6">
          {["in_progress", "upcoming", "completed", "cancelled"].map(status => {
            const group = grouped[status];
            if (!group?.length) return null;
            return (
              <div key={status}>
                <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">{status.replace(/_/g, " ")}</h2>
                <div className="space-y-2">
                  {group.map(meeting => (
                    <div key={meeting.id} className="bg-card border border-border rounded-xl p-3.5 hover:shadow-sm transition group">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="font-semibold text-foreground leading-snug">{meeting.title}</h3>
                            <span className={`text-[11px] px-2 py-0.5 rounded-full ${statusColors[meeting.status]}`}>{meeting.status?.replace(/_/g, " ")}</span>
                            <span className="text-[11px] bg-secondary text-secondary-foreground px-2 py-0.5 rounded-full">{meeting.meeting_type}</span>
                          </div>
                          <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground flex-wrap">
                            <span className="flex items-center gap-1"><Calendar size={12} />{format(new Date(meeting.meeting_date), "MMMM d, yyyy")}</span>
                            <span className="flex items-center gap-1"><Clock size={12} />{format(new Date(meeting.meeting_date), "h:mm a")}</span>
                            {meeting.location && <span className="flex items-center gap-1"><MapPin size={12} />{meeting.location}</span>}
                          </div>
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0">
                          <Link to={`/board/meetings/${meeting.id}/agenda`} className="text-xs border border-border px-2 py-1 rounded-lg hover:bg-muted transition text-foreground">Agenda</Link>
                          <Link to={`/board/meetings/${meeting.id}/minutes`} className="text-xs border border-border px-2 py-1 rounded-lg hover:bg-muted transition text-foreground">Minutes</Link>
                          <button onClick={() => setAddDocFor(meeting)} title="Add a document" className="p-1.5 border border-border rounded-lg hover:bg-muted transition text-foreground"><FilePlus2 size={13} /></button>
                          <button
                            onClick={() => openPackageDialog(meeting)}
                            disabled={openingPackageId === meeting.id}
                            title="Create a meeting package"
                            className="p-1.5 border border-border rounded-lg hover:bg-muted transition text-foreground disabled:opacity-60"
                          >
                            {openingPackageId === meeting.id
                              ? <span className="block w-3.5 h-3.5 border-2 border-border border-t-primary rounded-full animate-spin" />
                              : <Package size={13} />}
                          </button>
                          <button onClick={() => setUploadFor({ meeting, documentType: "minutes" })} title="Upload minutes" className="p-1.5 border border-border rounded-lg hover:bg-muted transition text-foreground"><Upload size={13} /></button>
                          <button onClick={() => setUploadFor({ meeting, documentType: "financial_report" })} title="Upload financials" className="p-1.5 border border-border rounded-lg hover:bg-muted transition text-foreground"><DollarSign size={13} /></button>
                          <button onClick={() => handleDelete(meeting.id)} title="Delete this meeting" className="p-1.5 text-muted-foreground hover:text-destructive transition"><Trash2 size={14} /></button>
                        </div>
                      </div>
                      <MeetingCardDocuments
                        chips={docChipsFor(meeting)}
                        packages={packagesFor(meeting.id)}
                        onDelete={setDeleteDoc}
                        onEditPackage={setEditPkg}
                        onDeletePackage={setDeletePkg}
                      />
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
      {addDocFor && (
        <AddMeetingDocumentDialog
          meeting={addDocFor}
          onClose={() => setAddDocFor(null)}
          onAdded={(doc) => {
            setMeetingDocs(prev => [doc, ...prev]);
            setAddDocFor(null);
            toast.success("Document added to the meeting");
          }}
        />
      )}
      <ConfirmDialog
        open={!!deleteDoc}
        onOpenChange={(open) => { if (!open) setDeleteDoc(null); }}
        title="Remove this document?"
        description={deleteDoc ? `"${deleteDoc.title}" is taken off this meeting card. The file stays in the Board Documents library.` : ""}
        confirmLabel="Remove"
        destructive
        onConfirm={handleDeleteDoc}
      />
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