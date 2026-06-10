import React, { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function CategorySelector({ value, onChange, onSubcategoryChange, className }) {
  const { data: categories = [] } = useQuery({
    queryKey: ["file-categories"],
    queryFn: () => base44.entities.FileCategory.list(),
  });

  const [subcategory, setSubcategory] = React.useState("");

  React.useEffect(() => {
    if (onSubcategoryChange) {
      onSubcategoryChange(subcategory);
    }
  }, [subcategory]);

  const sortedCategories = [...categories].sort((a, b) => 
    (a.label || "").localeCompare(b.label || "")
  );

  return (
    <div className="space-y-2">
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger className={className}>
          <SelectValue placeholder="Select category" />
        </SelectTrigger>
        <SelectContent>
          {sortedCategories.map((cat) => (
            <SelectItem key={cat.value} value={cat.value}>
              {cat.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {onSubcategoryChange && value && value !== "to_be_sorted" && value !== "other" && (
        <div>
          <Label className="text-xs">Subcategory (optional)</Label>
          <Input
            value={subcategory}
            onChange={(e) => setSubcategory(e.target.value)}
            placeholder="e.g. Q1 2024, Project Alpha"
            className="h-8 text-xs"
          />
        </div>
      )}
    </div>
  );
}