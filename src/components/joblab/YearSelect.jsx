import { JLSelect } from '@/components/joblab/ui';
import { YEAR_OPTIONS } from '@/lib/joblab/skills';

// Year picker used across the profile and resume editors. "Present" is offered
// first so a current role or study reads naturally.
export default function YearSelect({ value, onChange, placeholder = 'Year', allowPresent = true, className }) {
  return (
    <JLSelect value={value || ''} onChange={(e) => onChange(e.target.value)} className={className}>
      <option value="">{placeholder}</option>
      {allowPresent && <option value="Present">Present</option>}
      {YEAR_OPTIONS.map((year) => (
        <option key={year} value={year}>{year}</option>
      ))}
    </JLSelect>
  );
}