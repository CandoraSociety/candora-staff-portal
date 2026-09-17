import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { FileText, Loader2 } from 'lucide-react';
import { jsPDF } from 'jspdf';

// Fetch a receipt image and return it as a PNG data URL (normalized through a
// canvas so any browser-renderable format works with jsPDF). Returns null when
// the file can't be fetched/rendered (e.g. a PDF receipt).
async function fetchAsPngDataUrl(url) {
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    const blob = await res.blob();
    if (!blob.type.startsWith('image/')) return null;
    const objectUrl = URL.createObjectURL(blob);
    try {
      const img = await new Promise((resolve, reject) => {
        const image = new Image();
        image.onload = () => resolve(image);
        image.onerror = reject;
        image.src = objectUrl;
      });
      const canvas = document.createElement('canvas');
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      const ctx = canvas.getContext('2d');
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0);
      return canvas.toDataURL('image/png');
    } finally {
      URL.revokeObjectURL(objectUrl);
    }
  } catch {
    return null;
  }
}

const loadImage = (dataUrl) => new Promise((resolve, reject) => {
  const i = new Image();
  i.onload = () => resolve(i);
  i.onerror = reject;
  i.src = dataUrl;
});

const fmt = n => `$${Number(n || 0).toFixed(2)}`;

// Builds one PDF containing every receipt attached to a reimbursement
// submission — one receipt per page, scaled to fit — and opens it in a new tab.
async function buildReceiptsPdf(entries, form, docTitle) {
  const withReceipts = entries.filter(e => e.receipt_url);

  // Load every embeddable receipt up front (need the first image's shape to
  // pick the orientation of page 1).
  const loaded = [];
  const failed = [];
  for (const e of withReceipts) {
    const dataUrl = await fetchAsPngDataUrl(e.receipt_url);
    if (!dataUrl) { failed.push(e); continue; }
    loaded.push({ entry: e, dataUrl, img: await loadImage(dataUrl) });
  }

  const doc = new jsPDF({
    unit: 'pt',
    format: 'letter',
    orientation: loaded.length && loaded[0].img.width > loaded[0].img.height ? 'landscape' : 'portrait',
  });

  loaded.forEach(({ entry: e, dataUrl, img }, i) => {
    const landscape = img.width > img.height;
    if (i > 0) doc.addPage('letter', landscape ? 'landscape' : 'portrait');

    const pw = doc.internal.pageSize.getWidth();
    const ph = doc.internal.pageSize.getHeight();
    const margin = 30;
    const labelH = 26;
    const maxW = pw - margin * 2;
    const maxH = ph - margin * 2 - labelH;
    const scale = Math.min(maxW / img.width, maxH / img.height, 1);
    const w = img.width * scale;
    const h = img.height * scale;

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.text(
      `${e.description || 'Receipt'}${e.date_incurred ? ` — ${e.date_incurred}` : ''}${e.supplier ? ` — ${e.supplier}` : ''}`,
      margin, margin + 4, { maxWidth: maxW }
    );
    doc.addImage(dataUrl, 'PNG', (pw - w) / 2, margin + labelH, w, h);
  });

  // Receipts that couldn't be embedded (e.g. PDF receipts) get a placeholder
  // page so nothing is silently missing from the bundle.
  for (const e of failed) {
    doc.addPage('letter', 'portrait');
    const pw = doc.internal.pageSize.getWidth();
    const margin = 40;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.text('Receipt not embedded', margin, 80);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.text(
      [
        `Entry: ${e.description || '—'}${e.date_incurred ? ` (${e.date_incurred})` : ''}`,
        'This receipt file is not an image (likely a PDF) and can\u2019t be embedded here.',
        'Open the original from the reimbursement entry table in the portal.',
      ],
      margin, 100, { maxWidth: pw - margin * 2, lineHeightFactor: 1.5 }
    );
  }

  // Submission summary strip on the first page footer.
  doc.setPage(1);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(120);
  doc.text(
    `${docTitle} — ${form.requester_name || ''} · ${fmt(form.amount)} · ${withReceipts.length} receipt${withReceipts.length === 1 ? '' : 's'}`,
    30, doc.internal.pageSize.getHeight() - 14
  );

  const blob = doc.output('blob');
  const url = URL.createObjectURL(blob);
  window.open(url, '_blank');
  setTimeout(() => URL.revokeObjectURL(url), 60000);
}

// Button shown on a finance reimbursement submission: opens every receipt
// attached to it as a single PDF (one receipt per page).
export default function AllReceiptsPdfButton({ entries = [], form, docTitle = 'Reimbursement' }) {
  const [busy, setBusy] = useState(false);
  const count = entries.filter(e => e.receipt_url).length;
  if (count === 0) return null;

  const handleClick = async () => {
    setBusy(true);
    try {
      await buildReceiptsPdf(entries, form, docTitle);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Button
      size="sm"
      variant="ghost"
      className="h-7 px-2 gap-1.5"
      onClick={handleClick}
      disabled={busy}
      title={`Open all ${count} receipt${count === 1 ? '' : 's'} attached to this submission as a single PDF`}
    >
      {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileText className="w-4 h-4" />}
      Receipts PDF
    </Button>
  );
}