// Shared Microsoft Graph drive helpers for SharePoint-backed backend functions
import { secrets } from "base44:runtime";

export async function getGraphAccessToken(): Promise<string> {
  const clientId = secrets.get("AZURE_CLIENT_ID");
  const clientSecret = secrets.get("AZURE_CLIENT_SECRET");
  const tenantId = secrets.get("AZURE_TENANT_ID");

  const tokenUrl = `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/token`;
  const res = await fetch(tokenUrl, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      scope: "https://graph.microsoft.com/.default",
      grant_type: "client_credentials",
    }),
  });

  if (!res.ok) throw new Error(`Token fetch failed: ${await res.text()}`);
  const data = await res.json();
  return data.access_token;
}

export async function ensureDriveFolder(accessToken: string, driveId: string, folderName: string, folderPath: string): Promise<string> {
  const getRes = await fetch(`https://graph.microsoft.com/v1.0/drives/${driveId}/root:${folderPath}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (getRes.ok) {
    const existing = await getRes.json();
    return existing.id;
  }

  const createRes = await fetch(`https://graph.microsoft.com/v1.0/drives/${driveId}/root/children`, {
    method: "POST",
    headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" },
    body: JSON.stringify({ name: folderName, folder: {}, "@microsoft.graph.conflictBehavior": "fail" }),
  });

  if (!createRes.ok) {
    const retryRes = await fetch(`https://graph.microsoft.com/v1.0/drives/${driveId}/root:${folderPath}`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (retryRes.ok) {
      const retryData = await retryRes.json();
      return retryData.id;
    }
    throw new Error(`Failed to create folder ${folderName}: ${await createRes.text()}`);
  }

  const folderData = await createRes.json();
  return folderData.id;
}