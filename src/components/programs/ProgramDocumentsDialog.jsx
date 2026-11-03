import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import ProgramDocuments from '@/components/programs/ProgramDocuments';

export default function ProgramDocumentsDialog({ open, onOpenChange, title, subtitle, documents, onChange }) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {subtitle && <DialogDescription>{subtitle}</DialogDescription>}
        </DialogHeader>
        <ProgramDocuments documents={documents} onChange={onChange} />
      </DialogContent>
    </Dialog>
  );
}