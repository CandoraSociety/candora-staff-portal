import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Upload, Image as ImageIcon, X, Check } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useAuth } from "@/lib/AuthContext";

export default function AssetPickerDialog({ open, onOpenChange, onSelect, assetType = "image" }) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [uploadedUrl, setUploadedUrl] = useState(null);

  const { data: assets = [] } = useQuery({
    queryKey: ["editor-assets", assetType],
    queryFn: async () => {
      const all = await base44.entities.EditorAsset.list("-created_date", 100);
      return all.filter((a) => a.asset_type === assetType || assetType === "image");
    },
    enabled: open,
  });

  const uploadMutation = useMutation({
    mutationFn: async (file) => {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      await base44.entities.EditorAsset.create({
        name: file.name,
        asset_type: assetType,
        file_url,
        owner_email: user?.email,
        is_shared: false,
      });
      return file_url;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["editor-assets"] });
      toast.success("Asset uploaded");
    },
  });

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) uploadMutation.mutate(file);
  };

  const handleSelect = (url) => {
    if (onSelect) onSelect(url);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader><DialogTitle>Select {assetType === "image" ? "Image" : "Asset"}</DialogTitle></DialogHeader>

        <Tabs defaultValue="library">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="library">Library</TabsTrigger>
            <TabsTrigger value="upload">Upload New</TabsTrigger>
          </TabsList>

          <TabsContent value="library" className="space-y-4">
            {assets.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">No assets yet. Upload one to get started.</p>
            ) : (
              <div className="grid gap-3 grid-cols-3 max-h-80 overflow-y-auto">
                {assets.map((asset) => (
                  <div key={asset.id} className="relative group border rounded-lg overflow-hidden cursor-pointer hover:border-primary" onClick={() => handleSelect(asset.file_url)}>
                    <img src={asset.file_url} alt={asset.name} className="w-full h-24 object-cover" />
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center">
                      <Check className="h-6 w-6 text-white" />
                    </div>
                    <p className="text-xs truncate p-1 bg-background">{asset.name}</p>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="upload" className="space-y-4">
            <div className="border-2 border-dashed rounded-lg p-8 text-center">
              <input type="file" id="asset-upload" className="hidden" accept="image/*" onChange={handleFileUpload} />
              <Label htmlFor="asset-upload" className="cursor-pointer">
                <Upload className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                <p className="text-sm font-medium">Click to upload</p>
                <p className="text-xs text-muted-foreground">PNG, JPG, GIF</p>
              </Label>
            </div>
            {uploadedUrl && (
              <div className="border rounded-lg p-4">
                <img src={uploadedUrl} alt="Uploaded" className="max-h-40 mx-auto" />
                <Button className="w-full mt-3" onClick={() => handleSelect(uploadedUrl)}>Select This Image</Button>
              </div>
            )}
          </TabsContent>
        </Tabs>

        <div className="flex justify-end">
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}