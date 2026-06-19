import { Checkbox } from '@/components/ui/checkbox';

/**
 * Checkbox list for granting file access levels beyond universal/personal.
 * `value` = array of granted access level keys (e.g. ['manager', 'finance'])
 * `onChange(newArray)` called on toggle
 */
const FILE_ACCESS_OPTIONS = [
  { id: 'manager',   label: 'Manager Files',   description: 'Internal management documents' },
  { id: 'finance',   label: 'Finance Files',   description: 'Invoices, budgets, financial reports' },
  { id: 'corporate', label: 'Corporate Files', description: 'Executive-level documents' },
];

export default function FileAccessSelector({ value = [], onChange }) {
  const toggle = (id) => {
    if (value.includes(id)) {
      onChange(value.filter(v => v !== id));
    } else {
      onChange([...value, id]);
    }
  };

  return (
    <div className="space-y-2">
      <p className="text-xs text-muted-foreground mb-2">
        All employees automatically get <strong>Universal Files</strong> and <strong>My Files</strong> access. Grant additional access below.
      </p>
      <div className="grid grid-cols-1 gap-2">
        {FILE_ACCESS_OPTIONS.map(opt => (
          <label
            key={opt.id}
            className="flex items-center gap-3 p-2.5 rounded-lg border cursor-pointer hover:bg-muted/40 transition-colors"
            style={{
              borderColor: value.includes(opt.id) ? '#2b2de8' : undefined,
              background: value.includes(opt.id) ? '#f0f0fe' : undefined,
            }}
          >
            <Checkbox
              checked={value.includes(opt.id)}
              onCheckedChange={() => toggle(opt.id)}
            />
            <div>
              <p className="text-sm font-medium leading-tight">{opt.label}</p>
              <p className="text-xs text-muted-foreground">{opt.description}</p>
            </div>
          </label>
        ))}
      </div>
    </div>
  );
}