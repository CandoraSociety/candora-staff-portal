import JSZip from "jszip";

const pad = (n) => String(n).padStart(2, "0");

// File names inside the zip stay readable and safe on every OS
function sanitize(name) {
  const clean = String(name || "document")
    .replace(/[\\/:*?"<>|]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 80);
  return clean || "document";
}

function extensionOf(url, fallback = "pdf") {
  const m = String(url || "").split("?")[0].match(/\.([a-z0-9]{2,5})$/i);
  return m ? m[1].toLowerCase() : fallback;
}

/**
 * Bundles the generated agenda/minutes PDF plus every attached document into a
 * single zip — one file per document, numbered in package order. The documents
 * themselves are never converted: a Word or Excel file stays as it is.
 * Returns { blob, skipped, included } — skipped lists documents that couldn't be
 * read, included lists the ones that went in, so they can be linked individually.
 */
export async function buildMeetingPackageZip({ basePdfBuffer, basePdfName, files = [] }) {
  const zip = new JSZip();
  if (basePdfBuffer) zip.file(`00 - ${sanitize(basePdfName)}.pdf`, basePdfBuffer);

  const skipped = [];
  const included = [];
  let index = 1;
  for (const file of files) {
    try {
      const res = await fetch(file.fileUrl);
      if (!res.ok) throw new Error("could not load the file");
      const bytes = await res.arrayBuffer();
      const fileName = `${pad(index)} - ${sanitize(file.label)}.${extensionOf(file.fileUrl)}`;
      zip.file(fileName, bytes);
      included.push({ label: file.label, file_name: fileName, file_url: file.fileUrl });
      index += 1;
    } catch {
      skipped.push(file.label);
    }
  }

  const blob = await zip.generateAsync({ type: "blob" });
  return { blob, skipped, included };
}