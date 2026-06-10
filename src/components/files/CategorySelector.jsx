import React from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

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

export default function CategorySelector({ value, onChange, className }) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className={className}><SelectValue placeholder="Select category" /></SelectTrigger>
      <SelectContent>
        {FILE_CATEGORIES.map((cat) => <SelectItem key={cat.value} value={cat.value}>{cat.label}</SelectItem>)}
      </SelectContent>
    </Select>
  );
}