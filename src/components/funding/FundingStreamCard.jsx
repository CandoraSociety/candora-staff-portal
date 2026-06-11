import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { useQueryClient } from '@tanstack/react-query';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Pencil, Trash2, ExternalLink, Link2 } from 'lucide-react';
import FundingStreamForm from './FundingStreamForm';

const MONTHS = ['','Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const CYCLE_COLORS = {
  rolling: 'bg-green-100 text-green-700',
  annual: 'bg-blue-100 text-blue-700',
  biannual: 'bg-purple-100 text-purple-700',
  quarterly: 'bg-orange-100 text-orange-700',
  one_time: 'bg-gray-100 text-gray-700',
  unknown: 'bg-gray-100 text-gray-500',
};

export default function FundingStreamCard({ stream, sourceName }) {
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState(false);

  const handleDelete = async () => {
    if (!confirm(`Delete stream "${stream.name}"?`)) return;
    await base44.entities.FundingStream.delete(stream.id);
    queryClient.invalidateQueries(['fundingStreams']);
  };

  return (
    <>
      <div className="border border-border rounded-lg p-3 bg-card hover:shadow-sm transition-shadow">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <p className="text-sm font-medium">{stream.name}</p>
              {stream.application_cycle && (
                <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${CYCLE_COLORS[stream.application_cycle] || 'bg-gray-100 text-gray-700'}`}>
                  {stream.application_cycle.replace(/_/g, ' ')}
                </span>
              )}
              {!stream.is_active && <Badge variant="outline" className="text-xs text-muted-foreground">Inactive</Badge>}
            </div>

            <div className="flex items-center gap-3 mt-1 flex-wrap">
              {stream.stream_type && (
                <span className="text-xs text-muted-foreground capitalize">{stream.stream_type.replace(/_/g, ' ')}</span>
              )}
              {(stream.typical_amount_min || stream.typical_amount_max) && (
                <span className="text-xs text-muted-foreground">
                  ${(stream.typical_amount_min || 0).toLocaleString()}
                  {stream.typical_amount_max ? ` – $${stream.typical_amount_max.toLocaleString()}` : '+'}
                </span>
              )}
              {stream.typical_deadline_month && (
                <span className="text-xs text-muted-foreground">Deadline: {MONTHS[stream.typical_deadline_month]}</span>
              )}
            </div>

            {stream.eligibility_notes && (
              <p className="text-xs text-muted-foreground mt-1.5 line-clamp-2">{stream.eligibility_notes}</p>
            )}

            <div className="flex items-center gap-2 mt-2">
              {stream.application_url && (
                <a href={stream.application_url} target="_blank" rel="noopener noreferrer" className="text-xs text-primary hover:underline flex items-center gap-1">
                  <ExternalLink className="w-3 h-3" />Apply
                </a>
              )}
              {stream.linked_project_id && (
                <Link to={`/grants/projects/${stream.linked_project_id}`} className="text-xs text-accent hover:underline flex items-center gap-1">
                  <Link2 className="w-3 h-3" />Linked Project
                </Link>
              )}
            </div>
          </div>

          <div className="flex items-center gap-1 flex-shrink-0">
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setEditing(true)}>
              <Pencil className="h-3.5 w-3.5" />
            </Button>
            <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive" onClick={handleDelete}>
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      </div>

      {editing && (
        <FundingStreamForm
          stream={stream}
          sourceId={stream.funding_source_id}
          sourceName={sourceName}
          onClose={() => setEditing(false)}
        />
      )}
    </>
  );
}