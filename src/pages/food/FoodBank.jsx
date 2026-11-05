import React from 'react';
import { ShoppingBasket, CalendarClock, Users, FileText } from 'lucide-react';
import FoodAreaHeader from '@/components/food/FoodAreaHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

// The Food Bank program has not been set up yet — this page is its home in the
// Food Services portal, ready for its distribution days, hampers and records.
export default function FoodBank() {
  return (
    <div>
      <FoodAreaHeader area="food-bank" />
      <div className="p-6 space-y-6">
        <div>
          <h2 className="text-lg font-bold">Food Bank</h2>
          <p className="text-sm text-muted-foreground">
            The food bank program has not been set up yet. Nothing is tracked here until it is.
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <ShoppingBasket className="w-4 h-4" /> What will live here
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 sm:grid-cols-3">
              {[
                { icon: CalendarClock, title: 'Distribution days', text: 'When hampers go out, and who is on the schedule for them.' },
                { icon: Users, title: 'Households served', text: 'Who received a hamper, how often, and the sizes served.' },
                { icon: FileText, title: 'Stock and donations', text: 'What came in from donations and what went out each week.' },
              ].map(({ icon: Icon, title, text }) => (
                <div key={title} className="rounded-lg border p-3">
                  <Icon className="w-4 h-4 text-muted-foreground mb-2" />
                  <div className="text-sm font-medium">{title}</div>
                  <div className="text-xs text-muted-foreground mt-1">{text}</div>
                </div>
              ))}
            </div>
            <p className="text-xs text-muted-foreground mt-4">
              Tell me which of these the food bank actually needs and this page becomes the real workspace for it.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}