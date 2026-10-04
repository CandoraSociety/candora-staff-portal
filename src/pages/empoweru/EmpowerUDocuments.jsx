import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Search } from 'lucide-react';
import DocumentsList from '@/components/empoweru/DocumentsList';
import DocumentUploadDialog from '@/components/empoweru/DocumentUploadDialog';

// EmpowerU Program Documents — two sub-tabs:
//  - Participant Documents: participant-specific files (ID copies, assessments, forms)
//  - Program Forms: program-wide documents like the United Way facilitator
//    submission and reference sheets for admin staff.
const itemsOf = (res) => Array.isArray(res) ? res : (res?.items || []);

export default function EmpowerUDocuments() {
  const queryClient = useQueryClient();
  const [tab, setTab] = useState('participant');
  const [search, setSearch] = useState('');
  const [uploadOpen, setUploadOpen] = useState(false);

  const { data: participantsData } = useQuery({ queryKey: ['empoweru-participants-all'], queryFn: () => base44.entities.EmpowerUParticipant.filter({}, { limit: 200, sort: 'last_name' }) });
  const { data: cohortsData } = useQuery({ queryKey: ['empoweru-cohorts'], queryFn: () => base44.entities.EmpowerUCohort.filter({}, { limit: 100, sort: '-created_date' }) });
  const participants = itemsOf(participantsData);
  const cohorts = itemsOf(cohortsData);

  const docQuery = async (category) => {
    const q = { category };
    const term = search.trim();
    if (term) {
      const rx = { $regex: term, $options: 'i' };
      q.$or = [{ title: rx }, { doc_type: rx }, { file_name: rx }, { participant_name: rx }, { cohort_name: rx }];
    }
    return itemsOf(await base44.entities.EmpowerUDocument.filter(q, { sort: '-created_date', limit: 100 }));
  };

  const participantDocs = useQuery({ queryKey: ['empoweru-documents', 'participant', search], queryFn: () => docQuery('participant') });
  const programDocs = useQuery({ queryKey: ['empoweru-documents', 'program', search], queryFn: () => docQuery('program') });

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['empoweru-documents'] });
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-heading font-bold text-foreground">Program Documents</h1>
          <p className="text-sm text-muted-foreground">Participant documents and program-wide forms & reference sheets</p>
        </div>
        <Button onClick={() => setUploadOpen(true)} className="gap-2"><Plus className="h-4 w-4" /> Add Document</Button>
      </div>

      <Tabs value={tab} onValueChange={(v) => { setTab(v); setSearch(''); }}>
        <TabsList>
          <TabsTrigger value="participant">Participant Documents</TabsTrigger>
          <TabsTrigger value="program">Program Forms</TabsTrigger>
        </TabsList>

        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder={tab === 'participant' ? 'Search participant documents...' : 'Search program forms...'} className="pl-8" />
              </div>
            </div>

            <TabsContent value="participant" className="mt-0">
              <DocumentsList
                documents={participantDocs.data || []}
                loading={participantDocs.isLoading}
                emptyMessage={search ? 'No participant documents match your search' : 'No participant documents yet — click "Add Document" to upload one'}
                onDeleted={invalidate}
                showParticipant
              />
            </TabsContent>

            <TabsContent value="program" className="mt-0">
              <DocumentsList
                documents={programDocs.data || []}
                loading={programDocs.isLoading}
                emptyMessage={search ? 'No program forms match your search' : 'No program forms yet — add your United Way facilitator submission, admin reference sheets and other program-wide documents here'}
                onDeleted={invalidate}
              />
            </TabsContent>
          </CardContent>
        </Card>
      </Tabs>

      <DocumentUploadDialog
        open={uploadOpen}
        onOpenChange={setUploadOpen}
        category={tab}
        participants={participants}
        cohorts={cohorts}
        onSaved={invalidate}
      />
    </div>
  );
}