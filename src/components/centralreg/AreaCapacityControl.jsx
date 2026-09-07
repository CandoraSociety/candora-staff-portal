import React, { useState, useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/use-toast';

// Inline editor for a registration maximum. Works at the area level, or per
// program when programId is given. 0 / blank = no maximum.
export default function AreaCapacityControl({ area, programId, capacityRecord, filled }) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [value, setValue] = useState('');

  useEffect(() => {
    setValue(capacityRecord?.max_capacity ? String(capacityRecord.max_capacity) : '');
  }, [capacityRecord?.id, capacityRecord?.max_capacity]);

  const commit = async () => {
    const num = parseInt(value, 10);
    const next = Number.isFinite(num) && num > 0 ? num : 0;
    try {
      if (capacityRecord) {
        await base44.entities.CentralRegAreaCapacity.update(capacityRecord.id, { max_capacity: next });
      } else if (next > 0) {
        await base44.entities.CentralRegAreaCapacity.create({ area, max_capacity: next, ...(programId ? { program_id: programId } : {}) });
      } else {
        return; // nothing to store — no max set and no existing record
      }
      queryClient.invalidateQueries({ queryKey: ['cr-area-capacities'] });
    } catch (err) {
      toast({ title: 'Error saving maximum', description: err.message, variant: 'destructive' });
    }
  };

  return (
    <div className="flex items-center gap-1.5 text-xs text-muted-foreground whitespace-nowrap">
      <span className={filled > 0 ? 'text-foreground font-medium' : ''}>{filled} registered</span>
      <span className="text-muted-foreground/50">·</span>
      <span>Max:</span>
      <Input
        value={value}
        placeholder="none"
        type="number"
        min="0"
        className="h-7 w-16 text-xs"
        onChange={(e) => setValue(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => e.key === 'Enter' && e.currentTarget.blur()}
      />
    </div>
  );
}