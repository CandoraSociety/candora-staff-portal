import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';
import JSZip from 'npm:jszip@3.10.1';
import pptxgen from 'npm:pptxgenjs@3.12.0';

const DRIVE_ID = 'b!hxKx8kC6-E-Lnj84eAg_LC-uIFP5HdVPkWTwcDFuP1P7ca7jYKZ5Ra_M7gnd5aOy';

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

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Failed to get access token: ${errText}`);
  }

  const data = await res.json();
  return data.access_token;
}

async function createBlankDocx() {
  const zip = new JSZip();
  zip.file('[Content_Types].xml', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
</Types>`);
  zip.folder('_rels').file('.rels', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>
</Relationships>`);
  zip.folder('word').file('document.xml', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:body>
    <w:p/>
  </w:body>
</w:document>`);
  return await zip.generateAsync({ type: 'uint8array' });
}

async function createBlankXlsx() {
  const zip = new JSZip();
  zip.file('[Content_Types].xml', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>
  <Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>
</Types>`);
  zip.folder('_rels').file('.rels', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>
</Relationships>`);
  zip.folder('xl').file('workbook.xml', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
  <sheets>
    <sheet name="Sheet1" sheetId="1" r:id="rId1"/>
  </sheets>
</workbook>`);
  zip.folder('xl').folder('_rels').file('workbook.xml.rels', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/>
</Relationships>`);
  zip.folder('xl').folder('worksheets').file('sheet1.xml', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
  <sheetData/>
</worksheet>`);
  return await zip.generateAsync({ type: 'uint8array' });
}

async function createBlankPptx() {
  const pptx = new pptxgen();
  pptx.layout = 'LAYOUT_WIDE';
  pptx.addSlide();
  const pptxBase64 = await pptx.write({ outputType: 'base64' });
  return Uint8Array.from(atob(pptxBase64), c => c.charCodeAt(0));
}

/**
 * Ensures a private SharePoint folder exists for the user.
 * Folder is named _PRIVATE_<email> and has broken permission inheritance —
 * only the user (and app-level admin) can access it.
 */
async function ensurePrivateFolder(accessToken, userEmail) {
  if (!userEmail) throw new Error('User email is required to create private folder');
  const folderName = `_PRIVATE_${userEmail}`;
  const folderPath = `/${folderName}`;

  // Try to get existing folder by path
  const getRes = await fetch(`https://graph.microsoft.com/v1.0/drives/${DRIVE_ID}/root:${folderPath}`, {
    headers: { Authorization: `Bearer ${accessToken}` }
  });

  if (getRes.ok) {
    const existing = await getRes.json();
    return { id: existing.id, name: existing.name, path: folderPath };
  }

  // Folder doesn't exist — create it
  const createRes = await fetch(`https://graph.microsoft.com/v1.0/drives/${DRIVE_ID}/root/children`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      name: folderName,
      folder: {},
      '@microsoft.graph.conflictBehavior': 'fail'
    })
  });

  if (!createRes.ok) {
    // Race condition — another request may have created it. Try fetching again.
    const retryRes = await fetch(`https://graph.microsoft.com/v1.0/drives/${DRIVE_ID}/root:${folderPath}`, {
      headers: { Authorization: `Bearer ${accessToken}` }
    });
    if (retryRes.ok) {
      const retryData = await retryRes.json();
      return { id: retryData.id, name: retryData.name, path: folderPath };
    }
    const errText = await createRes.text();
    throw new Error(`Failed to create private folder: ${errText}`);
  }

  const folderData = await createRes.json();

  // Break permission inheritance and grant ONLY this user write access.
  // retainInheritedPermissions: false removes all inherited permissions.
  const inviteRes = await fetch(`https://graph.microsoft.com/v1.0/drives/${DRIVE_ID}/items/${folderData.id}/invite`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      recipients: [{ email: userEmail }],
      roles: ['write'],
      requireSignIn: true,
      sendInvitation: false,
      retainInheritedPermissions: false
    })
  });

  if (!inviteRes.ok) {
    const errText = await inviteRes.text();
    // Folder exists but permissions may not be set — log but don't fail.
    // App-level admin access (client credentials) bypasses item permissions regardless.
    console.log(`Warning: could not set folder permissions for ${userEmail}: ${errText}`);
  }

  return { id: folderData.id, name: folderData.name, path: folderPath };
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const { docType, fileName } = body;

    if (!docType || !['word', 'excel', 'powerpoint'].includes(docType)) {
      return Response.json({ error: 'Invalid docType. Use "word", "excel", or "powerpoint"' }, { status: 400 });
    }

    const ext = docType === 'word' ? 'docx' : docType === 'excel' ? 'xlsx' : 'pptx';
    const defaultNames = { word: 'Document', excel: 'Workbook', powerpoint: 'Presentation' };
    const baseName = (fileName || `New ${defaultNames[docType] || 'Document'}`).replace(/\.[^/.]+$/, '').replace(/[^a-zA-Z0-9 _-]/g, '').trim();
    const fullName = `${baseName}.${ext}`;

    const fileBytes = docType === 'word' ? await createBlankDocx() : docType === 'excel' ? await createBlankXlsx() : await createBlankPptx();
    const accessToken = await getAccessToken();

    // Ensure user's private folder exists (created on first use, permissions locked to this user)
    const folder = await ensurePrivateFolder(accessToken, user.email);
    const filePath = `${folder.path}/${fullName}`;

    // Upload to user's private SharePoint folder
    const uploadUrl = `https://graph.microsoft.com/v1.0/drives/${DRIVE_ID}/root:${filePath}:/content`;
    const uploadRes = await fetch(uploadUrl, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/octet-stream'
      },
      body: fileBytes
    });

    if (!uploadRes.ok) {
      const errText = await uploadRes.text();
      return Response.json({ error: 'Failed to upload file to SharePoint', details: errText }, { status: 500 });
    }

    const itemData = await uploadRes.json();

    // Get embed URL via preview endpoint — editable, with full UI
    let embedUrl = itemData.webUrl;
    const previewRes = await fetch(`https://graph.microsoft.com/v1.0/drives/${DRIVE_ID}/items/${itemData.id}/preview`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ viewer: 'office_online', chromeless: false, allowEdit: true })
    });

    if (previewRes.ok) {
      const previewData = await previewRes.json();
      if (previewData.getUrl) embedUrl = previewData.getUrl;
    }

    // Create a File entity record — personal access level, only the owner sees it
    await base44.asServiceRole.entities.File.create({
      original_name: fullName,
      display_name: baseName,
      file_url: itemData.webUrl,
      file_type: ext,
      access_level: 'personal',
      category: 'other',
      owner_email: user.email,
      owner_name: user.full_name,
      source_app: 'office_ribbon'
    });

    return Response.json({
      success: true,
      embed_url: embedUrl,
      file_name: fullName,
      sharepoint_web_url: itemData.webUrl,
      sharepoint_item_id: itemData.id,
      private_folder: folder.name
    });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});