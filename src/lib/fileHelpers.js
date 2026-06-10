export const FILE_CATEGORIES = [
  { value: "to_be_sorted", label: "To Be Sorted" },
  { value: "grants_federal", label: "Grants - Federal" },
  { value: "grants_provincial", label: "Grants - Provincial" },
  { value: "grants_municipal", label: "Grants - Municipal" },
  { value: "grants_private", label: "Grants - Private" },
  { value: "finance_invoices", label: "Finance - Invoices" },
  { value: "finance_receipts", label: "Finance - Receipts" },
  { value: "finance_budgets", label: "Finance - Budgets" },
  { value: "finance_reports", label: "Finance - Reports" },
  { value: "hr_policies", label: "HR - Policies" },
  { value: "hr_contracts", label: "HR - Contracts" },
  { value: "hr_training", label: "HR - Training" },
  { value: "operations_manuals", label: "Operations - Manuals" },
  { value: "operations_procedures", label: "Operations - Procedures" },
  { value: "communications_templates", label: "Communications - Templates" },
  { value: "communications_branding", label: "Communications - Branding" },
  { value: "legal_compliance", label: "Legal - Compliance" },
  { value: "legal_agreements", label: "Legal - Agreements" },
  { value: "other", label: "Other" },
];

export const ACCESS_LEVELS = [
  { value: "personal", label: "Personal", description: "Only you can access" },
  { value: "universal", label: "Universal", description: "All staff can access" },
  { value: "manager", label: "Manager", description: "Managers only" },
  { value: "finance", label: "Finance", description: "Finance team only" },
  { value: "corporate", label: "Corporate", description: "Executive leadership" },
];

export function getFileExtension(name) {
  if (!name) return "";
  const parts = name.split(".");
  return parts.length > 1 ? parts.pop().toLowerCase() : "";
}

export function getFileTypeStyle(ext) {
  const map = {
    pdf: { bg: "bg-red-100", color: "text-red-600" },
    docx: { bg: "bg-blue-100", color: "text-blue-600" },
    doc: { bg: "bg-blue-100", color: "text-blue-600" },
    xlsx: { bg: "bg-green-100", color: "text-green-600" },
    xls: { bg: "bg-green-100", color: "text-green-600" },
    pptx: { bg: "bg-orange-100", color: "text-orange-600" },
    ppt: { bg: "bg-orange-100", color: "text-orange-600" },
    png: { bg: "bg-purple-100", color: "text-purple-600" },
    jpg: { bg: "bg-purple-100", color: "text-purple-600" },
    jpeg: { bg: "bg-purple-100", color: "text-purple-600" },
  };
  return map[ext] || { bg: "bg-slate-100", color: "text-slate-600" };
}

export function formatFileSize(bytes) {
  if (!bytes) return "—";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function generateStandardizedName(originalName, category, accessLevel) {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const name = originalName.replace(/\.[^/.]+$/, "").replace(/[^a-zA-Z0-9]/g, "-").toLowerCase();
  return `${category}-${accessLevel}-${year}${month}${day}-${name}`;
}

export function canAccessFile(file, user) {
  if (!user) return false;
  if (file.access_level === "universal") return true;
  if (file.access_level === "personal") return file.owner_email === user.email;
  if (file.access_level === "manager") return user.role === "admin" || user.role === "manager";
  if (file.access_level === "finance") return user.role === "admin" || file.finance_authorized_emails?.includes(user.email);
  if (file.access_level === "corporate") return user.role === "admin";
  return false;
}