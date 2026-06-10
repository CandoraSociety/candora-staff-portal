import React, { useState, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { toast } from "sonner";
import { useAuth } from "@/lib/AuthContext";
import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";

export default function QuickNoteModal({ open, onOpenChange, editingNote, onClose }) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [title, setTitle] = useState(editingNote?.title || "");
  const [content, setContent] = useState(editingNote?.content || "");
  const [tags, setTags] = useState(editingNote?.tags || []);
  const [tagInput, setTagInput] = useState("");
  const quillRef = useRef(null);

  const createNoteMutation = useMutation({
    mutationFn: async (noteData) => {
      if (editingNote) {
        return base44.entities.Note.update(editingNote.id, noteData);
      }
      return base44.entities.Note.create(noteData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notes"] });
      toast.success(editingNote ? "Note updated" : "Note created");
      onClose();
    },
    onError: () => {
      toast.error("Failed to save note");
    },
  });

  const handleAddTag = () => {
    if (tagInput.trim() && !tags.includes(tagInput.trim())) {
      setTags([...tags, tagInput.trim()]);
      setTagInput("");
    }
  };

  const handleRemoveTag = (tagToRemove) => {
    setTags(tags.filter((tag) => tag !== tagToRemove));
  };

  const handleSave = () => {
    if (!title.trim()) {
      toast.error("Please enter a title");
      return;
    }
    createNoteMutation.mutate({
      title,
      content,
      tags,
      owner_email: user?.email,
    });
  };

  const handleOpenChange = (newOpen) => {
    if (!newOpen) {
      setTitle("");
      setContent("");
      setTags([]);
      setTagInput("");
      onOpenChange(false);
    } else {
      onOpenChange(true);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>{editingNote ? "Edit Note" : "New Note"}</DialogTitle>
        </DialogHeader>
        
        <div className="flex-1 overflow-y-auto space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="note-title">Title</Label>
            <Input
              id="note-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter note title"
            />
          </div>

          <div className="space-y-2">
            <Label>Content</Label>
            <div className="border rounded-md">
              <ReactQuill
                ref={quillRef}
                value={content}
                onChange={setContent}
                className="bg-white"
                theme="snow"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Tags</Label>
            <div className="flex gap-2">
              <Input
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), handleAddTag())}
                placeholder="Add a tag"
              />
              <Button type="button" variant="outline" onClick={handleAddTag}>Add</Button>
            </div>
            {tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {tags.map((tag) => (
                  <span key={tag} className="text-xs px-2 py-1 bg-muted rounded-full flex items-center gap-1">
                    {tag}
                    <button onClick={() => handleRemoveTag(tag)} className="hover:text-destructive">
                      ×
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => handleOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSave} disabled={createNoteMutation.isPending}>
            {editingNote ? "Update" : "Create"} Note
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}