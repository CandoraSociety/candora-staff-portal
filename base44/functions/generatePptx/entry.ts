import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';
import pptxgen from 'npm:pptxgenjs@3.12.0';

const DRIVE_ID = 'b!hxKx8kC6-E-Lnj84eAg_LC-uIFP5HdVPkWTwcDFuP1P7ca7jYKZ5Ra_M7gnd5aOy';
const NAVY = '0F1F6B';
const ACCENT = '2B2DE8';
const WHITE = 'FFFFFF';
const DARK = '333333';

function arrayBufferToBase64(buf) {
  const bytes = new Uint8Array(buf);
  let binary = '';
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

async function getGraphToken() {
  const clientId = Deno.env.get('AZURE_CLIENT_ID');
  const clientSecret = Deno.env.get('AZURE_CLIENT_SECRET');
  const tenantId = Deno.env.get('AZURE_TENANT_ID');
  const tokenRes = await fetch(`https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      scope: 'https://graph.microsoft.com/.default',
      grant_type: 'client_credentials'
    })
  });
  const tokenData = await tokenRes.json();
  return tokenData.access_token;
}

async function ensurePresentationsFolder(accessToken) {
  await fetch(`https://graph.microsoft.com/v1.0/drives/${DRIVE_ID}/root/children`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: 'presentations', folder: {}, '@microsoft.graph.conflictBehavior': 'fail' })
  }).catch(() => {});
}

async function fetchImageAsBase64(url) {
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    const buf = await res.arrayBuffer();
    const contentType = res.headers.get('content-type') || 'image/jpeg';
    return `data:${contentType};base64,${arrayBufferToBase64(buf)}`;
  } catch (e) {
    return null;
  }
}

function parseBullets(text) {
  return text.split('\n').filter(l => l.trim()).map(line => ({
    text: line.replace(/^[-•*]\s*/, ''),
    options: { bullet: true }
  }));
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const { title, description, slides, presentation_id } = body;

    if (!title || !slides || !Array.isArray(slides)) {
      return Response.json({ error: 'title and slides array are required' }, { status: 400 });
    }

    const accessToken = await getGraphToken();
    await ensurePresentationsFolder(accessToken);

    const orgSettingsList = await base44.asServiceRole.entities.OrgSettings.list();
    const org = orgSettingsList[0] || {};

    const imageCache = {};
    for (const slide of slides) {
      if (slide.image_url && !imageCache[slide.image_url]) {
        imageCache[slide.image_url] = await fetchImageAsBase64(slide.image_url);
      }
    }
    if (org.logo_url && !imageCache[org.logo_url]) {
      imageCache[org.logo_url] = await fetchImageAsBase64(org.logo_url);
    }
    const logoData = org.logo_url ? imageCache[org.logo_url] : null;

    const pptx = new pptxgen();
    pptx.layout = 'LAYOUT_WIDE';
    pptx.author = org.org_name || 'Candora';
    pptx.company = org.org_name || 'Candora';
    pptx.subject = title;

    for (const slide of slides) {
      const s = pptx.addSlide();
      const layout = slide.layout || 'title_content';

      if (layout === 'title') {
        s.background = { color: WHITE };
        if (slide.title) {
          s.addText(slide.title, {
            x: 0.5, y: 1.8, w: 9, h: 1.5,
            fontSize: 36, bold: true, align: 'center',
            color: NAVY, fontFace: 'Arial'
          });
        }
        if (description) {
          s.addText(description, {
            x: 1, y: 3.4, w: 8, h: 0.8,
            fontSize: 18, align: 'center', color: ACCENT, fontFace: 'Arial'
          });
        }
        if (logoData) {
          s.addImage({ data: logoData, x: 4, y: 4.3, w: 2, h: 0.8 });
        }
      } else if (layout === 'section') {
        s.background = { color: NAVY };
        if (slide.title) {
          s.addText(slide.title, {
            x: 0.5, y: 2, w: 9, h: 1.5,
            fontSize: 34, bold: true, align: 'center',
            color: WHITE, fontFace: 'Arial'
          });
        }
      } else if (layout === 'title_image') {
        if (slide.title) {
          s.addText(slide.title, {
            x: 0.5, y: 0.3, w: 9, h: 0.8,
            fontSize: 28, bold: true, color: NAVY, fontFace: 'Arial'
          });
        }
        if (slide.image_url && imageCache[slide.image_url]) {
          s.addImage({ data: imageCache[slide.image_url], x: 2, y: 1.3, w: 6, h: 3.8 });
        }
      } else if (layout === 'title_content_image') {
        if (slide.title) {
          s.addText(slide.title, {
            x: 0.5, y: 0.3, w: 9, h: 0.8,
            fontSize: 28, bold: true, color: NAVY, fontFace: 'Arial'
          });
        }
        if (slide.content) {
          s.addText(parseBullets(slide.content), {
            x: 0.5, y: 1.3, w: 4.5, h: 4,
            fontSize: 16, color: DARK, fontFace: 'Arial', valign: 'top'
          });
        }
        if (slide.image_url && imageCache[slide.image_url]) {
          s.addImage({ data: imageCache[slide.image_url], x: 5.3, y: 1.3, w: 4.2, h: 3.8 });
        }
      } else {
        if (slide.title) {
          s.addText(slide.title, {
            x: 0.5, y: 0.3, w: 9, h: 0.8,
            fontSize: 28, bold: true, color: NAVY, fontFace: 'Arial'
          });
        }
        if (slide.content) {
          s.addText(parseBullets(slide.content), {
            x: 0.5, y: 1.3, w: 9, h: 4,
            fontSize: 18, color: DARK, fontFace: 'Arial', valign: 'top'
          });
        }
      }

      if (slide.notes) {
        s.addNotes(slide.notes);
      }
    }

    const pptxBase64 = await pptx.write({ outputType: 'base64' });
    const binary = Uint8Array.from(atob(pptxBase64), c => c.charCodeAt(0));

    const filename = `${title.replace(/[^a-zA-Z0-9]/g, '_')}.pptx`;
    const uploadRes = await fetch(
      `https://graph.microsoft.com/v1.0/drives/${DRIVE_ID}/root:/presentations/${filename}:/content`,
      {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/vnd.openxmlformats-officedocument.presentationml.presentation'
        },
        body: binary
      }
    );

    if (!uploadRes.ok) {
      const errText = await uploadRes.text();
      return Response.json({ error: 'Failed to upload to SharePoint', details: errText }, { status: 500 });
    }

    const fileData = await uploadRes.json();

    if (presentation_id) {
      await base44.entities.Presentation.update(presentation_id, {
        sharepoint_file_url: fileData.webUrl,
        sharepoint_file_id: fileData.id,
        status: 'completed'
      });
    }

    return Response.json({
      status: 'success',
      file_url: fileData.webUrl,
      file_id: fileData.id,
      file_name: fileData.name
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});