import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { ChevronDown, ChevronRight, Plus, Pencil, Trash2, Globe, Mail, Phone } from 'lucide-react';
import FundingStreamCard from './FundingStreamCard';
import FundingStreamForm from './FundingStreamForm';
import FundingSourceForm from './FundingSourceForm';

const RELATIONSHIP_COLORS = {
  prospect: 'bg-gray-100 text-gray-600',
  active: 'bg-green-100 text-green-700',
  lapsed: 'bg-yellow-100 text-yellow-700',
  do_not_contact: 'bg-red-100 text-red-700',
};

const TYPE_LABELS = {
  federal_government: 'Federal',
  provincial_government: 'Provincial',
  municipal_government: 'Municipal',
  foundation: 'Foundation',
  corporate: 'Corporate',
  individual: 'Individual',
  other: 'Other',
};

export default function FundingSourceBlock({ source, streams }) {
  const queryClient = useQueryClient();
  const [expanded, setExpanded] = useState(false);
  const [addingStream, setAddingStream] = useState(false);
  const [editing, setEditing] = useState(false);

  const sourceStreams = streams.filter(s => s.funding_source_id === source.id);

  const handleDelete = async () => {
    if (!confirm(`Delete "${source.name}" and all its streams?`)) return;
    for (const s of sourceStreams) await base44.entities.FundingStream.delete(s.id);
    await base44.entities.FundingSource.delete(source.id);
    queryClient.invalidateQueries(['fundingSources']);
    queryClient.invalidateQueries(['fundingStreams']);
  };

  return (
    <div className="border border-border rounded-xl bg-card overflow-hidden">
      {/* Source Header */}
      <div
        className="flex items-center gap-3 p-4 cursor-pointer hover:bg-muted/40 transition-colors"
        onClick={() => setExpanded(e => !e)}
      >
        <div className="text-muted-foreground">
          {expanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-semibold text-sm">{source.name}</span>
            {source.funder_type && (
              <span className="text-xs bg-secondary text-secondary-foreground px-1.5 py-0.5 rounded">
                {TYPE_LABELS[source.funder_type] || source.funder_type}
              </span>
            )}
            {source.relationship_status && (
              <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${RELATIONSHIP_COLORS[source.relationship_status] || 'bg-gray-100 text-gray-600'}`}>
                {source.relationship_status.replace(/_/g, ' ')}
              </span>
            )}
            {!source.is_active && <span className="text-xs text-muted-foreground">(inactive)</span>}
          </div>
          <div className="flex items-center gap-3 mt-0.5 flex-wrap">
            {source.contact_name && <span className="text-xs text-muted-foreground">{source.contact_name}</span>}
            {source.contact_email && (
              <a href={`mailto:${source.contact_email}`} className="text-xs text-primary hover:underline flex items-center gap-1" onClick={e => e.stopPropagation()}>
                <Mail className="w-3 h-3" />{source.contact_email}
              </a>
            )}
            {source.website && (
              <a href={source.website} target="_blank" rel="noopener noreferrer" className="text-xs text-primary hover:underline flex items-center gap-1" onClick={e => e.stopPropagation()}>
                <Globe className="w-3 h-3" />Website
              </a>
            )}
          </div>
        </div>
        <div className="flex items-center gap-1 flex-shrink-0" onClick={e => e.stopPropagation()}>
          <span className="text-xs text-muted-foreground mr-1">{sourceStreams.length} stream{sourceStreams.length !== 1 ? 's' : ''}</span>
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setEditing(true)}>
            <Pencil className="h-3.5 w-3.5" />
          </Button>
          <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive" onClick={handleDelete}>
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      {/* Expanded: streams + notes */}
      {expanded && (
        <div className="border-t border-border px-4 py-3 space-y-3 bg-muted/20">
          {source.description && <p className="text-xs text-muted-foreground">{source.description}</p>}
          {source.notes && <p className="text-xs text-muted-foreground italic">{source.notes}</p>}

          {sourceStreams.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Funding Streams</p>
              {sourceStreams.map(s => (
                <FundingStreamCard key={s.id} stream={s} sourceName={source.name} />
              ))}
            </div>
          )}

          <Button variant="outline" size="sm" className="gap-1.5 text-xs" onClick={() => setAddingStream(true)}>
            <Plus className="h-3.5 w-3.5" />Add Stream
          </Button>
        </div>
      )}

      {addingStream && (
        <FundingStreamForm
          sourceId={source.id}
          sourceName={source.name}
          onClose={() => setAddingStream(false)}
        />
      )}
      {editing && (
        <FundingSourceForm source={source} onClose={() => setEditing(false)} />
      )}
    </div>
  );
}