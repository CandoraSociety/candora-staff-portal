import React from "react";
import { Input } from "@/components/ui/input";
import { Search, X } from "lucide-react";

export default function SearchBar({ value, onChange, placeholder = "Search files..." }) {
  return (
    <div className="relative w-full max-w-sm">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
      <Input
        type="text"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="pl-9 h-9 text-sm"
      />
      {value && (
        <button onClick={() => onChange("")} className="absolute right-3 top-1/2 -translate-y-1/2 hover:text-foreground">
          <X className="h-4 w-4 text-muted-foreground" />
        </button>
      )}
    </div>
  );
}