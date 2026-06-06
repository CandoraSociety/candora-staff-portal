import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ExternalLink, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function QuickLinksWidget({ cards = [] }) {
  const topCards = cards.slice(0, 6);

  return (
    <Card className="shadow-sm border-border/50">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-heading font-semibold">Quick Access</CardTitle>
          <Link to="/portal" className="text-xs text-primary hover:underline flex items-center gap-1">
            View all <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {topCards.map(card => (
            <a
              key={card.id}
              href={card.url || '#'}
              target={card.is_external ? '_blank' : '_self'}
              rel={card.is_external ? 'noopener noreferrer' : undefined}
              className="flex items-center gap-2 p-3 rounded-xl bg-muted/50 hover:bg-muted transition-colors group"
            >
              <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                style={{ backgroundColor: (card.color || '#2a9d8f') + '15' }}>
                <span className="text-xs font-bold" style={{ color: card.color || '#2a9d8f' }}>
                  {card.name?.[0]?.toUpperCase()}
                </span>
              </div>
              <span className="text-sm font-medium text-foreground truncate">{card.name}</span>
              {card.is_external && <ExternalLink className="w-3 h-3 text-muted-foreground ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />}
            </a>
          ))}
          {topCards.length === 0 && (
            <p className="col-span-full text-sm text-muted-foreground text-center py-4">No tools available yet</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}