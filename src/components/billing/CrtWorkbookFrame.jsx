// Remount Excel after a successful read, even when SharePoint reuses its
// preview URL. The revision also prevents the browser reusing an old response.
export default function CrtWorkbookFrame({ url, revision }) {
  const separator = url.includes('?') ? '&' : '?';
  const src = `${url}${separator}candoraRefresh=${revision}`;
  return (
    <iframe
      key={src}
      src={src}
      className="w-full h-full"
      frameBorder="0"
      title="CRT Workbook"
    />
  );
}