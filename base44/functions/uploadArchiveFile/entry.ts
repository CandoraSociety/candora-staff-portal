import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

const DRIVE_ID = 'b!hxKx8kC6-E-Lnj84eAg_LC-uIFP5HdVPkWTwcDFuP1P7ca7jYKZ5Ra_M7gnd5aOy';
const FOLDER_NAME = '_ARCHIVES_Candora_History';
const FOLDER_PATH = `/${FOLDER_NAME}`;

async function getAccessToken() {
  const clientId = Deno.env.get('AZURE_CLIENT_ID');
  const clientSecret = Deno.env.get('AZURE_CLIENT_SECRET');
  const tenantId = Deno.env.get('AZURE_TENANT_ID');

  const tokenUrl = `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/token`;
  const tokenBody = new URLSearchParams({
    client_id: clientId,
    client_secret: clientSecret,
    scope: 'https://graph.microsoft.com/.default',
    grant_type: 'client_credentials'
  });

  const res = await fetch(tokenUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: tokenBody
  });

  if (!res.ok) throw new Error(`Token fetch failed: ${await res.text()}`);
  const data = await res.json();
  return data.access_token;
}

async function ensureFolderExists(accessToken) {
  const getRes = await fetch(`https://graph.microsoft.com/v1.0/drives/${DRIVE_ID}/root:${FOLDER_PATH}`, {
    headers: { Authorization: `Bearer ${accessToken}` }
  });
  if (getRes.ok) {
    const existing = await getRes.json();
    return existing.id;
  }

  // Create folder
  const createRes = await fetch(`https://graph.microsoft.com/v1.0/drives/${DRIVE_ID}/root/children`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: FOLDER_NAME, folder: {}, '@microsoft.graph.conflictBehavior': 'fail' })
  });

  if (!createRes.ok) {
    const retryRes = await fetch(`https://graph.microsoft.com/v1.0/drives/${DRIVE_ID}/root:${FOLDER_PATH}`, {
      headers: { Authorization: `Bearer ${accessToken}` }
    });
    if (retryRes.ok) {
      const retryData = await retryRes.json();
      return retryData.id;
    }
    throw new Error(`Failed to create archives folder: ${await createRes.text()}`);
  }

  const folderData = await createRes.json();
  return folderData.id;
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const { file_url, fileName, description, subcategory } = body;

    if (!file_url || !fileName) {
      return Response.json({ error: 'file_url and fileName are required' }, { status: 400 });
    }

    const accessToken = await getAccessToken();
    await ensureFolderExists(accessToken);

    // Download file from Base44 storage URL
    const fileResponse = await fetch(file_url);
    if (!fileResponse.ok) throw new Error('Failed to download file from provided URL');
    const fileBytes = new Uint8Array(await fileResponse.arrayBuffer());
    const contentType = fileResponse.headers.get('content-type') || 'application/octet-stream';

    // Sanitize filename and construct path
    const safeName = fileName.replace(/[^a-zA-Z0-9 _.-]/g, '').trim();
    const filePath = `${FOLDER_PATH}/${safeName}`;

    // Upload to SharePoint
    const uploadRes = await fetch(`https://graph.microsoft.com/v1.0/drives/${DRIVE_ID}/root:${filePath}:/content`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': contentType },
      body: fileBytes
    });

    if (!uploadRes.ok) {
      throw new Error(`SharePoint upload failed: ${await uploadRes.text()}`);
    }

    const itemData = await uploadRes.json();
    const ext = safeName.split('.').pop()?.toLowerCase() || '';

    // Create File entity record
    await base44.asServiceRole.entities.File.create({
      original_name: fileName,
      display_name: fileName.replace(/\.[^/.]+$/, ''),
      description: description || '',
      file_url: itemData.webUrl,
      file_type: ext,
      file_size: fileBytes.length,
      category: 'archives',
      subcategory: subcategory || '',
      access_level: 'corporate',
      owner_email: user.email,
      owner_name: user.full_name,
      source_app: 'archives_portal'
    });

    return Response.json({
      success: true,
      sharepoint_web_url: itemData.webUrl,
      sharepoint_item_id: itemData.id,
      file_name: safeName
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});