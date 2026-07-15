import ReactQuill, { Quill } from "react-quill";
import "react-quill/dist/quill.snow.css";

const CUSTOM_FONTS = ["sans-serif", "serif", "monospace", "playfair", "dmsans", "nunito", "inter"];
const CUSTOM_SIZES = ["small", "normal", "large", "huge", "xlarge"];

// Register fonts/sizes on the Quill singleton (idempotent)
const Font = Quill.import("formats/font");
Font.whitelist = CUSTOM_FONTS;
Quill.register(Font, true);
const Size = Quill.import("formats/size");
Size.whitelist = CUSTOM_SIZES;
Quill.register(Size, true);

const titleModules = {
  toolbar: {
    container: [
      [{ font: CUSTOM_FONTS }],
      [{ size: CUSTOM_SIZES }],
      ["bold", "italic", "underline", "strike"],
      [{ color: [] }, { background: [] }],
      ["clean"],
    ],
  },
};

/** Strips HTML tags — used for iframe title attributes, etc. */
export function stripHtml(html) {
  if (!html) return "";
  return html.replace(/<[^>]*>/g, "").trim();
}

/**
 * Compact rich text editor for title/label fields.
 * Renders a Quill editor with a lightweight inline-formatting toolbar.
 */
export default function RichTitleInput({ value, onChange, placeholder, className }) {
  return (
    <div className={`border rounded-md overflow-hidden ${className || ""}`}>
      <ReactQuill
        theme="snow"
        value={value || ""}
        onChange={onChange}
        modules={titleModules}
        placeholder={placeholder}
        bounds="parent"
      />
    </div>
  );
}