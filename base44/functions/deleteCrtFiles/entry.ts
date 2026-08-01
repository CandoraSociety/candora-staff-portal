import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';
import { DRIVE_ID, getGraphToken, getPathwaysFolder } from '../../shared/crtWorkbook.ts';

export default async function(req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const fileNames = Array.isArray(body?.fileNames) ? body.fileNames.filter(Boolean) : [];

    if (fileNames.length === 0) {
      return Response.json({ error: 'No fileNames provided.' }, { status: 400 });
    }

    const accessToken = await getGraphToken();
    const folder = await getPathwaysFolder(accessToken);

    // List all children of the Pathways folder
    const childrenRes = await fetch(`https://graph.microsoft.com/v1.0/drives/${DRIVE_ID}/items/${folder.id}/children`, {
      headers: { Authorization: `Bearer ${accessToken}` }
    });
    if (!childrenRes.ok) {
      return Response.json({ error: 'Failed to list folder contents', details: await childrenRes.text() }, { status: 500 });
    }
    const children = await childrenRes.json();

    const deleted = [];
    const notFound = [];
    const errors = [];

    for (const name of fileNames) {
      const file = (children.value || []).find(f => f.name.toLowerCase() === name.toLowerCase());
      if (!file) {
        notFound.push(name);
        continue;
      }
      const delRes = await fetch(`https://graph.microsoft.com/v1.0/drives/${DRIVE_ID}/items/${file.id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${accessToken}` }
      });
      if (delRes.ok || delRes.status === 204) {
        deleted.push(name);
      } else {
        errors.push({ name, status: delRes.status, details: await delRes.text() });
      }
    }

    return Response.json({
      status: 'success',
      deleted,
      notFound,
      errors: errors.length ? errors : undefined,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}