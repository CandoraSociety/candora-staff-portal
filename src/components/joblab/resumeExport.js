// Resume export helpers — Word download and browser print. Both work off the
// rendered resume markup so the document matches what's on screen.

const DOC_STYLES = `
  body { font-family: Arial, Helvetica, sans-serif; font-size: 11pt; line-height: 1.4; color: #111; margin: 0.75in; }
  h1 { font-size: 20pt; font-weight: 700; margin: 0; text-align: center; }
  h2 { font-size: 11pt; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase; margin: 18px 0 0; }
  p { margin: 0; }
  ul { margin: 4px 0 0 16px; padding: 0; }
  li { margin-bottom: 2px; }
`;

export function resumeInnerHtml() {
  const node = document.getElementById('resume-preview-content');
  return node ? node.innerHTML : '';
}

export function buildDocument(title, innerHtml) {
  return `<!DOCTYPE html><html><head><meta charset="utf-8"><title>${title}</title>
<style>${DOC_STYLES}</style></head><body>${innerHtml}</body></html>`;
}

export function downloadWord(title, innerHtml) {
  const html = buildDocument(title, innerHtml);
  const blob = new Blob(['\ufeff', html], { type: 'application/msword' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${title || 'Resume'}.doc`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function printResume() {
  document.body.classList.add('jl-printing-resume');
  window.print();
  setTimeout(() => document.body.classList.remove('jl-printing-resume'), 500);
}