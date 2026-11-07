import React, { useCallback, useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';
import { Button } from '@/components/ui/button';
import { Loader2, Plus, Tablet, ExternalLink } from 'lucide-react';
import KioskStationCard from '@/components/reception/kiosk/KioskStationCard';
import KioskStationDialog from '@/components/reception/kiosk/KioskStationDialog';
import KioskSendPromptDialog from '@/components/reception/kiosk/KioskSendPromptDialog';
import KioskClientVerificationDialog from '@/components/reception/kiosk/KioskClientVerificationDialog';
import KioskReceiptDialog from '@/components/reception/kiosk/KioskReceiptDialog';
import KioskRecentCompletions from '@/components/reception/kiosk/KioskRecentCompletions';
import DonationDialog from '@/components/donors/DonationDialog';

// Reception's remote control for the customer tablet: send a donation ask, an
// order or a registration form, and watch what comes back.
export default function ReceptionCustomerKiosk() {
  const { user } = useAuth();
  const [stations, setStations] = useState([]);
  const [prompts, setPrompts] = useState([]);
  const [donors, setDonors] = useState([]);
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);

  const [stationDialogOpen, setStationDialogOpen] = useState(false);
  const [editingStation, setEditingStation] = useState(null);
  const [sendTo, setSendTo] = useState(null);
  const [sendKind, setSendKind] = useState('donation');
  const [gift, setGift] = useState(null);
  const [verifying, setVerifying] = useState(null);
  const [receipt, setReceipt] = useState(null);

  const loadStations = useCallback(async () => {
    const rows = await base44.entities.KioskStation.list('-created_date', 50);
    setStations(rows || []);
    setLoading(false);
  }, []);

  const loadPrompts = useCallback(async () => {
    const rows = await base44.entities.KioskPrompt.list('-created_date', 60);
    setPrompts(rows || []);
  }, []);

  useEffect(() => {
    loadStations();
    loadPrompts();
    base44.entities.Donor.list('-created_date', 300).then((rows) => setDonors(rows || [])).catch(() => setDonors([]));
    base44.entities.DonationCampaign.list('-created_date', 100).then((rows) => setCampaigns(rows || [])).catch(() => setCampaigns([]));
  }, [loadStations, loadPrompts]);

  // Live status: anything the tablet does shows up here without a refresh.
  useEffect(() => base44.entities.KioskPrompt.subscribe(() => loadPrompts()), [loadPrompts]);

  // Keep the connected indicator fresh even when nothing is happening.
  useEffect(() => {
    const interval = setInterval(loadStations, 30000);
    return () => clearInterval(interval);
  }, [loadStations]);

  const latestPromptFor = (stationId) =>
    prompts.find((prompt) => prompt.station_id === stationId && prompt.status !== 'dismissed') || null;

  const sendPrompt = (station, kind) => {
    setSendTo(station);
    setSendKind(kind);
  };

  const clearPrompt = async (prompt) => {
    await base44.entities.KioskPrompt.update(prompt.id, { status: 'dismissed' });
    loadPrompts();
  };

  const recordGift = (prompt) => {
    const donor = donors.find(
      (row) => prompt.response_email && (row.email || '').toLowerCase() === prompt.response_email.toLowerCase(),
    );
    setGift({
      donation: {
        amount: prompt.response_amount,
        donation_date: new Date().toISOString().slice(0, 10),
        donation_type: 'one_time',
        payment_method: 'cash',
        notes: [prompt.campaign_name, 'Gift collected at the customer tablet', prompt.response_notes].filter(Boolean).join(' — '),
      },
      donorId: donor?.id || '',
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-display font-bold tracking-tight flex items-center gap-2">
            <Tablet className="h-6 w-6 text-primary" /> Customer Kiosk
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Put a tablet on the counter and control it from here — donations, orders and registrations appear on it right away.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" asChild>
            <a href="/kiosk" target="_blank" rel="noreferrer">
              <ExternalLink className="h-4 w-4" /> Open tablet screen
            </a>
          </Button>
          <Button onClick={() => { setEditingStation(null); setStationDialogOpen(true); }}>
            <Plus className="h-4 w-4" /> Add tablet
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="py-16 flex justify-center"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
      ) : stations.length === 0 ? (
        <div className="rounded-xl border bg-card p-10 text-center space-y-3">
          <Tablet className="h-10 w-10 mx-auto text-muted-foreground" />
          <h2 className="font-semibold text-lg">No customer tablets yet</h2>
          <p className="text-sm text-muted-foreground max-w-md mx-auto">
            Add the tablet that sits on the counter. On the tablet itself, open <span className="font-mono">/kiosk</span> once — it stays on the welcome screen and shows whatever you send it.
          </p>
          <Button onClick={() => { setEditingStation(null); setStationDialogOpen(true); }}>
            <Plus className="h-4 w-4" /> Add the first tablet
          </Button>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {stations.map((station) => (
            <KioskStationCard
              key={station.id}
              station={station}
              prompt={latestPromptFor(station.id)}
              onSend={sendPrompt}
              onEdit={(row) => { setEditingStation(row); setStationDialogOpen(true); }}
              onClear={clearPrompt}
              onRecordGift={recordGift}
              onVerifyClient={setVerifying}
              onReceipt={setReceipt}
            />
          ))}
        </div>
      )}

      <KioskRecentCompletions prompts={prompts} onReceipt={setReceipt} />

      <KioskStationDialog
        open={stationDialogOpen}
        onOpenChange={setStationDialogOpen}
        station={editingStation}
        onSaved={loadStations}
      />

      {sendTo && (
        <KioskSendPromptDialog
          open={!!sendTo}
          onOpenChange={(open) => { if (!open) setSendTo(null); }}
          station={sendTo}
          initialKind={sendKind}
          sentByName={user?.full_name}
          onSent={loadPrompts}
        />
      )}

      {receipt && (
        <KioskReceiptDialog
          open={!!receipt}
          onOpenChange={(open) => { if (!open) setReceipt(null); }}
          prompt={receipt}
        />
      )}

      <KioskClientVerificationDialog
        open={!!verifying}
        prompt={verifying}
        onOpenChange={(open) => { if (!open) setVerifying(null); }}
        onSaved={loadPrompts}
      />

      <DonationDialog
        open={!!gift}
        onOpenChange={(open) => { if (!open) { setGift(null); loadPrompts(); } }}
        donation={gift?.donation}
        defaultDonorId={gift?.donorId}
        donors={donors}
        campaigns={campaigns}
      />
    </div>
  );
}