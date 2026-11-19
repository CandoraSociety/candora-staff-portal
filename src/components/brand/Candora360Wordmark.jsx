import { useOrgSettings } from '@/lib/useOrgSettings';
import { cn } from '@/lib/utils';
import { APP_NAME } from '@/lib/brand';

/**
 * The Candora 360 lockup: the organization's existing logo mark plus the
 * app name, with the "360" in the bright blue highlight colour.
 * Built from the uploaded logo — no separate artwork to keep in sync.
 */
export default function Candora360Wordmark({
  size = 'md',
  tone = 'light',
  showName = true,
  className,
}) {
  const { logoUrl } = useOrgSettings();

  const mark = size === 'lg' ? 'w-16 h-16' : size === 'sm' ? 'w-9 h-9' : 'w-10 h-10';
  const text = size === 'lg' ? 'text-3xl' : size === 'sm' ? 'text-sm' : 'text-base';
  const base = tone === 'dark' ? 'text-sidebar-primary' : 'text-accent';

  return (
    <div className={cn('flex items-center gap-3', className)}>
      <img
        src={logoUrl}
        alt={APP_NAME}
        className={cn(mark, 'object-contain shrink-0 rounded-xl')}
      />
      {showName && (
        <span className={cn('font-display font-extrabold tracking-tight leading-none whitespace-nowrap', text)}>
          <span className={base}>Candora</span>{' '}
          <span className="text-highlight">360</span>
        </span>
      )}
    </div>
  );
}