import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ChevronUp, ChevronDown, Pencil, Trash2, Plus, Star, EyeOff } from 'lucide-react';

const DAYPARTS = { all_day: 'All day', breakfast: 'Breakfast', lunch: 'Lunch', afternoon: 'Afternoon' };
const money = (v) => `$${(Number(v) || 0).toFixed(2)}`;

function MenuItemRow({ item, onEdit, onDelete, onToggleSoldOut, onToggleAvailable, onMove, isFirst, isLast }) {
  return (
    <div className={`flex items-start gap-3 px-3 py-2.5 rounded-lg hover:bg-muted/60 ${item.is_sold_out ? 'opacity-60' : ''}`}>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className={`text-sm font-medium ${item.is_sold_out ? 'line-through' : ''}`}>{item.name}</span>
          {item.is_featured && <Star className="w-3.5 h-3.5 text-primary fill-primary" />}
          {!item.is_available && (
            <button onClick={() => onToggleAvailable(item)} title="Show on the menu again">
              <Badge className="bg-muted text-muted-foreground text-[10px] gap-1"><EyeOff className="w-2.5 h-2.5" /> Hidden</Badge>
            </button>
          )}
          {item.is_sold_out && <Badge className="bg-rose-100 text-rose-700 text-[10px]">Sold out</Badge>}
        </div>
        {item.description && <p className="text-xs text-muted-foreground line-clamp-2">{item.description}</p>}
        {item.tags?.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-1">
            {item.tags.filter((t) => !['cafe-candeur', 'auntie-bevs'].includes(t)).map((tag) => (
              <span key={tag} className="text-[10px] rounded-full bg-secondary px-2 py-0.5">{tag}</span>
            ))}
          </div>
        )}
      </div>

      <span className="text-sm font-semibold whitespace-nowrap">{money(item.price)}</span>

      <div className="flex items-center gap-0.5">
        <button className="p-1 rounded hover:bg-background disabled:opacity-30" disabled={isFirst}
          onClick={() => onMove(item, -1)} title="Move up"><ChevronUp className="w-3.5 h-3.5" /></button>
        <button className="p-1 rounded hover:bg-background disabled:opacity-30" disabled={isLast}
          onClick={() => onMove(item, 1)} title="Move down"><ChevronDown className="w-3.5 h-3.5" /></button>
        <button className="p-1 rounded hover:bg-background" onClick={() => onToggleSoldOut(item)}
          title="Sold out" >
          <span className={`block w-3.5 h-3.5 rounded-full border ${item.is_sold_out ? 'bg-rose-500 border-rose-500' : 'border-muted-foreground/40'}`} />
        </button>
        <button className="p-1 rounded hover:bg-background" onClick={() => onEdit(item)} title="Edit"><Pencil className="w-3.5 h-3.5" /></button>
        <button className="p-1 rounded hover:bg-background text-destructive" onClick={() => onDelete(item)} title="Delete"><Trash2 className="w-3.5 h-3.5" /></button>
      </div>
    </div>
  );
}

export default function MenuSectionCard({
  section, items, index, total,
  onEditSection, onDeleteSection, onMoveSection, onAddItem, onEditItem,
  onDeleteItem, onToggleSoldOut, onToggleAvailable, onMoveItem,
}) {
  return (
    <Card>
      <CardContent className="p-4 space-y-2">
        <div className="flex items-start justify-between gap-2">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-semibold">{section.name}</h3>
              <Badge className="bg-secondary text-secondary-foreground text-[10px]">{DAYPARTS[section.daypart] || 'All day'}</Badge>
              {!section.is_active && <Badge className="bg-amber-100 text-amber-800 text-[10px]">Off the screen</Badge>}
            </div>
            {section.description && <p className="text-xs text-muted-foreground">{section.description}</p>}
          </div>
          <div className="flex items-center gap-0.5">
            <button className="p-1 rounded hover:bg-muted disabled:opacity-30" disabled={index === 0}
              onClick={() => onMoveSection(section, -1)} title="Move section up"><ChevronUp className="w-4 h-4" /></button>
            <button className="p-1 rounded hover:bg-muted disabled:opacity-30" disabled={index === total - 1}
              onClick={() => onMoveSection(section, 1)} title="Move section down"><ChevronDown className="w-4 h-4" /></button>
            <button className="p-1 rounded hover:bg-muted" onClick={() => onEditSection(section)} title="Edit section"><Pencil className="w-4 h-4" /></button>
            <button className="p-1 rounded hover:bg-muted text-destructive" onClick={() => onDeleteSection(section)} title="Delete section"><Trash2 className="w-4 h-4" /></button>
          </div>
        </div>

        <div className="divide-y">
          {items.length === 0 && (
            <p className="text-xs text-muted-foreground py-2">No items in this section yet.</p>
          )}
          {items.map((item, i) => (
            <MenuItemRow
              key={item.id}
              item={item}
              isFirst={i === 0}
              isLast={i === items.length - 1}
              onEdit={onEditItem}
              onDelete={onDeleteItem}
              onToggleSoldOut={onToggleSoldOut}
              onToggleAvailable={onToggleAvailable}
              onMove={onMoveItem}
            />
          ))}
        </div>

        <Button variant="outline" size="sm" onClick={() => onAddItem(section)}>
          <Plus className="w-3.5 h-3.5 mr-1" /> Add item to {section.name}
        </Button>
      </CardContent>
    </Card>
  );
}