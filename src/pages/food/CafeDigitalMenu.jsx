import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Monitor, Plus, Pencil, Trash2 } from 'lucide-react';
import FoodAreaHeader from '@/components/food/FoodAreaHeader';
import MenuSectionDialog from '@/components/food/menu/MenuSectionDialog';
import MenuItemDialog from '@/components/food/menu/MenuItemDialog';
import MenuSectionCard from '@/components/food/menu/MenuSectionCard';

const AREA = 'cafe_candeur';
const AREA_TAG = 'cafe-candeur';

export default function CafeDigitalMenu() {
  const qc = useQueryClient();
  const [sectionDialog, setSectionDialog] = useState(false);
  const [editingSection, setEditingSection] = useState(null);
  const [itemDialog, setItemDialog] = useState(false);
  const [editingItem, setEditingItem] = useState(null);

  const { data: sections = [], isLoading: loadingSections } = useQuery({
    queryKey: ['digital-menu-sections'],
    queryFn: async () => {
      const page = await base44.entities.DigitalMenuSection.filter(
        { area: AREA },
        { sort: 'display_order', limit: 100 }
      );
      return page.items || [];
    },
  });

  const { data: allItems = [], isLoading: loadingItems } = useQuery({
    queryKey: ['menu-items'],
    queryFn: () => base44.entities.MenuItem.list(),
  });

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ['digital-menu-sections'] });
    qc.invalidateQueries({ queryKey: ['menu-items'] });
  };

  const saveSection = useMutation({
    mutationFn: (data) => editingSection?.id
      ? base44.entities.DigitalMenuSection.update(editingSection.id, data)
      : base44.entities.DigitalMenuSection.create({
          ...data,
          area: AREA,
          display_order: sections.length,
        }),
    onSuccess: () => { invalidate(); setSectionDialog(false); },
  });

  const removeSection = useMutation({
    mutationFn: (id) => base44.entities.DigitalMenuSection.delete(id),
    onSuccess: invalidate,
  });

  const saveItem = useMutation({
    mutationFn: ({ id, data }) => id
      ? base44.entities.MenuItem.update(id, data)
      : base44.entities.MenuItem.create(data),
    onSuccess: () => { invalidate(); setItemDialog(false); },
  });

  const patchItem = useMutation({
    mutationFn: ({ id, data }) => base44.entities.MenuItem.update(id, data),
    onSuccess: invalidate,
  });

  const removeItem = useMutation({
    mutationFn: (id) => base44.entities.MenuItem.delete(id),
    onSuccess: invalidate,
  });

  const sectionIds = sections.map((s) => s.id);
  const cafeItems = allItems.filter((item) =>
    item.area === AREA || (item.tags || []).includes(AREA_TAG) || sectionIds.includes(item.section_id)
  );

  const itemsFor = (sectionId) =>
    cafeItems
      .filter((item) => item.section_id === sectionId)
      .sort((a, b) => (a.display_order || 0) - (b.display_order || 0) || (a.name || '').localeCompare(b.name || ''));

  const unassigned = cafeItems.filter((item) => !item.section_id || !sectionIds.includes(item.section_id));

  const openNewSection = () => { setEditingSection(null); setSectionDialog(true); };
  const openEditSection = (section) => { setEditingSection(section); setSectionDialog(true); };
  const openNewItem = (section) => {
    setEditingItem({ section_id: section?.id || '' });
    setItemDialog(true);
  };
  const openEditItem = (item) => { setEditingItem(item); setItemDialog(true); };

  const handleSaveItem = (form) => {
    const displayOrder = form.section_id
      ? cafeItems.filter((i) => i.section_id === form.section_id && i.id !== editingItem?.id).length
      : 0;
    const tags = [...new Set([...(form.tags || []), AREA_TAG])];
    saveItem.mutate({
      id: editingItem?.id,
      data: {
        ...form,
        tags,
        area: AREA,
        display_order: editingItem?.id && editingItem.section_id === form.section_id
          ? editingItem.display_order || 0
          : displayOrder,
      },
    });
  };

  const moveSection = (section, direction) => {
    const sorted = [...sections];
    const index = sorted.findIndex((s) => s.id === section.id);
    const swapWith = sorted[index + direction];
    if (!swapWith) return;
    patchOrder(section, index + direction);
    patchOrder(swapWith, index);
    function patchOrder(a, order) {
      base44.entities.DigitalMenuSection.update(a.id, { display_order: order }).then(invalidate);
    }
  };

  const moveItem = (item, direction) => {
    const list = itemsFor(item.section_id);
    const index = list.findIndex((i) => i.id === item.id);
    const neighbour = list[index + direction];
    if (!neighbour) return;
    base44.entities.MenuItem.update(item.id, { display_order: index + direction }).then(invalidate);
    base44.entities.MenuItem.update(neighbour.id, { display_order: index }).then(invalidate);
  };

  const toggleSoldOut = (item) => patchItem.mutate({ id: item.id, data: { is_sold_out: !item.is_sold_out } });
  const toggleAvailable = (item) => patchItem.mutate({ id: item.id, data: { is_available: !item.is_available } });

  const deleteItem = (item) => {
    if (window.confirm(`Remove "${item.name}" from the menu?`)) removeItem.mutate(item.id);
  };

  const isLoading = loadingSections || loadingItems;

  return (
    <div>
      <FoodAreaHeader area={AREA_TAG} />

      <div className="p-6 space-y-5 max-w-6xl">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-xl font-bold">Digital menu</h2>
            <p className="text-sm text-muted-foreground">
              Build the board that shows on the cafe screen — sections, items and today's sold-out marks.
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" asChild>
              <a href="/cafe-menu" target="_blank" rel="noopener noreferrer">
                <Monitor className="w-4 h-4 mr-2" /> Open cafe screen
              </a>
            </Button>
            <Button onClick={openNewSection}><Plus className="w-4 h-4 mr-2" /> Add section</Button>
          </div>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-16">
            <div className="w-8 h-8 border-4 border-border border-t-primary rounded-full animate-spin" />
          </div>
        ) : sections.length === 0 ? (
          <Card>
            <CardContent className="py-16 text-center space-y-3">
              <p className="font-medium">No sections yet</p>
              <p className="text-sm text-muted-foreground max-w-md mx-auto">
                Start with a heading like "Espresso Bar" or "Sandwiches", then add the items under it.
                The screen updates as soon as you save.
              </p>
              <Button onClick={openNewSection}><Plus className="w-4 h-4 mr-2" /> Add your first section</Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid lg:grid-cols-2 gap-4">
            {sections.map((section, index) => (
              <MenuSectionCard
                key={section.id}
                section={section}
                index={index}
                total={sections.length}
                items={itemsFor(section.id)}
                onEditSection={openEditSection}
                onDeleteSection={(s) => {
                  if (window.confirm(`Delete the "${s.name}" section? Items stay in your menu item list.`)) {
                    removeSection.mutate(s.id);
                  }
                }}
                onMoveSection={moveSection}
                onAddItem={openNewItem}
                onEditItem={openEditItem}
                onDeleteItem={deleteItem}
                onToggleSoldOut={toggleSoldOut}
                onToggleAvailable={toggleAvailable}
                onMoveItem={moveItem}
              />
            ))}
          </div>
        )}

        {unassigned.length > 0 && (
          <Card>
            <CardContent className="p-4 space-y-2">
              <div>
                <h3 className="font-semibold">Not on the board yet</h3>
                <p className="text-xs text-muted-foreground">
                  These cafe items aren't in a section, so they don't show on the screen.
                </p>
              </div>
              <div className="divide-y">
                {unassigned.map((item) => (
                  <div key={item.id} className="flex items-center justify-between gap-3 py-2">
                    <div className="min-w-0">
                      <div className="text-sm font-medium truncate">{item.name}</div>
                      {item.description && <p className="text-xs text-muted-foreground truncate">{item.description}</p>}
                    </div>
                    <div className="flex items-center gap-1">
                      <Button variant="ghost" size="sm" onClick={() => openEditItem(item)}>
                        <Pencil className="w-3.5 h-3.5 mr-1" /> Place
                      </Button>
                      <Button variant="ghost" size="icon" className="text-destructive" onClick={() => deleteItem(item)}>
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      <MenuSectionDialog
        open={sectionDialog}
        onOpenChange={setSectionDialog}
        section={editingSection}
        onSave={(data) => saveSection.mutate(data)}
      />

      <MenuItemDialog
        open={itemDialog}
        onOpenChange={setItemDialog}
        item={editingItem}
        sections={sections}
        onSave={handleSaveItem}
      />
    </div>
  );
}