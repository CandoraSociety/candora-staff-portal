export default function PageHeader({ title, description, actions }) {
  return (
    <div className="flex items-start justify-between mb-6">
      <div>
        <div className="flex items-center gap-2.5">
          <img
            src="https://media.base44.com/images/public/6a15e361478575d63a95c265/562a66657_Candoracirclelogo_noanniversary.png"
            alt=""
            className="w-8 h-8 object-contain shrink-0"
          />
          <h1 className="text-2xl font-display font-extrabold uppercase tracking-widest text-[hsl(45,60%,70%)]">{title}</h1>
        </div>
        {description && <p className="text-muted-foreground mt-1 ml-10">{description}</p>}
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  );
}