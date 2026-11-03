import { PDFDocument } from "pdf-lib";

/**
 * Appends every page of a PDF (fetched from its URL) to the end of an existing
 * PDF built by jsPDF — used so the previous meeting's minutes sit inside the
 * meeting package document, not only as a separate file beside it.
 */
export async function appendPdfFromUrl(baseBytes, url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error("the document could not be read");
  const source = await PDFDocument.load(await res.arrayBuffer(), { ignoreEncryption: true });
  const out = await PDFDocument.load(baseBytes);
  const pages = await out.copyPages(source, source.getPageIndices());
  pages.forEach((page) => out.addPage(page));
  return out.save();
}