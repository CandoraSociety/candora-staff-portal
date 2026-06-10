import React, { useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Download, FileText, MoreVertical, Trash2, ExternalLink, Building2, DollarSign, Globe, Shield, User, Clock, Palette, Eye } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { format } from "date-fns";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import FileSummaryDialog from "./FileSummaryDialog";

const FILE_CATEGORIES = [
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

function getFileExtension(name) {
  if (!name) return "";
  const parts = name.split(".");
  return parts.length > 1 ? parts.pop().toLowerCase() : "";
}

function getFileTypeStyle(ext) {
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

function formatFileSize(bytes) {
  if (!bytes) return "—";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

const CANVA_EXTS = ["png", "jpg", "jpeg", "gif", "webp", "pdf"];
const accessIcons = { personal: User, universal: Globe, manager: Shield, finance: DollarSign, corporate: Building2 };
const accessLabels = { personal: "Personal", universal: "Universal", manager: "Manager", finance: "Finance", corporate: "Corporate" };

export default function FileCard({ file, onDelete, index = 0 }) {
  const [showSummary, setShowSummary] = useState(false);
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const ext = getFileExtension(file.original_name);
  const style = getFileTypeStyle(ext);
  const AccessIcon = accessIcons[file.access_level] || Globe;

  const updateCategoryMutation = useMutation({
    mutationFn: (cat) => base44.entities.File.update(file.id, { category: cat }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["files"] }),
  });

  return (
    <>
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.03 }}>
        <Card className="group p-4 hover:shadow-md transition-all">
          <div className="flex items-start gap-4">
            <div className={`h-11 w-11 rounded-xl ${style.bg} flex items-center justify-center`}><FileText className={`h-5 w-5 ${style.color}`} /></div>
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between">
                <div className="min-w-0">
                  <h3 className="font-medium text-sm truncate">{file.display_name || file.original_name}</h3>
                  <p className="text-xs text-muted-foreground truncate">{file.standardized_name}</p>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild><Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100"><MoreVertical className="h-4 w-4" /></Button></DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => navigate(`/filemanager/view?id=${file.id}`)}><ExternalLink className="h-4 w-4 mr-2" /> Open</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => navigate(`/filemanager/edit?id=${file.id}`)}><Eye className="h-4 w-4 mr-2" /> Edit</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setShowSummary(true)}><Eye className="h-4 w-4 mr-2" /> Summary</DropdownMenuItem>
                    {CANVA_EXTS.includes(ext) && <DropdownMenuItem onClick={() => window.open(`https://www.canva.com/create/import/?url=${encodeURIComponent(file.file_url)}`, "_blank")}><Palette className="h-4 w-4 mr-2" /> Canva</DropdownMenuItem>}
                    <DropdownMenuItem onClick={() => window.open(file.file_url, "_blank")}><Download className="h-4 w-4 mr-2" /> Download</DropdownMenuItem>
                    {onDelete && <DropdownMenuItem onClick={() => onDelete(file)} className="text-destructive"><Trash2 className="h-4 w-4 mr-2" /> Delete</DropdownMenuItem>}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
              {file.description && <p className="text-xs text-muted-foreground mt-1.5 line-clamp-2">{file.description}</p>}
              <div className="flex items-center gap-2 mt-3 flex-wrap">
                <Badge variant="secondary" className="text-xs gap-1"><AccessIcon className="h-3 w-3" />{accessLabels[file.access_level]}</Badge>
                <Select value={file.category || "to_be_sorted"} onValueChange={(v) => updateCategoryMutation.mutate(v)}>
                  <SelectTrigger className="h-6 w-auto text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>{FILE_CATEGORIES.map((c) => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}</SelectContent>
                </Select>
                <span className="text-xs text-muted-foreground uppercase">{ext}</span>
                <span className="text-xs text-muted-foreground">{formatFileSize(file.file_size)}</span>
              </div>
              <div className="flex items-center gap-4 mt-2.5 text-xs text-muted-foreground">
                <span><Clock className="h-3 w-3 inline mr-1" />{file.created_date ? format(new Date(file.created_date), "MMM d") : ""}</span>
                {file.owner_name && <span>by {file.owner_name}</span>}
                <Button variant="ghost" size="sm" className="ml-auto h-7 text-xs" onClick={() => window.open(file.file_url, "_blank")}><Download className="h-3 w-3 mr-1" />Download</Button>
              </div>
            </div>
          </div>
        </Card>
      </motion.div>
      <FileSummaryDialog file={file} open={showSummary} onOpenChange={setShowSummary} />
    </>
  );
}