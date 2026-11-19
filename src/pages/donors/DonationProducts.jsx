import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ExternalLink, Loader2, Package, Pencil, Plus, RefreshCw, Trash2 } from 'lucide-react';
import DonationProductDialog from '@/components/donors/DonationProductDialog';
import { tierAmountLabel } from '@/lib/donorConstants';

// Every giving option across all campaigns, in one place — the donor portal's
// catalogue of donation products. Each product is created in Stripe automatically.
export default function DonationProducts() {
  const qc = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [syncing, setSyncing] = useState(false);
  const [message, setMessage] = useState('');

  const { data: campaigns = [], isLoading } = useQuery({
    queryKey: ['donation-campaigns'],
    queryFn: () => base44.entities.DonationCampaign.list('-created_date'),
  });

  const products = useMemo(
    () => campaigns.flatMap((campaign) =>
      (campaign.donation_products || []).map((option) => ({
        ...option,
        campaign_id: campaign.id,
        campaign_name: campaign.name,
      }))
    ),
    [campaigns]
  );

  const refresh = () => qc.invalidateQueries({ queryKey: ['donation-campaigns'] });

  const syncCampaign = async (campaignId) => {
    const response = await base44.functions.invoke('syncCampaignProductsToStripe', { campaign_id: campaignId });
    if (response.data?.error) throw new Error(response.data.error);
  };

  const saveProduct = async ({ campaign_id, option }) => {
    const campaign = campaigns.find((c) => c.id === campaign_id);
    if (!campaign) return;
    const list = [...(campaign.donation_products || [])];
    const index = list.findIndex((p) => p.id === option.id);
    if (index >= 0) list[index] = { ...list[index], ...option };
    else list.push({ ...option, display_order: list.length });

    await base44.entities.DonationCampaign.update(campaign.id, { donation_products: list });
    refresh();
    try {
      await syncCampaign(campaign.id);
      setMessage('Saved and synced with Stripe.');
    } catch (error) {
      setMessage(error.response?.data?.error || error.message || 'Saved, but the Stripe sync failed.');
    }
    refresh();
  };

  const remove = async (product) => {
    if (!window.confirm(`Remove "${product.name}" from ${product.campaign_name}?`)) return;
    const campaign = campaigns.find((c) => c.id === product.campaign_id);
    if (!campaign) return;
    const list = (campaign.donation_products || []).filter((p) => p.id !== product.id);
    await base44.entities.DonationCampaign.update(campaign.id, { donation_products: list });
    refresh();
  };

  const syncAll = async () => {
    setSyncing(true);
    setMessage('');
    const targets = campaigns.filter((c) => (c.donation_products || []).length > 0);
    try {
      for (const campaign of targets) await syncCampaign(campaign.id);
      setMessage(`Synced ${targets.length} campaign${targets.length === 1 ? '' : 's'} with Stripe.`);
    } catch (error) {
      setMessage(error.response?.data?.error || error.message || 'The Stripe sync failed.');
    }
    refresh();
    setSyncing(false);
  };

  // An option's Stripe state covers every price it offers — its variations when
  // it has them, otherwise its single price.
  const stripeState = (product) => {
    const variations = (product.variations || []).filter((variation) => Number(variation.amount) > 0);
    const prices = variations.length
      ? variations.map((variation) => ({
          priceId: variation.stripe_price_id,
          priceAmount: variation.stripe_price_amount,
          amount: variation.amount,
        }))
      : [{
          priceId: product.stripe_price_id,
          priceAmount: product.stripe_price_amount,
          amount: product.amount,
        }];

    if (prices.every((price) => !price.priceId)) {
      return { label: 'Not synced', className: 'bg-muted text-muted-foreground' };
    }
    if (prices.some((price) =>
      !price.priceId || Math.round(Number(price.priceAmount) * 100) !== Math.round(Number(price.amount) * 100)
    )) {
      return { label: 'Price changed', className: 'bg-amber-100 text-amber-800' };
    }
    return { label: 'In Stripe', className: 'bg-emerald-100 text-emerald-700' };
  };

  return (
    <div className="p-6 space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold font-display">Donation products</h1>
          <p className="text-sm text-muted-foreground">
            The giving options supporters pick from on campaign pages. Each one is created in Stripe automatically.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={syncAll} disabled={syncing}>
            {syncing ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <RefreshCw className="w-4 h-4 mr-2" />}
            {syncing ? 'Syncing…' : 'Sync with Stripe'}
          </Button>
          <Button variant="outline" asChild>
            <a href="/donate" target="_blank" rel="noopener noreferrer">
              <ExternalLink className="w-4 h-4 mr-2" /> Donation page
            </a>
          </Button>
          <Button onClick={() => { setEditing(null); setDialogOpen(true); }}>
            <Plus className="w-4 h-4 mr-2" /> New product
          </Button>
        </div>
      </div>

      {message && <p className="text-sm text-muted-foreground">{message}</p>}

      {isLoading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      ) : products.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center space-y-3">
            <Package className="w-8 h-8 mx-auto text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              No donation products yet. Add one here, or from a campaign's Giving options tab.
            </p>
            <Button onClick={() => { setEditing(null); setDialogOpen(true); }}>
              <Plus className="w-4 h-4 mr-2" /> New product
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product</TableHead>
                  <TableHead>Campaign</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead>Monthly</TableHead>
                  <TableHead>On page</TableHead>
                  <TableHead>Stripe</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {products.map((product) => {
                  const stripe = stripeState(product);
                  return (
                    <TableRow key={`${product.campaign_id}-${product.id}`}>
                      <TableCell>
                        <div className="font-medium">{product.name}</div>
                        {product.description && (
                          <div className="text-xs text-muted-foreground line-clamp-2">{product.description}</div>
                        )}
                      </TableCell>
                      <TableCell className="text-sm">
                        <Link to={`/donors/campaigns/${product.campaign_id}`} className="hover:underline">
                          {product.campaign_name}
                        </Link>
                      </TableCell>
                      <TableCell className="text-right text-sm font-medium">
                        {tierAmountLabel(product)}
                        {product.allow_custom_price && (
                          <span className="block text-[11px] font-normal text-muted-foreground">Donor chooses</span>
                        )}
                      </TableCell>
                      <TableCell className="text-sm">{product.allow_monthly !== false ? 'Yes' : 'No'}</TableCell>
                      <TableCell className="text-sm">{product.is_active !== false ? 'Shown' : 'Hidden'}</TableCell>
                      <TableCell>
                        <Badge className={stripe.className}>{stripe.label}</Badge>
                      </TableCell>
                      <TableCell className="text-right whitespace-nowrap">
                        <Button variant="ghost" size="sm" onClick={() => { setEditing(product); setDialogOpen(true); }}>
                          <Pencil className="w-3.5 h-3.5 mr-1" /> Edit
                        </Button>
                        <Button variant="ghost" size="sm" className="text-destructive" onClick={() => remove(product)}>
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </Card>
      )}

      <DonationProductDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        campaigns={campaigns}
        product={editing}
        onSave={saveProduct}
      />
    </div>
  );
}