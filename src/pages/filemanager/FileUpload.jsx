import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import FileUploader from "@/components/files/FileUploader";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function FileUploadPage() {
  const navigate = useNavigate();
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);

  const handleComplete = () => {
    setShowSuccessDialog(true);
    setTimeout(() => {
      navigate("/filemanager/files");
    }, 1500);
  };

  return (
    <>
      <div className="p-6 max-w-3xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Upload File</h1>
            <p className="text-sm text-muted-foreground mt-1">Add a new file to the vault</p>
          </div>
          <Button variant="outline" onClick={() => navigate("/filemanager/files")}><X className="h-4 w-4 mr-2" /> Cancel</Button>
        </div>
        <FileUploader onComplete={handleComplete} />
      </div>
      <Dialog open={showSuccessDialog} onOpenChange={setShowSuccessDialog}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Upload Successful!</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground py-4">Your file has been uploaded to the vault.</p>
        </DialogContent>
      </Dialog>
    </>
  );
}