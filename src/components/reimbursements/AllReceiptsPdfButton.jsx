import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { FileText, Loader2 } from 'lucide-react';
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import { useToast } from '@/components/ui/use-toast';

// Fetch a receipt and return it either as normalized PNG image bytes (any
// browser-renderable image format) or as the original PDF bytes.
async function fetchReceipt(url) {
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    const blob = await res.blob();
    if (blob.type === 'application/pdf' || /\.pdf(\?|$)/i.test(url)) {
      return { kind: 'pdf', bytes: new Uint8Array(await blob.arrayBuffer()) };
    }
    if (blob.type.startsWith('image/')) {
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
        const pngBlob = await new Promise(resolve => canvas.toBlob(resolve, 'image/png'));
        return { kind: 'image', bytes: new Uint8Array(await pngBlob.arrayBuffer()) };
      } finally {
        URL.revokeObjectURL(objectUrl);
      }
    }
    return null;
  } catch {
    return null;
  }
}

const fmt = n => `$${Number(n || 0).toFixed(2)}`;

// pdf-lib's standard fonts can only encode WinAnsi characters — any smart
// quotes/dashes/emoji in user-entered receipt text would throw and kill the
// whole build, so normalize text before drawing it.
const safe = s => (s || '')
  .replace(/[\u2018\u2019\u201A\u2032]/g, "'")
  .replace(/[\u201C\u201D\u201E]/g, '"')
  .replace(/\u2026/g, '...')
  .replace(/[\u2013\u2014\u2212]/g, '-')
  .replace(/[\u00B7\u2022]/g, '-')
  .replace(/[^\x00-\x7F\xA0-\xFF]/g, '');

const truncate = (s, n) => (s && s.length > n ? `${s.slice(0, n - 1)}...` : s || '');

// Builds one PDF containing every receipt attached to a reimbursement
// submission — image receipts get their own letter page, PDF receipts are
// merged in as-is (all their pages) — and opens it in a new tab.
async function buildReceiptsPdf(entries, form, docTitle) {
  const withReceipts = entries.filter(e => e.receipt_url);
  const out = await PDFDocument.create();
  const font = await out.embedFont(StandardFonts.Helvetica);
  const boldFont = await out.embedFont(StandardFonts.HelveticaBold);

  let merged = 0;
  const failed = [];

  for (const e of withReceipts) {
    const receipt = await fetchReceipt(e.receipt_url);
    if (!receipt) { failed.push(e); continue; }

    const label = `${e.description || 'Receipt'}${e.date_incurred ? ` — ${e.date_incurred}` : ''}${e.supplier ? ` — ${e.supplier}` : ''}`;

    if (receipt.kind === 'pdf') {
      // Merge the receipt PDF's pages directly into the bundle.
      try {
        const src = await PDFDocument.load(receipt.bytes, { ignoreEncryption: true });
        const pages = await out.copyPages(src, src.getPageIndices());
        pages.forEach(p => out.addPage(p));
        merged++;
        continue;
      } catch {
        failed.push(e);
        continue;
      }
    }

    const png = await out.embedPng(receipt.bytes);
    const landscape = png.width > png.height;
    const page = out.addPage(landscape ? [792, 612] : [612, 792]);
    merged++;

    const margin = 30;
    const labelH = 26;
    const maxW = page.getWidth() - margin * 2;
    const maxH = page.getHeight() - margin * 2 - labelH;
    const scale = Math.min(maxW / png.width, maxH / png.height, 1);
    const w = png.width * scale;
    const h = png.height * scale;

    page.drawText(safe(truncate(label, 110)), {
      x: margin, y: page.getHeight() - margin - 12,
      size: 11, font: boldFont, color: rgb(0.1, 0.1, 0.1), maxWidth: maxW,
    });
    page.drawImage(png, { x: (page.getWidth() - w) / 2, y: margin, width: w, height: h });
  }

  // Receipts that couldn't be fetched or embedded get a placeholder page so
  // nothing is silently missing from the bundle.
  for (const e of failed) {
    const page = out.addPage([612, 792]);
    const margin = 40;
    page.drawText('Receipt not embedded', { x: margin, y: 720, size: 12, font: boldFont });
    page.drawText(
      safe(`Entry: ${truncate(`${e.description || '-'}${e.date_incurred ? ` (${e.date_incurred})` : ''}`, 80)}\nThis receipt file could not be fetched or read. Open the original from the reimbursement entry table in the portal.`),
      { x: margin, y: 695, size: 10, font, lineHeight: 15, maxWidth: 612 - margin * 2 }
    );
  }

  // Submission summary strip on the first page footer.
  const summary = `${docTitle} — ${form.requester_name || ''} · ${fmt(form.amount)} · ${withReceipts.length} receipt${withReceipts.length === 1 ? '' : 's'}`;
  const firstPage = out.getPage(0);
  firstPage.drawText(safe(truncate(summary, 120)), {
    x: 30, y: 14, size: 8, font, color: rgb(0.5, 0.5, 0.5),
  });

  const bytes = await out.save();
  const url = URL.createObjectURL(new Blob([bytes], { type: 'application/pdf' }));
  // window.open after async work gets silently blocked by popup blockers —
  // an anchor click on the blob URL is not treated as a popup.
  const link = document.createElement('a');
  link.href = url;
  link.target = '_blank';
  link.rel = 'noopener';
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 60000);
}

// Button shown on a finance reimbursement submission: opens every receipt
// attached to it as a single PDF (image receipts one per page, PDF receipts
// merged in full).
export default function AllReceiptsPdfButton({ entries = [], form, docTitle = 'Reimbursement' }) {
  const [busy, setBusy] = useState(false);
  const { toast } = useToast();
  const count = entries.filter(e => e.receipt_url).length;
  if (count === 0) return null;

  const handleClick = async () => {
    setBusy(true);
    try {
      await buildReceiptsPdf(entries, form, docTitle);
    } catch (err) {
      console.error('Receipts PDF failed', err);
      toast({
        title: 'Could not build receipts PDF',
        description: err?.message || 'Something went wrong while bundling the receipts.',
        variant: 'destructive',
      });
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