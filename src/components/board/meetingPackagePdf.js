import { jsPDF } from "jspdf";
import { format } from "date-fns";
import { parseDateSmart } from "@/lib/dateUtils";
import { PDFDocument } from "pdf-lib";
import { AGENDA_SECTIONS, sectionOf } from "@/components/board/agendaDocumentHtml";

// Candora brand — same logo and palette used on the ED board report and agendas
const CANDORA_LOGO_URL =
  "https://media.base44.com/images/public/6a249282cb496579542673b7/c6b242905_Candoracirclelogo_noanniversary.png";
const NAVY = [30, 47, 77];
const GOLD = [245, 190, 25];
const GRAY = [100, 100, 100];
const MARGIN = 26;

// Fetch the logo once and cache it (as a data URL for jsPDF); returns null if unavailable
let logoPromise = null;
function getLogoDataUrl() {
  if (!logoPromise) {
    logoPromise = fetch(CANDORA_LOGO_URL)
      .then((r) => (r.ok ? r.blob() : Promise.reject(new Error("logo unavailable"))))
      .then(
        (blob) =>
          new Promise((resolve, reject) => {
            const fr = new FileReader();
            fr.onload = () => resolve(fr.result);
            fr.onerror = reject;
            fr.readAsDataURL(blob);
          })
      )
      .catch(() => null);
  }
  return logoPromise;
}

function decodeEntities(t) {
  return t
    .replace(/&nbsp;/g, " ")
    .replace(/&middot;/g, "\u00B7")
    .replace(/&ldquo;/g, "\u201C")
    .replace(/&rdquo;/g, "\u201D")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&");
}

// Stored minutes HTML → text lines. A leading \u0001 marker flags section headings.
export function minutesHtmlToLines(html) {
  let t = String(html || "");
  t = t.replace(/<head[\s\S]*?<\/head>/gi, " ");
  t = t.replace(/<style[\s\S]*?<\/style>/gi, " ");
  t = t.replace(/<h2[^>]*>/gi, "\n\u0001");
  t = t.replace(/<\/h2>/gi, "\u0001\n");
  t = t.replace(/<li[^>]*>/gi, "\n\u2022 ");
  t = t.replace(/<\/(p|li|div|h1|h3)>/gi, "\n");
  t = t.replace(/<br\s*\/?>/gi, "\n");
  t = t.replace(/<[^>]+>/g, "");
  t = decodeEntities(t);
  return t
    .split(/\n/)
    .map((l) => l.trim())
    .filter(Boolean)
    .map((l) => {
      const isHeader = l.includes("\u0001");
      return { text: l.replace(/\u0001/g, "").trim(), header: isHeader };
    })
    .filter((l) => l.text);
}

// Builds the generated part of the meeting package PDF:
// branded cover page with contents list → the meeting agenda → the previous
// meeting's minutes (from its stored HTML). External PDFs (financials, ED
// report, other meeting documents) are merged in afterwards with mergePdfParts.
export function buildPackageBasePdf({ meeting, org, contents, agendaItems, minutes }) {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const contentWidth = pageWidth - MARGIN * 2;
  const orgName = org || "Candora Society of Edmonton";
  let y = MARGIN;

  const ensureSpace = (needed) => {
    if (y + needed > pageHeight - MARGIN - 20) {
      doc.addPage();
      y = MARGIN;
    }
  };

  const brandBand = async (subtitle) => {
    const BAND_H = 40;
    doc.setFillColor(...NAVY);
    doc.rect(0, 0, pageWidth, BAND_H, "F");
    let nameX = 28;
    const logo = await getLogoDataUrl();
    if (logo) {
      try {
        doc.addImage(logo, "PNG", 28, 9, 22, 22);
        nameX = 28 + 31;
      } catch {
        nameX = 28;
      }
    }
    doc.setTextColor(255, 255, 255);
    doc.setFont(undefined, "bold");
    doc.setFontSize(12.5);
    doc.text(orgName, nameX, 19);
    doc.setFont(undefined, "normal");
    doc.setFontSize(7);
    doc.setTextColor(...GOLD);
    doc.text(subtitle, nameX, 27.5);
    doc.setFillColor(...GOLD);
    doc.rect(0, BAND_H, pageWidth, 2, "F");
  };

  const sectionHeading = (label) => {
    ensureSpace(24);
    doc.setFont(undefined, "bold");
    doc.setFontSize(13);
    doc.setTextColor(...NAVY);
    doc.text(label, MARGIN, y);
    y += 3.5;
    doc.setFillColor(...GOLD);
    doc.rect(MARGIN, y, 22, 1.8, "F");
    y += 11;
  };

  return (async () => {
    // ── Cover page ──────────────────────────────────────
    await brandBand("BOARD MEETING PACKAGE");
    y = 64;
    doc.setFont(undefined, "bold");
    doc.setFontSize(16);
    doc.setTextColor(...NAVY);
    doc.text(meeting?.title || "Board Meeting", MARGIN, y);
    y += 9;
    doc.setFont(undefined, "normal");
    doc.setFontSize(11);
    doc.setTextColor(...GRAY);
    doc.text(format(parseDateSmart(meeting?.meeting_date), "MMMM d, yyyy 'at' h:mm a"), MARGIN, y);
    if (meeting?.location) {
      y += 6;
      doc.text(meeting.location, MARGIN, y);
    }
    y += 24;

    doc.setFont(undefined, "bold");
    doc.setFontSize(13);
    doc.setTextColor(...NAVY);
    doc.text("Package contents", MARGIN, y);
    y += 9;
    doc.setFont(undefined, "normal");
    doc.setFontSize(10.5);
    (contents || []).forEach((label, i) => {
      const lines = doc.splitTextToSize(`${i + 1}. ${label}`, contentWidth - 12);
      lines.forEach((line) => {
        ensureSpace(7);
        doc.setFillColor(...GOLD);
        doc.circle(MARGIN + 2, y - 1.5, 1.2, "F");
        doc.setTextColor(35, 35, 35);
        doc.text(line, MARGIN + 10, y);
        y += 7;
      });
    });
    y += 14;
    ensureSpace(10);
    doc.setFontSize(9);
    doc.setTextColor(...GRAY);
    doc.text(`Compiled ${format(new Date(), "MMMM d, yyyy")}`, MARGIN, y);

    // ── Agenda ──────────────────────────────────────────
    if (agendaItems && agendaItems.length) {
      doc.addPage();
      y = MARGIN;
      sectionHeading("Meeting Agenda");
      AGENDA_SECTIONS.forEach(({ key, label }) => {
        const secItems = agendaItems
          .filter((i) => sectionOf(i) === key)
          .sort((a, b) => (a.order_index || 0) - (b.order_index || 0));
        if (secItems.length === 0) return;
        ensureSpace(20);
        doc.setFont(undefined, "bold");
        doc.setFontSize(10.5);
        doc.setTextColor(...NAVY);
        doc.text(label.toUpperCase(), MARGIN, y);
        y += 7;
        secItems.forEach((item, idx) => {
          ensureSpace(9);
          doc.setFont(undefined, "bold");
          doc.setFontSize(10);
          doc.setTextColor(35, 35, 35);
          doc.splitTextToSize(`${idx + 1}. ${item.title}`, contentWidth).forEach((l) => {
            ensureSpace(5.5);
            doc.text(l, MARGIN, y);
            y += 5.5;
          });
          const meta = [item.presenter, item.duration_minutes ? `${item.duration_minutes} min` : ""].filter(Boolean).join(" \u00B7 ");
          if (meta) {
            ensureSpace(5.5);
            doc.setFont(undefined, "italic");
            doc.setTextColor(...GRAY);
            doc.text(meta, MARGIN + 10, y);
            y += 5.5;
          }
          y += 2.5;
        });
        y += 4;
      });
    }

    // ── Previous meeting's minutes ──────────────────────
    if (minutes?.html) {
      doc.addPage();
      y = MARGIN;
      sectionHeading(`Minutes of the Previous Meeting${minutes.label ? ` \u2014 ${minutes.label}` : ""}`);
      minutesHtmlToLines(minutes.html).forEach(({ text, header }) => {
        if (header) {
          ensureSpace(12);
          doc.setFont(undefined, "bold");
          doc.setFontSize(10.5);
          doc.setTextColor(...NAVY);
          doc.splitTextToSize(text.toUpperCase(), contentWidth).forEach((l) => {
            ensureSpace(6);
            doc.text(l, MARGIN, y);
            y += 6;
          });
          y += 3;
        } else {
          const isBullet = text.startsWith("\u2022");
          const body = isBullet ? text.slice(1).trim() : text;
          doc.splitTextToSize(body, contentWidth - (isBullet ? 12 : 0)).forEach((l, i) => {
            ensureSpace(5.5);
            doc.setFont(undefined, "normal");
            doc.setFontSize(9.5);
            doc.setTextColor(35, 35, 35);
            if (isBullet) {
              if (i === 0) doc.text("\u2022", MARGIN + 2, y);
              doc.text(l, MARGIN + 10, y);
            } else {
              doc.text(l, MARGIN, y);
            }
            y += 5.5;
          });
          y += 1.5;
        }
      });
    }

    // ── Footers on the generated pages ─────────────────
    const pageCount = doc.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setDrawColor(214, 220, 229);
      doc.setLineWidth(0.4);
      doc.line(MARGIN, pageHeight - 24, pageWidth - MARGIN, pageHeight - 24);
      doc.setFontSize(8);
      doc.setFont(undefined, "normal");
      doc.setTextColor(...GRAY);
      doc.text(`${orgName} \u2014 Board Meeting Package`, MARGIN, pageHeight - 15);
      doc.text(`Page ${i}`, pageWidth - MARGIN, pageHeight - 15, { align: "right" });
    }

    return doc;
  })();
}

// Merges PDF buffers (ArrayBuffers) into one document, in order.
// Returns { bytes, skipped } — buffers that couldn't be read are skipped, not fatal.
export async function mergePdfParts(buffers) {
  const out = await PDFDocument.create();
  let skipped = 0;
  for (const buf of buffers) {
    if (!buf) continue;
    try {
      const src = await PDFDocument.load(buf, { ignoreEncryption: true });
      const pages = await out.copyPages(src, src.getPageIndices());
      pages.forEach((p) => out.addPage(p));
    } catch {
      skipped += 1;
    }
  }
  const bytes = await out.save();
  return { bytes, skipped };
}