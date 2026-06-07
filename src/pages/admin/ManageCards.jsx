import React, { useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Plus, Pencil, ToggleLeft, ToggleRight, Trash2, AppWindow } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { CATEGORY_MAP, ROLES } from '@/lib/constants';
import CardFormDialog from '@/components/admin/CardFormDialog';

export default function ManageCards() {
  const { access } = useOutletContext();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCard, setEditingCard] = useState(null);
  const queryClient = useQueryClient();

  const { data: cards = [], isLoading } = useQuery({
    queryKey: ['portalCards'],
    queryFn: () => base44.entities.PortalCard.list(),
  });

  const toggleMutation = useMutation({
    mutationFn: ({ id, is_enabled }) => base44.entities.PortalCard.update(id, { is_enabled }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['portalCards'] });
      toast.success('Card updated');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.PortalCard.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['portalCards'] });
      toast.success('Card deleted');
    },
  });

  if (!access.isAdmin) return <p className="text-muted-foreground">Access denied</p>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-display font-bold flex items-center gap-2">
            <AppWindow className="w-5 h-5 text-primary" />
            Manage Portal Cards
          </h1>
          <p className="text-sm text-muted-foreground mt-1">Add, edit, and manage tools displayed in the portal</p>
        </div>
        <Button onClick={() => { setEditingCard(null); setDialogOpen(true); }} className="gap-2">
          <Plus className="w-4 h-4" /> Add Card
        </Button>
      </div>

      <div className="grid gap-3">
        {cards.map(card => {
          const cat = CATEGORY_MAP[card.category] || { label: card.category, color: '#6b7280' };
          return (
            <Card key={card.id} className={`shadow-sm ${!card.is_enabled ? 'opacity-50' : ''}`}>
              <CardContent className="p-4 flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor: (card.color || cat.color) + '15' }}>
                  <span className="font-display font-bold text-sm" style={{ color: card.color || cat.color }}>
                    {card.name?.[0]?.toUpperCase()}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm text-foreground">{card.name}</p>
                  <p className="text-xs text-muted-foreground truncate">{card.description}</p>
                </div>
                <Badge variant="secondary" className="text-[10px] hidden sm:inline-flex">{cat.label}</Badge>
                {(!card.url || card.url === '#') && (
                  <Badge className="text-[10px] bg-amber-100 text-amber-700 border-amber-300 hidden sm:inline-flex">Placeholder</Badge>
                )}
                <div className="flex items-center gap-1">
                  <Button variant="ghost" size="icon" className="h-8 w-8"
                    onClick={() => toggleMutation.mutate({ id: card.id, is_enabled: !card.is_enabled })}>
                    {card.is_enabled
                      ? <ToggleRight className="w-4 h-4 text-primary" />
                      : <ToggleLeft className="w-4 h-4 text-muted-foreground" />
                    }
                  </Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8"
                    onClick={() => { setEditingCard(card); setDialogOpen(true); }}>
                    <Pencil className="w-4 h-4 text-muted-foreground" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8"
                    onClick={() => deleteMutation.mutate(card.id)}>
                    <Trash2 className="w-4 h-4 text-destructive" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
        {cards.length === 0 && !isLoading && (
          <div className="text-center py-12 text-muted-foreground">
            <p>No portal cards yet. Click "Add Card" to create one.</p>
          </div>
        )}
      </div>

      <CardFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        editingCard={editingCard}
      />
    </div>
  );
}