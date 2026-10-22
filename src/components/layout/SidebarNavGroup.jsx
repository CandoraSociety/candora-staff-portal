import { useLayoutEffect, useRef, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { useTrainingTour } from '@/components/training/TrainingTourProvider';

export default function SidebarNavGroup({ item, collapsed, active }) {
  const { pathname } = useLocation();
  const { revealedNavPath } = useTrainingTour();
  const row = useRef(null);
  const [hovered, setHovered] = useState(false);
  const [pos, setPos] = useState(null);
  const open = hovered || item.children.some(child => child.path === revealedNavPath);
  const Icon = item.icon;
  useLayoutEffect(() => {
    if (!open) return;
    const measure = () => {
      const rect = row.current.getBoundingClientRect();
      setPos({ top: rect.top, left: rect.right });
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(row.current);
    window.addEventListener('resize', measure);
    window.addEventListener('scroll', measure, true);
    return () => { observer.disconnect(); window.removeEventListener('resize', measure); window.removeEventListener('scroll', measure, true); };
  }, [open, collapsed]);
  return (
    <div onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}>
      <div ref={row} data-tour={item.tourId} aria-expanded={open} className={cn(
        'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200 cursor-pointer',
        collapsed && 'justify-center px-0',
        active ? 'bg-sidebar-primary text-sidebar-primary-foreground' : 'text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground'
      )}>
        <Icon className={cn('w-[18px] h-[18px] flex-shrink-0', active ? 'text-sidebar-primary-foreground' : 'text-sidebar-foreground/70')} />
        {!collapsed && <span>{item.label}</span>}
      </div>
      {open && pos && <div style={pos} className="fixed z-50 min-w-[220px] rounded-lg border border-sidebar-border bg-sidebar py-1.5 px-1.5 shadow-xl">
        {item.children.map(child => {
          const ChildIcon = child.icon;
          return <Link key={child.path} to={child.path} data-tour-path={child.path} onClick={() => setHovered(false)} className={cn(
            'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
            pathname.startsWith(child.path) ? 'bg-sidebar-primary text-sidebar-primary-foreground' : 'text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground'
          )}><ChildIcon className="w-4 h-4 flex-shrink-0" /><span className="whitespace-nowrap">{child.label}</span></Link>;
        })}
      </div>}
    </div>
  );
}