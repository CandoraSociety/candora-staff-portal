import React from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import FileUploader from "@/components/files/FileUploader";
import { useQueryClient } from "@tanstack/react-query";

export default function UploadPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const handleComplete = () => {
    queryClient.invalidateQueries({ queryKey: ["files"] });
    navigate("/filemanager/files");
  };

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}><ArrowLeft className="h-4 w-4" /></Button>
        <div>
          <h1 className="text-2xl font-bold">Upload File</h1>
          <p className="text-sm text-muted-foreground">Add a new file to the vault</p>
        </div>
      </div>

      <FileUploader onComplete={handleComplete} />
    </div>
  );
}