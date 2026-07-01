import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';
import JSZip from 'npm:jszip@3.10.1';

const DRIVE_ID = 'b!hxKx8kC6-E-Lnj84eAg_LC-uIFP5HdVPkWTwcDFuP1P7ca7jYKZ5Ra_M7gnd5aOy';
const FOLDER = 'Office Documents';

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

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const { docType, fileName } = body;

    if (!docType || !['word', 'excel'].includes(docType)) {
      return Response.json({ error: 'Invalid docType. Use "word" or "excel"' }, { status: 400 });
    }

    const ext = docType === 'word' ? 'docx' : 'xlsx';
    const baseName = (fileName || `New ${docType === 'word' ? 'Document' : 'Workbook'}`).replace(/\.[^/.]+$/, '').replace(/[^a-zA-Z0-9 _-]/g, '').trim();
    const fullName = `${baseName}.${ext}`;
    const filePath = `/${FOLDER}/${fullName}`;

    const fileBytes = docType === 'word' ? await createBlankDocx() : await createBlankXlsx();
    const accessToken = await getAccessToken();

    // Upload to SharePoint
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

    // Get embed URL via preview endpoint
    let embedUrl = itemData.webUrl;
    const previewRes = await fetch(`https://graph.microsoft.com/v1.0/drives/${DRIVE_ID}/items/${itemData.id}/preview`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ viewer: 'office_online' })
    });

    if (previewRes.ok) {
      const previewData = await previewRes.json();
      if (previewData.getUrl) embedUrl = previewData.getUrl;
    }

    // Also create a File entity record so it appears in the File Manager
    await base44.asServiceRole.entities.File.create({
      original_name: fullName,
      display_name: baseName,
      file_url: itemData.webUrl,
      file_type: ext,
      access_level: 'universal',
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
      sharepoint_item_id: itemData.id
    });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});