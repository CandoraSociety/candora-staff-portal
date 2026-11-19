import { useOrgSettings } from '@/lib/useOrgSettings';
import { cn } from '@/lib/utils';
import { APP_NAME } from '@/lib/brand';

/**
 * The Candora 360 lockup. The artwork already carries the name, so this only
 * renders the logo image — no separate text to keep in sync.
 */
export default function Candora360Wordmark({ size = 'md', className }) {
  const { logoUrl } = useOrgSettings();

  const height = size === 'lg' ? 'h-24' : size === 'sm' ? 'h-10' : 'h-12';

  return (
    <div className={cn('flex items-center', className)}>
      <img
        src={logoUrl}
        alt={APP_NAME}
        className={cn(height, 'w-auto object-contain shrink-0')}
      />
    </div>
  );
}