import { useOrgSettings } from '@/lib/useOrgSettings';

export default function PageHeader({ title, description, actions }) {
  const { logoUrl } = useOrgSettings();

  return (
    <div className="flex items-start justify-between mb-6">
      <div>
        <div className="flex items-center gap-2.5">
          <img
            src={logoUrl}
            alt=""
            className="w-8 h-8 object-contain shrink-0"
          />
          <h1 className="text-2xl font-display font-extrabold uppercase tracking-widest text-[hsl(45,60%,70%)]">{title}</h1>
        </div>
        <div className="flex items-center gap-2.5 mt-1.5 ml-10">
          <span className="h-[3px] w-9 rounded-full bg-highlight shrink-0" />
          {description && <p className="text-muted-foreground">{description}</p>}
        </div>
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  );
}