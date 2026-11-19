import { useOrgSettings } from '@/lib/useOrgSettings';
import { cn } from '@/lib/utils';
import { APP_NAME, STAFF_LOGO_URL } from '@/lib/brand';

/**
 * The Candora 360 lockup. The artwork already carries the name, so this only
 * renders the logo image — no separate text to keep in sync.
 */
export default function Candora360Wordmark({ size = 'md', className, staff = false }) {
  const { logoUrl } = useOrgSettings();
  const src = staff ? STAFF_LOGO_URL : logoUrl;

  const height = size === 'lg' ? 'h-24' : size === 'sm' ? 'h-10' : 'h-12';

  return (
    <div className={cn('flex items-center', className)}>
      <img
        src={src}
        alt={APP_NAME}
        className={cn(height, 'w-auto object-contain shrink-0')}
      />
    </div>
  );
}