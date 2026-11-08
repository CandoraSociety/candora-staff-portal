import React from 'react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ExternalLink, Plus } from 'lucide-react';

// Heading for one classroom-tablet group: pick which program in that group you
// are signing people in for, open the check-in portal on its own, or add a tablet.
export default function ProgramSectionHeader({ program, options, selected, onSelect, onAddTablet }) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-3">
      <div>
        <h2 className="text-lg font-semibold">{program.label}</h2>
        <p className="text-sm text-muted-foreground">{program.blurb}</p>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {options.length > 0 && (
          <Select value={selected} onValueChange={onSelect}>
            <SelectTrigger className="h-9 w-60">
              <SelectValue placeholder={`Choose a ${program.label} program`} />
            </SelectTrigger>
            <SelectContent>
              {options.map((option) => (
                <SelectItem key={option} value={option}>{option}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}

        <Button size="sm" asChild>
          <a href={`/kiosk?program=${program.id}`} target="_blank" rel="noopener noreferrer">
            <ExternalLink className="h-4 w-4" /> Open check-in portal
          </a>
        </Button>

        <Button variant="outline" size="sm" onClick={onAddTablet}>
          <Plus className="h-4 w-4" /> Add tablet
        </Button>
      </div>
    </div>
  );
}