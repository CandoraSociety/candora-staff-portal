import { createClientFromRequest } from 'npm:@base44/sdk@0.8.49';
import { getGraphAccessToken, ensureDriveFolder } from '../../shared/graphDrive.ts';

// Backs up a deleted finalized minutes document to the restricted
// "_PRIVATE_Deleted Minutes" SharePoint folder before it disappears from the portal.
const DRIVE_ID = 'b!hxKx8kC6-E-Lnj84eAg_LC-uIFP5HdVPkWTwcDFuP1P7ca7jYKZ5Ra_M7gnd5aOy';
const FOLDER_NAME = '_PRIVATE_Deleted Minutes';
const FOLDER_PATH = `/${FOLDER_NAME}`;

export default async function(req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { file_url, file_name, title } = await req.json();
    if (!file_url) {
      return Response.json({ error: 'file_url is required' }, { status: 400 });
    }

    const accessToken = await getGraphAccessToken();
    await ensureDriveFolder(accessToken, DRIVE_ID, FOLDER_NAME, FOLDER_PATH);

    // Download the minutes file from app storage
    const fileResponse = await fetch(file_url);
    if (!fileResponse.ok) throw new Error('Failed to download the minutes file');
    const fileBytes = new Uint8Array(await fileResponse.arrayBuffer());
    const contentType = fileResponse.headers.get('content-type') || 'text/html';

    // Timestamped archive name so repeated deletes never overwrite each other
    const stamp = new Date().toISOString().slice(0, 16).replace('T', ' ');
    const ext = String(file_name || 'minutes.html').split('.').pop() || 'html';
    const safeName = `Deleted ${stamp} ${(title || 'Board Minutes')}.${ext}`
      .replace(/[^a-zA-Z0-9 _.-]/g, '')
      .replace(/ +/g, ' ')
      .trim();

    const uploadRes = await fetch(
      `https://graph.microsoft.com/v1.0/drives/${DRIVE_ID}/root:${FOLDER_PATH}/${safeName}:/content`,
      {
        method: 'PUT',
        headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': contentType },
        body: fileBytes,
      }
    );
    if (!uploadRes.ok) throw new Error(`SharePoint upload failed: ${await uploadRes.text()}`);

    const itemData = await uploadRes.json();
    return Response.json({
      success: true,
      sharepoint_web_url: itemData.webUrl,
      archived_name: safeName,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}