import React, { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowLeft, CalendarDays, ClipboardCheck, Loader2 } from 'lucide-react';
import SelfRegisterForm from '@/components/portal/SelfRegisterForm';

// Public self-registration landing page (reached by scanning a program's QR
// code). Standalone by design — no navigation into any other part of the app.
export default function SelfRegister() {
  const [selected, setSelected] = useState(null);
  const [done, setDone] = useState(null); // 'pending' | 'approved'

  const catalogQ = useQuery({
    queryKey: ['selfreg-catalog'],
    queryFn: async () => (await base44.functions.invoke('getSelfRegCatalog', {})).data,
  });
  const programs = catalogQ.data?.programs || [];

  // QR deep link: /self-register?area=<area>&program=<id or name>
  useEffect(() => {
    if (selected || done || !programs.length) return;
    const urlParams = new URLSearchParams(window.location.search);
    const area = urlParams.get('area');
    const program = urlParams.get('program');
    if (!area || !program) return;
    const match = programs.find(p => p.area === area && (p.program_id === program || p.program_name === program));
    if (match) setSelected(match);
  }, [programs, selected, done]);

  const reset = () => {
    setSelected(null);
    setDone(null);
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-sidebar">
        <div className="max-w-2xl mx-auto px-4 py-6 flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-sidebar-primary flex items-center justify-center shrink-0">
            <ClipboardCheck className="h-5 w-5 text-sidebar-primary-foreground" />
          </div>
          <div>
            <h1 className="text-sidebar-foreground font-display font-bold text-lg leading-tight">Candora Programs</h1>
            <p className="text-sidebar-foreground/60 text-sm leading-tight">Register for a program or course</p>
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-8">
        {catalogQ.isLoading ? (
          <div className="py-16 text-center text-muted-foreground flex flex-col items-center gap-3">
            <Loader2 className="h-6 w-6 animate-spin" />
            <p className="text-sm">Loading programs…</p>
          </div>
        ) : done ? (
          <Card>
            <CardContent className="py-12 text-center space-y-4">
              <div className="h-14 w-14 rounded-full bg-success/10 text-success flex items-center justify-center mx-auto">
                <ClipboardCheck className="h-7 w-7" />
              </div>
              <div>
                <h2 className="text-xl font-display font-bold">
                  {done === 'approved' ? "You're registered!" : 'Request submitted!'}
                </h2>
                <p className="text-sm text-muted-foreground mt-2 max-w-md mx-auto">
                  {done === 'approved'
                    ? `Your registration for ${selected?.program_name} has been saved. We'll be in touch with details.`
                    : `Your registration request for ${selected?.program_name} has been sent. Our team will review it and follow up with you.`}
                </p>
              </div>
              <Button variant="outline" onClick={reset}>Register for another program</Button>
            </CardContent>
          </Card>
        ) : selected ? (
          <div className="space-y-6">
            <button onClick={reset} className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
              <ArrowLeft className="h-4 w-4" /> All programs
            </button>
            <div>
              <p className="text-xs font-medium text-primary uppercase tracking-wide">{selected.area_label}</p>
              <h2 className="text-2xl font-display font-bold">{selected.program_name}</h2>
              {selected.description && <p className="text-sm text-muted-foreground mt-1">{selected.description}</p>}
              {selected.schedule && (
                <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1.5">
                  <CalendarDays className="h-3.5 w-3.5" />{selected.schedule}
                </p>
              )}
            </div>
            <Card>
              <CardContent className="p-5">
                <SelfRegisterForm
                  key={selected.area + selected.program_id + selected.program_name}
                  program={selected}
                  onDone={(status) => setDone(status)}
                />
              </CardContent>
            </Card>
          </div>
        ) : programs.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              <p>There are no programs open for online registration right now. Please check back later or contact the office.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">Browse our open programs and request a spot.</p>
            {programs.map(p => (
              <Card key={`${p.area}-${p.program_id || p.program_name}`} className="hover:shadow-sm transition-shadow">
                <CardContent className="p-4">
                  <p className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-primary/10 text-primary inline-block">{p.area_label}</p>
                  <h3 className="font-semibold text-foreground mt-1.5">{p.program_name}</h3>
                  {p.description && <p className="text-sm text-muted-foreground mt-0.5 line-clamp-2">{p.description}</p>}
                  {(p.schedule || p.sessions?.length > 0) && (
                    <p className="text-xs text-muted-foreground/80 mt-1">
                      {p.schedule}
                      {p.sessions?.length > 0 ? `${p.schedule ? ' · ' : ''}${p.sessions.length} upcoming session${p.sessions.length === 1 ? '' : 's'}` : ''}
                    </p>
                  )}
                  <Button className="w-full mt-3" variant="outline" onClick={() => setSelected(p)}>
                    {p.require_approval ? 'Request to Register' : 'Register'}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}