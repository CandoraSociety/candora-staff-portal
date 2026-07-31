import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';
import {
  DRIVE_ID, PATHWAYS_FOLDER, FINANCE_FOLDER, MASTER_TEMPLATE_NAME,
  getGraphToken, getPathwaysFolder
} from '../../shared/crtWorkbook.ts';

// One-time setup: upload an initial CRT workbook to _DEPT_Pathways
// Pass { fileUrl, fileName } — fileUrl is a public URL to an .xlsx file
export default async function(req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const { fileUrl, fileName } = body;
    if (!fileUrl || !fileName) {
      return Response.json({ error: 'fileUrl and fileName are required' }, { status: 400 });
    }

    const accessToken = await getGraphToken();

    // 1. Download the file from the provided URL
    const fileRes = await fetch(fileUrl);
    if (!fileRes.ok) {
      return Response.json({ error: 'Failed to download file from provided URL', status: fileRes.status }, { status: 400 });
    }
    const fileBuffer = await fileRes.arrayBuffer();

    // 2. Upload to _DEPT_Pathways folder
    const folder = await getPathwaysFolder(accessToken);
    const uploadRes = await fetch(
      `https://graph.microsoft.com/v1.0/drives/${DRIVE_ID}/items/${folder.id}:/${encodeURIComponent(fileName)}:/content`,
      {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        },
        body: fileBuffer
      }
    );

    if (!uploadRes.ok) {
      const errText = await uploadRes.text();
      return Response.json({ error: 'Failed to upload to SharePoint', details: errText }, { status: 500 });
    }

    const uploadedFile = await uploadRes.json();

    return Response.json({
      status: 'success',
      message: `${fileName} uploaded to ${PATHWAYS_FOLDER}`,
      file: {
        id: uploadedFile.id,
        name: uploadedFile.name,
        webUrl: uploadedFile.webUrl,
      }
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}