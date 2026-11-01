// ── Portal SharePoint folders ─────────────────────────────────────────────
// Each portal keeps its own folder at the root of the Candora SharePoint drive,
// alongside the folders syncPortalFolders() maintains. This resolves the folder
// for a portal module (matching the existing folder when it has been renamed,
// creating it when it is missing) and decides the access level a File record
// for that portal should carry.
import { VAULT_DRIVE_ID, uploadFileToVault } from "./vaultStorage.ts";

// Current folder names after renameVaultFolders() re-prefixed them.
export const PORTAL_FOLDERS: Record<string, string> = {
  pathways: "_DEPT_Pathways",
  rc: "_DEPT_RC",
  ell: "_DEPT_ELL",
  empoweru: "_DEPT_EmpowerU",
  digilit: "_DEPT_DigiLit",
  community: "_DEPT_Community",
  childminding: "_DEPT_Childminding",
  "central-registration": "Central Registration",
  phac: "_DEPT_PHAC",
  frn: "_DEPT_FRN",
  nexushr: "_DEPT_HR",
  finance: "_VAULT_Finance",
  board: "_VAULT_Board",
  reception: "_DEPT_Reception",
  food: "_DEPT_Food",
  marketing: "_DEPT_Marketing",
  eventsmgr: "_DEPT_EventsMgr",
  volunteermgr: "_DEPT_VolunteerMgr",
  grants: "_DEPT_Grants",
  ed: "_VAULT_ED",
  reporting: "_DEPT_Reporting",
  lms: "_DEPT_LMS",
  archives: "_ARCHIVES_Candora_History",
  "winter-wonderland": "_PROGRAM_WinterWonderland",
  filemanager: "_VAULT_FileManager",
};

// File records inherit the sensitivity of the portal they belong to, so an
// uploaded Finance folder file is not readable as a universal document.
export function portalAccessLevel(moduleId: string): string {
  if (moduleId === "finance") return "finance";
  if (moduleId === "ed" || moduleId === "board" || moduleId === "nexushr") return "corporate";
  return "universal";
}

const sanitize = (name: string) => String(name || "").replace(/["#%*:<>?/\\{|}]/g, "").trim();

// Returns the portal's folder name and path, creating the folder if needed.
export async function resolvePortalFolder(accessToken: string, moduleId: string, portalName?: string) {
  const preferred = PORTAL_FOLDERS[moduleId] || sanitize(portalName || "") || "Portal Files";
  const listRes = await fetch(
    `https://graph.microsoft.com/v1.0/drives/${VAULT_DRIVE_ID}/root/children?$select=name,folder&$top=200`,
    { headers: { Authorization: `Bearer ${accessToken}` }, signal: AbortSignal.timeout(15000) },
  );
  const folders = listRes.ok
    ? ((await listRes.json()).value || []).filter((item: any) => item.folder).map((item: any) => item.name)
    : [];

  const candidates = [preferred, portalName, sanitize(portalName || "")].filter(Boolean) as string[];
  const existing = folders.find((name: string) => candidates.some(c => c.toLowerCase() === name.toLowerCase()));
  if (existing) return { name: existing, path: `/${existing}` };

  const createRes = await fetch(`https://graph.microsoft.com/v1.0/drives/${VAULT_DRIVE_ID}/root/children`, {
    method: "POST",
    headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" },
    body: JSON.stringify({ name: preferred, folder: {}, "@microsoft.graph.conflictBehavior": "fail" }),
    signal: AbortSignal.timeout(15000),
  });
  if (!createRes.ok && createRes.status !== 409) {
    throw new Error(`Could not create the portal folder "${preferred}": ${await createRes.text()}`);
  }
  return { name: preferred, path: `/${preferred}` };
}

// Stores the bytes directly in the portal's folder (never in the vault taxonomy).
export async function uploadToPortalFolder(accessToken: string, moduleId: string, fileName: string, bytes: ArrayBuffer, portalName?: string) {
  const folder = await resolvePortalFolder(accessToken, moduleId, portalName);
  const { itemId, name } = await uploadFileToVault(accessToken, folder.path, fileName, bytes);
  return { itemId, name, path: folder.path, folderName: folder.name };
}