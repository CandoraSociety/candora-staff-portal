import React from 'react';
import { Input } from '@/components/ui/input';
import { Search, X } from 'lucide-react';

// Search box for the Kids Gift Shop lists — finds a guardian or child by name,
// email address or phone number.
export default function GiftShopSearchInput({ value, onChange, placeholder = 'Search a name, email or phone number' }) {
  return (
    <div className="relative">
      <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
      <Input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="h-9 pl-8 pr-8"
      />
      {value && (
        <button
          type="button"
          onClick={() => onChange('')}
          className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          aria-label="Clear search"
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}