import React, { useCallback, useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import PageHeader from '@/components/shared/PageHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Search } from 'lucide-react';
import { toast } from 'sonner';
import ProgramCard from '@/components/website/programs/ProgramCard';
import ProgramFormDialog from '@/components/website/programs/ProgramFormDialog';
import { PROGRAM_CATEGORIES, slugify, computeProgramStatus } from '@/lib/websitePrograms';

export default function WebsitePrograms() {
  const [programs, setPrograms] = useState([]);
  const [seats, setSeats] = useState({});
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('all');
  const [editing, setEditing] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [page, seatRows] = await Promise.all([
        base44.entities.WebsiteProgram.filter({}, { sort: 'home_order', limit: 200 }),
        base44.entities.WebsiteProgramRegistration.aggregate({
          query: { status: 'confirmed' },
          groupBy: 'program',
        }),
      ]);
      setPrograms(page.items || []);
      const map = {};
      (seatRows?.rows || []).forEach((row) => { map[row.program] = Number(row.count) || 0; });
      setSeats(map);
    } catch (error) {
      toast.error(error?.message || 'The programs could not be loaded.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const visible = programs.filter((program) => {
    const matchesCategory = category === 'all' || program.category === category;
    const term = search.trim().toLowerCase();
    const matchesSearch = !term || `${program.name} ${program.summary || ''} ${program.slug}`.toLowerCase().includes(term);
    return matchesCategory && matchesSearch;
  });

  const togglePublish = async (program) => {
    setBusy(true);
    try {
      await base44.entities.WebsiteProgram.update(program.id, { is_published: !program.is_published });
      await load();
    } catch (error) {
      toast.error(error?.message || 'That change could not be saved.');
    } finally {
      setBusy(false);
    }
  };

  const duplicate = async (program) => {
    setBusy(true);
    try {
      const copy = { ...program };
      ['id', 'created_date', 'updated_date', 'created_by_id'].forEach((key) => delete copy[key]);
      const slug = `${slugify(program.name)}-${new Date().getFullYear() + 1}`;
      await base44.entities.WebsiteProgram.create({
        ...copy,
        name: `${program.name} (next intake)`,
        slug,
        public_path: `/programs/${slug}`,
        is_published: false,
        seats_taken: 0,
      });
      toast.success('Copied for the next intake. Publish it when it is ready.');
      await load();
    } catch (error) {
      toast.error(error?.message || 'The program could not be copied.');
    } finally {
      setBusy(false);
    }
  };

  const generateSessions = async (program) => {
    setBusy(true);
    try {
      const response = await base44.functions.invoke('programAdmin', {
        action: 'generate_sessions',
        program_id: program.id,
      });
      if (response.data?.error) throw new Error(response.data.error);
      toast.success(`${response.data.created} sessions added to the calendar.`);
    } catch (error) {
      toast.error(error?.message || 'The calendar could not be generated.');
    } finally {
      setBusy(false);
    }
  };

  const openNew = () => { setEditing(null); setDialogOpen(true); };
  const openEdit = (program) => { setEditing(program); setDialogOpen(true); };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <PageHeader
        title="Programs & Workshops"
        description="Every program on the public website, and how someone joins it."
        actions={<Button onClick={openNew}><Plus className="w-4 h-4 mr-1.5" /> New program</Button>}
      />

      <div className="flex flex-wrap gap-3 mb-5">
        <div className="relative flex-1 min-w-[220px]">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            className="pl-9"
            placeholder="Search programs"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Select value={category} onValueChange={setCategory}>
          <SelectTrigger className="w-[200px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All categories</SelectItem>
            {PROGRAM_CATEGORIES.map((item) => (
              <SelectItem key={item.value} value={item.value}>{item.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {loading ? (
        <p className="text-sm text-muted-foreground">Loading programs…</p>
      ) : visible.length === 0 ? (
        <div className="rounded-xl border border-dashed p-10 text-center">
          <p className="font-medium">No programs yet</p>
          <p className="text-sm text-muted-foreground mt-1">
            Add the first program and it appears on the website once you publish it.
          </p>
        </div>
      ) : (
        <div className="grid gap-3 lg:grid-cols-2">
          {visible.map((program) => (
            <ProgramCard
              key={program.id}
              program={program}
              status={computeProgramStatus(program, seats[program.id] || program.seats_taken || 0)}
              seatsTaken={seats[program.id] || program.seats_taken || 0}
              busy={busy}
              onEdit={() => openEdit(program)}
              onTogglePublish={() => togglePublish(program)}
              onDuplicate={() => duplicate(program)}
              onGenerateSessions={() => generateSessions(program)}
            />
          ))}
        </div>
      )}

      <ProgramFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        program={editing}
        onSaved={load}
      />
    </div>
  );
}