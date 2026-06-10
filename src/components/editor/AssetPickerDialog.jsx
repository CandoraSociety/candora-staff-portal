import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import { Upload, Image as ImageIcon, FileText } from "lucide-react";
import { toast } from "sonner";
import { getFileExtension } from "@/lib/fileHelpers";

const IMAGE_EXTS = ["png", "jpg", "jpeg", "gif", "webp", "bmp"];

export default function AssetPickerDialog({ open, onOpenChange, onSelect, assetType = "logo" }) {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("assets");
  const [newName, setNewName] = useState("");

  const { data: assets = [] } = useQuery({
    queryKey: ["editor-assets"],
    queryFn: () => base44.entities.EditorAsset.list("-created_date", 200),
  });

  const { data: vaultFiles = [] } = useQuery({
    queryKey: ["vault-images"],
    queryFn: () => base44.entities.File.list("-created_date", 500),
    select: (files) =>
      files.filter((f) => {
        const ext = getFileExtension(f.original_name);
        return IMAGE_EXTS.includes(ext);
      }),
  });

  const handleUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !newName.trim()) return;

    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });

      await base44.entities.EditorAsset.create({
        name: newName.trim(),
        asset_type: assetType.includes("logo") ? "logo" : assetType.includes("watermark") ? "watermark_template" : assetType.includes("cover") ? "cover_template" : assetType.includes("header") ? "header_template" : assetType.includes("footer") ? "footer_template" : "image",
        file_url,
        owner_email: user?.email,
        is_shared: false,
      });

      onSelect(file_url);
      toast.success("Asset uploaded");
    } catch (error) {
      toast.error("Upload failed");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Select Asset</DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
          <TabsList className="grid grid-cols-3">
            <TabsTrigger value="assets">Saved Assets</TabsTrigger>
            <TabsTrigger value="vault">From Vault</TabsTrigger>
            <TabsTrigger value="upload">Upload New</TabsTrigger>
          </TabsList>

          <TabsContent value="assets" className="flex-1 overflow-y-auto mt-4">
            {assets.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">No saved assets</p>
            ) : (
              <div className="grid grid-cols-3 gap-3">
                {assets.map((asset) => (
                  <div
                    key={asset.id}
                    onClick={() => onSelect(asset.file_url)}
                    className="border rounded-lg p-2 cursor-pointer hover:shadow-md transition-all"
                  >
                    <div className="aspect-video bg-muted rounded mb-2 flex items-center justify-center overflow-hidden">
                      <img src={asset.file_url} alt={asset.name} className="max-w-full max-h-full object-contain" />
                    </div>
                    <p className="text-sm font-medium truncate">{asset.name}</p>
                    <p className="text-xs text-muted-foreground capitalize">{asset.asset_type.replace("_", " ")}</p>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="vault" className="flex-1 overflow-y-auto mt-4">
            {vaultFiles.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">No images in vault</p>
            ) : (
              <div className="grid grid-cols-3 gap-3">
                {vaultFiles.map((file) => {
                  const ext = getFileExtension(file.original_name);
                  return (
                    <div
                      key={file.id}
                      onClick={() => onSelect(file.file_url)}
                      className="border rounded-lg p-2 cursor-pointer hover:shadow-md transition-all"
                    >
                      <div className="aspect-video bg-muted rounded mb-2 flex items-center justify-center overflow-hidden">
                        <img src={file.file_url} alt={file.display_name} className="max-w-full max-h-full object-contain" />
                      </div>
                      <p className="text-sm font-medium truncate">{file.display_name || file.original_name}</p>
                      <p className="text-xs text-muted-foreground uppercase">{ext}</p>
                    </div>
                  );
                })}
              </div>
            )}
          </TabsContent>

          <TabsContent value="upload" className="flex-1 overflow-y-auto mt-4">
            <div className="space-y-4">
              <div>
                <Label>Asset Name</Label>
                <Input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="e.g., Company Logo" className="mt-1" />
              </div>
              <div>
                <Label>Upload File</Label>
                <div className="border-2 border-dashed border-border rounded-lg p-6 text-center mt-1">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleUpload}
                    className="hidden"
                    id="asset-upload"
                  />
                  <label htmlFor="asset-upload" className="cursor-pointer">
                    <Upload className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                    <p className="text-sm font-medium">Click to upload</p>
                    <p className="text-xs text-muted-foreground mt-1">PNG, JPG, GIF</p>
                  </label>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}