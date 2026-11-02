import { useRef, useState } from 'react';
import { X } from 'lucide-react';
import { JLInput } from '@/components/joblab/ui';
import { suggestSkills } from '@/lib/joblab/skills';

// Skills editor: removable badges plus a fuzzy typeahead over a curated
// catalogue. Enter adds the typed skill (or the top suggestion when it starts
// with what was typed); Escape clears the box.
export default function SkillInput({ skills = [], onChange, placeholder = 'Type a skill and press Enter' }) {
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const blurTimer = useRef(null);

  const suggestions = suggestSkills(query, skills);

  const add = (skill) => {
    const value = String(skill || '').trim();
    if (!value) return;
    if (!skills.includes(value)) onChange([...skills, value]);
    setQuery('');
    setOpen(false);
  };

  const remove = (skill) => onChange(skills.filter((s) => s !== skill));

  const handleKeyDown = (event) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      const top = suggestions[0];
      if (top && top.toLowerCase().startsWith(query.trim().toLowerCase())) add(top);
      else add(query);
    }
    if (event.key === 'Escape') {
      setQuery('');
      setOpen(false);
    }
  };

  return (
    <div>
      {skills.length > 0 && (
        <div className="mb-2 flex flex-wrap gap-1.5">
          {skills.map((skill) => (
            <span
              key={skill}
              className="inline-flex items-center gap-1 rounded-full bg-jl-primary/10 px-2.5 py-1 text-xs font-medium text-jl-primary"
            >
              {skill}
              <button type="button" onClick={() => remove(skill)} aria-label={`Remove ${skill}`}>
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}
        </div>
      )}

      <div className="relative">
        <JLInput
          value={query}
          placeholder={placeholder}
          onChange={(e) => { setQuery(e.target.value); setOpen(true); }}
          onFocus={() => setOpen(true)}
          onBlur={() => { blurTimer.current = setTimeout(() => setOpen(false), 150); }}
          onKeyDown={handleKeyDown}
        />
        {open && suggestions.length > 0 && (
          <div className="absolute z-20 mt-1 w-full overflow-hidden rounded-lg border border-jl-border bg-white shadow-lg">
            {suggestions.map((skill) => (
              <button
                key={skill}
                type="button"
                onMouseDown={(e) => {
                  e.preventDefault();
                  clearTimeout(blurTimer.current);
                  add(skill);
                }}
                className="block w-full px-3 py-2 text-left text-sm text-jl-fg hover:bg-jl-secondary"
              >
                {skill}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}