import React from 'react';
import { Input } from '@/components/ui/input';
import { EVALUATION_FIELDS, EVALUATION_RATINGS, WOULD_HIRE_OPTIONS } from '@/lib/internalPlacements';

const SELECT_CLASS = 'w-full h-9 rounded-md border border-input bg-transparent px-2 text-sm capitalize';

export default function PlacementEvaluationForm({ values, onChange }) {
  const set = (key, value) => onChange({ [key]: value });

  return (
    <div className="space-y-3">
      <div className="grid gap-2 sm:grid-cols-2">
        {EVALUATION_FIELDS.map((field) => (
          <label key={field.key} className="text-xs">
            <span className="text-muted-foreground">{field.label}</span>
            <select
              value={values[field.key] || ''}
              onChange={(e) => set(field.key, e.target.value)}
              className={SELECT_CLASS}
            >
              <option value="">Not rated</option>
              {EVALUATION_RATINGS.map((r) => (
                <option key={r} value={r}>{r.replace(/_/g, ' ')}</option>
              ))}
            </select>
          </label>
        ))}
      </div>

      <label className="text-xs block">
        <span className="text-muted-foreground">Would we hire them?</span>
        <select
          value={values.evaluation_would_hire || ''}
          onChange={(e) => set('evaluation_would_hire', e.target.value)}
          className={SELECT_CLASS}
        >
          <option value="">Not decided</option>
          {WOULD_HIRE_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
      </label>

      <label className="text-xs block">
        <span className="text-muted-foreground">Strengths</span>
        <textarea
          value={values.evaluation_strengths || ''}
          onChange={(e) => set('evaluation_strengths', e.target.value)}
          className="w-full min-h-[56px] rounded-md border border-input px-2 py-1.5 text-sm bg-background"
        />
      </label>

      <label className="text-xs block">
        <span className="text-muted-foreground">Areas for growth</span>
        <textarea
          value={values.evaluation_areas_for_growth || ''}
          onChange={(e) => set('evaluation_areas_for_growth', e.target.value)}
          className="w-full min-h-[56px] rounded-md border border-input px-2 py-1.5 text-sm bg-background"
        />
      </label>

      <label className="text-xs block">
        <span className="text-muted-foreground">Overall comments</span>
        <textarea
          value={values.evaluation_overall_comments || ''}
          onChange={(e) => set('evaluation_overall_comments', e.target.value)}
          className="w-full min-h-[64px] rounded-md border border-input px-2 py-1.5 text-sm bg-background"
        />
      </label>

      <div className="flex items-center gap-3">
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={!!values.evaluation_completed}
            onChange={(e) => set('evaluation_completed', e.target.checked)}
            className="w-4 h-4"
          />
          Evaluation complete
        </label>
        <Input
          type="date"
          value={values.evaluation_date || ''}
          onChange={(e) => set('evaluation_date', e.target.value)}
          className="w-auto"
        />
      </div>
    </div>
  );
}