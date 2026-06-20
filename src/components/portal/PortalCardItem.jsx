import React from 'react';
import { ExternalLink, ArrowRight } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CATEGORY_MAP } from '@/lib/constants';

export default function PortalCardItem({ card }) {
  const cat = CATEGORY_MAP[card.category] || { label: card.category, color: '#6b7280' };

  return (
    <a
      href={card.url || '#'}
      target={card.is_external ? '_blank' : '_self'}
      rel={card.is_external ? 'noopener noreferrer' : undefined}
      className="block group"
    >
      <Card className="h-full shadow-sm border-border/50 hover:shadow-md hover:border-primary/20 transition-all duration-300 overflow-hidden">
        <CardContent className="p-5">
          <div className="flex items-start justify-between mb-4">
            <div
              className="w-11 h-11 rounded-xl flex items-center justify-center overflow-hidden"
              style={{ backgroundColor: card.logo_url ? 'transparent' : (card.color || cat.color) + '15' }}
            >
              {card.logo_url
                ? <img src={card.logo_url} alt={card.name} className="w-full h-full object-contain" />
                : <span className="text-base font-display font-bold" style={{ color: card.color || cat.color }}>{card.name?.[0]?.toUpperCase()}</span>
              }
            </div>
            <div className="opacity-0 group-hover:opacity-100 transition-opacity">
              {card.is_external
                ? <ExternalLink className="w-4 h-4 text-muted-foreground" />
                : <ArrowRight className="w-4 h-4 text-muted-foreground" />
              }
            </div>
          </div>
          <h3 className="font-heading font-semibold text-foreground text-sm mb-1">{card.name}</h3>
          <p className="text-xs text-muted-foreground line-clamp-2 mb-3">{card.description}</p>
          <Badge variant="secondary" className="text-[10px]" style={{ 
            backgroundColor: cat.color + '10', 
            color: cat.color,
            borderColor: cat.color + '25'
          }}>
            {cat.label}
          </Badge>
        </CardContent>
      </Card>
    </a>
  );
}