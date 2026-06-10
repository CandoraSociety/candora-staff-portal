import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { useAuth } from "@/lib/AuthContext";
import { base44 } from "@/api/base44Client";
import QuickNoteModal from "./QuickNoteModal";

export default function FloatingNoteButton() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [showModal, setShowModal] = useState(false);
  const [newNote, setNewNote] = useState(null);

  const handleCreate = async () => {
    setShowModal(false);
    if (newNote) {
      navigate(`/notes?id=${newNote.id}`);
      setNewNote(null);
    }
  };

  return (
    <>
      <Button
        className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg z-50"
        size="icon"
        onClick={() => setShowModal(true)}
      >
        <Plus className="h-6 w-6" />
      </Button>

      {showModal && (
        <QuickNoteModal
          open={showModal}
          onOpenChange={setShowModal}
          editingNote={null}
        />
      )}
    </>
  );
}