import ReactQuill, { Quill } from "react-quill";
import "react-quill/dist/quill.snow.css";

const CUSTOM_FONTS = ["sans-serif", "serif", "monospace", "playfair", "dmsans", "nunito", "inter"];
const CUSTOM_SIZES = ["small", "normal", "large", "huge", "xlarge"];

let registered = false;
if (!registered) {
  const Font = Quill.import("formats/font");
  Font.whitelist = CUSTOM_FONTS;
  Quill.register(Font, true);

  const Size = Quill.import("formats/size");
  Size.whitelist = CUSTOM_SIZES;
  Quill.register(Size, true);

  registered = true;
}

function insertSymbol(symbol) {
  return function () {
    const quill = this.quill;
    const range = quill.getSelection();
    if (range) {
      quill.insertText(range.index, symbol);
      quill.setSelection(range.index + symbol.length);
    }
  };
}

function sunflowerListHandler() {
  const quill = this.quill;
  const range = quill.getSelection();
  if (!range) return;
  const formats = quill.getFormat(range);
  const isBullet = formats.list === "bullet";

  if (isBullet) {
    const [line] = quill.getLine(range.index);
    if (line && line.parent && line.parent.domNode) {
      const ul = line.parent.domNode;
      if (ul.classList.contains("ql-list-sunflower")) {
        ul.classList.remove("ql-list-sunflower");
      } else {
        ul.classList.add("ql-list-sunflower");
      }
    }
  } else {
    quill.format("list", "bullet");
    setTimeout(() => {
      const [line] = quill.getLine(range.index);
      if (line && line.parent && line.parent.domNode) {
        line.parent.domNode.classList.add("ql-list-sunflower");
      }
    }, 10);
  }
}

const quillModules = {
  toolbar: {
    container: [
      [{ font: CUSTOM_FONTS }],
      [{ size: CUSTOM_SIZES }],
      ["bold", "italic", "underline", "strike"],
      [{ color: [] }, { background: [] }],
      [{ header: [1, 2, 3, 4, false] }],
      [{ list: "ordered" }, { list: "bullet" }],
      [{ align: [] }],
      ["blockquote", "code-block"],
      [{ indent: "-1" }, { indent: "+1" }],
      ["link", "image"],
      ["clean"],
      ["sunflower-list", "arrow-right", "arrow-left", "arrow-up", "arrow-down", "arrow-double"],
    ],
    handlers: {
      "sunflower-list": sunflowerListHandler,
      "arrow-right": insertSymbol("\u2192"),
      "arrow-left": insertSymbol("\u2190"),
      "arrow-up": insertSymbol("\u2191"),
      "arrow-down": insertSymbol("\u2193"),
      "arrow-double": insertSymbol("\u21D2"),
    },
  },
};

export default function RichTextBlockEditor({ value, onChange }) {
  return (
    <div className="border rounded-md overflow-hidden">
      <ReactQuill
        theme="snow"
        value={value || ""}
        onChange={onChange}
        modules={quillModules}
        style={{ minHeight: "140px" }}
      />
    </div>
  );
}