import React from 'react';
import { Coffee, CalendarDays, Heart, Soup, ShoppingBasket, GraduationCap, Users, UtensilsCrossed } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

const OPERATIONS = [
  {
    name: 'Café Candeur',
    icon: Coffee,
    text: 'Our café in the Resource Centre, serving fresh meals, coffee and baked goods to the community and to staff.',
  },
  {
    name: 'Catering',
    icon: CalendarDays,
    text: 'Catering for meetings, events and celebrations across the city, prepared and delivered by our kitchen team.',
  },
  {
    name: "Auntie Bev's",
    icon: Heart,
    text: 'Our takeout counter, named for a woman whose whole life was built around feeding people with care.',
  },
];

const SUPPORTS = [
  {
    name: 'Community Lunch',
    icon: Soup,
    text: 'A free home-cooked meal every Thursday at the Abbottsfield Recreation Centre. Everyone is welcome, no registration needed.',
  },
  {
    name: 'Food Bank',
    icon: ShoppingBasket,
    text: 'Food hampers and everyday essentials for neighbours who are stretching a tight budget.',
  },
  {
    name: 'Training & placements',
    icon: GraduationCap,
    text: 'Paid, hands-on kitchen and service placements that give Pathways participants real work experience and references.',
  },
  {
    name: 'Free community programs',
    icon: Users,
    text: 'Family, adult learning and outreach programs in Beverly, Abbottsfield and Rundle, offered at no cost to participants.',
  },
];

export default function FoodAbout() {
  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8">
      <header className="space-y-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-primary/15 flex items-center justify-center flex-shrink-0">
            <UtensilsCrossed className="w-5 h-5 text-foreground" />
          </div>
          <div>
            <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground font-semibold">
              Candora Food Services
            </p>
            <h1 className="font-display text-3xl font-bold text-foreground">A social enterprise with a purpose</h1>
          </div>
        </div>
        <p className="text-sm text-muted-foreground leading-relaxed max-w-3xl">
          Candora Food Services is the social enterprise of the Candora Society. Our café, catering kitchen and takeout
          counter earn their own revenue — and every dollar of it goes back into the free programs and supports that
          neighbours rely on. Good food, made by people learning the trade, for a community that shows up for each other.
        </p>
      </header>

      <section className="space-y-3">
        <h2 className="font-display text-xl font-bold text-foreground">How it works</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {OPERATIONS.map((op) => {
            const Icon = op.icon;
            return (
              <Card key={op.name} className="border-border/70">
                <CardContent className="p-5 space-y-2">
                  <div className="w-9 h-9 rounded-lg bg-primary/15 flex items-center justify-center">
                    <Icon className="w-4 h-4 text-foreground" />
                  </div>
                  <h3 className="font-semibold text-foreground">{op.name}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{op.text}</p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="font-display text-xl font-bold text-foreground">What it supports</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {SUPPORTS.map((item) => {
            const Icon = item.icon;
            return (
              <div key={item.name} className="flex items-start gap-3 rounded-xl border border-border/70 bg-card p-4">
                <div className="w-9 h-9 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
                  <Icon className="w-4 h-4 text-foreground" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-foreground">{item.name}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed mt-1">{item.text}</p>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <section className="rounded-xl bg-accent text-accent-foreground p-6 space-y-2">
        <h2 className="font-display text-lg font-bold">Every order does two things</h2>
        <p className="text-sm leading-relaxed opacity-90">
          It feeds the person in front of us, and it pays for the next meal, class or hamper for someone who needs it.
          That is what a social enterprise is for — and it is why our kitchen team, volunteers and participants take
          such pride in the work.
        </p>
      </section>
    </div>
  );
}