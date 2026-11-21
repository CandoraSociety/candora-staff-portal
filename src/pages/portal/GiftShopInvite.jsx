import React, { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle2, Gift, Loader2 } from 'lucide-react';
import GiftShopInviteForm from '@/components/gift-shop-invite/GiftShopInviteForm';
import GiftShopInviteClosed from '@/components/gift-shop-invite/GiftShopInviteClosed';

// Public Kids Gift Shop pre-registration page — reached only through the private
// link each invited family was sent. Standalone: no login, no portal navigation.
export default function GiftShopInvite() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [done, setDone] = useState(null);

  useEffect(() => {
    const token = new URLSearchParams(window.location.search).get('token') || '';
    if (!token) {
      setData({ state: 'invalid' });
      setLoading(false);
      return;
    }
    base44.functions
      .invoke('getGiftShopInvite', { token })
      .then(res => setData(res.data))
      .catch(() => setData({ state: 'invalid' }))
      .finally(() => setLoading(false));
  }, []);

  const state = data?.state || 'invalid';

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-sidebar">
        <div className="max-w-2xl mx-auto px-4 py-6 flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-sidebar-primary flex items-center justify-center shrink-0">
            <Gift className="h-5 w-5 text-sidebar-primary-foreground" />
          </div>
          <div>
            <h1 className="text-sidebar-foreground font-display font-bold text-lg leading-tight">Kids Gift Shop</h1>
            <p className="text-sidebar-foreground/60 text-sm leading-tight">Candora · Winter Wonderland</p>
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-8">
        {loading ? (
          <div className="py-16 text-center text-muted-foreground flex flex-col items-center gap-3">
            <Loader2 className="h-6 w-6 animate-spin" />
            <p className="text-sm">Opening your invitation…</p>
          </div>
        ) : done ? (
          <Card>
            <CardContent className="py-12 text-center space-y-4">
              <div className="h-14 w-14 rounded-full bg-success/10 text-success flex items-center justify-center mx-auto">
                <CheckCircle2 className="h-7 w-7" />
              </div>
              <div>
                <h2 className="text-xl font-display font-bold">You’re registered!</h2>
                <p className="text-sm text-muted-foreground mt-2 max-w-md mx-auto">
                  {done.children?.length > 1
                    ? `${done.children.slice(0, -1).join(', ')} and ${done.children[done.children.length - 1]} are booked for ${done.time_label}.`
                    : `${done.children?.[0] || 'Your child'} is booked for ${done.time_label}.`}{' '}
                  Bring this confirmation with you on the day — a name tag will be ready at the desk.
                </p>
              </div>
            </CardContent>
          </Card>
        ) : state !== 'open' ? (
          <GiftShopInviteClosed state={state} />
        ) : (
          <div className="space-y-5">
            <div>
              <p className="text-xs font-medium text-primary uppercase tracking-wide">Private pre-registration</p>
              <h2 className="text-2xl font-display font-bold mt-1">Book a shopping time</h2>
              <p className="text-sm text-muted-foreground mt-1">
                Each child picks out a gift for someone special. Choose a time and we will have everything ready.
              </p>
            </div>
            <GiftShopInviteForm invite={data.invite} slots={data.slots} onDone={setDone} />
          </div>
        )}
      </main>
    </div>
  );
}