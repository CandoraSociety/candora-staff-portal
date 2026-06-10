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

const ACCESS_LEVELS = [
  { value: "personal", label: "Personal", description: "Only you can access" },
  { value: "universal", label: "Universal", description: "All staff can access" },
  { value: "manager", label: "Manager", description: "Managers only" },
  { value: "finance", label: "Finance", description: "Finance team only" },
  { value: "corporate", label: "Corporate", description: "Executive leadership" },
];

export default function FileFilters({ filters, onFilterChange }) {
  return (
    <div className="flex items-center gap-2 flex-wrap">
      <Select value={filters.category} onValueChange={(v) => onFilterChange({ ...filters, category: v })}>
        <SelectTrigger className="w-36 h-8 text-xs"><SelectValue placeholder="Category" /></SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Categories</SelectItem>
          {FILE_CATEGORIES.map((c) => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
        </SelectContent>
      </Select>
      <Select value={filters.access} onValueChange={(v) => onFilterChange({ ...filters, access: v })}>
        <SelectTrigger className="w-32 h-8 text-xs"><SelectValue placeholder="Access" /></SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Access</SelectItem>
          {ACCESS_LEVELS.map((l) => <SelectItem key={l.value} value={l.value}>{l.label}</SelectItem>)}
        </SelectContent>
      </Select>
      <Select value={filters.sort} onValueChange={(v) => onFilterChange({ ...filters, sort: v })}>
        <SelectTrigger className="w-36 h-8 text-xs"><SelectValue placeholder="Sort by" /></SelectTrigger>
        <SelectContent>
          <SelectItem value="-created_date">Newest First</SelectItem>
          <SelectItem value="created_date">Oldest First</SelectItem>
          <SelectItem value="original_name">Name A-Z</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}