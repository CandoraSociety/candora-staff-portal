import React, { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Star } from 'lucide-react';

const LOGO = 'https://media.base44.com/images/public/6a249282cb496579542673b7/64f97b9c9_CandoraFoodServiceslogoyellowletters.png';
const AREA = 'cafe_candeur';
const AREA_TAG = 'cafe-candeur';

const money = (value) => `$${(Number(value) || 0).toFixed(2)}`;

export default function CafeMenuDisplay() {
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 30000);
    return () => clearInterval(timer);
  }, []);

  const { data: sections = [] } = useQuery({
    queryKey: ['digital-menu-sections'],
    queryFn: () => base44.entities.DigitalMenuSection.filter({ area: AREA }, { sort: 'display_order', limit: 100 }),
    refetchInterval: 45000,
  });

  const { data: allItems = [] } = useQuery({
    queryKey: ['menu-items'],
    queryFn: () => base44.entities.MenuItem.list(),
    refetchInterval: 45000,
  });

  const activeSections = sections.filter((s) => s.is_active !== false);
  const sectionIds = activeSections.map((s) => s.id);

  const items = allItems.filter((item) => {
    const inArea = item.area === AREA || (item.tags || []).includes(AREA_TAG) || sectionIds.includes(item.section_id);
    return inArea && item.is_available !== false && sectionIds.includes(item.section_id);
  });

  const itemsFor = (id) => items
    .filter((item) => item.section_id === id)
    .sort((a, b) => (a.display_order || 0) - (b.display_order || 0) || (a.name || '').localeCompare(b.name || ''));

  const boards = activeSections
    .map((section) => ({ ...section, items: itemsFor(section.id) }))
    .filter((section) => section.items.length > 0);

  return (
    <div className="min-h-screen bg-sidebar text-sidebar-foreground flex flex-col">
      <header className="flex items-center justify-between gap-6 px-10 py-7 border-b border-sidebar-border">
        <div className="flex items-center gap-5">
          <img src={LOGO} alt="Candora" className="h-14 w-auto object-contain" />
          <div>
            <div className="text-3xl font-display font-extrabold tracking-wide text-sidebar-primary">
              Cafe Candeur
            </div>
            <div className="text-sm uppercase tracking-[0.3em] text-sidebar-foreground/50">Today's menu</div>
          </div>
        </div>
        <div className="text-right">
          <div className="text-4xl font-bold tabular-nums">
            {now.toLocaleTimeString('en-CA', { hour: 'numeric', minute: '2-digit' })}
          </div>
          <div className="text-sm text-sidebar-foreground/50">
            {now.toLocaleDateString('en-CA', { weekday: 'long', month: 'long', day: 'numeric' })}
          </div>
        </div>
      </header>

      <main className="flex-1 px-10 py-10">
        {boards.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center gap-3">
            <p className="text-2xl font-semibold">The menu is being updated</p>
            <p className="text-sidebar-foreground/60">Please ask our team what's available today.</p>
          </div>
        ) : (
          <div className="grid gap-x-12 gap-y-10 md:grid-cols-2 xl:grid-cols-3">
            {boards.map((section) => (
              <section key={section.id} className="space-y-4">
                <div>
                  <h2 className="text-2xl font-display font-extrabold uppercase tracking-wide text-sidebar-primary">
                    {section.name}
                  </h2>
                  {section.description && (
                    <p className="text-sm text-sidebar-foreground/60 mt-0.5">{section.description}</p>
                  )}
                  <div className="h-px bg-sidebar-border mt-2" />
                </div>

                <ul className="space-y-4">
                  {section.items.map((item) => (
                    <li key={item.id} className={item.is_sold_out ? 'opacity-45' : ''}>
                      <div className="flex items-baseline gap-2">
                        <span className={`text-xl font-semibold ${item.is_sold_out ? 'line-through' : ''}`}>
                          {item.name}
                        </span>
                        {item.is_featured && <Star className="w-4 h-4 text-sidebar-primary fill-sidebar-primary shrink-0" />}
                        <span className="flex-1 border-b border-dotted border-sidebar-border/70 translate-y-[-4px]" />
                        <span className="text-xl font-bold tabular-nums text-sidebar-primary">{money(item.price)}</span>
                      </div>
                      {item.description && (
                        <p className="text-sm text-sidebar-foreground/60 mt-0.5 max-w-prose">{item.description}</p>
                      )}
                      <div className="flex items-center gap-2 mt-1">
                        {item.is_sold_out && (
                          <span className="text-[11px] uppercase tracking-wider text-rose-300">Sold out</span>
                        )}
                        {(item.tags || [])
                          .filter((tag) => !['cafe-candeur', 'auntie-bevs'].includes(tag))
                          .map((tag) => (
                            <span key={tag} className="text-[11px] uppercase tracking-wider text-sidebar-foreground/45">
                              {tag}
                            </span>
                          ))}
                      </div>
                    </li>
                  ))}
                </ul>
              </section>
            ))}
          </div>
        )}
      </main>

      <footer className="px-10 py-5 border-t border-sidebar-border flex items-center justify-between text-xs text-sidebar-foreground/45">
        <span>Prices include tax · Please tell our team about any allergies</span>
        <span>candora.ca</span>
      </footer>
    </div>
  );
}