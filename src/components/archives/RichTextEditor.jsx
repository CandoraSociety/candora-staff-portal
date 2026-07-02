import ReactQuill from "react-quill";

const modules = {
  toolbar: [
    [{ header: [1, 2, 3, false] }],
    ["bold", "italic", "underline", "strike"],
    [{ list: "ordered" }, { list: "bullet" }],
    ["link", "image"],
    ["blockquote"],
    [{ align: [] }],
    [{ color: [] }],
    ["clean"],
  ],
};

export default function RichTextEditor({ value, onChange, placeholder }) {
  return (
    <ReactQuill
      theme="snow"
      value={value || ""}
      onChange={onChange}
      modules={modules}
      placeholder={placeholder || "Write here..."}
      style={{ minHeight: "180px" }}
    />
  );
}