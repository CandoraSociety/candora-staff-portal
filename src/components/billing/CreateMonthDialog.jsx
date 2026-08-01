import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { base44 } from '@/api/base44Client';
import { Loader2, CalendarPlus } from 'lucide-react';
import { toast } from 'sonner';

const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];

export default function CreateMonthDialog({ onCreated }) {
  const [open, setOpen] = useState(false);
  const thisYear = new Date().getFullYear();
  const [month, setMonth] = useState(String(new Date().getMonth() + 1));
  const [year, setYear] = useState(String(thisYear));
  const [loading, setLoading] = useState(false);

  const years = [thisYear - 1, thisYear, thisYear + 1];

  const handleCreate = async () => {
    if (!month || !year) { toast.error('Pick a month and year'); return; }
    setLoading(true);
    try {
      const res = await base44.functions.invoke('ensureCurrentMonthCrt', {
        month: parseInt(month, 10), year: parseInt(year, 10)
      });
      const data = res.data;
      if (data.status === 'success') {
        toast.success(data.message);
        setOpen(false);
        onCreated?.();
      } else if (data.status === 'copy_pending') {
        toast.info(data.message);
        setOpen(false);
        setTimeout(() => onCreated?.(), 10000);
      } else {
        toast.error(data.error || 'Could not create that month');
      }
    } catch (e) {
      toast.error('Create failed: ' + (e.message || 'Unknown error'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <CalendarPlus className="h-4 w-4 mr-2" />
          Create Month…
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create / backfill a monthly CRT</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground">
          Creates a new monthly CRT for the chosen month (or re-syncs it if it already exists). It's captured as a snapshot through that month's end — only clients whose service started on or before that month appear, and future-dated milestones are blanked.
        </p>
        <div className="grid grid-cols-2 gap-4 py-2">
          <div className="space-y-1.5">
            <Label>Month</Label>
            <Select value={month} onValueChange={setMonth}>
              <SelectTrigger className="w-full"><SelectValue placeholder="Month" /></SelectTrigger>
              <SelectContent>
                {MONTHS.map((m, i) => (
                  <SelectItem key={i} value={String(i + 1)}>{m}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Year</Label>
            <Select value={year} onValueChange={setYear}>
              <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
              <SelectContent>
                {years.map(y => (
                  <SelectItem key={y} value={String(y)}>{y}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} disabled={loading}>Cancel</Button>
          <Button onClick={handleCreate} disabled={loading}>
            {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Create
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}