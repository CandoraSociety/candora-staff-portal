import { PDFDocument } from "pdf-lib";

/**
 * Appends every page of a PDF (fetched from its URL) to the end of an existing
 * PDF built by jsPDF — used so the previous meeting's minutes sit inside the
 * meeting package document, not only as a separate file beside it.
 */
/**
 * Joins several PDFs into one, page order preserved — used to put the package
 * cover ahead of the agenda PDF exactly as the agenda is saved and printed.
 */
export async function mergePdfBytes(buffers) {
  const out = await PDFDocument.create();
  for (const bytes of buffers.filter(Boolean)) {
    const source = await PDFDocument.load(bytes, { ignoreEncryption: true });
    const pages = await out.copyPages(source, source.getPageIndices());
    pages.forEach((page) => out.addPage(page));
  }
  return out.save();
}

export async function appendPdfFromUrl(baseBytes, url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error("the document could not be read");
  const source = await PDFDocument.load(await res.arrayBuffer(), { ignoreEncryption: true });
  const out = await PDFDocument.load(baseBytes);
  const pages = await out.copyPages(source, source.getPageIndices());
  pages.forEach((page) => out.addPage(page));
  return out.save();
}