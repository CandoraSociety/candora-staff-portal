import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Users, Calendar, Heart, Plus, Trash2 } from 'lucide-react';
import FoodAreaHeader from '@/components/food/FoodAreaHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { format } from 'date-fns';

export default function CommunityLunch() {
  const qc = useQueryClient();
  const { data: allOrders = [] } = useQuery({ queryKey: ['food-orders'], queryFn: () => base44.entities.FoodOrder.list() });
  
  // Filter for community lunch orders (order_type: 'community' or tagged)
  const mealServices = allOrders.filter(o => o.order_type === 'community' || o.tags?.includes('community-lunch'));
  
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({ event_date: new Date().toISOString().split('T')[0], guest_count: '', notes: '' });

  const createMealService = useMutation({
    mutationFn: (data) => base44.entities.FoodOrder.create({
      ...data,
      order_type: 'community',
      status: 'completed',
      customer_name: 'Community Lunch Program',
      total: 0,
      subtotal: 0,
      tax: 0,
      tags: ['community-lunch'],
    }),
    onSuccess: () => {
      qc.invalidateQueries(['food-orders']);
      setDialogOpen(false);
      setForm({ event_date: new Date().toISOString().split('T')[0], guest_count: '', notes: '' });
    },
  });

  const deleteMealService = useMutation({
    mutationFn: (id) => base44.entities.FoodOrder.delete(id),
    onSuccess: () => qc.invalidateQueries(['food-orders']),
  });

  const handleSave = () => {
    if (!form.guest_count) return;
    createMealService.mutate({
      event_date: form.event_date,
      guest_count: parseInt(form.guest_count),
      notes: form.notes,
      items: [{ name: 'Community Meal Service', quantity: parseInt(form.guest_count), price: 0 }],
    });
  };

  const totalGuests = mealServices.reduce((sum, s) => sum + (s.guest_count || 0), 0);
  const totalServices = mealServices.length;
  const avgGuests = totalServices > 0 ? Math.round(totalGuests / totalServices) : 0;

  // Sort by date descending
  const sorted = [...mealServices].sort((a, b) => new Date(b.event_date || b.created_date) - new Date(a.event_date || a.created_date));

  return (
    <div>
      <FoodAreaHeader area="community-lunch" />
      <div className="p-6 space-y-6">
        {/* Impact Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-orange-50 flex items-center justify-center flex-shrink-0">
                <Users className="w-5 h-5 text-orange-600" />
              </div>
              <div>
                <div className="text-xs text-muted-foreground">Total Meals Served</div>
                <div className="text-xl font-bold">{totalGuests}</div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center flex-shrink-0">
                <Calendar className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <div className="text-xs text-muted-foreground">Service Days</div>
                <div className="text-xl font-bold">{totalServices}</div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-pink-50 flex items-center justify-center flex-shrink-0">
                <Heart className="w-5 h-5 text-pink-600" />
              </div>
              <div>
                <div className="text-xs text-muted-foreground">Avg Guests/Day</div>
                <div className="text-xl font-bold">{avgGuests}</div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Log Service Button */}
        <div className="flex justify-end">
          <Button onClick={() => setDialogOpen(true)} className="gap-2">
            <Plus className="w-4 h-4" />
            Log Today's Service
          </Button>
        </div>

        {/* Service History */}
        <div>
          <h3 className="text-lg font-semibold mb-3">Service History</h3>
          {sorted.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground">
              <Heart className="w-10 h-10 mx-auto mb-3 opacity-30" />
              <p>No meal services logged yet</p>
              <p className="text-sm mt-1">Click "Log Today's Service" to record your first community meal</p>
            </div>
          ) : (
            <div className="space-y-3">
              {sorted.map(service => (
                <Card key={service.id}>
                  <CardContent className="p-4 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-orange-50 flex items-center justify-center flex-shrink-0">
                        <Users className="w-5 h-5 text-orange-600" />
                      </div>
                      <div>
                        <div className="font-medium">
                          {service.event_date ? format(new Date(service.event_date), 'EEEE, MMMM d, yyyy') : format(new Date(service.created_date), 'MMM d, yyyy')}
                        </div>
                        {service.notes && <div className="text-xs text-muted-foreground mt-0.5">{service.notes}</div>}
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <div className="text-xs text-muted-foreground">Guests Served</div>
                        <div className="font-bold text-lg">{service.guest_count || 1}</div>
                      </div>
                      <Button 
                        size="icon" 
                        variant="ghost" 
                        className="h-8 w-8 text-muted-foreground hover:text-destructive"
                        onClick={() => deleteMealService.mutate(service.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Log Community Meal Service</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div>
              <label className="text-sm font-medium mb-1 block">Date</label>
              <Input 
                type="date" 
                value={form.event_date} 
                onChange={e => setForm(f => ({ ...f, event_date: e.target.value }))} 
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Number of Guests Served</label>
              <Input 
                type="number" 
                placeholder="e.g., 25" 
                value={form.guest_count} 
                onChange={e => setForm(f => ({ ...f, guest_count: e.target.value }))} 
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Notes (Optional)</label>
              <Input 
                placeholder="Special notes about today's service..." 
                value={form.notes} 
                onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} 
              />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSave}>Log Service</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}