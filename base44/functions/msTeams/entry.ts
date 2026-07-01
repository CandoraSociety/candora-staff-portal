import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

const TEAMS_CONNECTOR_ID = '6a43f37d6ee957e7d3ac6e0f';

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

    const { accessToken } = await base44.asServiceRole.connectors.getCurrentAppUserConnection(TEAMS_CONNECTOR_ID);

    switch (action) {
      case 'getProfile': {
        const profile = await graphRequest(accessToken, '/me?$select=displayName,mail,userPrincipalName');
        return Response.json({ profile });
      }

      case 'listChats': {
        const data = await graphRequest(accessToken, '/me/chats?$expand=members&$orderby=lastUpdatedDateTime desc&$top=50');
        return Response.json({ chats: data.value || [] });
      }

      case 'getChatMessages': {
        const { chatId } = body;
        const data = await graphRequest(accessToken, `/me/chats/${chatId}/messages?$top=50&$orderby=createdDateTime desc`);
        const messages = (data.value || []).reverse();
        return Response.json({ messages });
      }

      case 'sendChatMessage': {
        const { chatId, content } = body;
        const data = await graphRequest(accessToken, `/me/chats/${chatId}/messages`, {
          method: 'POST',
          body: JSON.stringify({ body: { content, contentType: 'text' } }),
        });
        return Response.json({ message: data });
      }

      case 'listTeams': {
        const data = await graphRequest(accessToken, '/me/joinedTeams?$select=id,displayName,description');
        return Response.json({ teams: data.value || [] });
      }

      case 'listChannels': {
        const { teamId } = body;
        const data = await graphRequest(accessToken, `/teams/${teamId}/channels?$select=id,displayName,description`);
        return Response.json({ channels: data.value || [] });
      }

      case 'listChannelMessages': {
        const { teamId, channelId } = body;
        const data = await graphRequest(accessToken, `/teams/${teamId}/channels/${channelId}/messages?$top=50`);
        const messages = (data.value || []).reverse();
        return Response.json({ messages });
      }

      case 'sendChannelMessage': {
        const { teamId, channelId, content } = body;
        const data = await graphRequest(accessToken, `/teams/${teamId}/channels/${channelId}/messages`, {
          method: 'POST',
          body: JSON.stringify({ body: { content, contentType: 'text' } }),
        });
        return Response.json({ message: data });
      }

      default:
        return Response.json({ error: 'Unknown action: ' + action }, { status: 400 });
    }
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});