// Shared helpers for the File Manager's SharePoint-backed document vault.
// Uploads are stored in the Candora SharePoint drive under a folder tree that
// mirrors the File Manager's category taxonomy:
//   /_VAULT_FileManager/<Category label>[/<Subcategory>]/<file>
// Access is enforced by the app (File.access_level via getAccessibleFiles /
// getVaultFileContent); nothing in the vault is publicly linkable.
import { getGraphAccessToken } from "./graphDrive.ts";

export const VAULT_DRIVE_ID = "b!hxKx8kC6-E-Lnj84eAg_LC-uIFP5HdVPkWTwcDFuP1P7ca7jYKZ5Ra_M7gnd5aOy";
export const VAULT_ROOT_FOLDER = "_VAULT_FileManager";

const CATEGORY_LABELS: Record<string, string> = {
  to_be_sorted: "To Be Sorted",
  grants_federal: "Grants - Federal",
  grants_provincial: "Grants - Provincial",
  grants_municipal: "Grants - Municipal",
  grants_private: "Grants - Private",
  finance_invoices: "Finance - Invoices",
  finance_receipts: "Finance - Receipts",
  finance_budgets: "Finance - Budgets",
  finance_reports: "Finance - Reports",
  hr_policies: "HR - Policies",
  hr_contracts: "HR - Contracts",
  hr_training: "HR - Training",
  operations_manuals: "Operations - Manuals",
  operations_procedures: "Operations - Procedures",
  communications_templates: "Communications - Templates",
  communications_branding: "Communications - Branding",
  legal_compliance: "Legal - Compliance",
  legal_agreements: "Legal - Agreements",
  other: "Other",
};

function sanitizeSegment(name: string): string {
  return (name || "").replace(/[~"#%&*:<>?/\\{|}]/g, "_").trim() || "Unsorted";
}

export function getVaultFolderPath(category: string, subcategory: string): string {
  const segments = [VAULT_ROOT_FOLDER, CATEGORY_LABELS[category] || category || "To Be Sorted"];
  if (subcategory) segments.push(subcategory);
  return "/" + segments.map(sanitizeSegment).join("/");
}

// Walks the folder path, creating any missing folders; returns the leaf folder id.
export async function ensureFolderPath(accessToken: string, folderPath: string): Promise<string> {
  const segments = folderPath.split("/").filter(Boolean);
  let parentId: string | null = null;
  for (let i = 0; i < segments.length; i++) {
    const segment = segments[i];
    const pathSoFar = segments.slice(0, i + 1).map(encodeURIComponent).join("/");
    const getRes = await fetch(`https://graph.microsoft.com/v1.0/drives/${VAULT_DRIVE_ID}/root:/${pathSoFar}`, {
      headers: { Authorization: `Bearer ${accessToken}` },
      signal: AbortSignal.timeout(15000),
    });
    if (getRes.ok) {
      parentId = (await getRes.json()).id;
      continue;
    }
    const createUrl = parentId
      ? `https://graph.microsoft.com/v1.0/drives/${VAULT_DRIVE_ID}/items/${parentId}/children`
      : `https://graph.microsoft.com/v1.0/drives/${VAULT_DRIVE_ID}/root/children`;
    const createRes = await fetch(createUrl, {
      method: "POST",
      headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" },
      body: JSON.stringify({ name: segment, folder: {}, "@microsoft.graph.conflictBehavior": "replace" }),
      signal: AbortSignal.timeout(15000),
    });
    if (!createRes.ok) throw new Error(`Could not create vault folder "${segment}": ${await createRes.text()}`);
    parentId = (await createRes.json()).id;
  }
  if (!parentId) throw new Error("Invalid vault folder path");
  return parentId;
}

// Uploads raw bytes into the vault folder; renames on conflict so existing
// files are never overwritten. Returns the new drive item's id and name.
export async function uploadFileToVault(
  accessToken: string,
  folderPath: string,
  fileName: string,
  bytes: ArrayBuffer,
): Promise<{ itemId: string; name: string }> {
  const folderId = await ensureFolderPath(accessToken, folderPath);
  const safeName = sanitizeSegment(fileName);
  const putRes = await fetch(
    `https://graph.microsoft.com/v1.0/drives/${VAULT_DRIVE_ID}/items/${folderId}:/${encodeURIComponent(safeName)}:/content?@microsoft.graph.conflictBehavior=rename`,
    {
      method: "PUT",
      headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/octet-stream" },
      body: bytes,
      signal: AbortSignal.timeout(180000),
    },
  );
  if (!putRes.ok) throw new Error(`SharePoint upload failed: ${await putRes.text()}`);
  const item = await putRes.json();
  return { itemId: item.id, name: item.name };
}

// Returns the short-lived (≈1 hour) pre-authenticated download URL for an item.
export async function getItemDownloadUrl(accessToken: string, itemId: string): Promise<string> {
  const res = await fetch(`https://graph.microsoft.com/v1.0/drives/${VAULT_DRIVE_ID}/items/${itemId}/content`, {
    headers: { Authorization: `Bearer ${accessToken}` },
    redirect: "manual",
    signal: AbortSignal.timeout(15000),
  });
  if (res.status >= 300 && res.status < 400) {
    const location = res.headers.get("Location");
    if (location) return location;
  }
  throw new Error(`Could not get file download URL (status ${res.status})`);
}

// Fetches an access token (convenience re-export for vault functions).
export { getGraphAccessToken };