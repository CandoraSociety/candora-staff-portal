import React, { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { GraduationCap, Users, ClipboardCheck, Star, Info } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import PlacementCard from '@/components/food/PlacementCard';
import PlacementDetailDialog from '@/components/food/PlacementDetailDialog';
import {
  FOOD_PLACEMENT_TYPE_KEYS, PLACEMENT_STATUSES, PLACEMENT_CHECKPOINTS, checkpointsDone,
} from '@/lib/internalPlacements';

const FILTERS = ['all', ...PLACEMENT_STATUSES];

export default function FoodInternalPlacements() {
  const [filter, setFilter] = useState('all');
  const [active, setActive] = useState(null);

  const { data: placements = [], isLoading } = useQuery({
    queryKey: ['food-internal-placements'],
    queryFn: async () => {
      const page = await base44.entities.InternalTraining.filter(
        { placement_type: { $in: FOOD_PLACEMENT_TYPE_KEYS } },
        { sort: '-start_date', limit: 200 },
      );
      return page.items || [];
    },
  });

  const counts = useMemo(() => ({
    active: placements.filter((p) => p.status === 'active').length,
    referred: placements.filter((p) => p.status === 'referred').length,
    checkpointsDue: placements.filter((p) => p.status === 'active' && checkpointsDone(p) < PLACEMENT_CHECKPOINTS.length).length,
    evaluationDue: placements.filter((p) => ['active', 'completed'].includes(p.status) && !p.evaluation_completed).length,
  }), [placements]);

  const visible = filter === 'all' ? placements : placements.filter((p) => p.status === filter);

  const stats = [
    { label: 'Active placements', value: counts.active, icon: Users },
    { label: 'Referred, not started', value: counts.referred, icon: GraduationCap },
    { label: 'Checkpoints outstanding', value: counts.checkpointsDue, icon: ClipboardCheck },
    { label: 'Evaluations due', value: counts.evaluationDue, icon: Star },
  ];

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-lg font-bold">Internal Placements</h2>
        <p className="text-sm text-muted-foreground">
          Pathways referrals into Food Services — on site and off site — with their checkpoints and final evaluation.
        </p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {stats.map(({ label, value, icon: Icon }) => (
          <Card key={label}>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-muted-foreground text-xs">
                <Icon className="w-3.5 h-3.5" /> {label}
              </div>
              <div className="text-2xl font-bold mt-1">{value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="flex flex-wrap gap-1.5">
        {FILTERS.map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-md text-xs font-medium capitalize border transition-colors ${
              filter === f ? 'bg-primary text-primary-foreground border-primary' : 'bg-card hover:bg-muted'
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="text-sm text-muted-foreground py-10 text-center">Loading placements…</div>
      ) : visible.length === 0 ? (
        <Card>
          <CardContent className="p-6 space-y-3">
            <div className="flex items-center gap-2">
              <Info className="w-4 h-4 text-muted-foreground" />
              <h3 className="font-semibold text-sm">
                {placements.length === 0 ? 'No placements referred yet' : `Nothing ${filter}`}
              </h3>
            </div>
            {placements.length === 0 && (
              <>
                <p className="text-sm text-muted-foreground">
                  Placements arrive here from Pathways. A career counsellor refers a client into Internal Training and
                  chooses <strong>Food Services — On site</strong> or <strong>Food Services — Off site</strong> as the
                  placement type; from that moment the placement shows on this page, with the client's name, goals,
                  dates and assigned worker already filled in.
                </p>
                <p className="text-sm text-muted-foreground">
                  If a referral you expect isn't here, check the placement type chosen on the Pathways side — a client
                  referred into another internal placement will not appear in Food Services.
                </p>
              </>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {visible.map((p) => (
            <PlacementCard key={p.id} placement={p} onOpen={setActive} />
          ))}
        </div>
      )}

      <PlacementDetailDialog
        placement={active}
        open={!!active}
        onClose={() => setActive(null)}
      />
    </div>
  );
}