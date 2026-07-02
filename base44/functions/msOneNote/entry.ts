import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

const OUTLOOK_CONNECTOR_ID = '6a43f36f28e8ea04989eb603';

async function graphRequest(accessToken, path, options = {}) {
  const res = await fetch(`https://graph.microsoft.com/v1.0${path}`, {
    ...options,
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
  });
  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Graph API error ${res.status}: ${errText}`);
  }
  const text = await res.text();
  return text ? JSON.parse(text) : null;
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const { action } = body;

    const { accessToken } = await base44.asServiceRole.connectors.getCurrentAppUserConnection(OUTLOOK_CONNECTOR_ID);

    switch (action) {
      case 'getProfile': {
        const profile = await graphRequest(accessToken, '/me?$select=displayName,mail,userPrincipalName');
        return Response.json({ profile });
      }

      case 'listNotebooks': {
        const data = await graphRequest(accessToken, '/me/onenote/notebooks?$select=id,displayName,lastModifiedDateTime,isDefault&$orderby=lastModifiedDateTime desc');
        return Response.json({ notebooks: data.value || [] });
      }

      case 'listSections': {
        const { notebookId } = body;
        const path = notebookId
          ? `/me/onenote/notebooks/${notebookId}/sections?$select=id,displayName&$orderby=displayName`
          : '/me/onenote/sections?$select=id,displayName&$orderby=displayName';
        const data = await graphRequest(accessToken, path);
        return Response.json({ sections: data.value || [] });
      }

      case 'listPages': {
        const { sectionId, top = 50 } = body;
        const path = sectionId
          ? `/me/onenote/sections/${sectionId}/pages?$select=id,title,createdDateTime,lastModifiedDateTime&$top=${top}&$orderby=lastModifiedDateTime desc`
          : `/me/onenote/pages?$select=id,title,createdDateTime,lastModifiedDateTime&$top=${top}&$orderby=lastModifiedDateTime desc`;
        const data = await graphRequest(accessToken, path);
        return Response.json({ pages: data.value || [] });
      }

      case 'getPageContent': {
        const { pageId } = body;
        const res = await fetch(`https://graph.microsoft.com/v1.0/me/onenote/pages/${pageId}/content`, {
          headers: { 'Authorization': `Bearer ${accessToken}` },
        });
        if (!res.ok) {
          const errText = await res.text();
          throw new Error(`Graph API error ${res.status}: ${errText}`);
        }
        const html = await res.text();
        return Response.json({ html });
      }

      default:
        return Response.json({ error: 'Unknown action: ' + action }, { status: 400 });
    }
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});