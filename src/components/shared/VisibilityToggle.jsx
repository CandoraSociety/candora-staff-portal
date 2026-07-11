import { useState } from 'react';
import { EyeOff, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { base44 } from '@/api/base44Client';

export default function VisibilityToggle({ item, entityType, onUpdate, isAdmin }) {
  const [toggling, setToggling] = useState(false);

  if (!isAdmin) return null;

  const handleToggle = async () => {
    setToggling(true);
    try {
      await base44.entities[entityType].update(item.id, { is_hidden: !item.is_hidden });
      onUpdate?.();
    } finally {
      setToggling(false);
    }
  };

  return (
    <Button
      variant={item.is_hidden ? 'outline' : 'ghost'}
      size="sm"
      disabled={toggling}
      onClick={handleToggle}
      className="text-xs"
    >
      {item.is_hidden ? (
        <><EyeOff className="h-3.5 w-3.5 mr-1.5" />Hidden</>
      ) : (
        <><Eye className="h-3.5 w-3.5 mr-1.5" />Visible</>
      )}
    </Button>
  );
}