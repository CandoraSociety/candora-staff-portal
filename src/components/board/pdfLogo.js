import { CANDORA_LOGO_URL } from "@/components/board/agendaDocumentHtml";

// Pixel height the logo is rendered at — plenty for print at the sizes used
const TARGET_HEIGHT = 200;

let logoPromise = null;

/**
 * jsPDF embeds an image at its full pixel size, so the 1024×1024 brand PNG (over
 * 600 KB) bloated every generated PDF. Downscale it first: the same look on the
 * page, a fraction of the file size. Transparency is kept so the logo still sits
 * cleanly on the navy header band.
 */
export function getPdfLogo() {
  if (!logoPromise) {
    logoPromise = fetch(CANDORA_LOGO_URL)
      .then((r) => (r.ok ? r.blob() : Promise.reject(new Error("logo unavailable"))))
      .then(
        (blob) =>
          new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = () => {
              const height = TARGET_HEIGHT;
              const width = Math.round((img.width / img.height) * height);
              const canvas = document.createElement("canvas");
              canvas.width = width;
              canvas.height = height;
              canvas.getContext("2d").drawImage(img, 0, 0, width, height);
              resolve({ dataUrl: canvas.toDataURL("image/png"), width, height });
            };
            img.onerror = reject;
            img.src = URL.createObjectURL(blob);
          })
      )
      .catch(() => null);
  }
  return logoPromise;
}