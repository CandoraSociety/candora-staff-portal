import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ExternalLink } from 'lucide-react';
import FundingSourceForm from './FundingSourceForm';

const PIPELINE_STAGES = [
  { key: 'prospect',              label: 'Prospect',           color: 'border-gray-300 bg-gray-50' },
  { key: 'researching',          label: 'Researching',        color: 'border-blue-300 bg-blue-50' },
  { key: 'qualified',            label: 'Qualified',          color: 'border-purple-300 bg-purple-50' },
  { key: 'outreach',             label: 'Outreach',           color: 'border-yellow-300 bg-yellow-50' },
  { key: 'active',               label: 'Active Funder',      color: 'border-green-300 bg-green-50' },
  { key: 'lapsed',               label: 'Lapsed',             color: 'border-orange-300 bg-orange-50' },
];

export default function FundingPipelineKanban() {
  const queryClient = useQueryClient();
  const [editingSource, setEditingSource] = useState(null);

  const { data: sources = [] } = useQuery({
    queryKey: ['fundingSources'],
    queryFn: () => base44.entities.FundingSource.list('name'),
  });

  const handleDrop = async (sourceId, newStatus) => {
    await base44.entities.FundingSource.update(sourceId, { relationship_status: newStatus });
    queryClient.invalidateQueries(['fundingSources']);
  };

  const handleDragStart = (e, sourceId) => {
    e.dataTransfer.setData('sourceId', sourceId);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDropOnColumn = async (e, stageKey) => {
    e.preventDefault();
    const sourceId = e.dataTransfer.getData('sourceId');
    if (sourceId) await handleDrop(sourceId, stageKey);
  };

  return (
    <div className="overflow-x-auto pb-4">
      <div className="flex gap-4 min-w-max">
        {PIPELINE_STAGES.map(stage => {
          const stageSources = sources.filter(s => s.relationship_status === stage.key);
          return (
            <div
              key={stage.key}
              className={`w-60 rounded-xl border-2 ${stage.color} flex flex-col`}
              onDragOver={handleDragOver}
              onDrop={e => handleDropOnColumn(e, stage.key)}
            >
              <div className="px-3 py-2 border-b border-current/10">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold">{stage.label}</span>
                  <span className="text-xs text-muted-foreground">{stageSources.length}</span>
                </div>
              </div>
              <div className="flex-1 p-2 space-y-2 min-h-[200px]">
                {stageSources.map(source => (
                  <div
                    key={source.id}
                    draggable
                    onDragStart={e => handleDragStart(e, source.id)}
                    className="bg-white rounded-lg border border-border p-2.5 cursor-grab active:cursor-grabbing shadow-sm hover:shadow-md transition-shadow"
                  >
                    <p className="text-xs font-medium leading-tight">{source.name}</p>
                    {source.contact_name && <p className="text-xs text-muted-foreground mt-0.5">{source.contact_name}</p>}
                    <div className="flex items-center gap-1 mt-1.5 flex-wrap">
                      {source.funder_type && (
                        <span className="text-xs bg-secondary text-secondary-foreground px-1 py-0.5 rounded capitalize">
                          {source.funder_type.replace(/_/g, ' ')}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1 mt-1.5">
                      {source.website && (
                        <a href={source.website} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()} className="text-primary">
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                      <button
                        className="text-xs text-muted-foreground hover:text-foreground ml-auto"
                        onClick={() => setEditingSource(source)}
                      >
                        Edit
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
      {editingSource && (
        <FundingSourceForm source={editingSource} onClose={() => setEditingSource(null)} />
      )}
    </div>
  );
}