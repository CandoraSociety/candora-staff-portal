import React, { useState } from 'react';
import { useOutletContext, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { AppWindow, Search, BookOpen } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import PortalCardItem from '@/components/portal/PortalCardItem';
import { CARD_CATEGORIES } from '@/lib/constants';

export default function Portal() {
  const { user, access } = useOutletContext();
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('all');

  const { data: cards = [], isLoading } = useQuery({
    queryKey: ['portalCards'],
    queryFn: () => base44.entities.PortalCard.list(),
  });

  const accessibleCards = cards
    .filter(card => access.canAccessCard(card))
    .filter(card => {
      if (search) {
        const q = search.toLowerCase();
        return card.name?.toLowerCase().includes(q) || card.description?.toLowerCase().includes(q);
      }
      return true;
    })
    .filter(card => category === 'all' || card.category === category)
    .sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));

  const categoriesWithCards = ['all', ...new Set(accessibleCards.map(c => c.category))];

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-3 mb-1">
          <AppWindow className="w-5 h-5 text-primary" />
          <h1 className="text-xl font-display font-bold text-foreground">Portal</h1>
        </div>
        <p className="text-sm text-muted-foreground">Access your tools, modules, and platforms</p>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search tools..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Tabs value={category} onValueChange={setCategory}>
          <TabsList className="bg-muted flex-wrap h-auto">
            <TabsTrigger value="all" className="text-xs">All</TabsTrigger>
            {CARD_CATEGORIES.filter(c => categoriesWithCards.includes(c.value)).map(cat => (
              <TabsTrigger key={cat.value} value={cat.value} className="text-xs">{cat.label}</TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {Array(8).fill(0).map((_, i) => (
            <div key={i} className="h-40 rounded-xl bg-muted animate-pulse" />
          ))}
        </div>
      ) : accessibleCards.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {accessibleCards.map(card => (
            <PortalCardItem key={card.id} card={card} />
          ))}
        </div>
      ) : (
        <div className="text-center py-16">
          <AppWindow className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
          <p className="text-muted-foreground">No tools available</p>
          <p className="text-xs text-muted-foreground/60 mt-1">
            {search ? 'Try a different search term' : 'Tools will appear here as they are added'}
          </p>
        </div>
      )}

      {/* Built-in portals */}
      <div>
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">Built-in Portals</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          <Link to="/grants">
            <div className="group p-5 rounded-xl border-2 border-border hover:border-primary/50 bg-card hover:shadow-md transition-all cursor-pointer h-full">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0 group-hover:bg-primary/20 transition-colors">
                  <BookOpen className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors text-sm">Grant / Proposal Manager</h3>
                  <p className="text-xs text-muted-foreground mt-1">Track funding applications, proposals, and funder reporting.</p>
                </div>
              </div>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}