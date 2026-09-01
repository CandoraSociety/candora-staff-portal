import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';
import JSZip from 'npm:jszip@3.10.1';
import { DRIVE_ID, getGraphToken, listCrtFiles } from '../../shared/crtWorkbook.ts';

const CLIENT_DATA_SHEET = 'Client Data';

// Inject (or replace) a frozen-pane definition in a worksheet XML string so
// the top `ySplit` rows stay visible when scrolling. The pane is inserted as
// the first child of the first <sheetView> (correct OOXML child order: pane
// must precede selection).
function applyFreezePaneToSheetXml(xml: string, ySplit: number): string {
  const topLeftCell = `A${ySplit + 1}`;
  const paneTag = `<pane ySplit="${ySplit}" topLeftCell="${topLeftCell}" activePane="bottomLeft" state="frozen"/>`;

  // Self-closing <sheetView .../> → expand it and insert the pane.
  const selfRe = /<sheetView\b[^>]*\/>/;
  if (selfRe.test(xml)) {
    return xml.replace(selfRe, (m) => m.replace(/\/>$/, `>${paneTag}</sheetView>`));
  }

  // Open <sheetView ...> ... </sheetView>
  const openRe = /<sheetView\b[^>]*>/;
  const m = xml.match(openRe);
  if (!m) return xml;
  const openTag = m[0];
  const idx = m.index ?? 0;
  const after = xml.slice(idx + openTag.length);
  // Strip any pre-existing pane (self-closing or open/close) so we don't stack two.
  const cleaned = after
    .replace(/<pane\b[^>]*\/>/, '')
    .replace(/<pane\b[^>]*>[\s\S]*?<\/pane>/, '');
  return xml.slice(0, idx) + openTag + paneTag + cleaned;
}

// Resolve the worksheet XML part path for the "Client Data" sheet from the
// workbook's sheet table + rels, then rewrite it with the freeze pane and
// PUT the whole .xlsx back to SharePoint.
async function applyToFile(accessToken: string, itemId: string, fileName: string, ySplit: number) {
  const dl = await fetch(
    `https://graph.microsoft.com/v1.0/drives/${DRIVE_ID}/items/${itemId}/content`,
    { headers: { Authorization: `Bearer ${accessToken}` } }
  );
  if (!dl.ok) throw new Error(`Download failed (${fileName}): ${dl.status}`);
  const buf = await dl.arrayBuffer();
  const zip = await JSZip.loadAsync(buf);

  const wbXmlFile = zip.file('xl/workbook.xml');
  if (!wbXmlFile) throw new Error(`Workbook XML not found (${fileName})`);
  const wbXml = await wbXmlFile.async('string');
  // The <sheet> attribute order can vary (name before r:id, or r:id before name).
  const sheetMatch =
    wbXml.match(new RegExp(`<sheet\\b[^>]*?name="${CLIENT_DATA_SHEET}"[^>]*?r:id="([^"]+)"`, 'i')) ||
    wbXml.match(new RegExp(`<sheet\\b[^>]*?r:id="([^"]+)"[^>]*?name="${CLIENT_DATA_SHEET}"`, 'i'));
  if (!sheetMatch) throw new Error(`'Client Data' sheet not found (${fileName})`);
  const rId = sheetMatch[1];

  const relsFile = zip.file('xl/_rels/workbook.xml.rels');
  if (!relsFile) throw new Error(`Workbook rels not found (${fileName})`);
  const relsXml = await relsFile.async('string');
  const relMatch =
    relsXml.match(new RegExp(`<Relationship\\b[^>]*?Id="${rId}"[^>]*?Target="([^"]+)"`, 'i')) ||
    relsXml.match(new RegExp(`<Relationship\\b[^>]*?Target="([^"]+)"[^>]*?Id="${rId}"`, 'i'));
  if (!relMatch) throw new Error(`Sheet relationship ${rId} not found (${fileName})`);
  const target = relMatch[1];
  const sheetPath = target.startsWith('/') ? target.slice(1) : `xl/${target}`;

  const sheetFile = zip.file(sheetPath);
  if (!sheetFile) throw new Error(`Sheet part '${sheetPath}' not found (${fileName})`);
  const sheetXml = await sheetFile.async('string');
  const newSheetXml = applyFreezePaneToSheetXml(sheetXml, ySplit);
  if (newSheetXml === sheetXml) throw new Error(`Could not locate sheetView in ${sheetPath} (${fileName})`);
  zip.file(sheetPath, newSheetXml);

  const out = await zip.generateAsync({ type: 'uint8array', compression: 'DEFLATE' });
  const put = await fetch(
    `https://graph.microsoft.com/v1.0/drives/${DRIVE_ID}/items/${itemId}/content`,
    {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      },
      body: out
    }
  );
  if (!put.ok) {
    const txt = await put.text().catch(() => '');
    throw new Error(`Upload failed (${fileName}): ${put.status} ${txt}`);
  }
  return { file_name: fileName, ok: true };
}

// Applies a frozen pane (top `rows` rows) to the "Client Data" sheet of one
// CRT workbook (file_id) or every CRT_*.xlsx in _DEPT_Pathways (default). The
// pane is written directly into the worksheet XML and the file is PUT back,
// because the Graph Excel REST API has no freeze-pane endpoint.
export default async function(req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    let body: any = {};
    try { body = await req.json(); } catch { /* empty body */ }
    const rows = Math.max(1, Math.min(50, Number(body.rows) || 13));
    const accessToken = await getGraphToken();

    let targets: { id: string; name: string }[] = [];
    if (body.file_id) {
      targets.push({ id: body.file_id, name: body.file_name || body.file_id });
    } else {
      const files = await listCrtFiles(accessToken);
      targets = files.map((f: any) => ({ id: f.id, name: f.name }));
    }
    if (targets.length === 0) return Response.json({ status: 'no_workbook' });

    const applied: any[] = [];
    const errors: any[] = [];
    for (const t of targets) {
      try {
        applied.push(await applyToFile(accessToken, t.id, t.name, rows));
      } catch (e) {
        errors.push({ file_name: t.name, error: e.message });
      }
    }
    return Response.json({ status: 'success', rows, applied, errors });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}