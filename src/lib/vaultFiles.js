// Frontend bridge to the SharePoint-backed File Manager vault.
// Uploads are staged through private storage (stored privately), then moved
// into the Candora SharePoint vault by the uploadVaultFile backend function —
// no public links are ever created.
import { base44 } from "@/api/base44Client";

export async function uploadToVaultStorage(file, { category, subcategory } = {}) {
  const { file_uri } = await base44.integrations.Core.UploadPrivateFile({ file });
  const { signed_url } = await base44.integrations.Core.CreateFileSignedUrl({ file_uri, expires_in: 600 });
  const res = await base44.functions.invoke("uploadVaultFile", {
    signed_url,
    original_name: file.name,
    category: category || "to_be_sorted",
    subcategory: subcategory || "",
  });
  return res.data;
}

// Resolves a usable (short-lived) URL for a vault file. Records not yet
// migrated still use their legacy link.
export async function getVaultFileUrl(file) {
  if (!file) return null;
  if (file.storage_backend !== "sharepoint" && file.file_url) return file.file_url;
  const res = await base44.functions.invoke("getVaultFileContent", { file_id: file.id });
  return res.data?.url || null;
}

export async function openVaultFile(file) {
  try {
    const url = await getVaultFileUrl(file);
    if (url) window.open(url, "_blank");
  } catch (err) {
    const { toast } = await import("sonner");
    toast.error("Could not open file: " + (err.message || "unknown error"));
  }
}